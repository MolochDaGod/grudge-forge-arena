import { useEffect } from "react";
import { useArenaStore } from "./stores/useArenaStore";
import { CharacterSelect } from "./ui/CharacterSelect";
import { ArenaScene } from "./game/ArenaScene";
import { HUD } from "./ui/HUD";
import { GameOver } from "./ui/GameOver";
import { LoadingScreen } from "./ui/LoadingScreen";
import { MapSelect } from "./ui/MapSelect";
import { GameDataClient } from "./api/GameDataClient";
import { preloadGameAssets } from "./game/AssetPreloader";
import { getAllCharacterDefs } from "./game/GrudgeClasses";

const ENEMY_COUNT = 5;
const ALL_DEFS = getAllCharacterDefs();

/** Loading orchestration — runs when phase transitions to "loading" */
function useLoadingPipeline() {
  const phase = useArenaStore((s) => s.phase);
  const charDef = useArenaStore((s) => s.selectedCharDef);
  const setPhase = useArenaStore((s) => s.setPhase);
  const setLoadProgress = useArenaStore((s) => s.setLoadProgress);

  useEffect(() => {
    if (phase !== "loading" || !charDef) return;
    let cancelled = false;

    async function runPipeline() {
      // Step 1: Fetch game data from ObjectStore (10%)
      setLoadProgress(0, "Fetching game data...");
      await GameDataClient.fetchWeapons([], (s) => !cancelled && setLoadProgress(3, s));
      await GameDataClient.fetchSkills({}, (s) => !cancelled && setLoadProgress(6, s));
      await GameDataClient.fetchMapConfig({}, (s) => !cancelled && setLoadProgress(10, s));
      if (cancelled) return;

      // Step 2: Terrain generation happens in ArenaScene — mark progress (30%)
      setLoadProgress(15, "Generating terrain...");
      // (terrain gen is synchronous in useMemo, so just mark and continue)
      await new Promise(r => setTimeout(r, 100)); // yield for UI update
      setLoadProgress(30, "Building collision...");
      if (cancelled) return;

      // Step 3: Preload FBX assets (30% → 90%)
      const enemyDefs = Array.from({ length: ENEMY_COUNT }, (_, i) =>
        ALL_DEFS[i % ALL_DEFS.length]
      );
      await preloadGameAssets(charDef, enemyDefs, (p) => {
        if (cancelled) return;
        const pct = 30 + (p.loaded / Math.max(1, p.total)) * 60;
        setLoadProgress(pct, p.status);
      });
      if (cancelled) return;

      // Step 4: Final setup (90% → 100%)
      setLoadProgress(95, "Initializing scene...");
      await new Promise(r => setTimeout(r, 200)); // brief pause for render
      if (cancelled) return;

      setLoadProgress(100, "Ready!");
      await new Promise(r => setTimeout(r, 400)); // show 100% briefly
      if (!cancelled) setPhase("playing");
    }

    runPipeline();
    return () => { cancelled = true; };
  }, [phase, charDef, setPhase, setLoadProgress]);
}

export function App() {
  useLoadingPipeline();
  const phase = useArenaStore((s) => s.phase);

  if (phase === "select") return <CharacterSelect />;
  if (phase === "mapSelect") return <MapSelect />;
  if (phase === "loading") return <LoadingScreen />;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ArenaScene />
      <HUD />
      {(phase === "gameOver" || phase === "victory") && <GameOver />}
    </div>
  );
}
