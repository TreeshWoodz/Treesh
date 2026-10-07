import { createContext, useContext, useEffect, useRef, useState, createElement } from "react";
import { toast } from "sonner";
import { ACHIEVEMENTS, THEMES, POWERUPS, MODES_BY_ID } from "@/data/game";
import { sfx } from "@/lib/sound";
import { submitScore } from "@/lib/api";

// Treesh parent-app keys (same origin on treesh.app): profile is shared, Starlites live in the game's own key.
const KEY = "ebonics_save_v1";
const STAR_KEY = "ebonics_starlites";
const PROFILE_KEY = "treesh_profile";
const TREESH_STARS_KEY = "treesh_stars";
export const today = () => new Date().toLocaleDateString("en-CA");
const yesterday = () => new Date(Date.now() - 864e5).toLocaleDateString("en-CA");
const readJSON = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const readTreeshStars = () => (readJSON(TREESH_STARS_KEY, {}) || {}).points || 0;

export const zodiac = (b) => {
  const p = String(b || "").split("-"); if (p.length < 3) return "";
  const mo = +p[1], d = +p[2]; if (!mo || !d || mo > 12) return "";
  const S = [[1, 19, "Capricorn"], [2, 18, "Aquarius"], [3, 20, "Pisces"], [4, 19, "Aries"], [5, 20, "Taurus"], [6, 20, "Gemini"], [7, 22, "Cancer"], [8, 22, "Leo"], [9, 22, "Virgo"], [10, 22, "Libra"], [11, 21, "Scorpio"], [12, 21, "Sagittarius"]];
  return d <= S[mo - 1][1] ? S[mo - 1][2] : S[mo % 12][2];
};
export const playerName = (p) => (p && (p.username || p.nickname)) || "";

const fresh = () => ({
  playerId: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random().toString(36).slice(2),
  starlites: 150, totalEarned: 0, xp: 0, totalCorrect: 0, gamesPlayed: 0, bestCombo: 0,
  streak: { count: 0, last: null }, powerups: { fifty: 2, skip: 2, time: 2, heart: 1 },
  themes: ["obsidian"], theme: "obsidian", achievements: {}, best: {}, modesPlayed: [], learned: [],
  dailyDone: null, sound: true, purchases: 0, starLog: [],
});

const load = () => {
  const s = { ...fresh(), ...readJSON(KEY, {}) };
  const raw = localStorage.getItem(STAR_KEY);
  if (raw != null && !isNaN(parseInt(raw, 10))) s.starlites = Math.max(0, parseInt(raw, 10));
  return s;
};

const earn = (d, a, r) => {
  d.starlites += a;
  if (a > 0) d.totalEarned += a;
  d.starLog = [{ t: Date.now(), a, r }, ...(d.starLog || [])].slice(0, 50);
};

const Ctx = createContext(null);
export const useGame = () => useContext(Ctx);

export function GameProvider({ children }) {
  const [state, setState] = useState(load);
  const [profile, setProfile] = useState(() => readJSON(PROFILE_KEY, null));
  const [treeshStars, setTreeshStars] = useState(readTreeshStars);
  const ref = useRef(state);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
    localStorage.setItem(STAR_KEY, String(state.starlites));
    document.documentElement.dataset.theme = state.theme;
    sfx.enabled = state.sound;
  }, [state]);

  // Live-sync with the Treesh parent app (same-origin iframe / other tabs)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === PROFILE_KEY) setProfile(readJSON(PROFILE_KEY, null));
      if (e.key === TREESH_STARS_KEY) setTreeshStars(readTreeshStars());
      if (e.key === STAR_KEY && e.newValue != null && !isNaN(parseInt(e.newValue, 10))) {
        const next = { ...ref.current, starlites: Math.max(0, parseInt(e.newValue, 10)) };
        ref.current = next; setState(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const saveProfile = (patch) => {
    const base = readJSON(PROFILE_KEY, null) || {};
    const next = { ...base, ...patch };
    if (patch.birthday !== undefined) next.zodiac = zodiac(patch.birthday);
    if (!next.nickname) next.nickname = "Treesh Fan";
    if (!next.joined) next.joined = Date.now();
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setProfile(next);
    const name = playerName(next).slice(0, 20);
    if (name !== playerName(base).slice(0, 20) && name.length >= 2) Object.entries(ref.current.best).forEach(([mode, score]) => score > 0 && submitScore({ player_id: ref.current.playerId, username: name, mode, score }).catch(() => {}));
    return next;
  };

  const commit = (fn, round = {}) => {
    const d = fn(structuredClone(ref.current));
    const unlocked = ACHIEVEMENTS.filter((a) => !d.achievements[a.id] && a.test(d, round));
    unlocked.forEach((a) => { d.achievements[a.id] = Date.now(); earn(d, a.reward, `Achievement: ${a.name}`); });
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
      if (earned) earn(d, earned, `${MODES_BY_ID[r.mode]?.title || "Ebonics"} round`);
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
    const name = playerName(profile).slice(0, 20);
    if (name.length >= 2 && r.score > 0) submitScore({ player_id: s.playerId, username: name, mode: r.mode, score: r.score }).catch(() => {});
    return { earned, unlocked, isBest };
  };

  const canClaimDaily = state.streak.last !== today();
  const claimDaily = () => {
    if (ref.current.streak.last === today()) return 0;
    const count = ref.current.streak.last === yesterday() ? ref.current.streak.count + 1 : 1;
    const reward = 50 + Math.min(count, 7) * 10;
    commit((d) => {
      d.streak = { count, last: today() }; earn(d, reward, `Daily drop · day ${count}`);
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
      earn(d, -item.price, `Bought ${item.name}`); d.purchases += 1;
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

  const value = { state, profile, treeshStars, saveProfile, finishRound, claimDaily, canClaimDaily, buy, spendPowerup, set, learn };
  return createElement(Ctx.Provider, { value }, children);
}
