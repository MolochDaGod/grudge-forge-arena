/**
 * InputManager.ts
 * Unified input system for Grudge Warlords (Three.js).
 *
 * Consolidates keybindings from GrudgeBuilder hotkeys, RTS-Grudge
 * MovementController, and the grudgeRPG movement.js into one system.
 *
 * Supports modifier combos (Shift+Digit1), multiple controller modes,
 * rebindable keys, and UI context actions for inventory items.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  HOTKEY MAP — NO DUPLICATES                                        │
 * │                                                                     │
 * │  Movement:  W A S D  (A/D strafe)                                  │
 * │  Acrobatics: Space jump, Ctrl roll, Alt crouch, Shift sprint       │
 * │  Weapon Skills:  1  2  3  4  5                                     │
 * │  Class/Offhand:  Shift+1  Shift+2  Shift+3  Shift+4  Shift+5      │
 * │  Action Bar:  6  7  8  (drag-drop usable items from inventory)     │
 * │  Homebound:   9  (30 min CD — portal to camp claim flag)           │
 * │  Mode: Q cycle (combat→harvest→build), Shift+Q snap to combat      │
 * │  Panels:  C equipment, I inventory, M minimap,                     │
 * │           P professions, K skill tree, L quest log, B bags         │
 * │  Interaction: E interact/harvest/talk, Tab target, R sheathe,      │
 * │               F (unbound/free), X sit/rest                         │
 * │  Camera:  hold LMB + mouse = orbit, scroll = zoom                  │
 * │  Combat:  LMB click = select, RMB hold = block/parry               │
 * │  UI Item: (context) equip, unequip, use, drop, split, sendToCamp  │
 * └─────────────────────────────────────────────────────────────────────┘
 */

// ── Controller mode ─────────────────────────────────────────────────────────

export type ControllerMode =
  | "thirdPerson"   // standard MMO 3rd person (default)
  | "vehicle"       // mount / ship / car
  | "gunner"        // turret / cannon seat
  | "rts";          // top-down RTS camera

// ── Action names ────────────────────────────────────────────────────────────

export type ActionName =
  // Movement
  | "moveForward" | "moveBackward" | "strafeLeft" | "strafeRight"
  | "jump" | "roll" | "crouch" | "sprint"
  // Weapon skill hotbar (1-5)
  | "skill1" | "skill2" | "skill3" | "skill4" | "skill5"
  // Class / off-hand skills (Shift+1-5)
  | "classSkill1" | "classSkill2" | "classSkill3" | "classSkill4" | "classSkill5"
  // Action bar slots (6-8) — drag-drop from inventory (potions, food, bombs, deployables, weapon swaps)
  | "actionBar1" | "actionBar2" | "actionBar3"
  // Homebound portal (9) — 30 min CD, teleport to camp claim flag
  | "homebound"
  // Character mode: Q = cycle (combat→harvest→build), Shift+Q = snap to combat
  | "cycleMode" | "snapCombat"
  // Panels / toggles
  | "equipment" | "inventory" | "minimap"
  | "professions" | "skillTree" | "questLog" | "bags"
  // Interaction
  | "interact" | "tabTarget"
  // Utility
  | "sheathe" | "sitRest"
  // Mouse
  | "attack" | "block"
  // UI item context actions (triggered by UI, not raw keys — included for
  // completeness so the action bus can route them; no default keybind)
  | "uiEquip" | "uiUnequip" | "uiUse" | "uiDrop" | "uiSplitStack" | "uiSendToCamp";

// ── Default keybinding map ──────────────────────────────────────────────────
// Composite format: "Shift+Digit1" means Shift must be held when Digit1 fires.
// Simple codes ("KeyW") require NO modifier. "Mouse0"/"Mouse2" are synthetic.
// UI context actions have no keybind — they're dispatched by the inventory UI.

export type KeybindMap = Record<ActionName, string>;

