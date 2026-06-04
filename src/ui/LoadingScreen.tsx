/**
 * LoadingScreen.tsx
 * Shown during the "loading" phase between character select and gameplay.
 * Displays progress bar, status text, and gameplay tips.
 */

import { useArenaStore } from "../stores/useArenaStore";

const TIPS = [
  "Press 1-5 for weapon skills. Slot 5 is your ultimate!",
  "Hold RMB with a shield to swap to Shield Bash / Parry / Taunt.",
  "Equip a cape or wings from the bottom-left panel for bonus passives.",
  "Q cycles between Combat, Harvest, and Build modes.",
  "Press E near ore, wood, or herbs to harvest resources.",
  "Enemies retreat when below 20% HP — chase them down!",
  "Warriors excel with sword + shield. Mages prefer staff + tome.",
  "Each weapon type has its own mastery track. Use it to unlock T2-T3 skills.",
  "Capes have active abilities with cooldowns. Wings grant flight!",
];

export function LoadingScreen() {
  const progress = useArenaStore((s) => s.loadProgress);
  const status = useArenaStore((s) => s.loadStatus);
  const charDef = useArenaStore((s) => s.selectedCharDef);

  const tipIndex = Math.floor(Date.now() / 8000) % TIPS.length;
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      background: "linear-gradient(180deg, #0a0e1a 0%, #111827 40%, #0a0e1a 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 24,
    }}>
      {/* Background pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "radial-gradient(circle at 25% 25%, #f59e0b 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Title */}
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <h1 style={{
          fontSize: 48, fontWeight: 900, letterSpacing: 6,
          background: "linear-gradient(180deg, #fbbf24, #f59e0b, #b45309)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.6))",
        }}>
          GRUDGE FORGE
        </h1>
        {charDef && (
          <div style={{ fontSize: 14, color: charDef.cls.color, fontWeight: 700, marginTop: 4 }}>
            {charDef.cls.label} — {charDef.race.name}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ width: 400, maxWidth: "80%", zIndex: 1 }}>
        {/* Bar background */}
        <div style={{
          height: 20, borderRadius: 10,
          background: "#1e293b", border: "2px solid #334155",
          overflow: "hidden", position: "relative",
        }}>
          {/* Fill */}
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)",
            borderRadius: 8,
            transition: "width 0.3s ease-out",
            boxShadow: "0 0 12px rgba(245,158,11,0.4)",
          }} />
          {/* Shine */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)",
            borderRadius: 8,
          }} />
        </div>

        {/* Percent + status */}
        <div style={{
          display: "flex", justifyContent: "space-between", marginTop: 6,
          fontSize: 11, color: "#94a3b8",
        }}>
          <span>{status}</span>
          <span style={{ fontFamily: "monospace", color: "#fbbf24", fontWeight: 700 }}>{Math.floor(pct)}%</span>
        </div>
      </div>

      {/* Tip */}
      <div style={{
        maxWidth: 500, textAlign: "center", fontSize: 12,
        color: "#475569", lineHeight: 1.5, zIndex: 1,
        padding: "0 24px",
      }}>
        💡 {TIPS[tipIndex]}
      </div>

      {/* Loading dots animation */}
      <div style={{ display: "flex", gap: 6, zIndex: 1 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#f59e0b",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            opacity: 0.4,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
