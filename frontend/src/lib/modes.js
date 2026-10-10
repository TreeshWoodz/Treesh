import { Sparkles, CalendarDays, Swords, Grid3x3, Layers, GraduationCap } from "lucide-react";

export const MODES = [
  { id: "sonoko", to: "/play/sonoko", name: "Sonoko", sub: "Sudoku × cards hybrid", icon: Sparkles, from: "#FFB300", to2: "#FF6A00" },
  { id: "daily", to: "/play/daily", name: "Daily", sub: "One grid. Everyone.", icon: CalendarDays, from: "#34C759", to2: "#0E7A4F" },
  { id: "versus", to: "/play/versus", name: "Versus", sub: "Duel bot Ivy", icon: Swords, from: "#FF3B30", to2: "#9F1239" },
  { id: "sudoku", to: "/play/sudoku", name: "Sudoku", sub: "Classic 9×9 logic", icon: Grid3x3, from: "#3B82F6", to2: "#1E3A8A" },
  { id: "uno", to: "/play/uno", name: "Uno", sub: "Cards vs 1–3 bots", icon: Layers, from: "#EC4899", to2: "#6D28D9" },
  { id: "tutorial", to: "/play/tutorial", name: "Learn", sub: "60-second tutorial", icon: GraduationCap, from: "#64748B", to2: "#1E293B" },
];

export const modeById = (id) => MODES.find((m) => m.id === id) || MODES[0];