export const DEFAULT_KEYBINDS: KeybindMap = {
  // ── Movement — WASD ──
  moveForward:    "KeyW",
  moveBackward:   "KeyS",
  strafeLeft:     "KeyA",
  strafeRight:    "KeyD",

  // ── Acrobatics ──
  jump:           "Space",
  roll:           "ControlLeft",
  crouch:         "AltLeft",
  sprint:         "ShiftLeft",      // held modifier — also used as combo prefix

  // ── Weapon skill hotbar 1-5 ──
  skill1:         "Digit1",
  skill2:         "Digit2",
  skill3:         "Digit3",
  skill4:         "Digit4",
  skill5:         "Digit5",

  // ── Class / off-hand skills Shift+1-5 ──
  classSkill1:    "Shift+Digit1",
  classSkill2:    "Shift+Digit2",
  classSkill3:    "Shift+Digit3",
  classSkill4:    "Shift+Digit4",
  classSkill5:    "Shift+Digit5",

  // ── Action bar 6-8 (drag-drop usable items) ──
  actionBar1:     "Digit6",
  actionBar2:     "Digit7",
  actionBar3:     "Digit8",

  // ── Homebound portal 9 (30 min CD) ──
  homebound:      "Digit9",

  // ── Character mode ──
  cycleMode:      "KeyQ",           // cycle: combat → harvest → build
  snapCombat:     "Shift+KeyQ",     // instant snap back to combat mode

  // ── Panels ──
  equipment:      "KeyC",
  inventory:      "KeyI",
  minimap:        "KeyM",
  professions:    "KeyP",
  skillTree:      "KeyK",
  questLog:       "KeyL",
  bags:           "KeyB",

  // ── Interaction ──
  interact:       "KeyE",           // interact / harvest / talk
  tabTarget:      "Tab",

  // ── Utility ──
  sheathe:        "KeyR",           // draw/sheathe weapon
  sitRest:        "KeyX",           // sit / rest / emote idle

  // ── Mouse ──
  attack:         "Mouse0",         // LMB click (not held — held = camera look)
  block:          "Mouse2",         // RMB hold = block/parry

  // ── UI context actions (no keybind — dispatched by inventory/equipment UI) ──
  uiEquip:        "",
  uiUnequip:      "",
  uiUse:          "",
  uiDrop:         "",
  uiSplitStack:   "",
  uiSendToCamp:   "",
};

// ── Input snapshot ──────────────────────────────────────────────────────────

export interface MovementSnapshot {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  isMoving: boolean;
}

export interface MouseSnapshot {
  /** LMB held — camera orbit. */
  lookHeld: boolean;
  /** Delta X since last frame (pixels). */
  dx: number;
  /** Delta Y since last frame (pixels). */
  dy: number;
  /** Scroll delta (zoom). */
  scrollDelta: number;
}

export interface InputSnapshot {
  mode: ControllerMode;
  movement: MovementSnapshot;
  mouse: MouseSnapshot;
  /** Actions triggered this frame (just-pressed). */
  actions: Partial<Record<ActionName, boolean>>;
  /** Actions currently held (sustained). */
  held: Partial<Record<ActionName, boolean>>;
  /** Double-tap tracking for double-jump / climb grab. */
  doubleTap: Partial<Record<ActionName, boolean>>;
}

// ── InputManager ────────────────────────────────────────────────────────────

export class InputManager {
  private _canvas: HTMLCanvasElement;
  private _mode: ControllerMode = "thirdPerson";
  private _binds: KeybindMap;

  // Raw key state
  private _keysDown = new Set<string>();
  private _keysJustPressed = new Set<string>();
  private _keysJustReleased = new Set<string>();

  // Mouse state
  private _mouseButtons = new Set<number>();
  private _mouseDx = 0;
  private _mouseDy = 0;
  private _scrollDelta = 0;
  private _lmbHeld = false;

  // Double-tap detection (for double-jump / climb grab)
  private _lastTapTime = new Map<string, number>();
  private _doubleTapped = new Set<string>();
  private static DOUBLE_TAP_MS = 300;

  // Reverse lookup: code → action
  private _codeToAction = new Map<string, ActionName>();

  // Bound handlers (for cleanup)
  private _handlers: { type: string; fn: EventListener }[] = [];

