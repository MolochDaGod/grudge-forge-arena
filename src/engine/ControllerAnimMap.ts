/**
 * ControllerAnimMap.ts
 * Maps CharacterStateMachine animKeys to FBX asset paths.
 *
 * The state machine plays animations by key (e.g. "idle", "attack1").
 * This file provides the concrete FBX → key mapping, with per-weapon
 * combat overrides so each weapon type has its own attack/block/idle set.
 *
 * All paths go through assetUrl() — local dev serves from /public,
 * production prefixes the R2 CDN base.
 */

import { assetUrl as a } from "./assetUrl";

// ── Base animation map (shared across all weapon types) ──────────────────────

export const BASE_ANIM_MAP: Record<string, string> = {
  // Locomotion
  idle:       a("/anims/mixamo/locomotion/idle.FBX"),
  walk:       a("/anims/mixamo/locomotion/walking.FBX"),
  run:        a("/anims/mixamo/locomotion/running.FBX"),
  sprint:     a("/anims/mixamo/locomotion/running.FBX"),  // same clip, 1.5× speed via state def
  combatIdle: a("/anims/mixamo/locomotion/idle.FBX"),     // fallback; weapon packs override

  // Jump / airborne
  jump:       a("/anims/action/jumping.FBX"),
  jumpLoop:   a("/anims/action/jump in air.FBX"),
  jumpDown:   a("/anims/action/jumping down.FBX"),

  // Dodge / evasion
  roll:       a("/anims/longbow/standing dodge forward.FBX"),
  dodge:      a("/anims/longbow/standing dodge backward.FBX"),

  // Crouch
  crouch:     a("/anims/action/crouch idle.FBX"),

  // Hit react / death (generic; weapon packs can override)
  hit:        a("/anims/magic/Standing React Large From Front.FBX"),
  death:      a("/anims/magic/Standing React Death Backward.FBX"),

  // Harvest (tool-based — uses worker/spearman attack)
  harvest:    a("/assets/dwarves/animations/characters/DWF_worker_07_attack.FBX"),

  // Default combat (unarmed) — weapon packs override attack/block/cast
  attack1:    a("/anims/mixamo/action/attack.FBX"),
  attack2:    a("/anims/mixamo/action/sword_combo.FBX"),
  attack3:    a("/anims/action/kick.FBX"),
  block:      a("/anims/sword_shield/sword and shield block idle.FBX"),
  cast:       a("/anims/magic/standing 2h cast spell 01.FBX"),
};

// ── Per-weapon combat overrides ──────────────────────────────────────────────
// Only keys that differ from BASE_ANIM_MAP. Merged at runtime.

export type WeaponAnimMap = Partial<Record<string, string>>;

