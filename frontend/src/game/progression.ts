// Player progression: XP + levels, letter grades, per-song mastery crowns and Starlite-bought note skins.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { setLaneSkin } from "./theme";
import { Difficulty, ScoreResult } from "./types";

// ---------- Levels ----------
export const xpToNext = (level: number) => 400 + (level - 1) * 150;
export function levelInfo(xp: number) {
  let level = 1, rest = xp;
  while (rest >= xpToNext(level)) { rest -= xpToNext(level); level++; }
  return { level, into: rest, need: xpToNext(level), frac: rest / xpToNext(level) };
}
export const levelTitle = (lv: number) => lv >= 40 ? "LEGEND" : lv >= 30 ? "VIRTUOSO" : lv >= 20 ? "HEADLINER" : lv >= 12 ? "ROCKSTAR" : lv >= 6 ? "PERFORMER" : lv >= 3 ? "OPENER" : "ROOKIE";
export const levelUpReward = (lv: number) => 100 + lv * 20;

const DIFF_MULT: Record<Difficulty, number> = { Easy: 0.8, Normal: 1, Hard: 1.3, Expert: 1.6, Custom: 1 };
export function xpForRun(r: Pick<ScoreResult, "perfect" | "great" | "good" | "miss" | "stars" | "difficulty" | "totalNotes">) {
  const hits = r.perfect + r.great + r.good;
  const fc = r.miss === 0 && r.totalNotes > 0;
  const ap = fc && r.great === 0 && r.good === 0;
  return Math.round((60 + hits * 2 + r.stars * 40 + (fc ? 150 : 0) + (ap ? 300 : 0)) * DIFF_MULT[r.difficulty]);
}

// ---------- Grades & medals ----------
export type Grade = "S+" | "S" | "A" | "B" | "C" | "D";
export const GRADE_COLOR: Record<Grade, string> = { "S+": "#FFD600", S: "#CCFF00", A: "#00E5FF", B: "#B537FF", C: "#FF8A00", D: "#FF2D7A" };
export function gradeFor(r: Pick<ScoreResult, "perfect" | "great" | "good" | "miss" | "totalNotes">): Grade {
  const total = r.totalNotes || 1;
  const pct = ((r.perfect + r.great * 0.75 + r.good * 0.45) / total) * 100;
  if (r.miss === 0 && r.great === 0 && r.good === 0 && r.totalNotes > 0) return "S+";
  return pct >= 95 ? "S" : pct >= 88 ? "A" : pct >= 75 ? "B" : pct >= 60 ? "C" : "D";
}
export const isFullCombo = (r: ScoreResult) => r.miss === 0 && r.totalNotes > 0;
export const isAllPerfect = (r: ScoreResult) => isFullCombo(r) && r.great === 0 && r.good === 0;

// ---------- Mastery crowns (per song) ----------
export type Crown = "none" | "bronze" | "gold" | "diamond";
export const CROWN_COLOR: Record<Crown, string> = { none: "rgba(255,255,255,0.18)", bronze: "#FF9F5A", gold: "#FFD600", diamond: "#7DF9FF" };
export const CROWN_LABEL: Record<Crown, string> = { none: "Unplayed", bronze: "Cleared", gold: "Full Combo", diamond: "All Perfect" };
const crownOf = (r: ScoreResult): Crown => isAllPerfect(r) ? "diamond" : isFullCombo(r) ? "gold" : r.stars >= 3 ? "bronze" : "none";
const CROWN_RANK: Crown[] = ["none", "bronze", "gold", "diamond"];
export function masteryFor(scores: ScoreResult[], songId: string, difficulty?: Difficulty) {
  let crown: Crown = "none"; let best: ScoreResult | null = null;
  for (const s of scores) {
    if (s.songId !== songId || (difficulty && s.difficulty !== difficulty)) continue;
    const c = crownOf(s); if (CROWN_RANK.indexOf(c) > CROWN_RANK.indexOf(crown)) crown = c;
    if (!best || s.score > best.score) best = s;
  }
  return { crown, best, grade: best ? gradeFor(best) : null };
}

