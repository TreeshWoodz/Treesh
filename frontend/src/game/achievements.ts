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

  const mk = (id: string, title: string, desc: string, icon: Achievement["icon"], tier: Achievement["tier"], value: number, goal: number, unit = ""): Achievement =>
    ({ id, title, desc, icon, tier, unlocked: value >= goal, progress: clamp01(value / goal), goalText: `${Math.min(value, goal)}${unit} / ${goal}${unit}` });

  return [
    mk("first", "First Steps", "Finish your first song", "play", "bronze", scores.length, 1),
    mk("combo50", "In the Groove", "Reach a 50 combo", "pulse", "bronze", bestCombo, 50),
    mk("combo200", "Combo Master", "Reach a 200 combo", "flame", "gold", bestCombo, 200),
    mk("vocopulse", "Vocopulse", "Trigger Vocopulse (25 combo)", "flash", "silver", bestCombo, 25),
    mk("five", "Perfectionist", "Earn a 5-star run", "star", "gold", bestStars, 5),
    mk("acc95", "Sharp Shooter", "Hit 95% accuracy", "locate", "silver", Math.round(bestAcc), 95, "%"),
    { id: "flawless", title: "Flawless", desc: "Full-combo any chart", icon: "shield-checkmark", tier: "gold", unlocked: hasFullCombo, progress: hasFullCombo ? 1 : 0, goalText: hasFullCombo ? "Done" : "0 / 1" },
    mk("architect", "Chart Architect", "Save a custom chart", "construct", "bronze", customCharts, 1),
    mk("studio", "Chart Studio", "Save 5 custom charts", "hammer", "gold", customCharts, 5),
    mk("collector", "Collector", "Import 5 of your own songs", "cloud-download", "silver", imports, 5),
    mk("explorer", "Genre Explorer", "Play 5 different songs", "compass", "silver", uniqueSongs, 5),
    mk("marathon", "Marathon", "Play 25 games", "infinite", "gold", games, 25),
    mk("notes", "Note Slayer", "Hit 2,000 notes total", "musical-notes", "silver", totalNotesHit, 2000),
    mk("streak", "Daily Devotee", "Keep a 7-day streak", "calendar", "gold", streak, 7),
    mk("hoard", "Star Hoarder", "Bank 1,000 Starlites", "sparkles", "gold", points, 1000),
  ];
}
