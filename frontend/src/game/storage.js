/* Chainz persistence: localStorage (settings/progress) + IndexedDB (word cache + run history) */
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
      return true;
    } catch (e) {
      return false;
    }
  },
  del(k) {
    try { localStorage.removeItem(k); } catch (e) { /* noop */ }
  },
};

export const SAVE_KEY = "chainz_save_v2";

const prefersReduced = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
};

export const defaultSettings = () => ({
  sfx: true,
  music: false,
  volume: 80,
  haptics: true,
  particles: true,
  shake: true,
  reducedMotion: prefersReduced(),
  systemKeyboard: false,
  timerStyle: "ring",
  countdown: "numeric",
  accentSource: "treesh",
  customAccent: "#22d3ee",
  showTrail: true,
  onlineWords: true,
});

export const defaultSave = () => ({
  v: 2,
  created: Date.now(),
  settings: defaultSettings(),
  lastMode: "classic",
  lastDifficulty: "normal",
  guestName: "",
  xp: 0,
  inventory: { freeze: 2, hint: 3, lifeline: 1, skip: 2, shield: 1, booster: 0 },
  owned: ["kb_glass", "snd_soft", "arena_aurora", "fx_sparks", "title_rookie", "arena_classic"],
  equipped: { keyboard: "kb_glass", sound: "snd_soft", arena: "arena_aurora", effect: "fx_sparks", title: "title_rookie" },
  boosterArmed: false,
  trophies: {}, // id -> unlockedAt
  bests: {}, // mode -> { score, chain, links, difficulty, at }
  stats: {
    runs: 0, links: 0, score: 0, bestChain: 0, bestScore: 0, fast: 0, goldWords: 0,
    longestWord: 0, longestWordText: "", modesPlayed: [], mistakes: 0, powerupsUsed: 0,
    purchases: 0, perfectRuns: 0, heartsRestored: 0, starlitesEarned: 0, nightOwl: 0, earlyBird: 0,
    insaneChain: 0, modeLinks: {}, playSeconds: 0,
  },
  daily: { lastDate: null, streak: 0, bestStreak: 0, completed: 0, results: {} },
  dailyGift: null,
  earnDay: { date: null, amount: 0, runs: 0 },
});

function deepMerge(base, over) {
  if (!over || typeof over !== "object") return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  Object.keys(over).forEach((k) => {
    const b = base ? base[k] : undefined;
    const o = over[k];
    if (b && typeof b === "object" && !Array.isArray(b) && o && typeof o === "object" && !Array.isArray(o)) out[k] = deepMerge(b, o);
    else out[k] = o;
  });
  return out;
}

export function loadSave() {
  const raw = LS.get(SAVE_KEY, null);
  let s = deepMerge(defaultSave(), raw || {});
  if (!raw) {
    // migrate legacy Chainz stats (difficultyScores per difficulty)
    const legacy = LS.get("difficultyScores", null);
    if (legacy && typeof legacy === "object") {
      let hs = 0, ls = 0, all = 0;
      Object.values(legacy).forEach((d) => {
        if (!d) return;
        hs = Math.max(hs, d.highScore || 0);
        ls = Math.max(ls, d.longestStreak || 0);
        all += d.allTimeScore || 0;
      });
      s.stats.bestChain = ls;
      s.stats.score = all;
      if (hs) s.bests.classic = { score: hs, chain: ls, links: ls, difficulty: "normal", at: Date.now(), legacy: true };
    }
  }
  ['kb_glass', 'snd_soft', 'arena_aurora', 'fx_sparks', 'title_rookie', 'arena_classic'].forEach((id) => { if (!s.owned.includes(id)) s.owned.push(id); });
  return s;
}

export function writeSave(s) {
  return LS.set(SAVE_KEY, s);
}

/* ---------------- IndexedDB ---------------- */
const DB_NAME = "chainz_db";
const DB_VER = 1;
let _db = null;
function openDB() {
  if (_db) return _db;
  _db = new Promise((res, rej) => {
    let rq;
    try { rq = indexedDB.open(DB_NAME, DB_VER); } catch (e) { rej(e); return; }
    rq.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("assoc")) db.createObjectStore("assoc", { keyPath: "k" });
      if (!db.objectStoreNames.contains("runs")) db.createObjectStore("runs", { keyPath: "id" });
    };
    rq.onsuccess = (e) => res(e.target.result);
    rq.onerror = (e) => rej(e.target.error || new Error("IndexedDB open failed"));
  });
  _db.catch(() => { _db = null; });
  return _db;
}
async function store(name, mode) {
  const db = await openDB();
  return db.transaction(name, mode).objectStore(name);
}
const wrap = (rq) => new Promise((res, rej) => { rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); });

export const idb = {
  async get(name, key) { try { return (await wrap((await store(name, "readonly")).get(key))) || null; } catch (e) { return null; } },
  async put(name, val) { try { await wrap((await store(name, "readwrite")).put(val)); return true; } catch (e) { return false; } },
  async all(name) { try { return (await wrap((await store(name, "readonly")).getAll())) || []; } catch (e) { return []; } },
  async del(name, key) { try { await wrap((await store(name, "readwrite")).delete(key)); return true; } catch (e) { return false; } },
  async clear(name) { try { await wrap((await store(name, "readwrite")).clear()); return true; } catch (e) { return false; } },
};

export async function saveRun(run) {
  await idb.put("runs", run);
  const all = await idb.all("runs");
  if (all.length > 60) {
    all.sort((a, b) => a.id - b.id);
    for (const r of all.slice(0, all.length - 60)) await idb.del("runs", r.id);
  }
}
export async function getRuns() {
  const all = await idb.all("runs");
  return all.sort((a, b) => b.id - a.id);
}

export const dayKey = (d) => {
  d = d || new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};
