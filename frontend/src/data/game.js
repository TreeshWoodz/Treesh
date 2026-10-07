export const BASE = "/games/ebonics";

export const MODES = [
  { id: "say_less", title: "Say Less", badge: "Classic", blurb: "Decode the meaning of real AAVE phrases before the clock runs out.", lives: 3, timer: 15, total: 10, kind: "say_less", icon: "MessageCircle", tiers: [600, 1300, 2200, 3000] },
  { id: "finish_phrase", title: "Finish the Phrase", badge: "Fill the blank", blurb: "Complete iconic culture expressions. Your auntie would be proud.", lives: 3, timer: 15, total: 10, kind: "finish", icon: "PenLine", tiers: [600, 1300, 2200, 3000] },
  { id: "real_or_cap", title: "Real or Cap?", badge: "True / False", blurb: "Grammar, history, origins. Is it real — or is it cap?", lives: 3, timer: 10, total: 12, kind: "real_or_cap", icon: "Scale", tiers: [700, 1500, 2600, 3500] },
  { id: "flip_it", title: "Flip It", badge: "AI Judge", blurb: "Flip English into AAVE (and back). Claude AI scores your flow.", total: 5, kind: "flip", icon: "Repeat", tiers: [200, 300, 400, 470] },
  { id: "speed_run", title: "60s Speed Run", badge: "Blitz", blurb: "60 seconds. No lives. Every streak stacks your multiplier.", global: 60, kind: "mixed", icon: "Zap", tiers: [1000, 2500, 4500, 7000] },
  { id: "daily_cookout", title: "Daily Cookout", badge: "2x Starlites", blurb: "5 questions, same for everyone, once a day. Double Starlites.", lives: 5, timer: 15, total: 5, kind: "daily", icon: "Flame", tiers: [300, 600, 1000, 1400], daily: true },
  { id: "ai_remix", title: "AI Remix", badge: "Endless", blurb: "Never-ending questions freshly cooked by AI. How long can you last?", lives: 3, timer: 20, kind: "ai", icon: "Sparkles", tiers: [800, 2000, 4000, 7000] },
];
export const MODES_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m]));

export const TIERS = [
  { name: "Bronze", color: "#CD7F32" },
  { name: "Silver", color: "#C0C7D1" },
  { name: "Gold", color: "#FFC72C" },
  { name: "Platinum", color: "#7DF9FF" },
];

export const RANKS = [
  { name: "Lil Cousin", xp: 0 },
  { name: "Cuzzo", xp: 300 },
  { name: "Day One", xp: 900 },
  { name: "Unc / Auntie", xp: 2000 },
  { name: "OG", xp: 4000 },
  { name: "Living Legend", xp: 8000 },
];

export const THEMES = [
  { id: "obsidian", name: "Obsidian Gold", price: 0, swatch: ["#0B0914", "#FFC72C", "#8B5CF6", "#EC4899"] },
  { id: "cookout", name: "Backyard Cookout", price: 200, swatch: ["#120706", "#FFB547", "#FF5A36", "#FFD166"] },
  { id: "harlem", name: "Harlem Nights", price: 250, swatch: ["#07070F", "#E8C872", "#3B82F6", "#F472B6"] },
  { id: "kente", name: "Kente Royale", price: 300, swatch: ["#0E0B05", "#F5B700", "#D7261E", "#18A957"] },
  { id: "bayou", name: "Bayou Second Line", price: 350, swatch: ["#04110E", "#F4D35E", "#10B981", "#A78BFA"] },
];

export const POWERUPS = [
  { id: "fifty", name: "50/50", desc: "Remove two wrong answers", price: 60, icon: "Divide" },
  { id: "skip", name: "Skip", desc: "Skip a question, no penalty", price: 40, icon: "SkipForward" },
  { id: "time", name: "+10 Seconds", desc: "Add 10 seconds to the clock", price: 50, icon: "Timer" },
  { id: "heart", name: "Extra Heart", desc: "Get one life back", price: 80, icon: "Heart" },
];

const allModes = MODES.map((m) => m.id);
export const ACHIEVEMENTS = [
  { id: "first_word", name: "First Word", desc: "Finish your first round", reward: 20, test: (s) => s.gamesPlayed >= 1 },
  { id: "on_fire", name: "On Fire", desc: "Hit a 5x combo", reward: 30, test: (s) => s.bestCombo >= 5 },
  { id: "untouchable", name: "Untouchable", desc: "Hit a 10x combo", reward: 75, test: (s) => s.bestCombo >= 10 },
  { id: "flawless", name: "Left No Crumbs", desc: "Finish a round with zero misses", reward: 60, test: (s, r) => !!r.perfect },
  { id: "cap_detector", name: "Cap Detector", desc: "Get 10+ right in one Real or Cap round", reward: 50, test: (s, r) => r.mode === "real_or_cap" && r.correct >= 10 },
  { id: "wordsmith", name: "Wordsmith", desc: "Score 90+ on a Flip It answer", reward: 60, test: (s, r) => r.flipBest >= 90 },
  { id: "speed_demon", name: "Speed Demon", desc: "20 correct in one Speed Run", reward: 80, test: (s, r) => r.mode === "speed_run" && r.correct >= 20 },
  { id: "cookout_invite", name: "Invited to the Cookout", desc: "Complete a Daily Cookout", reward: 40, test: (s, r) => r.mode === "daily_cookout" },
  { id: "ai_rider", name: "Remix Rider", desc: "Get 15 right in AI Remix", reward: 70, test: (s, r) => r.mode === "ai_remix" && r.correct >= 15 },
  { id: "mode_hopper", name: "Mode Hopper", desc: "Play every game mode", reward: 100, test: (s) => allModes.every((m) => s.modesPlayed.includes(m)) },
  { id: "streak_3", name: "Three-Peat", desc: "3-day login streak", reward: 50, test: (s) => s.streak.count >= 3 },
  { id: "streak_7", name: "Week Strong", desc: "7-day login streak", reward: 150, test: (s) => s.streak.count >= 7 },
  { id: "century", name: "Century Club", desc: "100 correct answers all-time", reward: 100, test: (s) => s.totalCorrect >= 100 },
  { id: "legend", name: "Certified Legend", desc: "500 correct answers all-time", reward: 300, test: (s) => s.totalCorrect >= 500 },
  { id: "bag", name: "Secured the Bag", desc: "Earn 1,000 Starlites total", reward: 100, test: (s) => s.totalEarned >= 1000 },
  { id: "big_spender", name: "Big Spender", desc: "Buy something in the shop", reward: 20, test: (s) => s.purchases >= 1 },
  { id: "drip_lord", name: "Drip Lord", desc: "Own 3 themes", reward: 80, test: (s) => s.themes.length >= 3 },
  { id: "scholar", name: "Scholar", desc: "Learn 25 Lexicon terms", reward: 80, test: (s) => s.learned.length >= 25 },
  { id: "og_rank", name: "Certified OG", desc: "Reach OG rank", reward: 200, test: (s) => s.xp >= 4000 },
];

export const rankFor = (xp) => {
  let i = 0;
  RANKS.forEach((r, k) => { if (xp >= r.xp) i = k; });
  const next = RANKS[i + 1];
  const pct = next ? ((xp - RANKS[i].xp) / (next.xp - RANKS[i].xp)) * 100 : 100;
  return { rank: RANKS[i], next, pct };
};

export const tierFor = (mode, best) => {
  const m = MODES_BY_ID[mode];
  let t = -1;
  m.tiers.forEach((v, i) => { if (best >= v) t = i; });
  return t;
};
