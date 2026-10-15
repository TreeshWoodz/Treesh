import {
  ArrowDown, ArrowUp, ArrowLeft, ArrowRight, ArrowDownRight, ArrowDownLeft, ArrowUpRight, ArrowUpLeft, Shuffle, CircleOff,
  Rows3, Bomb, X, Plus, Sun, Sparkles, Zap, Orbit, Paintbrush, Snowflake, CloudRain, Repeat, Activity, RotateCw, Wind, Dna, Package,
} from "lucide-react";

export const FALL_DIRS = [
  { id: "down", name: "Down", short: "Falls down", Icon: ArrowDown },
  { id: "up", name: "Up", short: "Falls up", Icon: ArrowUp },
  { id: "right", name: "Left to Right", short: "Falls right", Icon: ArrowRight },
  { id: "left", name: "Right to Left", short: "Falls left", Icon: ArrowLeft },
  { id: "dr", name: "Diagonal Right", short: "Diagonal right", Icon: ArrowDownRight },
  { id: "dl", name: "Diagonal Left", short: "Diagonal left", Icon: ArrowDownLeft },
  { id: "ur", name: "Rise Right", short: "Rising right", Icon: ArrowUpRight },
  { id: "ul", name: "Rise Left", short: "Rising left", Icon: ArrowUpLeft },
  { id: "random", name: "Random", short: "Random", Icon: Shuffle },
  { id: "none", name: "Zero-G", short: "Zero gravity", Icon: CircleOff },
];

export const SANDBOX_SPECIALS = [
  { id: "striped", name: "Striped", desc: "Match 4 in a row", Icon: Rows3 },
  { id: "bomb", name: "Blitz Bomb", desc: "L or T shape", Icon: Bomb },
  { id: "x", name: "X-Blaster", desc: "2x2 square", Icon: X },
  { id: "cross", name: "Crown Cross", desc: "Plus shape", Icon: Plus },
  { id: "nova", name: "Supernova", desc: "2x3 block", Icon: Sun },
  { id: "disco", name: "Starlite Disco", desc: "Match 5", Icon: Sparkles },
  { id: "mult", name: "Score Multiplier", desc: "x2 score for 10s, stacks to x5", Icon: Activity, exclusive: true },
  { id: "lightning", name: "Chain Lightning", desc: "Zaps every tile of 2 colors", Icon: Zap, exclusive: true },
  { id: "hole", name: "Black Hole", desc: "Swallows a 5x5 area", Icon: Orbit, exclusive: true },
  { id: "paint", name: "Color Painter", desc: "Repaints its neighbors its color", Icon: Paintbrush, exclusive: true },
  { id: "freeze", name: "Time Freeze", desc: "Slow-mo cascades, pauses chaos 10s", Icon: Snowflake, exclusive: true },
  { id: "gold", name: "Golden Rain", desc: "Turns 6 tiles gold, +500 each", Icon: CloudRain, exclusive: true },
];

export const ENV_EVENTS = [
  { id: "swap", name: "Tile Swap", desc: "Random blocks switch places", Icon: Repeat },
  { id: "quake", name: "Earthquake", desc: "Shakes up the whole board", Icon: Activity },
  { id: "rotate", name: "Board Spin", desc: "The board rotates 90 degrees", Icon: RotateCw },
  { id: "wind", name: "Wind Drift", desc: "Gusts slide rows sideways", Icon: Wind },
  { id: "mutate", name: "Mutation", desc: "Random tiles change color", Icon: Dna },
  { id: "crates", name: "Crate Drops", desc: "Blocker crates land on the board", Icon: Package },
];

const env = (on, every) => ({ on, every });
const ALL_SPECIALS = Object.fromEntries(SANDBOX_SPECIALS.map((s) => [s.id, true]));

export const CUSTOM_DEFAULTS = {
  specials: ALL_SPECIALS, gravity: "down", strength: 1, speed: 1,
  env: { swap: env(false, 12), quake: env(false, 25), rotate: env(false, 20), wind: env(false, 10), mutate: env(false, 8), crates: env(false, 15) },
  size: 8, types: 6, diagonal: true, mirror: false, giftEvery: 3, giftCount: 1, rainbow: false, party: false,
};

export const mergeCustom = (s = {}) => ({
  ...CUSTOM_DEFAULTS, ...s,
  specials: { ...CUSTOM_DEFAULTS.specials, ...s?.specials },
  env: Object.fromEntries(Object.entries(CUSTOM_DEFAULTS.env).map(([k, v]) => [k, { ...v, ...s?.env?.[k] }])),
});

const allEnv = (every) => Object.fromEntries(ENV_EVENTS.map((e, i) => [e.id, env(true, every + i * 2)]));

export const PRESETS = [
  { id: "chill", name: "Chill Vibes", s: {} },
  { id: "chaos", name: "Total Chaos", s: { gravity: "random", env: allEnv(6), party: true, rainbow: true, giftEvery: 1, giftCount: 2 } },
  { id: "upside", name: "Upside Down", s: { gravity: "up", mirror: true, env: { swap: env(true, 10) } } },
  { id: "zerog", name: "Zero-G Lab", s: { gravity: "none", strength: 0.5, env: { mutate: env(true, 6) }, rainbow: true } },
  { id: "diagonal", name: "Diagonal Rain", s: { gravity: "dr", env: { wind: env(true, 8) } } },
  { id: "overload", name: "Power Overload", s: { party: true, giftEvery: 1, giftCount: 3, size: 10, types: 7 } },
];

export const buildCustomConfig = (raw) => {
  const s = mergeCustom(raw || {});
  return {
    mode: "custom", custom: true, title: "Custom Zen", size: s.size, types: s.types, gravity: s.gravity, strength: s.strength, speed: s.speed,
    env: s.env, noDiagonal: !s.diagonal, mirror: s.mirror, giftEvery: s.giftEvery, giftCount: s.giftCount, rainbow: s.rainbow, party: s.party,
    allowed: Object.keys(s.specials).filter((k) => s.specials[k]),
  };
};
