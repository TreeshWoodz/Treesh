/* Chainz static game data: modes, difficulties, shop catalogue, trophies, reward rules */

export const DIFFICULTIES = {
  easy: { id: "easy", name: "Easy", time: 20, mult: 1, star: 1, minLen: 2, hintsOk: true, color: "#2ee59d" },
  normal: { id: "normal", name: "Normal", time: 14, mult: 1.25, star: 1.2, minLen: 3, hintsOk: true, color: "#60a5fa" },
  hard: { id: "hard", name: "Hard", time: 10, mult: 1.5, star: 1.5, minLen: 3, hintsOk: true, color: "#ffcc66" },
  insane: { id: "insane", name: "Insane", time: 6, mult: 2, star: 2, minLen: 4, hintsOk: false, color: "#ff4d6d" },
};
export const DIFF_ORDER = ["easy", "normal", "hard", "insane"];

/* rules: timer = 'turn' (per word) | 'global' | 'none'; lives; failOnWrong; validator */
export const MODES = [
  {
    id: "classic", name: "Classic", icon: "Link2", tag: "The original",
    blurb: "Type a word linked to the prompt. Your word becomes the next link. Beat the clock every turn.",
    rules: ["Per-word timer shrinks as your chain grows", "Wrong answers break your combo and cost 1s", "Run ends when the timer hits zero"],
    timer: "turn", lives: 0, validator: "assoc", scoreMult: 1, starMult: 1, difficulty: true,
  },
  {
    id: "blitz", name: "Blitz", icon: "Zap", tag: "60 seconds",
    blurb: "One clock, sixty seconds. Chain as many words as you can. Links add time, misses steal it.",
    rules: ["60s global clock", "+1.5s per link, +3s on combos", "-2s per wrong answer"],
    timer: "global", globalTime: 60, lives: 0, validator: "assoc", scoreMult: 1, starMult: 1, difficulty: true,
  },
  {
    id: "survival", name: "Survival", icon: "Heart", tag: "3 hearts",
    blurb: "Three hearts. Every miss or timeout costs one. Every 10-link streak restores a heart.",
    rules: ["Wrong answer or timeout = lose a heart", "10-streak restores a heart (max 3)", "Timer gets faster each link"],
    timer: "turn", lives: 3, validator: "assoc", scoreMult: 1.1, starMult: 1.1, difficulty: true,
  },
  {
    id: "sudden", name: "Sudden Death", icon: "Skull", tag: "No mistakes",
    blurb: "One wrong move and it’s over. Huge multipliers for the brave.",
    rules: ["Any wrong answer ends the run", "Timeouts end the run", "1.5x score and Starlites"],
    timer: "turn", lives: 0, failOnWrong: true, validator: "assoc", scoreMult: 1.5, starMult: 1.5, difficulty: true,
  },
  {
    id: "zen", name: "Zen", icon: "Leaf", tag: "No timer",
    blurb: "No clock, no pressure. Wander the word web at your own pace and end whenever you like.",
    rules: ["No timer, no game over", "Tap End run when you’re done", "Half score and Starlites"],
    timer: "none", lives: 0, validator: "assoc", scoreMult: 0.5, starMult: 0.5, difficulty: false, fixedDifficulty: "easy",
  },
  {
    id: "daily", name: "Daily Chain", icon: "CalendarDays", tag: "New every day",
    blurb: "Everyone gets the same starting word today. 90 seconds, Normal speed, one scored attempt.",
    rules: ["Same seed for every player today", "90s global clock", "First attempt each day earns the daily reward"],
    timer: "global", globalTime: 90, lives: 0, validator: "assoc", scoreMult: 1.2, starMult: 1, difficulty: false, fixedDifficulty: "normal",
  },
  {
    id: "letter", name: "Letter Link", icon: "CaseSensitive", tag: "Last letter",
    blurb: "Your word must start with the last letter of the prompt. Any real word counts.",
    rules: ["Start with the prompt’s last letter", "Any real English word", "Hard needs 4+ letters, Insane 5+"],
    timer: "turn", lives: 3, validator: "letter", scoreMult: 1, starMult: 1, difficulty: true,
  },
  {
    id: "compound", name: "Compound", icon: "Puzzle", tag: "Word + Word",
    blurb: "Glue words together. Fire + Place = Fireplace. Your half becomes the next prompt.",
    rules: ["Answer must form a compound with the prompt", "Either side works: Ball ← Fire or Fire → Place", "3 hearts"],
    timer: "turn", lives: 3, validator: "compound", scoreMult: 1.2, starMult: 1.2, difficulty: true,
  },
];
export const MODE_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m]));

