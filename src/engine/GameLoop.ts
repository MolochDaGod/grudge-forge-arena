/**
 * GameLoop.ts
 * Bridges InputManager → CharacterStateMachine per frame.
 *
 * Combat model:
 *   - LMB = select / tooltip / interact (NOT attack)
 *   - Key 1 = auto-attack / combo attack from weapon skill tree
 *   - Keys 2-5 = weapon skill tree abilities
 *   - Shift+1-5 = mode-dependent:
 *       Combat mode (F toggle) → class skills / off-hand skills
 *       Harvest mode (F toggle) → profession skills (crafting, processing, refining)
 *   - RMB hold = block / parry
 *
 * Harvest mode:
 *   - Action bar auto-populates slot 1 with equipped harvesting tool
 *   - Slots 2-5 become harvest-related abilities (e.g. power swing, careful extract)
 *   - Shift+1-5 become profession skills (smelting, tanning, cooking, etc.)
 *
 * Action bar 6-8: drag-drop usable items from inventory.
 * Key 9: Homebound portal (30 min CD).
 */

import type { InputManager, InputSnapshot } from "./InputManager";
import { CharacterStateMachine, STATE } from "./CharacterStateMachine";
import type { AnimController } from "./AnimController";
import { ActionBarManager } from "./ActionBarManager";

export type PanelName = "equipment" | "inventory" | "minimap" | "characterState" | "professions" | "skillTree" | "questLog" | "bags";

export interface GameLoopCallbacks {
  // ── Panels ──
  onPanelToggle?: (panel: PanelName) => void;

  // ── Interaction ──
  onInteract?: () => void;
  onTabTarget?: () => void;
  /** LMB click on world (not held for camera) — select target, show tooltip, interact with UI. */
  onSelect?: () => void;

  // ── Combat hotbar (1-5) — weapon skill tree ──
  /** Slot 1 = auto-attack / combo from equipped weapon's skill tree. */
  onWeaponAttack?: () => void;
  /** Slots 2-5 = weapon skill tree abilities. */
  onWeaponSkill?: (slot: number) => void;

  // ── Shift+1-5 (mode-dependent) ──
  /** Combat mode: class / off-hand skills. */
  onClassSkill?: (slot: number) => void;
  /** Harvest mode: profession skills (crafting, processing, refining). */
  onProfessionSkill?: (slot: number) => void;

  // ── Harvest ──
  /** Harvest mode: tool strike (auto-populates from equipped tool). */
  onHarvestStrike?: () => void;
  /** Harvest mode: tool ability slots 2-5. */
  onHarvestSkill?: (slot: number) => void;

  // ── Action bar 6-8 (usable items) ──
  onActionBar?: (slot: number) => void;
  /** Homebound portal (9) — 30 min CD. */
  onHomebound?: () => void;

  // ── Utility ──
  onSheathe?: () => void;
  /** Fired when Q cycles mode. Receives the new mode. */
  onModeChange?: (mode: "combat" | "harvest" | "build") => void;
  onSitRest?: () => void;

  // ── Camera ──
  onCameraOrbit?: (dx: number, dy: number) => void;
  onCameraZoom?: (delta: number) => void;
}

export class GameLoop {
  private _input: InputManager;
  private _sm: CharacterStateMachine;
  private _ctrl: AnimController;
  private _cb: GameLoopCallbacks;
  private _bar: ActionBarManager;

  /** Combo step within auto-attack chain (1 → attack1, press again → attack2, again → attack3). */
  private _comboStep = 0;
  private _comboTimer = 0;
  private static COMBO_WINDOW_MS = 600;

  constructor(
    input: InputManager,
    sm: CharacterStateMachine,
    ctrl: AnimController,
    bar: ActionBarManager,
    callbacks: GameLoopCallbacks = {},
  ) {
    this._input = input;
    this._sm = sm;
    this._ctrl = ctrl;
    this._bar = bar;
    this._cb = callbacks;
  }

  get isCombatMode(): boolean { return this._bar.isCombatMode; }
  get actionBar(): ActionBarManager { return this._bar; }

