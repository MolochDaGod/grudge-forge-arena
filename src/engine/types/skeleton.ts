// ─────────────────────────────────────────────────────────────────────────────
// Bip001 typed bone dictionary — the authored skeleton reference.
//
// This is the single typed source of truth for the Grudge-6 Bip001 skeleton:
// every canonical bone's humanoid role/alias, parent, body side, and a
// rigid-body vs head/neck classification (for the downstream ragdoll system).
//
// MEASURED data (rest lengths, bind positions/quaternions, world axes) is NOT
// authored here — it is read straight off the FBX into
// `public/assets/skeleton-reference.json` by `tools/extract-skeleton-ref.mjs`.
// `scripts/src/validate-skeleton.ts` cross-checks this dictionary against that
// generated ground truth (bone set + parents) and fails on drift.
//
// Bone names match what FBXLoader emits (spaces sanitised to underscores), so
// they line up with `DEFAULT_BONE_MAP` (boneMap.ts) and the bake retargeter.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ragdoll body classification:
 * - `rigid`    — a load-bearing rigid segment (torso, limbs) simulated as a body.
 * - `headNeck` — the skull/neck chain, special-cased by the ragdoll system
 *                (lighter mass, constrained cone joint to avoid neck snapping).
 */
export type BoneRigidity = "rigid" | "headNeck";

export type BoneSide = "left" | "right" | "center";

export interface Bip001Bone {
  /** Canonical bone name as emitted by FBXLoader (underscores, not spaces). */
  name: string;
  /** Humanoid role/alias: Hips, Spine, Neck, Head, LeftUpperArm, … */
  role: string;
  /** Canonical parent bone name, or null for the root. */
  parent: string | null;
  /** Ragdoll classification (see BoneRigidity). */
  rigidity: BoneRigidity;
  /** Body side for symmetric limbs; `center` for the spine/head chain. */
  side: BoneSide;
  /**
   * True for weapon/prop attachment sockets and chain-end nubs. These are NOT
   * skinned animation drivers and are NOT ragdoll bodies — they exist to parent
   * props (hand/shield containers) or terminate a chain (head/toe nubs).
   */
  socket: boolean;
}

