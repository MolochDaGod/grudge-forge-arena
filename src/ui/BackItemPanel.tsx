/**
 * BackItemPanel.tsx
 * Cape / Wings equipment panel — shows equipped back item with active ability.
 * Positioned bottom-left of HUD. Click to cycle, press active to use.
 */

import { useState } from "react";
import { useArenaStore } from "../stores/useArenaStore";
import { BACK_ITEMS, ELEMENT_COLORS, type BackItemDef } from "../engine/types/weaponSkills";

const TIER_COLORS: Record<number, string> = {
  1: "#8b7355", 2: "#a8a8a8", 3: "#4a9eff", 4: "#9d4dff", 5: "#ff4d4d",
};

export function BackItemPanel() {
  const [open, setOpen] = useState(false);
  const equipped = useArenaStore((s) => s.equippedBackItem);
  const cooldown = useArenaStore((s) => s.backItemCooldown);
  const equipBackItem = useArenaStore((s) => s.equipBackItem);
  const activateBackItem = useArenaStore((s) => s.activateBackItem);

  const cdSeconds = Math.ceil(cooldown / 1000);
  const onCd = cooldown > 0;

  return (
    <div style={{
      position: "absolute", bottom: 120, left: 16, pointerEvents: "auto",
      display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start",
    }}>
      {/* Selector dropdown */}
      {open && (
        <div style={{
          background: "#0f172aee", border: "1px solid #334155", borderRadius: 8,
          padding: 8, maxHeight: 300, overflowY: "auto", width: 220,
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>
            Capes & Wings
          </div>
          {/* Unequip option */}
          <button onClick={() => { equipBackItem(null); setOpen(false); }}
            style={{
              padding: "4px 8px", borderRadius: 4, fontSize: 10,
              background: !equipped ? "#1e293b" : "transparent",
              border: !equipped ? "1px solid #475569" : "1px solid transparent",
              color: "#94a3b8", cursor: "pointer", textAlign: "left",
            }}>
            ✋ None
          </button>
          {BACK_ITEMS.map((item) => (
            <button key={item.id} onClick={() => { equipBackItem(item); setOpen(false); }}
              style={{
                padding: "6px 8px", borderRadius: 4, fontSize: 10,
                background: equipped?.id === item.id ? "#1e293b" : "transparent",
                border: equipped?.id === item.id ? `1px solid ${TIER_COLORS[item.tier]}` : "1px solid transparent",
                color: equipped?.id === item.id ? TIER_COLORS[item.tier] : "#94a3b8",
                cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 2,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{item.type === "wings" ? "🪽" : "🧣"}</span>
                <span style={{ fontWeight: 700 }}>{item.name}</span>
                <span style={{ fontSize: 8, color: TIER_COLORS[item.tier], marginLeft: "auto" }}>T{item.tier}</span>
              </div>
              <div style={{ fontSize: 8, color: "#475569" }}>
                {item.passives.map(p => p.description).join(" · ")}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Equipped item display */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {/* Toggle button */}
        <button onClick={() => setOpen(!open)}
          style={{
            width: 42, height: 42, borderRadius: 6,
            background: equipped
              ? `linear-gradient(135deg, ${ELEMENT_COLORS[equipped.active.element]}22, #1e293b)`
              : "#1e293b",
            border: `2px solid ${equipped ? TIER_COLORS[equipped.tier] ?? "#334155" : "#334155"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 18, position: "relative",
          }}>
          {equipped ? (equipped.type === "wings" ? "🪽" : "🧣") : "➕"}
          {equipped && (
            <div style={{
              position: "absolute", bottom: -4, right: -4,
              fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 4,
              background: TIER_COLORS[equipped.tier], color: "#fff",
            }}>
              T{equipped.tier}
            </div>
          )}
        </button>

        {/* Active ability button (if equipped) */}
        {equipped && (
          <button onClick={() => activateBackItem()}
            style={{
              height: 42, padding: "0 12px", borderRadius: 6,
              background: onCd ? "#1a1a2e" : `linear-gradient(135deg, ${ELEMENT_COLORS[equipped.active.element]}33, #1e293b)`,
              border: `2px solid ${onCd ? "#334155" : ELEMENT_COLORS[equipped.active.element]}`,
              color: onCd ? "#475569" : ELEMENT_COLORS[equipped.active.element],
              cursor: onCd ? "not-allowed" : "pointer",
              fontSize: 10, fontWeight: 700, opacity: onCd ? 0.6 : 1,
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.15s",
            }}>
            {equipped.active.icon && (
              <img src={equipped.active.icon} alt="" style={{ width: 20, height: 20, objectFit: "contain", filter: onCd ? "grayscale(80%)" : "none" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            <div>
              <div>{equipped.active.name}</div>
              {onCd && <div style={{ fontSize: 8, color: "#fbbf24" }}>{cdSeconds}s</div>}
            </div>
          </button>
        )}
      </div>

      {/* Item name + passives */}
      {equipped && (
        <div style={{ fontSize: 8, color: "#475569", paddingLeft: 4 }}>
          {equipped.name} — {equipped.passives.map(p => p.description).join(", ")}
        </div>
      )}
    </div>
  );
}
