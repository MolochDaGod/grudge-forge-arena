/**
 * weaponSkills.ts
 *
 * Weapon mastery, skill trees, off-hand modifiers, and hotbar logic.
 *
 * Design:
 *   - Every weapon TYPE has its own mastery track (0-100 XP per tier).
 *   - Every weapon TYPE has a skill tree with 3 tiers of unlockable skills.
 *   - Off-hand items (shields, relics, tomes) add passive modifiers that
 *     affect the main-hand weapon's skills.
 *   - Shields additionally override hotbar slots 1-2 while RMB is held.
 *   - No class restrictions — any class can equip any weapon.
 */

import type { WeaponType } from "./weapons";

// ── Skill element system ──────────────────────────────────────────────────────

export type Element =
  | "physical" | "fire" | "ice" | "poison" | "arcane"
  | "lightning" | "dark" | "holy" | "heal";

export const ELEMENT_ICONS: Record<Element, string> = {
  physical:  "⚔",
  fire:      "🔥",
  ice:       "❄",
  poison:    "☠",
  arcane:    "✨",
  lightning: "⚡",
  dark:      "🌑",
  holy:      "☀",
  heal:      "💚",
};

export const ELEMENT_COLORS: Record<Element, string> = {
  physical:  "#b8b8c0",
  fire:      "#ff6b35",
  ice:       "#00d4ff",
  poison:    "#44ff44",
  arcane:    "#cc44ff",
  lightning: "#ffee44",
  dark:      "#8844cc",
  holy:      "#fff080",
  heal:      "#44ff88",
};

// ── Skill definition ──────────────────────────────────────────────────────────

export interface SkillDef {
  key:      string;
  name:     string;
  element:  Element;
  damage:   number;
  range:    number;
  cooldown: number;
  description: string;
}

export const SKILL_CATALOG: Record<string, SkillDef> = {
  // Melee
  quickSwing:      { key: "quickSwing",      name: "Quick Swing",      element: "physical",  damage: 10, range: 3,  cooldown: 0,  description: "Fast melee strike" },
  heavySwing:      { key: "heavySwing",      name: "Heavy Swing",      element: "physical",  damage: 25, range: 3,  cooldown: 3,  description: "Powerful overhead hit" },
  iceSwing:        { key: "iceSwing",        name: "Ice Swing",        element: "ice",       damage: 18, range: 3,  cooldown: 5,  description: "Frost-coated slash" },
  lightningSwing:  { key: "lightningSwing",  name: "Lightning Swing",  element: "lightning", damage: 20, range: 3,  cooldown: 5,  description: "Electrified strike" },
  darkSwing:       { key: "darkSwing",       name: "Dark Swing",       element: "dark",      damage: 22, range: 3,  cooldown: 6,  description: "Shadow-infused cleave" },
  poisonStrike:    { key: "poisonStrike",    name: "Poison Strike",    element: "poison",    damage: 12, range: 3,  cooldown: 4,  description: "Venomous stab, DOT" },
  arcaneSwing:     { key: "arcaneSwing",     name: "Arcane Swing",     element: "arcane",    damage: 20, range: 3,  cooldown: 5,  description: "Mana-charged slash" },
  holySwing:       { key: "holySwing",       name: "Holy Swing",       element: "holy",      damage: 18, range: 3,  cooldown: 5,  description: "Radiant smash" },
  groundSlam:      { key: "groundSlam",      name: "Ground Slam",      element: "physical",  damage: 30, range: 5,  cooldown: 8,  description: "AoE shockwave" },
  // Ranged / magic
  fireball:        { key: "fireball",        name: "Fireball",         element: "fire",      damage: 22, range: 20, cooldown: 4,  description: "Ranged fire projectile" },
  thunderball:     { key: "thunderball",     name: "Thunderball",      element: "lightning", damage: 15, range: 20, cooldown: 3,  description: "Lightning orb" },
  tripleOrb:       { key: "tripleOrb",       name: "Triple Orb",       element: "arcane",    damage: 24, range: 15, cooldown: 6,  description: "3 homing orbs AoE" },
  blizzard:        { key: "blizzard",        name: "Blizzard",         element: "ice",       damage: 28, range: 12, cooldown: 10, description: "AoE frost storm" },
  healTouch:       { key: "healTouch",       name: "Heal Touch",       element: "heal",      damage: -20, range: 3, cooldown: 5,  description: "Heal self or ally" },
  regeneration:    { key: "regeneration",    name: "Regeneration",     element: "heal",      damage: -8, range: 0,  cooldown: 12, description: "Heal over time" },
  // Shield skills (activated via RMB hold — replaces slots 1-3)
  shieldBash:      { key: "shieldBash",      name: "Shield Bash",      element: "physical",  damage: 15, range: 2,  cooldown: 4,  description: "Stun target 1s, interrupt cast" },
  shieldParry:     { key: "shieldParry",     name: "Shield Parry",     element: "physical",  damage: 0,  range: 0,  cooldown: 6,  description: "Perfect block → counter window 0.5s" },
  taunt:           { key: "taunt",           name: "Taunt",            element: "physical",  damage: 0,  range: 8,  cooldown: 10, description: "Force enemies to target you for 3s" },
  // Tome skills (activated via RMB hold — replaces slots 1-3)
  tomeHeal:        { key: "tomeHeal",        name: "Tome Heal",        element: "heal",      damage: -25, range: 3, cooldown: 5,  description: "Channel healing from the tome" },
  tomeFireball:    { key: "tomeFireball",     name: "Tome Fireball",    element: "fire",      damage: 20, range: 18, cooldown: 3,  description: "Hurl a fire orb from the tome" },
  tomeRegenerate:  { key: "tomeRegenerate",  name: "Tome Regen",       element: "heal",      damage: -10, range: 0, cooldown: 15, description: "Sustained heal-over-time from tome" },
};

