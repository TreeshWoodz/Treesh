import AsyncStorage from "@react-native-async-storage/async-storage";
import { Song } from "./types";

// One featured song per day with a star target and a Starlite bonus. Deterministic from the date
// so every screen shows the same pick. Fully offline. Completing several days in a row grows the bonus.
export type DailyChallenge = { song: Song; targetStars: number; bonus: number; dateKey: string };

export function dailyKey(d = new Date()) { return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function keyToDate(k: string) { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); }

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

// Growing reward: 250 on day 1, +100 for each extra consecutive day, capped at 1000.
export function dailyStreakBonus(streak: number) { return Math.min(1000, 250 + Math.max(0, streak - 1) * 100); }

// Weekly milestone chest: every 7th consecutive day drops a bonus chest (grows each week, capped).
export function weeklyChestReward(streak: number): number | null {
  if (streak <= 0 || streak % 7 !== 0) return null;
  const weeks = streak / 7;
  return Math.min(2000, 500 + (weeks - 1) * 250);
}

const CHEST_KEY = "vocotap_streak_chests";
async function getClaimedChests(): Promise<number[]> {
  try { const raw = await AsyncStorage.getItem(CHEST_KEY); return raw ? JSON.parse(raw) as number[] : []; } catch { return []; }
}
// If the current streak just hit a new weekly milestone, returns the chest reward (once) else null.
export async function claimWeeklyChest(streak: number): Promise<number | null> {
  const reward = weeklyChestReward(streak);
  if (reward == null) return null;
  const claimed = await getClaimedChests();
  if (claimed.includes(streak)) return null;
  claimed.push(streak);
  try { await AsyncStorage.setItem(CHEST_KEY, JSON.stringify(claimed.slice(-60))); } catch {}
  return reward;
}

const HISTORY_KEY = "vocotap_daily_history";
export async function getDailyHistory(): Promise<string[]> {
  try { const raw = await AsyncStorage.getItem(HISTORY_KEY); return raw ? JSON.parse(raw) as string[] : []; } catch { return []; }
}
// Count consecutive cleared days ending today (or yesterday if today not yet cleared).
export function computeStreak(history: string[], today = dailyKey()): number {
  const set = new Set(history);
  let cursor = keyToDate(today);
  if (!set.has(dailyKey(cursor))) { cursor.setDate(cursor.getDate() - 1); if (!set.has(dailyKey(cursor))) return 0; }
  let streak = 0;
  while (set.has(dailyKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}
export async function isDailyClaimed(dateKey = dailyKey()): Promise<boolean> {
  return (await getDailyHistory()).includes(dateKey);
}
// Records today's completion (idempotent) and returns the resulting streak.
export async function recordDailyDone(dateKey = dailyKey()): Promise<number> {
  const history = await getDailyHistory();
  if (!history.includes(dateKey)) { history.push(dateKey); try { await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-400))); } catch {} }
  return computeStreak(history, dateKey);
}
