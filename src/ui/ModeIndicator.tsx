/**
 * ModeIndicator.tsx
 * RTS-Grudge style mode tabs: Combat / Harvest / Build
 * Q cycles, Shift+Q snaps to combat.
 */

import { useArenaStore } from "../stores/useArenaStore";

const MODES = [
  { id: "combat" as const,  label: "⚔ Combat",  color: "#ef4444" },
  { id: "harvest" as const, label: "🌿 Harvest", color: "#22c55e" },
  { id: "build" as const,   label: "🏗 Build",   color: "#3b82f6" },
];

export function ModeIndicator() {
  const mode = useArenaStore((s) => s.gameMode);
  const setMode = useArenaStore((s) => s.setGameMode);

  return (
    <div style={{
      position: "absolute", bottom: 110, left: "50%", transform: "translateX(-50%)",
      display: "flex", gap: 2, pointerEvents: "auto",
    }}>
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          style={{
            padding: "4px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            border: mode === m.id ? `2px solid ${m.color}` : "2px solid #334155",
            background: mode === m.id ? `${m.color}22` : "#1e293b88",
            color: mode === m.id ? m.color : "#64748b",
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          {m.label}
        </button>
      ))}
      <div style={{ fontSize: 9, color: "#475569", alignSelf: "center", marginLeft: 8 }}>
        Q cycle
      </div>
    </div>
  );
}
