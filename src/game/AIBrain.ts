/**
 * AIBrain.ts
 * Full behavior-tree AI for enemy NPCs in the Grudge Forge Arena.
 *
 * Behavior priority (evaluated top-to-bottom each frame):
 * 1. DEAD → do nothing
 * 2. HIT REACTION → counter-dodge or stagger recovery
 * 3. LEASH CHECK → if too far from spawn, disengage and return
 * 4. LOW HP RETREAT → dodge away, try to create distance
 * 5. MELEE RANGE → facing check → attack combo / block / dodge / strafe
 * 6. CHASE RANGE → pathfind toward target (NavGrid A*)
 * 7. DETECTION RANGE → walk toward target (direct)
 * 8. IDLE / PATROL → walk between patrol waypoints near spawn
 * 9. RETURN TO SPAWN → if displaced and no target, walk home
 *
 * Combat actions:
 * - 3-hit combo chain: ATTACK_1 → ATTACK_2 → ATTACK_3 (annihilate Maria pattern)
 * - Block with timed hold (PaladinAi pattern: 0.5-1s hold then release)
 * - Dodge/roll with directional choice (forward dodge or lateral strafe)
 * - Cast for ranged/magic NPC types
 * - Strafe: lateral movement around target while in melee range
 *
 * Pathfinding:
 * - Uses NavGrid A* for terrain-aware navigation
 * - Path is recalculated every 500ms (not every frame)
 * - Walks along waypoints, snapping to terrain height
 *
 * Facing validation:
 * - Attacks only fire if NPC is facing within 60° of target direction
 * - Prevents hitting while turned away
 */

import * as THREE from "three";
import { CharacterStateMachine, STATE } from "../engine/CharacterStateMachine";
import type { NavGrid } from "./NavGrid";

// ── Configuration ──

export interface AIConfig {
  detectionRange: number;   // first notice the player
  attackRange: number;      // melee strike distance
  leashRange: number;       // max distance from spawn before disengaging
  moveSpeed: number;        // units per second
  sprintSpeed: number;      // units per second when sprinting
  attackCooldown: number;   // ms between attack attempts
  blockChance: number;      // 0-1
  dodgeChance: number;      // 0-1
  strafeChance: number;     // 0-1 chance to strafe instead of standing still in range
  castChance: number;       // 0-1 chance to cast (for magic NPCs)
  comboChance: number;      // 0-1 chance to continue combo after hit 1
  patrolRadius: number;     // radius around spawn for patrol waypoints
  pathRecalcMs: number;     // ms between path recalculations
  facingThreshold: number;  // radians — max angle to target to allow attack
}

const DEFAULT_CONFIG: AIConfig = {
  detectionRange: 18,
  attackRange: 2.5,
  leashRange: 35,
  moveSpeed: 3.5,
  sprintSpeed: 5.5,
  attackCooldown: 1800,
  blockChance: 0.12,
  dodgeChance: 0.12,
  strafeChance: 0.20,
  castChance: 0.0,
  comboChance: 0.55,
  patrolRadius: 8,
  pathRecalcMs: 500,
  facingThreshold: Math.PI / 3, // 60°
};

// ── Behavior state ──

type AIPhase = "idle" | "patrol" | "chase" | "combat" | "retreat" | "returnToSpawn";

export class AIBrain {
  config: AIConfig;
  sm: CharacterStateMachine;
  position: THREE.Vector3;
  facing: THREE.Vector2;
  spawnPosition: THREE.Vector3;

  /** Current high-level behavior phase. */
  phase: AIPhase = "idle";

  /** NavGrid for A* pathfinding (set after terrain loads). */
  navGrid: NavGrid | null = null;

  // ── Timers ──
  private _attackCd = 0;
  private _blockTimer = 0;
  private _actionLock = 0;
  private _pathTimer = 0;
  private _strafeTimer = 0;
  private _strafeDir = 1;  // +1 = clockwise, -1 = counter-clockwise
  private _patrolTimer = 0;
  private _hitReactTimer = 0;

  // ── Path state ──
  private _path: THREE.Vector3[] = [];
  private _pathIdx = 0;

