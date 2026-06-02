/**
 * WeaponDropdown.tsx
 * Collapsible side panel listing all weapon types.
 * Click to equip → updates action bar skills.
 */

import { useState } from "react";
import { useArenaStore } from "../stores/useArenaStore";
import {
  WEAPON_TYPE_LABELS,
  WEAPON_TYPE_COLORS,
} from "../engine/types/weapons";
import type { OffhandType } from "../engine/types/weaponSkills";

const WEAPON_TYPES = ["sword","axe","hammer","mace","spear","dagger","bow","crossbow","staff","wand"] as const;
const OFFHAND_TYPES: { id: OffhandType; label: string; color: string }[] = [
  { id: "shield", label: "🛡 Shield", color: "#3b82f6" },
  { id: "tome",   label: "📖 Tome",   color: "#8b5cf6" },
  { id: "relic",  label: "💎 Relic",   color: "#f59e0b" },
  { id: "none",   label: "✋ None",    color: "#64748b" },
];

export function WeaponDropdown() {
  const [open, setOpen] = useState(false);
  const equipped = useArenaStore((s) => s.equippedWeaponType);
  const offhand = useArenaStore((s) => s.offhandType);
  const equipWeapon = useArenaStore((s) => s.equipWeapon);
  const equipOffhand = useArenaStore((s) => s.equipOffhand);

  return (
    <div style={{ position: "absolute", top: 60, right: 16, pointerEvents: "auto" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: "#1e293bee", border: "1px solid #334155", color: "#94a3b8",
          cursor: "pointer",
        }}
      >
        {open ? "✕ Close" : `⚔ ${WEAPON_TYPE_LABELS[equipped as keyof typeof WEAPON_TYPE_LABELS] ?? equipped}`}
      </button>

      {open && (
        <div style={{
          marginTop: 4, background: "#0f172aee", border: "1px solid #334155",
          borderRadius: 8, padding: 8, maxHeight: 400, overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
            Main Hand
          </div>
          {WEAPON_TYPES.map((wt) => (
            <button
              key={wt}
              onClick={() => { equipWeapon(wt); }}
              style={{
                padding: "4px 10px", borderRadius: 4, fontSize: 11,
                background: equipped === wt ? "#1e293b" : "transparent",
                border: equipped === wt ? `1px solid ${WEAPON_TYPE_COLORS[wt]}` : "1px solid transparent",
                color: equipped === wt ? WEAPON_TYPE_COLORS[wt] : "#94a3b8",
                cursor: "pointer", textAlign: "left",
              }}
            >
              {WEAPON_TYPE_LABELS[wt]}
            </button>
          ))}

          <div style={{ height: 1, background: "#334155", margin: "6px 0" }} />

          <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
            Off Hand
          </div>
          {OFFHAND_TYPES.map((oh) => (
            <button
              key={oh.id}
              onClick={() => equipOffhand(oh.id)}
              style={{
                padding: "4px 10px", borderRadius: 4, fontSize: 11,
                background: offhand === oh.id ? "#1e293b" : "transparent",
                border: offhand === oh.id ? `1px solid ${oh.color}` : "1px solid transparent",
                color: offhand === oh.id ? oh.color : "#94a3b8",
                cursor: "pointer", textAlign: "left",
              }}
            >
              {oh.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
