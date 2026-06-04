/**
 * weaponSkills.ts
 *
 * Complete weapon skill system for Grudge Warlords / Arena Combat.
 * Sourced from info.grudge-studio.com/WEAPON_SKILLS.html
 *
 * Design:
 *   - Slots 1-2: SHARED across weapons of the same family (melee/ranged/magic)
 *   - Slots 3-4-5: UNIQUE per weapon type
 *   - Off-hand (shield/tome/relic) overrides slots 1-3 on RMB hold
 *   - Back items (capes + wings) have active effects with cooldowns
 *   - Each skill has an optional CDN icon URL for rich rendering
 */

import type { WeaponType } from "./weapons";

// ── Element system ────────────────────────────────────────────────────────────

export type Element =
  | "physical" | "fire" | "ice" | "poison" | "arcane"
  | "lightning" | "dark" | "holy" | "heal" | "nature" | "shadow";

export const ELEMENT_ICONS: Record<Element, string> = {
  physical:  "⚔️",
  fire:      "🔥",
  ice:       "❄️",
  poison:    "☠️",
  arcane:    "✨",
  lightning: "⚡",
  dark:      "🌑",
  holy:      "☀️",
  heal:      "💚",
  nature:    "🌿",
  shadow:    "👁️",
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
  nature:    "#22aa44",
  shadow:    "#6633aa",
};

// ── Skill definition ──────────────────────────────────────────────────────────

const CDN = "https://assets.grudge-studio.com/icons";

