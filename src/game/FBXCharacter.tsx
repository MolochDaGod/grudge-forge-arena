/**
 * FBXCharacter.tsx
 * Loads a Grudge 6 race FBX model from R2 CDN, applies:
 *   - TGA texture
 *   - Gear preset mesh visibility
 *   - Weapon-specific animation set via AnimController
 *   - Wires AnimController into a CharacterStateMachine
 *
 * Used for both player and enemy characters in ArenaScene.
 */

import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FBXLoader } from "three-stdlib";
import { AnimController } from "../engine/AnimController";
import { CharacterStateMachine } from "../engine/CharacterStateMachine";
import { getAnimMapForWeapon } from "../engine/ControllerAnimMap";

// ── Shared loaders & caches ──

const fbxLoader = new FBXLoader();
const modelCache = new Map<string, THREE.Group>();
const clipCache = new Map<string, THREE.AnimationClip | null>();

async function loadModel(url: string): Promise<THREE.Group> {
  if (modelCache.has(url)) return modelCache.get(url)!.clone();
  try {
    const group = await fbxLoader.loadAsync(url);
    modelCache.set(url, group);
    return group.clone();
  } catch (e) {
    console.warn("[FBXCharacter] Failed to load model:", url, e);
    // Return empty group as fallback
    return new THREE.Group();
  }
}

async function loadClip(url: string): Promise<THREE.AnimationClip | null> {
  if (clipCache.has(url)) return clipCache.get(url)!;
  try {
    const g = await fbxLoader.loadAsync(url);
    const clip = g.animations[0] ?? null;
    clipCache.set(url, clip);
    return clip;
  } catch {
    clipCache.set(url, null);
    return null;
  }
}

// ── Stub AnimController (used until real anims load) ──

const STUB_KEYS = [
  "idle", "walk", "run", "sprint", "combatIdle",
  "attack1", "attack2", "attack3", "block", "hit", "death",
  "cast", "roll", "dodge", "crouch", "jump", "jumpLoop",
  "jumpDown", "harvest",
];

function createStubClip(name: string): THREE.AnimationClip {
  return new THREE.AnimationClip(name, 0.5, [
    new THREE.NumberKeyframeTrack(".visible", [0, 0.5], [1, 1]),
  ]);
}

// ── Component Props ──

export interface FBXCharacterProps {
  /** URL to the race FBX model (e.g. from RaceConfig.modelUrl). */
  modelUrl: string;
  /** URL to the TGA/PNG texture (e.g. from RaceConfig.textureUrl). */
  textureUrl: string;
  /** Mesh IDs to show (from GearPreset.visibleMeshes). Others are hidden. */
  visibleMeshes: string[];
  /** Weapon animation pack key (e.g. "sword_shield", "magic", "longbow"). */
  animPack: string;
  /** Callback with the AnimController + StateMachine once ready. */
  onReady?: (ctrl: AnimController, sm: CharacterStateMachine) => void;
  /** External state machine ref — if provided, FBXCharacter wires into it
   *  instead of creating its own. */
  externalSm?: CharacterStateMachine;
  /** Scale multiplier for the loaded model (default 0.01 for FBX→meter). */
  scale?: number;
  /** Class color for fallback tint if texture fails. */
  tintColor?: string;
}

/**
 * FBXCharacter — loads a full Grudge 6 FBX character model,
 * applies texture, shows only gear-preset meshes, loads animations,
 * and updates the mixer every frame.
 *
 * Renders as a <group> — parent component positions/rotates it.
 */
export function FBXCharacter({
  modelUrl,
  textureUrl,
  visibleMeshes,
  animPack,
  onReady,
  externalSm,
  scale = 0.01,
  tintColor,
}: FBXCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const ctrlRef = useRef<AnimController | null>(null);
  const smRef = useRef<CharacterStateMachine | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Visible mesh set for fast lookups
  const visibleSet = useMemo(() => new Set(visibleMeshes), [visibleMeshes]);

  // ── Load model + texture + animations ──
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1. Load the FBX model
      const model = await loadModel(modelUrl);
      if (cancelled) return;

      // 2. Scale and orient
      model.scale.setScalar(scale);
      model.rotation.set(0, 0, 0);

      // 3. Load and apply texture
      const texLoader = new THREE.TextureLoader();
      let texture: THREE.Texture | null = null;

      // Try PNG fallback if TGA (TGA requires special loader)
      const texUrl = textureUrl.replace(/\.tga$/i, ".png");
      try {
        texture = await texLoader.loadAsync(texUrl);
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
      } catch {
        // Try original URL
        try {
          texture = await texLoader.loadAsync(textureUrl);
          texture.flipY = false;
          texture.colorSpace = THREE.SRGBColorSpace;
        } catch {
          // Texture failed — will use tint color fallback
        }
      }

      // 4. Apply texture + mesh visibility
      model.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;

        // Gear preset visibility
        const meshId = child.name;
        child.visible = visibleSet.has(meshId);

        // Apply texture or tint fallback
        if (child.visible) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (texture) {
            const mat = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.75,
              metalness: 0.1,
            });
            child.material = mat;
          } else if (tintColor) {
            child.material = new THREE.MeshStandardMaterial({
              color: tintColor,
              roughness: 0.6,
              metalness: 0.2,
            });
          }
        }
      });

      // 5. Create AnimationMixer and AnimController
      const mixer = new THREE.AnimationMixer(model);
      mixerRef.current = mixer;

      const ctrl = new AnimController(mixer);
      ctrlRef.current = ctrl;

      // 6. Register stub clips first (so state machine works immediately)
      for (const key of STUB_KEYS) {
        ctrl.register(key, createStubClip(key));
      }

      // 7. Wire state machine
      const sm = externalSm ?? new CharacterStateMachine(ctrl);
      smRef.current = sm;

      // If external SM was provided, rewire its internal controller
      // by playing idle to sync
      sm.transition("idle");

      // 8. Mount the model into the scene group
      if (groupRef.current) {
        // Clear any previous children
        while (groupRef.current.children.length > 0) {
          groupRef.current.remove(groupRef.current.children[0]);
        }
        groupRef.current.add(model);
      }

      setLoaded(true);
      onReady?.(ctrl, sm);

      // 9. Load real animations async (replaces stubs as they arrive)
      const animMap = getAnimMapForWeapon(animPack);
      const animEntries = Object.entries(animMap);

      // Load in batches to avoid hammering CDN
      const BATCH_SIZE = 4;
      for (let i = 0; i < animEntries.length; i += BATCH_SIZE) {
        if (cancelled) return;
        const batch = animEntries.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async ([key, url]) => {
            const clip = await loadClip(url);
            return { key, clip };
          }),
        );
        for (const { key, clip } of results) {
          if (cancelled) return;
          if (clip) {
            clip.name = key;
            ctrl.register(key, clip);
          }
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, [modelUrl, textureUrl, animPack, scale, visibleSet, tintColor, externalSm, onReady]);

  // ── Update mixer every frame ──
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    mixerRef.current?.update(dt);
  });

  return <group ref={groupRef} />;
}