/* ---------------- Starlite economy ---------------- */
export const STARLITE_RULES = {
  perLink: 1,
  comboEvery: 5,
  comboBonus: 5,
  speedBonus: 2,
  speedThreshold: 2.5, // seconds
  goldWord: 10,
  goldChance: 0.08,
  completion: 10, // run with >= 5 links
  personalBest: 15,
  firstRunOfDay: 10,
  dailyBase: 30,
  dailyStreakStep: 5, // +5 per consecutive day, capped
  dailyStreakCap: 50,
  softCapPerDay: 600, // after this chainz run earnings are halved (trophies not affected)
  tierReward: { bronze: 15, silver: 30, gold: 60, platinum: 120 },
};

/* ---------------- Shop ---------------- */
export const POWERUPS = [
  { id: "freeze", name: "Time Freeze", icon: "Snowflake", price: 40, desc: "Stops the clock for 8 seconds.", color: "#7dd3fc" },
  { id: "hint", name: "Hint", icon: "Lightbulb", price: 30, desc: "Reveals the first letters of a valid answer.", color: "#ffd36b" },
  { id: "lifeline", name: "Lifeline", icon: "ListChecks", price: 50, desc: "Pick from 3 choices. One is right.", color: "#c4b5fd" },
  { id: "skip", name: "Skip", icon: "SkipForward", price: 35, desc: "Swap the prompt without breaking your streak.", color: "#86efac" },
  { id: "shield", name: "Shield", icon: "Shield", price: 60, desc: "Absorbs your next mistake or timeout.", color: "#93c5fd" },
  { id: "booster", name: "Starlite Booster", icon: "Sparkles", price: 120, desc: "Double Starlites earned in your next run.", color: "#ffd36b", preRun: true },
];
export const POWERUP_BY_ID = Object.fromEntries(POWERUPS.map((p) => [p.id, p]));
export const BUNDLES = [
  { id: "bundle_starter", name: "Starter Crate", price: 150, desc: "2 Freeze, 2 Hint, 2 Skip", give: { freeze: 2, hint: 2, skip: 2 } },
  { id: "bundle_pro", name: "Pro Crate", price: 320, desc: "3 Lifeline, 2 Shield, 1 Booster", give: { lifeline: 3, shield: 2, booster: 1 } },
];

