/**
 * PlayerFrame.tsx
 * GrudgeBuilder-style player unit frame — portrait + angled HP/MP/SP bars.
 * Ported from PlayerStatusBars.tsx (Tailwind + framer-motion → inline CSS).
 */

import { useArenaStore } from "../stores/useArenaStore";

const BAR_CLIP = "polygon(0 0, 100% 0, 95% 100%, 0 100%)";

function GradientBar({ value, max, gradient, label, labelColor, height }: {
  value: number; max: number; gradient: string; label: string; labelColor: string; height: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const isLow = label === "HP" && pct < 25;
  return (
    <div style={{
      position: "relative", height, overflow: "hidden", clipPath: BAR_CLIP,
      borderRadius: 2,
    }}>
      {/* Background */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, #1c1917, #292524)",
        border: "1px solid #44403c",
      }} />
      {/* Fill bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0,
        width: `${pct}%`, background: gradient, borderRadius: 2,
        transition: "width 0.3s ease-out",
        boxShadow: isLow ? "0 0 10px #ef4444" : "none",
      }} />
      {/* Shine overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 50%, rgba(0,0,0,0.18) 100%)",
      }} />
      {/* Numeric value */}
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: height > 18 ? 11 : 9, fontWeight: 700, color: "#fff",
        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
      }}>
        {Math.floor(value)} / {max}
      </div>
      {/* Label badge */}
      <div style={{
        position: "absolute", top: 0, right: 6, height: "100%",
        display: "flex", alignItems: "center",
        fontSize: height > 18 ? 10 : 8, fontWeight: 700, color: labelColor,
      }}>
        {label}
      </div>
    </div>
  );
}

export function PlayerFrame() {
  const hp = useArenaStore((s) => s.playerHp);
  const maxHp = useArenaStore((s) => s.playerMaxHp);
  const mp = useArenaStore((s) => s.playerMp);
  const maxMp = useArenaStore((s) => s.playerMaxMp);
  const sp = useArenaStore((s) => s.playerSp);
  const maxSp = useArenaStore((s) => s.playerMaxSp);
  const charDef = useArenaStore((s) => s.selectedCharDef);
  const isLow = hp / maxHp < 0.25;

  const playerName = charDef
    ? `${charDef.cls.label} — ${charDef.race.name}`
    : "Hero";
  const portraitLetter = charDef?.cls.label[0] ?? "?";
  const portraitColor = charDef?.cls.color ?? "#f59e0b";

  return (
    <div style={{
      position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 0,
      pointerEvents: "auto",
    }}>
      {/* Portrait circle */}
      <div style={{
        position: "relative", zIndex: 20, flexShrink: 0,
        animation: isLow ? "pulse 0.5s infinite" : "none",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", overflow: "hidden",
          border: "3px solid #78350f", boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 900, color: portraitColor,
        }}>
          {portraitLetter}
        </div>
        {/* Level badge */}
        <div style={{
          position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(90deg, #78350f, #b45309)",
          color: "#fff", fontSize: 9, fontWeight: 700,
          padding: "1px 8px", borderRadius: 10,
          border: "1px solid #f59e0b",
        }}>
          1
        </div>
      </div>

      {/* Bars container */}
      <div style={{ position: "relative", marginLeft: -12, zIndex: 10, paddingLeft: 20 }}>
        {/* Name */}
        <div style={{
          fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 2,
          textShadow: "0 1px 2px rgba(0,0,0,0.8)", letterSpacing: 0.5,
        }}>
          {playerName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ width: 200 }}>
            <GradientBar value={hp} max={maxHp} label="HP" labelColor="#fca5a5"
              gradient="linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)" height={22} />
          </div>
          <div style={{ width: 180 }}>
            <GradientBar value={mp} max={maxMp} label="MP" labelColor="#93c5fd"
              gradient="linear-gradient(180deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)" height={18} />
          </div>
          <div style={{ width: 160 }}>
            <GradientBar value={sp} max={maxSp} label="SP" labelColor="#fde047"
              gradient="linear-gradient(180deg, #eab308 0%, #ca8a04 50%, #a16207 100%)" height={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
