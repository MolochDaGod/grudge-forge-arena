import { useState } from "react";
import { useArenaStore } from "../stores/useArenaStore";
import { RACES } from "../engine/types/races";
import { getClassesForRace, CLASS_ABILITIES, type GrudgeCharacterDef } from "../game/GrudgeClasses";

export function CharacterSelect() {
  const selectChar = useArenaStore((s) => s.selectGrudgeChar);
  const [hoveredRace, setHoveredRace] = useState<string>(RACES[0].id);

  const activeRace = RACES.find((r) => r.id === hoveredRace) ?? RACES[0];
  const classDefs = getClassesForRace(activeRace.id);

  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",width:"100%",background:"linear-gradient(180deg,#0f172a,#1e293b,#0f172a)",padding:24,gap:24 }}>
      <div style={{ textAlign:"center" }}>
        <h1 style={{ fontSize:40,fontWeight:900,letterSpacing:4,color:"#f59e0b" }}>GRUDGE FORGE</h1>
        <p style={{ fontSize:13,color:"#94a3b8",marginTop:4 }}>Select Race & Class</p>
      </div>

      {/* Race tabs */}
      <div style={{ display:"flex",gap:6 }}>
        {RACES.map((race) => (
          <button key={race.id} onMouseEnter={() => setHoveredRace(race.id)} onClick={() => setHoveredRace(race.id)}
            style={{ padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:700,border:"2px solid",cursor:"pointer",transition:"all 0.2s",
              ...(hoveredRace===race.id ? { background:race.color,borderColor:race.color,color:"#fff" } : { background:"#1e293b",borderColor:"#334155",color:"#94a3b8" }) }}>
            {race.name}
          </button>
        ))}
      </div>

      {/* Class cards */}
      <div style={{ display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center",maxWidth:900 }}>
        {classDefs.map((def) => (
          <button key={def.grudgeId} onClick={() => selectChar(def)}
            style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:10,padding:20,borderRadius:12,background:"#1e293bee",border:"1px solid #334155",cursor:"pointer",width:190,transition:"all 0.2s",textAlign:"center" }}>
            {/* Class icon */}
            <div style={{ width:56,height:56,borderRadius:"50%",background:def.cls.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#fff" }}>
              {def.cls.label[0]}
            </div>
            <div>
              <div style={{ fontSize:15,fontWeight:700,color:"#f1f5f9" }}>{def.cls.label}</div>
              <div style={{ fontSize:10,color:"#64748b",marginTop:2 }}>{def.cls.description}</div>
            </div>
            {/* Grudge UUID */}
            <div style={{ fontSize:9,fontFamily:"monospace",color:"#475569",letterSpacing:1 }}>{def.grudgeId}</div>
            {/* Abilities */}
            <div style={{ fontSize:9,color:"#64748b",lineHeight:1.4,textAlign:"left" }}>
              {(CLASS_ABILITIES[def.cls.id] ?? []).slice(0,2).map((a,i) => (
                <div key={i}>• {a}</div>
              ))}
            </div>
            <div style={{ fontSize:9,letterSpacing:3,color:"#475569",textTransform:"uppercase" as const }}>Fight →</div>
          </button>
        ))}
      </div>

      <div style={{ fontSize:11,color:"#475569",textAlign:"center",marginTop:12 }}>
        WASD move • 1-5 weapon skills • RMB shield/tome override • Q cycle mode • Space jump • Ctrl roll
      </div>
    </div>
  );
}