  tick(deltaMs: number): void {
    const snap = this._input.snapshot();
    this._sm.update(deltaMs);
    this._bar.update(deltaMs);

    switch (snap.mode) {
      case "thirdPerson": this._tickThirdPerson(snap, deltaMs); break;
      case "vehicle":     this._tickVehicle(snap, deltaMs);     break;
      case "rts":         this._tickRTS(snap, deltaMs);         break;
      case "gunner":      this._tickGunner(snap, deltaMs);      break;
    }

    // Camera (shared)
    if (snap.mouse.lookHeld && (snap.mouse.dx || snap.mouse.dy)) {
      this._cb.onCameraOrbit?.(snap.mouse.dx, snap.mouse.dy);
    }
    if (snap.mouse.scrollDelta) {
      this._cb.onCameraZoom?.(snap.mouse.scrollDelta);
    }

    // Panel toggles (shared)
    if (snap.actions.equipment)      this._cb.onPanelToggle?.("equipment");
    if (snap.actions.inventory)      this._cb.onPanelToggle?.("inventory");
    if (snap.actions.minimap)        this._cb.onPanelToggle?.("minimap");
    if (snap.actions.characterState) this._cb.onPanelToggle?.("characterState");
    if (snap.actions.professions)    this._cb.onPanelToggle?.("professions");
    if (snap.actions.skillTree)      this._cb.onPanelToggle?.("skillTree");
    if (snap.actions.questLog)       this._cb.onPanelToggle?.("questLog");
    if (snap.actions.bags)           this._cb.onPanelToggle?.("bags");
  }

  // ── Third Person Mode ──────────────────────────────────────────────────────

  private _tickThirdPerson(snap: InputSnapshot, deltaMs: number): void {
    // ── Q = cycle mode (combat → harvest → build) ──
    if (snap.actions.cycleMode) {
      const newMode = this._bar.cycleMode();
      this._comboStep = 0;
      this._comboTimer = 0;
      this._cb.onModeChange?.(newMode);
    }
    // ── Shift+Q = snap to combat ──
    if (snap.actions.snapCombat) {
      this._bar.snapToCombat();
      this._comboStep = 0;
      this._comboTimer = 0;
      this._cb.onModeChange?.("combat");
    }

    // ── Movement ──
    if (this._sm.canMove) {
      if (snap.movement.isMoving) {
        this._sm.transition(snap.movement.sprint ? STATE.SPRINT : STATE.RUN);
      } else if (!this._sm.isBlocking && !this._sm.isAttacking) {
        this._sm.rest();
      }
    }

    // ── Jump (Space, ×2 = double-jump / climb grab) ──
    if (snap.actions.jump) {
      this._sm.transition(STATE.JUMP, !!snap.doubleTap.jump);
    }

    // ── Roll (Ctrl) ──
    if (snap.actions.roll) this._sm.transition(STATE.ROLL);

    // ── Crouch (Alt toggle) ──
    if (snap.actions.crouch) {
      this._sm.transition(this._sm.state === STATE.CROUCH ? STATE.IDLE : STATE.CROUCH);
    }

    // ── Block / Parry (RMB held) ──
    if (snap.held.block) {
      this._sm.transition(STATE.BLOCK);
    } else if (this._sm.state === STATE.BLOCK) {
      this._sm.rest();
    }

    // ── LMB = SELECT / TOOLTIP / INTERACT (no combat) ──
    if (snap.actions.attack && !snap.mouse.lookHeld) {
      this._cb.onSelect?.();
    }

    // ── Keys 1-5: mode-dependent main bar ──
    switch (this._bar.mode) {
      case "combat":  this._tickCombatBar(snap, deltaMs); break;
      case "harvest": this._tickHarvestBar(snap); break;
      case "build":   this._tickBuildBar(snap); break;
    }

    // ── Shift+1-5: mode-dependent secondary bar (with CD check) ──
    for (let i = 0; i < 5; i++) {
      const key = `classSkill${i + 1}` as keyof typeof snap.actions;
      if (snap.actions[key]) {
        const skill = this._bar.useSecondaryBarSlot(i);
        if (skill) {
          switch (this._bar.mode) {
            case "combat":  this._sm.transition(STATE.CAST); this._cb.onClassSkill?.(i + 1); break;
            case "harvest": this._cb.onProfessionSkill?.(i + 1); break;
            case "build":   /* build category / upgrade — future callback */ break;
          }
        }
      }
    }

    // ── Action bar 6-8 (usable items with stack consume) ──
    if (snap.actions.actionBar1) { const item = this._bar.useItemSlot(0); if (item) this._cb.onActionBar?.(1); }
    if (snap.actions.actionBar2) { const item = this._bar.useItemSlot(1); if (item) this._cb.onActionBar?.(2); }
    if (snap.actions.actionBar3) { const item = this._bar.useItemSlot(2); if (item) this._cb.onActionBar?.(3); }

    // ── Homebound portal 9 (30 min CD check) ──
    if (snap.actions.homebound) {
      if (this._bar.useHomebound()) {
        this._sm.transition(STATE.CAST);
        this._cb.onHomebound?.();
      }
    }

    // ── Utility ──
    if (snap.actions.sheathe) this._cb.onSheathe?.();
    if (snap.actions.sitRest) this._cb.onSitRest?.();

    // ── Interact (E) ──
    if (snap.actions.interact) this._cb.onInteract?.();

    // ── Tab Target ──
    if (snap.actions.tabTarget) this._cb.onTabTarget?.();
  }

