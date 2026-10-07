import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ACHIEVEMENTS, TIERS } from "./achievements";
import { sfx } from "./sound";

const KEY = "sonoko_profile_v1";
const EVT = "sonoko-profile";

const defaultProfile = () => ({
  name: "",
  xp: 0,
  sound: true,
  unlocked: {},
  stats: {
    sonokoPlayed: 0, sonokoWins: 0, sonokoBest: 0, maxCombo: 0, sonokoCalls: 0, colorMatches: 0,
    flawless: 0, cardsPlayed: 0, sudokuPlayed: 0, sudokuWins: 0, sudokuHardWins: 0, sudokuFast: 0,
    sudokuBest: {}, unoPlayed: 0, unoWins: 0, uno3Wins: 0, dailyWins: 0, dailyStreak: 0,
    bestDailyStreak: 0, lastDaily: null, modesPlayed: {},
  },
});

export function loadProfile() {
  const d = defaultProfile();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw) return { ...d, ...raw, stats: { ...d.stats, ...raw.stats } };
  } catch {
    /* corrupted storage */
  }
  return d;
}

export function saveProfile(p) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event(EVT));
}

export function updateProfile(fn) {
  const p = loadProfile();
  fn(p);
  saveProfile(p);
}

export function commitProgress(mutator) {
  const p = loadProfile();
  mutator(p.stats, p);
  const newly = [];
  for (const ach of ACHIEVEMENTS) {
    if (!p.unlocked[ach.id] && ach.get(p.stats, p) >= ach.target) {
      p.unlocked[ach.id] = Date.now();
      newly.push(ach);
    }
  }
  saveProfile(p);
  newly.forEach((ach, i) =>
    setTimeout(() => {
      sfx.unlock();
      toast.success(`Achievement unlocked: ${ach.name}`, {
        description: `${TIERS[ach.tier].label} trophy · ${ach.desc}`,
      });
    }, 900 + i * 1100)
  );
  return newly;
}

export function useProfile() {
  const [p, setP] = useState(loadProfile);
  useEffect(() => {
    const h = () => setP(loadProfile());
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  return p;
}

const dateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const todayStr = () => dateStr(new Date());

export const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateStr(d);
};

export const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