// ── Base weapon → skill keys (default unlocked at mastery 0) ─────────────────

export const BASE_WEAPON_SKILLS: Record<string, string[]> = {
  sword:    ["quickSwing", "heavySwing", "iceSwing", "lightningSwing"],
  axe:      ["quickSwing", "heavySwing", "darkSwing", "poisonStrike"],
  hammer:   ["quickSwing", "heavySwing", "groundSlam", "holySwing"],
  mace:     ["quickSwing", "heavySwing", "groundSlam", "holySwing"],
  spear:    ["quickSwing", "heavySwing", "lightningSwing", "arcaneSwing"],
  dagger:   ["quickSwing", "poisonStrike", "darkSwing"],
  pick:     ["quickSwing", "heavySwing"],
  bow:      ["fireball", "thunderball", "poisonStrike"],
  crossbow: ["fireball", "thunderball", "poisonStrike"],
  staff:    ["thunderball", "tripleOrb", "blizzard", "healTouch", "regeneration"],
  wand:     ["thunderball", "fireball", "healTouch"],
  shield:   ["shieldBash", "shieldParry"],
  other:    ["quickSwing"],
};

// ═════════════════════════════════════════════════════════════════════════════
// WEAPON MASTERY SYSTEM
// Each weapon type has its own mastery track. Mastery is gained by using that
// weapon in combat. Higher mastery unlocks deeper skill tree tiers.
// ═════════════════════════════════════════════════════════════════════════════

export interface MasteryLevel {
  level: number;
  name:  string;
  xpRequired: number;    // cumulative XP to reach this level
  bonuses: string[];     // passive bonuses at this level
}

export const MASTERY_LEVELS: MasteryLevel[] = [
  { level: 1,  name: "Novice",       xpRequired: 0,      bonuses: [] },
  { level: 2,  name: "Apprentice",   xpRequired: 100,    bonuses: ["+5% attack speed"] },
  { level: 3,  name: "Journeyman",   xpRequired: 350,    bonuses: ["+10% damage", "Unlocks Tier 2 skills"] },
  { level: 4,  name: "Expert",       xpRequired: 800,    bonuses: ["+15% crit chance"] },
  { level: 5,  name: "Master",       xpRequired: 1500,   bonuses: ["+20% damage", "Unlocks Tier 3 skills"] },
  { level: 6,  name: "Grandmaster",  xpRequired: 3000,   bonuses: ["+25% damage", "+10% attack speed", "Unique passive"] },
];

