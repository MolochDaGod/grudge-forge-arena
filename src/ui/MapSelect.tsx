/**
 * MapSelect.tsx
 * Map selection screen — shown after character select, before loading.
 */

import { useArenaStore } from "../stores/useArenaStore";
import { MAP_CATALOG, type MapDef } from "../game/MapDefinitions";

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  procedural: { label: "PROCEDURAL", color: "#22c55e" },
  glb:        { label: "3D MODEL",   color: "#3b82f6" },
};

const SKY_BADGE: Record<string, { label: string; color: string }> = {
  day:   { label: "☀ Day",   color: "#f59e0b" },
  night: { label: "🌙 Night", color: "#6366f1" },
  cave:  { label: "🕳 Cave",  color: "#78716c" },
};

export function MapSelect() {
  const selectMap = useArenaStore((s) => s.selectMap);
  const charDef = useArenaStore((s) => s.selectedCharDef);
  const setPhase = useArenaStore((s) => s.setPhase);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", width: "100%",
      background: "linear-gradient(180deg, #0f172a, #1e293b, #0f172a)",
      padding: 24, gap: 24,
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: 4, color: "#f59e0b" }}>SELECT ARENA</h1>
        {charDef && (
          <p style={{ fontSize: 12, color: charDef.cls.color, marginTop: 4 }}>
            {charDef.cls.label} — {charDef.race.name}
          </p>
        )}
      </div>

      {/* Map cards */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", maxWidth: 800 }}>
        {MAP_CATALOG.map((map) => {
          const typeBadge = TYPE_BADGE[map.type];
          const skyBadge = SKY_BADGE[map.sky];
          return (
            <button key={map.id} onClick={() => selectMap(map)}
              style={{
                width: 280, padding: 24, borderRadius: 12,
                background: "linear-gradient(180deg, #1e293bee, #0f172aee)",
                border: "2px solid #334155", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
                transition: "all 0.2s", textAlign: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#f59e0b";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(245,158,11,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#334155";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Icon */}
              <div style={{ fontSize: 48 }}>{map.icon}</div>

              {/* Name */}
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", letterSpacing: 1 }}>
                {map.name}
              </div>

              {/* Badges */}
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                  background: `${typeBadge.color}22`, color: typeBadge.color,
                  border: `1px solid ${typeBadge.color}44`,
                  textTransform: "uppercase", letterSpacing: 1,
                }}>
                  {typeBadge.label}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                  background: `${skyBadge.color}22`, color: skyBadge.color,
                  border: `1px solid ${skyBadge.color}44`,
                }}>
                  {skyBadge.label}
                </span>
              </div>

              {/* Description */}
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>
                {map.description}
              </div>

              <div style={{ fontSize: 10, letterSpacing: 3, color: "#475569", textTransform: "uppercase" }}>
                Enter →
              </div>
            </button>
          );
        })}
      </div>

      {/* Back button */}
      <button onClick={() => setPhase("select")}
        style={{
          padding: "8px 24px", borderRadius: 6, fontSize: 12, fontWeight: 700,
          background: "#1e293b", border: "1px solid #334155", color: "#94a3b8",
          cursor: "pointer",
        }}>
        ← Back to Character Select
      </button>
    </div>
  );
}
