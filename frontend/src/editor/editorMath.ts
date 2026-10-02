import { Geo } from "@/src/game/components/geometry";
import { wavyLaneAt } from "@/src/game/components/WavyNote";
import { Note } from "@/src/game/types";

export type Tool = "select" | "tap" | "hold" | "flick" | "wavy" | "erase";
export const SNAPS = [0, 4, 8, 16] as const; // 0 = off, else 1/N note
export type Snap = (typeof SNAPS)[number];
export const ZOOMS = [1, 1.5, 2.5, 4]; // seconds of song visible on the board

export const snapStep = (bpm: number, snap: number) => (snap ? (60 / bpm) * (4 / snap) : 0);
export const snapTime = (t: number, step: number) => (step ? Math.round(t / step) * step : t);
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, "0")}`;

// Inverse of the highway projection: a point on the board → song time, lane and x-fraction.
// y is linear in time (same as gameplay); x is scaled by perspective at that depth.
export function boardPoint(geo: Geo, now: number, lookahead: number, x: number, y: number) {
  const prog = clamp((y - geo.topY) / geo.span, 0, 1.1);
  const persp = geo.pn + (1 - geo.pn) * prog;
  const fr = (x - geo.cx) / (geo.hw * persp);
  return { t: Math.max(0, now + lookahead * (1 - prog)), lane: clamp(Math.floor((fr + 0.5) * 4), 0, 3), x: clamp(fr + 0.5, 0.04, 0.96) };
}

// Nearest note under a board touch (long notes match anywhere along their length).
export function hitTest(notes: Note[], t: number, lane: number, tol: number): Note | undefined {
  let best: Note | undefined; let bd = Infinity;
  for (const n of notes) {
    const long = n.type === "hold" || n.type === "wavy";
    const end = n.time + (long ? n.duration || 0 : 0);
    const l = n.type === "wavy" ? wavyLaneAt(n, clamp(t, n.time, end)) : n.lane;
    if (l !== lane) continue;
    // Heads win over the body of a long note passing through the same spot.
    const head = Math.abs(t - n.time);
    const d = long ? Math.min(head, (t < n.time ? n.time - t : t > end ? t - end : 0) + tol * 0.6) : head;
    if (d <= tol && d < bd) { bd = d; best = n; }
  }
  return best;
}
