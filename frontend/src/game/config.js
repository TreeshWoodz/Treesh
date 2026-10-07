import { Disc3, Crown, Radio, Gem, Map, Timer, Target, CalendarDays, Infinity as InfinityIcon, Hammer, Shuffle, PlusCircle, Zap } from "lucide-react";
import { AfroPick, Djembe, Sneaker } from "../components/CultureIcons";

export const TILES = [
  { id: "vinyl", name: "Vinyl Record", Icon: Disc3, from: "#F472B6", to: "#9D174D", glow: "rgba(236,72,153,.55)" },
  { id: "afro_pick", name: "Afro Pick", Icon: AfroPick, from: "#A78BFA", to: "#4C1D95", glow: "rgba(139,92,246,.55)" },
  { id: "boombox", name: "Boombox", Icon: Radio, from: "#34D399", to: "#065F46", glow: "rgba(16,185,129,.55)" },
  { id: "sneaker", name: "Fresh Kicks", Icon: Sneaker, from: "#22D3EE", to: "#1E3A8A", glow: "rgba(6,182,212,.55)" },
  { id: "djembe", name: "Djembe Drum", Icon: Djembe, from: "#F87171", to: "#7F1D1D", glow: "rgba(239,68,68,.55)" },
  { id: "crown", name: "Golden Crown", Icon: Crown, from: "#FDE047", to: "#A16207", glow: "rgba(234,179,8,.6)" },
  { id: "kente", name: "Kente Gem", Icon: Gem, from: "#FDBA74", to: "#9A3412", glow: "rgba(249,115,22,.55)" },
];

export const MODES = [
  { id: "classic", name: "Classic Levels", tag: "Level Map", desc: "30 handcrafted levels across 3 chapters. Hit targets, collect pieces, clear the Kente.", Icon: Map, color: "#C87D32" },
  { id: "timed", name: "Timed Blitz", tag: "Speed", desc: "60 seconds on the clock. Match fast, chain combos, stack points.", Icon: Timer, color: "#EF4444" },
  { id: "moves", name: "Moves Challenge", tag: "Strategy", desc: "Only 15 moves. Every swap counts. Make it legendary.", Icon: Target, color: "#06B6D4" },
  { id: "daily", name: "Daily Challenge", tag: "2x Starlites", desc: "One fresh board for everybody, every day. Double Starlite payout.", Icon: CalendarDays, color: "#FFC800" },
  { id: "zen", name: "Endless Zen", tag: "Relax", desc: "No timer. No limits. Just vibes and smooth cascades.", Icon: InfinityIcon, color: "#10B981" },
];

export const CHAPTERS = [
  { from: 1, to: 10, name: "The Block Party", sub: "Chapter 1" },
  { from: 11, to: 20, name: "Harlem Renaissance", sub: "Chapter 2" },
  { from: 21, to: 30, name: "Afrofuture", sub: "Chapter 3" },
];

const PATTERNS = ["center", "bottom", "cross", "diamond", "border", "checker"];

export const LEVELS = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const types = n <= 6 ? 5 : n <= 18 ? 6 : 7;
  const lvl = { n, types, moves: 18 + Math.floor(n / 4), target: 1500 + n * 250 };
  if (n % 3 === 2) lvl.collect = [{ type: n % types, count: 12 + n }];
  if (n >= 20 && n % 3 === 1) lvl.collect = [{ type: n % types, count: 20 }, { type: (n + 2) % types, count: 20 }];
  if (n % 3 === 0) {
    lvl.kente = PATTERNS[(n / 3 - 1) % PATTERNS.length];
    lvl.moves += 5;
    lvl.target = Math.round(lvl.target * 0.6);
  }
  return lvl;
});

export const todayStr = () => new Date().toISOString().slice(0, 10);
export const dailySeed = () => Number(todayStr().replace(/-/g, ""));