export function getMasteryLevel(xp: number): MasteryLevel {
  for (let i = MASTERY_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= MASTERY_LEVELS[i].xpRequired) return MASTERY_LEVELS[i];
  }
  return MASTERY_LEVELS[0];
}

// ═════════════════════════════════════════════════════════════════════════════
// WEAPON SKILL TREES
// Each weapon type has a 3-tier skill tree. Tier 1 is always unlocked.
// Tier 2 requires mastery level 3 (Journeyman). Tier 3 requires mastery 5.
// ═════════════════════════════════════════════════════════════════════════════

export interface SkillTreeNode {
  skillKey: string;
  tier: 1 | 2 | 3;
  masteryRequired: number;  // mastery level needed
  prereqs: string[];        // skill keys that must be learned first
}

export interface WeaponSkillTree {
  weaponType: string;
  nodes: SkillTreeNode[];
}

export const WEAPON_SKILL_TREES: Record<string, WeaponSkillTree> = {
  sword: {
    weaponType: "sword",
    nodes: [
      { skillKey: "quickSwing",       tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "heavySwing",       tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "iceSwing",         tier: 2, masteryRequired: 3, prereqs: ["quickSwing"] },
      { skillKey: "lightningSwing",   tier: 2, masteryRequired: 3, prereqs: ["heavySwing"] },
      { skillKey: "arcaneSwing",      tier: 3, masteryRequired: 5, prereqs: ["iceSwing", "lightningSwing"] },
    ],
  },
  axe: {
    weaponType: "axe",
    nodes: [
      { skillKey: "quickSwing",       tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "heavySwing",       tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "darkSwing",        tier: 2, masteryRequired: 3, prereqs: ["quickSwing"] },
      { skillKey: "poisonStrike",     tier: 2, masteryRequired: 3, prereqs: ["heavySwing"] },
      { skillKey: "groundSlam",       tier: 3, masteryRequired: 5, prereqs: ["darkSwing"] },
    ],
  },
  hammer: {
    weaponType: "hammer",
    nodes: [
      { skillKey: "quickSwing",       tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "heavySwing",       tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "groundSlam",       tier: 2, masteryRequired: 3, prereqs: ["heavySwing"] },
      { skillKey: "holySwing",        tier: 2, masteryRequired: 3, prereqs: ["quickSwing"] },
      { skillKey: "arcaneSwing",      tier: 3, masteryRequired: 5, prereqs: ["groundSlam"] },
    ],
  },
  mace: {
    weaponType: "mace",
    nodes: [
      { skillKey: "quickSwing",       tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "heavySwing",       tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "groundSlam",       tier: 2, masteryRequired: 3, prereqs: ["heavySwing"] },
      { skillKey: "holySwing",        tier: 2, masteryRequired: 3, prereqs: ["quickSwing"] },
      { skillKey: "darkSwing",        tier: 3, masteryRequired: 5, prereqs: ["groundSlam"] },
    ],
  },
  spear: {
    weaponType: "spear",
    nodes: [
      { skillKey: "quickSwing",       tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "heavySwing",       tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "lightningSwing",   tier: 2, masteryRequired: 3, prereqs: ["quickSwing"] },
      { skillKey: "arcaneSwing",      tier: 2, masteryRequired: 3, prereqs: ["heavySwing"] },
      { skillKey: "poisonStrike",     tier: 3, masteryRequired: 5, prereqs: ["lightningSwing"] },
    ],
  },
  dagger: {
    weaponType: "dagger",
    nodes: [
      { skillKey: "quickSwing",       tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "poisonStrike",     tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "darkSwing",        tier: 2, masteryRequired: 3, prereqs: ["poisonStrike"] },
      { skillKey: "iceSwing",         tier: 2, masteryRequired: 3, prereqs: ["quickSwing"] },
      { skillKey: "arcaneSwing",      tier: 3, masteryRequired: 5, prereqs: ["darkSwing"] },
    ],
  },
  bow: {
    weaponType: "bow",
    nodes: [
      { skillKey: "fireball",         tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "thunderball",      tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "poisonStrike",     tier: 2, masteryRequired: 3, prereqs: ["fireball"] },
      { skillKey: "tripleOrb",        tier: 2, masteryRequired: 3, prereqs: ["thunderball"] },
      { skillKey: "blizzard",         tier: 3, masteryRequired: 5, prereqs: ["tripleOrb"] },
    ],
  },
  crossbow: {
    weaponType: "crossbow",
    nodes: [
      { skillKey: "fireball",         tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "thunderball",      tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "poisonStrike",     tier: 2, masteryRequired: 3, prereqs: ["fireball"] },
      { skillKey: "tripleOrb",        tier: 2, masteryRequired: 3, prereqs: ["thunderball"] },
      { skillKey: "groundSlam",       tier: 3, masteryRequired: 5, prereqs: ["tripleOrb"] },
    ],
  },
  staff: {
    weaponType: "staff",
    nodes: [
      { skillKey: "thunderball",      tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "healTouch",        tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "tripleOrb",        tier: 2, masteryRequired: 3, prereqs: ["thunderball"] },
      { skillKey: "blizzard",         tier: 2, masteryRequired: 3, prereqs: ["healTouch"] },
      { skillKey: "regeneration",     tier: 3, masteryRequired: 5, prereqs: ["blizzard"] },
    ],
  },
  wand: {
    weaponType: "wand",
    nodes: [
      { skillKey: "thunderball",      tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "fireball",         tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "healTouch",        tier: 2, masteryRequired: 3, prereqs: ["thunderball"] },
      { skillKey: "tripleOrb",        tier: 2, masteryRequired: 3, prereqs: ["fireball"] },
      { skillKey: "blizzard",         tier: 3, masteryRequired: 5, prereqs: ["tripleOrb", "healTouch"] },
    ],
  },
  shield: {
    weaponType: "shield",
    nodes: [
      { skillKey: "shieldBash",       tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: "shieldParry",      tier: 1, masteryRequired: 1, prereqs: [] },
    ],
  },
};

