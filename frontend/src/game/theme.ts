// Vocotap NEON theme — arcade / cyberpunk rhythm-game look.
// Deep obsidian-indigo surfaces, electric neon accents, Orbitron for game type.

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const s = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const n = parseInt(s.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const accent = "#00E5FF";
const [ar, ag, ab] = hexToRgb(accent);
export const accentRgb = `${ar},${ag},${ab}`;
export const rgba = (alpha: number) => `rgba(${accentRgb},${alpha})`;
export const alpha = (hex: string, a: number) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

export const colors = {
  bg: "#06051A",
  bg1: "#0E0B26",
  panel: "rgba(20,16,52,0.72)",
  panelStrong: "rgba(40,32,96,0.6)",
  text: "#FFFFFF",
  muted: "rgba(214,214,255,0.58)",
  purple: "#B537FF",
  purpleSoft: "rgba(181,55,255,0.24)",
  cyan: "#00E5FF",
  lime: "#CCFF00",
  orange: "#FF8A00",
  violet: "#8B5CFF",
  gold: "#FFD600",
  pink: "#FF2D7A",
  red: "#FF0044",
  border: "rgba(120,120,255,0.22)",
} as const;

// Difficulty badge colours.
export const difficultyColors: Record<string, string> = { Easy: colors.lime, Normal: colors.cyan, Hard: colors.pink, Expert: colors.purple, Custom: colors.gold };

// Lane colours (mutable so equipped note skins can recolour the highway in place).
export const laneColors = ["#FF2D7A", "#00E5FF", "#CCFF00", "#B537FF"];
export function setLaneSkin(c: string[]) { for (let i = 0; i < 4; i++) laneColors[i] = c[i]; }

export const fonts = {
  display: "Orbitron-Black",
  arcade: "Orbitron",
  arcadeBlack: "Orbitron-Black",
  body: "Manrope",
  bold: "Manrope-Bold",
  heavy: "Manrope-Heavy",
} as const;

export const neonGlow = (c: string, r = 16, o = 0.75) => ({ shadowColor: c, shadowOpacity: o, shadowRadius: r, shadowOffset: { width: 0, height: 0 }, elevation: 10 });
export const textGlow = (c: string, r = 14) => ({ textShadowColor: c, textShadowRadius: r, textShadowOffset: { width: 0, height: 0 } });

export const glow = { purple: neonGlow(accent, 18, 0.6) };

export const radius = { sm: 6, md: 10, lg: 14, xl: 18, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
