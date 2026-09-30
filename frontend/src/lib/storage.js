import { useCallback, useEffect, useState } from "react";

// All Hoop keys are prefixed with "treesh_" so the parent Treesh app's
// storage manager (size meter / erase-all) sees and manages them too.
export const KEYS = {
  profile: "treesh_profile", // parent app profile {nickname, birthday, zodiac, avatar}
  accent: "treesh_accent",
  bdayEdits: "treesh_bday_edits",
  favorites: "treesh_hoop_favorites",
  stats: "treesh_hoop_stats",
  settings: "treesh_hoop_settings",
  plans: "treesh_hoop_plans",
  week: "treesh_hoop_week",
  shots: "treesh_hoop_shots",
  body: "treesh_hoop_body",
  lastSearch: "treesh_hoop_last_search",
  savedDrills: "treesh_hoop_saved_drills",
  gameLog: "treesh_hoop_game_log",
};

export const LS = {
  get(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : d;
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      window.dispatchEvent(new CustomEvent("hoop-store", { detail: { key: k } }));
      return true;
    } catch (e) {
      return false;
    }
  },
};

export function useStored(key, def) {
  const [val, setVal] = useState(() => LS.get(key, def));
  useEffect(() => {
    const sync = (e) => {
      const k = e.key !== undefined ? e.key : e.detail?.key;
      if (k === key || k === null) setVal(LS.get(key, def));
    };
    window.addEventListener("storage", sync);
    window.addEventListener("hoop-store", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("hoop-store", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = useCallback(
    (next) => {
      const cur = LS.get(key, def);
      const v = typeof next === "function" ? next(cur) : next;
      LS.set(key, v);
      setVal(v);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  return [val, update];
}

/* ---------- settings ---------- */
export const DEFAULT_SETTINGS = { units: "imperial", hand: "right", level: "intermediate", voice: true, beeps: true };
export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...LS.get(KEYS.settings, {}) };
}

/* ---------- stats ---------- */
export const DEFAULT_STATS = { sessions: 0, minutes: 0, drillsDone: {}, games: 0, shots: 0, bestShot: 0, activeDays: [] };
export function todayStr(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
export function bumpStats(fn) {
  const cur = { ...DEFAULT_STATS, ...LS.get(KEYS.stats, {}) };
  const next = fn({ ...cur, drillsDone: { ...(cur.drillsDone || {}) }, activeDays: [...(cur.activeDays || [])] });
  const t = todayStr();
  if (!next.activeDays.includes(t)) next.activeDays = [...next.activeDays, t].slice(-400);
  LS.set(KEYS.stats, next);
  return next;
}
export function streakOf(days = []) {
  const set = new Set(days);
  let n = 0;
  const d = new Date();
  if (!set.has(todayStr(d))) d.setDate(d.getDate() - 1);
  while (set.has(todayStr(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/* ---------- parent profile helpers ---------- */
export function zodiac(b) {
  if (!b) return "";
  const p = String(b).split("-");
  if (p.length < 3) return "";
  const mo = +p[1], d = +p[2];
  if (!mo || !d || mo < 1 || mo > 12) return "";
  const S = [[1, 19, "Capricorn"], [2, 18, "Aquarius"], [3, 20, "Pisces"], [4, 19, "Aries"], [5, 20, "Taurus"], [6, 20, "Gemini"], [7, 22, "Cancer"], [8, 22, "Leo"], [9, 22, "Virgo"], [10, 22, "Libra"], [11, 21, "Scorpio"], [12, 21, "Sagittarius"], [12, 31, "Capricorn"]];
  for (const [m, day, name] of S) if (mo < m || (mo === m && d <= day)) return name;
  return "Capricorn";
}

/* ---------- files ---------- */
export function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
export function readJSONFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        res(JSON.parse(r.result));
      } catch (e) {
        rej(new Error("That file isn't a valid Hoop save file."));
      }
    };
    r.onerror = () => rej(new Error("Couldn't read that file."));
    r.readAsText(file);
  });
}

export function exportFavorites(favs) {
  downloadJSON({ app: "hoop", by: "treesh", type: "favorites", version: 1, exportedAt: new Date().toISOString(), favorites: favs }, `hoop-courts-${todayStr()}.json`);
}
export function parseFavoritesFile(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.favorites) ? data.favorites : Array.isArray(data?.data?.[KEYS.favorites]) ? data.data[KEYS.favorites] : null;
  if (!list) throw new Error("No saved courts found in that file.");
  const clean = list.filter((c) => c && c.id && typeof c.lat === "number" && typeof c.lon === "number");
  if (!clean.length) throw new Error("No valid courts found in that file.");
  return clean;
}
export function mergeFavorites(cur, incoming) {
  const map = new Map(cur.map((c) => [c.id, c]));
  let added = 0;
  incoming.forEach((c) => {
    if (!map.has(c.id)) added++;
    map.set(c.id, { ...map.get(c.id), ...c });
  });
  return { list: [...map.values()], added };
}

export function exportEverything() {
  const data = {};
  Object.values(KEYS).forEach((k) => {
    if (k.startsWith("treesh_hoop_")) {
      const v = LS.get(k, undefined);
      if (v !== undefined) data[k] = v;
    }
  });
  downloadJSON({ app: "hoop", by: "treesh", type: "backup", version: 1, exportedAt: new Date().toISOString(), data }, `hoop-backup-${todayStr()}.json`);
}
export function importEverything(obj) {
  if (!obj || obj.app !== "hoop" || !obj.data) throw new Error("That isn't a Hoop backup file.");
  let n = 0;
  Object.entries(obj.data).forEach(([k, v]) => {
    if (k.startsWith("treesh_hoop_")) {
      LS.set(k, v);
      n++;
    }
  });
  return n;
}

/* ---------- units ---------- */
export function fmtDistance(m, units = "imperial") {
  if (m == null) return "";
  if (units === "metric") return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
  const mi = m / 1609.344;
  return mi < 0.1 ? `${Math.round(m * 3.28084)} ft` : `${mi.toFixed(mi < 10 ? 1 : 0)} mi`;
}
export function fmtClock(s) {
  s = Math.max(0, Math.ceil(s));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
