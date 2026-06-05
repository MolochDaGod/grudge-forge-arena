import { assetUrl } from "../assetUrl";

export interface TextureVariant {
  label: string;
  url: string;
}

export interface SkinColorEntry {
  label: string;
  hex: string;
}

export interface RaceConfig {
  id: string;
  name: string;
  abbr: string;
  color: string;
  modelUrl: string;
  textureUrl: string;
  textureVariants?: TextureVariant[];
  skinPalette?: SkinColorEntry[];
  /** HSL skin detection: hue range [0..1], saturation, lightness */
  skinHueRange?: [number, number];
  skinSatRange?: [number, number];
  skinLitRange?: [number, number];
}

/** Shorthand: resolve a /assets/… or /anims/… path through R2 CDN */
const a = assetUrl;

// Helper: build a tinted variant URL (base TGA + overlay colour encoded in the hash)
function tint(baseUrl: string, label: string, hex: string): TextureVariant {
  return { label, url: `${baseUrl}#tint-${hex.replace("#", "")}` };
}

// Colour variants that are synthesised at runtime via overlay blend
const COLOR_VARIANTS = (baseUrl: string) => [
  tint(baseUrl, "Blue",   "3366ee"),
  tint(baseUrl, "Green",  "22993a"),
  tint(baseUrl, "Red",    "cc2222"),
  tint(baseUrl, "Purple", "8833cc"),
  tint(baseUrl, "Orange", "ee7711"),
  tint(baseUrl, "Black",  "222222"),
];

// Skin color palettes and HSL detection ranges per race.
// skinHueRange / skinSatRange / skinLitRange are in [0..1] and used for
// per-pixel skin detection in the texture tinting pipeline.

const HUMAN_SKIN_HSL = {
  skinHueRange: [0.03, 0.12] as [number, number],  // ~10°–43° (warm tan)
  skinSatRange: [0.28, 0.92] as [number, number],
  skinLitRange: [0.38, 0.82] as [number, number],
};