/** Get the skill tree for a weapon type, or null if none exists. */
export function getSkillTree(weaponType: string): WeaponSkillTree | null {
  return WEAPON_SKILL_TREES[weaponType] ?? null;
}

/** Get unlocked nodes based on current mastery level. */
export function getUnlockedNodes(weaponType: string, masteryLevel: number): SkillTreeNode[] {
  const tree = WEAPON_SKILL_TREES[weaponType];
  if (!tree) return [];
  return tree.nodes.filter(n => n.masteryRequired <= masteryLevel);
}

// ═════════════════════════════════════════════════════════════════════════════
// OFF-HAND MODIFIER SYSTEM
// Off-hand items apply passive modifiers to the main-hand weapon's output.
// Shields, relics, tomes, and utility items each have different modifier sets.
// ═════════════════════════════════════════════════════════════════════════════

export type OffhandType = "shield" | "relic" | "tome" | "none";

export interface OffhandModifier {
  type: OffhandType;
  name: string;
  passives: OffhandPassive[];
  /** RMB hold: override hotbar slots 1-2 with these skills (shields only) */
  rmbSkills?: string[];
}

export interface OffhandPassive {
  stat: string;       // e.g. "damage", "critChance", "healPower", "blockChance"
  value: number;      // flat add or multiplier
  isPercent: boolean; // true = multiplicative, false = flat
  description: string;
}