export interface SkillDef {
  key:         string;
  name:        string;
  element:     Element;
  damage:      number;
  range:       number;
  cooldown:    number;
  description: string;
  /** CDN icon URL — ActionBar renders <img> if present, else emoji fallback */
  icon?:       string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKILL CATALOG — every skill across all weapons
// Naming: {weapon}_{skillName} for unique, shared for cross-weapon
// ═══════════════════════════════════════════════════════════════════════════════

export const SKILL_CATALOG: Record<string, SkillDef> = {

  // ── SHARED MELEE (slots 1-2 for sword/axe/hammer/mace/dagger/spear/greatsword/greataxe/scythe) ──
  vengefulSlash:     { key: "vengefulSlash",     name: "Vengeful Slash",     element: "physical",  damage: 45,  range: 3,  cooldown: 0,  description: "Fast melee strike, builds Grudge Mark",   icon: `${CDN}/pack/misc/Slash_07.png` },
  heavyStrike:       { key: "heavyStrike",       name: "Heavy Strike",       element: "physical",  damage: 55,  range: 3,  cooldown: 2,  description: "Powerful overhead hit, extended range",    icon: `${CDN}/pack/misc/Power.png` },

  // ── SHARED RANGED (slots 1-2 for bow/crossbow/gun) ──
  quickShot:         { key: "quickShot",         name: "Quick Shot",         element: "physical",  damage: 45,  range: 25, cooldown: 0,  description: "Basic ranged shot",                       icon: `${CDN}/pack/weapons/Arrow_01.png` },
  aimedShot:         { key: "aimedShot",         name: "Aimed Shot",         element: "physical",  damage: 80,  range: 25, cooldown: 2,  description: "Charged precision shot, guaranteed crit",  icon: `${CDN}/pack/weapons/Arrow_04.png` },

  // ── SHARED MAGIC (slots 1-2 for staff/wand) ──
  arcaneBolt:        { key: "arcaneBolt",        name: "Arcane Bolt",        element: "arcane",    damage: 45,  range: 25, cooldown: 0,  description: "Homing arcane projectile",                icon: `${CDN}/pack/misc/CircleE.png` },
  elementalBlast:    { key: "elementalBlast",     name: "Elemental Blast",    element: "arcane",    damage: 65,  range: 20, cooldown: 2,  description: "Charged elemental burst, AoE on impact",  icon: `${CDN}/pack/misc/Effect.png` },

  // ═══ SWORD — slots 3-4-5 ═══
  swordBloodRush:    { key: "swordBloodRush",    name: "Blood Rush",         element: "physical",  damage: 35,  range: 8,  cooldown: 8,  description: "Dash forward 8m, AoE damage on arrival",  icon: `${CDN}/pack/misc/Slash_07.png` },
  swordParryCounter: { key: "swordParryCounter", name: "Parry Counter",      element: "physical",  damage: 80,  range: 3,  cooldown: 8,  description: "Block then counter for 2x damage",        icon: `${CDN}/pack/weapons/shield_03.png` },
  swordCrimson:      { key: "swordCrimson",      name: "Crimson Reprisal",   element: "dark",      damage: 150, range: 5,  cooldown: 45, description: "Large AoE slash, heals per enemy hit",    icon: `${CDN}/pack/misc/Burns.png` },

  // ═══ AXE — slots 3-4-5 ═══
  axeWhirlPain:      { key: "axeWhirlPain",      name: "Whirl of Pain",      element: "physical",  damage: 80,  range: 4,  cooldown: 10, description: "Channeled 360° spin attack",              icon: `${CDN}/pack/misc/Slash_07.png` },
  axeCarnageSpin:    { key: "axeCarnageSpin",     name: "Carnage Spin",       element: "physical",  damage: 70,  range: 4,  cooldown: 12, description: "360° AoE, refreshes all bleed stacks",    icon: `${CDN}/pack/misc/Burns.png` },
  axeApocalypse:     { key: "axeApocalypse",     name: "Apocalypse Cleave",  element: "physical",  damage: 180, range: 5,  cooldown: 50, description: "Massive knockback AoE",                   icon: `${CDN}/pack/misc/Chaos_2.png` },

  // ═══ HAMMER — slots 3-4-5 ═══
  hammerQuake:       { key: "hammerQuake",        name: "Quake Strike",       element: "physical",  damage: 70,  range: 4,  cooldown: 12, description: "Knockup AoE 4m",                          icon: `${CDN}/pack/misc/Power.png` },
  hammerCataclysm:   { key: "hammerCataclysm",   name: "Cataclysm Blow",     element: "lightning",  damage: 80,  range: 5,  cooldown: 15, description: "AoE stun 2s + 5m radius",                icon: `${CDN}/pack/misc/Lighting.png` },
  hammerMjolnir:     { key: "hammerMjolnir",     name: "Mjolnir Strike",     element: "lightning",  damage: 280, range: 6,  cooldown: 65, description: "Lightning AoE storm, chains to targets",  icon: `${CDN}/pack/misc/Lighting.png` },

  // ═══ MACE — slots 3-4-5 (holy healer) ═══
  maceSanctify:      { key: "maceSanctify",      name: "Sanctify",           element: "holy",      damage: -60, range: 6,  cooldown: 12, description: "Bless ground, heal allies in zone 6s",    icon: `${CDN}/pack/misc/Lights.png` },
  maceSmite:         { key: "maceSmite",         name: "Smite",              element: "holy",      damage: 80,  range: 20, cooldown: 10, description: "Call holy bolt on target, stun 1s",       icon: `${CDN}/pack/misc/Lighting.png` },
  maceDivineWrath:   { key: "maceDivineWrath",   name: "Divine Wrath",       element: "holy",      damage: 200, range: 10, cooldown: 55, description: "Massive holy explosion, heal allies",     icon: `${CDN}/pack/misc/Lights.png` },

  // ═══ SPEAR — slots 3-4-5 ═══
  spearVault:        { key: "spearVault",        name: "Vaulting Strike",    element: "physical",  damage: 70,  range: 8,  cooldown: 10, description: "Pole-vault over, stun 1s, AoE 3m",       icon: `${CDN}/pack/weapons/Spear_20.png` },
  spearDragon:       { key: "spearDragon",       name: "Dragon Strike",      element: "fire",      damage: 100, range: 6,  cooldown: 14, description: "Charged fire thrust, burn 5s",            icon: `${CDN}/pack/misc/Fires.png` },
  spearStorm:        { key: "spearStorm",        name: "Storm of Spears",    element: "physical",  damage: 200, range: 10, cooldown: 50, description: "Rain spectral spears on area 5s",         icon: `${CDN}/pack/weapons/Spear_35.png` },

  // ═══ DAGGER — slots 3-4-5 ═══
  daggerPhantom:     { key: "daggerPhantom",     name: "Phantom Dash",       element: "shadow",    damage: 45,  range: 6,  cooldown: 8,  description: "Dash through enemies, invincible",        icon: `${CDN}/pack/misc/smokes_01.png` },
  daggerAmbush:      { key: "daggerAmbush",      name: "Vengeful Ambush",    element: "shadow",    damage: 80,  range: 12, cooldown: 12, description: "Teleport behind target, +50% dmg",        icon: `${CDN}/pack/misc/smoke.png` },
  daggerDeathgiver:  { key: "daggerDeathgiver",  name: "Deathgiver's Fatal", element: "dark",      damage: 200, range: 3,  cooldown: 50, description: "Instant kill targets below 20% HP",       icon: `${CDN}/pack/misc/Chaos_2.png` },

  // ═══ BOW — slots 3-4-5 ═══
  bowMultishot:      { key: "bowMultishot",      name: "Multishot",          element: "physical",  damage: 35,  range: 20, cooldown: 8,  description: "Fire 3 arrows in a cone",                 icon: `${CDN}/pack/weapons/Arrow_05.png` },
  bowBearTrap:       { key: "bowBearTrap",       name: "Bear Trap",          element: "nature",    damage: 20,  range: 10, cooldown: 15, description: "Place trap that roots 3s",                icon: `${CDN}/pack/misc/NautreLight.png` },
  bowArrowRain:      { key: "bowArrowRain",      name: "Arrow Rain",         element: "physical",  damage: 150, range: 20, cooldown: 45, description: "Rain arrows on 10m area for 5s",          icon: `${CDN}/pack/weapons/Arrow_08.png` },

  // ═══ CROSSBOW — slots 3-4-5 ═══
  xbowKnockback:     { key: "xbowKnockback",    name: "Knockback Bolt",     element: "physical",  damage: 40,  range: 15, cooldown: 8,  description: "Push enemy back 5m",                      icon: `${CDN}/pack/misc/Power.png` },
  xbowBarrage:       { key: "xbowBarrage",       name: "Barrage",            element: "physical",  damage: 120, range: 20, cooldown: 15, description: "Channel 5 rapid bolts",                   icon: `${CDN}/pack/weapons/Bolt_05.png` },
  xbowSweeping:      { key: "xbowSweeping",      name: "Sweeping Bolt",      element: "physical",  damage: 200, range: 25, cooldown: 50, description: "Piercing AoE line, full width",            icon: `${CDN}/pack/weapons/Bolt_08.png` },

  // ═══ GUN — slots 3-4-5 ═══
  gunExplosive:      { key: "gunExplosive",      name: "Explosive Round",    element: "fire",      damage: 70,  range: 25, cooldown: 8,  description: "Incendiary shell, AoE 4m + knockback",    icon: `${CDN}/pack/misc/fire_05.png` },
  gunHellfire:       { key: "gunHellfire",       name: "Hellfire Barrage",   element: "fire",      damage: 100, range: 20, cooldown: 18, description: "Channel 12 rounds, AoE incendiary 3s",    icon: `${CDN}/pack/misc/Fires.png` },
  gunDemonBlast:     { key: "gunDemonBlast",     name: "Demon Blast",        element: "fire",      damage: 250, range: 15, cooldown: 55, description: "Massive explosion, knockback 10m",         icon: `${CDN}/pack/misc/Lava.png` },

  // ═══ STAFF — slots 3-4-5 (fire/ice/nature caster) ═══
  staffFlameWave:    { key: "staffFlameWave",    name: "Flame Wave",         element: "fire",      damage: 60,  range: 8,  cooldown: 8,  description: "Cone AoE, burn 4s",                       icon: `${CDN}/pack/misc/Fires.png` },
  staffIceNova:      { key: "staffIceNova",      name: "Ice Nova",           element: "ice",       damage: 55,  range: 6,  cooldown: 10, description: "AoE slow 50% around caster",              icon: `${CDN}/pack/misc/frozen.png` },
  staffHellstorm:    { key: "staffHellstorm",    name: "Hellstorm",          element: "fire",      damage: 250, range: 12, cooldown: 50, description: "Large AoE DoT, burn 8s",                  icon: `${CDN}/pack/misc/Lava.png` },

  // ═══ WAND — slots 3-4-5 (arcane utility) ═══
  wandChainLight:    { key: "wandChainLight",    name: "Chain Lightning",    element: "lightning",  damage: 70,  range: 20, cooldown: 10, description: "Lightning bouncing x5 targets",            icon: `${CDN}/pack/misc/Lighting.png` },
  wandGravity:       { key: "wandGravity",       name: "Gravity Well",       element: "arcane",    damage: 60,  range: 15, cooldown: 15, description: "Pull enemies into vortex, DoT 5s",         icon: `${CDN}/pack/misc/ChaosCircle.png` },
  wandMeteorShower:  { key: "wandMeteorShower",  name: "Meteor Shower",      element: "fire",      damage: 250, range: 15, cooldown: 55, description: "Rain meteors on 12m area for 6s",          icon: `${CDN}/pack/misc/Lava.png` },

  // ═══ GREATSWORD — slots 3-4-5 (2H warrior) ═══
  gsWhirlwind:       { key: "gsWhirlwind",       name: "Whirlwind Slash",    element: "physical",  damage: 65,  range: 4,  cooldown: 8,  description: "360° spin, mobile AoE",                   icon: `${CDN}/pack/misc/Slash_07.png` },
  gsBladestorm:      { key: "gsBladestorm",      name: "Blade Storm",        element: "physical",  damage: 120, range: 4,  cooldown: 15, description: "Channeled rapid spin 3s",                 icon: `${CDN}/pack/misc/Slash_07.png` },
  gsApocalypse:      { key: "gsApocalypse",      name: "Apocalypse Edge",    element: "physical",  damage: 220, range: 8,  cooldown: 55, description: "Ground slam shockwave, knockup 2s",       icon: `${CDN}/pack/misc/Chaos_2.png` },

  // ═══ GREATAXE — slots 3-4-5 (2H berserker) ═══
  gaDevastate:       { key: "gaDevastate",       name: "Devastate",          element: "physical",  damage: 100, range: 3,  cooldown: 12, description: "3-hit combo, knockdown 1.5s",             icon: `${CDN}/pack/weapons/Axe_45.png` },
  gaGuillotine:      { key: "gaGuillotine",      name: "Guillotine",         element: "physical",  damage: 130, range: 6,  cooldown: 15, description: "Leap slam, AoE 3m knockdown",             icon: `${CDN}/pack/misc/Chaos_2.png` },
  gaRagnarok:        { key: "gaRagnarok",        name: "Ragnarok Cleave",    element: "physical",  damage: 240, range: 6,  cooldown: 55, description: "360° spin into ground slam, bleed 8s",    icon: `${CDN}/pack/weapons/Axe_48.png` },

  // ═══ SCYTHE — slots 3-4-5 (shadow reaper) ═══
  scytheLifeDrain:   { key: "scytheLifeDrain",   name: "Life Drain",         element: "shadow",    damage: 80,  range: 10, cooldown: 12, description: "Channel beam, heal 100% of damage",       icon: `${CDN}/pack/misc/Life.png` },
  scytheDeathSpiral: { key: "scytheDeathSpiral", name: "Death Spiral",       element: "shadow",    damage: 100, range: 4,  cooldown: 14, description: "Spinning scythe AoE, lifesteal 20%",      icon: `${CDN}/pack/misc/ChaosCircle.png` },
  scytheGrimReaper:  { key: "scytheGrimReaper",  name: "Grim Reaper",        element: "shadow",    damage: 200, range: 8,  cooldown: 55, description: "Transform 8s, execute <25%, +50% speed",  icon: `${CDN}/pack/misc/Chaos.png` },

  // ═══ SHIELD — defensive (off-hand RMB override) ═══
  shieldBash:        { key: "shieldBash",        name: "Shield Bash",        element: "physical",  damage: 35,  range: 2,  cooldown: 0,  description: "Daze 1s, builds block",                   icon: `${CDN}/pack/weapons/shield_01.png` },
  shieldParry:       { key: "shieldParry",       name: "Shield Parry",       element: "physical",  damage: 0,   range: 0,  cooldown: 6,  description: "Perfect block → counter 0.5s",             icon: `${CDN}/pack/weapons/shield_03.png` },
  shieldTaunt:       { key: "shieldTaunt",       name: "Grudge Taunt",       element: "physical",  damage: 0,   range: 8,  cooldown: 15, description: "AoE taunt 4s, +10% DR self",              icon: `${CDN}/pack/misc/Power.png` },
  shieldWall:        { key: "shieldWall",        name: "Shield Wall",        element: "physical",  damage: 0,   range: 0,  cooldown: 18, description: "60% DR for 4s, immobile",                 icon: `${CDN}/pack/weapons/shield_10.png` },
  shieldUnbreakable: { key: "shieldUnbreakable", name: "Unbreakable",        element: "holy",      damage: 100, range: 6,  cooldown: 55, description: "Immune 3s, then AoE knockback",           icon: `${CDN}/pack/weapons/shield_40.png` },

  // ═══ TOME — magic off-hand (RMB override) ═══
  tomeHeal:          { key: "tomeHeal",          name: "Tome Heal",          element: "heal",      damage: -25, range: 3,  cooldown: 5,  description: "Channel healing from tome",                icon: `${CDN}/pack/misc/Life.png` },
  tomeFireball:      { key: "tomeFireball",      name: "Tome Fireball",      element: "fire",      damage: 20,  range: 18, cooldown: 3,  description: "Hurl fire orb from tome",                  icon: `${CDN}/pack/misc/fire_05.png` },
  tomeRegenerate:    { key: "tomeRegenerate",    name: "Tome Regen",         element: "heal",      damage: -10, range: 0,  cooldown: 15, description: "Sustained HoT from tome",                 icon: `${CDN}/pack/misc/Life.png` },

  // ═══ RELIC — spirit off-hand (RMB override) ═══
  relicCurse:        { key: "relicCurse",        name: "Curse of Weakness",  element: "shadow",    damage: 0,   range: 20, cooldown: 12, description: "-30% DMG on target 8s",                   icon: `${CDN}/pack/misc/ChaosCircle.png` },
  relicSoulLeech:    { key: "relicSoulLeech",    name: "Soul Leech",         element: "shadow",    damage: 60,  range: 6,  cooldown: 14, description: "AoE drain, heal 100% of damage",          icon: `${CDN}/pack/misc/Life.png` },
  relicDoom:         { key: "relicDoom",         name: "Doom",               element: "shadow",    damage: 200, range: 20, cooldown: 22, description: "Mark target, explodes after 3s AoE",       icon: `${CDN}/pack/misc/Chaos_2.png` },
};

// ── Base weapon → hotbar skill keys (5 slots) ────────────────────────────────
// Slots 1-2: shared family, Slots 3-4-5: unique per weapon

export const BASE_WEAPON_SKILLS: Record<string, string[]> = {
  // Melee 1H
  sword:      ["vengefulSlash", "heavyStrike", "swordBloodRush", "swordParryCounter", "swordCrimson"],
  axe:        ["vengefulSlash", "heavyStrike", "axeWhirlPain",   "axeCarnageSpin",    "axeApocalypse"],
  hammer:     ["vengefulSlash", "heavyStrike", "hammerQuake",     "hammerCataclysm",   "hammerMjolnir"],
  mace:       ["vengefulSlash", "heavyStrike", "maceSanctify",    "maceSmite",         "maceDivineWrath"],
  dagger:     ["vengefulSlash", "heavyStrike", "daggerPhantom",   "daggerAmbush",      "daggerDeathgiver"],
  spear:      ["vengefulSlash", "heavyStrike", "spearVault",      "spearDragon",       "spearStorm"],
  // Melee 2H
  greatsword: ["vengefulSlash", "heavyStrike", "gsWhirlwind",     "gsBladestorm",      "gsApocalypse"],
  greataxe:   ["vengefulSlash", "heavyStrike", "gaDevastate",     "gaGuillotine",      "gaRagnarok"],
  scythe:     ["vengefulSlash", "heavyStrike", "scytheLifeDrain", "scytheDeathSpiral", "scytheGrimReaper"],
  // Ranged
  bow:        ["quickShot",     "aimedShot",   "bowMultishot",    "bowBearTrap",       "bowArrowRain"],
  crossbow:   ["quickShot",     "aimedShot",   "xbowKnockback",   "xbowBarrage",       "xbowSweeping"],
  gun:        ["quickShot",     "aimedShot",   "gunExplosive",    "gunHellfire",       "gunDemonBlast"],
  // Magic
  staff:      ["arcaneBolt",    "elementalBlast", "staffFlameWave", "staffIceNova",     "staffHellstorm"],
  wand:       ["arcaneBolt",    "elementalBlast", "wandChainLight", "wandGravity",      "wandMeteorShower"],
  // Off-hand (standalone or RMB override)
  shield:     ["shieldBash",    "shieldParry",    "shieldTaunt",    "shieldWall",       "shieldUnbreakable"],
  // Fallback
  pick:       ["vengefulSlash", "heavyStrike"],
  other:      ["vengefulSlash"],
};

// ═══════════════════════════════════════════════════════════════════════════════
// WEAPON MASTERY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export interface MasteryLevel {
  level: number;
  name:  string;
  xpRequired: number;
  bonuses: string[];
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

// ═══════════════════════════════════════════════════════════════════════════════
// WEAPON SKILL TREES — T1 always unlocked, T2 at mastery 3, T3 at mastery 5
// Slots 1-2 are T1 (shared), slot 3 is T2, slot 4 is T2, slot 5 is T3
// ═══════════════════════════════════════════════════════════════════════════════

export interface SkillTreeNode {
  skillKey: string;
  tier: 1 | 2 | 3;
  masteryRequired: number;
  prereqs: string[];
}

export interface WeaponSkillTree {
  weaponType: string;
  nodes: SkillTreeNode[];
}

function buildTree(weaponType: string, keys: string[]): WeaponSkillTree {
  return {
    weaponType,
    nodes: [
      { skillKey: keys[0], tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: keys[1], tier: 1, masteryRequired: 1, prereqs: [] },
      { skillKey: keys[2], tier: 2, masteryRequired: 3, prereqs: [keys[0]] },
      { skillKey: keys[3], tier: 2, masteryRequired: 3, prereqs: [keys[1]] },
      ...(keys[4] ? [{ skillKey: keys[4], tier: 3 as const, masteryRequired: 5, prereqs: [keys[2], keys[3]] }] : []),
    ],
  };
}

export const WEAPON_SKILL_TREES: Record<string, WeaponSkillTree> = Object.fromEntries(
  Object.entries(BASE_WEAPON_SKILLS)
    .filter(([, keys]) => keys.length >= 2)
    .map(([type, keys]) => [type, buildTree(type, keys)])
);

export function getSkillTree(weaponType: string): WeaponSkillTree | null {
  return WEAPON_SKILL_TREES[weaponType] ?? null;
}

export function getUnlockedNodes(weaponType: string, masteryLevel: number): SkillTreeNode[] {
  const tree = WEAPON_SKILL_TREES[weaponType];
  if (!tree) return [];
  return tree.nodes.filter(n => n.masteryRequired <= masteryLevel);
}

// ═══════════════════════════════════════════════════════════════════════════════
// OFF-HAND MODIFIER SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export type OffhandType = "shield" | "relic" | "tome" | "none";

export interface OffhandModifier {
  type: OffhandType;
  name: string;
  passives: OffhandPassive[];
  rmbSkills?: string[];
}

export interface OffhandPassive {
  stat: string;
  value: number;
  isPercent: boolean;
  description: string;
}

export const OFFHAND_MODIFIERS: Record<string, OffhandModifier> = {
  shield: {
    type: "shield", name: "Shield",
    passives: [
      { stat: "blockChance", value: 25, isPercent: true, description: "+25% block chance" },
      { stat: "armor", value: 15, isPercent: false, description: "+15 armor" },
      { stat: "moveSpeed", value: -5, isPercent: true, description: "-5% move speed" },
    ],
    rmbSkills: ["shieldBash", "shieldParry", "shieldTaunt"],
  },
  relic: {
    type: "relic", name: "Off-hand Relic",
    passives: [
      { stat: "spellPower", value: 12, isPercent: true, description: "+12% spell power" },
      { stat: "critChance", value: 5, isPercent: true, description: "+5% crit chance" },
      { stat: "manaRegen", value: 3, isPercent: false, description: "+3 mana/s" },
    ],
    rmbSkills: ["relicCurse", "relicSoulLeech", "relicDoom"],
  },
  tome: {
    type: "tome", name: "Utility Tome",
    passives: [
      { stat: "healPower", value: 15, isPercent: true, description: "+15% heal power" },
      { stat: "cooldownReduc", value: 8, isPercent: true, description: "-8% cooldowns" },
      { stat: "xpGain", value: 10, isPercent: true, description: "+10% weapon XP" },
    ],
    rmbSkills: ["tomeHeal", "tomeFireball", "tomeRegenerate"],
  },
};

export function getOffhandModifier(offhandType: string): OffhandModifier | null {
  return OFFHAND_MODIFIERS[offhandType] ?? null;
}

export const SHIELD_RMB_SKILLS: string[] = ["shieldBash", "shieldParry", "shieldTaunt"];
export const TOME_RMB_SKILLS: string[] = ["tomeHeal", "tomeFireball", "tomeRegenerate"];
export const RELIC_RMB_SKILLS: string[] = ["relicCurse", "relicSoulLeech", "relicDoom"];

// ═══════════════════════════════════════════════════════════════════════════════
// BACK ITEMS — Capes + Wings
// Active effects with cooldowns. Cape swapping has 30s global CD.
// ═══════════════════════════════════════════════════════════════════════════════

export interface BackItemDef {
  id: string;
  name: string;
  type: "cape" | "wings";
  tier: number;
  passives: { stat: string; value: number; description: string }[];
  active: {
    name: string;
    description: string;
    cooldown: number;
    duration: number;
    element: Element;
    icon?: string;
  };
  meshId?: string;
}

export const BACK_ITEMS: BackItemDef[] = [
  // ── Capes ──
  { id: "cape_shadow", name: "Shadowcloak", type: "cape", tier: 2,
    passives: [{ stat: "moveSpeed", value: 5, description: "+5% speed" }, { stat: "dodgeChance", value: 3, description: "+3% dodge" }],
    active: { name: "Shadow Veil", description: "Invisible 4s, breaks on attack", cooldown: 45, duration: 4, element: "shadow", icon: `${CDN}/pack/misc/smoke.png` } },
  { id: "cape_flame", name: "Embercape", type: "cape", tier: 3,
    passives: [{ stat: "fireDmg", value: 8, description: "+8% fire dmg" }, { stat: "burnResist", value: 15, description: "+15% burn resist" }],
    active: { name: "Flame Shroud", description: "Fire aura 3m, burn enemies 6s", cooldown: 30, duration: 6, element: "fire", icon: `${CDN}/pack/misc/Fires.png` } },
  { id: "cape_holy", name: "Radiant Mantle", type: "cape", tier: 4,
    passives: [{ stat: "healPower", value: 10, description: "+10% heal power" }, { stat: "holyResist", value: 10, description: "+10% holy resist" }],
    active: { name: "Divine Shield", description: "Absorb 200 damage 5s", cooldown: 40, duration: 5, element: "holy", icon: `${CDN}/pack/misc/Lights.png` } },
  { id: "cape_nature", name: "Thornweave Cloak", type: "cape", tier: 3,
    passives: [{ stat: "natureDmg", value: 8, description: "+8% nature dmg" }, { stat: "poisonResist", value: 15, description: "+15% poison resist" }],
    active: { name: "Thorn Shield", description: "Reflect 25% melee as nature DoT 5s", cooldown: 35, duration: 5, element: "nature", icon: `${CDN}/pack/misc/Naturecircle.png` } },
  { id: "cape_frost", name: "Frostweave Mantle", type: "cape", tier: 3,
    passives: [{ stat: "iceDmg", value: 8, description: "+8% ice dmg" }, { stat: "freezeResist", value: 15, description: "+15% freeze resist" }],
    active: { name: "Frost Aura", description: "Slow enemies 5m by 40% for 4s", cooldown: 30, duration: 4, element: "ice", icon: `${CDN}/pack/misc/frozen.png` } },
  { id: "cape_void", name: "Voidweave", type: "cape", tier: 5,
    passives: [{ stat: "shadowDmg", value: 12, description: "+12% shadow dmg" }, { stat: "silenceResist", value: 20, description: "+20% silence resist" }],
    active: { name: "Void Step", description: "Teleport 12m, leave shadow clone 3s", cooldown: 25, duration: 0, element: "shadow", icon: `${CDN}/pack/misc/ChaosCircle.png` } },
  // ── Wings ──
  { id: "wings_angelic", name: "Angelic Wings", type: "wings", tier: 5,
    passives: [{ stat: "moveSpeed", value: 10, description: "+10% speed" }, { stat: "fallDmg", value: -100, description: "No fall damage" }],
    active: { name: "Ascend", description: "Fly 8s, +50% speed, immune ground effects", cooldown: 60, duration: 8, element: "holy", icon: `${CDN}/pack/misc/Glow.png` } },
  { id: "wings_demon", name: "Demon Wings", type: "wings", tier: 5,
    passives: [{ stat: "moveSpeed", value: 8, description: "+8% speed" }, { stat: "lifesteal", value: 5, description: "+5% lifesteal" }],
    active: { name: "Infernal Dive", description: "Fly up, dive-bomb AoE 5m, 100 fire dmg", cooldown: 45, duration: 3, element: "fire", icon: `${CDN}/pack/misc/Lava.png` } },
  { id: "wings_nature", name: "Faerie Wings", type: "wings", tier: 4,
    passives: [{ stat: "moveSpeed", value: 8, description: "+8% speed" }, { stat: "manaRegen", value: 5, description: "+5 mana/s" }],
    active: { name: "Pixie Dust", description: "Fly 6s, trail heals allies 15/s", cooldown: 50, duration: 6, element: "nature", icon: `${CDN}/pack/misc/NatureFlower.png` } },
  { id: "wings_shadow", name: "Wraith Wings", type: "wings", tier: 5,
    passives: [{ stat: "moveSpeed", value: 12, description: "+12% speed" }, { stat: "dodgeChance", value: 5, description: "+5% dodge" }],
    active: { name: "Spectral Flight", description: "Fly 6s, phase through enemies, invisible", cooldown: 55, duration: 6, element: "shadow", icon: `${CDN}/pack/misc/smokes_01.png` } },
];

export const CAPE_SWAP_COOLDOWN = 30;

export function getBackItemsByType(type: "cape" | "wings"): BackItemDef[] {
  return BACK_ITEMS.filter(b => b.type === type);
}

export function getBackItemById(id: string): BackItemDef | undefined {
  return BACK_ITEMS.find(b => b.id === id);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

export function getSkillKeysForWeapon(weaponType: string): string[] {
  return BASE_WEAPON_SKILLS[weaponType] ?? ["vengefulSlash"];
}

export function getSkillsForWeapon(weaponType: string): SkillDef[] {
  return getSkillKeysForWeapon(weaponType)
    .filter(k => SKILL_CATALOG[k])
    .map(k => SKILL_CATALOG[k]);
}

export function getHotbarSkills(
  weaponType: string,
  offhandType: OffhandType = "none",
  rmbHeld = false,
): SkillDef[] {
  const base = getSkillsForWeapon(weaponType);
  if (!rmbHeld) return base;

  const mod = OFFHAND_MODIFIERS[offhandType];
  if (!mod?.rmbSkills) return base;

  const overrideSkills = mod.rmbSkills
    .filter(k => SKILL_CATALOG[k])
    .map(k => SKILL_CATALOG[k]);
  return [...overrideSkills, ...base.slice(3)];
}

export const WEAPON_TYPE_ANIM_PACK: Record<string, string> = {
  sword: "sword_shield", axe: "axe", hammer: "club", mace: "club",
  dagger: "sword", spear: "sword", bow: "longbow", crossbow: "rifle",
  gun: "rifle", staff: "magic", wand: "magic", pick: "sword",
  shield: "sword_shield", greatsword: "sword", greataxe: "axe",
  scythe: "sword", other: "sword",
};
