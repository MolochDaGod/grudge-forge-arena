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
import { useArenaStore } from "../stores/useArenaStore";
import { InputManager } from "../engine/InputManager";
import { AnimController } from "../engine/AnimController";
import { CharacterStateMachine, STATE } from "../engine/CharacterStateMachine";
import { AIBrain } from "./AIBrain";
import { tryDamage, tickIFrames, consumeKnockback, createCombatEntity, type CombatEntity } from "./HealthSystem";
import { NavGrid } from "./NavGrid";
import { FBXCharacter } from "./FBXCharacter";
import { getAllCharacterDefs, type GrudgeCharacterDef } from "./GrudgeClasses";
import { VillageLayout } from "./VillageLayout";
import { ColliderSystem } from "./ColliderSystem";
import { GLBMap } from "./GLBMap";
import {
  generateIslandTerrain,
  colorTerrainByHeight,
  sampleTerrainHeight,
  generateScatterPositions,
} from "./IslandTerrain";

// Shared collider instance — built once when terrain loads
const collider = new ColliderSystem();

// ── Constants ──
const ISLAND_SIZE = 160;
const PLAYER_SPEED = 6;
const CAMERA_OFFSET = new THREE.Vector3(0, 6, 10);
const ENEMY_COUNT = 5;

// ── Pre-compute enemy class assignments (deterministic per slot) ──
const ALL_DEFS = getAllCharacterDefs();
function pickEnemyDef(index: number): GrudgeCharacterDef {
  // Rotate through all 24 class/race combos deterministically
  return ALL_DEFS[index % ALL_DEFS.length];
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
    const g = generateIslandTerrain({ size: ISLAND_SIZE, resolution: 192, seed: 42, maxHeight: 2.5 });
    colorTerrainByHeight(g, 2.5);
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
      <planeGeometry args={[400, 400]} />
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
    return generateScatterPositions(terrainMesh, 120, ISLAND_SIZE, 0.2, 777);
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
    const positions = generateScatterPositions(terrainMesh, 30, ISLAND_SIZE, 0.2, 999);
    return positions.map((pos, i) => ({ pos, type: types[i % types.length] }));
  }, [terrainMesh]);

  return (
    <group>
      {nodes.map((n, i) => <HarvestableNode key={i} position={n.pos} type={n.type} />)}
    </group>
  );
}

// ── Player Character (FBX model) ──

function PlayerCharacter({ groupRef, terrainMesh }: {
  groupRef: React.RefObject<THREE.Group | null>;
  terrainMesh: THREE.Mesh | null;
}) {
  const { camera } = useThree();
  const store = useArenaStore;
  const charDef = useArenaStore((s) => s.selectedCharDef);

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

  // When FBXCharacter finishes loading, re-wire the SM with real controller
  const handleCharReady = useCallback((ctrl: AnimController, sm: CharacterStateMachine) => {
    // The FBXCharacter created its own SM — swap engine reference
    engine.ctrl = ctrl;
    engine.sm = sm;
    engine.entity.sm = sm;
    sm.transition(STATE.IDLE);
  }, [engine]);

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

        if (terrainMesh) {
          const h = collider.heightAt(engine.pos.x, engine.pos.z);
          engine.pos.y = Math.max(h + 0.05, 0.05);
        }

        engine.sm.transition(snap.movement.sprint ? STATE.SPRINT : STATE.RUN);
        if (groupRef.current) {
          const rot = Math.atan2(-dir.x, -dir.z);
          groupRef.current.rotation.y = rot;
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
        const h = collider.heightAt(engine.pos.x, engine.pos.z);
        engine.pos.y = Math.max(h + 0.05, 0.05);
      }
    }

    // Sync
    engine.entity.hp = store.getState().playerHp;
    if (groupRef.current) {
      groupRef.current.position.copy(engine.pos);
      groupRef.current.userData = { entity: engine.entity };
    }

    // Camera follow
    camera.position.lerp(new THREE.Vector3().copy(engine.pos).add(CAMERA_OFFSET), 0.06);
    camera.lookAt(engine.pos.x, engine.pos.y + 1, engine.pos.z);
  });

  return (
    <group ref={groupRef} position={[0, 2, 10]}>
      {/* Invisible collision capsule for hit detection */}
      <mesh visible={false}>
        <capsuleGeometry args={[0.4, 1.0, 4, 8]} />
        <meshBasicMaterial />
      </mesh>
      {/* Real FBX character model */}
      {charDef && (
        <FBXCharacter
          modelUrl={charDef.race.modelUrl}
          textureUrl={charDef.race.textureUrl}
          visibleMeshes={charDef.preset.visibleMeshes}
          animPack={charDef.cls.animPack}
          tintColor={charDef.cls.color}
          onReady={handleCharReady}
        />
      )}
    </group>
  );
}

