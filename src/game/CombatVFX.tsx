/**
 * CombatVFX.tsx
 *
 * R3F component that mounts the ProjectileManager and VFXManager root groups
 * into the Three.js scene and calls their update() every frame.
 *
 * Also exposes helper functions for spawning VFX from the combat loop.
 */

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { projectileManager } from "./ProjectileManager";
import { vfxManager } from "./VFXManager";
import { ELEMENT_COLORS, type Element } from "../engine/types/weaponSkills";

// ── Convenience helpers for ArenaScene combat integration ────────────────────

/** Spawn a hit-impact splash at the contact point, colored by element. */
export function spawnHitSplash(position: THREE.Vector3, element: Element = "physical"): void {
  vfxManager.spawnSplash(position, ELEMENT_COLORS[element] ?? "#b8b8c0");
}

/** Spawn a charge/swing blink flash at the attacker's position. */
export function spawnAttackBlink(position: THREE.Vector3, element: Element = "physical"): void {
  vfxManager.spawnBlink(position, ELEMENT_COLORS[element] ?? "#ffffff");
}

/** Spawn an AoE knockback ring at the position. */
export function spawnAoEPop(position: THREE.Vector3, element: Element = "arcane", radius = 4): void {
  vfxManager.spawnPop(position, ELEMENT_COLORS[element] ?? "#cc44ff", radius);
}

/** Spawn a ranged projectile from attacker toward target with element color. */
export function spawnProjectile(
  origin: THREE.Vector3,
  target: THREE.Vector3,
  element: Element = "arcane",
  onHit?: (pos: THREE.Vector3) => void,
): void {
  const color = ELEMENT_COLORS[element] ?? "#cc44ff";
  projectileManager.spawn(origin, target, {
    speed: 22,
    arcHeight: 1.5,
    color,
    radius: 0.18,
    hitRadius: 1.2,
    onHit: (pos) => {
      // Always spawn a splash on projectile impact
      vfxManager.spawnSplash(pos, color);
      onHit?.(pos);
    },
  });
}

// ── R3F Component ────────────────────────────────────────────────────────────

export function CombatVFX({ enemyPositions }: { enemyPositions?: THREE.Vector3[] }) {
  const groupRef = useRef<THREE.Group>(null);

  // Mount manager roots into the scene once
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.add(projectileManager.root);
    g.add(vfxManager.root);
    return () => {
      g.remove(projectileManager.root);
      g.remove(vfxManager.root);
      projectileManager.clear();
      vfxManager.clear();
    };
  }, []);

  // Per-frame update
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    projectileManager.update(dt, enemyPositions);
    vfxManager.update(dt);
  });

  return <group ref={groupRef} />;
}
