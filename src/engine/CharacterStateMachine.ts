/**
 * CharacterStateMachine.ts
 * Data-driven FSM for Grudge Warlords characters (Three.js).
 *
 * Ported from the BabylonJS grudgeRPG reference, extended with CROUCH,
 * JUMP, SPRINT, DODGE, and HARVEST states for full third-person coverage.
 *
 * Usage:
 *   const sm = new CharacterStateMachine(ctrl);
 *   sm.transition('run');
 *   sm.transition('attack1');   // blocked if in hit/dead
 *   sm.update(deltaMs);         // fires one-shot finish, queued combos
 */

import type { AnimController, PlayOptions } from "./AnimController";

// ── State enum ──────────────────────────────────────────────────────────────

export const STATE = Object.freeze({
  IDLE:         "idle",
  WALK:         "walk",
  RUN:          "run",
  SPRINT:       "sprint",
  COMBAT_IDLE:  "combatIdle",
  ATTACK_1:     "attack1",
  ATTACK_2:     "attack2",
  ATTACK_3:     "attack3",
  BLOCK:        "block",
  HIT:          "hit",
  DEATH:        "death",
  CAST:         "cast",
  ROLL:         "roll",
  DODGE:        "dodge",
  CROUCH:       "crouch",
  JUMP:         "jump",
  JUMP_LOOP:    "jumpLoop",
  JUMP_DOWN:    "jumpDown",
  HARVEST:      "harvest",
} as const);

export type StateName = (typeof STATE)[keyof typeof STATE];

// ── State definition ────────────────────────────────────────────────────────

interface StateDef {
  /** Key used in AnimController.play(). */
  animKey: string;
  /** Whether the animation loops. */
  loop: boolean;
  /** Duration in ms for one-shot animations (auto-returns to rest after). */
  duration?: number;
  /** Cannot be interrupted except by HIT / DEATH. */
  blocking: boolean;
  /** Set of states this can transition FROM. null = any state. */
  from: ReadonlySet<string> | null;
  /** Playback speed override. */
  speed?: number;
}

// ── Transition table ────────────────────────────────────────────────────────

const STATE_TABLE: Record<string, StateDef> = {
  [STATE.IDLE]: {
    animKey: "idle", loop: true, blocking: false, from: null,
  },
  [STATE.WALK]: {
    animKey: "walk", loop: true, blocking: false,
    from: new Set([STATE.IDLE, STATE.COMBAT_IDLE, STATE.WALK, STATE.RUN, STATE.SPRINT, STATE.CROUCH]),
  },
  [STATE.RUN]: {
    animKey: "run", loop: true, blocking: false,
    from: new Set([STATE.IDLE, STATE.WALK, STATE.RUN, STATE.COMBAT_IDLE, STATE.SPRINT]),
  },
  [STATE.SPRINT]: {
    animKey: "sprint", loop: true, blocking: false, speed: 1.5,
    from: new Set([STATE.IDLE, STATE.WALK, STATE.RUN, STATE.COMBAT_IDLE]),
  },
  [STATE.COMBAT_IDLE]: {
    animKey: "combatIdle", loop: true, blocking: false, from: null,
  },
  [STATE.ATTACK_1]: {
    animKey: "attack1", loop: false, duration: 900, blocking: true,
    from: new Set([STATE.IDLE, STATE.WALK, STATE.RUN, STATE.COMBAT_IDLE]),
  },
  [STATE.ATTACK_2]: {
    animKey: "attack2", loop: false, duration: 800, blocking: true,
    from: new Set([STATE.ATTACK_1]),  // chained combo
  },
  [STATE.ATTACK_3]: {
    animKey: "attack3", loop: false, duration: 1100, blocking: true,
    from: new Set([STATE.ATTACK_2]),  // chained combo
  },
  [STATE.BLOCK]: {
    animKey: "block", loop: true, blocking: false,
    from: new Set([STATE.IDLE, STATE.COMBAT_IDLE, STATE.WALK]),
  },
  [STATE.HIT]: {
    animKey: "hit", loop: false, duration: 600, blocking: true,
    from: null,  // always interruptible by HIT
  },
  [STATE.DEATH]: {
    animKey: "death", loop: false, duration: 3000, blocking: true,
    from: null,  // always allowed
  },
  [STATE.CAST]: {
    animKey: "cast", loop: false, duration: 1200, blocking: true,
    from: new Set([STATE.IDLE, STATE.COMBAT_IDLE]),
  },
  [STATE.ROLL]: {
    animKey: "roll", loop: false, duration: 700, blocking: true,
    from: new Set([STATE.IDLE, STATE.WALK, STATE.RUN, STATE.COMBAT_IDLE, STATE.SPRINT]),
  },
  [STATE.DODGE]: {
    animKey: "dodge", loop: false, duration: 500, blocking: true,
    from: new Set([STATE.IDLE, STATE.WALK, STATE.RUN, STATE.COMBAT_IDLE, STATE.BLOCK]),
  },
  [STATE.CROUCH]: {
    animKey: "crouch", loop: true, blocking: false,
    from: new Set([STATE.IDLE, STATE.WALK, STATE.COMBAT_IDLE]),
  },
  [STATE.JUMP]: {
    animKey: "jump", loop: false, duration: 600, blocking: true,
    from: new Set([STATE.IDLE, STATE.WALK, STATE.RUN, STATE.SPRINT, STATE.COMBAT_IDLE]),
  },
  [STATE.JUMP_LOOP]: {
    animKey: "jumpLoop", loop: true, blocking: false,
    from: new Set([STATE.JUMP]),
  },
  [STATE.JUMP_DOWN]: {
    animKey: "jumpDown", loop: false, duration: 400, blocking: true,
    from: new Set([STATE.JUMP, STATE.JUMP_LOOP]),
  },
  [STATE.HARVEST]: {
    animKey: "harvest", loop: false, duration: 1000, blocking: true,
    from: new Set([STATE.IDLE, STATE.COMBAT_IDLE]),
  },
};

