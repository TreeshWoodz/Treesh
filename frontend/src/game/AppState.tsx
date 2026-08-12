import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { createAudioPlayer } from "expo-audio";
import { Directory, File, Paths } from "expo-file-system";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { generateChart, trainingChart } from "./chartEngine";
import { fetchTreeshCatalog, TREESH_CATALOG } from "./catalog";
import { ensureWarmupAudio } from "./synth";
import { Chart, Difficulty, GameSettings, ScoreResult, Song } from "./types";

const KEYS = { songs: "vocotap_songs", charts: "vocotap_charts", scores: "vocotap_scores", settings: "vocotap_settings" };
const defaultSettings: GameSettings = { noteSpeed: 1, audioOffset: 0, hitSfx: true, haptics: true, noFail: true, performanceMode: false, reducedParticles: false, grayscaleCovers: false, showLanePads: false };
const warmup: Song = { id: "neon-warmup", title: "Neon Warmup", artist: "Treesh Game", source: "built-in", duration: 12.2, bpm: 143, accent: "#0DE6D2" };

type AppValue = {
  ready: boolean; songs: Song[]; treeshSongs: Song[]; charts: Record<string, Chart>; scores: ScoreResult[]; settings: GameSettings;
  selectedSong: Song | null; selectedDifficulty: Difficulty; lastResult: ScoreResult | null; testChart: Chart | null;
  selectSong: (song: Song) => void; setDifficulty: (difficulty: Difficulty) => void; setTestChart: (chart: Chart | null) => void;
  importSong: () => Promise<Song | null>; analyzeSong: (song: Song, duration: number, difficulty: Difficulty) => Promise<Chart>;
  renameSong: (id: string, title: string) => Promise<void>; deleteSong: (id: string) => Promise<void>;
  saveChart: (chart: Chart) => Promise<void>; saveResult: (result: ScoreResult) => Promise<void>;
  generateAll: (song: Song, duration: number) => Promise<void>;
  updateSettings: (next: Partial<GameSettings>) => Promise<void>; clearLocalData: () => Promise<void>;
};