export function buildConfig(mode, level) {
  if (mode === "classic") {
    const L = LEVELS[level - 1];
    return L ? { mode, level, title: `Level ${level}`, ...L } : null;
  }
  if (mode === "timed") return { mode, title: "Timed Blitz", types: 6, time: 60 };
  if (mode === "moves") return { mode, title: "Moves Challenge", types: 6, moves: 15 };
  if (mode === "zen") return { mode, title: "Endless Zen", types: 5 };
  if (mode === "daily") {
    const seed = dailySeed();
    const cfg = { mode, title: "Daily Challenge", types: 6, moves: 22, target: 5000, seed };
    if (seed % 2) cfg.kente = PATTERNS[seed % PATTERNS.length];
    else cfg.collect = [{ type: seed % 6, count: 22 }];
    return cfg;
  }
  return null;
}

export const starsFor = (cfg, score, win) => {
  if (!cfg.target || !win) return 0;
  return score >= cfg.target * 2 ? 3 : score >= cfg.target * 1.5 ? 2 : 1;
};

export function rewardFor(cfg, ended, stars) {
  const s = ended.score;
  if (cfg.mode === "classic") return ended.win ? 25 + stars * 15 + (ended.movesLeft || 0) * 3 : 5;
  if (cfg.mode === "daily") return 2 * (Math.floor(s / 150) + (ended.win ? 50 : 0));
  if (cfg.mode === "zen") return Math.floor(s / 300);
  return Math.floor(s / 150);
}

export const POWERUPS = [
  { id: "hammer", name: "Bronze Hammer", cost: 150, desc: "Smash any single tile. Specials go off too.", Icon: Hammer },
  { id: "shuffle", name: "Rhythm Shuffle", cost: 100, desc: "Remix the whole board for fresh matches.", Icon: Shuffle },
  { id: "extra_moves", name: "Extra Time", cost: 200, desc: "+5 moves, or +10 seconds in Timed Blitz.", Icon: PlusCircle },
  { id: "color_blast", name: "Starlite Blast", cost: 300, desc: "Turn 3 random tiles into Blitz Bombs.", Icon: Zap },
];

export const THEMES = [
  { id: "bronze", name: "Bronze Classic", cost: 0, desc: "The original. Warm, polished, timeless.",
    board: { bg: "linear-gradient(160deg,#2a1a0e,#120b07)", cellA: "rgba(200,125,50,.10)", cellB: "rgba(200,125,50,.04)", frame: "#C87D32" } },
  { id: "kente", name: "Golden Kente", cost: 600, desc: "Woven gold, green and red. Royalty on every row.",
    board: { bg: "repeating-linear-gradient(90deg,#3b2a05 0 14px,#0b3b2a 14px 20px,#3b2a05 20px 34px,#4a0f0f 34px 40px,#0a0a0a 40px 46px)", cellA: "rgba(10,7,13,.55)", cellB: "rgba(10,7,13,.7)", frame: "#FFC800" } },
  { id: "harlem", name: "Harlem Nights", cost: 800, desc: "Jazz clubs, neon marquees, midnight blue.",
    board: { bg: "linear-gradient(160deg,#0b1030,#1a0b2e)", cellA: "rgba(236,72,153,.10)", cellB: "rgba(59,130,246,.08)", frame: "#EC4899" } },
  { id: "pan_african", name: "Pan-African Pride", cost: 750, desc: "Red for the blood, black for the people, green for the land.",
    board: { bg: "linear-gradient(180deg,#5b0f0f 0 33%,#0a0a0a 33% 66%,#064e2b 66%)", cellA: "rgba(0,0,0,.35)", cellB: "rgba(0,0,0,.5)", frame: "#10B981" } },
  { id: "soul_train", name: "Soul Train", cost: 900, desc: "70s groove. Orange sunsets and purple velvet.",
    board: { bg: "linear-gradient(160deg,#7c2d12,#4c1d95)", cellA: "rgba(255,255,255,.08)", cellB: "rgba(255,255,255,.03)", frame: "#F97316" } },
  { id: "afrofuture", name: "Neo Afrofuturism", cost: 1000, desc: "Vibranium-grade circuitry. The future is ours.",
    board: { bg: "radial-gradient(circle at 50% 0%,#3b0764,#05010a 70%)", cellA: "rgba(168,85,247,.12)", cellB: "rgba(6,182,212,.07)", frame: "#A855F7" } },
];