  // ── Combat bar (keys 1-5 in combat mode) ──────────────────────────────────
  //  1 = auto-attack with combo chain from weapon skill tree
  //  2-5 = weapon skill tree abilities

  private _tickCombatBar(snap: InputSnapshot, deltaMs: number): void {
    // Key 1 = auto-attack / combo chain (CD check on slot 0)
    this._comboTimer = Math.max(0, this._comboTimer - deltaMs);
    if (snap.actions.skill1) {
      const skill = this._bar.useMainBarSlot(0);
      if (skill) {
        if (this._comboTimer > 0 && this._comboStep === 1) {
          this._sm.transition(STATE.ATTACK_2);
          this._comboStep = 2;
        } else if (this._comboTimer > 0 && this._comboStep === 2) {
          this._sm.transition(STATE.ATTACK_3);
          this._comboStep = 0;
        } else {
          this._sm.transition(STATE.ATTACK_1);
          this._comboStep = 1;
        }
        this._comboTimer = GameLoop.COMBO_WINDOW_MS;
        this._cb.onWeaponAttack?.();
      }
    }

    // Keys 2-5 = weapon skill tree abilities (CD check per slot)
    if (snap.actions.skill2 && this._bar.useMainBarSlot(1)) { this._sm.transition(STATE.ATTACK_2); this._cb.onWeaponSkill?.(2); }
    if (snap.actions.skill3 && this._bar.useMainBarSlot(2)) { this._sm.transition(STATE.ATTACK_3); this._cb.onWeaponSkill?.(3); }
    if (snap.actions.skill4 && this._bar.useMainBarSlot(3)) { this._sm.transition(STATE.CAST);     this._cb.onWeaponSkill?.(4); }
    if (snap.actions.skill5 && this._bar.useMainBarSlot(4)) { this._sm.transition(STATE.CAST);     this._cb.onWeaponSkill?.(5); }
  }

  // ── Harvest bar (keys 1-5 in harvest mode) ───────────────────────────────
  //  1 = tool strike (auto-populated from equipped tool)
  //  2-5 = harvest abilities (power swing, careful extract, etc.)

  private _tickHarvestBar(snap: InputSnapshot): void {
    if (snap.actions.skill1 && this._bar.useMainBarSlot(0)) { this._sm.transition(STATE.HARVEST); this._cb.onHarvestStrike?.(); }
    if (snap.actions.skill2 && this._bar.useMainBarSlot(1)) { this._sm.transition(STATE.HARVEST); this._cb.onHarvestSkill?.(2); }
    if (snap.actions.skill3 && this._bar.useMainBarSlot(2)) { this._sm.transition(STATE.HARVEST); this._cb.onHarvestSkill?.(3); }
    if (snap.actions.skill4 && this._bar.useMainBarSlot(3)) { this._sm.transition(STATE.HARVEST); this._cb.onHarvestSkill?.(4); }
    if (snap.actions.skill5 && this._bar.useMainBarSlot(4)) { this._sm.transition(STATE.HARVEST); this._cb.onHarvestSkill?.(5); }
  }

  // ── Build bar (keys 1-5 in build mode) ─────────────────────────────────
  //  1 = place/build   2-5 = build actions (rotate, upgrade, demolish, etc.)

  private _tickBuildBar(snap: InputSnapshot): void {
    for (let i = 0; i < 5; i++) {
      const key = `skill${i + 1}` as keyof typeof snap.actions;
      if (snap.actions[key]) {
        this._bar.useMainBarSlot(i);
        // Build mode doesn't trigger combat state machine — handled by build UI
      }
    }
  }

  // ── Vehicle / Mount Mode ─────────────────────────────────────────────────

  private _tickVehicle(snap: InputSnapshot, _deltaMs: number): void {
    if (snap.actions.interact) this._cb.onInteract?.();
  }

  // ── RTS Mode ───────────────────────────────────────────────────────────

  private _tickRTS(snap: InputSnapshot, _deltaMs: number): void {
    if (snap.actions.tabTarget) this._cb.onTabTarget?.();
  }

  // ── Gunner Mode ────────────────────────────────────────────────────────

  private _tickGunner(snap: InputSnapshot, _deltaMs: number): void {
    if (snap.actions.interact) this._cb.onInteract?.();
  }
}