const AppContext = createContext<AppValue | null>(null);
const read = async <T,>(key: string, fallback: T): Promise<T> => { try { const raw = await AsyncStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [treeshSongs, setTreeshSongs] = useState<Song[]>(TREESH_CATALOG);
  const [charts, setCharts] = useState<Record<string, Chart>>({});
  const [scores, setScores] = useState<ScoreResult[]>([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedDifficulty, setDifficulty] = useState<Difficulty>("Normal");
  const [lastResult, setLastResult] = useState<ScoreResult | null>(null);
  const [testChart, setTestChart] = useState<Chart | null>(null);

  useEffect(() => { (async () => {
    const uri = await ensureWarmupAudio();
    const savedSongs = await read<Song[]>(KEYS.songs, []);
    const withWarmup = [{ ...warmup, uri }, ...savedSongs.filter(song => song.id !== warmup.id)];
    const savedCharts = await read<Record<string, Chart>>(KEYS.charts, {});
    setSongs(withWarmup); setCharts({ "neon-warmup-Normal": trainingChart(), ...savedCharts });
    setScores(await read(KEYS.scores, [])); setSettings(await read(KEYS.settings, defaultSettings)); setReady(true);
    const cachedCatalog = await read<Song[]>("vocotap_treesh", []);
    if (cachedCatalog.length) setTreeshSongs(cachedCatalog);
    fetchTreeshCatalog().then(list => { setTreeshSongs(list); AsyncStorage.setItem("vocotap_treesh", JSON.stringify(list)); }).catch(() => {});
  })(); }, []);

  const selectSong = useCallback((song: Song) => { setTestChart(null); setSelectedSong(song); }, []);

  const importSong = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["audio/*", "public.audio", "application/ogg", "application/octet-stream"], multiple: false, copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return null;
      const asset = result.assets[0];
      let uri = asset.uri;
      if (Platform.OS !== "web") {
        const directory = new Directory(Paths.document, "vocotap-audio"); directory.create({ idempotent: true, intermediates: true });
        const extension = asset.name.includes(".") ? asset.name.slice(asset.name.lastIndexOf(".")).replace(/[^.a-zA-Z0-9]/g, "") : ".audio";
        const destination = new File(directory, `${Date.now()}${extension}`); new File(asset.uri).copy(destination); uri = destination.uri;
      }
      // Probe the real duration so charts + the end-of-game screen trigger at the true song length.
      let realDuration = 0;
      try {
        const probe = createAudioPlayer({ uri });
        for (let i = 0; i < 25 && !(probe.duration > 0.5); i++) await new Promise(resolve => setTimeout(resolve, 120));
        if (probe.duration > 0.5) realDuration = probe.duration;
        probe.remove();
      } catch { /* fall back to analysis-screen measurement */ }
      const song: Song = { id: `device-${Date.now()}`, title: asset.name.replace(/\.[^/.]+$/, ""), artist: "On this device", source: "device", uri, fileName: asset.name, duration: realDuration || 180, accent: "#CCFF00" };
      const next = [song, ...songs.filter(item => item.source === "device")];
      setSongs(current => [current[0], ...next]); await AsyncStorage.setItem(KEYS.songs, JSON.stringify(next)); setSelectedSong(song); return song;
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      throw new Error(detail ? `Couldn't import audio: ${detail}` : "Couldn't import that file. Try a different audio file.");
    }
  }, [songs]);

  const saveChart = useCallback(async (chart: Chart) => {
    const key = `${chart.songId}-${chart.difficulty}`; const next = { ...charts, [key]: chart };
    setCharts(next); await AsyncStorage.setItem(KEYS.charts, JSON.stringify(next));
  }, [charts]);

  const renameSong = useCallback(async (id: string, title: string) => {
    const clean = title.trim(); if (!clean) return;
    const next = songs.map(item => item.id === id ? { ...item, title: clean } : item);
    setSongs(next); setSelectedSong(current => current && current.id === id ? { ...current, title: clean } : current);
    await AsyncStorage.setItem(KEYS.songs, JSON.stringify(next.filter(item => item.source === "device")));
  }, [songs]);

  const deleteSong = useCallback(async (id: string) => {
    const next = songs.filter(item => item.id !== id);
    setSongs(next); await AsyncStorage.setItem(KEYS.songs, JSON.stringify(next.filter(item => item.source === "device")));
    const nextCharts = { ...charts }; Object.keys(nextCharts).forEach(key => { if (key.startsWith(`${id}-`)) delete nextCharts[key]; });
    setCharts(nextCharts); await AsyncStorage.setItem(KEYS.charts, JSON.stringify(nextCharts));
    setSelectedSong(current => current && current.id === id ? null : current);
  }, [songs, charts]);

  const analyzeSong = useCallback(async (song: Song, duration: number, difficulty: Difficulty) => {
    const chart = song.id === warmup.id && difficulty === "Normal" ? trainingChart() : generateChart(song.id, song.fileName || song.title, duration, difficulty);
    await saveChart(chart); return chart;
  }, [saveChart]);

  // Auto-build charts for every standard difficulty (only the ones missing) so a song is instantly playable.
  const generateAll = useCallback(async (song: Song, duration: number) => {
    const next = { ...charts }; let changed = false;
    (["Easy", "Normal", "Hard", "Expert"] as Difficulty[]).forEach(d => {
      const key = `${song.id}-${d}`;
      if (!next[key]) { next[key] = song.id === warmup.id && d === "Normal" ? trainingChart() : generateChart(song.id, song.fileName || song.title, duration, d); changed = true; }
    });
    if (changed) { setCharts(next); await AsyncStorage.setItem(KEYS.charts, JSON.stringify(next)); }
  }, [charts]);

  const saveResult = useCallback(async (result: ScoreResult) => {
    const next = [result, ...scores].slice(0, 100); setScores(next); setLastResult(result); await AsyncStorage.setItem(KEYS.scores, JSON.stringify(next));
  }, [scores]);

  const updateSettings = useCallback(async (nextValue: Partial<GameSettings>) => {
    const next = { ...settings, ...nextValue }; setSettings(next); await AsyncStorage.setItem(KEYS.settings, JSON.stringify(next));
  }, [settings]);

  const clearLocalData = useCallback(async () => {
    await Promise.all(Object.values(KEYS).map(key => AsyncStorage.removeItem(key))); setScores([]); setCharts({ "neon-warmup-Normal": trainingChart() }); setSettings(defaultSettings); setSongs(current => current.slice(0, 1));
  }, []);

  const value = useMemo(() => ({ ready, songs, treeshSongs, charts, scores, settings, selectedSong, selectedDifficulty, lastResult, testChart, selectSong, setDifficulty, setTestChart, importSong, analyzeSong, renameSong, deleteSong, saveChart, saveResult, generateAll, updateSettings, clearLocalData }), [ready, songs, treeshSongs, charts, scores, settings, selectedSong, selectedDifficulty, lastResult, testChart, selectSong, importSong, analyzeSong, renameSong, deleteSong, saveChart, saveResult, generateAll, updateSettings, clearLocalData]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() { const value = useContext(AppContext); if (!value) throw new Error("AppStateProvider missing"); return value; }