export const RACES: RaceConfig[] = [
  {
    id: "barbarians",
    name: "Barbarians",
    abbr: "BRB",
    color: "#c2410c",
    modelUrl: a("/assets/barbarians/models/BRB_Characters.glb"),
    textureUrl: a("/assets/barbarians/textures/BRB_StandardUnits_texture.png"),
    ...HUMAN_SKIN_HSL,
    skinPalette: [
      { label: "Nordic Pale",  hex: "#f0c8a0" },
      { label: "Warrior Tan",  hex: "#c87840" },
      { label: "Darkblood",    hex: "#7a3c20" },
      { label: "Sunburnt",     hex: "#c05828" },
    ],
    textureVariants: [
      { label: "Default", url: a("/assets/barbarians/textures/BRB_StandardUnits_texture.tga") },
      { label: "Brown",   url: a("/assets/barbarians/textures/BRB_Standard_Units_brown.tga") },
      ...COLOR_VARIANTS(a("/assets/barbarians/textures/BRB_StandardUnits_texture.tga")),
    ],
  },
  {
    id: "dwarves",
    name: "Dwarves",
    abbr: "DWF",
    color: "#b45309",
    modelUrl: a("/assets/dwarves/models/DWF_Characters.glb"),
    textureUrl: a("/assets/dwarves/textures/DWF_Standard_Units.png"),
    ...HUMAN_SKIN_HSL,
    skinPalette: [
      { label: "Ruddy Pale",   hex: "#e8a878" },
      { label: "Stone-Worn",   hex: "#b87848" },
      { label: "Deep Forge",   hex: "#7a4828" },
      { label: "Ironblood",    hex: "#903830" },
    ],
    textureVariants: [
      { label: "Default", url: a("/assets/dwarves/textures/DWF_Standard_Units.tga") },
      { label: "Brown",   url: a("/assets/dwarves/textures/DWF_Units_Brown.tga") },
      ...COLOR_VARIANTS(a("/assets/dwarves/textures/DWF_Standard_Units.tga")),
    ],
  },
  {
    id: "high-elves",
    name: "High Elves",
    abbr: "ELF",
    color: "#0891b2",
    modelUrl: a("/assets/elves/models/ELF_Characters.glb"),
    textureUrl: a("/assets/elves/textures/ELF_HighElves_Texture.png"),
    skinHueRange: [0.03, 0.14],
    skinSatRange: [0.18, 0.82],
    skinLitRange: [0.52, 0.94],
    skinPalette: [
      { label: "Porcelain",    hex: "#f5e0d0" },
      { label: "Ivory",        hex: "#e0c0a0" },
      { label: "Sun-Kissed",   hex: "#c89868" },
      { label: "Ashen",        hex: "#c0b8d4" },
      { label: "Shadow",       hex: "#786070" },
    ],
    textureVariants: [
      { label: "High Elves",       url: a("/assets/elves/textures/ELF_HighElves_Texture.tga") },
      { label: "Dark Elves",       url: a("/assets/elves/textures/ELF_DarkElves_Texture.tga") },
      { label: "Dark Blue",        url: a("/assets/elves/textures/ELF_DarkElves_Blue.tga") },
      { label: "Dark Green",       url: a("/assets/elves/textures/ELF_DarkElves_Green.tga") },
      { label: "Dark Red",         url: a("/assets/elves/textures/ELF_DarkElves_Red.tga") },
      { label: "Wood Elves",       url: a("/assets/elves/textures/ELF_WoodElves_Texture.tga") },
      { label: "Wood Brown",       url: a("/assets/elves/textures/ELF_WoodElves_Brown.tga") },
      tint(a("/assets/elves/textures/ELF_HighElves_Texture.tga"), "Purple", "8833cc"),
      tint(a("/assets/elves/textures/ELF_HighElves_Texture.tga"), "Orange", "ee7711"),
      tint(a("/assets/elves/textures/ELF_HighElves_Texture.tga"), "Black",  "222222"),
    ],
  },
  {
    id: "orcs",
    name: "Orcs",
    abbr: "ORC",
    color: "#15803d",
    modelUrl: a("/assets/orcs/models/ORC_Characters.glb"),
    textureUrl: a("/assets/orcs/textures/ORC_StandardUnits.png"),
    skinHueRange: [0.24, 0.42],   // ~86°–151° green range
    skinSatRange: [0.22, 0.80],
    skinLitRange: [0.24, 0.64],
    skinPalette: [
      { label: "Swamp Green",  hex: "#5a8040" },
      { label: "Dark Blood",   hex: "#385028" },
      { label: "Iron Grey",    hex: "#5a6858" },
      { label: "Fel-Touched",  hex: "#488858" },
      { label: "Warchief",     hex: "#304828" },
    ],
    textureVariants: [
      { label: "Default", url: a("/assets/orcs/textures/ORC_StandardUnits.tga") },
      { label: "Blue",    url: a("/assets/orcs/textures/ORC_StandardUnits_blue.tga") },
      { label: "Brown",   url: a("/assets/orcs/textures/ORC_StandardUnits_brown.tga") },
      { label: "Green",   url: a("/assets/orcs/textures/ORC_StandardUnits_green.tga") },
      { label: "Red",     url: a("/assets/orcs/textures/ORC_StandardUnits_red.tga") },
      { label: "Black",   url: a("/assets/orcs/textures/ORC_StandardUnits_black.tga") },
      tint(a("/assets/orcs/textures/ORC_StandardUnits.tga"), "Purple", "8833cc"),
      tint(a("/assets/orcs/textures/ORC_StandardUnits.tga"), "Orange", "ee7711"),
    ],
  },
  {
    id: "undead",
    name: "Undead",
    abbr: "UD",
    color: "#7c3aed",
    modelUrl: a("/assets/undead/models/UD_Characters.glb"),
    textureUrl: a("/assets/undead/textures/UD_Standard_Units.png"),
    // Undead "skin" is desaturated bone — any hue, very low saturation
    skinHueRange: [0.0, 1.0],
    skinSatRange: [0.0, 0.20],
    skinLitRange: [0.38, 0.82],
    skinPalette: [
      { label: "Bone White",   hex: "#d0ccc0" },
      { label: "Pale Grey",    hex: "#b0aca8" },
      { label: "Ancient",      hex: "#887870" },
      { label: "Plague",       hex: "#98a870" },
      { label: "Lich",         hex: "#c4c8e0" },
    ],
    textureVariants: [
      { label: "Default", url: a("/assets/undead/textures/UD_Standard_Units.tga") },
      { label: "Brown",   url: a("/assets/undead/textures/UD_Standard_Units_brown.tga") },
      ...COLOR_VARIANTS(a("/assets/undead/textures/UD_Standard_Units.tga")),
    ],
  },
  {
    id: "western-kingdoms",
    name: "W. Kingdoms",
    abbr: "WK",
    color: "#1d4ed8",
    modelUrl: a("/assets/western-kingdoms/models/WK_Characters.glb"),
    textureUrl: a("/assets/western-kingdoms/textures/WK_Standard_Units.png"),
    ...HUMAN_SKIN_HSL,
    skinPalette: [
      { label: "Fair",         hex: "#f0c8a0" },
      { label: "Olive",        hex: "#c09868" },
      { label: "Tanned",       hex: "#a06838" },
      { label: "Dark",         hex: "#6c3a20" },
    ],
    textureVariants: [
      { label: "Default", url: a("/assets/western-kingdoms/textures/WK_Standard_Units.tga") },
      { label: "Blue",    url: a("/assets/western-kingdoms/textures/WK_StandardUnits_blue.tga") },
      { label: "Brown",   url: a("/assets/western-kingdoms/textures/WK_StandardUnits_brown.tga") },
      { label: "Green",   url: a("/assets/western-kingdoms/textures/WK_StandardUnits_green.tga") },
      { label: "Red",     url: a("/assets/western-kingdoms/textures/WK_StandardUnits_red.tga") },
      { label: "Black",   url: a("/assets/western-kingdoms/textures/WK_StandardUnits_black.tga") },
      { label: "White",   url: a("/assets/western-kingdoms/textures/WK_StandardUnits_white.tga") },
      tint(a("/assets/western-kingdoms/textures/WK_Standard_Units.tga"), "Purple", "8833cc"),
      tint(a("/assets/western-kingdoms/textures/WK_Standard_Units.tga"), "Orange", "ee7711"),
    ],
  },
];
