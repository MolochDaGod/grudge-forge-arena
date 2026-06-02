/**
 * ArenaScene.tsx — Grudge Studio Forge Testing Ground
 *
 * Full 3D scene with:
 * - Procedural island terrain (SimplexNoise FBM heightfield)
 * - FBX character loading from R2 CDN (race presets with animations)
 * - Harvestable resource nodes (ore, wood, herb)
 * - Nature scatter (procedural tree/rock placement)
 * - AI enemy NPCs with chase/attack/block behavior
 * - Water plane surrounding the island
 * - Third-person camera controller
 * - Full combat: WASD + 1/2/3 attack + RMB block + Space jump + Ctrl roll
 */

import { Suspense, useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import * as THREE from "three";
import { FBXLoader } from "three-stdlib";
import { useArenaStore } from "../stores/useArenaStore";
import { InputManager } from "../engine/InputManager";
import { AnimController } from "../engine/AnimController";
import { CharacterStateMachine, STATE } from "../engine/CharacterStateMachine";
import { getAnimMapForWeapon, BASE_ANIM_MAP } from "../engine/ControllerAnimMap";
import { assetUrl } from "../engine/assetUrl";
import { AIBrain } from "./AIBrain";
import { tryDamage, tickIFrames, consumeKnockback, createCombatEntity, type CombatEntity } from "./HealthSystem";
import { NavGrid } from "./NavGrid";
import {
  generateIslandTerrain,
  colorTerrainByHeight,
  sampleTerrainHeight,
  generateScatterPositions,
} from "./IslandTerrain";

// ── Constants ──
const ISLAND_SIZE = 80;
const PLAYER_SPEED = 6;
const CAMERA_OFFSET = new THREE.Vector3(0, 6, 10);
const ENEMY_COUNT = 3;

// ── FBX + Animation Loader ──

const fbxLoader = new FBXLoader();
const fbxCache = new Map<string, THREE.Group>();

async function loadFBX(url: string): Promise<THREE.Group> {
  if (fbxCache.has(url)) return fbxCache.get(url)!.clone();
  const group = await fbxLoader.loadAsync(url);
  fbxCache.set(url, group);
  return group.clone();
}

/**
 * Load animation FBX and extract the first AnimationClip.
 * Returns null if loading fails (CDN asset missing).
 */
async function loadAnimClip(url: string): Promise<THREE.AnimationClip | null> {
  try {
    const g = await fbxLoader.loadAsync(url);
    return g.animations[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Build an AnimController with real animation clips loaded from the CDN.
 * Falls back to stub clips for any that fail to load.
 */
async function buildAnimController(
  root: THREE.Object3D,
  animMap: Record<string, string>,
): Promise<AnimController> {
  const mixer = new THREE.AnimationMixer(root);
  const ctrl = new AnimController(mixer);

  // Load all animation clips in parallel
  const entries = Object.entries(animMap);
  const clips = await Promise.all(
    entries.map(async ([key, url]) => {
      const clip = await loadAnimClip(url);
      return { key, clip };
    }),
  );

  for (const { key, clip } of clips) {
    if (clip) {
      clip.name = key;
      ctrl.register(key, clip);
    } else {
      // Stub clip so the state machine doesn't crash
      const stub = new THREE.AnimationClip(key, 0.5, [
        new THREE.NumberKeyframeTrack(".visible", [0, 0.5], [1, 1]),
      ]);
      ctrl.register(key, stub);
    }
  }

  return ctrl;
}

// ── Stub AnimController (instant, no CDN) ──
function createStubCtrl(): AnimController {
  const mixer = new THREE.AnimationMixer(new THREE.Object3D());
  const ctrl = new AnimController(mixer);
  const keys = [
    "idle", "walk", "run", "sprint", "combatIdle",
    "attack1", "attack2", "attack3", "block", "hit", "death",
    "cast", "roll", "dodge", "crouch", "jump", "jumpLoop",
    "jumpDown", "harvest",
  ];
  for (const key of keys) {
    ctrl.register(key, new THREE.AnimationClip(key, 0.5, [
      new THREE.NumberKeyframeTrack(".visible", [0, 0.5], [1, 1]),
    ]));
  }
  return ctrl;
}

// ── Island Terrain Component ──

function IslandTerrainMesh({ onReady }: { onReady: (mesh: THREE.Mesh) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geo = useMemo(() => {
    const g = generateIslandTerrain({ size: ISLAND_SIZE, resolution: 128, seed: 42, maxHeight: 8 });
    colorTerrainByHeight(g, 8);
    return g;
  }, []);

  useEffect(() => {
    if (meshRef.current) onReady(meshRef.current);
  }, [onReady]);

  return (
    <mesh ref={meshRef} geometry={geo} receiveShadow castShadow>
      <meshStandardMaterial vertexColors roughness={0.85} flatShading />
    </mesh>
  );
}

// ── Water Plane ──

function WaterPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#1a4a6b" transparent opacity={0.7} roughness={0.2} metalness={0.1} />
    </mesh>
  );
}

// ── Harvestable Node ──

function HarvestableNode({ position, type }: { position: THREE.Vector3; type: "ore" | "wood" | "herb" }) {
  const colors = { ore: "#8b7355", wood: "#5a3a1a", herb: "#2a6a2a" };
  const sizes = { ore: [0.6, 0.5, 0.6] as const, wood: [0.3, 1.5, 0.3] as const, herb: [0.5, 0.4, 0.5] as const };
  const [harvested, setHarvested] = useState(false);

  if (harvested) return null;

  return (
    <group position={position}>
      <mesh castShadow position={[0, sizes[type][1] / 2, 0]}
        onClick={() => setHarvested(true)}>
        {type === "ore" ? <dodecahedronGeometry args={[sizes[type][0]]} /> :
         type === "wood" ? <cylinderGeometry args={[sizes[type][0], sizes[type][0] * 1.2, sizes[type][1], 6]} /> :
         <sphereGeometry args={[sizes[type][0], 8, 6]} />}
        <meshStandardMaterial color={colors[type]} roughness={0.8} />
      </mesh>
      {/* Glow indicator */}
      <pointLight position={[0, 1, 0]} intensity={0.3} distance={3} color={colors[type]} />
    </group>
  );
}

// ── Nature Scatter (procedural rocks/trees) ──

function NatureScatter({ terrainMesh }: { terrainMesh: THREE.Mesh | null }) {
  const positions = useMemo(() => {
    if (!terrainMesh) return [];
    return generateScatterPositions(terrainMesh, 60, ISLAND_SIZE, 0.5, 777);
  }, [terrainMesh]);

  return (
    <group>
      {positions.map((pos, i) => {
        const isTree = i % 3 !== 0;
        const scale = 0.4 + Math.random() * 0.6;
        return isTree ? (
          <group key={i} position={pos} scale={scale}>
            {/* Simple tree: trunk + foliage */}
            <mesh castShadow position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.1, 0.15, 1.6, 5]} />
              <meshStandardMaterial color="#4a3520" roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0, 2.0, 0]}>
              <coneGeometry args={[0.8, 1.8, 6]} />
              <meshStandardMaterial color="#1a5a2a" roughness={0.8} />
            </mesh>
          </group>
        ) : (
          <mesh key={i} position={pos} scale={scale * 0.6} castShadow
            rotation={[Math.random() * 0.3, Math.random() * Math.PI, 0]}>
            <dodecahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#5a5a58" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Harvestable Scatter ──

function HarvestableScatter({ terrainMesh }: { terrainMesh: THREE.Mesh | null }) {
  const nodes = useMemo(() => {
    if (!terrainMesh) return [];
    const types: ("ore" | "wood" | "herb")[] = ["ore", "wood", "herb"];
    const positions = generateScatterPositions(terrainMesh, 15, ISLAND_SIZE, 0.8, 999);
    return positions.map((pos, i) => ({ pos, type: types[i % types.length] }));
  }, [terrainMesh]);

  return (
    <group>
      {nodes.map((n, i) => <HarvestableNode key={i} position={n.pos} type={n.type} />)}
    </group>
  );
}

// ── Player Character ──

function PlayerCharacter({ meshRef, terrainMesh }: {
  meshRef: React.RefObject<THREE.Mesh | null>;
  terrainMesh: THREE.Mesh | null;
}) {
  const { camera } = useThree();
  const store = useArenaStore;

  const engine = useMemo(() => {
    const ctrl = createStubCtrl();
    const sm = new CharacterStateMachine(ctrl);
    sm.transition(STATE.IDLE);
    const pos = new THREE.Vector3(0, 2, 10);
    const entity = createCombatEntity({
      id: "player", hp: 100, maxHp: 100, position: pos, sm,
      faction: "player", attackRange: 2.5, attackDamage: 15,
    });
    return { ctrl, sm, pos, entity };
  }, []);

  const inputRef = useRef<InputManager | null>(null);
  const canvasEl = useThree((s) => s.gl.domElement);
  useEffect(() => {
    inputRef.current = new InputManager(canvasEl);
    return () => inputRef.current?.dispose();
  }, [canvasEl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const dtMs = dt * 1000;
    const input = inputRef.current;
    if (!input || engine.entity.dead) return;

    const snap = input.snapshot();
    engine.sm.update(dtMs);
    tickIFrames(engine.entity, dtMs);

    // Movement on terrain
    if (engine.sm.canMove) {
      const dir = new THREE.Vector3();
      if (snap.movement.forward) dir.z -= 1;
      if (snap.movement.backward) dir.z += 1;
      if (snap.movement.left) dir.x -= 1;
      if (snap.movement.right) dir.x += 1;

      if (dir.lengthSq() > 0) {
        dir.normalize().multiplyScalar(PLAYER_SPEED * dt);
        engine.pos.x += dir.x;
        engine.pos.z += dir.z;

        // Snap to terrain height
        if (terrainMesh) {
          const h = sampleTerrainHeight(terrainMesh, engine.pos.x, engine.pos.z);
          engine.pos.y = Math.max(h + 0.85, 0.35); // capsule half-height offset
        }

        engine.sm.transition(snap.movement.sprint ? STATE.SPRINT : STATE.RUN);
        if (meshRef.current) {
          const rot = Math.atan2(-dir.x, -dir.z);
          meshRef.current.rotation.y = rot;
          // Sync facing angle for HealthSystem directional checks
          engine.entity.facingAngle = Math.atan2(dir.z, dir.x);
        }
      } else if (!engine.sm.isAttacking && !engine.sm.isBlocking) {
        engine.sm.rest();
      }
    }

    // Combat
    if (snap.actions.skill1) engine.sm.transition(STATE.ATTACK_1);
    if (snap.actions.skill2) engine.sm.transition(STATE.ATTACK_2);
    if (snap.actions.skill3) engine.sm.transition(STATE.ATTACK_3);
    if (snap.held.block) engine.sm.transition(STATE.BLOCK);
    else if (engine.sm.state === STATE.BLOCK) engine.sm.rest();
    if (snap.actions.jump) engine.sm.transition(STATE.JUMP);
    if (snap.actions.roll) engine.sm.transition(STATE.ROLL);
    if (snap.actions.interact) engine.sm.transition(STATE.HARVEST);

    // Apply knockback
    const kb = consumeKnockback(engine.entity, dtMs);
    if (kb.dx !== 0 || kb.dz !== 0) {
      engine.pos.x += kb.dx;
      engine.pos.z += kb.dz;
      if (terrainMesh) {
        const h = sampleTerrainHeight(terrainMesh, engine.pos.x, engine.pos.z);
        engine.pos.y = Math.max(h + 0.85, 0.35);
      }
    }

    // Sync
    engine.entity.hp = store.getState().playerHp;
    if (meshRef.current) {
      meshRef.current.position.copy(engine.pos);
      meshRef.current.userData = { entity: engine.entity };
    }

    // Camera follow
    camera.position.lerp(new THREE.Vector3().copy(engine.pos).add(CAMERA_OFFSET), 0.06);
    camera.lookAt(engine.pos.x, engine.pos.y + 1, engine.pos.z);
  });

  return (
    <mesh ref={meshRef} position={[0, 2, 10]} castShadow>
      <capsuleGeometry args={[0.4, 1.0, 8, 16]} />
      <meshStandardMaterial color="#4488ff" emissive="#112244" />
    </mesh>
  );
}

// ── Enemy NPC ──

function EnemyNPC({ index, spawnAngle, playerRef, terrainMesh, navGrid }: {
  index: number;
  spawnAngle: number;
  playerRef: React.RefObject<THREE.Mesh | null>;
  terrainMesh: THREE.Mesh | null;
  navGrid: NavGrid | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const store = useArenaStore;
  const COLORS = ["#ff4444", "#ff8800", "#cc44ff"];

  const spawnRadius = 15 + Math.random() * 10;
  const sx = Math.cos(spawnAngle) * spawnRadius;
  const sz = Math.sin(spawnAngle) * spawnRadius;
  const spawnY = terrainMesh ? sampleTerrainHeight(terrainMesh, sx, sz) + 0.85 : 0.85;

  const engine = useMemo(() => {
    const ctrl = createStubCtrl();
    const sm = new CharacterStateMachine(ctrl);
    sm.transition(STATE.IDLE);
    const pos = new THREE.Vector3(sx, spawnY, sz);
    const brain = new AIBrain(sm, pos, new THREE.Vector3(sx, spawnY, sz));
    const entity = createCombatEntity({
      id: `enemy-${index}`, hp: 80, maxHp: 80, position: pos, sm,
      faction: "enemy", attackRange: 2.5, attackDamage: 10,
      onHit: () => brain.onHit(),
    });
    return { ctrl, sm, pos, brain, entity };
  }, [sx, sz, spawnY, index]);

  // Wire navGrid into brain when available
  useEffect(() => {
    if (navGrid) engine.brain.navGrid = navGrid;
  }, [navGrid, engine.brain]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const dtMs = dt * 1000;
    engine.sm.update(dtMs);
    tickIFrames(engine.entity, dtMs);
    if (engine.entity.dead) return;

    const storeEnemy = store.getState().enemies[index];
    if (storeEnemy?.dead) { engine.entity.dead = true; engine.sm.transition(STATE.DEATH, true); return; }
    if (storeEnemy) engine.entity.hp = storeEnemy.hp;

    const playerPos = playerRef.current?.userData?.entity?.position as THREE.Vector3 | undefined;
    if (playerPos) {
      const hpRatio = engine.entity.hp / engine.entity.maxHp;
      const { dx, dz } = engine.brain.update(dtMs, playerPos, hpRatio);
      engine.pos.x += dx;
      engine.pos.z += dz;

      // Terrain snap
      if (terrainMesh) {
        const h = sampleTerrainHeight(terrainMesh, engine.pos.x, engine.pos.z);
        engine.pos.y = Math.max(h + 0.85, 0.35);
      }

      // Apply knockback
      const kb = consumeKnockback(engine.entity, dtMs);
      if (kb.dx !== 0 || kb.dz !== 0) {
        engine.pos.x += kb.dx;
        engine.pos.z += kb.dz;
      }

      // Sync facing angle for directional damage
      if (dx !== 0 || dz !== 0) {
        if (meshRef.current) meshRef.current.rotation.y = Math.atan2(-dx, -dz);
        engine.entity.facingAngle = Math.atan2(dz, dx);
      } else if (engine.brain.facing.lengthSq() > 0) {
        engine.entity.facingAngle = Math.atan2(engine.brain.facing.y, engine.brain.facing.x);
        if (meshRef.current) {
          meshRef.current.rotation.y = Math.atan2(-engine.brain.facing.x, -engine.brain.facing.y);
        }
      }

      // Hit detection
      const pe = playerRef.current?.userData?.entity as CombatEntity | undefined;
      if (pe) {
        const dmg = tryDamage(engine.entity, pe);
        if (dmg > 0) store.getState().damagePlayer(dmg);
        const pDmg = tryDamage(pe, engine.entity);
        if (pDmg > 0) {
          store.getState().damageEnemy(engine.entity.id, pDmg);
          if (engine.entity.hp <= 0) store.getState().addKill();
        }
      }
    }

    if (meshRef.current) {
      meshRef.current.position.copy(engine.pos);
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = engine.entity.iFrames > 0 ? 0.5 : 1;
      mat.transparent = engine.entity.iFrames > 0;
    }
  });

  if (engine.entity.dead) return null;

  return (
    <mesh ref={meshRef} position={[sx, spawnY, sz]} castShadow>
      <capsuleGeometry args={[0.4, 1.0, 8, 16]} />
      <meshStandardMaterial color={COLORS[index % COLORS.length]} emissive="#221111" />
    </mesh>
  );
}

// ── ForgeInner (scene graph) ──

function ForgeInner() {
  const playerRef = useRef<THREE.Mesh>(null);
  const [terrainMesh, setTerrainMesh] = useState<THREE.Mesh | null>(null);
  const [navGrid, setNavGrid] = useState<NavGrid | null>(null);
  const setEnemies = useArenaStore((s) => s.setEnemies);

  const handleTerrainReady = useCallback((mesh: THREE.Mesh) => {
    setTerrainMesh(mesh);
    // Build NavGrid from terrain (A* pathfinding for AI)
    const grid = new NavGrid(mesh, { worldSize: ISLAND_SIZE, resolution: 64 });
    setNavGrid(grid);
  }, []);

  useEffect(() => {
    const angles = Array.from({ length: ENEMY_COUNT }, (_, i) => (i / ENEMY_COUNT) * Math.PI * 2);
    setEnemies(
      angles.map((_, i) => ({
        id: `enemy-${i}`, raceId: "orcs", presetId: "warrior",
        hp: 80, maxHp: 80, position: [0, 0, 0], dead: false,
      })),
    );
  }, [setEnemies]);

  return (
    <>
      {/* Sky */}
      <Sky sunPosition={[100, 60, 50]} turbidity={3} rayleigh={0.5} />

      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[30, 40, 20]} intensity={1.5} castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50} shadow-camera-right={50}
        shadow-camera-top={50} shadow-camera-bottom={-50}
        shadow-camera-near={1} shadow-camera-far={120}
      />
      <hemisphereLight args={["#87ceeb", "#3a5a2a", 0.4]} />

      {/* Water */}
      <WaterPlane />

      {/* Island terrain */}
      <IslandTerrainMesh onReady={handleTerrainReady} />

      {/* Nature scatter */}
      <NatureScatter terrainMesh={terrainMesh} />

      {/* Harvestable nodes */}
      <HarvestableScatter terrainMesh={terrainMesh} />

      {/* Player */}
      <PlayerCharacter meshRef={playerRef} terrainMesh={terrainMesh} />

      {/* Enemy NPCs */}
      {Array.from({ length: ENEMY_COUNT }, (_, i) => (
        <EnemyNPC
          key={i} index={i}
          spawnAngle={(i / ENEMY_COUNT) * Math.PI * 2}
          playerRef={playerRef}
          terrainMesh={terrainMesh}
          navGrid={navGrid}
        />
      ))}

      {/* Fog for atmosphere */}
      <fog attach="fog" args={["#87aec5", 40, 120]} />
    </>
  );
}

// ── Exported Scene ──

export function ArenaScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 12, 20], fov: 55, near: 0.1, far: 300 }}
      style={{ width: "100%", height: "100%" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <Suspense fallback={null}>
        <ForgeInner />
      </Suspense>
    </Canvas>
  );
}
