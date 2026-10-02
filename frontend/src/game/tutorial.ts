import { router } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { useAppState } from "./AppState";
import { tutorialChart } from "./chartEngine";

// Starts the guided tutorial level on the built-in Voco Warmup track (falls back to the guide).
// Reads songs through a ref so a tap during cold boot still works once the library has loaded.
export function useStartTutorial() {
  const { songs, selectSong, setTestChart } = useAppState();
  const songsRef = useRef(songs);
  useEffect(() => { songsRef.current = songs; }, [songs]);
  return useCallback(() => {
    const go = (attempt: number) => {
      const warm = songsRef.current.find(s => s.source === "built-in" && s.uri);
      if (!warm) { if (attempt < 10) setTimeout(() => go(attempt + 1), 300); else router.push("/guide"); return; }
      selectSong(warm); setTestChart(tutorialChart());
      router.push({ pathname: "/game", params: { tutorial: "1" } });
    };
    go(0);
  }, [selectSong, setTestChart]);
}
