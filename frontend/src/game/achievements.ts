import { Ionicons } from "@expo/vector-icons";
import { Chart, ScoreResult, Song } from "./types";

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  tier: "bronze" | "silver" | "gold";
  unlocked: boolean;
  progress: number;   // 0..1
  goalText: string;   // e.g. "3 / 5"
};

export const TIER_COLOR: Record<Achievement["tier"], string> = { bronze: "#CD7F32", silver: "#C4CAD6", gold: "#F5C842" };

type Data = { scores: ScoreResult[]; charts: Record<string, Chart>; songs: Song[]; points: number; streak: number; games: number };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// All achievements are DERIVED from existing local data — no extra storage needed.
export function computeAchievements({ scores, charts, songs, points, streak, games }: Data): Achievement[] {
  const bestCombo = scores.reduce((m, s) => Math.max(m, s.maxCombo), 0);
  const bestStars = scores.reduce((m, s) => Math.max(m, s.stars), 0);
  const bestAcc = scores.reduce((m, s) => Math.max(m, s.accuracy), 0);
  const hasFullCombo = scores.some(s => s.totalNotes > 0 && s.miss === 0 && s.maxCombo >= s.totalNotes);
  const customCharts = Object.keys(charts).filter(k => k.endsWith("-Custom")).length;
  const imports = songs.filter(s => s.source === "device").length;
  const uniqueSongs = new Set(scores.map(s => s.songId)).size;
  const totalNotesHit = scores.reduce((sum, s) => sum + s.perfect + s.great + s.good, 0);
  const fiveStarCount = scores.filter(s => s.stars >= 5).length;
  const fullComboCount = scores.filter(s => s.totalNotes > 0 && s.miss === 0 && s.maxCombo >= s.totalNotes).length;
  const expertPlays = scores.filter(s => s.difficulty === "Expert").length;
  const hardPlays = scores.filter(s => s.difficulty === "Hard" || s.difficulty === "Expert").length;
  const perfectTotal = scores.reduce((a, s) => a + s.perfect, 0);
  const bestScore = scores.reduce((m, s) => Math.max(m, s.score), 0);

  const mk = (id: string, title: string, desc: string, icon: Achievement["icon"], tier: Achievement["tier"], value: number, goal: number, unit = ""): Achievement =>
    ({ id, title, desc, icon, tier, unlocked: value >= goal, progress: clamp01(value / goal), goalText: `${Math.min(value, goal)}${unit} / ${goal}${unit}` });

  return [
    mk("first", "First Steps", "Finish your first song", "play", "bronze", scores.length, 1),
    mk("games10", "Warmed Up", "Play 10 games", "game-controller", "bronze", games, 10),
    mk("combo50", "In the Groove", "Reach a 50 combo", "pulse", "bronze", bestCombo, 50),
    mk("vocopulse", "Vocopulse", "Trigger Vocopulse (25 combo)", "flash", "silver", bestCombo, 25),
    mk("combo100", "Unstoppable", "Reach a 100 combo", "trending-up", "silver", bestCombo, 100),
    mk("combo200", "Combo Master", "Reach a 200 combo", "flame", "gold", bestCombo, 200),
    mk("combo500", "Combo Legend", "Reach a 500 combo", "rocket", "gold", bestCombo, 500),
    mk("five", "Perfectionist", "Earn a 5-star run", "star", "gold", bestStars, 5),
    mk("fivex5", "Star Collector", "Earn 5 five-star runs", "star-half", "gold", fiveStarCount, 5),
    mk("acc95", "Sharp Shooter", "Hit 95% accuracy", "locate", "silver", Math.round(bestAcc), 95, "%"),
    mk("acc100", "Immaculate", "Hit a flawless 100%", "diamond", "gold", Math.round(bestAcc), 100, "%"),
    { id: "flawless", title: "Flawless", desc: "Full-combo any chart", icon: "shield-checkmark", tier: "gold", unlocked: hasFullCombo, progress: hasFullCombo ? 1 : 0, goalText: hasFullCombo ? "Done" : "0 / 1" },
    mk("fcx5", "Encore", "Full-combo 5 charts", "ribbon", "gold", fullComboCount, 5),
    mk("hard1", "Stepping Up", "Clear a Hard or Expert chart", "barbell", "silver", hardPlays, 1),
    mk("expert1", "Expert Rising", "Clear an Expert chart", "skull", "gold", expertPlays, 1),
    mk("expert10", "Expert Veteran", "Clear 10 Expert charts", "skull-outline", "gold", expertPlays, 10),
    mk("highroller", "High Roller", "Score 1,000,000 in a run", "cash", "gold", bestScore, 1000000),
    mk("architect", "Chart Architect", "Save a custom chart", "construct", "bronze", customCharts, 1),
    mk("studio", "Chart Studio", "Save 5 custom charts", "hammer", "gold", customCharts, 5),
    mk("prolific", "Prolific Creator", "Save 10 custom charts", "build", "gold", customCharts, 10),
    mk("collector", "Collector", "Import 5 of your own songs", "cloud-download", "silver", imports, 5),
    mk("curator", "Curator", "Import 15 of your own songs", "albums", "gold", imports, 15),
    mk("explorer", "Genre Explorer", "Play 5 different songs", "compass", "silver", uniqueSongs, 5),
    mk("wanderer", "Wanderer", "Play 15 different songs", "map", "gold", uniqueSongs, 15),
    mk("marathon", "Marathon", "Play 25 games", "infinite", "gold", games, 25),
    mk("century", "Centurion", "Play 100 games", "trophy", "gold", games, 100),
    mk("notes", "Note Slayer", "Hit 2,000 notes total", "musical-notes", "silver", totalNotesHit, 2000),
    mk("noteslegend", "Note Legend", "Hit 10,000 notes total", "musical-note", "gold", totalNotesHit, 10000),
    mk("perfectstorm", "Perfect Storm", "Land 1,000 Perfect hits", "flash-outline", "gold", perfectTotal, 1000),
    mk("streak", "Daily Devotee", "Keep a 7-day streak", "calendar", "gold", streak, 7),
    mk("streak30", "Unbroken", "Keep a 30-day streak", "calendar-clear", "gold", streak, 30),
    mk("hoard", "Star Hoarder", "Bank 1,000 Starlites", "sparkles", "gold", points, 1000),
    mk("treasury", "Treasury", "Bank 5,000 Starlites", "wallet", "gold", points, 5000),
  ];
}
