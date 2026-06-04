import { create } from "zustand";
import type { RaceConfig } from "../engine/types/races";
import type { GearPreset } from "../engine/types/meshCatalog";
import type { OffhandType } from "../engine/types/weaponSkills";
import type { GrudgeCharacterDef } from "../game/GrudgeClasses";

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
  selectedCharDef: GrudgeCharacterDef | null;
  selectCharacter: (race: RaceConfig, preset: GearPreset) => void;
  selectGrudgeChar: (def: GrudgeCharacterDef) => void;

  // Equipment
  equippedWeaponType: string;
  offhandType: OffhandType;
  rmbHeld: boolean;
  equipWeapon: (weaponType: string) => void;
  equipOffhand: (type: OffhandType) => void;
  setRmbHeld: (held: boolean) => void;

  // Game mode (Combat / Harvest / Build)
  gameMode: "combat" | "harvest" | "build";
  cycleMode: () => void;
  setGameMode: (mode: "combat" | "harvest" | "build") => void;

  // Skill cooldowns (skillKey → remaining ms)
  skillCooldowns: Record<string, number>;
  triggerCooldown: (skillKey: string, durationMs: number) => void;
  tickCooldowns: (deltaMs: number) => void;

  // Player health + resources
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  playerSp: number;
  playerMaxSp: number;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  useMana: (amount: number) => void;
  useStamina: (amount: number) => void;

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
  selectedCharDef: null,
  selectCharacter: (race, preset) =>
    set({ selectedRace: race, selectedPreset: preset, phase: "playing" }),
  selectGrudgeChar: (def) =>
    set({
      selectedRace: def.race,
      selectedPreset: def.preset,
      selectedCharDef: def,
      equippedWeaponType: def.cls.weaponType,
      offhandType: def.cls.offhand,
      phase: "playing",
    }),

  equippedWeaponType: "sword",
  offhandType: "none" as OffhandType,
  rmbHeld: false,
  equipWeapon: (weaponType) => set({ equippedWeaponType: weaponType }),
  equipOffhand: (type) => set({ offhandType: type }),
  setRmbHeld: (held) => set({ rmbHeld: held }),

  gameMode: "combat" as const,
  cycleMode: () =>
    set((s) => {
      const modes: ("combat" | "harvest" | "build")[] = ["combat", "harvest", "build"];
      const idx = modes.indexOf(s.gameMode);
      return { gameMode: modes[(idx + 1) % modes.length] };
    }),
  setGameMode: (mode) => set({ gameMode: mode }),

  skillCooldowns: {},
  triggerCooldown: (skillKey, durationMs) =>
    set((s) => ({
      skillCooldowns: { ...s.skillCooldowns, [skillKey]: durationMs },
    })),
  tickCooldowns: (deltaMs) =>
    set((s) => {
      const next: Record<string, number> = {};
      for (const [k, v] of Object.entries(s.skillCooldowns)) {
        const remaining = v - deltaMs;
        if (remaining > 0) next[k] = remaining;
      }
      return { skillCooldowns: next };
    }),

  playerHp: 100,
  playerMaxHp: 100,
  playerMp: 80,
  playerMaxMp: 80,
  playerSp: 100,
  playerMaxSp: 100,
  damagePlayer: (amount) => {
    const next = Math.max(0, get().playerHp - amount);
    set({ playerHp: next });
    if (next <= 0) set({ phase: "gameOver" });
  },
  healPlayer: (amount) =>
    set((s) => ({ playerHp: Math.min(s.playerMaxHp, s.playerHp + amount) })),
  useMana: (amount) =>
    set((s) => ({ playerMp: Math.max(0, s.playerMp - amount) })),
  useStamina: (amount) =>
    set((s) => ({ playerSp: Math.max(0, s.playerSp - amount) })),

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
      playerMp: 80,
      playerSp: 100,
      enemies: [],
      kills: 0,
      selectedRace: null,
      selectedPreset: null,
      selectedCharDef: null,
      equippedWeaponType: "sword",
      offhandType: "none" as OffhandType,
      rmbHeld: false,
      gameMode: "combat" as const,
      skillCooldowns: {},
    }),
}));