export const KEYBOARDS = [
  { id: "kb_glass", name: "Glass", price: 0, desc: "Frosted keys with a soft rim light." },
  { id: "kb_neon", name: "Neon Rim", price: 150, desc: "Dark keys outlined in your accent glow." },
  { id: "kb_mono", name: "Mono", price: 120, desc: "Stark high-contrast minimal keys." },
  { id: "kb_midnight", name: "Midnight", price: 180, desc: "Deep navy keycaps with silver legends." },
  { id: "kb_typewriter", name: "Typewriter", price: 200, desc: "Round vintage keys, cream legends." },
  { id: "kb_candy", name: "Candy", price: 200, desc: "Pastel keycaps that pop." },
  { id: "kb_arcade", name: "Arcade", price: 250, desc: "Chunky pixel keys straight from the cabinet." },
  { id: "kb_gold", name: "Gold Luxe", price: 400, desc: "Black onyx with gold-leaf edges." },
  { id: "kb_holo", name: "Holo", price: 500, desc: "Iridescent holographic shimmer." },
];
export const SOUNDS = [
  { id: "snd_soft", name: "Soft Tap", price: 0, desc: "Gentle, rounded clicks." },
  { id: "snd_type", name: "Typewriter", price: 100, desc: "Crisp mechanical clacks." },
  { id: "snd_bubble", name: "Bubble", price: 100, desc: "Poppy water droplets." },
  { id: "snd_synth", name: "Synthwave", price: 150, desc: "Retro synth plucks." },
  { id: "snd_chime", name: "Chimes", price: 150, desc: "Bright bell tones in key." },
  { id: "snd_8bit", name: "8-Bit", price: 180, desc: "Square-wave chiptune bleeps." },
];
export const ARENAS = [
  { id: "arena_aurora", name: "Aurora", price: 0, desc: "Accent-tinted northern lights." },
  { id: "arena_classic", name: "Chainz Classic", price: 0, desc: "The original Chainz video backdrop." },
  { id: "arena_void", name: "Void", price: 150, desc: "Pure black. Nothing but you and the words." },
  { id: "arena_nebula", name: "Nebula", price: 200, desc: "Drifting cosmic clouds." },
  { id: "arena_grid", name: "Synth Grid", price: 250, desc: "An endless retro horizon." },
  { id: "arena_sunset", name: "Sunset", price: 250, desc: "Warm dusk gradients." },
  { id: "arena_ocean", name: "Deep Ocean", price: 250, desc: "Caustic light from the deep." },
  { id: "arena_stars", name: "Starfield", price: 300, desc: "Warp through twinkling stars." },
];
export const EFFECTS = [
  { id: "fx_sparks", name: "Sparks", price: 0, desc: "Accent sparks burst from each link.", colors: null },
  { id: "fx_confetti", name: "Confetti", price: 150, desc: "A party with every word.", colors: ["#ff6b9a", "#ffd36b", "#60a5fa", "#2ee59d", "#c084fc"] },
  { id: "fx_hearts", name: "Hearts", price: 150, desc: "Lovely little hearts.", colors: ["#ff4d6d", "#ff8fab", "#ffc2d1"] },
  { id: "fx_pixels", name: "Pixels", price: 180, desc: "Chunky retro pixel bursts.", colors: ["#22d3ee", "#a3e635", "#f472b6"] },
  { id: "fx_stars", name: "Starburst", price: 200, desc: "Golden stars shoot outward.", colors: ["#ffd36b", "#fff1c1", "#c3ab69"] },
  { id: "fx_lightning", name: "Lightning", price: 250, desc: "Electric streaks crackle out.", colors: ["#e0f2fe", "#7dd3fc", "#a5b4fc"] },
];
export const TITLES = [
  { id: "title_rookie", name: "Rookie", price: 0 },
  { id: "title_wordsmith", name: "Wordsmith", price: 100 },
  { id: "title_linker", name: "Missing Link", price: 150 },
  { id: "title_breaker", name: "Chain Breaker", price: 150 },
  { id: "title_villain", name: "Vocab Villain", price: 200 },
  { id: "title_mind", name: "Mind Reader", price: 250 },
  { id: "title_lord", name: "Lexicon Lord", price: 300 },
  { id: "title_royal", name: "Starlite Royalty", price: 600 },
];
export const COSMETIC_GROUPS = [
  { key: "keyboard", label: "Keyboards", items: KEYBOARDS },
  { key: "sound", label: "Sounds", items: SOUNDS },
  { key: "arena", label: "Arenas", items: ARENAS },
  { key: "effect", label: "Effects", items: EFFECTS },
  { key: "title", label: "Titles", items: TITLES },
];
export const ALL_COSMETICS = COSMETIC_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.key })));
export const COSMETIC_BY_ID = Object.fromEntries(ALL_COSMETICS.map((c) => [c.id, c]));

