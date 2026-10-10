import { Disc3, Crown, Radio, Gem, Map, Timer, Target, CalendarDays, Infinity as InfinityIcon, Hammer, Shuffle, PlusCircle, Zap, PaintBucket } from "lucide-react";
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
  { id: "classic", name: "Classic Levels", tag: "Level Map", desc: "30 handcrafted levels across 3 chapters. Hit targets, collect pieces, clear the Kente.", Icon: Map, color: "var(--ac)" },
  { id: "timed", name: "Timed Blitz", tag: "Speed", desc: "60 seconds on the clock. Match fast, chain combos, stack points.", Icon: Timer, color: "#EF4444" },
  { id: "moves", name: "Moves Challenge", tag: "Strategy", desc: "Only 15 moves. Every swap counts. Make it legendary.", Icon: Target, color: "#06B6D4" },
  { id: "daily", name: "Daily Challenge", tag: "2x Starlites", desc: "One fresh board for everybody, every day. Double Starlite payout.", Icon: CalendarDays, color: "#FFC800" },
  { id: "colorpop", name: "Color Pop", tag: "New", desc: "Grow your color from a random start tile. Paint the whole board one color before moves run out.", Icon: PaintBucket, color: "#EC4899" },
  { id: "zen", name: "Endless Zen", tag: "Relax", desc: "No timer. No limits. Just vibes and smooth cascades.", Icon: InfinityIcon, color: "#10B981" },
];

const PATTERNS = ["center", "bottom", "cross", "diamond", "border", "checker"];
const CRATE_PATS = ["base", "mid", "pillars", "corners", "ring", "dots"];
const STATIC_PATS = ["corners", "dots", "mid", "pillars"];
const MAKE_KINDS = ["x", "cross", "bomb", "striped", "nova"];
const r50 = (v) => Math.round(v / 50) * 50;

export const MECHS = {
  kente: { name: "Kente Squares", desc: "Clear the tiles sitting on golden Kente cells.", apply: (l, i) => { l.kente = PATTERNS[i % 6]; l.moves += 4; return true; } },
  collect: { name: "Collectors", desc: "Gather the tiles shown in your goals.", apply: (l, i, ch) => { l.collect = [{ type: l.n % l.types, count: 14 + i + Math.min(ch, 12) }]; if (i >= 5) l.collect.push({ type: (l.n + 2) % l.types, count: 10 + i }); l.moves += 2; return true; } },
  locks: { name: "Chains", desc: "Chained tiles can't move. Match them to break the chain.", apply: (l, i, ch) => { l.locks = Math.min(20, 6 + i + Math.floor(ch / 3)); l.moves += 3; return true; } },
  crates: { name: "Vinyl Crates", desc: "Crates block the board. Match next to them or blast them to break them.", apply: (l, i) => { l.crates = { pattern: CRATE_PATS[i % 6], hp: i >= 5 ? 2 : 1 }; l.moves += 5; return true; } },
  records: { name: "Gold Records", desc: "Drop the gold records all the way to the bottom edge.", apply: (l, i) => { l.records = 2 + Math.floor(i / 3); l.moves += 4; return true; } },
  flip: { name: "Upside Down", desc: "Gravity is flipped. Tiles fall UP.", apply: (l) => { l.gravity = "up"; } },
  kente2: { name: "Double Dutch", desc: "Double-woven Kente needs two clears per cell.", apply: (l, i) => { l.kente = PATTERNS[i % 6]; l.kenteHp = 2; l.moves += 7; return true; } },
  countdown: { name: "Countdown Tiles", desc: "Clear numbered tiles before they tick down to zero!", apply: (l, i) => { l.countdown = { n: 1 + Math.floor(i / 4), start: 14 - Math.floor(i / 3) }; l.moves += 2; } },
  diagonal: { name: "Diagonal Dojo", desc: "Only diagonal swaps are allowed.", apply: (l) => { l.diagonalOnly = true; l.moves += 3; } },
  static: { name: "Static", desc: "Static spreads every move you don't break any. Clear it all.", apply: (l, i) => { l.static = { pattern: STATIC_PATS[i % 4] }; l.moves += 5; return true; } },
  side: { name: "Side Step", desc: "Gravity pulls sideways.", apply: (l, i) => { l.gravity = i % 2 ? "left" : "right"; } },
  time: { name: "Time Attack", desc: "No move limit. Beat the goals before the clock runs out.", apply: (l, i) => { l.time = 80 - i * 2; } },
  surge: { name: "Power Surge", desc: "The board starts loaded with power-ups, but targets are higher.", apply: (l, i) => { l.surge = 3 + Math.floor(i / 3); l.target = r50(l.target * 1.25); } },
  fog: { name: "Midnight Fog", desc: "Clear tiles under the fog to lift it off the board.", apply: (l, i) => { l.kente = PATTERNS[(i + 2) % 6]; l.layerStyle = "fog"; l.moves += 4; return true; } },
  make: { name: "Make It Rain", desc: "Create the power-ups shown in your goals.", apply: (l, i) => { const k = MAKE_KINDS[i % 5]; l.make = { [k]: k === "nova" ? 1 + Math.floor(i / 5) : 2 + Math.floor(i / 4) }; l.moves += 3; return true; } },
};