const maxLevel = (p) => Math.max(0, ...Object.entries(p.levelStars).filter(([, s]) => s > 0).map(([n]) => Number(n)));
const threeStars = (p) => Object.values(p.levelStars).filter((s) => s >= 3).length;
const bestAny = (p) => Math.max(0, ...Object.values(p.best));

export const ACHIEVEMENTS = [
  { id: "first_blitz", name: "First Blitz", desc: "Play your first game", reward: 50, goal: 1, val: (p) => p.stats.games },
  { id: "regular", name: "Regular at the Spot", desc: "Play 25 games", reward: 150, goal: 25, val: (p) => p.stats.games },
  { id: "combo_king", name: "Combo King", desc: "Chain a 5x combo", reward: 150, goal: 5, val: (p) => p.stats.maxCombo },
  { id: "disco", name: "Starlite Maker", desc: "Create a Starlite Disco (match 5)", reward: 100, goal: 1, val: (p) => p.stats.discos },
  { id: "bomb_squad", name: "Bomb Squad", desc: "Create 10 Blitz Bombs", reward: 150, goal: 10, val: (p) => p.stats.bombs },
  { id: "stripes", name: "Earned Your Stripes", desc: "Create 25 striped tiles", reward: 150, goal: 25, val: (p) => p.stats.striped },
  { id: "big_score", name: "Big Numbers", desc: "Score 10,000 in a single game", reward: 200, goal: 10000, val: bestAny },
  { id: "level5", name: "Block Party Starter", desc: "Complete Level 5", reward: 100, goal: 5, val: maxLevel },
  { id: "level15", name: "Renaissance Soul", desc: "Complete Level 15", reward: 250, goal: 15, val: maxLevel },
  { id: "level30", name: "Afrofuture Legend", desc: "Complete all 30 levels", reward: 1000, goal: 30, val: maxLevel },
  { id: "triple", name: "Triple Threat", desc: "Earn 3 stars on 10 levels", reward: 300, goal: 10, val: threeStars },
  { id: "daily3", name: "Daily Devotee", desc: "Play 3 Daily Challenges", reward: 200, goal: 3, val: (p) => p.stats.dailyDays.length },
  { id: "speed", name: "Speed Demon", desc: "Score 8,000 in Timed Blitz", reward: 200, goal: 8000, val: (p) => p.best.timed || 0 },
  { id: "strategist", name: "Chess Not Checkers", desc: "Score 6,000 in Moves Challenge", reward: 200, goal: 6000, val: (p) => p.best.moves || 0 },
  { id: "zen", name: "Zen Master", desc: "Score 25,000 in Endless Zen", reward: 200, goal: 25000, val: (p) => p.best.zen || 0 },
  { id: "titan", name: "Tile Titan", desc: "Clear 5,000 tiles", reward: 300, goal: 5000, val: (p) => p.stats.tiles },
  { id: "power", name: "Power Player", desc: "Use 10 power-ups", reward: 150, goal: 10, val: (p) => p.stats.powerups },
  { id: "drip", name: "Drip Collector", desc: "Own 3 board themes", reward: 200, goal: 3, val: (p) => p.ownedThemes.length },
  { id: "cloud", name: "Cloud Crew", desc: "Save your progress to the cloud", reward: 100, goal: 1, val: (p) => (p.saveCode ? 1 : 0) },
  { id: "mogul", name: "Starlite Mogul", desc: "Earn 5,000 Starlites total", reward: 400, goal: 5000, val: (p) => p.stats.earned },
];

export const LEADER_METRIC = { classic: "Total Stars", timed: "Score", moves: "Score", daily: "Today's Score", zen: "Score" };
