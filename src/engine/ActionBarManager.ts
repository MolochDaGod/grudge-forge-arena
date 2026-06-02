/**
 * ActionBarManager.ts
 * Manages all action bar state for Grudge Warlords.
 *
 * ┌───────────────────────────────────────────────────────────────────┐
 * │  COMBAT MODE (F toggle ON — default)                             │
 * │  [1] Auto-attack / combo (weapon skill tree base)                │
 * │  [2] Weapon skill 2   [3] Weapon skill 3                        │
 * │  [4] Weapon skill 4   [5] Weapon skill 5                        │
 * │  [Shift+1-5] Class / off-hand skills                            │
 * ├───────────────────────────────────────────────────────────────────┤
 * │  HARVEST MODE (F toggle OFF)                                     │
 * │  [1] Tool strike (auto-populated from equipped tool)             │
 * │  [2] Tool ability 2   [3] Tool ability 3                        │
 * │  [4] Tool ability 4   [5] Tool ability 5                        │
 * │  [Shift+1-5] Profession skills (crafting, processing, refining) │
 * ├───────────────────────────────────────────────────────────────────┤
 * │  SHARED (both modes)                                             │
 * │  [6] [7] [8] Item bar — drag-drop from inventory                │
 * │  [9] Homebound portal (30 min CD)                                │
 * └───────────────────────────────────────────────────────────────────┘
 */

// ── Slot types ──────────────────────────────────────────────────────────────

export interface SkillSlot {
  /** Unique skill ID from weapon/class/profession skill tree. */
  skillId: string;
  /** Display name. */
  name: string;
  /** Icon path or URL. */
  icon: string;
  /** Cooldown duration in ms (0 = no CD). */
  cooldownMs: number;
  /** Remaining cooldown in ms (ticks down each frame). */
  cooldownRemaining: number;
  /** Whether this slot is currently usable. */
  enabled: boolean;
  /** Animation state key to trigger (e.g. "attack1", "cast", "harvest"). */
  animKey?: string;
  /** Damage / heal value for tooltip. */
  value?: number;
  /** Element type for tooltip. */
  element?: string;
}

export interface ItemSlot {
  /** Inventory item ID (null = empty slot, drag something here). */
  itemId: string | null;
  /** Display name. */
  name: string;
  /** Icon path or URL. */
  icon: string;
  /** Stack count (potions, bombs, food). */
  quantity: number;
  /** Cooldown duration in ms. */
  cooldownMs: number;
  /** Remaining cooldown in ms. */
  cooldownRemaining: number;
  /** Item type for context (potion, food, bomb, deployable, weapon, equipment). */
  itemType: string;
}

export interface HomeboundSlot {
  /** Bound location name (camp claim flag). */
  locationName: string;
  /** Island/zone ID. */
  locationId: string | null;
  /** 30-minute cooldown in ms (1_800_000). */
  cooldownMs: number;
  cooldownRemaining: number;
  icon: string;
}

// ── Bar state ───────────────────────────────────────────────────────────────

export type CharacterMode = "combat" | "harvest" | "build";

const MODE_ORDER: CharacterMode[] = ["combat", "harvest", "build"];

export interface ActionBarState {
  /** Combat mode: weapon skill slots 1-5. Slot 0 = auto-attack/combo. */
  combatBar: SkillSlot[];
  /** Harvest mode: tool ability slots 1-5. Slot 0 = tool strike. */
  harvestBar: SkillSlot[];
  /** Build mode: building ability slots 1-5. Slot 0 = place/build. */
  buildBar: SkillSlot[];
  /** Shift+1-5 in combat mode: class / off-hand skills. */
  classBar: SkillSlot[];
  /** Shift+1-5 in harvest mode: profession skills. */
  professionBar: SkillSlot[];
  /** Shift+1-5 in build mode: build category / upgrade skills. */
  buildSecondaryBar: SkillSlot[];
  /** Slots 6-8: drag-drop usable items. */
  itemBar: [ItemSlot, ItemSlot, ItemSlot];
  /** Slot 9: homebound portal. */
  homebound: HomeboundSlot;
  /** Current character mode. */
  mode: CharacterMode;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function emptySkill(name = "Empty"): SkillSlot {
  return { skillId: "", name, icon: "", cooldownMs: 0, cooldownRemaining: 0, enabled: false };
}

function emptyItem(): ItemSlot {
  return { itemId: null, name: "Empty", icon: "", quantity: 0, cooldownMs: 0, cooldownRemaining: 0, itemType: "" };
}

const HOMEBOUND_CD_MS = 30 * 60 * 1000; // 30 minutes

// ── ActionBarManager ────────────────────────────────────────────────────────

export class ActionBarManager {
  private _state: ActionBarState;

