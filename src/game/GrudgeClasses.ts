/**
 * GrudgeClasses.ts
 * 4 standardized character classes for Grudge 6 — each race gets:
 *   Warrior (sword+shield), Worge (spear/staff/dagger),
 *   Mage (staff+tome), Ranger (bow+quiver)
 *
 * Each class+race combo gets a deterministic Grudge UUID:
 *   GRDG-{RACE_ABBR}-{CLASS_ABBR}-0001
 */

import { RACES, type RaceConfig } from "../engine/types/races";
import {
  RACE_GEAR_PRESETS,
  type GearPreset,
} from "../engine/types/meshCatalog";
import type { OffhandType } from "../engine/types/weaponSkills";

// ── Class definitions ──

export interface GrudgeClass {
  id: string;           // warrior | worge | mage | ranger
  label: string;
  abbr: string;         // WAR | WRG | MAG | RNG
  color: string;
  description: string;
  weaponType: string;   // default main-hand weapon type
  offhand: OffhandType; // default off-hand
  animPack: string;     // ControllerAnimMap pack key
}

export const GRUDGE_CLASSES: GrudgeClass[] = [
  {
    id: "warrior", label: "Warrior", abbr: "WAR", color: "#c2410c",
    description: "Sword & Shield — heavy armor, frontline tank",
    weaponType: "sword", offhand: "shield", animPack: "sword_shield",
  },
  {
    id: "worge", label: "Worge", abbr: "WRG", color: "#7c3aed",
    description: "Spear / Staff / Dagger — shapeshifter hybrid",
    weaponType: "spear", offhand: "relic", animPack: "sword",
  },
  {
    id: "mage", label: "Mage", abbr: "MAG", color: "#0891b2",
    description: "Staff & Tome — elemental caster, healer",
    weaponType: "staff", offhand: "tome", animPack: "magic",
  },
  {
    id: "ranger", label: "Ranger", abbr: "RNG", color: "#15803d",
    description: "Bow — ranged DPS, trapper",
    weaponType: "bow", offhand: "none", animPack: "longbow",
  },
];

// ── Grudge UUID generator ──

export function makeGrudgeUUID(raceAbbr: string, classAbbr: string): string {
  return `GRDG-${raceAbbr}-${classAbbr}-0001`;
}

// ── Class+Race character definition ──

export interface GrudgeCharacterDef {
  grudgeId: string;       // e.g. GRDG-BRB-WAR-0001
  race: RaceConfig;
  cls: GrudgeClass;
  preset: GearPreset;     // gear preset from meshCatalog (closest match)
}

/**
 * Map each class to the best-matching gear preset for a race.
 * Falls back to the first preset if no exact match.
 */
function findPreset(raceId: string, animPack: string): GearPreset {
  const presets = RACE_GEAR_PRESETS[raceId] ?? [];
  // Match by animPack first
  const match = presets.find((p) => p.animPack === animPack);
  if (match) return match;
  // Fallback: match by label similarity
  const byLabel = presets.find((p) =>
    p.label.toLowerCase().includes("warrior") ||
    p.label.toLowerCase().includes("knight"),
  );
  return byLabel ?? presets[0] ?? {
    id: "default", label: "Default", description: "",
    color: "#666", animPack: "unarmed", visibleMeshes: [],
  };
}

/**
 * Generate all character definitions — 6 races × 4 classes = 24 combos.
 */
export function getAllCharacterDefs(): GrudgeCharacterDef[] {
  const defs: GrudgeCharacterDef[] = [];
  for (const race of RACES) {
    for (const cls of GRUDGE_CLASSES) {
      const grudgeId = makeGrudgeUUID(race.abbr, cls.abbr);
      const preset = findPreset(race.id, cls.animPack);
      defs.push({ grudgeId, race, cls, preset });
    }
  }
  return defs;
}

/**
 * Get character definitions for a specific race.
 */
export function getClassesForRace(raceId: string): GrudgeCharacterDef[] {
  const race = RACES.find((r) => r.id === raceId);
  if (!race) return [];
  return GRUDGE_CLASSES.map((cls) => ({
    grudgeId: makeGrudgeUUID(race.abbr, cls.abbr),
    race,
    cls,
    preset: findPreset(raceId, cls.animPack),
  }));
}

// ── Class ability summary (for UI tooltips) ──

export const CLASS_ABILITIES: Record<string, string[]> = {
  warrior: [
    "Shield Block (RMB) → Shield Bash / Shield Parry / Taunt",
    "Heavy armor — high block chance, slow move",
    "Sword skill tree: Quick Swing → Heavy → Ice/Lightning → Arcane",
  ],
  worge: [
    "Shapeshifter forms: Bear (tank), Raptor (stealth), Bird (flight)",
    "Multi-weapon proficiency: spear, staff, dagger, bow, hammer",
    "Relic off-hand: +spell power, +crit, +mana regen",
  ],
  mage: [
    "Tome (RMB) → Heal Touch / Fireball / Regeneration",
    "Staff skill tree: Thunderball → Triple Orb / Blizzard → Regeneration",
    "Cloth armor — lowest defense, highest spell power",
  ],
  ranger: [
    "Bow skill tree: Fireball → Thunder → Poison → Triple Orb → Blizzard",
    "No off-hand — both hands on bow",
    "Leather armor — medium defense, high mobility",
  ],
};
