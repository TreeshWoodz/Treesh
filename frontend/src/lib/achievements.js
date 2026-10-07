import {
  Sparkles, Layers, Gem, Flame, Zap, Megaphone, Volume2, Palette, ShieldCheck, Star, Grid3x3,
  Brain, Timer, Swords, Users, Trophy, CalendarCheck, CalendarHeart, Compass, Medal, Crown, Rocket,
} from "lucide-react";

export const TIERS = {
  bronze: { label: "Bronze", color: "#D08A4E" },
  silver: { label: "Silver", color: "#CBD5E1" },
  gold: { label: "Gold", color: "#F59E0B" },
  platinum: { label: "Platinum", color: "#7DD3FC" },
};

const a = (id, name, desc, tier, icon, get, target) => ({ id, name, desc, tier, icon, get, target });

const BASE = [
  a("first_sonoko", "First Sonoko", "Win your first Sonoko game", "bronze", Sparkles, (s) => s.sonokoWins, 1),
  a("sonoko_10", "Hybrid Hero", "Win 10 Sonoko games", "silver", Layers, (s) => s.sonokoWins, 10),
  a("sonoko_50", "Grid Legend", "Win 50 Sonoko games", "gold", Gem, (s) => s.sonokoWins, 50),
  a("combo_8", "On Fire", "Reach an 8-play combo in Sonoko", "silver", Flame, (s) => s.maxCombo, 8),
  a("combo_15", "Unstoppable", "Reach a 15-play combo in Sonoko", "gold", Zap, (s) => s.maxCombo, 15),
  a("first_call", "SONOKO!", "Empty your hand after calling SONOKO!", "bronze", Megaphone, (s) => s.sonokoCalls, 1),
  a("call_25", "Loudmouth", "Land 25 SONOKO! calls", "gold", Volume2, (s) => s.sonokoCalls, 25),
  a("painter", "Color Theory", "Make 50 color-matched placements", "silver", Palette, (s) => s.colorMatches, 50),
  a("flawless", "Flawless", "Win a Sonoko game without losing a heart", "gold", ShieldCheck, (s) => s.flawless, 1),
  a("score_8k", "High Roller", "Score 8,000+ in a Sonoko win", "silver", Star, (s) => s.sonokoBest, 8000),
  a("score_15k", "Jackpot", "Score 15,000+ in a Sonoko win", "gold", Rocket, (s) => s.sonokoBest, 15000),
  a("sudoku_first", "Number Cruncher", "Solve your first Classic Sudoku", "bronze", Grid3x3, (s) => s.sudokuWins, 1),
  a("sudoku_10", "Logic Machine", "Solve 10 Classic Sudokus", "silver", Brain, (s) => s.sudokuWins, 10),
  a("sudoku_hard", "Big Brain", "Solve a Hard Sudoku", "gold", Brain, (s) => s.sudokuHardWins, 1),
  a("sudoku_speed", "Speed Solver", "Solve an Easy Sudoku in under 5 minutes", "silver", Timer, (s) => s.sudokuFast, 1),
  a("uno_first", "Card Slinger", "Win your first Classic Uno match", "bronze", Swords, (s) => s.unoWins, 1),
  a("uno_crowd", "Crowd Control", "Beat 3 bots in one Uno match", "silver", Users, (s) => s.uno3Wins, 1),
  a("uno_10", "Table King", "Win 10 Classic Uno matches", "gold", Trophy, (s) => s.unoWins, 10),
  a("daily_first", "Daily Ritual", "Complete a Daily Challenge", "bronze", CalendarCheck, (s) => s.dailyWins, 1),
  a("daily_7", "Week Warrior", "Reach a 7-day Daily streak", "gold", CalendarHeart, (s) => s.bestDailyStreak, 7),
  a("card_shark", "Card Shark", "Play 500 cards across all modes", "silver", Layers, (s) => s.cardsPlayed, 500),
  a("explorer", "Explorer", "Play every game mode", "bronze", Compass, (s) => Object.keys(s.modesPlayed || {}).length, 4),
  a("level_10", "Veteran", "Reach player level 10", "gold", Medal, (s, p) => levelInfo(p.xp).level, 10),
];

export const ACHIEVEMENTS = [
  ...BASE,
  a("grandmaster", "Sonoko Grandmaster", "Unlock every other achievement", "platinum", Crown,
    (s, p) => BASE.filter((x) => p.unlocked[x.id]).length, BASE.length),
];

export function levelInfo(xp = 0) {
  const level = Math.floor(Math.sqrt(xp / 150)) + 1;
  const base = (level - 1) ** 2 * 150;
  const next = level ** 2 * 150;
  return { level, base, next, pct: Math.round(((xp - base) / (next - base)) * 100) };
}
