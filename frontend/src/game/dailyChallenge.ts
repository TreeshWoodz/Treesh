import AsyncStorage from "@react-native-async-storage/async-storage";
import { Song } from "./types";

// One featured song per day with a star target and a Starlite bonus. Deterministic from the date
// so everyone on the same day (and every screen) sees the same pick. Fully offline.
export type DailyChallenge = { song: Song; targetStars: number; bonus: number; dateKey: string };

export function dailyKey(d = new Date()) { return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }

// Stable candidate pool (Treesh catalog first for stability, then the player's own songs), de-duped.
export function dailyPool(songs: Song[], treeshSongs: Song[], mineSongs: Song[]): Song[] {
  const seen = new Set<string>();
  return [...treeshSongs, ...songs, ...mineSongs].filter(s => s && s.id && !seen.has(s.id) && seen.add(s.id));
}

export function pickDaily(pool: Song[], dateKey = dailyKey()): DailyChallenge | null {
  if (!pool.length) return null;
  let h = 0; for (let i = 0; i < dateKey.length; i++) h = (h * 31 + dateKey.charCodeAt(i)) >>> 0;
  const song = pool[h % pool.length];
  return { song, targetStars: 3, bonus: 250, dateKey };
}

const CLAIM_KEY = "vocotap_daily_claim";
export async function isDailyClaimed(dateKey = dailyKey()): Promise<boolean> {
  try { return (await AsyncStorage.getItem(CLAIM_KEY)) === dateKey; } catch { return false; }
}
export async function claimDaily(dateKey = dailyKey()): Promise<void> {
  try { await AsyncStorage.setItem(CLAIM_KEY, dateKey); } catch {}
}
