import { useArenaStore } from "./stores/useArenaStore";
import { CharacterSelect } from "./ui/CharacterSelect";
import { ArenaScene } from "./game/ArenaScene";
import { HUD } from "./ui/HUD";
import { GameOver } from "./ui/GameOver";

export function App() {
  const phase = useArenaStore((s) => s.phase);

  if (phase === "select") return <CharacterSelect />;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ArenaScene />
      <HUD />
      {(phase === "gameOver" || phase === "victory") && <GameOver />}
    </div>
  );
}
