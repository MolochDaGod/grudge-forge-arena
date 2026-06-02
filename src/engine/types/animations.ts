import { assetUrl } from "../assetUrl";

export type WeaponType =
  | "unarmed" | "axe" | "sword_shield" | "magic" | "rifle" | "pistol" | "longbow"
  | "sword" | "club" | "dual";

export type AnimationCategory = "locomotion" | "action" | "combat" | "special";

export interface AnimationClip {
  name: string;
  file: string;
  pack: string;
  category: AnimationCategory;
  weapon?: WeaponType;
  loop?: boolean;
  sourceRace?: string;
  raceSpecific?: boolean;
}

export interface AnimationPack {
  id: string;
  label: string;
  weapon: WeaponType;
  anims: AnimationClip[];
}

/** Shorthand */
const a = assetUrl;

export const LOCOMOTION_ANIMS: AnimationClip[] = [
  // ─── Mixamo generic (retargeted to Bip001) ───────────────────────
  { name: "Idle", file: a("/anims/mixamo/locomotion/idle.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Walk", file: a("/anims/mixamo/locomotion/walking.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Run", file: a("/anims/mixamo/locomotion/running.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  // ─── Native locomotion pack ───────────────────────────────────────
  { name: "Idle (Pack)", file: a("/anims/locomotion/idle.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Walk (Pack)", file: a("/anims/locomotion/walking.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Run (Pack)", file: a("/anims/locomotion/running.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Swagger Walk", file: a("/anims/locomotion/swagger walk.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Jump", file: a("/anims/locomotion/jump.FBX"), pack: "locomotion", category: "locomotion", loop: false },
  { name: "Left Strafe", file: a("/anims/locomotion/left strafe.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Right Strafe", file: a("/anims/locomotion/right strafe.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Strafe Walk L", file: a("/anims/locomotion/left strafe walking.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Strafe Walk R", file: a("/anims/locomotion/right strafe walking.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Turn L", file: a("/anims/locomotion/left turn.FBX"), pack: "locomotion", category: "locomotion", loop: false },
  { name: "Turn R", file: a("/anims/locomotion/right turn.FBX"), pack: "locomotion", category: "locomotion", loop: false },
  { name: "Turn L 90", file: a("/anims/locomotion/left turn 90.FBX"), pack: "locomotion", category: "locomotion", loop: false },
  { name: "Turn R 90", file: a("/anims/locomotion/right turn 90.FBX"), pack: "locomotion", category: "locomotion", loop: false },
  // ─── Airborne transitions ─────────────────────────────────────────
  { name: "Jump Up", file: a("/anims/action/jumping up.FBX"), pack: "locomotion", category: "locomotion", loop: false },
  { name: "Falling Idle", file: a("/anims/action/falling idle.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Falling Roll", file: a("/anims/action/falling to roll.FBX"), pack: "locomotion", category: "locomotion", loop: false },
  { name: "Hard Landing", file: a("/anims/action/hard landing.FBX"), pack: "locomotion", category: "locomotion", loop: false },
  { name: "Run To Stop", file: a("/anims/action/run to stop.FBX"), pack: "locomotion", category: "locomotion", loop: false },
  // ─── Crouch / cover ──────────────────────────────────────────────
  { name: "Stand → Crouch", file: a("/anims/action/standing to crouch.FBX"), pack: "locomotion", category: "locomotion", loop: false },
  { name: "Crouch Idle", file: a("/anims/action/crouch idle.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Cover → Stand", file: a("/anims/action/cover to stand.FBX"), pack: "locomotion", category: "locomotion", loop: false },
  // ─── Climb ───────────────────────────────────────────────────────
  { name: "Climb Ladder", file: a("/anims/action/climbing ladder.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  // ─── Aquatic ─────────────────────────────────────────────────────
  { name: "Float", file: a("/anims/locomotion/floating.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Swim", file: a("/anims/locomotion/swimming.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  { name: "Swim to Edge", file: a("/anims/locomotion/swim to edge.FBX"), pack: "locomotion", category: "locomotion", loop: false },
  { name: "Tread Water", file: a("/anims/locomotion/treading water.FBX"), pack: "locomotion", category: "locomotion", loop: true },
  // ─── Parkour / traversal (shown under Special) ───────────────────
  { name: "Ascending Stairs", file: a("/anims/parkour/ascending stairs.FBX"), pack: "locomotion", category: "special", loop: false },
  { name: "Wall Run", file: a("/anims/parkour/wall run.FBX"), pack: "locomotion", category: "special", loop: false },
  { name: "Diagonal Wall Run", file: a("/anims/parkour/diagonal wall run.FBX"), pack: "locomotion", category: "special", loop: false },
  { name: "Sprint to Wall", file: a("/anims/parkour/sprint to wall climb.FBX"), pack: "locomotion", category: "special", loop: false },
  { name: "Ladder Start", file: a("/anims/parkour/start climbing ladder.FBX"), pack: "locomotion", category: "special", loop: false },
  { name: "Climbing", file: a("/anims/parkour/climbing.FBX"), pack: "locomotion", category: "special", loop: true },
  { name: "Climbing Alt", file: a("/anims/parkour/climbing short.FBX"), pack: "locomotion", category: "special", loop: false },
  { name: "Climb Wall Up", file: a("/anims/parkour/climbing up wall.FBX"), pack: "locomotion", category: "special", loop: false },
  { name: "Climb Wall Down", file: a("/anims/parkour/climbing down wall.FBX"), pack: "locomotion", category: "special", loop: false },
  { name: "Braced Hang Shimmy", file: a("/anims/parkour/braced hang shimmy.FBX"), pack: "locomotion", category: "special", loop: true },
  { name: "Hang to Crouch", file: a("/anims/parkour/braced hang to crouch.FBX"), pack: "locomotion", category: "special", loop: false },
  { name: "DblJump to Brace", file: a("/anims/parkour/double jump to brace.FBX"), pack: "locomotion", category: "special", loop: false },
];

export const ACTION_ANIMS: AnimationClip[] = [
  // ─── Combat actions ──────────────────────────────────────────────
  { name: "Attack", file: a("/anims/mixamo/action/attack.FBX"), pack: "action", category: "action", loop: false },
  { name: "Sword Combo", file: a("/anims/mixamo/action/sword_combo.FBX"), pack: "action", category: "action", loop: false },
  { name: "Kick", file: a("/anims/action/kick.FBX"), pack: "action", category: "action", loop: false },
  { name: "Throw Object", file: a("/anims/action/throw object.FBX"), pack: "action", category: "action", loop: false },
  // ─── Hit / death reactions ───────────────────────────────────────
  { name: "Hit React", file: a("/anims/magic/Standing React Large From Front.FBX"), pack: "action", category: "action", loop: false },
  { name: "Hit React S", file: a("/anims/magic/Standing React Small From Front.FBX"), pack: "action", category: "action", loop: false },
  { name: "Death Backward", file: a("/anims/magic/Standing React Death Backward.FBX"), pack: "action", category: "action", loop: false },
  // ─── Social / emotes ─────────────────────────────────────────────
  { name: "Battle Cry", file: a("/anims/action/standing taunt battlecry.FBX"), pack: "action", category: "action", loop: false },
  { name: "Sitting", file: a("/anims/action/male sitting pose.FBX"), pack: "action", category: "action", loop: false },
  { name: "Look Over Shoulder", file: a("/anims/action/look over shoulder.FBX"), pack: "action", category: "action", loop: false },
  { name: "Patting", file: a("/anims/action/patting.FBX"), pack: "action", category: "action", loop: false },
  { name: "Pointing", file: a("/anims/action/pointing.FBX"), pack: "action", category: "action", loop: false },
  { name: "Reacting", file: a("/anims/action/reacting.FBX"), pack: "action", category: "action", loop: false },
  { name: "Disarmed", file: a("/anims/action/disarmed.FBX"), pack: "action", category: "action", loop: false },
  // ─── Cover / stealth ─────────────────────────────────────────────
  { name: "Stand To Cover", file: a("/anims/action/stand to cover.FBX"), pack: "action", category: "action", loop: false },
  { name: "Cover Sneak L", file: a("/anims/action/left cover sneak.FBX"), pack: "action", category: "action", loop: true },
  { name: "Cover Sneak R", file: a("/anims/action/right cover sneak.FBX"), pack: "action", category: "action", loop: true },
  { name: "Crouch Sneak L", file: a("/anims/action/crouched sneaking left.FBX"), pack: "action", category: "action", loop: true },
  { name: "Crouch Sneak R", file: a("/anims/action/crouched sneaking right.FBX"), pack: "action", category: "action", loop: true },
  { name: "Turn L", file: a("/anims/action/left turn.FBX"), pack: "action", category: "action", loop: false },
  { name: "Turn R", file: a("/anims/action/right turn.FBX"), pack: "action", category: "action", loop: false },
  // ─── Dances ──────────────────────────────────────────────────────
  { name: "B-Boy", file: a("/anims/action/bboy hip hop move.FBX"), pack: "action", category: "action", loop: true },
  { name: "Hip Hop Dance", file: a("/anims/action/hip hop dancing.FBX"), pack: "action", category: "action", loop: true },
  { name: "Running Man", file: a("/anims/action/dancing running man.FBX"), pack: "action", category: "action", loop: true },
  { name: "Spin Combo", file: a("/anims/action/northern soul spin combo.FBX"), pack: "action", category: "action", loop: false },
  // ─── Magic / spell casting ───────────────────────────────────────
  { name: "Spell Channel", file: a("/anims/magic/spell casting.FBX"), pack: "action", category: "action", loop: true },
  { name: "1H Cast", file: a("/anims/magic/standing 1h cast spell 01.FBX"), pack: "action", category: "action", loop: false },
  { name: "2H Cast", file: a("/anims/magic/standing 2h cast spell 01.FBX"), pack: "action", category: "action", loop: false },
  // ─── Dodge (universal skill) ──────────────────────────────────────
  { name: "Dodge Forward", file: a("/anims/action/dodge forward.FBX"), pack: "action", category: "action", loop: false },
  { name: "Dodge Backward", file: a("/anims/action/dodge backward.FBX"), pack: "action", category: "action", loop: false },
  { name: "Dodge Left", file: a("/anims/action/dodge left.FBX"), pack: "action", category: "action", loop: false },
  { name: "Dodge Right", file: a("/anims/action/dodge right.FBX"), pack: "action", category: "action", loop: false },
  { name: "Dodge Evasion", file: a("/anims/action/dodging back.FBX"), pack: "action", category: "action", loop: false },
  // ─── Social additions ─────────────────────────────────────────────
  { name: "Formal Bow", file: a("/anims/action/formal bow.FBX"), pack: "action", category: "action", loop: false },
  // ─── Gathering ────────────────────────────────────────────────────
  { name: "Mining", file: a("/anims/action/mining.FBX"), pack: "action", category: "action", loop: true },
];

export const WEAPON_PACKS: AnimationPack[] = [
  {
    id: "unarmed",
    label: "Unarmed",
    weapon: "unarmed",
    anims: [
      { name: "Lead Jab", file: a("/anims/unarmed/lead_jab.FBX"), pack: "unarmed", category: "combat", weapon: "unarmed", loop: false },
    ],
  },
  {
    id: "axe",
    label: "Great Axe",
    weapon: "axe",
    anims: [
      { name: "Idle", file: a("/anims/mixamo/axe/idle.FBX"), pack: "axe", category: "combat", weapon: "axe", loop: true },
      { name: "Walk", file: a("/anims/mixamo/axe/walk.FBX"), pack: "axe", category: "combat", weapon: "axe", loop: true },
      { name: "Attack", file: a("/anims/mixamo/axe/attack.FBX"), pack: "axe", category: "combat", weapon: "axe", loop: false },
    ],
  },
  {
    id: "sword_shield",
    label: "Sword & Shield",
    weapon: "sword_shield",
    anims: [
      { name: "Idle", file: a("/anims/mixamo/sword_shield/idle.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: true },
      { name: "Walk", file: a("/anims/mixamo/sword_shield/walk.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: true },
      { name: "Run", file: a("/anims/mixamo/sword_shield/run.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: true },
      { name: "Attack", file: a("/anims/mixamo/sword_shield/attack.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Strafe L", file: a("/anims/sword_shield/sword and shield strafe.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: true },
      { name: "Strafe R", file: a("/anims/sword_shield/sword and shield strafe (2).FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: true },
      { name: "Block", file: a("/anims/sword_shield/sword and shield block idle.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: true },
      { name: "Block Hit", file: a("/anims/sword_shield/sword and shield block.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Attack 2", file: a("/anims/sword_shield/sword and shield attack (2).FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Attack 3", file: a("/anims/sword_shield/sword and shield attack (3).FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Draw Sword", file: a("/anims/sword_shield/draw sword 1.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Sheath", file: a("/anims/sword_shield/sheath sword 1.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Death", file: a("/anims/sword_shield/sword and shield death.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Attack 4", file: a("/anims/sword_shield/sword and shield attack (1).FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Casting", file: a("/anims/sword_shield/sword and shield casting.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Power Up", file: a("/anims/sword_shield/sword and shield power up.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Slash 1", file: a("/anims/sword_shield/sword and shield slash.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Slash 2", file: a("/anims/sword_shield/sword and shield slash (1).FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Slash 3", file: a("/anims/sword_shield/sword and shield slash 1.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      // Additional baked clips
      { name: "SS Idle", file: a("/anims/sword_shield/sword and shield idle.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: true },
      { name: "Attack 1", file: a("/anims/sword_shield/sword and shield attack.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Attack 5", file: a("/anims/sword_shield/sword and shield attack (4).FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Block 3", file: a("/anims/sword_shield/sword and shield block (2).FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Run SS", file: a("/anims/sword_shield/sword and shield run.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: true },
      { name: "Run SS 2", file: a("/anims/sword_shield/sword and shield run (2).FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: true },
      { name: "Turn L SS", file: a("/anims/sword_shield/sword and shield turn.FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
      { name: "Turn R SS", file: a("/anims/sword_shield/sword and shield turn (2).FBX"), pack: "sword_shield", category: "combat", weapon: "sword_shield", loop: false },
    ]
  },
  {
    id: "magic",
    label: "Magic Staff",
    weapon: "magic",
    anims: [
      { name: "Idle", file: a("/anims/mixamo/magic/idle.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: true },
      { name: "Walk", file: a("/anims/mixamo/magic/walk.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: true },
      { name: "Attack", file: a("/anims/mixamo/magic/attack.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
      { name: "Idle 2", file: a("/anims/magic/standing idle 02.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: true },
      { name: "Run F", file: a("/anims/magic/Standing Run Forward.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: true },
      { name: "1H Attack", file: a("/anims/magic/Standing 1H Magic Attack 01.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
      { name: "2H AoE", file: a("/anims/magic/Standing 2H Magic Area Attack 02.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
      { name: "Jump", file: a("/anims/magic/Standing Jump.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
      { name: "Death", file: a("/anims/magic/Standing React Death Backward.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
      { name: "Channel", file: a("/anims/magic/spell casting.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: true },
      { name: "1H Cast", file: a("/anims/magic/standing 1h cast spell 01.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
      { name: "2H Cast", file: a("/anims/magic/standing 2h cast spell 01.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
      { name: "2H AoE 1", file: a("/anims/magic/standing 2h magic area attack 01.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
      { name: "2H Atk 1", file: a("/anims/magic/standing 2h magic attack 01.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
      { name: "2H Atk 3", file: a("/anims/magic/standing 2h magic attack 03.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
      { name: "2H Atk 4", file: a("/anims/magic/standing 2h magic attack 04.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
      // Additional baked clips
      { name: "Idle (Pack)", file: a("/anims/magic/standing idle.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: true },
      { name: "Walk F", file: a("/anims/magic/Standing Walk Forward.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: true },
      { name: "Walk B", file: a("/anims/magic/Standing Walk Back.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: true },
      { name: "Turn L", file: a("/anims/magic/Standing Turn Left 90.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
      { name: "Turn R", file: a("/anims/magic/Standing Turn Right 90.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
      { name: "React S", file: a("/anims/magic/Standing React Small From Front.FBX"), pack: "magic", category: "combat", weapon: "magic", loop: false },
    ]
  },
  {
    id: "rifle",
    label: "Rifle",
    weapon: "rifle",
    anims: [
      { name: "Idle", file: a("/anims/rifle/idle.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: true },
      { name: "Aim", file: a("/anims/rifle/idle aiming.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: true },
      { name: "Crouch", file: a("/anims/rifle/idle crouching.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: true },
      { name: "Run F", file: a("/anims/rifle/run forward.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: true },
      { name: "Run B", file: a("/anims/rifle/run backward.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: true },
      { name: "Run L", file: a("/anims/rifle/run left.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: true },
      { name: "Run R", file: a("/anims/rifle/run right.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: true },
      { name: "Death", file: a("/anims/rifle/death from front headshot.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: false },
      // Diagonal run directions and turns
      { name: "Run FL", file: a("/anims/rifle/run forward left.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: true },
      { name: "Run FR", file: a("/anims/rifle/run forward right.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: true },
      { name: "Run BL", file: a("/anims/rifle/run backward left.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: true },
      { name: "Run BR", file: a("/anims/rifle/run backward right.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: true },
      { name: "Turn L", file: a("/anims/rifle/turn 90 left.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: false },
      { name: "Turn R", file: a("/anims/rifle/turn 90 right.FBX"), pack: "rifle", category: "combat", weapon: "rifle", loop: false },
    ]
  },
  {
    id: "pistol",
    label: "Pistol",
    weapon: "pistol",
    anims: [
      { name: "Idle", file: a("/anims/pistol/pistol idle.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Walk", file: a("/anims/pistol/pistol walk.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Run", file: a("/anims/pistol/pistol run.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Jump", file: a("/anims/pistol/pistol jump.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: false },
      { name: "Strafe L", file: a("/anims/pistol/pistol strafe.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Strafe R", file: a("/anims/pistol/pistol strafe (2).FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Kneel", file: a("/anims/pistol/pistol stand to kneel.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: false },
      { name: "Kneeling Idle", file: a("/anims/pistol/pistol kneeling idle.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Stand", file: a("/anims/pistol/pistol kneel to stand.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: false },
      // Additional baked clips
      { name: "Walk B", file: a("/anims/pistol/pistol walk backward.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Run B", file: a("/anims/pistol/pistol run backward.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Walk Arc", file: a("/anims/pistol/pistol walk arc.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Walk Arc 2", file: a("/anims/pistol/pistol walk arc (2).FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Walk B Arc", file: a("/anims/pistol/pistol walk backward arc.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Walk B Arc 2", file: a("/anims/pistol/pistol walk backward arc (2).FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Run Arc", file: a("/anims/pistol/pistol run arc.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Run Arc 2", file: a("/anims/pistol/pistol run arc (2).FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Run B Arc", file: a("/anims/pistol/pistol run backward arc.FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Run B Arc 2", file: a("/anims/pistol/pistol run backward arc (2).FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: true },
      { name: "Jump 2", file: a("/anims/pistol/pistol jump (2).FBX"), pack: "pistol", category: "combat", weapon: "pistol", loop: false },
    ]
  },
  {
    id: "longbow",
    label: "Longbow",
    weapon: "longbow",
    anims: [
      { name: "Idle", file: a("/anims/longbow/standing idle 01.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: true },
      { name: "Walk", file: a("/anims/mixamo/longbow/walk.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: true },
      { name: "Attack", file: a("/anims/mixamo/longbow/attack.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: false },
      { name: "Walk B", file: a("/anims/longbow/standing walk back.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: true },
      { name: "Run F", file: a("/anims/longbow/standing run forward.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: true },
      { name: "Run B", file: a("/anims/longbow/standing run back.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: true },
      { name: "Run L", file: a("/anims/longbow/standing run left.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: true },
      { name: "Run R", file: a("/anims/longbow/standing run right.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: true },
      { name: "Turn L", file: a("/anims/longbow/standing turn 90 left.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: false },
      { name: "Turn R", file: a("/anims/longbow/standing turn 90 right.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: false },
      // Additional baked clips
      { name: "Walk F", file: a("/anims/longbow/standing walk forward.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: true },
      { name: "Walk L", file: a("/anims/longbow/standing walk left.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: true },
      { name: "Walk R", file: a("/anims/longbow/standing walk right.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: true },
      { name: "Run Stop", file: a("/anims/longbow/standing run forward stop.FBX"), pack: "longbow", category: "combat", weapon: "longbow", loop: false },
    ]
  },
  {
    id: "sword",
    label: "2H Sword",
    weapon: "sword",
    anims: [
      { name: "1H Combo", file: a("/anims/sword/one hand sword combo.FBX"), pack: "sword", category: "combat", weapon: "sword", loop: false },
      { name: "2H Combo", file: a("/anims/sword/two hand sword combo.FBX"), pack: "sword", category: "combat", weapon: "sword", loop: false },
      { name: "Great Slash", file: a("/anims/sword/great sword slash.FBX"), pack: "sword", category: "combat", weapon: "sword", loop: false },
      { name: "Great Slash 2", file: a("/anims/sword/great sword slash (1).FBX"), pack: "sword", category: "combat", weapon: "sword", loop: false },
    ]
  },
  {
    id: "club",
    label: "Club",
    weapon: "club",
    anims: [
      { name: "1H Combo", file: a("/anims/club/one hand club combo.FBX"), pack: "club", category: "combat", weapon: "club", loop: false },
      { name: "2H Combo", file: a("/anims/club/two hand club combo.FBX"), pack: "club", category: "combat", weapon: "club", loop: false },
    ]
  },
  {
    id: "dual",
    label: "Dual Wield",
    weapon: "dual",
    anims: [
      { name: "Combo", file: a("/anims/dual/dual weapon combo.FBX"), pack: "dual", category: "combat", weapon: "dual", loop: false },
    ]
  },
];

export const MESH_SLOTS = [
  { id: "head", label: "Head / Helmet" },
  { id: "chest", label: "Chest / Torso" },
  { id: "legs", label: "Legs" },
  { id: "boots", label: "Boots / Feet" },
  { id: "gloves", label: "Gloves / Hands" },
  { id: "shoulder_L", label: "Left Shoulder" },
  { id: "shoulder_R", label: "Right Shoulder" },
  { id: "weapon_R", label: "Right Weapon" },
  { id: "weapon_L", label: "Left Weapon / Shield" },
  { id: "belt", label: "Belt" },
  { id: "cloak", label: "Cloak / Cape" },
  { id: "hair", label: "Hair" },
  { id: "beard", label: "Beard" },
] as const;

export type MeshSlotId = typeof MESH_SLOTS[number]["id"];

export const RACE_SPECIFIC_ANIMS: AnimationClip[] = [
  // --- Barbarians (BRB) ---
  {
    name: "Mage Cast B",
    file: a("/assets/barbarians/animations/characters/BRB_mage_11_cast_B.FBX"),
    pack: "race",
    category: "combat",
    loop: false,
    sourceRace: "BRB",
    raceSpecific: true,
  },
  {
    name: "Spearman Attack",
    file: a("/assets/barbarians/animations/characters/BRB_spearman_07_attack.FBX"),
    pack: "race",
    category: "combat",
    loop: false,
    sourceRace: "BRB",
    raceSpecific: true,
  },

  // --- Dwarves (DWF) ---
  {
    name: "Idle",
    file: a("/assets/dwarves/animations/characters/_idle.FBX"),
    pack: "race",
    category: "locomotion",
    loop: true,
    sourceRace: "DWF",
    raceSpecific: true,
  },
  {
    name: "Run",
    file: a("/assets/dwarves/animations/characters/run.FBX"),
    pack: "race",
    category: "locomotion",
    loop: true,
    sourceRace: "DWF",
    raceSpecific: true,
  },
  {
    name: "Run Diagonal",
    file: a("/assets/dwarves/animations/characters/run diagonal.FBX"),
    pack: "race",
    category: "locomotion",
    loop: true,
    sourceRace: "DWF",
    raceSpecific: true,
  },
  {
    name: "Run Diagonal 2",
    file: a("/assets/dwarves/animations/characters/run diagonal 1.FBX"),
    pack: "race",
    category: "locomotion",
    loop: true,
    sourceRace: "DWF",
    raceSpecific: true,
  },
  {
    name: "Run Reverse",
    file: a("/assets/dwarves/animations/characters/run Reverse.FBX"),
    pack: "race",
    category: "locomotion",
    loop: true,
    sourceRace: "DWF",
    raceSpecific: true,
  },
  {
    name: "Worker Attack",
    file: a("/assets/dwarves/animations/characters/DWF_worker_07_attack.FBX"),
    pack: "race",
    category: "combat",
    loop: false,
    sourceRace: "DWF",
    raceSpecific: true,
  },
  {
    name: "Worker Death B",
    file: a("/assets/dwarves/animations/characters/DWF_worker_10_death_B.FBX"),
    pack: "race",
    category: "combat",
    loop: false,
    sourceRace: "DWF",
    raceSpecific: true,
  },

  // --- Orcs (ORC) ---
  {
    name: "Worker Working",
    file: a("/assets/orcs/animations/characters/ORC_worker_12_working_A.FBX"),
    pack: "race",
    category: "special",
    loop: true,
    sourceRace: "ORC",
    raceSpecific: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Controller helpers — resolve the correct loco / attack clips for a weapon pack.
// These are consumed by the store (auto-switch on equip) and AnimationPanel
// (weapon-aware loco section).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the pack's default idle clip.
 * Prefers a clip whose name contains "idle" (case-insensitive) with loop=true,
 * then the first looping clip, then the first clip of any kind.
 * Falls back to the generic loco idle when no pack exists.
 */
export function getPackIdle(weaponType: WeaponType): AnimationClip {
  const pack = WEAPON_PACKS.find((p) => p.weapon === weaponType);
  if (pack) {
    const named = pack.anims.find(
      (a) => a.loop === true && a.name.toLowerCase().includes("idle")
    );
    if (named) return named;
    const firstLoop = pack.anims.find((a) => a.loop === true);
    if (firstLoop) return firstLoop;
    if (pack.anims.length > 0) return pack.anims[0];
  }
  return LOCOMOTION_ANIMS[0];
}

/**
 * Returns the looping (loco-style) clips for the controller's base layer.
 * If the pack has ≥2 looping clips it owns its own locomotion (rifle, pistol,
 * magic, sword_shield, longbow). Otherwise falls back to generic LOCOMOTION_ANIMS
 * so the character always moves correctly even when a melee weapon is equipped.
 */
export function getControllerLocoClips(weaponType: WeaponType): AnimationClip[] {
  const pack = WEAPON_PACKS.find((p) => p.weapon === weaponType);
  if (!pack) return LOCOMOTION_ANIMS;
  const loopClips = pack.anims.filter((a) => a.loop === true);
  return loopClips.length >= 2 ? loopClips : LOCOMOTION_ANIMS;
}

/**
 * Returns the non-looping (attack / transition) clips for the controller's
 * combat layer. These are the one-shot clips that should crossfade back to
 * the loco idle when finished.
 */
export function getControllerAttackClips(weaponType: WeaponType): AnimationClip[] {
  const pack = WEAPON_PACKS.find((p) => p.weapon === weaponType);
  return pack ? pack.anims.filter((a) => a.loop === false) : [];
}
