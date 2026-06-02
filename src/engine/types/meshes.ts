export type MeshCategory =
  | "head"
  | "body"
  | "arms"
  | "legs"
  | "shoulders"
  | "weapon"
  | "shield"
  | "extras";

export interface MeshDef {
  id: string;
  label: string;
  category: MeshCategory;
  variant: string;
  isDefault?: boolean;
}

export interface MeshCategoryDef {
  id: MeshCategory;
  label: string;
  icon: string;
  single: boolean;
}

export const MESH_CATEGORIES: MeshCategoryDef[] = [
  { id: "head",      label: "Head / Helmet",   icon: "⛑",  single: true },
  { id: "body",      label: "Body / Armor",     icon: "🛡",  single: true },
  { id: "arms",      label: "Arms / Bracers",   icon: "💪",  single: true },
  { id: "legs",      label: "Legs / Greaves",   icon: "🦵",  single: true },
  { id: "shoulders", label: "Shoulder Pads",    icon: "🔱",  single: true },
  { id: "weapon",    label: "Weapon",           icon: "⚔",   single: true },
  { id: "shield",    label: "Shield",           icon: "🛡",  single: true },
  { id: "extras",    label: "Extras",           icon: "🎒",  single: false },
];

export const ALL_MESHES: MeshDef[] = [
  // ── HEAD / HELMET ────────────────────────────────────────────
  { id: "BRB_head_A", label: "Head A — Bare",          category: "head", variant: "A", isDefault: true },
  { id: "BRB_head_B", label: "Head B — Horned",        category: "head", variant: "B" },
  { id: "BRB_head_C", label: "Head C — Skull Cap",     category: "head", variant: "C" },
  { id: "BRB_head_D", label: "Head D — Plate Visor",   category: "head", variant: "D" },
  { id: "BRB_head_E", label: "Head E — Open Face",     category: "head", variant: "E" },
  { id: "BRB_head_F", label: "Head F — Full Helm",     category: "head", variant: "F" },
  { id: "BRB_head_G", label: "Head G — Winged",        category: "head", variant: "G" },
  { id: "BRB_head_H", label: "Head H — Barbute",       category: "head", variant: "H" },
  { id: "BRB_head_I", label: "Head I — Great Helm",    category: "head", variant: "I" },
  { id: "BRB_head_J", label: "Head J — Crown",         category: "head", variant: "J" },

  // ── BODY / TORSO ARMOR ───────────────────────────────────────
  { id: "BRB_body_A", label: "Body A — Leather",       category: "body", variant: "A", isDefault: true },
  { id: "BRB_body_B", label: "Body B — Chainmail",     category: "body", variant: "B" },
  { id: "BRB_body_C", label: "Body C — Plate Light",   category: "body", variant: "C" },
  { id: "BRB_body_D", label: "Body D — Plate Mid",     category: "body", variant: "D" },
  { id: "BRB_body_E", label: "Body E — Plate Heavy",   category: "body", variant: "E" },
  { id: "BRB_body_F", label: "Body F — Warlord",       category: "body", variant: "F" },
  { id: "BRB_body_G", label: "Body G — Berserker",     category: "body", variant: "G" },
  { id: "BRB_body_H", label: "Body H — Titan",         category: "body", variant: "H" },

  // ── ARMS / BRACERS ───────────────────────────────────────────
  { id: "BRB_arms_A", label: "Arms A — Bare",          category: "arms", variant: "A", isDefault: true },
  { id: "BRB_arms_B", label: "Arms B — Bracers",       category: "arms", variant: "B" },
  { id: "BRB_arms_C", label: "Arms C — Gauntlets",     category: "arms", variant: "C" },

  // ── LEGS / GREAVES ───────────────────────────────────────────
  { id: "BRB_legs_A", label: "Legs A — Cloth",         category: "legs", variant: "A", isDefault: true },
  { id: "BRB_legs_B", label: "Legs B — Leather",       category: "legs", variant: "B" },
  { id: "BRB_legs_C", label: "Legs C — Plate",         category: "legs", variant: "C" },

  // ── SHOULDER PADS ────────────────────────────────────────────
  { id: "BRB_shoulderpads_A", label: "Shoulders A — Light",  category: "shoulders", variant: "A", isDefault: true },
  { id: "BRB_shoulderpads_B", label: "Shoulders B — Medium", category: "shoulders", variant: "B" },
  { id: "BRB_shoulderpads_C", label: "Shoulders C — Heavy",  category: "shoulders", variant: "C" },

  // ── WEAPONS ──────────────────────────────────────────────────
  { id: "BRB_weapon_axe_A",    label: "Axe A — Hand Axe",    category: "weapon", variant: "axe_A",    isDefault: true },
  { id: "BRB_weapon_axe_B",    label: "Axe B — War Axe",     category: "weapon", variant: "axe_B" },
  { id: "BRB_weapon_axe_C",    label: "Axe C — Great Axe",   category: "weapon", variant: "axe_C" },
  { id: "BRB_weapon_sword_A",  label: "Sword A — Short",     category: "weapon", variant: "sword_A" },
  { id: "BRB_weapon_sword_B",  label: "Sword B — Long",      category: "weapon", variant: "sword_B" },
  { id: "BRB_weapon_hammer_A", label: "Hammer A — Mace",     category: "weapon", variant: "hammer_A" },
  { id: "BRB_weapon_hammer_B", label: "Hammer B — War",      category: "weapon", variant: "hammer_B" },
  { id: "BRB_weapon_staff_A",  label: "Staff A — Light",     category: "weapon", variant: "staff_A" },
  { id: "BRB_weapon_staff_B",  label: "Staff B — Orb",       category: "weapon", variant: "staff_B" },
  { id: "BRB_weapon_staff_C",  label: "Staff C — Gnarled",   category: "weapon", variant: "staff_C" },
  { id: "BRB_weapon_Bow",      label: "Longbow",              category: "weapon", variant: "bow" },
  { id: "BRB_weapon_spear",    label: "Spear",                category: "weapon", variant: "spear" },
  { id: "BRB_weapon_Dagger",   label: "Dagger",               category: "weapon", variant: "dagger" },

  // ── SHIELDS ──────────────────────────────────────────────────
  { id: "BRB_Shield_A", label: "Shield A — Round",      category: "shield", variant: "A" },
  { id: "BRB_Shield_B", label: "Shield B — Kite",       category: "shield", variant: "B" },
  { id: "BRB_Shield_C", label: "Shield C — Tower",      category: "shield", variant: "C" },
  { id: "BRB_Shield_D", label: "Shield D — Buckler",    category: "shield", variant: "D" },

  // ── EXTRAS ───────────────────────────────────────────────────
  { id: "BRB_Xtra_bag",    label: "Bag / Satchel",       category: "extras", variant: "bag" },
  { id: "BRB_Xtra_quiver", label: "Quiver",              category: "extras", variant: "quiver" },
  { id: "BRB_Xtra_wood",   label: "Wood Prop",           category: "extras", variant: "wood" },
];

export const DEFAULT_VISIBLE_MESHES: Set<string> = new Set(
  ALL_MESHES.filter((m) => m.isDefault).map((m) => m.id)
);

export function getMeshById(id: string): MeshDef | undefined {
  return ALL_MESHES.find((m) => m.id === id);
}

export function getMeshesByCategory(cat: MeshCategory): MeshDef[] {
  return ALL_MESHES.filter((m) => m.category === cat);
}
