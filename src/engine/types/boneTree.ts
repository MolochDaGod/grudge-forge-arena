export interface BoneNode {
  name: string;
  children: BoneNode[];
}

export const HAND_SOCKET_BONES = new Set([
  "Bip001 R Hand",
  "Bip001 L Hand",
]);

export function buildBoneTree(obj: { name: string; children: { name: string; children: unknown[] }[] }, isBone: (o: unknown) => boolean): BoneNode {
  return {
    name: obj.name,
    children: obj.children
      .filter(isBone)
      .map((c) => buildBoneTree(c as { name: string; children: { name: string; children: unknown[] }[] }, isBone)),
  };
}
