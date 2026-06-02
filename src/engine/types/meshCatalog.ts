export interface MeshEntry {
  id: string;
  label: string;
}

export interface MeshCategory {
  label: string;
  color: string;
  radio?: boolean;
  meshes: MeshEntry[];
}

export interface GearPreset {
  id: string;
  label: string;
  description: string;
  color: string;
  animPack: string;
  visibleMeshes: string[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function entries(ids: string[], labels: string[]): MeshEntry[] {
  return ids.map((id, i) => ({ id, label: labels[i] ?? id }));
}

// ─── BARBARIANS ───────────────────────────────────────────────────────────────

const BRB_HEAD_LABELS = [
  "Bare", "Horned Helm", "Skull Cap", "Open Face Helm", "Plate Visor",
  "Full Helm", "Winged Helm", "Barbute", "Great Helm", "Crown",
];
// NOTE: in this asset pack, *_body_A / *_Body_A is the bare-skin/loincloth
// mesh (no torso covering). Use *_body_B as the simplest "fully clothed"
// option in any preset that should render a complete character.
const BRB_BODY_LABELS = [
  "Bare / Loincloth", "Leather", "Chainmail", "Light Plate",
  "Mid Plate", "Heavy Plate", "Warlord", "Titan",
];

export const BRB_MESH_CATALOG: MeshCategory[] = [
  { label: "Head / Helm",   color: "#f59e0b", radio: true, meshes: entries(["BRB_head_A","BRB_head_B","BRB_head_C","BRB_head_D","BRB_head_E","BRB_head_F","BRB_head_G","BRB_head_H","BRB_head_I","BRB_head_J"], BRB_HEAD_LABELS) },
  { label: "Body / Chest",  color: "#3b82f6", radio: true, meshes: entries(["BRB_body_A","BRB_body_B","BRB_body_C","BRB_body_D","BRB_body_E","BRB_body_F","BRB_body_G","BRB_body_H"], BRB_BODY_LABELS) },
  { label: "Arms",          color: "#10b981", radio: true, meshes: entries(["BRB_arms_A","BRB_arms_B","BRB_arms_C"], ["Bare", "Bracers", "Plate Gauntlets"]) },
  { label: "Legs",          color: "#10b981", radio: true, meshes: entries(["BRB_legs_A","BRB_legs_B","BRB_legs_C"], ["Cloth", "Leather", "Plate Greaves"]) },
  { label: "Shoulders",     color: "#10b981", radio: true, meshes: entries(["BRB_shoulderpads_A","BRB_shoulderpads_B","BRB_shoulderpads_C"], ["Light Pads", "Medium Pads", "Heavy Pads"]) },
  { label: "Shields",       color: "#8b5cf6", meshes: entries(["BRB_Shield_A","BRB_Shield_B","BRB_Shield_C","BRB_Shield_D"], ["Round Shield", "Kite Shield", "Tower Shield", "Buckler"]) },
  { label: "Weapons",       color: "#ef4444", meshes: entries(["BRB_weapon_axe_A","BRB_weapon_axe_B","BRB_weapon_axe_C","BRB_weapon_sword_A","BRB_weapon_sword_B","BRB_weapon_hammer_A","BRB_weapon_hammer_B","BRB_weapon_staff_A","BRB_weapon_staff_B","BRB_weapon_staff_C","BRB_weapon_Bow","BRB_weapon_spear","BRB_weapon_Dagger"], ["Hand Axe","War Axe","Great Axe (2H)","Short Sword","Long Sword","Mace","War Hammer","Light Staff","Orb Staff","Gnarled Staff (2H)","Bow","Spear (2H)","Dagger"]) },
  { label: "Extras",        color: "#6b7280", meshes: entries(["BRB_Xtra_bag","BRB_Xtra_quiver","BRB_Xtra_wood"], ["Bag / Satchel", "Quiver", "Wood Prop"]) },
];

export const BRB_GEAR_PRESETS: GearPreset[] = [
  { id: "mage",    label: "Mage",    description: "Cloth & Staff",          color: "#7c3aed", animPack: "magic",       visibleMeshes: ["BRB_head_A","BRB_body_A","BRB_arms_A","BRB_legs_A","BRB_weapon_staff_C"] },
  { id: "knight",  label: "Knight",  description: "Full Plate & Sword",     color: "#1d4ed8", animPack: "sword_shield", visibleMeshes: ["BRB_head_F","BRB_body_F","BRB_arms_C","BRB_legs_C","BRB_shoulderpads_C","BRB_weapon_sword_B","BRB_Shield_B"] },
  { id: "ranger",  label: "Ranger",  description: "Leather & Bow",          color: "#15803d", animPack: "longbow",      visibleMeshes: ["BRB_head_C","BRB_body_B","BRB_arms_B","BRB_legs_B","BRB_shoulderpads_A","BRB_weapon_Bow","BRB_Xtra_quiver"] },
  { id: "warrior", label: "Warrior", description: "Chainmail & Great Axe",  color: "#c2410c", animPack: "sword_shield", visibleMeshes: ["BRB_head_B","BRB_body_C","BRB_arms_B","BRB_legs_B","BRB_shoulderpads_B","BRB_weapon_axe_C"] },
  { id: "unarmed", label: "Unarmed", description: "Cloth & No Weapon",      color: "#78716c", animPack: "unarmed",      visibleMeshes: ["BRB_head_A","BRB_body_B","BRB_arms_A","BRB_legs_A"] },
];

// ─── DWARVES ──────────────────────────────────────────────────────────────────

export const DWF_MESH_CATALOG: MeshCategory[] = [
  { label: "Head / Helm",   color: "#f59e0b", radio: true, meshes: [
    {id:"DWF_Units_Head_A",label:"Bare"},{id:"DWF_Units_Head_B",label:"Cap"},{id:"DWF_Units_Head_C",label:"Skull Cap"},{id:"DWF_Units_Head_D",label:"Nasal Helm"},{id:"DWF_Units_Head_E",label:"Plate Visor"},
    {id:"DWF_Units_Head_F",label:"Full Helm"},{id:"DWF_Units_Head_G",label:"Horned Helm"},{id:"DWF_Units_Head_H",label:"Plume Helm"},{id:"DWF_Units_Head_I",label:"Great Helm"},{id:"DWF_Units_Head_J",label:"Iron Crown"},
    {id:"DWF_Units_Head_K",label:"War Mask"},{id:"DWF_Units_Head_L",label:"Dragon Helm"},{id:"DWF_Units_Head_M",label:"Braided Helm"},{id:"DWF_Units_Head_N",label:"Ancestral Crown"},
  ]},
  { label: "Body / Chest",  color: "#3b82f6", radio: true, meshes: [
    {id:"DWF_Units_Body_A",label:"Bare / Loincloth"},{id:"DWF_Units_Body_B",label:"Leather"},{id:"DWF_Units_Body_C",label:"Chainmail"},{id:"DWF_Units_Body_D",label:"Plate"},{id:"DWF_Units_Body_E",label:"Heavy Plate"},
  ]},
  { label: "Arms",          color: "#10b981", radio: true, meshes: [
    {id:"DWF_Units_Arms_A",label:"Bare"},{id:"DWF_Units_Arms_B",label:"Bracers"},{id:"DWF_Units_Arms_C",label:"Gauntlets"},
  ]},
  { label: "Legs",          color: "#10b981", radio: true, meshes: [
    {id:"DWF_Units_Legs_A",label:"Cloth"},{id:"DWF_Units_Legs_B",label:"Leather"},{id:"DWF_Units_Legs_C",label:"Plate Greaves"},
  ]},
  { label: "Shoulders",     color: "#10b981", radio: true, meshes: [
    {id:"DWF_Units_Shoulderpads_A",label:"Light Pads"},{id:"DWF_Units_Shoulderpads_B",label:"Medium Pads"},{id:"DWF_Units_Shoulderpads_C",label:"Heavy Pads"},
  ]},
  { label: "Shields",       color: "#8b5cf6", meshes: [
    {id:"DWF_Shield_A",label:"Round Shield"},{id:"DWF_Shield_B",label:"Kite Shield"},{id:"DWF_Shield_C",label:"Tower Shield"},{id:"DWF_Shield_D",label:"Buckler"},
  ]},
  { label: "Weapons",       color: "#ef4444", meshes: [
    {id:"DWF_Weapon_axe_A",label:"Hand Axe"},{id:"DWF_Weapon_axe_B",label:"War Axe"},{id:"DWF_Weapon_axe_C",label:"Great Axe (2H)"},{id:"DWF_Weapon_sword_A",label:"Short Sword"},{id:"DWF_Weapon_sword_B",label:"Long Sword"},
    {id:"DWF_Weapon_hammer_A",label:"Mace"},{id:"DWF_Weapon_hammer_B",label:"War Hammer"},{id:"DWF_Weapon_pick",label:"War Pick (2H)"},{id:"DWF_Weapon_staff_A",label:"Light Staff"},{id:"DWF_Weapon_staff_B",label:"Orb Staff (2H)"},
    {id:"DWF_Weapon_bow",label:"Bow"},{id:"DWF_Weapon_spear",label:"Spear (2H)"},{id:"DWF_Weapon_dagger",label:"Dagger"},
  ]},
  { label: "Extras",        color: "#6b7280", meshes: [
    {id:"DWF_Xtra_bag",label:"Bag"},{id:"DWF_Xtra_quiver",label:"Quiver"},{id:"DWF_Xtra_wood",label:"Wood Prop"},
  ]},
];

export const DWF_GEAR_PRESETS: GearPreset[] = [
  { id: "mage",    label: "Mage",    description: "Cloth & Staff",          color: "#7c3aed", animPack: "magic",       visibleMeshes: ["DWF_Units_Head_A","DWF_Units_Body_A","DWF_Units_Arms_A","DWF_Units_Legs_A","DWF_Weapon_staff_B"] },
  { id: "knight",  label: "Knight",  description: "Full Plate & Sword",     color: "#1d4ed8", animPack: "sword_shield", visibleMeshes: ["DWF_Units_Head_F","DWF_Units_Body_D","DWF_Units_Arms_C","DWF_Units_Legs_C","DWF_Units_Shoulderpads_C","DWF_Weapon_sword_B","DWF_Shield_B"] },
  { id: "ranger",  label: "Ranger",  description: "Leather & Bow",          color: "#15803d", animPack: "longbow",      visibleMeshes: ["DWF_Units_Head_C","DWF_Units_Body_B","DWF_Units_Arms_B","DWF_Units_Legs_B","DWF_Units_Shoulderpads_A","DWF_Weapon_bow","DWF_Xtra_quiver"] },
  { id: "warrior", label: "Warrior", description: "Chainmail & Great Axe",  color: "#c2410c", animPack: "sword_shield", visibleMeshes: ["DWF_Units_Head_G","DWF_Units_Body_C","DWF_Units_Arms_B","DWF_Units_Legs_B","DWF_Units_Shoulderpads_B","DWF_Weapon_axe_C"] },
  { id: "unarmed", label: "Unarmed", description: "Cloth & No Weapon",      color: "#78716c", animPack: "unarmed",      visibleMeshes: ["DWF_Units_Head_A","DWF_Units_Body_B","DWF_Units_Arms_A","DWF_Units_Legs_A"] },
];

// ─── HIGH ELVES ───────────────────────────────────────────────────────────────

export const ELF_MESH_CATALOG: MeshCategory[] = [
  { label: "Head / Helm",   color: "#f59e0b", radio: true, meshes: [
    {id:"ELF_Units_Head_A",label:"Bare"},{id:"ELF_Units_Head_B",label:"Circlet"},{id:"ELF_Units_Head_C",label:"Leaf Cap"},{id:"ELF_Units_Head_D",label:"Hood"},{id:"ELF_Units_Head_E",label:"Nasal Helm"},
    {id:"ELF_Units_Head_F",label:"Winged Helm"},{id:"ELF_Units_Head_G",label:"Full Helm"},{id:"ELF_Units_Head_H",label:"Plume Helm"},{id:"ELF_Units_Head_I",label:"Great Helm"},{id:"ELF_Units_Head_J",label:"Moon Crown"},
    {id:"ELF_Units_Head_K",label:"Star Crown"},{id:"ELF_Units_Head_L",label:"Dragon Crest"},{id:"ELF_Units_Head_M",label:"High Crown"},{id:"ELF_Units_Head_N",label:"War Mask"},{id:"ELF_Units_Head_O",label:"Ancient Crown"},{id:"ELF_Units_Head_P",label:"Celestial Crown"},
  ]},
  { label: "Body / Chest",  color: "#3b82f6", radio: true, meshes: [
    {id:"ELF_Units_Body_A",label:"Bare / Loincloth"},{id:"ELF_Units_Body_B",label:"Leather"},{id:"ELF_Units_Body_C",label:"Chainmail"},{id:"ELF_Units_Body_D",label:"Plate"},{id:"ELF_Units_Body_E",label:"Heavy Plate"},{id:"ELF_Units_Body_F",label:"Arcane Plate"},
  ]},
  { label: "Arms",          color: "#10b981", radio: true, meshes: [
    {id:"ELF_Units_Arms_A",label:"Bare"},{id:"ELF_Units_Arms_B",label:"Bracers"},{id:"ELF_Units_Arms_C",label:"Gauntlets"},
  ]},
  { label: "Legs",          color: "#10b981", radio: true, meshes: [
    {id:"ELF_Units_Legs_A",label:"Cloth"},{id:"ELF_Units_Legs_B",label:"Leather"},{id:"ELF_Units_Legs_C",label:"Plate Greaves"},
  ]},
  { label: "Shoulders",     color: "#10b981", radio: true, meshes: [
    {id:"ELF_Units_Shoulderpads_A",label:"Light Pads"},{id:"ELF_Units_Shoulderpads_B",label:"Medium Pads"},{id:"ELF_Units_Shoulderpads_C",label:"Heavy Pads"},
  ]},
  { label: "Shields",       color: "#8b5cf6", meshes: [
    {id:"ELF_shield_A",label:"Leaf Shield"},{id:"ELF_shield_B",label:"Moon Shield"},{id:"ELF_shield_C",label:"Tower Shield"},
  ]},
  { label: "Weapons",       color: "#ef4444", meshes: [
    {id:"ELF_weapon_axe",label:"Elven Axe"},{id:"ELF_weapon_sword_A",label:"Short Sword"},{id:"ELF_weapon_sword_B",label:"Long Sword"},
    {id:"ELF_weapon_hammer",label:"War Hammer"},{id:"ELF_weapon_staff_A",label:"Light Staff"},{id:"ELF_weapon_staff_B",label:"Orb Staff"},{id:"ELF_weapon_staff_C",label:"Arcane Staff (2H)"},
    {id:"ELF_weapon_bow",label:"Longbow"},{id:"ELF_weapon_spear",label:"Spear (2H)"},{id:"ELF_weapon_dagger",label:"Dagger"},
  ]},
  { label: "Extras",        color: "#6b7280", meshes: [
    {id:"ELF_Xtra_bag",label:"Bag"},{id:"ELF_Xtra_quiver",label:"Quiver"},{id:"ELF_Xtra_wood",label:"Wood Prop"},
  ]},
];

export const ELF_GEAR_PRESETS: GearPreset[] = [
  { id: "mage",    label: "Mage",    description: "Cloth & Arcane Staff",   color: "#7c3aed", animPack: "magic",       visibleMeshes: ["ELF_Units_Head_B","ELF_Units_Body_A","ELF_Units_Arms_A","ELF_Units_Legs_A","ELF_weapon_staff_C"] },
  { id: "knight",  label: "Knight",  description: "Full Plate & Sword",     color: "#1d4ed8", animPack: "sword_shield", visibleMeshes: ["ELF_Units_Head_G","ELF_Units_Body_E","ELF_Units_Arms_C","ELF_Units_Legs_C","ELF_Units_Shoulderpads_C","ELF_weapon_sword_B","ELF_shield_B"] },
  { id: "ranger",  label: "Ranger",  description: "Leather & Bow",          color: "#15803d", animPack: "longbow",      visibleMeshes: ["ELF_Units_Head_C","ELF_Units_Body_B","ELF_Units_Arms_B","ELF_Units_Legs_B","ELF_Units_Shoulderpads_A","ELF_weapon_bow","ELF_Xtra_quiver"] },
  { id: "warrior", label: "Warrior", description: "Chainmail & Spear",      color: "#c2410c", animPack: "sword_shield", visibleMeshes: ["ELF_Units_Head_D","ELF_Units_Body_C","ELF_Units_Arms_B","ELF_Units_Legs_B","ELF_Units_Shoulderpads_B","ELF_weapon_spear"] },
  { id: "unarmed", label: "Unarmed", description: "Cloth & No Weapon",      color: "#78716c", animPack: "unarmed",      visibleMeshes: ["ELF_Units_Head_A","ELF_Units_Body_B","ELF_Units_Arms_A","ELF_Units_Legs_A"] },
];

// ─── ORCS ─────────────────────────────────────────────────────────────────────

export const ORC_MESH_CATALOG: MeshCategory[] = [
  { label: "Head / Helm",   color: "#f59e0b", radio: true, meshes: [
    {id:"ORC_Units_Head_A",label:"Bare"},{id:"ORC_Units_Head_B",label:"Bone Helm"},{id:"ORC_Units_Head_C",label:"Skull Cap"},{id:"ORC_Units_Head_D",label:"Open Helm"},
    {id:"ORC_Units_Head_E",label:"War Mask"},{id:"ORC_Units_Head_F",label:"Full Helm"},{id:"ORC_Units_Head_G",label:"Horned Helm"},{id:"ORC_Units_Head_H",label:"Warchief Crown"},
  ]},
  { label: "Body / Chest",  color: "#3b82f6", radio: true, meshes: [
    {id:"ORC_Units_Body_A",label:"Bare / Hide"},{id:"ORC_Units_Body_B",label:"Leather"},{id:"ORC_Units_Body_C",label:"Chainmail"},
    {id:"ORC_Units_Body_D",label:"Plate"},{id:"ORC_Units_Body_E",label:"Heavy Plate"},{id:"ORC_Units_Body_F",label:"Warlord Plate"},{id:"ORC_Units_Body_G",label:"Warchief Armor"},
  ]},
  { label: "Arms",          color: "#10b981", radio: true, meshes: [
    {id:"ORC_Units_Arms_A",label:"Bare"},{id:"ORC_Units_Arms_B",label:"Bracers"},{id:"ORC_Units_Arms_C",label:"Gauntlets"},
  ]},
  { label: "Legs",          color: "#10b981", radio: true, meshes: [
    {id:"ORC_Units_Legs_A",label:"Hide Wrap"},{id:"ORC_Units_Legs_B",label:"Leather"},{id:"ORC_Units_Legs_C",label:"Plate Greaves"},{id:"ORC_Units_Legs_D",label:"Heavy Plate Legs"},
  ]},
  { label: "Shoulders",     color: "#10b981", radio: true, meshes: [
    {id:"ORC_Units_Shoulderpads_A",label:"Bone Spikes"},{id:"ORC_Units_Shoulderpads_B",label:"Light Pads"},{id:"ORC_Units_Shoulderpads_C",label:"Medium Pads"},
    {id:"ORC_Units_Shoulderpads_D",label:"Heavy Pads"},{id:"ORC_Units_Shoulderpads_E",label:"Warlord Pads"},{id:"ORC_Units_Shoulderpads_F",label:"Warchief Pads"},
  ]},
  { label: "Shields",       color: "#8b5cf6", meshes: [
    {id:"ORC_Shield_A",label:"Bone Shield"},{id:"ORC_Shield_B",label:"Kite Shield"},{id:"ORC_Shield_C",label:"Tower Shield"},{id:"ORC_Shield_D",label:"War Shield"},
  ]},
  { label: "Weapons",       color: "#ef4444", meshes: [
    {id:"ORC_weapon_Axe_A",label:"Hand Axe"},{id:"ORC_weapon_Axe_B",label:"War Axe"},{id:"ORC_weapon_Axe_C",label:"Great Axe (2H)"},{id:"ORC_weapon_Sword_A",label:"Scimitar"},{id:"ORC_weapon_Sword_B",label:"Bone Sword"},
    {id:"ORC_weapon_Hammer",label:"War Hammer"},{id:"ORC_weapon_Mace_A",label:"Mace"},{id:"ORC_weapon_staff_A",label:"Light Staff"},{id:"ORC_weapon_staff_B",label:"Totem Staff"},{id:"ORC_weapon_staff_C",label:"Shaman Staff (2H)"},
    {id:"ORC_weapon_Bow",label:"Bow"},{id:"ORC_weapon_spear",label:"Spear (2H)"},{id:"ORC_weapon_Dagger",label:"Dagger"},
  ]},
  { label: "Extras",        color: "#6b7280", meshes: [
    {id:"ORC_Xtra_Bag",label:"Bag"},{id:"ORC_Xtra_quiver",label:"Quiver"},{id:"ORC_Xtra_Wood",label:"Wood Prop"},
  ]},
];

export const ORC_GEAR_PRESETS: GearPreset[] = [
  { id: "mage",    label: "Shaman",  description: "Hide & Totem Staff",     color: "#7c3aed", animPack: "magic",       visibleMeshes: ["ORC_Units_Head_A","ORC_Units_Body_A","ORC_Units_Arms_A","ORC_Units_Legs_A","ORC_weapon_staff_C"] },
  { id: "knight",  label: "Warchief",description: "Heavy Plate & Axe",      color: "#1d4ed8", animPack: "sword_shield", visibleMeshes: ["ORC_Units_Head_G","ORC_Units_Body_F","ORC_Units_Arms_C","ORC_Units_Legs_C","ORC_Units_Shoulderpads_F","ORC_weapon_Axe_C","ORC_Shield_C"] },
  { id: "ranger",  label: "Hunter",  description: "Leather & Bow",          color: "#15803d", animPack: "longbow",      visibleMeshes: ["ORC_Units_Head_B","ORC_Units_Body_B","ORC_Units_Arms_B","ORC_Units_Legs_B","ORC_Units_Shoulderpads_A","ORC_weapon_Bow","ORC_Xtra_quiver"] },
  { id: "warrior", label: "Warrior", description: "Chainmail & Great Axe",  color: "#c2410c", animPack: "sword_shield", visibleMeshes: ["ORC_Units_Head_E","ORC_Units_Body_C","ORC_Units_Arms_B","ORC_Units_Legs_B","ORC_Units_Shoulderpads_C","ORC_weapon_Axe_B"] },
  { id: "unarmed", label: "Brawler", description: "Bare Hide & No Weapon",  color: "#78716c", animPack: "unarmed",      visibleMeshes: ["ORC_Units_Head_A","ORC_Units_Body_A","ORC_Units_Arms_A","ORC_Units_Legs_A"] },
];

// ─── UNDEAD ───────────────────────────────────────────────────────────────────

export const UD_MESH_CATALOG: MeshCategory[] = [
  { label: "Head / Helm",   color: "#f59e0b", radio: true, meshes: [
    {id:"UD_Units_head_A",label:"Skull"},{id:"UD_Units_head_B",label:"Bone Cap"},{id:"UD_Units_head_C",label:"Death Mask"},{id:"UD_Units_head_D",label:"Ribcage Helm"},
    {id:"UD_Units_head_E",label:"Open Helm"},{id:"UD_Units_head_F",label:"Full Helm"},{id:"UD_Units_head_G",label:"Horned Crown"},{id:"UD_Units_head_H",label:"War Helm"},
    {id:"UD_Units_head_I",label:"Plague Mask"},{id:"UD_Units_head_J",label:"Bone Crown"},{id:"UD_Units_head_K",label:"Death Crown"},{id:"UD_Units_head_L",label:"Lich Helm"},{id:"UD_Units_head_M",label:"Lich Crown"},
  ]},
  { label: "Body / Chest",  color: "#3b82f6", radio: true, meshes: [
    {id:"UD_Units_body_A",label:"Bare Bones"},{id:"UD_Units_body_B",label:"Bone Armor"},{id:"UD_Units_body_C",label:"Ribcage Plate"},
    {id:"UD_Units_body_D",label:"Plague Plate"},{id:"UD_Units_body_E",label:"Heavy Plate"},{id:"UD_Units_body_F",label:"Death Knight Plate"},{id:"UD_Units_body_G",label:"Lich Robe"},
  ]},
  { label: "Arms",          color: "#10b981", radio: true, meshes: [
    {id:"UD_Units_arms_A",label:"Bone"},{id:"UD_Units_arms_B",label:"Rotted Cloth"},{id:"UD_Units_arms_C",label:"Bracers"},
    {id:"UD_Units_arms_D",label:"Plate Gauntlets"},{id:"UD_Units_arms_E",label:"Death Gauntlets"},
  ]},
  { label: "Legs",          color: "#10b981", radio: true, meshes: [
    {id:"UD_Units_legs_A",label:"Bone Legs"},{id:"UD_Units_legs_B",label:"Rotted Cloth"},{id:"UD_Units_legs_C",label:"Plate Greaves"},{id:"UD_Units_legs_D",label:"Death Knight Legs"},
  ]},
  { label: "Shoulders",     color: "#10b981", radio: true, meshes: [
    {id:"UD_Units_shoulderpads_A",label:"Bone Spikes"},{id:"UD_Units_shoulderpads_B",label:"Plate Pads"},{id:"UD_Units_shoulderpads_C",label:"Death Pads"},
  ]},
  { label: "Shields",       color: "#8b5cf6", meshes: [
    {id:"UD_Shield_A",label:"Bone Shield"},{id:"UD_Shield_B",label:"Kite Shield"},{id:"UD_Shield_C",label:"Tower Shield"},
  ]},
  { label: "Weapons",       color: "#ef4444", meshes: [
    {id:"UD_weapon_Axe_A",label:"Bone Axe"},{id:"UD_weapon_Axe_B",label:"Death Axe (2H)"},{id:"UD_weapon_Sword_A",label:"Rusted Sword"},{id:"UD_weapon_Sword_B",label:"Death Sword"},{id:"UD_weapon_Sword_C",label:"Plague Sword"},
    {id:"UD_weapon_Hammer",label:"War Hammer"},{id:"UD_weapon_staff_A",label:"Bone Staff"},{id:"UD_weapon_staff_B",label:"Plague Staff"},{id:"UD_weapon_staff_C",label:"Lich Staff"},{id:"UD_weapon_staff_D",label:"Lich Staff (2H)"},
    {id:"UD_weapon_Bow",label:"Bone Bow"},{id:"UD_weapon_Spear",label:"Plague Spear (2H)"},
  ]},
  { label: "Extras",        color: "#6b7280", meshes: [
    {id:"UD_Xtra_Bag",label:"Bag"},{id:"UD_Xtra_Quiver",label:"Quiver"},{id:"UD_Xtra_Wood",label:"Wood Prop"},
  ]},
];

export const UD_GEAR_PRESETS: GearPreset[] = [
  { id: "mage",    label: "Lich",         description: "Robe & Lich Staff",     color: "#7c3aed", animPack: "magic",       visibleMeshes: ["UD_Units_head_A","UD_Units_body_G","UD_Units_arms_B","UD_Units_legs_B","UD_weapon_staff_D"] },
  { id: "knight",  label: "Death Knight", description: "Full Plate & Sword",    color: "#1d4ed8", animPack: "sword_shield", visibleMeshes: ["UD_Units_head_F","UD_Units_body_F","UD_Units_arms_D","UD_Units_legs_D","UD_Units_shoulderpads_C","UD_weapon_Sword_B","UD_Shield_C"] },
  { id: "ranger",  label: "Shade",        description: "Bone Armor & Bow",      color: "#15803d", animPack: "longbow",      visibleMeshes: ["UD_Units_head_C","UD_Units_body_B","UD_Units_arms_B","UD_Units_legs_B","UD_Units_shoulderpads_A","UD_weapon_Bow","UD_Xtra_Quiver"] },
  { id: "warrior", label: "Warrior",      description: "Plague Plate & Axe",    color: "#c2410c", animPack: "sword_shield", visibleMeshes: ["UD_Units_head_G","UD_Units_body_D","UD_Units_arms_C","UD_Units_legs_C","UD_Units_shoulderpads_B","UD_weapon_Axe_B"] },
  { id: "unarmed", label: "Risen",        description: "Bone Armor & No Weapon",color: "#78716c", animPack: "unarmed",      visibleMeshes: ["UD_Units_head_A","UD_Units_body_B","UD_Units_arms_A","UD_Units_legs_A"] },
];

// ─── WESTERN KINGDOMS ─────────────────────────────────────────────────────────

export const WK_MESH_CATALOG: MeshCategory[] = [
  { label: "Head / Helm",   color: "#f59e0b", radio: true, meshes: [
    {id:"WK_Units_head_A",label:"Bare"},{id:"WK_Units_head_B",label:"Coif"},{id:"WK_Units_head_C",label:"Skull Cap"},{id:"WK_Units_head_D",label:"Open Helm"},
    {id:"WK_Units_head_E",label:"Plate Visor"},{id:"WK_Units_head_F",label:"Full Helm"},{id:"WK_Units_head_G",label:"Great Helm"},{id:"WK_Units_head_H",label:"Plume Helm"},{id:"WK_Units_head_I",label:"Royal Crown"},
  ]},
  { label: "Body / Chest",  color: "#3b82f6", radio: true, meshes: [
    {id:"WK_Units_Body_A",label:"Bare / Loincloth"},{id:"WK_Units_Body_B",label:"Leather"},{id:"WK_Units_Body_C",label:"Chainmail"},{id:"WK_Units_Body_D",label:"Plate"},{id:"WK_Units_Body_E",label:"Heavy Plate"},
  ]},
  { label: "Arms",          color: "#10b981", radio: true, meshes: [
    {id:"WK_Units_Arms_A",label:"Bare"},{id:"WK_Units_Arms_B",label:"Bracers"},{id:"WK_Units_Arms_C",label:"Gauntlets"},{id:"WK_Units_Arms_D",label:"Plate Gauntlets"},
  ]},
  { label: "Legs",          color: "#10b981", radio: true, meshes: [
    {id:"WK_Units_Legs_A",label:"Cloth"},{id:"WK_Units_Legs_B",label:"Leather"},{id:"WK_Units_Legs_C",label:"Plate Greaves"},
  ]},
  { label: "Shoulders",     color: "#10b981", radio: true, meshes: [
    {id:"WK_Units_shoulderpads_A",label:"Light Pads"},{id:"WK_Units_shoulderpads_B",label:"Heavy Pads"},
  ]},
  { label: "Shields",       color: "#8b5cf6", meshes: [
    {id:"WK_Shield_A",label:"Round Shield"},{id:"WK_Shield_B",label:"Kite Shield"},{id:"WK_Shield_C",label:"Tower Shield"},{id:"WK_Shield_D",label:"Heater Shield"},
  ]},
  { label: "Weapons",       color: "#ef4444", meshes: [
    {id:"WK_weapon_axe_A",label:"Hand Axe"},{id:"WK_weapon_axe_B",label:"War Axe"},{id:"WK_weapon_sword_A",label:"Short Sword"},{id:"WK_weapon_sword_B",label:"Long Sword"},
    {id:"WK_weapon_hammer_A",label:"Mace"},{id:"WK_weapon_hammer_B",label:"War Hammer"},{id:"WK_weapon_pick",label:"War Pick (2H)"},{id:"WK_weapon_staff_A",label:"Light Staff"},{id:"WK_weapon_staff_B",label:"Orb Staff"},{id:"WK_weapon_staff_C",label:"Holy Staff (2H)"},
    {id:"WK_weapon_Bow",label:"Longbow"},{id:"WK_weapon_spear",label:"Spear (2H)"},
  ]},
  { label: "Extras",        color: "#6b7280", meshes: [
    {id:"WK_Xtra_bag",label:"Bag"},{id:"WK_Xtra_quiver",label:"Quiver"},{id:"WK_Xtra_wood",label:"Wood Prop"},
  ]},
];

export const WK_GEAR_PRESETS: GearPreset[] = [
  { id: "mage",    label: "Wizard",  description: "Cloth Robe & Holy Staff", color: "#7c3aed", animPack: "magic",       visibleMeshes: ["WK_Units_head_A","WK_Units_Body_A","WK_Units_Arms_A","WK_Units_Legs_A","WK_weapon_staff_C"] },
  { id: "knight",  label: "Knight",  description: "Full Plate & Sword",      color: "#1d4ed8", animPack: "sword_shield", visibleMeshes: ["WK_Units_head_F","WK_Units_Body_E","WK_Units_Arms_D","WK_Units_Legs_C","WK_Units_shoulderpads_B","WK_weapon_sword_B","WK_Shield_B"] },
  { id: "ranger",  label: "Archer",  description: "Leather & Longbow",       color: "#15803d", animPack: "longbow",      visibleMeshes: ["WK_Units_head_C","WK_Units_Body_B","WK_Units_Arms_B","WK_Units_Legs_B","WK_weapon_Bow","WK_Xtra_quiver"] },
  { id: "warrior", label: "Warrior", description: "Chainmail & Great Axe",   color: "#c2410c", animPack: "sword_shield", visibleMeshes: ["WK_Units_head_D","WK_Units_Body_C","WK_Units_Arms_B","WK_Units_Legs_B","WK_Units_shoulderpads_A","WK_weapon_axe_B"] },
  { id: "unarmed", label: "Unarmed", description: "Cloth & No Weapon",       color: "#78716c", animPack: "unarmed",      visibleMeshes: ["WK_Units_head_A","WK_Units_Body_B","WK_Units_Arms_A","WK_Units_Legs_A"] },
];

// ─── Registry ─────────────────────────────────────────────────────────────────

export const RACE_MESH_CATALOG: Record<string, MeshCategory[]> = {
  barbarians:       BRB_MESH_CATALOG,
  dwarves:          DWF_MESH_CATALOG,
  "high-elves":     ELF_MESH_CATALOG,
  orcs:             ORC_MESH_CATALOG,
  undead:           UD_MESH_CATALOG,
  "western-kingdoms": WK_MESH_CATALOG,
};

export const RACE_GEAR_PRESETS: Record<string, GearPreset[]> = {
  barbarians:       BRB_GEAR_PRESETS,
  dwarves:          DWF_GEAR_PRESETS,
  "high-elves":     ELF_GEAR_PRESETS,
  orcs:             ORC_GEAR_PRESETS,
  undead:           UD_GEAR_PRESETS,
  "western-kingdoms": WK_GEAR_PRESETS,
};
