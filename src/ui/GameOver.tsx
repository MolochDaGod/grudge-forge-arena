import { useArenaStore } from "../stores/useArenaStore";

export function GameOver() {
  const phase = useArenaStore((s) => s.phase);
  const kills = useArenaStore((s) => s.kills);
  const restart = useArenaStore((s) => s.restart);
  const isVictory = phase === "victory";

  return (
    <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",zIndex:50 }}>
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:24,padding:40,borderRadius:16,background:"#0f172aee",border:"1px solid #33415580",maxWidth:360,textAlign:"center" }}>
        <h2 style={{ fontSize:48,fontWeight:900,letterSpacing:4,color:isVictory?"#f59e0b":"#ef4444" }}>
          {isVictory ? "VICTORY" : "DEFEATED"}
        </h2>
        <p style={{ color:"#94a3b8",fontSize:14 }}>{isVictory ? "All enemies have been vanquished!" : "You have fallen in battle."}</p>
        <div style={{ fontSize:12,color:"#64748b" }}>Kills: <span style={{ color:"#fbbf24",fontWeight:700,fontSize:20 }}>{kills}</span></div>
        <button onClick={restart} style={{ padding:"12px 32px",borderRadius:8,background:"#f59e0b",color:"#000",fontWeight:700,fontSize:14,border:"none",cursor:"pointer" }}>
          Fight Again
        </button>
      </div>
    </div>
  );
}