  // ── Patrol state ──
  private _patrolPoints: THREE.Vector3[] = [];
  private _patrolIdx = 0;

  // ── Combo tracking ──
  private _comboStep = 0;   // 0 = none, 1 = did attack1, 2 = did attack2
  private _comboWindow = 0; // ms remaining to chain next hit

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

  /** Notify the AI that it was hit (triggers counter-reaction). */
  onHit(): void {
    this._hitReactTimer = 300; // ms of recovery before next decision
  }

  /**
   * Per-frame update. Returns movement delta to apply.
   */
  update(
    deltaMs: number,
    targetPos: THREE.Vector3,
    myHpRatio: number,
  ): { dx: number; dz: number } {
    // Tick timers
    this._attackCd = Math.max(0, this._attackCd - deltaMs);
    this._blockTimer = Math.max(0, this._blockTimer - deltaMs);
    this._actionLock = Math.max(0, this._actionLock - deltaMs);
    this._pathTimer = Math.max(0, this._pathTimer - deltaMs);
    this._strafeTimer = Math.max(0, this._strafeTimer - deltaMs);
    this._patrolTimer = Math.max(0, this._patrolTimer - deltaMs);
    this._hitReactTimer = Math.max(0, this._hitReactTimer - deltaMs);
    this._comboWindow = Math.max(0, this._comboWindow - deltaMs);
    if (this._comboWindow <= 0) this._comboStep = 0;

    if (this.sm.isDead) return { dx: 0, dz: 0 };

    // Direction to target
    const toTarget = new THREE.Vector2(
      targetPos.x - this.position.x,
      targetPos.z - this.position.z,
    );
    const dist = toTarget.length();
    if (dist > 0.01) toTarget.normalize();

    // Always face target when in detection range
    if (dist < this.config.detectionRange && dist > 0.1) {
      this.facing.copy(toTarget);
    }

    // ── 1. Block release ──
    if (this._blockTimer <= 0 && this.sm.state === STATE.BLOCK) {
      this.sm.rest();
    }

    // ── 2. Action lock — don't interrupt animations ──
    if (this.sm.isBlocking || this._actionLock > 0) return { dx: 0, dz: 0 };

    // ── 3. Hit reaction — counter-dodge ──
    if (this._hitReactTimer > 0) {
      if (Math.random() < this.config.dodgeChance * 2) {
        this.sm.transition(STATE.DODGE);
        this._actionLock = 500;
      }
      return { dx: 0, dz: 0 };
    }

    // ── 4. Leash check ──
    const distFromSpawn = Math.sqrt(
      (this.position.x - this.spawnPosition.x) ** 2 +
      (this.position.z - this.spawnPosition.z) ** 2,
    );
    if (distFromSpawn > this.config.leashRange) {
      this.phase = "returnToSpawn";
      return this._moveToward(this.spawnPosition, this.config.moveSpeed, deltaMs);
    }

    // ── 5. Low HP retreat ──
    if (myHpRatio < 0.2 && dist < this.config.attackRange * 4) {
      this.phase = "retreat";
      // Move away from target
      const speed = this.config.sprintSpeed * (deltaMs / 1000);
      this.sm.transition(STATE.SPRINT);
      // Random dodge interspersed
      if (Math.random() < 0.02) {
        this.sm.transition(STATE.DODGE);
        this._actionLock = 500;
        return { dx: 0, dz: 0 };
      }
      return { dx: -toTarget.x * speed, dz: -toTarget.y * speed };
    }

    // ── 6. Melee range — combat ──
    if (dist <= this.config.attackRange) {
      this.phase = "combat";
      return this._tickCombat(deltaMs, toTarget, dist);
    }

    // ── 7. Chase range — pathfind to target ──
    if (dist <= this.config.detectionRange) {
      this.phase = "chase";
      return this._tickChase(deltaMs, targetPos, dist);
    }

    // ── 8. Out of range — patrol or return to spawn ──
    if (distFromSpawn > 2) {
      this.phase = "returnToSpawn";
      return this._moveToward(this.spawnPosition, this.config.moveSpeed, deltaMs);
    }

    this.phase = "patrol";
    return this._tickPatrol(deltaMs);
  }

  // ── Combat behavior ──

