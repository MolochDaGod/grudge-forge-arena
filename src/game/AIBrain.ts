/**
 * AIBrain.ts
 * Per-frame AI decision-maker for enemy NPCs.
 *
 * Follows the annihilate Ai.js pattern:
 * 1. If target in detection range → face target, chase, attack at melee range
 * 2. If no target → return to spawn position
 * 3. Attack has cooldown (PaladinAi pattern: canAttack → canNotAttack 3s)
 *
 * Extended with:
 * - Dodge/roll chance when being hit
 * - Block chance at close range
 * - Retreat when low HP (< 20%)
 * - Randomised action selection to feel less robotic
 */

import * as THREE from "three";
import { CharacterStateMachine, STATE } from "../engine/CharacterStateMachine";

export interface AIConfig {
  detectionRange: number;  // detect player at this distance
  attackRange: number;     // melee strike distance
  moveSpeed: number;       // units per second
  attackCooldown: number;  // ms between attacks
  blockChance: number;     // 0-1 probability to block when idle in range
  dodgeChance: number;     // 0-1 probability to dodge after being hit
}

const DEFAULT_CONFIG: AIConfig = {
  detectionRange: 15,
  attackRange: 2.5,
  moveSpeed: 4,
  attackCooldown: 2000,
  blockChance: 0.15,
  dodgeChance: 0.15,
};

export class AIBrain {
  config: AIConfig;
  sm: CharacterStateMachine;
  position: THREE.Vector3;
  facing: THREE.Vector2;
  spawnPosition: THREE.Vector3;

  private _attackTimer = 0;
  private _blockTimer = 0;
  private _actionLock = 0; // ms lock after an action to prevent spam

  constructor(
    sm: CharacterStateMachine,
    position: THREE.Vector3,
    spawnPos: THREE.Vector3,
    config?: Partial<AIConfig>,
  ) {
    this.sm = sm;
    this.position = position;
    this.facing = new THREE.Vector2(0, 1);
    this.spawnPosition = spawnPos.clone();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Called once per frame. Returns movement delta [dx, dz] to apply to position.
   * The caller is responsible for applying the delta and updating the mesh.
   */
  update(
    deltaMs: number,
    targetPos: THREE.Vector3,
    myHpRatio: number,
  ): { dx: number; dz: number } {
    this._attackTimer = Math.max(0, this._attackTimer - deltaMs);
    this._blockTimer = Math.max(0, this._blockTimer - deltaMs);
    this._actionLock = Math.max(0, this._actionLock - deltaMs);

    if (this.sm.isDead) return { dx: 0, dz: 0 };

    const dx = targetPos.x - this.position.x;
    const dz = targetPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Face target (annihilate Ai.js: character.facing.copy(direction))
    if (dist > 0.1) {
      this.facing.set(dx, dz).normalize();
    }

    // Blocking: release block if timer expired
    if (this._blockTimer <= 0 && this.sm.state === STATE.BLOCK) {
      this.sm.rest();
    }

    // Don't make decisions during blocking animations or action locks
    if (this.sm.isBlocking || this._actionLock > 0) return { dx: 0, dz: 0 };

    // ── Low HP retreat (< 20%) ──
    if (myHpRatio < 0.2 && dist < this.config.attackRange * 3) {
      // Dodge away
      if (Math.random() < 0.3 && this._attackTimer <= 0) {
        this.sm.transition(STATE.DODGE);
        this._actionLock = 500;
        return { dx: 0, dz: 0 };
      }
    }

    // ── Out of detection range → idle / return to spawn ──
    if (dist > this.config.detectionRange) {
      const sx = this.spawnPosition.x - this.position.x;
      const sz = this.spawnPosition.z - this.position.z;
      const sDist = Math.sqrt(sx * sx + sz * sz);

      if (sDist > 1) {
        this.sm.transition(STATE.RUN);
        const speed = this.config.moveSpeed * (deltaMs / 1000);
        return { dx: (sx / sDist) * speed, dz: (sz / sDist) * speed };
      }
      this.sm.rest();
      return { dx: 0, dz: 0 };
    }

    // ── In range → attack ──
    if (dist <= this.config.attackRange) {
      if (this._attackTimer <= 0) {
        // Pick action: attack, block, or dodge
        const roll = Math.random();
        if (roll < this.config.blockChance) {
          this.sm.transition(STATE.BLOCK);
          this._blockTimer = 500 + Math.random() * 500;
          this._actionLock = this._blockTimer;
        } else if (roll < this.config.blockChance + this.config.dodgeChance) {
          this.sm.transition(STATE.ROLL);
          this._actionLock = 700;
        } else {
          // Attack combo — try attack1, or attack2 if already in attack1
          if (this.sm.isAttacking) {
            this.sm.transition(STATE.ATTACK_2);
          } else {
            this.sm.transition(STATE.ATTACK_1);
          }
          this._attackTimer = this.config.attackCooldown;
          this._actionLock = 600;
        }
      } else {
        // Waiting for cooldown — idle in combat stance
        if (!this.sm.isBlocking && !this.sm.isAttacking) {
          this.sm.transition(STATE.COMBAT_IDLE);
        }
      }
      return { dx: 0, dz: 0 };
    }

    // ── Chase → run toward target ──
    this.sm.transition(STATE.RUN);
    const speed = this.config.moveSpeed * (deltaMs / 1000);
    return { dx: (dx / dist) * speed, dz: (dz / dist) * speed };
  }
}