/* ---------------- Trophies ---------------- */
const S = (fn) => fn;
const ml = (st, m) => (st.modeLinks && st.modeLinks[m]) || 0;
const b = (sv, m) => (sv.bests[m] && sv.bests[m].links) || 0;
export const TROPHIES = [
  { id: "first_link", name: "First Link", desc: "Make your first link", tier: "bronze", icon: "Link", goal: 1, val: S((s) => s.stats.links) },
  { id: "links_50", name: "Chain Gang", desc: "Make 50 links in total", tier: "bronze", icon: "Link2", goal: 50, val: S((s) => s.stats.links) },
  { id: "links_250", name: "Linksmith", desc: "Make 250 links in total", tier: "silver", icon: "Anvil", goal: 250, val: S((s) => s.stats.links) },
  { id: "links_1000", name: "Chain Master", desc: "Make 1,000 links in total", tier: "gold", icon: "Crown", goal: 1000, val: S((s) => s.stats.links) },
  { id: "links_5000", name: "Infinite Chain", desc: "Make 5,000 links in total", tier: "platinum", icon: "Infinity", goal: 5000, val: S((s) => s.stats.links) },
  { id: "streak_5", name: "Warm Up", desc: "Chain 5 in a row", tier: "bronze", icon: "Flame", goal: 5, val: S((s) => s.stats.bestChain) },
  { id: "streak_10", name: "On a Roll", desc: "Chain 10 in a row", tier: "silver", icon: "Flame", goal: 10, val: S((s) => s.stats.bestChain) },
  { id: "streak_25", name: "Unbreakable", desc: "Chain 25 in a row", tier: "gold", icon: "Flame", goal: 25, val: S((s) => s.stats.bestChain) },
  { id: "streak_50", name: "Legendary Chain", desc: "Chain 50 in a row", tier: "platinum", icon: "Flame", goal: 50, val: S((s) => s.stats.bestChain) },
  { id: "score_1k", name: "Scorer", desc: "Score 1,000 in one run", tier: "bronze", icon: "Target", goal: 1000, val: S((s) => s.stats.bestScore) },
  { id: "score_5k", name: "High Roller", desc: "Score 5,000 in one run", tier: "silver", icon: "Gem", goal: 5000, val: S((s) => s.stats.bestScore) },
  { id: "score_15k", name: "Word Tycoon", desc: "Score 15,000 in one run", tier: "gold", icon: "Landmark", goal: 15000, val: S((s) => s.stats.bestScore) },
  { id: "score_40k", name: "Hall of Fame", desc: "Score 40,000 in one run", tier: "platinum", icon: "Medal", goal: 40000, val: S((s) => s.stats.bestScore) },
  { id: "fast_10", name: "Quick Thinker", desc: "Answer in under 2.5s ten times", tier: "bronze", icon: "Timer", goal: 10, val: S((s) => s.stats.fast) },
  { id: "fast_100", name: "Speed Demon", desc: "Answer in under 2.5s 100 times", tier: "gold", icon: "Gauge", goal: 100, val: S((s) => s.stats.fast) },
  { id: "gold_1", name: "Golden Touch", desc: "Link a golden Starlite word", tier: "bronze", icon: "Star", goal: 1, val: S((s) => s.stats.goldWords) },
  { id: "gold_25", name: "Gold Rush", desc: "Link 25 golden Starlite words", tier: "silver", icon: "Stars", goal: 25, val: S((s) => s.stats.goldWords) },
  { id: "modes_4", name: "Explorer", desc: "Play 4 different modes", tier: "bronze", icon: "Compass", goal: 4, val: S((s) => s.stats.modesPlayed.length) },
  { id: "modes_8", name: "Mode Master", desc: "Play all 8 modes", tier: "silver", icon: "LayoutGrid", goal: 8, val: S((s) => s.stats.modesPlayed.length) },
  { id: "blitz_10", name: "Blitz Beginner", desc: "10 links in one Blitz run", tier: "bronze", icon: "Zap", goal: 10, val: S((s) => b(s, "blitz")) },
  { id: "blitz_25", name: "Blitz Champion", desc: "25 links in one Blitz run", tier: "gold", icon: "Zap", goal: 25, val: S((s) => b(s, "blitz")) },
  { id: "surv_20", name: "Survivor", desc: "20 links in one Survival run", tier: "silver", icon: "HeartPulse", goal: 20, val: S((s) => b(s, "survival")) },
  { id: "heart_back", name: "Second Wind", desc: "Restore a heart in Survival", tier: "bronze", icon: "HeartHandshake", goal: 1, val: S((s) => s.stats.heartsRestored) },
  { id: "sudden_15", name: "No Mercy", desc: "15 links in one Sudden Death run", tier: "silver", icon: "Skull", goal: 15, val: S((s) => b(s, "sudden")) },
  { id: "sudden_40", name: "Deathless", desc: "40 links in one Sudden Death run", tier: "platinum", icon: "Swords", goal: 40, val: S((s) => b(s, "sudden")) },
  { id: "zen_30", name: "Inner Peace", desc: "30 links in one Zen run", tier: "bronze", icon: "Leaf", goal: 30, val: S((s) => b(s, "zen")) },
  { id: "letter_15", name: "Alphabet Acrobat", desc: "15 links in one Letter Link run", tier: "silver", icon: "CaseSensitive", goal: 15, val: S((s) => b(s, "letter")) },
  { id: "compound_10", name: "Compound Interest", desc: "10 links in one Compound run", tier: "silver", icon: "Puzzle", goal: 10, val: S((s) => b(s, "compound")) },
  { id: "daily_1", name: "Daily Devotee", desc: "Complete a Daily Chain", tier: "bronze", icon: "CalendarCheck", goal: 1, val: S((s) => s.daily.completed) },
  { id: "daily_3", name: "Creature of Habit", desc: "3-day Daily Chain streak", tier: "silver", icon: "CalendarRange", goal: 3, val: S((s) => s.daily.bestStreak) },
  { id: "daily_7", name: "Weekly Ritual", desc: "7-day Daily Chain streak", tier: "gold", icon: "CalendarHeart", goal: 7, val: S((s) => s.daily.bestStreak) },
  { id: "perfect", name: "Flawless", desc: "10+ links with zero mistakes", tier: "silver", icon: "BadgeCheck", goal: 1, val: S((s) => s.stats.perfectRuns) },
  { id: "insane_10", name: "Insane in the Chain", desc: "10 in a row on Insane", tier: "gold", icon: "Brain", goal: 10, val: S((s) => s.stats.insaneChain) },
  { id: "word_10", name: "Big Words", desc: "Link a 10+ letter word", tier: "bronze", icon: "WholeWord", goal: 10, val: S((s) => s.stats.longestWord) },
  { id: "word_13", name: "Lexicon", desc: "Link a 13+ letter word", tier: "gold", icon: "BookOpen", goal: 13, val: S((s) => s.stats.longestWord) },
  { id: "shop_1", name: "Window Shopper", desc: "Buy something in the Gift Shop", tier: "bronze", icon: "ShoppingBag", goal: 1, val: S((s) => s.stats.purchases) },
  { id: "own_10", name: "Collector", desc: "Own 10 cosmetics", tier: "silver", icon: "Gift", goal: 10, val: S((s) => s.owned.length) },
  { id: "own_25", name: "Connoisseur", desc: "Own 25 cosmetics", tier: "gold", icon: "Crown", goal: 25, val: S((s) => s.owned.length) },
  { id: "power_10", name: "Power Player", desc: "Use 10 power-ups", tier: "bronze", icon: "Wand2", goal: 10, val: S((s) => s.stats.powerupsUsed) },
  { id: "night", name: "Night Owl", desc: "Play between midnight and 4am", tier: "bronze", icon: "Moon", goal: 1, val: S((s) => s.stats.nightOwl) },
  { id: "early", name: "Early Bird", desc: "Play between 5am and 7am", tier: "bronze", icon: "Sunrise", goal: 1, val: S((s) => s.stats.earlyBird) },
  { id: "runs_50", name: "Dedicated", desc: "Finish 50 runs", tier: "silver", icon: "Repeat", goal: 50, val: S((s) => s.stats.runs) },
  { id: "runs_150", name: "Marathon", desc: "Finish 150 runs", tier: "gold", icon: "Trophy", goal: 150, val: S((s) => s.stats.runs) },
  { id: "earn_1000", name: "Starlite Saver", desc: "Earn 1,000 Starlites in Chainz", tier: "gold", icon: "Sparkles", goal: 1000, val: S((s) => s.stats.starlitesEarned) },
  { id: "classic_30", name: "Classic Hero", desc: "30 links in one Classic run", tier: "gold", icon: "Link2", goal: 30, val: S((s) => b(s, "classic")) },
  { id: "all_mode_links", name: "Well Rounded", desc: "10 links in every mode (total)", tier: "platinum", icon: "Orbit", goal: 8, val: S((s) => MODES.filter((m) => ml(s.stats, m.id) >= 10).length) },
];
export const TIER_COLORS = { bronze: "#d09a5c", silver: "#c9d2e0", gold: "#ffd36b", platinum: "#b9f2ff" };

/* ---------------- Levels ---------------- */
export function levelFromXp(xp) {
  let lvl = 1, need = 400, rest = xp || 0;
  while (rest >= need && lvl < 99) { rest -= need; lvl++; need = Math.round(need * 1.18); }
  return { level: lvl, into: rest, need, pct: Math.min(100, (rest / need) * 100) };
}
