/**
 * ActionBar.tsx
 * Bottom-center HUD: 5 weapon skill slots + off-hand override.
 *
 * - Populated from getHotbarSkills(weaponType, offhand, rmbHeld)
 * - Each slot shows element icon, skill name, keybind (1-5)
 * - Cooldown: grey overlay with remaining time
 * - Shield RMB: slots 1-3 swap to Shield Bash / Parry / Taunt
 * - Tome RMB: slots 1-3 swap to Heal / Fireball / Regen
 */

import { useArenaStore } from "../stores/useArenaStore";
import {
  getHotbarSkills,
  ELEMENT_ICONS,
  ELEMENT_COLORS,
  type SkillDef,
} from "../engine/types/weaponSkills";

export function ActionBar() {
  const weaponType = useArenaStore((s) => s.equippedWeaponType);
  const offhand = useArenaStore((s) => s.offhandType);
  const rmbHeld = useArenaStore((s) => s.rmbHeld);
  const cooldowns = useArenaStore((s) => s.skillCooldowns);

  const skills = getHotbarSkills(weaponType, offhand, rmbHeld);
  // Pad to 5 slots
  const slots: (SkillDef | null)[] = Array.from({ length: 5 }, (_, i) => skills[i] ?? null);

  return (
    <div style={{
      position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
      display: "flex", gap: 4, pointerEvents: "auto",
    }}>
      {slots.map((skill, i) => {
        const cd = skill ? (cooldowns[skill.key] ?? 0) : 0;
        const onCd = cd > 0;
        const cdPct = skill && skill.cooldown > 0 ? Math.min(1, cd / (skill.cooldown * 1000)) : 0;
        const isOverride = rmbHeld && (offhand === "shield" || offhand === "tome") && i < 3;
        const borderColor = isOverride ? "#f59e0b" : skill ? ELEMENT_COLORS[skill.element] : "#334155";

        return (
          <div key={i} style={{
            width: 58, height: 64, borderRadius: 8,
            background: onCd ? "#1a1a2ecc" : "#1e293bee",
            border: `2px solid ${borderColor}`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden", opacity: onCd ? 0.5 : 1,
            transition: "all 0.15s",
          }}>
            {/* Cooldown sweep overlay */}
            {onCd && (
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: `${cdPct * 100}%`,
                background: "rgba(0,0,0,0.6)", transition: "height 0.1s",
              }} />
            )}
            {/* Keybind number */}
            <div style={{
              position: "absolute", top: 2, left: 4, fontSize: 9, color: "#64748b",
              fontWeight: 700, fontFamily: "monospace",
            }}>{i + 1}</div>
            {/* Icon — CDN image if available, else element emoji */}
            <div style={{ fontSize: 20, lineHeight: 1, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {skill?.icon ? (
                <img src={skill.icon} alt={skill.name} style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 2, filter: onCd ? "grayscale(80%)" : "none" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.textContent = ELEMENT_ICONS[skill.element]; }} />
              ) : skill ? ELEMENT_ICONS[skill.element] : "·"}
            </div>
            {/* Name */}
            <div style={{
              fontSize: 8, color: "#94a3b8", textAlign: "center",
              lineHeight: 1.1, marginTop: 2, maxWidth: 52,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {skill?.name ?? "—"}
            </div>
            {/* CD timer */}
            {onCd && (
              <div style={{
                position: "absolute", bottom: 2, fontSize: 9, fontWeight: 700,
                color: "#fbbf24", fontFamily: "monospace",
              }}>
                {(cd / 1000).toFixed(1)}s
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
