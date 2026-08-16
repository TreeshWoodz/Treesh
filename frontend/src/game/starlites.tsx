import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

export const STARLITES_KEY = "treesh_stars";
export const STAR_AWARDS = { daily: 50, streakBonus: 25, newSong: 15, listen30: 100, game: 25, beat: 40, favSong: 5, favLyric: 5, note: 5 };

export type Starlites = {
  points: number; lastDaily: string | null; streak: number; newSongs: Record<string, number>;
  minToday: number; min30Date: string | null; secAccum: number; totalMin: number;
  games: number; beats: number; log: { t: number; a: number; r: string }[];
};

const defaults: Starlites = { points: 0, lastDaily: null, streak: 0, newSongs: {}, minToday: 0, min30Date: null, secAccum: 0, totalMin: 0, games: 0, beats: 0, log: [] };
const dayKey = (date = new Date()) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

async function readStars() {
  try {
    const raw = Platform.OS === "web" && globalThis.localStorage ? globalThis.localStorage.getItem(STARLITES_KEY) : await AsyncStorage.getItem(STARLITES_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } as Starlites : defaults;
  } catch { return defaults; }
}

async function writeStars(value: Starlites) {
  const raw = JSON.stringify(value);
  if (Platform.OS === "web" && globalThis.localStorage) globalThis.localStorage.setItem(STARLITES_KEY, raw);
  else await AsyncStorage.setItem(STARLITES_KEY, raw);
}

type ContextValue = {
  stars: Starlites; toast: { amount: number; reason: string } | null;
  award: (amount: number, reason: string, silent?: boolean) => Promise<number>;
  gameComplete: (label: string, notes?: number) => Promise<number>;
  discoverSong: (id: string) => Promise<number>;
  listen: (seconds: number) => Promise<number>;
  dismissToast: () => void;
};

const StarlitesContext = createContext<ContextValue | null>(null);

export function StarlitesProvider({ children }: { children: React.ReactNode }) {
  const [stars, setStars] = useState(defaults);
  const [toast, setToast] = useState<ContextValue["toast"]>(null);

  const persist = useCallback(async (next: Starlites) => { setStars(next); await writeStars(next); }, []);
  const award = useCallback(async (amount: number, reason: string, silent = false) => {
    const current = await readStars();
    const next = { ...current, points: current.points + amount, log: [{ t: Date.now(), a: amount, r: reason }, ...current.log].slice(0, 50) };
    await persist(next); if (!silent) setToast({ amount, reason });
    return amount;
  }, [persist]);

  useEffect(() => {
    readStars().then(async current => {
      const today = dayKey();
      if (current.lastDaily === today) return setStars(current);
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const streak = current.lastDaily === dayKey(yesterday) ? current.streak + 1 : 1;
      const amount = STAR_AWARDS.daily + (streak > 1 ? STAR_AWARDS.streakBonus : 0);
      const reason = streak > 1 ? `${streak}-day streak. Welcome back!` : "Daily check-in";
      const next = { ...current, lastDaily: today, streak, minToday: 0, points: current.points + amount, log: [{ t: Date.now(), a: amount, r: reason }, ...current.log].slice(0, 50) };
      await persist(next); setToast({ amount, reason });
    });
  }, [persist]);

  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 3600); return () => clearTimeout(timer); }, [toast]);

  const gameComplete = useCallback(async (label: string, notes?: number) => {
    const current = await readStars();
    await writeStars({ ...current, games: current.games + 1 });
    if (notes !== undefined && notes < 200) return 0; // Starlites only for charts with 200+ notes
    return await award(STAR_AWARDS.game, `${label} complete`, true);
  }, [award]);

  const discoverSong = useCallback(async (id: string) => {
    const current = await readStars(); if (current.newSongs[id]) return 0;
    await writeStars({ ...current, newSongs: { ...current.newSongs, [id]: Date.now() } });
    return await award(STAR_AWARDS.newSong, "New song discovered", true);
  }, [award]);

  const listen = useCallback(async (seconds: number) => {
    if (!(seconds > 0)) return 0; const current = await readStars(); const today = dayKey();
    let secAccum = current.secAccum + seconds; const minutes = Math.floor(secAccum / 60); secAccum -= minutes * 60;
    const next = { ...current, secAccum, totalMin: current.totalMin + minutes, minToday: current.minToday + minutes };
    let earned = 0;
    if (next.minToday >= 30 && next.min30Date !== today) {
      next.min30Date = today; next.points += STAR_AWARDS.listen30; next.log = [{ t: Date.now(), a: STAR_AWARDS.listen30, r: "30 minutes of listening today" }, ...next.log].slice(0, 50); earned = STAR_AWARDS.listen30;
    }
    await persist(next); return earned;
  }, [persist]);

  const value = useMemo(() => ({ stars, toast, award, gameComplete, discoverSong, listen, dismissToast: () => setToast(null) }), [stars, toast, award, gameComplete, discoverSong, listen]);
  return <StarlitesContext.Provider value={value}>{children}</StarlitesContext.Provider>;
}

export function useStarlites() {
  const value = useContext(StarlitesContext); if (!value) throw new Error("StarlitesProvider missing"); return value;
}