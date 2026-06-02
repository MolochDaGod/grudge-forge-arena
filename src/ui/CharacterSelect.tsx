import { useState } from "react";
import { useArenaStore } from "../stores/useArenaStore";
import { RACES } from "../engine/types/races";
import { RACE_GEAR_PRESETS } from "../engine/types/meshCatalog";
import type { RaceConfig } from "../engine/types/races";
import type { GearPreset } from "../engine/types/meshCatalog";

export function CharacterSelect() {
  const selectCharacter = useArenaStore((s) => s.selectCharacter);
  const [hoveredRace, setHoveredRace] = useState<string>(RACES[0].id);
  const activeRace = RACES.find((r) => r.id === hoveredRace) ?? RACES[0];
  const presets = RACE_GEAR_PRESETS[activeRace.id] ?? [];

  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",width:"100%",background:"linear-gradient(180deg,#0f172a,#1e293b,#0f172a)",padding:24,gap:24 }}>
      <div style={{ textAlign:"center" }}>
        <h1 style={{ fontSize:40,fontWeight:900,letterSpacing:4,color:"#f59e0b" }}>GRUDGE ARENA</h1>
        <p style={{ fontSize:13,color:"#94a3b8",marginTop:4 }}>Choose your warrior</p>
      </div>
      <div style={{ display:"flex",gap:8 }}>
        {RACES.map((race) => (
          <button key={race.id} onMouseEnter={() => setHoveredRace(race.id)} onClick={() => setHoveredRace(race.id)}
            style={{ padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,border:"2px solid",cursor:"pointer",transition:"all 0.2s",
              ...(hoveredRace===race.id ? { background:race.color,borderColor:race.color,color:"#fff" } : { background:"#1e293b",borderColor:"#334155",color:"#94a3b8" }) }}>
            {race.name}
          </button>
        ))}
      </div>
      <div style={{ display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center",maxWidth:900 }}>
        {presets.map((preset) => (
          <button key={preset.id} onClick={() => selectCharacter(activeRace,preset)}
            style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:20,borderRadius:12,background:"#1e293bee",border:"1px solid #334155",cursor:"pointer",width:170,transition:"all 0.2s" }}>
            <div style={{ width:64,height:64,borderRadius:"50%",background:preset.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#fff" }}>{preset.label[0]}</div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:14,fontWeight:700,color:"#f1f5f9" }}>{preset.label}</div>
              <div style={{ fontSize:11,color:"#64748b",marginTop:2 }}>{preset.description}</div>
            </div>
            <div style={{ fontSize:9,letterSpacing:3,color:"#475569",textTransform:"uppercase" as const }}>Fight →</div>
          </button>
        ))}
      </div>
      <div style={{ fontSize:11,color:"#475569",textAlign:"center",marginTop:16 }}>
        WASD move • 1/2/3 attack combo • RMB block • Space jump • Ctrl roll • Shift sprint
      </div>
    </div>
  );
}
