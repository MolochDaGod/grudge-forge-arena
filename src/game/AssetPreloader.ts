/**
 * AssetPreloader.ts
 * Pre-loads FBX models and animation clips into cache during loading screen.
 * After preload completes, FBXCharacter renders instantly from cache.
 */

import { FBXLoader } from "three-stdlib";
import * as THREE from "three";
import { getAnimMapForWeapon } from "../engine/ControllerAnimMap";
import type { RaceConfig } from "../engine/types/races";
import type { GrudgeCharacterDef } from "./GrudgeClasses";

const loader = new FBXLoader();
const modelCache = new Map<string, THREE.Group>();
const clipCache = new Map<string, THREE.AnimationClip | null>();

/** Load and cache an FBX model. Returns clone from cache. */
async function preloadModel(url: string): Promise<void> {
  if (modelCache.has(url)) return;
  try {
    const group = await loader.loadAsync(url);
    modelCache.set(url, group);
  } catch {
    // CDN miss — not critical, FBXCharacter handles fallback
  }
}

/** Load and cache a single animation clip. */
async function preloadClip(url: string): Promise<void> {
  if (clipCache.has(url)) return;
  try {
    const g = await loader.loadAsync(url);
    clipCache.set(url, g.animations[0] ?? null);
  } catch {
    clipCache.set(url, null);
  }
}

export interface PreloadProgress {
  loaded: number;
  total: number;
  status: string;
}

/**
 * Preload all assets needed for a game session.
 *
 * @param playerDef  The selected player character definition
 * @param enemyDefs  Enemy character definitions to preload
 * @param onProgress Called with progress updates
 */
export async function preloadGameAssets(
  playerDef: GrudgeCharacterDef,
  enemyDefs: GrudgeCharacterDef[],
  onProgress: (p: PreloadProgress) => void,
): Promise<void> {
  // Collect unique model URLs
  const modelUrls = new Set<string>();
  modelUrls.add(playerDef.race.modelUrl);
  for (const def of enemyDefs) modelUrls.add(def.race.modelUrl);

  // Collect unique animation URLs
  const animUrls = new Set<string>();
  const animPacks = new Set<string>();
  animPacks.add(playerDef.cls.animPack);
  for (const def of enemyDefs) animPacks.add(def.cls.animPack);

  for (const pack of animPacks) {
    const map = getAnimMapForWeapon(pack);
    for (const url of Object.values(map)) animUrls.add(url);
  }

  const totalModels = modelUrls.size;
  const totalAnims = animUrls.size;
  const total = totalModels + totalAnims;
  let loaded = 0;

  // Preload models
  onProgress({ loaded: 0, total, status: "Loading character models..." });
  const BATCH = 3;
  const modelArr = [...modelUrls];
  for (let i = 0; i < modelArr.length; i += BATCH) {
    const batch = modelArr.slice(i, i + BATCH);
    await Promise.all(batch.map(u => preloadModel(u)));
    loaded += batch.length;
    onProgress({ loaded, total, status: `Models ${Math.min(loaded, totalModels)}/${totalModels}` });
  }

  // Preload animations
  onProgress({ loaded, total, status: "Loading animations..." });
  const animArr = [...animUrls];
  for (let i = 0; i < animArr.length; i += BATCH) {
    const batch = animArr.slice(i, i + BATCH);
    await Promise.all(batch.map(u => preloadClip(u)));
    loaded += batch.length;
    onProgress({ loaded, total, status: `Animations ${Math.min(loaded - totalModels, totalAnims)}/${totalAnims}` });
  }

  onProgress({ loaded: total, total, status: "Assets loaded!" });
}

/** Get the shared model cache (used by FBXCharacter). */
export function getModelCache(): Map<string, THREE.Group> {
  return modelCache;
}

/** Get the shared clip cache (used by FBXCharacter). */
export function getClipCache(): Map<string, THREE.AnimationClip | null> {
  return clipCache;
}