const CHAPTER_DEFS = [
  ["The Block Party", []], ["Harlem Renaissance", ["kente"]], ["Afrofuture", ["collect"]], ["Motown Lockdown", ["locks"]],
  ["Vinyl Crates", ["crates"]], ["Gold Record Drop", ["records"]], ["Upside Down Uptown", ["flip"]], ["Double Dutch", ["kente2"]],
  ["Countdown Cypher", ["countdown"]], ["Diagonal Dojo", ["diagonal"]], ["Static on the Line", ["static"]], ["Side Step Soul", ["side"]],
  ["Time Attack Tuesday", ["time"]], ["Power Surge", ["surge"]], ["Midnight Fog", ["fog"]], ["Make It Rain", ["make"]],
  ["Locked Crates", ["crates", "locks"]], ["Records Rising", ["records", "flip"]], ["Kente Countdown", ["kente", "countdown"]],
  ["Static Crates", ["static", "crates"]], ["Diagonal Drop", ["diagonal", "records"]], ["Fog Collectors", ["fog", "collect"]],
  ["Chain Reaction Clock", ["time", "locks"]], ["Sideways Kente", ["side", "kente2"]], ["Countdown Combos", ["make", "countdown"]],
  ["Surge vs Static", ["surge", "static"]], ["Foggy Flip", ["fog", "crates", "flip"]], ["Juneteenth Jubilee", ["records", "locks", "kente"]],
  ["Vibranium Vault", ["static", "countdown", "diagonal"]], ["Legends Only", ["crates", "records", "fog", "surge"]],
];

export const TOTAL_LEVELS = CHAPTER_DEFS.length * 10;

export const CHAPTERS = CHAPTER_DEFS.map(([name, mechs], k) => ({
  from: k * 10 + 1, to: k * 10 + 10, name, sub: `Chapter ${k + 1}`, mechs, desc: mechs.map((m) => MECHS[m].name).join(" + ") || "Score, collect and Kente basics",
}));

function buildLevel(n) {
  const ch = Math.floor((n - 1) / 10), i = (n - 1) % 10;
  const [name, mechs] = CHAPTER_DEFS[ch];
  const types = n <= 6 ? 5 : i === 9 && ch >= 5 ? 7 : 6;
  const l = { n, ch, types, moves: 18 + Math.floor(i / 3), target: 3000 + Math.min(n, 80) * 100 };
  if (ch === 0) {
    if (n % 3 === 2) l.collect = [{ type: n % types, count: 12 + n }];
    if (n % 3 === 0) { l.kente = PATTERNS[(n / 3 - 1) % 6]; l.moves += 5; l.target = r50(l.target * 0.6); }
    return l;
  }
  let objective = false;
  mechs.forEach((m) => { objective = MECHS[m].apply(l, i, ch) || objective; });
  if (i % 3 === 1 && !l.collect && !l.make) l.collect = [{ type: n % types, count: 12 + i + Math.min(ch, 10) }];
  l.target = r50(l.target * (objective ? 0.5 : 0.75));
  if (i === 9) l.target = r50(l.target * 1.15);
  if (l.time) delete l.moves;
  if (i === 0) l.intro = { title: name, items: mechs.map((m) => MECHS[m]) };
  return l;
}

