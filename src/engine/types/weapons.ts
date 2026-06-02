import { assetUrl as a } from "../assetUrl";
export type WeaponType =
  | "axe" | "sword" | "hammer" | "mace"
  | "staff" | "bow" | "spear" | "dagger"
  | "shield" | "pick" | "crossbow" | "wand" | "other";

export type WeaponHand  = "right" | "left" | "both" | "off";
export type WeaponHands = 1 | 2 | "off";

export interface WeaponDef {
  id:       string;
  label:    string;
  type:     WeaponType;
  hands:    WeaponHands;
  hand:     WeaponHand;
  /** Standalone FBX or GLB path */
  file?:    string;
  /** Mesh name already embedded in the character FBX */
  meshId?:  string;
  /** Races this weapon belongs to; undefined = cross-race / universal */
  races?:   string[];
  /** Three.js-space offset from hand bone origin [x, y, z] — primary (right) hand */
  posOffset?: [number, number, number];
  /** Euler rotation offset from hand bone [x, y, z] in degrees — primary (right) hand */
  rotOffset?: [number, number, number];
  /** Three.js-space offset from left hand bone origin [x, y, z] — 2H secondary grip */
  lhPosOffset?: [number, number, number];
  /** Euler rotation offset from left hand bone [x, y, z] in degrees — 2H secondary grip */
  lhRotOffset?: [number, number, number];
  /** Item tier 1-8 */
  tier?: number;
  /** Which ControllerAnimMap override set to use (e.g. 'sword_shield', 'magic') */
  animPack?: string;
  /** Uniform scale for the loaded model (default 1.0) */
  scale?: number;
}

export const WEAPON_TYPE_LABELS: Record<WeaponType, string> = {
  axe:      "Axes",
  sword:    "Swords",
  hammer:   "Hammers",
  mace:     "Maces",
  staff:    "Staves",
  bow:      "Bows",
  spear:    "Spears",
  dagger:   "Daggers",
  shield:   "Shields",
  pick:     "Picks",
  crossbow: "Crossbows",
  wand:     "Wands",
  other:    "Other",
};

export const WEAPON_TYPE_COLORS: Record<WeaponType, string> = {
  axe:      "#ef4444",
  sword:    "#f97316",
  hammer:   "#eab308",
  mace:     "#a16207",
  staff:    "#8b5cf6",
  bow:      "#10b981",
  spear:    "#06b6d4",
  dagger:   "#f43f5e",
  shield:   "#3b82f6",
  pick:     "#6b7280",
  crossbow: "#14b8a6",
  wand:     "#a855f7",
  other:    "#9ca3af",
};

// ── Tier system colors (T1-T8) ──────────────────────────────────────────────

export const TIER_COLORS: Record<number, { name: string; hex: string; label: string }> = {
  1: { name: "Bronze",    hex: "#8b7355", label: "Common" },
  2: { name: "Silver",    hex: "#a8a8a8", label: "Uncommon" },
  3: { name: "Blue",      hex: "#4a9eff", label: "Rare" },
  4: { name: "Purple",    hex: "#9d4dff", label: "Epic" },
  5: { name: "Red",       hex: "#ff4d4d", label: "Legendary" },
  6: { name: "Orange",    hex: "#ffaa00", label: "Mythic" },
  7: { name: "Gold",      hex: "#d4a84b", label: "Ancient" },
  8: { name: "Shimmer",   hex: "#f0d890", label: "Artifact" },
};

// ─── Hand socket bone names (Bip001 skeleton) ─────────────────────────────────

export const HAND_BONE: Record<WeaponHand, string | string[]> = {
  right:  "Bip001 R Hand",
  left:   "Bip001 L Hand",
  both:   ["Bip001 R Hand", "Bip001 L Hand"],
  off:    "Bip001 L Hand",
};

// ─── Drop-in weapon registry ───────────────────────────────────────────────────
// Add a new entry here when you drop a weapon FBX into an equipment/ folder.
// Fields: id (unique), label, type, hands (1/2/"off"), hand (right/left/both/off),
//         file (path relative to /public), races (optional filter), posOffset, rotOffset.

