import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { generateChart, trainingChart } from "./chartEngine";
import { ensureWarmupAudio } from "./synth";
import { Chart, Difficulty, GameSettings, ScoreResult, Song } from "./types";

const KEYS = { songs: "vocotap_songs", charts: "vocotap_charts", scores: "vocotap_scores", settings: "vocotap_settings" };
const defaultSettings: GameSettings = { noteSpeed: 1, audioOffset: 0, hitSfx: true, haptics: true, noFail: true, performanceMode: false, reducedParticles: false };
const warmup: Song = { id: "neon-warmup", title: "Neon Warmup", artist: "Treesh Game", source: "built-in", duration: 12.2, bpm: 143, accent: "#0DE6D2", coverArt: require("../../assets/images/vocotap-bg.jpg") };

type AppValue = {
  ready: boolean; songs: Song[]; charts: Record<string, Chart>; scores: ScoreResult[]; settings: GameSettings;
  selectedSong: Song | null; selectedDifficulty: Difficulty; lastResult: ScoreResult | null;
  selectSong: (song: Song) => void; setDifficulty: (difficulty: Difficulty) => void;
  importSong: () => Promise<Song | null>; analyzeSong: (song: Song, duration: number, difficulty: Difficulty) => Promise<Chart>;
  saveChart: (chart: Chart) => Promise<void>; saveResult: (result: ScoreResult) => Promise<void>;
  updateSettings: (next: Partial<GameSettings>) => Promise<void>; clearLocalData: () => Promise<void>;
};

const AppContext = createContext<AppValue | null>(null);
const read = async <T,>(key: string, fallback: T): Promise<T> => { try { const raw = await AsyncStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [charts, setCharts] = useState<Record<string, Chart>>({});
  const [scores, setScores] = useState<ScoreResult[]>([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedDifficulty, setDifficulty] = useState<Difficulty>("Normal");
  const [lastResult, setLastResult] = useState<ScoreResult | null>(null);

  useEffect(() => { (async () => {
    const uri = await ensureWarmupAudio();
    const savedSongs = await read<Song[]>(KEYS.songs, []);
    const withWarmup = [{ ...warmup, uri }, ...savedSongs.filter(song => song.id !== warmup.id)];
    const savedCharts = await read<Record<string, Chart>>(KEYS.charts, {});
    setSongs(withWarmup); setCharts({ "neon-warmup-Normal": trainingChart(), ...savedCharts });
    setScores(await read(KEYS.scores, [])); setSettings(await read(KEYS.settings, defaultSettings)); setReady(true);
  })(); }, []);

  const selectSong = useCallback((song: Song) => setSelectedSong(song), []);

  const importSong = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "audio/*", multiple: false, copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    let uri = asset.uri;
    if (Platform.OS !== "web") {
      const directory = new Directory(Paths.document, "vocotap-audio"); directory.create({ idempotent: true, intermediates: true });
      const extension = asset.name.includes(".") ? asset.name.slice(asset.name.lastIndexOf(".")).replace(/[^.a-zA-Z0-9]/g, "") : ".audio";
      const destination = new File(directory, `${Date.now()}${extension}`); new File(asset.uri).copy(destination); uri = destination.uri;
    }
    const song: Song = { id: `device-${Date.now()}`, title: asset.name.replace(/\.[^/.]+$/, ""), artist: "On this device", source: "device", uri, fileName: asset.name, duration: 30, accent: "#CCFF00" };
    const next = [...songs.filter(item => item.source === "device"), song];
    setSongs(current => [current[0], ...next]); await AsyncStorage.setItem(KEYS.songs, JSON.stringify(next)); setSelectedSong(song); return song;
  }, [songs]);

  const saveChart = useCallback(async (chart: Chart) => {
    const key = `${chart.songId}-${chart.difficulty}`; const next = { ...charts, [key]: chart };
    setCharts(next); await AsyncStorage.setItem(KEYS.charts, JSON.stringify(next));
  }, [charts]);

  const analyzeSong = useCallback(async (song: Song, duration: number, difficulty: Difficulty) => {
    const chart = song.id === warmup.id && difficulty === "Normal" ? trainingChart() : generateChart(song.id, song.fileName || song.title, duration, difficulty);
    await saveChart(chart); return chart;
  }, [saveChart]);

  const saveResult = useCallback(async (result: ScoreResult) => {
    const next = [result, ...scores].slice(0, 100); setScores(next); setLastResult(result); await AsyncStorage.setItem(KEYS.scores, JSON.stringify(next));
  }, [scores]);

  const updateSettings = useCallback(async (nextValue: Partial<GameSettings>) => {
    const next = { ...settings, ...nextValue }; setSettings(next); await AsyncStorage.setItem(KEYS.settings, JSON.stringify(next));
  }, [settings]);

  const clearLocalData = useCallback(async () => {
    await Promise.all(Object.values(KEYS).map(key => AsyncStorage.removeItem(key))); setScores([]); setCharts({ "neon-warmup-Normal": trainingChart() }); setSettings(defaultSettings); setSongs(current => current.slice(0, 1));
  }, []);

  const value = useMemo(() => ({ ready, songs, charts, scores, settings, selectedSong, selectedDifficulty, lastResult, selectSong, setDifficulty, importSong, analyzeSong, saveChart, saveResult, updateSettings, clearLocalData }), [ready, songs, charts, scores, settings, selectedSong, selectedDifficulty, lastResult, selectSong, importSong, analyzeSong, saveChart, saveResult, updateSettings, clearLocalData]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() { const value = useContext(AppContext); if (!value) throw new Error("AppStateProvider missing"); return value; }