// ── Enemy NPC (FBX model) ──

function EnemyNPC({ index, spawnAngle, playerRef, terrainMesh, navGrid }: {
  index: number;
  spawnAngle: number;
  playerRef: React.RefObject<THREE.Group | null>;
  terrainMesh: THREE.Mesh | null;
  navGrid: NavGrid | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const store = useArenaStore;

  // Deterministic enemy class for this slot
  const enemyDef = useMemo(() => pickEnemyDef(index), [index]);

  // Stable spawn position — must NOT use Math.random() at render-level
  // or the engine useMemo deps change every frame and destroy the AI brain
  const spawn = useMemo(() => {
    const radius = 25 + ((index * 7 + 13) % 20);
    const sx = Math.cos(spawnAngle) * radius;
    const sz = Math.sin(spawnAngle) * radius;
    return { sx, sz };
  }, [index, spawnAngle]);

  const engine = useMemo(() => {
    const ctrl = createStubCtrl();
    const sm = new CharacterStateMachine(ctrl);
    sm.transition(STATE.IDLE);
    const pos = new THREE.Vector3(spawn.sx, 0.05, spawn.sz);
    const brain = new AIBrain(sm, pos, new THREE.Vector3(spawn.sx, 0.05, spawn.sz));
    const entity = createCombatEntity({
      id: `enemy-${index}`, hp: 80, maxHp: 80, position: pos, sm,
      faction: "enemy", attackRange: 2.5, attackDamage: 10,
      onHit: () => brain.onHit(),
    });
    return { ctrl, sm, pos, brain, entity };
  }, [spawn, index]);

  // When FBXCharacter loads, rewire engine + AI brain to use the real SM
  const handleCharReady = useCallback((ctrl: AnimController, sm: CharacterStateMachine) => {
    engine.ctrl = ctrl;
    engine.sm = sm;
    engine.entity.sm = sm;
    engine.brain.sm = sm;  // critical: AI transitions must go to the active SM
    sm.transition(STATE.IDLE);
  }, [engine]);

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
        const h = collider.heightAt(engine.pos.x, engine.pos.z);
        engine.pos.y = Math.max(h + 0.05, 0.05);
      }

      // Apply knockback
      const kb = consumeKnockback(engine.entity, dtMs);
      if (kb.dx !== 0 || kb.dz !== 0) {
        engine.pos.x += kb.dx;
        engine.pos.z += kb.dz;
        if (terrainMesh) {
          const h2 = collider.heightAt(engine.pos.x, engine.pos.z);
          engine.pos.y = Math.max(h2 + 0.05, 0.05);
        }
      }

      // Sync facing angle for directional damage
      if (dx !== 0 || dz !== 0) {
        if (groupRef.current) groupRef.current.rotation.y = Math.atan2(-dx, -dz);
        engine.entity.facingAngle = Math.atan2(dz, dx);
      } else if (engine.brain.facing.lengthSq() > 0) {
        engine.entity.facingAngle = Math.atan2(engine.brain.facing.y, engine.brain.facing.x);
        if (groupRef.current) {
          groupRef.current.rotation.y = Math.atan2(-engine.brain.facing.x, -engine.brain.facing.y);
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

    if (groupRef.current) {
      groupRef.current.position.copy(engine.pos);
      groupRef.current.userData = { entity: engine.entity };
    }
  });

  if (engine.entity.dead) return null;

  return (
    <group ref={groupRef} position={[spawn.sx, 0.05, spawn.sz]}>
      {/* Invisible collision capsule */}
      <mesh visible={false}>
        <capsuleGeometry args={[0.4, 1.0, 4, 8]} />
        <meshBasicMaterial />
      </mesh>
      {/* Real FBX enemy model */}
      <FBXCharacter
        modelUrl={enemyDef.race.modelUrl}
        textureUrl={enemyDef.race.textureUrl}
        visibleMeshes={enemyDef.preset.visibleMeshes}
        animPack={enemyDef.cls.animPack}
        tintColor={enemyDef.cls.color}
        onReady={handleCharReady}
      />
    </group>
  );
}