// ── CharacterStateMachine ───────────────────────────────────────────────────

export type StateEnterCallback = (state: string, prev: string | null) => void;

export class CharacterStateMachine {
  private _ctrl: AnimController;
  private _onEnter: StateEnterCallback | null;
  private _blendTime: number;

  private _current: string | null = null;
  private _currentDef: StateDef | null = null;
  private _timer = 0;
  private _queued: string | null = null;
  private _dead = false;

  constructor(
    ctrl: AnimController,
    onEnter: StateEnterCallback | null = null,
    blendTime = 0.12,
  ) {
    this._ctrl = ctrl;
    this._onEnter = onEnter;
    this._blendTime = blendTime;
  }

  // ── Public getters ─────────────────────────────────────────────────────────

  get state(): string | null { return this._current; }
  get isDead(): boolean { return this._dead; }
  get isBlocking(): boolean { return !!this._currentDef?.blocking && this._timer > 0; }
  get canMove(): boolean { return !this.isBlocking || this._current === STATE.BLOCK; }

  get isAttacking(): boolean {
    return this._current === STATE.ATTACK_1 ||
           this._current === STATE.ATTACK_2 ||
           this._current === STATE.ATTACK_3;
  }

  get isInCombat(): boolean {
    return this._current === STATE.COMBAT_IDLE || this.isAttacking;
  }

  // ── Transitions ────────────────────────────────────────────────────────────

  /**
   * Request a state transition.
   * @returns true if the transition occurred, false if blocked/queued.
   */
  transition(nextState: string, force = false): boolean {
    if (this._dead && nextState !== STATE.DEATH) return false;

    const def = STATE_TABLE[nextState];
    if (!def) {
      console.warn(`[CharacterStateMachine] Unknown state: "${nextState}"`);
      return false;
    }

    const alwaysInterrupt = nextState === STATE.DEATH || nextState === STATE.HIT;

    // FROM guard
    if (!alwaysInterrupt && !force && def.from !== null) {
      if (!def.from.has(this._current ?? "")) {
        if (this.isBlocking) this._queued = nextState;
        return false;
      }
    }

    // Blocking guard
    if (!alwaysInterrupt && !force && this.isBlocking) {
      this._queued = nextState;
      return false;
    }

    this._applyTransition(nextState, def);
    return true;
  }

  /** Transition to IDLE unless dead or blocking. */
  rest(): void {
    if (!this.isBlocking && !this._dead) this.transition(STATE.IDLE);
  }

  /**
   * Call once per frame with delta in milliseconds.
   * Handles one-shot timer expiry → queued transition or rest.
   */
  update(deltaMs: number): void {
    if (!this._currentDef || this._currentDef.loop || this._timer <= 0) return;

    this._timer -= deltaMs;
    if (this._timer <= 0) {
      this._timer = 0;
      const next = this._queued || (this._dead ? null : STATE.COMBAT_IDLE);
      this._queued = null;
      if (next) {
        const nextDef = STATE_TABLE[next];
        if (nextDef) this._applyTransition(next, nextDef);
      }
    }
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _applyTransition(nextState: string, def: StateDef): void {
    const prev = this._current;

    this._current = nextState;
    this._currentDef = def;
    this._timer = def.duration ?? 0;
    if (nextState === STATE.DEATH) this._dead = true;

    const playOpts: PlayOptions = {
      loop: def.loop,
      blendTime: this._blendTime,
      speed: def.speed ?? 1.0,
    };
    this._ctrl.play(def.animKey, playOpts);

    if (this._onEnter) this._onEnter(nextState, prev);
  }
}
