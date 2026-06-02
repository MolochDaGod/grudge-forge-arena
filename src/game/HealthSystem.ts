/**
 * HealthSystem.ts
 * Combat damage system with directional validation, per-state scaling,
 * knockback impulse, and invulnerability windows.
 *
 * Pattern from annihilate:
 * - Maria.hit(collideEvent) → service.send('hit')
 * - RobotBoss.decreaseHealth: assign({ health: ctx => ctx.health - 5 })
 * - hit state re-enterable for juggle combos
 * - Pop.collide: push target velocity = normalized direction * 12 (knockback)
 * - SwordBlaster type 3: knockDown instead of hit
 */

import * as THREE from "three";
import { STATE, type CharacterStateMachine } from "../engine/CharacterStateMachine";

// ── Entity interface ──

export interface CombatEntity {
  id: string;
  hp: number;
  maxHp: number;
  position: THREE.Vector3;
  /** Current facing direction (radians, used for frontal arc check). */
  facingAngle: number;
  sm: CharacterStateMachine;
  /** Milliseconds remaining of invulnerability after being hit. */
  iFrames: number;
  dead: boolean;
  faction: "player" | "enemy";
  attackRange: number;
  /** Base damage per hit (scaled by attack state). */
  attackDamage: number;
  /** Accumulated knockback impulse this frame (applied by caller). */
  knockback: THREE.Vector2;
  /** Stagger buildup — exceeding threshold forces HIT state even during block. */
  stagger: number;
  /** Callback when this entity is hit (for AI reaction). */
  onHit?: () => void;
}

// ── Constants ──

const I_FRAME_DURATION = 400;

/** Frontal arc half-angle in radians (120° total = 60° each side). */
const ATTACK_ARC = Math.PI / 3;

/** Damage multiplier per attack state (higher combo hits deal more). */
const DAMAGE_SCALE: Record<string, number> = {
  [STATE.ATTACK_1]: 1.0,
  [STATE.ATTACK_2]: 1.3,
  [STATE.ATTACK_3]: 1.8,  // finisher hits hardest (annihilate: knockDown tag)
  [STATE.CAST]:     1.5,
  [STATE.HARVEST]:  0,    // no damage
};

/** Knockback strength per attack state (units of impulse). */
const KNOCKBACK_FORCE: Record<string, number> = {
  [STATE.ATTACK_1]: 1.5,
  [STATE.ATTACK_2]: 2.0,
  [STATE.ATTACK_3]: 4.0,  // finisher sends target flying (annihilate knockDown)
  [STATE.CAST]:     3.0,
};

/** Stagger dealt per attack state. */
const STAGGER_AMOUNT: Record<string, number> = {
  [STATE.ATTACK_1]: 15,
  [STATE.ATTACK_2]: 20,
  [STATE.ATTACK_3]: 40,
  [STATE.CAST]:     25,
};

/** Stagger threshold — exceeding this breaks a block. */
const STAGGER_THRESHOLD = 50;

/** Stagger decay per second. */
const STAGGER_DECAY = 30;

// ── Damage function ──

export interface DamageResult {
  damage: number;
  knockback: THREE.Vector2;
  blocked: boolean;
  staggerBroken: boolean;
}

/**
 * Attempt to deal damage from `attacker` to `target`.
 *
 * Checks:
 * 1. Faction (no friendly fire)
 * 2. Target alive and not invulnerable
 * 3. Attacker in an attacking state
 * 4. Distance within attack range
 * 5. Attacker facing target within frontal arc (120°)
 * 6. If target is blocking: accumulate stagger, only break through at threshold
 *
 * On hit: apply scaled damage, knockback impulse, iFrames, trigger HIT/DEATH.
 */