// ── ForgeInner (scene graph) ──

function ForgeInner() {
  const playerRef = useRef<THREE.Group>(null);
  const [terrainMesh, setTerrainMesh] = useState<THREE.Mesh | null>(null);
  const [navGrid, setNavGrid] = useState<NavGrid | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const setEnemies = useArenaStore((s) => s.setEnemies);
  const selectedMap = useArenaStore((s) => s.selectedMap);

  const isGlbMap = selectedMap?.type === "glb";

  const handleTerrainReady = useCallback((mesh: THREE.Mesh) => {
    setTerrainMesh(mesh);
    // Build BVH collider for accelerated raycasting
    collider.buildFromSingleMesh(mesh);
    // Build NavGrid from terrain (A* pathfinding for AI)
    const grid = new NavGrid(mesh, { worldSize: ISLAND_SIZE, resolution: 64 });
    setNavGrid(grid);
    setMapReady(true);
  }, []);

  const handleGlbReady = useCallback((meshes: THREE.Mesh[]) => {
    // collider is built inside GLBMap; NavGrid not applicable for GLB maps
    setMapReady(true);
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

  const ambientIntensity = selectedMap?.ambientLight ?? 0.35;

  return (
    <>
      {/* Sky — cave maps get no sky, just dark ambient */}
      {selectedMap?.sky !== "cave" && (
        <Sky sunPosition={[100, 60, 50]} turbidity={3} rayleigh={0.5} />
      )}

      {/* Lighting */}
      <ambientLight intensity={ambientIntensity} />
      {selectedMap?.sky !== "cave" && (
        <directionalLight
          position={[30, 40, 20]} intensity={1.5} castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-50} shadow-camera-right={50}
          shadow-camera-top={50} shadow-camera-bottom={-50}
          shadow-camera-near={1} shadow-camera-far={120}
        />
      )}
      <hemisphereLight args={[
        selectedMap?.sky === "cave" ? "#443322" : "#87ceeb",
        selectedMap?.sky === "cave" ? "#221111" : "#3a5a2a",
        selectedMap?.sky === "cave" ? 0.3 : 0.4,
      ]} />

      {/* GLB Map or Procedural Map */}
      {isGlbMap && selectedMap ? (
        <GLBMap mapDef={selectedMap} collider={collider} onReady={handleGlbReady} />
      ) : (
        <>
          {/* Water */}
          <WaterPlane />
          {/* Island terrain */}
          <IslandTerrainMesh onReady={handleTerrainReady} />
          {/* Village (center of map) */}
          <VillageLayout />
          {/* Nature scatter */}
          <NatureScatter terrainMesh={terrainMesh} />
          {/* Harvestable nodes */}
          <HarvestableScatter terrainMesh={terrainMesh} />
        </>
      )}

      {/* Player */}
      <PlayerCharacter groupRef={playerRef} terrainMesh={terrainMesh} />

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
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
    >
      <Suspense fallback={null}>
        <ForgeInner />
      </Suspense>
    </Canvas>
  );
}
