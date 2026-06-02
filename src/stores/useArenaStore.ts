import { create } from "zustand";
import type { RaceConfig } from "../engine/types/races";
import type { GearPreset } from "../engine/types/meshCatalog";

export type ArenaPhase = "select" | "playing" | "gameOver" | "victory";

export interface EnemyState {
  id: string;
  raceId: string;
  presetId: string;
  hp: number;
  maxHp: number;
  position: [number, number, number];
  dead: boolean;
}

interface ArenaStore {
  phase: ArenaPhase;
  setPhase: (p: ArenaPhase) => void;

  // Player selection
  selectedRace: RaceConfig | null;
  selectedPreset: GearPreset | null;
  selectCharacter: (race: RaceConfig, preset: GearPreset) => void;

  // Player health
  playerHp: number;
  playerMaxHp: number;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;

  // Enemies
  enemies: EnemyState[];
  setEnemies: (enemies: EnemyState[]) => void;
  damageEnemy: (id: string, amount: number) => void;

  // Score
  kills: number;
  addKill: () => void;

  // Reset
  restart: () => void;
}

export const useArenaStore = create<ArenaStore>((set, get) => ({
  phase: "select",
  setPhase: (phase) => set({ phase }),

  selectedRace: null,
  selectedPreset: null,
  selectCharacter: (race, preset) =>
    set({ selectedRace: race, selectedPreset: preset, phase: "playing" }),

  playerHp: 100,
  playerMaxHp: 100,
  damagePlayer: (amount) => {
    const next = Math.max(0, get().playerHp - amount);
    set({ playerHp: next });
    if (next <= 0) set({ phase: "gameOver" });
  },
  healPlayer: (amount) =>
    set((s) => ({ playerHp: Math.min(s.playerMaxHp, s.playerHp + amount) })),

  enemies: [],
  setEnemies: (enemies) => set({ enemies }),
  damageEnemy: (id, amount) => {
    const enemies = get().enemies.map((e) => {
      if (e.id !== id || e.dead) return e;
      const hp = Math.max(0, e.hp - amount);
      return { ...e, hp, dead: hp <= 0 };
    });
    set({ enemies });
    // Check victory — all enemies dead
    if (enemies.every((e) => e.dead)) {
      set({ phase: "victory" });
    }
  },

  kills: 0,
  addKill: () => set((s) => ({ kills: s.kills + 1 })),

  restart: () =>
    set({
      phase: "select",
      playerHp: 100,
      enemies: [],
      kills: 0,
      selectedRace: null,
      selectedPreset: null,
    }),
}));