  constructor(canvas: HTMLCanvasElement, binds?: Partial<KeybindMap>) {
    this._canvas = canvas;
    this._binds = { ...DEFAULT_KEYBINDS, ...(binds ?? {}) };
    this._buildReverseLookup();
    this._attach();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  get mode(): ControllerMode { return this._mode; }
  set mode(m: ControllerMode) { this._mode = m; }

  /** Rebind a single action. */
  rebind(action: ActionName, code: string): void {
    this._binds[action] = code;
    this._buildReverseLookup();
  }

  /** Get current keybind map (for UI display). */
  get binds(): Readonly<KeybindMap> { return this._binds; }

  /**
   * Call once per frame BEFORE processing game logic.
   * Returns an immutable snapshot of all input state then clears per-frame deltas.
   */
  snapshot(): InputSnapshot {
    const actions: Partial<Record<ActionName, boolean>> = {};
    const held: Partial<Record<ActionName, boolean>> = {};
    const doubleTap: Partial<Record<ActionName, boolean>> = {};

    for (const code of this._keysJustPressed) {
      const action = this._codeToAction.get(code);
      if (action) actions[action] = true;
    }
    for (const code of this._keysDown) {
      const action = this._codeToAction.get(code);
      if (action) held[action] = true;
    }
    for (const code of this._doubleTapped) {
      const action = this._codeToAction.get(code);
      if (action) doubleTap[action] = true;
    }

    // Mouse buttons as synthetic actions
    if (this._mouseButtons.has(2)) {
      held.block = true;
      actions.block = true;
    }

    const forward  = this._keysDown.has(this._binds.moveForward);
    const backward = this._keysDown.has(this._binds.moveBackward);
    const left     = this._keysDown.has(this._binds.strafeLeft);
    const right    = this._keysDown.has(this._binds.strafeRight);
    const sprint   = this._keysDown.has(this._binds.sprint);

    const snap: InputSnapshot = {
      mode: this._mode,
      movement: {
        forward, backward, left, right, sprint,
        isMoving: forward || backward || left || right,
      },
      mouse: {
        lookHeld: this._lmbHeld,
        dx: this._mouseDx,
        dy: this._mouseDy,
        scrollDelta: this._scrollDelta,
      },
      actions,
      held,
      doubleTap,
    };

    // Reset per-frame deltas
    this._keysJustPressed.clear();
    this._keysJustReleased.clear();
    this._doubleTapped.clear();
    this._mouseDx = 0;
    this._mouseDy = 0;
    this._scrollDelta = 0;

    return snap;
  }

  /** Remove all event listeners. */
  dispose(): void {
    for (const { type, fn } of this._handlers) {
      (type.startsWith("mouse") || type === "wheel" || type === "contextmenu"
        ? this._canvas
        : window
      ).removeEventListener(type, fn);
    }
    this._handlers.length = 0;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _buildReverseLookup(): void {
    this._codeToAction.clear();
    for (const [action, code] of Object.entries(this._binds) as [ActionName, string][]) {
      this._codeToAction.set(code, action);
    }
  }

  private _on(target: EventTarget, type: string, fn: EventListener): void {
    target.addEventListener(type, fn);
    this._handlers.push({ type, fn });
  }

  /**
   * Build the composite code for a KeyboardEvent.
   * If Shift is held and the base code has a "Shift+" binding, return "Shift+KeyCode".
   * Modifier keys themselves (ShiftLeft/Right, ControlLeft, AltLeft) never get
   * a composite prefix — they're always emitted raw.
   */
  private _compositeCode(e: KeyboardEvent): string {
    const raw = e.code;
    // Modifier keys emit raw (sprint = ShiftLeft, roll = ControlLeft, etc.)
    if (raw.startsWith("Shift") || raw.startsWith("Control") || raw.startsWith("Alt") || raw === "Tab") {
      return raw;
    }
    // If Shift is held and there's a "Shift+<code>" binding, prefer the composite
    if (e.shiftKey && this._codeToAction.has(`Shift+${raw}`)) {
      return `Shift+${raw}`;
    }
    return raw;
  }

  private _attach(): void {
    // Keyboard
    this._on(window, "keydown", ((e: KeyboardEvent) => {
      // Prevent Tab from switching browser focus
      if (e.code === "Tab") e.preventDefault();
      // Prevent Alt from opening browser menu bar
      if (e.code.startsWith("Alt")) e.preventDefault();

      const code = this._compositeCode(e);

      if (!this._keysDown.has(code)) {
        this._keysDown.add(code);
        this._keysJustPressed.add(code);

        // Double-tap detection
        const now = performance.now();
        const last = this._lastTapTime.get(code) ?? 0;
        if (now - last < InputManager.DOUBLE_TAP_MS) {
          this._doubleTapped.add(code);
        }
        this._lastTapTime.set(code, now);
      }

      // Also track the raw code for movement (WASD must stay in _keysDown
      // even when Shift is held for sprint+strafe)
      if (code !== e.code) {
        this._keysDown.add(e.code);
      }
    }) as EventListener);

    this._on(window, "keyup", ((e: KeyboardEvent) => {
      // Remove both raw and any composite variant
      this._keysDown.delete(e.code);
      this._keysDown.delete(`Shift+${e.code}`);
      this._keysJustReleased.add(e.code);
    }) as EventListener);

    // Mouse buttons
    this._on(this._canvas, "mousedown", ((e: MouseEvent) => {
      this._mouseButtons.add(e.button);
      if (e.button === 0) this._lmbHeld = true;
      // LMB click (not hold) = attack — handled via just-pressed
      if (e.button === 0) this._keysJustPressed.add("Mouse0");
    }) as EventListener);

    this._on(this._canvas, "mouseup", ((e: MouseEvent) => {
      this._mouseButtons.delete(e.button);
      if (e.button === 0) this._lmbHeld = false;
    }) as EventListener);

    // Mouse move (camera orbit when LMB held)
    this._on(this._canvas, "mousemove", ((e: MouseEvent) => {
      if (this._lmbHeld) {
        this._mouseDx += e.movementX;
        this._mouseDy += e.movementY;
      }
    }) as EventListener);

    // Scroll wheel (zoom)
    this._on(this._canvas, "wheel", ((e: WheelEvent) => {
      this._scrollDelta += e.deltaY;
      e.preventDefault();
    }) as EventListener);

    // Suppress context menu on RMB
    this._on(this._canvas, "contextmenu", ((e: Event) => {
      e.preventDefault();
    }) as EventListener);

    // Lose focus → clear all keys
    this._on(window, "blur", (() => {
      this._keysDown.clear();
      this._mouseButtons.clear();
      this._lmbHeld = false;
    }) as EventListener);
  }
}
