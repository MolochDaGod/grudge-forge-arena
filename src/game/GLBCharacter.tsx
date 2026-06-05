/**
 * GLBCharacter.tsx
 *
 * Loads a Grudge 6 race GLB character model from R2 CDN.
 * GLB files are pre-baked with:
 *   - Meter scale (1:1, no 0.01 hack)
 *   - Embedded PNG textures (no separate TGA loading)
 *   - PBR materials (MeshStandardMaterial)
 *   - Preserved mesh names for gear visibility toggling
 *
 * Applies:
 *   - Gear preset mesh visibility (show only preset's meshes)
 *   - Weapon-specific animation set via AnimController
 *   - Wires AnimController into a CharacterStateMachine
 */

import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { AnimController } from "../engine/AnimController";
import { CharacterStateMachine } from "../engine/CharacterStateMachine";
import { getAnimMapForWeapon } from "../engine/ControllerAnimMap";

// ── Shared loaders & caches ──

const gltfLoader = new GLTFLoader();
const modelCache = new Map<string, THREE.Group>();
const clipCache = new Map<string, THREE.AnimationClip | null>();

async function loadGLB(url: string): Promise<THREE.Group> {
  if (modelCache.has(url)) return modelCache.get(url)!.clone(true);
  try {
    const gltf = await gltfLoader.loadAsync(url);
    const group = gltf.scene;
    modelCache.set(url, group);
    return group.clone(true);
  } catch (e) {
    console.warn("[GLBCharacter] Failed to load model:", url, e);
    return new THREE.Group();
  }
}

// Animations are still loaded as FBX clips (baked JSON or FBX from CDN)
// They get loaded via the existing AnimController pipeline
import { FBXLoader } from "three-stdlib";
const fbxLoader = new FBXLoader();

async function loadClip(url: string): Promise<THREE.AnimationClip | null> {
  if (clipCache.has(url)) return clipCache.get(url)!;
  try {
    // Try JSON baked anim first, then FBX
    if (url.endsWith(".json")) {
      const resp = await fetch(url);
      const json = await resp.json();
      const clip = THREE.AnimationClip.parse(json);
      clipCache.set(url, clip);
      return clip;
    }
    const g = await fbxLoader.loadAsync(url);
    const clip = g.animations[0] ?? null;
    clipCache.set(url, clip);
    return clip;
  } catch {
    clipCache.set(url, null);
    return null;
  }
}

// ── Stub AnimController (until real anims load) ──

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

export interface GLBCharacterProps {
  /** URL to the GLB model (e.g. /assets/barbarians/models/BRB_Characters.glb). */
  modelUrl: string;
  /** URL to a variant PNG texture (optional — GLB has default texture embedded). */
  textureUrl?: string;
  /** Mesh names to show (from GearPreset.visibleMeshes). Others are hidden. */
  visibleMeshes: string[];
  /** Weapon animation pack key (e.g. "sword_shield", "magic", "longbow"). */
  animPack: string;
  /** Callback with the AnimController + StateMachine once ready. */
  onReady?: (ctrl: AnimController, sm: CharacterStateMachine) => void;
  /** Class color for fallback tint if model has no texture. */
  tintColor?: string;
}

/**
 * GLBCharacter — loads a Grudge 6 GLB character model,
 * applies gear-preset mesh visibility, loads animations,
 * and updates the mixer every frame.
 *
 * No scale hack needed — GLB is already in meters.
 */
export function GLBCharacter({
  modelUrl,
  textureUrl,
  visibleMeshes,
  animPack,
  onReady,
  tintColor,
}: GLBCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [loaded, setLoaded] = useState(false);

  const visibleSet = useMemo(() => new Set(visibleMeshes), [visibleMeshes]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1. Load the GLB model
      const model = await loadGLB(modelUrl);
      if (cancelled) return;

      // 2. Apply mesh visibility for gear preset
      let meshCount = 0;
      model.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.visible = visibleSet.has(child.name);
        if (child.visible) {
          child.castShadow = true;
          child.receiveShadow = true;
          meshCount++;
        }
      });

      // 3. If a variant texture URL was provided, override the embedded texture
      if (textureUrl) {
        try {
          const texLoader = new THREE.TextureLoader();
          const texture = await texLoader.loadAsync(textureUrl);
          texture.flipY = false;
          texture.colorSpace = THREE.SRGBColorSpace;
          model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.visible) {
              child.material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.75,
                metalness: 0.1,
              });
            }
          });
        } catch {
          // Variant texture failed — keep embedded GLB texture
        }
      }

      // 4. Fallback tint if no texture at all
      if (tintColor) {
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.visible) {
            const mat = child.material as THREE.MeshStandardMaterial;
            if (!mat.map) {
              child.material = new THREE.MeshStandardMaterial({
                color: tintColor,
                roughness: 0.6,
                metalness: 0.2,
              });
            }
          }
        });
      }

      // 5. Create AnimationMixer and AnimController
      const mixer = new THREE.AnimationMixer(model);
      mixerRef.current = mixer;

      const ctrl = new AnimController(mixer);

      // 6. Register stub clips first
      for (const key of STUB_KEYS) {
        ctrl.register(key, createStubClip(key));
      }

      // 7. Create state machine
      const sm = new CharacterStateMachine(ctrl);
      sm.transition("idle");

      // 8. Mount into scene
      if (groupRef.current) {
        while (groupRef.current.children.length > 0) {
          groupRef.current.remove(groupRef.current.children[0]);
        }
        groupRef.current.add(model);
      }

      setLoaded(true);
      onReady?.(ctrl, sm);

      // 9. Load real animations async (replaces stubs)
      const animMap = getAnimMapForWeapon(animPack);
      const animEntries = Object.entries(animMap);

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
  }, [modelUrl, textureUrl, animPack, visibleSet, tintColor, onReady]);

  // ── Update mixer every frame ──
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    mixerRef.current?.update(dt);
  });

  return <group ref={groupRef} />;
}
