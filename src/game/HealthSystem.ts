/**
 * HealthSystem.ts
 * Per-entity health tracking with invulnerability windows.
 *
 * Pattern from annihilate:
 * - Maria.hit(collideEvent) → service.send('hit')
 * - RobotBoss.decreaseHealth: assign({ health: ctx => ctx.health - 5 })
 * - hit state re-enterable for juggle combos
 */

import * as THREE from "three";
import { STATE, type CharacterStateMachine } from "../engine/CharacterStateMachine";

export interface CombatEntity {
  id: string;
  hp: number;
  maxHp: number;
  position: THREE.Vector3;
  sm: CharacterStateMachine;
  /** Milliseconds remaining of invulnerability after being hit. */
  iFrames: number;
  dead: boolean;
  /** Faction: player or enemy. Prevents friendly fire. */
  faction: "player" | "enemy";
  /** Attack reach radius for proximity hit checks. */
  attackRange: number;
  /** Damage per hit. */
  attackDamage: number;
}

const I_FRAME_DURATION = 400; // ms of invulnerability after being hit

/**
 * Check if `attacker` can damage `target` this frame.
 * Uses the annihilate pattern: attacker must be in a canDamage state
 * (isAttacking) and target must be in range and not invulnerable.
 */
export function tryDamage(
  attacker: CombatEntity,
  target: CombatEntity,
): number {
  if (attacker.faction === target.faction) return 0;
  if (target.dead || target.iFrames > 0) return 0;
  if (!attacker.sm.isAttacking) return 0;

  const dx = target.position.x - attacker.position.x;
  const dz = target.position.z - attacker.position.z;
  const distSq = dx * dx + dz * dz;
  const range = attacker.attackRange + 0.5; // slight tolerance

  if (distSq > range * range) return 0;

  // Deal damage
  const dmg = attacker.attackDamage;
  target.hp = Math.max(0, target.hp - dmg);
  target.iFrames = I_FRAME_DURATION;

  // Trigger HIT state on target (annihilate pattern: service.send('hit'))
  if (target.hp <= 0) {
    target.dead = true;
    target.sm.transition(STATE.DEATH, true);
  } else {
    target.sm.transition(STATE.HIT, true);
  }

  return dmg;
}

/** Tick invulnerability timers. Call once per frame. */
export function tickIFrames(entity: CombatEntity, deltaMs: number): void {
  if (entity.iFrames > 0) {
    entity.iFrames = Math.max(0, entity.iFrames - deltaMs);
  }
}