export const WEAPON_ANIM_OVERRIDES: Record<string, WeaponAnimMap> = {
  sword_shield: {
    combatIdle: a("/anims/mixamo/sword_shield/idle.FBX"),
    run:        a("/anims/mixamo/sword_shield/run.FBX"),
    walk:       a("/anims/mixamo/sword_shield/walk.FBX"),
    attack1:    a("/anims/mixamo/sword_shield/attack.FBX"),
    attack2:    a("/anims/sword_shield/sword and shield attack (2).FBX"),
    attack3:    a("/anims/sword_shield/sword and shield attack (3).FBX"),
    block:      a("/anims/sword_shield/sword and shield block idle.FBX"),
    hit:        a("/anims/sword_shield/sword and shield block.FBX"),
    death:      a("/anims/sword_shield/sword and shield death.FBX"),
    cast:       a("/anims/sword_shield/sword and shield casting.FBX"),
  },

  axe: {
    combatIdle: a("/anims/mixamo/axe/idle.FBX"),
    walk:       a("/anims/mixamo/axe/walk.FBX"),
    attack1:    a("/anims/mixamo/axe/attack.FBX"),
    attack2:    a("/anims/sword/one hand sword combo.FBX"),
    attack3:    a("/anims/action/kick.FBX"),
  },

  magic: {
    combatIdle: a("/anims/mixamo/magic/idle.FBX"),
    walk:       a("/anims/mixamo/magic/walk.FBX"),
    run:        a("/anims/magic/Standing Run Forward.FBX"),
    attack1:    a("/anims/mixamo/magic/attack.FBX"),
    attack2:    a("/anims/magic/Standing 1H Magic Attack 01.FBX"),
    attack3:    a("/anims/magic/Standing 2H Magic Area Attack 02.FBX"),
    cast:       a("/anims/magic/standing 2h cast spell 01.FBX"),
    death:      a("/anims/magic/Standing React Death Backward.FBX"),
    jump:       a("/anims/magic/Standing Jump.FBX"),
  },

  longbow: {
    combatIdle: a("/anims/longbow/standing idle 01.FBX"),
    walk:       a("/anims/mixamo/longbow/walk.FBX"),
    run:        a("/anims/longbow/standing run forward.FBX"),
    attack1:    a("/anims/mixamo/longbow/attack.FBX"),
    attack2:    a("/anims/longbow/standing aim overdraw.FBX"),
    attack3:    a("/anims/longbow/standing aim recoil.FBX"),
    roll:       a("/anims/longbow/standing dodge forward.FBX"),
    dodge:      a("/anims/longbow/standing dodge backward.FBX"),
    block:      a("/anims/longbow/standing block.FBX"),
  },

  rifle: {
    combatIdle: a("/anims/rifle/idle.FBX"),
    run:        a("/anims/rifle/run forward.FBX"),
    attack1:    a("/anims/rifle/firing rifle.FBX"),
    death:      a("/anims/rifle/death from front headshot.FBX"),
    crouch:     a("/anims/rifle/idle crouching.FBX"),
  },

  pistol: {
    combatIdle: a("/anims/pistol/pistol idle.FBX"),
    walk:       a("/anims/pistol/pistol walk.FBX"),
    run:        a("/anims/pistol/pistol run.FBX"),
    jump:       a("/anims/pistol/pistol jump.FBX"),
    crouch:     a("/anims/pistol/pistol kneeling idle.FBX"),
  },

  sword: {
    attack1:    a("/anims/sword/one hand sword combo.FBX"),
    attack2:    a("/anims/sword/two hand sword combo.FBX"),
    attack3:    a("/anims/sword/great sword slash.FBX"),
  },

  club: {
    attack1:    a("/anims/club/one hand club combo.FBX"),
    attack2:    a("/anims/club/two hand club combo.FBX"),
  },

  dual: {
    attack1:    a("/anims/dual/dual weapon combo.FBX"),
  },
};

// ── Social / emote animations (not driven by state machine) ─────────────────

export const SOCIAL_ANIMS: Record<string, string> = {
  battleCry:      a("/anims/action/standing taunt battlecry.FBX"),
  pointing:       a("/anims/action/pointing.FBX"),
  patting:        a("/anims/action/patting.FBX"),
  reacting:       a("/anims/action/reacting.FBX"),
  lookOver:       a("/anims/action/look over shoulder.FBX"),
  sitting:        a("/anims/action/male sitting pose.FBX"),
  disarmed:       a("/anims/action/disarmed.FBX"),
  throwObject:    a("/anims/action/throw object.FBX"),
  coverToStand:   a("/anims/action/cover to stand.FBX"),
  climbLadder:    a("/anims/action/climbing ladder.FBX"),
  standToCrouch:  a("/anims/action/standing to crouch.FBX"),
  swaggerWalk:    a("/anims/locomotion/swagger walk.FBX"),
  // Dances
  bboy:           a("/anims/action/bboy hip hop move.FBX"),
  hipHop:         a("/anims/action/hip hop dancing.FBX"),
  runningMan:     a("/anims/action/dancing running man.FBX"),
  spinCombo:      a("/anims/action/northern soul spin combo.FBX"),
};

// ── Helper: merge base + weapon overrides ────────────────────────────────────

/**
 * Get the full animKey→path map for a given weapon type.
 * Falls back to BASE_ANIM_MAP for any key not overridden.
 */
export function getAnimMapForWeapon(weaponType: string): Record<string, string> {
  const overrides = WEAPON_ANIM_OVERRIDES[weaponType] ?? {};
  return { ...BASE_ANIM_MAP, ...overrides };
}
