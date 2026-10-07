import { createContext, useContext, useEffect, useRef, useState, createElement } from "react";
import { toast } from "sonner";
import { ACHIEVEMENTS, THEMES, POWERUPS } from "@/data/game";
import { sfx } from "@/lib/sound";
import { submitScore } from "@/lib/api";

const KEY = "ebonics_save_v1";
export const today = () => new Date().toLocaleDateString("en-CA");
const yesterday = () => new Date(Date.now() - 864e5).toLocaleDateString("en-CA");

const fresh = () => ({
  playerId: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random().toString(36).slice(2),
  username: "", starlites: 150, totalEarned: 0, xp: 0, totalCorrect: 0, gamesPlayed: 0, bestCombo: 0,
  streak: { count: 0, last: null }, powerups: { fifty: 2, skip: 2, time: 2, heart: 1 },
  themes: ["obsidian"], theme: "obsidian", achievements: {}, best: {}, modesPlayed: [], learned: [],
  dailyDone: null, sound: true, purchases: 0,
});

const load = () => {
  try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return fresh(); }
};

const Ctx = createContext(null);
export const useGame = () => useContext(Ctx);

export function GameProvider({ children }) {
  const [state, setState] = useState(load);
  const ref = useRef(state);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
    document.documentElement.dataset.theme = state.theme;
    sfx.enabled = state.sound;
  }, [state]);

  const commit = (fn, round = {}) => {
    const d = fn(structuredClone(ref.current));
    const unlocked = ACHIEVEMENTS.filter((a) => !d.achievements[a.id] && a.test(d, round));
    unlocked.forEach((a) => { d.achievements[a.id] = Date.now(); d.starlites += a.reward; d.totalEarned += a.reward; });
    ref.current = d;
    setState(d);
    if (unlocked.length) sfx.achievement();
    unlocked.forEach((a) => toast.success(`Achievement unlocked: ${a.name}`, { description: `+${a.reward} Starlites — ${a.desc}` }));
    return unlocked;
  };

  const finishRound = (r) => {
    const mult = r.mode === "daily_cookout" ? 2 : 1;
    const earned = Math.round(r.score / 25) * mult + (r.perfect ? 25 : 0);
    const isBest = r.score > (ref.current.best[r.mode] || 0);
    const unlocked = commit((d) => {
      d.starlites += earned; d.totalEarned += earned;
      d.xp += Math.round(r.score / 10) + r.correct * 5;
      d.totalCorrect += r.correct; d.gamesPlayed += 1;
      d.bestCombo = Math.max(d.bestCombo, r.bestCombo || 0);
      d.best[r.mode] = Math.max(d.best[r.mode] || 0, r.score);
      if (!d.modesPlayed.includes(r.mode)) d.modesPlayed.push(r.mode);
      if (r.mode === "daily_cookout") d.dailyDone = today();
      (r.learned || []).forEach((t) => { if (!d.learned.includes(t)) d.learned.push(t); });
      return d;
    }, r);
    const s = ref.current;
    if (s.username && r.score > 0) submitScore({ player_id: s.playerId, username: s.username, mode: r.mode, score: r.score }).catch(() => {});
    return { earned, unlocked, isBest };
  };

  const canClaimDaily = state.streak.last !== today();
  const claimDaily = () => {
    if (ref.current.streak.last === today()) return 0;
    const count = ref.current.streak.last === yesterday() ? ref.current.streak.count + 1 : 1;
    const reward = 50 + Math.min(count, 7) * 10;
    commit((d) => {
      d.streak = { count, last: today() }; d.starlites += reward; d.totalEarned += reward;
      if (count % 7 === 0) d.powerups.heart += 1;
      return d;
    });
    sfx.coin();
    return reward;
  };

  const buy = (kind, id) => {
    const item = (kind === "theme" ? THEMES : POWERUPS).find((x) => x.id === id);
    if (ref.current.starlites < item.price) return false;
    commit((d) => {
      d.starlites -= item.price; d.purchases += 1;
      if (kind === "theme") { d.themes.push(id); d.theme = id; } else d.powerups[id] += 1;
      return d;
    });
    sfx.coin();
    return true;
  };

  const spendPowerup = (id) => {
    if (ref.current.powerups[id] < 1) return false;
    commit((d) => { d.powerups[id] -= 1; return d; });
    return true;
  };

  const set = (patch) => commit((d) => ({ ...d, ...patch }));
  const learn = (term) => commit((d) => { if (!d.learned.includes(term)) d.learned.push(term); return d; });

  const value = { state, finishRound, claimDaily, canClaimDaily, buy, spendPowerup, set, learn };
  return createElement(Ctx.Provider, { value }, children);
}