  private _tickCombat(
    deltaMs: number,
    toTarget: THREE.Vector2,
    dist: number,
  ): { dx: number; dz: number } {
    // Facing validation — don't attack while facing away
    const facingAngle = Math.atan2(this.facing.y, this.facing.x);
    const targetAngle = Math.atan2(toTarget.y, toTarget.x);
    let angleDiff = Math.abs(facingAngle - targetAngle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
    const isFacing = angleDiff < this.config.facingThreshold;

    // Combo continuation — if in combo window, try to chain
    if (this._comboStep > 0 && this._comboWindow > 0 && isFacing) {
      if (Math.random() < this.config.comboChance) {
        if (this._comboStep === 1) {
          if (this.sm.transition(STATE.ATTACK_2)) {
            this._comboStep = 2;
            this._comboWindow = 600;
            this._actionLock = 800;
            return { dx: 0, dz: 0 };
          }
        } else if (this._comboStep === 2) {
          if (this.sm.transition(STATE.ATTACK_3)) {
            this._comboStep = 0;
            this._comboWindow = 0;
            this._attackCd = this.config.attackCooldown * 1.5; // longer CD after full combo
            this._actionLock = 1100;
            return { dx: 0, dz: 0 };
          }
        }
      }
      // Combo dropped
      this._comboStep = 0;
      this._comboWindow = 0;
    }

    // Attack cooldown ready — pick action
    if (this._attackCd <= 0 && isFacing) {
      const roll = Math.random();
      let threshold = 0;

      // Block
      threshold += this.config.blockChance;
      if (roll < threshold) {
        this.sm.transition(STATE.BLOCK);
        this._blockTimer = 400 + Math.random() * 600;
        this._actionLock = this._blockTimer;
        return { dx: 0, dz: 0 };
      }

      // Dodge
      threshold += this.config.dodgeChance;
      if (roll < threshold) {
        this.sm.transition(STATE.ROLL);
        this._actionLock = 700;
        // Lateral dodge impulse
        const side = Math.random() > 0.5 ? 1 : -1;
        const speed = 3 * (deltaMs / 1000);
        return { dx: -toTarget.y * side * speed, dz: toTarget.x * side * speed };
      }

      // Cast (for magic NPCs)
      threshold += this.config.castChance;
      if (roll < threshold) {
        this.sm.transition(STATE.CAST);
        this._attackCd = this.config.attackCooldown * 1.2;
        this._actionLock = 1200;
        return { dx: 0, dz: 0 };
      }

      // Strafe (lateral repositioning without attacking)
      threshold += this.config.strafeChance;
      if (roll < threshold) {
        return this._tickStrafe(deltaMs, toTarget);
      }

      // Attack — start combo chain
      if (this.sm.transition(STATE.ATTACK_1)) {
        this._comboStep = 1;
        this._comboWindow = 700; // ms to chain attack2
        this._attackCd = this.config.attackCooldown;
        this._actionLock = 900;
        return { dx: 0, dz: 0 };
      }
    }

    // Cooldown active — combat idle or strafe
    if (!this.sm.isAttacking && !this.sm.isBlocking) {
      if (this._strafeTimer <= 0 && Math.random() < 0.01) {
        return this._tickStrafe(deltaMs, toTarget);
      }
      this.sm.transition(STATE.COMBAT_IDLE);
    }
    return { dx: 0, dz: 0 };
  }

  // ── Strafe ──

  private _tickStrafe(
    deltaMs: number,
    toTarget: THREE.Vector2,
  ): { dx: number; dz: number } {
    if (this._strafeTimer <= 0) {
      this._strafeDir = Math.random() > 0.5 ? 1 : -1;
      this._strafeTimer = 800 + Math.random() * 600;
    }
    this.sm.transition(STATE.WALK);
    const speed = this.config.moveSpeed * 0.6 * (deltaMs / 1000);
    // Perpendicular to target direction
    return {
      dx: -toTarget.y * this._strafeDir * speed,
      dz: toTarget.x * this._strafeDir * speed,
    };
  }

  // ── Chase (with pathfinding) ──

  private _tickChase(
    deltaMs: number,
    targetPos: THREE.Vector3,
    dist: number,
  ): { dx: number; dz: number } {
    const usesSprint = dist > this.config.attackRange * 3;
    const speed = (usesSprint ? this.config.sprintSpeed : this.config.moveSpeed) * (deltaMs / 1000);
    this.sm.transition(usesSprint ? STATE.SPRINT : STATE.RUN);

    // Try NavGrid pathfinding
    if (this.navGrid && this._pathTimer <= 0) {
      this._pathTimer = this.config.pathRecalcMs;
      const newPath = this.navGrid.findPath(this.position, targetPos);
      if (newPath && newPath.length > 0) {
        this._path = newPath;
        this._pathIdx = 0;
      } else {
        this._path = [];
      }
    }

    // Follow path waypoints
    if (this._path.length > 0 && this._pathIdx < this._path.length) {
      const wp = this._path[this._pathIdx];
      const toDx = wp.x - this.position.x;
      const toDz = wp.z - this.position.z;
      const wpDist = Math.sqrt(toDx * toDx + toDz * toDz);

      if (wpDist < 1.5) {
        // Reached waypoint, advance
        this._pathIdx++;
        if (this._pathIdx >= this._path.length) {
          this._path = [];
          // Fall through to direct movement
        } else {
          return { dx: (toDx / wpDist) * speed, dz: (toDz / wpDist) * speed };
        }
      } else {
        return { dx: (toDx / wpDist) * speed, dz: (toDz / wpDist) * speed };
      }
    }

    // Fallback: direct movement toward target
    const toDx = targetPos.x - this.position.x;
    const toDz = targetPos.z - this.position.z;
    const d = Math.sqrt(toDx * toDx + toDz * toDz);
    if (d < 0.1) return { dx: 0, dz: 0 };
    return { dx: (toDx / d) * speed, dz: (toDz / d) * speed };
  }

  // ── Patrol (idle wandering near spawn) ──

  private _tickPatrol(deltaMs: number): { dx: number; dz: number } {
    // Generate patrol points if needed
    if (this._patrolPoints.length === 0 && this.navGrid) {
      this._patrolPoints = this.navGrid.patrolPoints(
        this.spawnPosition, this.config.patrolRadius, 4,
      );
      this._patrolIdx = 0;
    }

    // No patrol points available (no navgrid) — just idle
    if (this._patrolPoints.length === 0) {
      if (this._patrolTimer <= 0) {
        // Idle for a bit, then look around
        this.sm.rest();
        this._patrolTimer = 2000 + Math.random() * 3000;
      }
      return { dx: 0, dz: 0 };
    }

    // Walk toward current patrol waypoint
    const wp = this._patrolPoints[this._patrolIdx % this._patrolPoints.length];
    const toDx = wp.x - this.position.x;
    const toDz = wp.z - this.position.z;
    const wpDist = Math.sqrt(toDx * toDx + toDz * toDz);

    if (wpDist < 1) {
      // Reached waypoint — pause, then advance
      this.sm.rest();
      if (this._patrolTimer <= 0) {
        this._patrolIdx = (this._patrolIdx + 1) % this._patrolPoints.length;
        this._patrolTimer = 1500 + Math.random() * 2000;
      }
      return { dx: 0, dz: 0 };
    }

    this.sm.transition(STATE.WALK);
    const speed = this.config.moveSpeed * 0.5 * (deltaMs / 1000);
    this.facing.set(toDx, toDz).normalize();
    return { dx: (toDx / wpDist) * speed, dz: (toDz / wpDist) * speed };
  }

  // ── Movement helpers ──

  private _moveToward(
    goal: THREE.Vector3,
    speed: number,
    deltaMs: number,
  ): { dx: number; dz: number } {
    const toDx = goal.x - this.position.x;
    const toDz = goal.z - this.position.z;
    const d = Math.sqrt(toDx * toDx + toDz * toDz);
    if (d < 1) {
      this.sm.rest();
      this.phase = "idle";
      return { dx: 0, dz: 0 };
    }
    this.sm.transition(STATE.RUN);
    this.facing.set(toDx, toDz).normalize();
    const s = speed * (deltaMs / 1000);
    return { dx: (toDx / d) * s, dz: (toDz / d) * s };
  }
}
