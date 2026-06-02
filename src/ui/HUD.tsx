import { useArenaStore } from "../stores/useArenaStore";

export function HUD() {
  const playerHp = useArenaStore((s) => s.playerHp);
  const playerMaxHp = useArenaStore((s) => s.playerMaxHp);
  const enemies = useArenaStore((s) => s.enemies);
  const kills = useArenaStore((s) => s.kills);
  const hpPct = (playerHp / playerMaxHp) * 100;
  const barColor = hpPct > 50 ? "#22c55e" : hpPct > 20 ? "#eab308" : "#ef4444";

  return (
    <div style={{ position:"absolute",inset:0,pointerEvents:"none" }}>
      <div style={{ position:"absolute",top:16,left:16 }}>
        <div style={{ fontSize:10,letterSpacing:2,color:"#94a3b8",fontWeight:700,textTransform:"uppercase" as const }}>Player</div>
        <div style={{ width:200,height:18,background:"#1e293bee",borderRadius:9,border:"1px solid #33415580",overflow:"hidden",marginTop:4 }}>
          <div style={{ width:`${hpPct}%`,height:"100%",background:barColor,borderRadius:9,transition:"width 0.2s" }} />
        </div>
        <div style={{ fontSize:12,fontFamily:"monospace",color:"#cbd5e1",marginTop:2 }}>{playerHp} / {playerMaxHp}</div>
      </div>
      <div style={{ position:"absolute",top:16,right:16,textAlign:"right",fontSize:12,color:"#94a3b8" }}>
        <div>Enemies: <span style={{ color:"#f87171",fontWeight:700 }}>{enemies.filter(e=>!e.dead).length}</span></div>
        <div>Kills: <span style={{ color:"#fbbf24",fontWeight:700 }}>{kills}</span></div>
      </div>
      <div style={{ position:"absolute",bottom:90,left:"50%",transform:"translateX(-50%)",display:"flex",gap:16 }}>
        {enemies.filter(e=>!e.dead).map(e => (
          <div key={e.id} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
            <div style={{ fontSize:9,color:"#f87171",fontWeight:700,textTransform:"uppercase" as const }}>{e.id}</div>
            <div style={{ width:110,height:10,background:"#1e293bee",borderRadius:5,border:"1px solid #33415580",overflow:"hidden" }}>
              <div style={{ width:`${(e.hp/e.maxHp)*100}%`,height:"100%",background:"#ef4444",borderRadius:5,transition:"width 0.2s" }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",fontSize:10,color:"#475569" }}>
        WASD move • 1/2/3 attack • RMB block • Space jump • Ctrl roll • Shift sprint
      </div>
    </div>
  );
}
