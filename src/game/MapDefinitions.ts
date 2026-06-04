/**
 * MapDefinitions.ts
 * Available arena maps — procedural and GLB-based.
 */

export type MapType = "procedural" | "glb";

export interface MapDef {
  id: string;
  name: string;
  type: MapType;
  description: string;
  /** GLB model URL (only for type "glb") */
  modelUrl?: string;
  /** Emoji thumbnail for the selection card */
  icon: string;
  /** Recommended player spawn position [x, y, z] */
  spawnPos: [number, number, number];
  /** Map scale multiplier for GLB maps */
  scale?: number;
  /** Ambient light intensity override */
  ambientLight?: number;
  /** Sky type */
  sky: "day" | "night" | "cave";
}

export const MAP_CATALOG: MapDef[] = [
  {
    id: "grudge_island",
    name: "Grudge Island",
    type: "procedural",
    description: "Rolling hills, medieval village, open terrain. Classic arena.",
    icon: "🏝️",
    spawnPos: [0, 2, 10],
    sky: "day",
  },
  {
    id: "underground_wars",
    name: "Underground Wars",
    type: "glb",
    description: "Dark subterranean arena. Close-quarters combat in tight corridors.",
    modelUrl: "/maps/underground_wars.glb",
    icon: "⚔️",
    spawnPos: [0, 1, 0],
    scale: 1,
    ambientLight: 0.6,
    sky: "cave",
  },
];

export function getMapById(id: string): MapDef | undefined {
  return MAP_CATALOG.find(m => m.id === id);
}
