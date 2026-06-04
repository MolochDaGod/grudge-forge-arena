/**
 * TargetFrame.tsx
 * Shows the nearest alive enemy's status — name, race/class, HP bar.
 * Styled to match GrudgeBuilder CombatUnitStatus.
 */

import { useArenaStore } from "../stores/useArenaStore";

const BAR_CLIP = "polygon(0 0, 100% 0, 95% 100%, 0 100%)";

export function TargetFrame() {
  const enemies = useArenaStore((s) => s.enemies);
  const target = enemies.find((e) => !e.dead);
  if (!target) return null;

  const hpPct = Math.max(0, (target.hp / target.maxHp) * 100);
  const isLow = hpPct < 25;

  return (
    <div style={{
      position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
      pointerEvents: "auto",
    }}>
      <div style={{
        background: "linear-gradient(180deg, rgba(15,23,42,0.95), rgba(0,0,0,0.95))",
        border: `2px solid ${isLow ? "#ef444480" : "#334155"}`,
        borderRadius: 10, padding: "8px 14px", minWidth: 200,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 6,
          border: "2px solid #475569", background: "#0a0a0a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 900, color: "#f87171",
        }}>
          {target.id.split("-")[1] ?? "?"}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 4,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#f87171",
              textTransform: "uppercase" as const, letterSpacing: 1,
            }}>
              {target.id}
            </span>
            <span style={{ fontSize: 9, color: "#64748b" }}>
              {target.raceId}
            </span>
          </div>

          {/* HP bar */}
          <div style={{
            position: "relative", height: 16, overflow: "hidden",
            clipPath: BAR_CLIP, borderRadius: 2,
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, #1e293b, #0f172a)",
              border: "1px solid #334155",
            }} />
            <div style={{
              position: "absolute", top: 0, left: 0, bottom: 0,
              width: `${hpPct}%`,
              background: isLow
                ? "linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)"
                : "linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)",
              transition: "width 0.2s ease-out",
              boxShadow: isLow ? "0 0 8px #ef4444" : "none",
            }} />
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700, color: "#fff",
              textShadow: "0 1px 2px rgba(0,0,0,0.8)",
            }}>
              {target.hp} / {target.maxHp}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
