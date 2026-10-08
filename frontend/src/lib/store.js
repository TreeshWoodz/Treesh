import { createContext, useContext, useEffect, useRef, useState, createElement } from "react";
import { toast } from "sonner";
import { ACHIEVEMENTS, THEMES, POWERUPS, MODES_BY_ID } from "@/data/game";
import { sfx } from "@/lib/sound";
import { submitScore } from "@/lib/api";

// Treesh parent-app keys (same origin on treesh.app). Wallet is shared: treesh_stars.points.
const KEY = "ebonics_save_v1";
const STAR_KEY = "ebonics_starlites"; // lifetime Starlites earned in Ebonics (parent Arcade stats)
const PROFILE_KEY = "treesh_profile";
const WALLET_KEY = "treesh_stars";
const ACCENT_KEY = "treesh_accent";
export const today = () => new Date().toLocaleDateString("en-CA");
const yesterday = () => new Date(Date.now() - 864e5).toLocaleDateString("en-CA");
const readJSON = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const WALLET_DEFAULT = { points: 0, lastDaily: null, streak: 0, newSongs: {}, minToday: 0, min30Date: null, secAccum: 0, totalMin: 0, games: 0, beats: 0, log: [] };
const readWallet = () => ({ ...WALLET_DEFAULT, ...(readJSON(WALLET_KEY, {}) || {}) });

export const readAccent = () => {
  const v = localStorage.getItem(ACCENT_KEY);
  if (!v) return null;
  let h; try { h = JSON.parse(v); } catch { h = v; }
  return typeof h === "string" && /^#?[0-9a-f]{6}$/i.test(h) ? (h[0] === "#" ? h : "#" + h).toLowerCase() : null;
};
const onColor = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.35 ? "#0B0914" : "#FFFFFF";
};

// Fresh read-modify-write on the shared Treesh wallet so the main app's balance is never clobbered
const applyToWallet = (delta, entries) => {
  const w = readWallet();
  w.points = Math.max(0, (w.points || 0) + delta);
  w.log = [...entries.map((e) => ({ ...e, r: `Ebonics · ${e.r}` })), ...(w.log || [])].slice(0, 50);
  localStorage.setItem(WALLET_KEY, JSON.stringify(w));
  return w.points;
};

export const zodiac = (b) => {
  const p = String(b || "").split("-"); if (p.length < 3) return "";
  const mo = +p[1], d = +p[2]; if (!mo || !d || mo > 12) return "";
  const S = [[1, 19, "Capricorn"], [2, 18, "Aquarius"], [3, 20, "Pisces"], [4, 19, "Aries"], [5, 20, "Taurus"], [6, 20, "Gemini"], [7, 22, "Cancer"], [8, 22, "Leo"], [9, 22, "Virgo"], [10, 22, "Libra"], [11, 21, "Scorpio"], [12, 21, "Sagittarius"]];
  return d <= S[mo - 1][1] ? S[mo - 1][2] : S[mo % 12][2];
};
export const playerName = (p) => (p && (p.username || p.nickname)) || "";

const fresh = () => ({
  playerId: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random().toString(36).slice(2),
  starlites: 0, totalEarned: 0, xp: 0, totalCorrect: 0, gamesPlayed: 0, bestCombo: 0,
  streak: { count: 0, last: null }, powerups: { fifty: 2, skip: 2, time: 2, heart: 1 },
  themes: ["obsidian"], theme: "obsidian", achievements: {}, best: {}, modesPlayed: [], learned: [],
  dailyDone: null, sound: true, purchases: 0, starLog: [], walletLinked: false, useAccent: true,
});

const load = () => {
  const saved = readJSON(KEY, null);
  const s = { ...fresh(), ...(saved || {}) };
  if (!s.walletLinked) {
    // one-time: move the old Ebonics-only balance (or a welcome bonus) into the shared Treesh wallet
    const carry = saved ? Math.max(0, saved.starlites || 0) : 150;
    const e = { t: Date.now(), a: carry, r: saved ? "Balance moved to Treesh wallet" : "Welcome bonus" };
    s.starlites = carry ? applyToWallet(carry, [e]) : readWallet().points;
    if (carry) s.starLog = [e, ...s.starLog].slice(0, 50);
    s.walletLinked = true;
    localStorage.setItem(KEY, JSON.stringify(s));
  } else s.starlites = readWallet().points;
  return s;
};

const earn = (d, a, r) => {
  const e = { t: Date.now(), a, r };
  d.starlites += a;
  if (a > 0) d.totalEarned += a;
  d.starLog = [e, ...(d.starLog || [])].slice(0, 50);
  (d._pending = d._pending || []).push(e);
};

const Ctx = createContext(null);
export const useGame = () => useContext(Ctx);

export function GameProvider({ children }) {
  const [state, setState] = useState(load);
  const [profile, setProfile] = useState(() => readJSON(PROFILE_KEY, null));
  const [accent, setAccent] = useState(readAccent);
  const ref = useRef(state);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
    localStorage.setItem(STAR_KEY, String(state.totalEarned));
    document.documentElement.dataset.theme = state.theme;
    sfx.enabled = state.sound;
  }, [state]);

  useEffect(() => {
    const root = document.documentElement.style;
    if (state.useAccent && accent) { root.setProperty("--eb-gold", accent); root.setProperty("--eb-on-gold", onColor(accent)); }
    else { root.removeProperty("--eb-gold"); root.removeProperty("--eb-on-gold"); }
  }, [accent, state.useAccent]);

  // Live-sync with the Treesh parent app (same-origin iframe / other tabs)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === PROFILE_KEY) setProfile(readJSON(PROFILE_KEY, null));
      if (e.key === ACCENT_KEY) setAccent(readAccent());
      if (e.key === WALLET_KEY) {
        const next = { ...ref.current, starlites: readWallet().points };
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
    const pending = d._pending || [];
    delete d._pending;
    if (pending.length) d.starlites = applyToWallet(pending.reduce((s, e) => s + e.a, 0), [...pending].reverse());
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
    if (readWallet().points < item.price) return false;
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

  const value = { state, profile, accent, saveProfile, finishRound, claimDaily, canClaimDaily, buy, spendPowerup, set, learn };
  return createElement(Ctx.Provider, { value }, children);
}
