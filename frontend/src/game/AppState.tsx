import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { createAudioPlayer } from "expo-audio";
import { Directory, File, Paths } from "expo-file-system";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { generateChart, trainingChart, OnsetData } from "./chartEngine";
import { fetchTreeshCatalog, TREESH_CATALOG } from "./catalog";
import { ensureWarmupAudio } from "./synth";
import { Chart, Difficulty, GameSettings, ScoreResult, Song } from "./types";

const KEYS = { songs: "vocotap_songs", charts: "vocotap_charts", scores: "vocotap_scores", settings: "vocotap_settings" };
const defaultSettings: GameSettings = { noteSpeed: 1, audioOffset: 0, hitSfx: true, haptics: true, noFail: true, performanceMode: false, reducedParticles: false, grayscaleCovers: false, showLanePads: false, warmupHidden: false };
const warmup: Song = { id: "neon-warmup", title: "Voco Warmup", artist: "Treesh Game", source: "built-in", duration: 26, bpm: 143, accent: "#0DE6D2" };

type AppValue = {
  ready: boolean; songs: Song[]; treeshSongs: Song[]; charts: Record<string, Chart>; scores: ScoreResult[]; settings: GameSettings;
  selectedSong: Song | null; selectedDifficulty: Difficulty; lastResult: ScoreResult | null; testChart: Chart | null;
  selectSong: (song: Song) => void; setDifficulty: (difficulty: Difficulty) => void; setTestChart: (chart: Chart | null) => void;
  importSong: () => Promise<Song | null>; analyzeSong: (song: Song, duration: number, difficulty: Difficulty) => Promise<Chart>;
  renameSong: (id: string, title: string, artist?: string) => Promise<void>; deleteSong: (id: string) => Promise<void>;
  restoreWarmup: () => Promise<void>; deleteChart: (key: string) => Promise<void>;
  exportChart: (chart: Chart, song: Song) => Promise<void>; importChart: () => Promise<Chart | null>;
  saveChart: (chart: Chart) => Promise<void>; saveResult: (result: ScoreResult) => Promise<void>;
  generateAll: (song: Song, duration: number, onsetData?: OnsetData | null) => Promise<void>;
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
  const [warmupUri, setWarmupUri] = useState<string | undefined>(undefined);

  useEffect(() => { (async () => {
    const uri = await ensureWarmupAudio(); setWarmupUri(uri);
    const savedSettings = await read(KEYS.settings, defaultSettings);
    const savedSongs = await read<Song[]>(KEYS.songs, []);
    const device = savedSongs.filter(song => song.id !== warmup.id);
    const withWarmup = savedSettings.warmupHidden ? device : [{ ...warmup, uri }, ...device];
    const savedCharts = await read<Record<string, Chart>>(KEYS.charts, {});
    setSongs(withWarmup); setCharts({ "neon-warmup-Normal": trainingChart(), ...savedCharts });
    setScores(await read(KEYS.scores, [])); setSettings(savedSettings); setReady(true);
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
      setSongs(current => { const nonDevice = current.filter(s => s.source !== "device"); return [...nonDevice, ...next]; }); await AsyncStorage.setItem(KEYS.songs, JSON.stringify(next)); setSelectedSong(song); return song;
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      throw new Error(detail ? `Couldn't import audio: ${detail}` : "Couldn't import that file. Try a different audio file.");
    }
  }, [songs]);

  const saveChart = useCallback(async (chart: Chart) => {
    const key = `${chart.songId}-${chart.difficulty}`; const next = { ...charts, [key]: chart };
    setCharts(next); await AsyncStorage.setItem(KEYS.charts, JSON.stringify(next));
  }, [charts]);

  const updateSettings = useCallback(async (nextValue: Partial<GameSettings>) => {
    setSettings(prev => { const next = { ...prev, ...nextValue }; AsyncStorage.setItem(KEYS.settings, JSON.stringify(next)); return next; });
  }, []);

  const renameSong = useCallback(async (id: string, title: string, artist?: string) => {
    const clean = title.trim(); if (!clean) return;
    const patch = (item: Song) => ({ ...item, title: clean, ...(artist !== undefined ? { artist: artist.trim() || item.artist } : {}) });
    const next = songs.map(item => item.id === id ? patch(item) : item);
    setSongs(next); setSelectedSong(current => current && current.id === id ? patch(current) : current);
    await AsyncStorage.setItem(KEYS.songs, JSON.stringify(next.filter(item => item.source === "device")));
  }, [songs]);

  const deleteSong = useCallback(async (id: string) => {
    if (id === warmup.id) { await updateSettings({ warmupHidden: true }); setSongs(current => current.filter(item => item.id !== id)); setSelectedSong(current => current && current.id === id ? null : current); return; }
    const next = songs.filter(item => item.id !== id);
    setSongs(next); await AsyncStorage.setItem(KEYS.songs, JSON.stringify(next.filter(item => item.source === "device")));
    const nextCharts = { ...charts }; Object.keys(nextCharts).forEach(key => { if (key.startsWith(`${id}-`)) delete nextCharts[key]; });
    setCharts(nextCharts); await AsyncStorage.setItem(KEYS.charts, JSON.stringify(nextCharts));
    setSelectedSong(current => current && current.id === id ? null : current);
  }, [songs, charts, updateSettings]);

  const restoreWarmup = useCallback(async () => {
    await updateSettings({ warmupHidden: false });
    setSongs(current => current.some(s => s.id === warmup.id) ? current : [{ ...warmup, uri: warmupUri }, ...current]);
  }, [updateSettings, warmupUri]);

  const deleteChart = useCallback(async (key: string) => {
    const nextCharts = { ...charts }; delete nextCharts[key];
    setCharts(nextCharts); await AsyncStorage.setItem(KEYS.charts, JSON.stringify(nextCharts));
  }, [charts]);

  const exportChart = useCallback(async (chart: Chart, song: Song) => {
    const payload = JSON.stringify({ format: "vocotap-chart", version: 1, song: { id: song.id, title: song.title, artist: song.artist }, chart }, null, 2);
    const safe = song.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "chart";
    if (Platform.OS === "web") {
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${safe}.vocotap.json`; a.click(); URL.revokeObjectURL(url); return;
    }
    const dir = new Directory(Paths.cache, "vocotap-exports"); dir.create({ idempotent: true, intermediates: true });
    const file = new File(dir, `${safe}.vocotap.json`); file.write(payload);
    const Sharing = await import("expo-sharing");
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Share Vocotap chart" });
  }, []);

  const importChart = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/json", "public.json", "*/*"], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return null;
    const res = await fetch(result.assets[0].uri); const data = await res.json();
    if (data?.format !== "vocotap-chart" || !data.chart?.songId) throw new Error("That file isn't a Vocotap chart.");
    const chart: Chart = { ...data.chart, difficulty: "Custom" };
    await saveChart(chart);
    // Ensure a matching song entry exists so the chart shows up in Customs.
    if (!songs.some(s => s.id === chart.songId)) {
      const stub: Song = { id: chart.songId, title: data.song?.title || "Imported chart", artist: data.song?.artist || "Imported", source: "device", accent: "#CCFF00", duration: chart.duration };
      const nextDevice = [stub, ...songs.filter(s => s.source === "device")];
      setSongs(current => { const nonDevice = current.filter(s => s.source !== "device"); return [...nonDevice, ...nextDevice]; });
      await AsyncStorage.setItem(KEYS.songs, JSON.stringify(nextDevice));
    }
    return chart;
  }, [saveChart, songs]);

  const analyzeSong = useCallback(async (song: Song, duration: number, difficulty: Difficulty) => {
    const chart = song.id === warmup.id && difficulty === "Normal" ? trainingChart() : generateChart(song.id, song.fileName || song.title, duration, difficulty);
    await saveChart(chart); return chart;
  }, [saveChart]);

  // Auto-build charts for every standard difficulty so a song is instantly playable. Standard
  // charts are always regenerated (Custom charts are left untouched) so engine updates take effect.
  const generateAll = useCallback(async (song: Song, duration: number, onsetData?: OnsetData | null) => {
    const next = { ...charts };
    (["Easy", "Normal", "Hard", "Expert"] as Difficulty[]).forEach(d => {
      const key = `${song.id}-${d}`;
      next[key] = song.id === warmup.id && d === "Normal" ? trainingChart() : generateChart(song.id, song.fileName || song.title, duration, d, onsetData);
    });
    setCharts(next); await AsyncStorage.setItem(KEYS.charts, JSON.stringify(next));
  }, [charts]);

  const saveResult = useCallback(async (result: ScoreResult) => {
    const next = [result, ...scores].slice(0, 100); setScores(next); setLastResult(result); await AsyncStorage.setItem(KEYS.scores, JSON.stringify(next));
  }, [scores]);

  const clearLocalData = useCallback(async () => {
    await Promise.all(Object.values(KEYS).map(key => AsyncStorage.removeItem(key))); setScores([]); setCharts({ "neon-warmup-Normal": trainingChart() }); setSettings(defaultSettings); setSongs(current => current.slice(0, 1));
  }, []);

  const value = useMemo(() => ({ ready, songs, treeshSongs, charts, scores, settings, selectedSong, selectedDifficulty, lastResult, testChart, selectSong, setDifficulty, setTestChart, importSong, analyzeSong, renameSong, deleteSong, restoreWarmup, deleteChart, exportChart, importChart, saveChart, saveResult, generateAll, updateSettings, clearLocalData }), [ready, songs, treeshSongs, charts, scores, settings, selectedSong, selectedDifficulty, lastResult, testChart, selectSong, importSong, analyzeSong, renameSong, deleteSong, restoreWarmup, deleteChart, exportChart, importChart, saveChart, saveResult, generateAll, updateSettings, clearLocalData]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() { const value = useContext(AppContext); if (!value) throw new Error("AppStateProvider missing"); return value; }