export const LEVELS = Array.from({ length: TOTAL_LEVELS }, (_, k) => buildLevel(k + 1));

export const COLORPOP_LEVELS = [
  { level: 1, name: "Easy", size: 10, colors: 5, moves: 20 },
  { level: 2, name: "Medium", size: 12, colors: 6, moves: 24 },
  { level: 3, name: "Hard", size: 14, colors: 6, moves: 25 },
];

const IMG = "https://static.prod-images.emergentagent.com/jobs/c0cfcd65-3656-40e7-94e0-5ae508a9836d/images/";
export const ART = {
  menu: `${IMG}1f9d1fb08a39de097b0cca4b97fcbdbec66f6432d0b272a76bd5b3ea6e2a224d.jpeg`,
  mural: `${IMG}227cfe14e049a10cb91a6c0c93ecaadf11308e3264ec2525e06b50e4c9b86336.jpeg`,
  afrofuture: `${IMG}c39e19e63d7dd498f7fbf5b8aa23fe40d2879b731e03bba80f929fbc8b5e4880.jpeg`,
  harlem: `${IMG}14a2da015fc21b220e0a2f9fb9e9a99246599ff906fd6c116da8bc893e7cbdc4.jpeg`,
  blockparty: `${IMG}8468398933a9c96e8d2974710f69ff95732ac0e9b1f66b9059125d1bc105c509.jpeg`,
};
const MODE_ART = { timed: "blockparty", moves: "harlem", daily: "afrofuture", zen: "harlem", colorpop: "mural" };
export const artFor = (cfg) =>
  cfg.mode === "classic" ? (cfg.level <= 10 ? "blockparty" : cfg.level <= 20 ? "harlem" : "afrofuture") : MODE_ART[cfg.mode];

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
  if (mode === "colorpop") {
    const d = COLORPOP_LEVELS[level - 1];
    return d ? { mode, level, title: `Color Pop: ${d.name}`, ...d } : null;
  }
  if (mode === "daily") {
    const seed = dailySeed();
    const cfg = { mode, title: "Daily Challenge", types: 6, moves: 22, target: 8000, seed };
    if (seed % 2) cfg.kente = PATTERNS[seed % PATTERNS.length];
    else cfg.collect = [{ type: seed % 6, count: 22 }];
    return cfg;
  }
  return null;
}

export const starsFor = (cfg, score, win, movesLeft = 0) => {
  if (cfg.mode === "colorpop") return win ? (movesLeft >= 4 ? 3 : movesLeft >= 2 ? 2 : 1) : 0;
  if (!cfg.target || !win) return 0;
  return score >= cfg.target * 2 ? 3 : score >= cfg.target * 1.5 ? 2 : 1;
};

export function rewardFor(cfg, ended, stars) {
  const s = ended.score;
  if (cfg.mode === "classic") return ended.win ? 25 + stars * 15 + (ended.movesLeft || 0) * 3 : 5;
  if (cfg.mode === "daily") return 2 * (Math.floor(s / 150) + (ended.win ? 50 : 0));
  if (cfg.mode === "zen") return Math.floor(s / 300);
  if (cfg.mode === "colorpop") return ended.win ? 20 + cfg.level * 20 + (ended.movesLeft || 0) * 5 : 5;
  return Math.floor(s / 150);
}

export const POWERUPS = [
  { id: "hammer", name: "Bronze Hammer", cost: 150, desc: "Smash any single tile. Specials go off too.", Icon: Hammer },
  { id: "shuffle", name: "Rhythm Shuffle", cost: 100, desc: "Remix the whole board for fresh matches.", Icon: Shuffle },
  { id: "extra_moves", name: "Extra Time", cost: 200, desc: "+5 moves, or +10 seconds in Timed Blitz.", Icon: PlusCircle },
  { id: "color_blast", name: "Starlite Blast", cost: 300, desc: "Turn 3 random tiles into Blitz Bombs.", Icon: Zap },
];