// ---------- Note skins ----------
export type Skin = { id: string; name: string; price: number; lanes: string[]; glow: string; tag: string };
export const SKINS: Skin[] = [
  { id: "neon", name: "Neon Core", price: 0, lanes: ["#FF2D7A", "#00E5FF", "#CCFF00", "#B537FF"], glow: "#00E5FF", tag: "DEFAULT" },
  { id: "synthwave", name: "Synthwave", price: 500, lanes: ["#FF3CAC", "#FF8A00", "#FFE600", "#8B5CFF"], glow: "#FF3CAC", tag: "RETRO" },
  { id: "glacier", name: "Glacier", price: 750, lanes: ["#7DF9FF", "#3AB0FF", "#B4C8FF", "#E6FBFF"], glow: "#7DF9FF", tag: "ICE" },
  { id: "toxic", name: "Toxic", price: 750, lanes: ["#39FF14", "#00FF9C", "#B6FF00", "#00E5A0"], glow: "#39FF14", tag: "HAZARD" },
  { id: "inferno", name: "Inferno", price: 1000, lanes: ["#FF2A00", "#FF6A00", "#FFB300", "#FF0055"], glow: "#FF6A00", tag: "FIRE" },
  { id: "prism", name: "Prism", price: 1500, lanes: ["#FF0055", "#FFD600", "#00FF9C", "#00A3FF"], glow: "#FFFFFF", tag: "RAINBOW" },
  { id: "midas", name: "Midas", price: 2500, lanes: ["#FFD700", "#FFC300", "#FFE680", "#FFB000"], glow: "#FFD700", tag: "LEGENDARY" },
];
export const skinById = (id: string) => SKINS.find(s => s.id === id) || SKINS[0];

// ---------- Highway themes (full gameplay backdrops) ----------
export type HighwayTheme = { id: string; name: string; price: number; tag: string; glow: string };
export const THEMES: HighwayTheme[] = [
  { id: "classic", name: "Classic Grid", price: 0, tag: "DEFAULT", glow: "#00E5FF" },
  { id: "city", name: "Neon City", price: 800, tag: "URBAN", glow: "#FF2D7A" },
  { id: "space", name: "Deep Space", price: 1000, tag: "COSMIC", glow: "#8B5CFF" },
  { id: "sunset", name: "Sunset Drive", price: 1200, tag: "RETRO", glow: "#FF8A00" },
];
export const themeById = (id: string) => THEMES.find(t => t.id === id) || THEMES[0];

// ---------- Crown challenges: one-time Starlite bonus per song + difficulty ----------
export const CROWN_BONUS = { gold: 150, diamond: 400 } as const;
const CLAIM_KEY = "vocotap_crown_claims";
export async function claimCrowns(r: ScoreResult): Promise<{ bonus: number; crown?: "gold" | "diamond" }> {
  if (r.difficulty === "Custom" || !isFullCombo(r)) return { bonus: 0 };
  let claims: string[] = [];
  try { claims = JSON.parse((await AsyncStorage.getItem(CLAIM_KEY)) || "[]"); } catch {}
  const base = `${r.songId}-${r.difficulty}`; let bonus = 0; let crown: "gold" | "diamond" | undefined;
  if (!claims.includes(`${base}-gold`)) { claims.push(`${base}-gold`); bonus += CROWN_BONUS.gold; crown = "gold"; }
  if (isAllPerfect(r) && !claims.includes(`${base}-diamond`)) { claims.push(`${base}-diamond`); bonus += CROWN_BONUS.diamond; crown = "diamond"; }
  if (bonus) await AsyncStorage.setItem(CLAIM_KEY, JSON.stringify(claims)).catch(() => {});
  return { bonus, crown };
}

// ---------- Persistent store (tiny pub-sub, no provider needed) ----------
export type Progress = { xp: number; owned: string[]; skin: string; themes: string[]; theme: string };
const KEY = "vocotap_progress";
let state: Progress = { xp: 0, owned: ["neon"], skin: "neon", themes: ["classic"], theme: "classic" };
let loaded = false;
const listeners = new Set<(p: Progress) => void>();
const emit = () => { setLaneSkin(skinById(state.skin).lanes); listeners.forEach(l => l(state)); };
const save = () => AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
const load = AsyncStorage.getItem(KEY).then(raw => { if (raw) state = { ...state, ...JSON.parse(raw) }; loaded = true; emit(); }).catch(() => { loaded = true; });

export function useProgress() {
  const [p, setP] = useState(state);
  useEffect(() => { listeners.add(setP); if (loaded) setP(state); return () => { listeners.delete(setP); }; }, []);
  return p;
}
export async function addXp(amount: number) {
  await load;
  const before = levelInfo(state.xp);
  state = { ...state, xp: state.xp + amount }; await save(); emit();
  return { xpBefore: state.xp - amount, xpAfter: state.xp, levelBefore: before.level, levelAfter: levelInfo(state.xp).level };
}
export async function buySkin(id: string) { await load; if (!state.owned.includes(id)) { state = { ...state, owned: [...state.owned, id], skin: id }; await save(); emit(); } }
export async function equipSkin(id: string) { await load; if (state.owned.includes(id)) { state = { ...state, skin: id }; await save(); emit(); } }
export async function buyTheme(id: string) { await load; if (!state.themes.includes(id)) { state = { ...state, themes: [...state.themes, id], theme: id }; await save(); emit(); } }
export async function equipTheme(id: string) { await load; if (state.themes.includes(id)) { state = { ...state, theme: id }; await save(); emit(); } }