export function tryDamage(
  attacker: CombatEntity,
  target: CombatEntity,
): number {
  if (attacker.faction === target.faction) return 0;
  if (target.dead || target.iFrames > 0) return 0;
  if (!attacker.sm.isAttacking) return 0;

  // Distance check
  const dx = target.position.x - attacker.position.x;
  const dz = target.position.z - attacker.position.z;
  const distSq = dx * dx + dz * dz;
  const range = attacker.attackRange + 0.5;
  if (distSq > range * range) return 0;

  // Frontal arc check — attacker must be facing toward target
  const angleToTarget = Math.atan2(dz, dx);
  let angleDiff = Math.abs(attacker.facingAngle - angleToTarget);
  if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
  if (angleDiff > ATTACK_ARC) return 0;

  const attackState = attacker.sm.state ?? STATE.ATTACK_1;
  const scale = DAMAGE_SCALE[attackState] ?? 1.0;
  const baseDmg = Math.round(attacker.attackDamage * scale);
  const kbForce = KNOCKBACK_FORCE[attackState] ?? 1.5;
  const staggerAmt = STAGGER_AMOUNT[attackState] ?? 15;

  // Knockback direction (attacker → target)
  const dist = Math.sqrt(distSq);
  const kbDir = new THREE.Vector2(dx / dist, dz / dist);

  // Block check
  if (target.sm.state === STATE.BLOCK) {
    target.stagger += staggerAmt;
    // Apply reduced knockback even on block
    target.knockback.add(kbDir.clone().multiplyScalar(kbForce * 0.3));

    if (target.stagger >= STAGGER_THRESHOLD) {
      // Stagger break — force HIT through block
      target.stagger = 0;
      target.sm.transition(STATE.HIT, true);
      target.iFrames = I_FRAME_DURATION;
      target.knockback.add(kbDir.clone().multiplyScalar(kbForce));
      target.onHit?.();
      return Math.round(baseDmg * 0.5); // reduced damage on stagger break
    }
    return 0; // blocked successfully
  }

  // Deal full damage
  target.hp = Math.max(0, target.hp - baseDmg);
  target.iFrames = I_FRAME_DURATION;
  target.knockback.add(kbDir.clone().multiplyScalar(kbForce));
  target.stagger += staggerAmt * 0.5; // partial stagger even on hit

  if (target.hp <= 0) {
    target.dead = true;
    target.sm.transition(STATE.DEATH, true);
  } else {
    target.sm.transition(STATE.HIT, true);
  }

  target.onHit?.();
  return baseDmg;
}

/** Tick invulnerability and stagger decay. Call once per frame. */
export function tickIFrames(entity: CombatEntity, deltaMs: number): void {
  if (entity.iFrames > 0) {
    entity.iFrames = Math.max(0, entity.iFrames - deltaMs);
  }
  // Stagger decays over time
  if (entity.stagger > 0) {
    entity.stagger = Math.max(0, entity.stagger - STAGGER_DECAY * (deltaMs / 1000));
  }
}

/** Apply and consume knockback impulse. Returns position delta. */
export function consumeKnockback(entity: CombatEntity, deltaMs: number): { dx: number; dz: number } {
  if (entity.knockback.lengthSq() < 0.001) return { dx: 0, dz: 0 };
  const factor = Math.min(1, deltaMs / 100); // smooth over ~100ms
  const dx = entity.knockback.x * factor;
  const dz = entity.knockback.y * factor;
  entity.knockback.multiplyScalar(1 - factor);
  return { dx, dz };
}

/** Create a CombatEntity with proper defaults for the new fields. */
export function createCombatEntity(opts: {
  id: string;
  hp: number;
  maxHp: number;
  position: THREE.Vector3;
  sm: CharacterStateMachine;
  faction: "player" | "enemy";
  attackRange: number;
  attackDamage: number;
  onHit?: () => void;
}): CombatEntity {
  return {
    ...opts,
    facingAngle: 0,
    iFrames: 0,
    dead: false,
    knockback: new THREE.Vector2(),
    stagger: 0,
  };
}