export const WEAPON_REGISTRY: WeaponDef[] = [
  // ── Barbarians ───────────────────────────────────────────────────────────────
  {
    id: "brb-hammer-b", label: "BRB War Hammer",
    type: "hammer", hands: 1, hand: "right",
    file: a("/assets/barbarians/models/equipment/BRB_weapon_hammer_B.FBX"),
    races: ["barbarians"],
  },
  {
    id: "brb-spear", label: "BRB Spear",
    type: "spear", hands: 2, hand: "right",
    file: a("/assets/barbarians/models/equipment/BRB_weapon_spear.FBX"),
    races: ["barbarians"],
    lhPosOffset: [0, 0.15, 0],
    lhRotOffset: [0, 0, 0],
  },
  {
    id: "brb-staff-b", label: "BRB Orb Staff",
    type: "staff", hands: 1, hand: "right",
    file: a("/assets/barbarians/models/equipment/BRB_weapon_staff_B.FBX"),
    races: ["barbarians"],
  },
  {
    id: "brb-sword-b", label: "BRB Long Sword",
    type: "sword", hands: 1, hand: "right",
    file: a("/assets/barbarians/models/equipment/BRB_weapon_sword_B.FBX"),
    races: ["barbarians"],
  },

  // ── High Elves ────────────────────────────────────────────────────────────────
  {
    id: "elf-spear", label: "ELF Spear",
    type: "spear", hands: 2, hand: "right",
    file: a("/assets/elves/models/equipment/ELF_weapon_spear.FBX"),
    races: ["high-elves"],
    lhPosOffset: [0, 0.15, 0],
    lhRotOffset: [0, 0, 0],
  },
  {
    id: "elf-staff-c", label: "ELF Arcane Staff (2H)",
    type: "staff", hands: 2, hand: "right",
    file: a("/assets/elves/models/equipment/ELF_weapon_staff_C.FBX"),
    races: ["high-elves"],
    lhPosOffset: [0, 0.12, 0],
    lhRotOffset: [0, 0, 0],
  },

  // ── Orcs ─────────────────────────────────────────────────────────────────────
  {
    id: "orc-axe-a", label: "ORC Hand Axe",
    type: "axe", hands: 1, hand: "right",
    file: a("/assets/orcs/models/equipment/ORC_weapon_Axe_A.FBX"),
    races: ["orcs"],
  },
  {
    id: "orc-staff-b", label: "ORC Totem Staff (2H)",
    type: "staff", hands: 2, hand: "right",
    file: a("/assets/orcs/models/equipment/ORC_weapon_staff_B.FBX"),
    races: ["orcs"],
    lhPosOffset: [0, 0.12, 0],
    lhRotOffset: [0, 0, 0],
  },
  {
    id: "orc-shield-d", label: "ORC War Shield",
    type: "shield", hands: "off", hand: "off",
    file: a("/assets/orcs/models/equipment/ORC_Shield_D.FBX"),
    races: ["orcs"],
  },

  // ── Undead ────────────────────────────────────────────────────────────────────
  {
    id: "ud-spear", label: "UD Plague Spear (2H)",
    type: "spear", hands: 2, hand: "right",
    file: a("/assets/undead/models/equipment/UD_weapon_Spear.FBX"),
    races: ["undead"],
    lhPosOffset: [0, 0.15, 0],
    lhRotOffset: [0, 0, 0],
  },
  {
    id: "ud-staff-b", label: "UD Plague Staff (2H)",
    type: "staff", hands: 2, hand: "right",
    file: a("/assets/undead/models/equipment/UD_weapon_staff_B.FBX"),
    races: ["undead"],
    lhPosOffset: [0, 0.12, 0],
    lhRotOffset: [0, 0, 0],
  },
  {
    id: "ud-sword-c", label: "UD Plague Sword",
    type: "sword", hands: 1, hand: "right",
    file: a("/assets/undead/models/equipment/UD_weapon_Sword_C.FBX"),
    races: ["undead"],
  },
  {
    id: "ud-shield-c", label: "UD Tower Shield",
    type: "shield", hands: "off", hand: "off",
    file: a("/assets/undead/models/equipment/UD_Shield_C.FBX"),
    races: ["undead"],
  },

  // ── Western Kingdoms ──────────────────────────────────────────────────────────
  {
    id: "wk-staff-b", label: "WK Orb Staff",
    type: "staff", hands: 1, hand: "right",
    file: a("/assets/western-kingdoms/models/equipment/WK_weapon_staff_B.FBX"),
    races: ["western-kingdoms"],
  },
  {
    id: "wk-sword-a", label: "WK Short Sword",
    type: "sword", hands: 1, hand: "right",
    file: a("/assets/western-kingdoms/models/equipment/WK_weapon_sword_A.FBX"),
    races: ["western-kingdoms"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRAFTPIX UNIVERSAL WEAPONS (GLB on R2 CDN)
  // 6 tiers per type, cross-race, loaded from assets.grudge-studio.com
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Swords 1H ─────────────────────────────────────────────────────────────
  ...cpxWeapons("sword", "Sword", 1, "right", "sword_shield", 6),
  // ── Daggers 1H ────────────────────────────────────────────────────────────
  ...cpxWeapons("dagger", "Dagger", 1, "right", "sword", 6),
  // ── Axes 1H ───────────────────────────────────────────────────────────────
  ...cpxWeapons("axe", "Axe", 1, "right", "axe", 5, [1, 3, 4, 5, 6]),
  // ── Maces 1H ──────────────────────────────────────────────────────────────
  ...cpxWeapons("mace", "Mace", 1, "right", "club", 4, [1, 3, 4, 6]),
  // ── Hammers 2H ────────────────────────────────────────────────────────────
  ...cpxWeapons("hammer", "War Hammer", 2, "both", "club", 6),
  // ── Spears 2H ─────────────────────────────────────────────────────────────
  ...cpxWeapons("spear", "Spear", 2, "both", "sword", 6),
  // ── Bows 2H ───────────────────────────────────────────────────────────────
  ...cpxWeapons("bow", "Longbow", 2, "both", "longbow", 6),
  // ── Crossbows 2H ──────────────────────────────────────────────────────────
  ...cpxWeapons("crossbow", "Crossbow", 2, "both", "rifle", 6),
  // ── Staves 2H ─────────────────────────────────────────────────────────────
  ...cpxWeapons("staff", "Magic Staff", 2, "both", "magic", 6),
  // ── Wands 1H ──────────────────────────────────────────────────────────────
  ...cpxWeapons("wand", "Wand", 1, "right", "magic", 6),
];

// ── Craftpix weapon generator ───────────────────────────────────────────────

const CPX_CDN = "https://assets.grudge-studio.com/weapons/craftpix";

/** Default scale for craftpix models (they're large FBX exports → GLB) */
const CPX_SCALES: Record<string, number> = {
  sword: 0.01, dagger: 0.01, axe: 0.01, mace: 0.01,
  hammer: 0.01, spear: 0.01, bow: 0.01, crossbow: 0.01,
  staff: 0.01, wand: 0.01,
};

const TIER_NAMES = ["", "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Ancient", "Artifact"];

function cpxWeapons(
  type: WeaponType,
  baseName: string,
  hands: 1 | 2,
  hand: WeaponHand,
  animPack: string,
  count: number,
  availTiers?: number[],
): WeaponDef[] {
  const tiers = availTiers ?? Array.from({ length: count }, (_, i) => i + 1);
  return tiers.map((t) => ({
    id: `cpx-${type}-t${t}`,
    label: `${TIER_NAMES[t]} ${baseName}`,
    type: type as WeaponType,
    hands: hands as WeaponHands,
    hand,
    file: `${CPX_CDN}/${type}_t${t}.glb`,
    tier: t,
    animPack,
    scale: CPX_SCALES[type] ?? 0.01,
    posOffset: [0, 0, 0] as [number, number, number],
    rotOffset: [0, 0, 0] as [number, number, number],
  }));
}
