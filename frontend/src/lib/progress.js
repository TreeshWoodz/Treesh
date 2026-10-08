import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ACHIEVEMENTS, TIERS, levelInfo } from "./achievements";
import { SKINS, THEMES } from "./cosmetics";
import { sfx } from "./sound";

export const KEY = "treesh_sonoku_v1";
const LEGACY_KEY = "sonoko_profile_v1";
const EVT = "sonoko-profile";
export const STAR_TIERS = { bronze: 25, silver: 50, gold: 100, platinum: 500 };

const defaultProfile = () => ({
  name: "",
  xp: 0,
  sound: true,
  skin: "classic",
  theme: "arcade",
  tutorialDone: false,
  lastDailyResult: null,
  starlites: 0,
  starLog: [],
  unlocked: {},
  stats: {
    sonokoPlayed: 0, sonokoWins: 0, sonokoBest: 0, maxCombo: 0, sonokoCalls: 0, colorMatches: 0,
    flawless: 0, cardsPlayed: 0, sudokuPlayed: 0, sudokuWins: 0, sudokuHardWins: 0, sudokuFast: 0,
    sudokuBest: {}, unoPlayed: 0, unoWins: 0, uno3Wins: 0, dailyWins: 0, dailyStreak: 0,
    bestDailyStreak: 0, lastDaily: null, modesPlayed: {}, versusPlayed: 0, versusWins: 0,
    versusHardWins: 0, tutorialDone: 0, dailyShares: 0,
  },
});

export function loadProfile() {
  const d = defaultProfile();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY));
    if (raw) return { ...d, ...raw, stats: { ...d.stats, ...raw.stats } };
  } catch {
    /* corrupted storage */
  }
  return d;
}

function summarize(p) {
  const s = p.stats;
  const tiers = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  ACHIEVEMENTS.forEach((a) => p.unlocked[a.id] && tiers[a.tier]++);
  const wins = { sonoko: s.sonokoWins, daily: s.dailyWins, sudoku: s.sudokuWins, uno: s.unoWins, versus: s.versusWins };
  return {
    v: 1, level: levelInfo(p.xp).level, xp: p.xp, starlites: p.starlites, wins,
    winsTotal: s.sonokoWins + s.sudokuWins + s.unoWins + s.versusWins,
    played: s.sonokoPlayed + s.sudokuPlayed + s.unoPlayed + s.versusPlayed,
    best: s.sonokoBest, streak: s.dailyStreak, unlocked: Object.keys(p.unlocked).length,
    total: ACHIEVEMENTS.length, tiers, updatedAt: Date.now(),
  };
}

function markTreeshDirty() {
  try {
    const m = JSON.parse(localStorage.getItem("treesh_sb_meta"));
    if (m && m.uid && !m.pending) localStorage.setItem("treesh_sb_meta", JSON.stringify({ ...m, pending: true }));
  } catch {
    /* parent app not present */
  }
}

export function saveProfile(p) {
  p.summary = summarize(p);
  localStorage.setItem(KEY, JSON.stringify(p));
  localStorage.removeItem(LEGACY_KEY);
  markTreeshDirty();
  window.dispatchEvent(new Event(EVT));
}

export function updateProfile(fn) {
  const p = loadProfile();
  fn(p);
  saveProfile(p);
}

export function commitProgress(mutator) {
  const p = loadProfile();
  const before = levelInfo(p.xp).level;
  const xp0 = p.xp;
  mutator(p.stats, p);
  const after = levelInfo(p.xp).level;
  const earned = [];
  const played = Math.min(60, Math.round((p.xp - xp0) / 15));
  if (played > 0) earned.push([played, "Game played"]);
  if (after > before) earned.push([(after - before) * 20, `Reached level ${after}`]);
  if (after > before) {
    const fresh = [...SKINS.map((x) => ["card skin", x]), ...THEMES.map((x) => ["board theme", x])].filter(([, x]) => x.level > before && x.level <= after);
    setTimeout(() => {
      sfx.unlock();
      toast.success(`Level up! You're now level ${after}`, {
        description: fresh.length ? `Unlocked ${fresh.map(([k, x]) => `${x.name} ${k}`).join(", ")} — equip it in the Locker` : "Keep playing to unlock new looks",
      });
    }, 500);
  }
  const newly = [];
  for (const ach of ACHIEVEMENTS) {
    if (!p.unlocked[ach.id] && ach.get(p.stats, p) >= ach.target) {
      p.unlocked[ach.id] = Date.now();
      newly.push(ach);
      earned.push([STAR_TIERS[ach.tier], `${ach.name} trophy`]);
    }
  }
  const total = earned.reduce((t, [n]) => t + n, 0);
  if (total) {
    p.starlites = (p.starlites || 0) + total;
    p.starLog = [...earned.map(([a, r]) => ({ t: Date.now(), a, r })), ...(p.starLog || [])].slice(0, 50);
    setTimeout(() => toast(`+${total} Starlites`, { description: earned.map(([, r]) => r).join(" · ") }), 300);
  }
  saveProfile(p);
  newly.forEach((ach, i) =>
    setTimeout(() => {
      sfx.unlock();
      toast.success(`Achievement unlocked: ${ach.name}`, {
        description: `${TIERS[ach.tier].label} trophy · +${STAR_TIERS[ach.tier]} Starlites · ${ach.desc}`,
      });
    }, 900 + i * 1100)
  );
  return newly;
}

export function useProfile() {
  const [p, setP] = useState(loadProfile);
  useEffect(() => {
    const h = () => setP(loadProfile());
    const st = (e) => e.key === KEY && h();
    window.addEventListener(EVT, h);
    window.addEventListener("storage", st);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", st);
    };
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