export const THEMES = [
  { id: "bronze", name: "Signature", cost: 0, desc: "Matches your Treesh accent color. Bronze by default.",
    board: { bg: "linear-gradient(160deg,rgba(var(--ac-rgb),.22),#0d0810 75%)", cellA: "rgba(var(--ac-rgb),.12)", cellB: "rgba(var(--ac-rgb),.05)", frame: "var(--ac)" } },
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
  { id: "level30", name: "Afrofuture Legend", desc: "Complete Level 30", reward: 500, goal: 30, val: maxLevel },
  { id: "level100", name: "Centurion", desc: "Complete Level 100", reward: 1000, goal: 100, val: maxLevel },
  { id: "level200", name: "Bicentennial Boss", desc: "Complete Level 200", reward: 1500, goal: 200, val: maxLevel },
  { id: "level300", name: "Legend of Bronze", desc: "Complete all 300 levels", reward: 3000, goal: 300, val: maxLevel },
  { id: "triple", name: "Triple Threat", desc: "Earn 3 stars on 10 levels", reward: 300, goal: 10, val: threeStars },
  { id: "daily3", name: "Daily Devotee", desc: "Play 3 Daily Challenges", reward: 200, goal: 3, val: (p) => p.stats.dailyDays.length },
  { id: "speed", name: "Speed Demon", desc: "Score 8,000 in Timed Blitz", reward: 200, goal: 8000, val: (p) => p.best.timed || 0 },
  { id: "strategist", name: "Chess Not Checkers", desc: "Score 6,000 in Moves Challenge", reward: 200, goal: 6000, val: (p) => p.best.moves || 0 },
  { id: "zen", name: "Zen Master", desc: "Score 25,000 in Endless Zen", reward: 200, goal: 25000, val: (p) => p.best.zen || 0 },
  { id: "titan", name: "Tile Titan", desc: "Clear 5,000 tiles", reward: 300, goal: 5000, val: (p) => p.stats.tiles },
  { id: "power", name: "Power Player", desc: "Use 10 power-ups", reward: 150, goal: 10, val: (p) => p.stats.powerups },
  { id: "drip", name: "Drip Collector", desc: "Own 3 board themes", reward: 200, goal: 3, val: (p) => p.ownedThemes.length },
  { id: "cloud", name: "Cloud Crew", desc: "Save your progress to the cloud", reward: 100, goal: 1, val: (p) => (p.saveCode ? 1 : 0) },
  { id: "diagonal", name: "Diagonal Don", desc: "Make 25 diagonal moves", reward: 150, goal: 25, val: (p) => p.stats.diagonals },
  { id: "xblaster", name: "X Marks the Spot", desc: "Create 10 X-Blasters (2x2 squares)", reward: 150, goal: 10, val: (p) => p.stats.xs },
  { id: "crown_cross", name: "Cross Culture", desc: "Create 5 Crown Crosses (plus shape)", reward: 200, goal: 5, val: (p) => p.stats.crosses },
  { id: "supernova", name: "Supernova", desc: "Create a Supernova (2x3 block)", reward: 250, goal: 1, val: (p) => p.stats.novas },
  { id: "color_pop", name: "Paint the Town", desc: "Win a Color Pop round", reward: 150, goal: 1, val: (p) => p.stats.cpWins },
  { id: "color_master", name: "Master Painter", desc: "Win Color Pop on Hard", reward: 300, goal: 1, val: (p) => p.stats.cpHardWins },
  { id: "mogul", name: "Starlite Mogul", desc: "Earn 5,000 Starlites total", reward: 400, goal: 5000, val: (p) => p.stats.earned },
];

export const LEADER_METRIC = { classic: "Total Stars", timed: "Score", moves: "Score", daily: "Today's Score", colorpop: "Score", zen: "Score" };
