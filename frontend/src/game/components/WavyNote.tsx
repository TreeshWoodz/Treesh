import React, { useMemo } from "react";
import { View } from "react-native";
import Reanimated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { laneColors } from "@/src/game/theme";
import { Note } from "@/src/game/types";
import { Geo } from "./geometry";

// Wavy note = a CONTINUOUS ribbon drawn as a chain of connected line segments. We sample points
// along the drawn path, then between each pair render a rounded bar sized/rotated/positioned from
// the two projected endpoints — rounded ends overlap at every joint so it reads as one smooth line
// (no dotted look), and it falls through the real lane positions with correct depth. No animated
// SVG (fragile on native). x is a 0..1 fraction across the highway; fr = x - 0.5 matches the grid.
function mixHex(a: string, b: string, f: number) {
  const p = (h: string) => { const n = parseInt(h.replace("#", "").slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const x = p(a), y = p(b); const c = x.map((v, i) => Math.round(v + (y[i] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function sampleBeads(note: Note, max = 48): { t: number; x: number }[] {
  const dur = note.duration || 0.5;
  const pts = note.path && note.path.length > 1 ? note.path : [{ t: note.time, x: (note.lane + 0.5) / 4 }, { t: note.time + dur, x: (note.lane + 0.5) / 4 }];
  const start = pts[0].t, end = pts[pts.length - 1].t; const span = Math.max(0.05, end - start);
  const n = Math.max(10, Math.min(max, Math.round(span / 0.035)));
  const xAt = (tt: number) => {
    if (tt <= pts[0].t) return pts[0].x;
    if (tt >= pts[pts.length - 1].t) return pts[pts.length - 1].x;
    for (let k = 0; k < pts.length - 1; k++) { if (tt >= pts[k].t && tt <= pts[k + 1].t) { const f = (tt - pts[k].t) / Math.max(1e-4, pts[k + 1].t - pts[k].t); return pts[k].x + (pts[k + 1].x - pts[k].x) * f; } }
    return pts[pts.length - 1].x;
  };
  const beads: { t: number; x: number }[] = [];
  for (let i = 0; i <= n; i++) { const tt = start + (span * i) / n; beads.push({ t: tt, x: Math.max(0.04, Math.min(0.96, xAt(tt))) }); }
  return beads;
}

// One connected segment of the ribbon between two path samples (a→b). Rounded ends fill the joints.
const WavySegment = React.memo(function WavySegment({ a, b, clock, lookahead, geo, color, thick }: { a: { t: number; x: number }; b: { t: number; x: number }; clock: SharedValue<number>; lookahead: number; geo: Geo; color: string; thick: number }) {
  const aStyle = useAnimatedStyle(() => {
    const pa = (clock.value - (a.t - lookahead)) / lookahead;
    const pb = (clock.value - (b.t - lookahead)) / lookahead;
    const cpa = pa < 0 ? 0 : pa > 1 ? 1 : pa;
    const cpb = pb < 0 ? 0 : pb > 1 ? 1 : pb;
    const perspA = geo.pn + (1 - geo.pn) * cpa;
    const perspB = geo.pn + (1 - geo.pn) * cpb;
    const ax = geo.cx + (a.x - 0.5) * geo.hw * perspA, ay = geo.topY + geo.span * cpa;
    const bx = geo.cx + (b.x - 0.5) * geo.hw * perspB, by = geo.topY + geo.span * cpb;
    const dx = bx - ax, dy = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const h = Math.max(2, thick * ((perspA + perspB) / 2));
    const w = len + h; // overlap joints so the line is gapless
    const midx = (ax + bx) / 2, midy = (ay + by) / 2;
    let o = 1;
    if (pa < 0.04) o = pa / 0.04;
    if (pb >= 1) o = 0; // fully past the hit line → consumed
    if (o < 0) o = 0; if (o > 1) o = 1;
    return { width: w, height: h, borderRadius: h / 2, opacity: o, transform: [{ translateX: midx - w / 2 }, { translateY: midy - h / 2 }, { rotateZ: `${angle}rad` }] };
  });
  return <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: 0, backgroundColor: color }, aStyle]} />;
});
const WavyBead = React.memo(function WavyBead({ bead, clock, lookahead, geo, color, selected }: { bead: { t: number; x: number }; clock: SharedValue<number>; lookahead: number; geo: Geo; color: string; selected?: boolean }) {
  const size = geo.laneW * 0.6;
  const aStyle = useAnimatedStyle(() => {
    const prog = (clock.value - (bead.t - lookahead)) / lookahead;
    const cp = prog < 0 ? 0 : prog > 1.1 ? 1.1 : prog;
    const persp = geo.pn + (1 - geo.pn) * cp;
    const x = geo.cx + (bead.x - 0.5) * geo.hw * persp;
    const y = geo.topY + geo.span * cp;
    let o = 1;
    if (prog < 0.04) o = prog / 0.04;
    if (prog > 1.0) o = 1 - (prog - 1.0) / 0.06;
    if (o < 0) o = 0; if (o > 1) o = 1;
    return { opacity: o, transform: [{ translateX: x }, { translateY: y }, { scale: persp }] };
  });
  return <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: -size / 2, top: -size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderWidth: selected ? 4 : 2.5, borderColor: selected ? "#FFD600" : "#FFFFFF", shadowColor: color, shadowOpacity: 0.9, shadowRadius: 8, elevation: 6 }, aStyle]}>
    <View style={{ position: "absolute", top: size * 0.16, left: size * 0.24, right: size * 0.24, height: size * 0.34, borderRadius: size / 2, backgroundColor: "rgba(255,255,255,0.5)" }} />
  </Reanimated.View>;
});
const WavyNote = React.memo(function WavyNote({ note, clock, lookahead, geo, selected, lite }: { note: Note; clock: SharedValue<number>; lookahead: number; geo: Geo; selected?: boolean; lite?: boolean }) {
  const color = laneColors[note.lane];
  const beads = useMemo(() => sampleBeads(note, lite ? 16 : 48), [note, lite]);
  const thick = geo.laneW * 0.36;
  const edge = useMemo(() => mixHex(color, "#06051A", 0.45), [color]);
  // Three opaque layers (dark rim → lane colour → white-hot core) so joints never stack into lumps.
  return <>
    {!lite && beads.slice(0, -1).map((b, i) => <WavySegment key={`g${i}`} a={b} b={beads[i + 1]} clock={clock} lookahead={lookahead} geo={geo} color={edge} thick={thick * 1.55} />)}
    {beads.slice(0, -1).map((b, i) => <WavySegment key={`c${i}`} a={b} b={beads[i + 1]} clock={clock} lookahead={lookahead} geo={geo} color={color} thick={thick} />)}
    {!lite && beads.slice(0, -1).map((b, i) => <WavySegment key={`h${i}`} a={b} b={beads[i + 1]} clock={clock} lookahead={lookahead} geo={geo} color="#FFFFFF" thick={thick * 0.28} />)}
    <WavyBead bead={beads[0]} clock={clock} lookahead={lookahead} geo={geo} color={color} selected={selected} />
  </>;
});
export const WavyLayer = React.memo(function WavyLayer({ notes, clock, lookahead, geo, selectedIds, lite }: { notes: Note[]; clock: SharedValue<number>; lookahead: number; geo: Geo; selectedIds?: Set<string>; lite?: boolean }) {
  return <>{notes.filter(n => n.type === "wavy").map(n => <WavyNote key={n.id} note={n} clock={clock} lookahead={lookahead} geo={geo} selected={!!selectedIds?.has(n.id)} lite={lite} />)}</>;
});
// Which lane a wavy note occupies at time t — the player must follow it across lanes.
export function wavyLaneAt(note: Note, t: number) {
  if (note.path && note.path.length) { let best = note.path[0], bd = Math.abs(note.path[0].t - t); for (const p of note.path) { const d = Math.abs(p.t - t); if (d < bd) { bd = d; best = p; } } return Math.max(0, Math.min(3, Math.floor(best.x * 4))); }
  return note.lane;
}