// Authored dictionary, ordered parents-before-children (matches the generated
// reference ordering). Mirrors the 30 canonical bones in skeleton-reference.json.
export const BIP001_SKELETON: Bip001Bone[] = [
  { name: "Bip001",             role: "Root",          parent: null,                rigidity: "rigid",    side: "center", socket: false },
  { name: "Bip001_Pelvis",      role: "Hips",          parent: "Bip001",            rigidity: "rigid",    side: "center", socket: false },
  { name: "Bip001_L_Thigh",     role: "LeftUpperLeg",  parent: "Bip001_Pelvis",     rigidity: "rigid",    side: "left",   socket: false },
  { name: "Bip001_R_Thigh",     role: "RightUpperLeg", parent: "Bip001_Pelvis",     rigidity: "rigid",    side: "right",  socket: false },
  { name: "Bip001_Spine",       role: "Spine",         parent: "Bip001_Pelvis",     rigidity: "rigid",    side: "center", socket: false },
  { name: "Bip001_L_Calf",      role: "LeftLowerLeg",  parent: "Bip001_L_Thigh",    rigidity: "rigid",    side: "left",   socket: false },
  { name: "Bip001_L_Clavicle",  role: "LeftShoulder",  parent: "Bip001_Spine",      rigidity: "rigid",    side: "left",   socket: false },
  { name: "Bip001_Neck",        role: "Neck",          parent: "Bip001_Spine",      rigidity: "headNeck", side: "center", socket: false },
  { name: "Bip001_R_Calf",      role: "RightLowerLeg", parent: "Bip001_R_Thigh",    rigidity: "rigid",    side: "right",  socket: false },
  { name: "Bip001_R_Clavicle",  role: "RightShoulder", parent: "Bip001_Spine",      rigidity: "rigid",    side: "right",  socket: false },
  { name: "Bone_bag",           role: "BagSocket",     parent: "Bip001_Spine",      rigidity: "rigid",    side: "center", socket: true  },
  { name: "Bone_wood",          role: "WoodSocket",    parent: "Bip001_Spine",      rigidity: "rigid",    side: "center", socket: true  },
  { name: "Quiver_container",   role: "QuiverSocket",  parent: "Bip001_Spine",      rigidity: "rigid",    side: "center", socket: true  },
  { name: "Bip001_Head",        role: "Head",          parent: "Bip001_Neck",       rigidity: "headNeck", side: "center", socket: false },
  { name: "Bip001_L_Foot",      role: "LeftFoot",      parent: "Bip001_L_Calf",     rigidity: "rigid",    side: "left",   socket: false },
  { name: "Bip001_L_UpperArm",  role: "LeftUpperArm",  parent: "Bip001_L_Clavicle", rigidity: "rigid",    side: "left",   socket: false },
  { name: "Bip001_R_Foot",      role: "RightFoot",     parent: "Bip001_R_Calf",     rigidity: "rigid",    side: "right",  socket: false },
  { name: "Bip001_R_UpperArm",  role: "RightUpperArm", parent: "Bip001_R_Clavicle", rigidity: "rigid",    side: "right",  socket: false },
  { name: "Bip001_HeadNub",     role: "HeadEnd",       parent: "Bip001_Head",       rigidity: "headNeck", side: "center", socket: true  },
  { name: "Bip001_L_Forearm",   role: "LeftLowerArm",  parent: "Bip001_L_UpperArm", rigidity: "rigid",    side: "left",   socket: false },
  { name: "Bip001_L_Toe0",      role: "LeftToe",       parent: "Bip001_L_Foot",     rigidity: "rigid",    side: "left",   socket: false },
  { name: "Bip001_R_Forearm",   role: "RightLowerArm", parent: "Bip001_R_UpperArm", rigidity: "rigid",    side: "right",  socket: false },
  { name: "Bip001_R_Toe0",      role: "RightToe",      parent: "Bip001_R_Foot",     rigidity: "rigid",    side: "right",  socket: false },
  { name: "Bip001_L_Hand",      role: "LeftHand",      parent: "Bip001_L_Forearm",  rigidity: "rigid",    side: "left",   socket: false },
  { name: "Bip001_L_Toe0Nub",   role: "LeftToeEnd",    parent: "Bip001_L_Toe0",     rigidity: "rigid",    side: "left",   socket: true  },
  { name: "Bip001_R_Hand",      role: "RightHand",     parent: "Bip001_R_Forearm",  rigidity: "rigid",    side: "right",  socket: false },
  { name: "Bip001_R_Toe0Nub",   role: "RightToeEnd",   parent: "Bip001_R_Toe0",     rigidity: "rigid",    side: "right",  socket: true  },
  { name: "L_hand_container",   role: "LeftHandSocket",   parent: "Bip001_L_Hand",  rigidity: "rigid",    side: "left",   socket: true  },
  { name: "L_shield_container", role: "LeftShieldSocket", parent: "Bip001_L_Hand",  rigidity: "rigid",    side: "left",   socket: true  },
  { name: "R_hand_container",   role: "RightHandSocket",  parent: "Bip001_R_Hand",  rigidity: "rigid",    side: "right",  socket: true  },
];

export const BIP001_BONE_BY_NAME: Record<string, Bip001Bone> = Object.fromEntries(
  BIP001_SKELETON.map((b) => [b.name, b]),
);

/** Child bone names keyed by parent name (kinematic tree). */
export const BIP001_CHILDREN: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {};
  for (const b of BIP001_SKELETON) {
    if (b.parent) (out[b.parent] ??= []).push(b.name);
  }
  return out;
})();

/** Skinned, animation-driving humanoid bones (excludes sockets and chain-end nubs). */
export const BIP001_DRIVER_BONES: Bip001Bone[] = BIP001_SKELETON.filter((b) => !b.socket);

export const HEAD_NECK_BONES: ReadonlySet<string> = new Set(
  BIP001_SKELETON.filter((b) => b.rigidity === "headNeck").map((b) => b.name),
);

export function childrenOf(name: string): string[] {
  return BIP001_CHILDREN[name] ?? [];
}

export function isHeadNeck(name: string): boolean {
  return HEAD_NECK_BONES.has(name);
}
