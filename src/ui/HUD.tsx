import { useArenaStore } from "../stores/useArenaStore";
import { ActionBar } from "./ActionBar";
import { ModeIndicator } from "./ModeIndicator";
import { WeaponDropdown } from "./WeaponDropdown";
import { PlayerFrame } from "./PlayerFrame";
import { TargetFrame } from "./TargetFrame";
import { BackItemPanel } from "./BackItemPanel";

export function HUD() {
  const enemies = useArenaStore((s) => s.enemies);
  const kills = useArenaStore((s) => s.kills);
  const charDef = useArenaStore((s) => s.selectedCharDef);

  return (
    <div style={{ position:"absolute",inset:0,pointerEvents:"none" }}>
      {/* Player frame (portrait + HP/MP/SP bars) */}
      <PlayerFrame />

      {/* Target frame (first alive enemy) */}
      <TargetFrame />

      {/* Kills + enemy count */}
      <div style={{ position:"absolute",top:16,right:16,textAlign:"right",fontSize:12,color:"#94a3b8",pointerEvents:"auto" }}>
        <div>Enemies: <span style={{ color:"#f87171",fontWeight:700 }}>{enemies.filter(e=>!e.dead).length}</span></div>
        <div>Kills: <span style={{ color:"#fbbf24",fontWeight:700 }}>{kills}</span></div>
        {charDef && (
          <div style={{ fontSize:9,color:"#475569",marginTop:4,fontFamily:"monospace",letterSpacing:1 }}>
            {charDef.grudgeId}
          </div>
        )}
      </div>

      {/* Weapon dropdown (right side) */}
      <WeaponDropdown />

      {/* Back item (capes / wings) */}
      <BackItemPanel />

      {/* Mode tabs (Combat / Harvest / Build) */}
      <ModeIndicator />

      {/* Action bar (weapon skills 1-5) */}
      <ActionBar />

      {/* Controls hint */}
      <div style={{ position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",fontSize:9,color:"#33415588" }}>
        WASD • 1-5 skills • RMB off-hand • Q mode • Space jump • Ctrl roll • Shift sprint • E harvest
      </div>
    </div>
  );
}