  constructor() {
    this._state = {
      combatBar: Array.from({ length: 5 }, (_, i) => emptySkill(i === 0 ? "Auto Attack" : `Weapon ${i + 1}`)),
      harvestBar: Array.from({ length: 5 }, (_, i) => emptySkill(i === 0 ? "Tool Strike" : `Harvest ${i + 1}`)),
      buildBar: Array.from({ length: 5 }, (_, i) => emptySkill(i === 0 ? "Place" : `Build ${i + 1}`)),
      classBar: Array.from({ length: 5 }, (_, i) => emptySkill(`Class ${i + 1}`)),
      professionBar: Array.from({ length: 5 }, (_, i) => emptySkill(`Profession ${i + 1}`)),
      buildSecondaryBar: Array.from({ length: 5 }, (_, i) => emptySkill(`Build Cat ${i + 1}`)),
      itemBar: [emptyItem(), emptyItem(), emptyItem()],
      homebound: {
        locationName: "Unbound",
        locationId: null,
        cooldownMs: HOMEBOUND_CD_MS,
        cooldownRemaining: 0,
        icon: "",
      },
      mode: "combat",
    };
  }

  get state(): Readonly<ActionBarState> { return this._state; }
  get mode(): CharacterMode { return this._state.mode; }
  get isCombatMode(): boolean { return this._state.mode === "combat"; }
  get isHarvestMode(): boolean { return this._state.mode === "harvest"; }
  get isBuildMode(): boolean { return this._state.mode === "build"; }

  // ── Mode switching ─────────────────────────────────────────────────────────

  /** Cycle: combat → harvest → build → combat. */
  cycleMode(): CharacterMode {
    const idx = MODE_ORDER.indexOf(this._state.mode);
    this._state.mode = MODE_ORDER[(idx + 1) % MODE_ORDER.length];
    return this._state.mode;
  }

  /** Snap directly to combat mode. */
  snapToCombat(): void {
    this._state.mode = "combat";
  }

  /** Set mode directly. */
  setMode(mode: CharacterMode): void {
    this._state.mode = mode;
  }

  // ── Get active bars (for UI rendering) ─────────────────────────────────────

  /** The 5 skill slots currently shown in the main bar (1-5). */
  get activeMainBar(): readonly SkillSlot[] {
    switch (this._state.mode) {
      case "combat":  return this._state.combatBar;
      case "harvest": return this._state.harvestBar;
      case "build":   return this._state.buildBar;
    }
  }

  /** The 5 skill slots currently shown in the secondary bar (Shift+1-5). */
  get activeSecondaryBar(): readonly SkillSlot[] {
    switch (this._state.mode) {
      case "combat":  return this._state.classBar;
      case "harvest": return this._state.professionBar;
      case "build":   return this._state.buildSecondaryBar;
    }
  }

  // ── Populate from weapon skill tree ────────────────────────────────────────

  /**
   * Load weapon skill tree into combat bar slots 1-5.
   * Slot 0 is always the auto-attack/combo; slots 1-4 are skill tree abilities.
   * @param weaponType - e.g. "sword", "axe", "staff"
   * @param skills - array of up to 5 skill definitions from the weapon skill tree
   */
  loadWeaponSkills(weaponType: string, skills: Partial<SkillSlot>[]): void {
    for (let i = 0; i < 5; i++) {
      const src = skills[i];
      if (src) {
        Object.assign(this._state.combatBar[i], {
          ...src,
          cooldownRemaining: 0,
          enabled: true,
        });
      } else {
        Object.assign(this._state.combatBar[i], emptySkill(i === 0 ? "Auto Attack" : `Weapon ${i + 1}`));
      }
    }
  }

  // ── Populate from equipped harvest tool ────────────────────────────────────

  /**
   * Auto-populate harvest bar from the equipped tool.
   * Slot 0 = base tool strike, slots 1-4 = tool-specific abilities.
   * @param toolType - e.g. "pickaxe", "axe", "sickle", "fishing_rod"
   * @param toolName - display name of the equipped tool
   * @param toolIcon - icon path
   * @param abilities - tool-specific abilities (up to 4)
   */
  loadHarvestTool(toolType: string, toolName: string, toolIcon: string, abilities: Partial<SkillSlot>[] = []): void {
    // Slot 0: base tool strike
    Object.assign(this._state.harvestBar[0], {
      skillId: `${toolType}_strike`,
      name: toolName,
      icon: toolIcon,
      cooldownMs: 0,
      cooldownRemaining: 0,
      enabled: true,
      animKey: "harvest",
    });

    // Slots 1-4: tool abilities
    for (let i = 1; i < 5; i++) {
      const src = abilities[i - 1];
      if (src) {
        Object.assign(this._state.harvestBar[i], {
          ...src,
          cooldownRemaining: 0,
          enabled: true,
        });
      } else {
        Object.assign(this._state.harvestBar[i], emptySkill(`Harvest ${i + 1}`));
      }
    }
  }

  /** Clear harvest bar (no tool equipped). */
  clearHarvestTool(): void {
    for (let i = 0; i < 5; i++) {
      Object.assign(this._state.harvestBar[i], emptySkill(i === 0 ? "No Tool" : `Harvest ${i + 1}`));
    }
  }

  // ── Populate class skills ──────────────────────────────────────────────────

  loadClassSkills(skills: Partial<SkillSlot>[]): void {
    for (let i = 0; i < 5; i++) {
      const src = skills[i];
      if (src) {
        Object.assign(this._state.classBar[i], { ...src, cooldownRemaining: 0, enabled: true });
      } else {
        Object.assign(this._state.classBar[i], emptySkill(`Class ${i + 1}`));
      }
    }
  }

