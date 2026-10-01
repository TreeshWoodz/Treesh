import { router } from "expo-router";
import { useCallback } from "react";
import { useAppState } from "./AppState";
import { tutorialChart } from "./chartEngine";

// Starts the guided tutorial level on the built-in Voco Warmup track (falls back to the guide).
export function useStartTutorial() {
  const { songs, selectSong, setTestChart } = useAppState();
  return useCallback(() => {
    const warm = songs.find(s => s.source === "built-in" && s.uri);
    if (!warm) { router.push("/guide"); return; }
    selectSong(warm); setTestChart(tutorialChart());
    router.push({ pathname: "/game", params: { tutorial: "1" } });
  }, [songs, selectSong, setTestChart]);
}
