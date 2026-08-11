// Vocotap theme - aligned to the parent Treesh Music app design language.
// The brand accent is DYNAMIC: it mirrors the user's `treesh_accent` from the
// main app (read synchronously from localStorage on web; native falls back to purple).
// Glassmorphism surfaces + Manrope / Special Gothic display fonts.

function readAccent(): string {
  try {
    const ls = (globalThis as unknown as { localStorage?: Storage }).localStorage;
    if (ls) {
      const raw = ls.getItem("treesh_accent");
      if (raw) { const v = JSON.parse(raw); if (typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v)) return v; }
    }
  } catch {}
  return "#9328ff";
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const s = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const n = parseInt(s.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const accent = readAccent();
const [ar, ag, ab] = hexToRgb(accent);
export const accentRgb = `${ar},${ag},${ab}`;
export const rgba = (alpha: number) => `rgba(${accentRgb},${alpha})`;

export const colors = {
  bg: "#0A0A0B",
  bg1: "#121214",
  panel: "rgba(255,255,255,0.06)",
  panelStrong: "rgba(255,255,255,0.10)",
  text: "#F5F5F7",
  muted: "rgba(245,245,247,0.55)",
  // Brand accent (dynamic). Legacy names all alias to the accent so the whole app stays monochrome-on-accent.
  purple: accent,
  purpleSoft: rgba(0.22),
  cyan: accent,
  lime: accent,
  orange: accent,
  violet: accent,
  gold: accent,
  pink: "#FF4D6D",
  border: "rgba(255,255,255,0.14)",
} as const;

// Lane colors — pink, cyan, yellow, purple (matches the gameplay mockup, left → right).
export const laneColors = ["#FF4D8D", "#2FE0D6", "#F5C842", "#8E7CFF"];

export const fonts = {
  display: "Display",
  body: "Manrope",
  bold: "Manrope-Bold",
  heavy: "Manrope-Heavy",
} as const;

export const glow = {
  purple: { shadowColor: accent, shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 26, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