  // ── Populate profession skills ─────────────────────────────────────────────

  loadProfessionSkills(skills: Partial<SkillSlot>[]): void {
    for (let i = 0; i < 5; i++) {
      const src = skills[i];
      if (src) {
        Object.assign(this._state.professionBar[i], { ...src, cooldownRemaining: 0, enabled: true });
      } else {
        Object.assign(this._state.professionBar[i], emptySkill(`Profession ${i + 1}`));
      }
    }
  }

  // ── Item bar 6-8 (drag-drop from inventory) ────────────────────────────────

  /**
   * Assign an item to an action bar slot (0-2 → keys 6-8).
   * Supports: potions, food, bombs, deployables, weapon swaps, equipment.
   */
  setItemSlot(slotIndex: 0 | 1 | 2, item: Partial<ItemSlot>): void {
    Object.assign(this._state.itemBar[slotIndex], {
      ...item,
      cooldownRemaining: 0,
    });
  }

  /** Clear an item slot. */
  clearItemSlot(slotIndex: 0 | 1 | 2): void {
    Object.assign(this._state.itemBar[slotIndex], emptyItem());
  }

  /**
   * Use an item from the action bar. Returns the item data if usable, null if
   * on cooldown / empty / quantity 0.
   */
  useItemSlot(slotIndex: 0 | 1 | 2): ItemSlot | null {
    const slot = this._state.itemBar[slotIndex];
    if (!slot.itemId || slot.cooldownRemaining > 0) return null;
    if (slot.quantity <= 0) return null;

    // Consume stack
    slot.quantity -= 1;
    // Start cooldown
    slot.cooldownRemaining = slot.cooldownMs;
    // Auto-clear when stack depleted
    if (slot.quantity <= 0) {
      const used = { ...slot };
      this.clearItemSlot(slotIndex);
      return used;
    }
    return { ...slot };
  }

  // ── Homebound portal (slot 9) ──────────────────────────────────────────────

  bindHomebound(locationName: string, locationId: string, icon = ""): void {
    this._state.homebound.locationName = locationName;
    this._state.homebound.locationId = locationId;
    if (icon) this._state.homebound.icon = icon;
  }

  /**
   * Attempt to use homebound portal. Returns true if cast started.
   * Returns false if on cooldown or not bound.
   */
  useHomebound(): boolean {
    const hb = this._state.homebound;
    if (!hb.locationId || hb.cooldownRemaining > 0) return false;
    hb.cooldownRemaining = hb.cooldownMs;
    return true;
  }

  // ── Cooldown tick (call every frame) ───────────────────────────────────────

  /**
   * Tick all cooldowns. Call once per frame with delta in ms.
   */
  update(deltaMs: number): void {
    // Combat bar
    for (const slot of this._state.combatBar) {
      if (slot.cooldownRemaining > 0) slot.cooldownRemaining = Math.max(0, slot.cooldownRemaining - deltaMs);
    }
    // Harvest bar
    for (const slot of this._state.harvestBar) {
      if (slot.cooldownRemaining > 0) slot.cooldownRemaining = Math.max(0, slot.cooldownRemaining - deltaMs);
    }
    // Class bar
    for (const slot of this._state.classBar) {
      if (slot.cooldownRemaining > 0) slot.cooldownRemaining = Math.max(0, slot.cooldownRemaining - deltaMs);
    }
    // Profession bar
    for (const slot of this._state.professionBar) {
      if (slot.cooldownRemaining > 0) slot.cooldownRemaining = Math.max(0, slot.cooldownRemaining - deltaMs);
    }
    // Item bar
    for (const slot of this._state.itemBar) {
      if (slot.cooldownRemaining > 0) slot.cooldownRemaining = Math.max(0, slot.cooldownRemaining - deltaMs);
    }
    // Homebound
    if (this._state.homebound.cooldownRemaining > 0) {
      this._state.homebound.cooldownRemaining = Math.max(0, this._state.homebound.cooldownRemaining - deltaMs);
    }
  }

  // ── Skill use with CD check ────────────────────────────────────────────────

  /**
   * Try to use a skill from the active main bar (1-5).
   * Returns the skill if usable, null if on cooldown or disabled.
   */
  useMainBarSlot(slotIndex: number): SkillSlot | null {
    const bar = this.activeMainBar as SkillSlot[];
    const slot = bar[slotIndex];
    if (!slot?.enabled || slot.cooldownRemaining > 0) return null;
    slot.cooldownRemaining = slot.cooldownMs;
    return { ...slot };
  }

  /**
   * Try to use a skill from the active secondary bar (Shift+1-5).
   */
  useSecondaryBarSlot(slotIndex: number): SkillSlot | null {
    const bar = this.activeSecondaryBar as SkillSlot[];
    const slot = bar[slotIndex];
    if (!slot?.enabled || slot.cooldownRemaining > 0) return null;
    slot.cooldownRemaining = slot.cooldownMs;
    return { ...slot };
  }
}