export const OFFHAND_MODIFIERS: Record<string, OffhandModifier> = {
  shield: {
    type: "shield",
    name: "Shield",
    passives: [
      { stat: "blockChance",   value: 25, isPercent: true,  description: "+25% block chance" },
      { stat: "armor",         value: 15, isPercent: false, description: "+15 armor" },
      { stat: "moveSpeed",     value: -5, isPercent: true,  description: "-5% move speed" },
    ],
    rmbSkills: ["shieldBash", "shieldParry"],
  },
  relic: {
    type: "relic",
    name: "Off-hand Relic",
    passives: [
      { stat: "spellPower",    value: 12, isPercent: true,  description: "+12% spell power" },
      { stat: "critChance",    value: 5,  isPercent: true,  description: "+5% crit chance" },
      { stat: "manaRegen",     value: 3,  isPercent: false, description: "+3 mana/s" },
    ],
  },
  tome: {
    type: "tome",
    name: "Utility Tome",
    passives: [
      { stat: "healPower",     value: 15, isPercent: true,  description: "+15% heal power" },
      { stat: "cooldownReduc", value: 8,  isPercent: true,  description: "-8% cooldowns" },
      { stat: "xpGain",        value: 10, isPercent: true,  description: "+10% weapon XP" },
    ],
  },
};

/** Get modifier for an off-hand type. Returns null for "none". */
export function getOffhandModifier(offhandType: string): OffhandModifier | null {
  return OFFHAND_MODIFIERS[offhandType] ?? null;
}

// ── Shield RMB override ───────────────────────────────────────────────────────

export const SHIELD_RMB_SKILLS: string[] = ["shieldBash", "shieldParry", "taunt"];

/** Tome RMB: heal / elemental / regen override for slots 1-3. */
export const TOME_RMB_SKILLS: string[] = ["tomeHeal", "tomeFireball", "tomeRegenerate"];

// ── Public API ────────────────────────────────────────────────────────────────
// No class restrictions — any class can equip any weapon.
// Skills come from the weapon type. Off-hand modifiers apply on top.

/** Get skill keys for a weapon type. */
export function getSkillKeysForWeapon(weaponType: string): string[] {
  return BASE_WEAPON_SKILLS[weaponType] ?? ["quickSwing"];
}

/** Get full SkillDef objects for a weapon type. */
export function getSkillsForWeapon(weaponType: string): SkillDef[] {
  return getSkillKeysForWeapon(weaponType)
    .filter(k => SKILL_CATALOG[k])
    .map(k => SKILL_CATALOG[k]);
}

/**
 * Get the active hotbar skill list, accounting for off-hand modifier.
 *
 * Shield + RMB: slots 1-3 become Shield Bash / Shield Parry / Taunt.
 *   Slots 4-5 remain from weapon skills.
 *
 * Tome + RMB: slots 1-3 become Tome Heal / Tome Fireball / Tome Regen.
 *   Slots 4-5 remain from weapon skills.
 *
 * Otherwise: all 5 slots from weapon skill tree.
 */
export function getHotbarSkills(
  weaponType: string,
  offhandType: OffhandType = "none",
  rmbHeld = false,
): SkillDef[] {
  const base = getSkillsForWeapon(weaponType);

  if (!rmbHeld) return base;

  if (offhandType === "shield") {
    const shieldSkills = SHIELD_RMB_SKILLS
      .filter(k => SKILL_CATALOG[k])
      .map(k => SKILL_CATALOG[k]);
    return [...shieldSkills, ...base.slice(3)];
  }

  if (offhandType === "tome") {
    const tomeSkills = TOME_RMB_SKILLS
      .filter(k => SKILL_CATALOG[k])
      .map(k => SKILL_CATALOG[k]);
    return [...tomeSkills, ...base.slice(3)];
  }

  return base;
}

/** Weapon type → animation pack mapping for ControllerAnimMap. */
export const WEAPON_TYPE_ANIM_PACK: Record<string, string> = {
  sword:    "sword_shield",
  axe:      "axe",
  hammer:   "club",
  mace:     "club",
  dagger:   "sword",
  spear:    "sword",
  bow:      "longbow",
  crossbow: "rifle",
  staff:    "magic",
  wand:     "magic",
  pick:     "sword",
  shield:   "sword_shield",
  other:    "sword",
};
