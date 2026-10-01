import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Reanimated, { Easing as RE, cancelAnimation, interpolateColor, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient as SvgLinear, Line, Polygon, RadialGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NeonButton } from "@/src/components/ui";
import { Avatar } from "@/src/components/Avatar";
import { useAppState } from "@/src/game/AppState";
import { laneColors, colors, fonts, rgba, alpha, neonGlow, textGlow } from "@/src/game/theme";
import { TUTORIAL_STEPS } from "@/src/game/chartEngine";
import { addXp, claimCrowns, levelUpReward, skinById, useProgress, xpForRun } from "@/src/game/progression";
import { HighwayScene } from "@/src/components/HighwayScene";
import { Note, ScoreResult, SwipeDir } from "@/src/game/types";
import { useStarlites } from "@/src/game/starlites";
import { computeAchievements, TIER_COLOR } from "@/src/game/achievements";
import { useTreeshIdentity } from "@/src/game/identity";
import { ensureHitAudio } from "@/src/game/synth";

type Judgment = "PERFECT" | "GREAT" | "GOOD" | "MISS";
const weights = { PERFECT: 1, GREAT: 0.75, GOOD: 0.45, MISS: 0 };
const P_NEAR = 0.12; // lane width at the vanishing point as a fraction of the bottom width
const laneFrac = (lane: number) => (lane + 0.5) / 4 - 0.5;
const judgeColor = (g: Judgment, plus?: boolean) => (g === "PERFECT" ? (plus ? "#CCFF00" : "#00E5FF") : g === "GREAT" ? "#FF2D7A" : g === "GOOD" ? "#B537FF" : "#FF0044");
const comboColor = (c: number) => (c >= 200 ? "#FF2D7A" : c >= 100 ? "#FFD600" : c >= 50 ? "#CCFF00" : c >= 25 ? "#00E5FF" : "#FFFFFF");
// Stars from accuracy (half-star tiers) + the Starlite reward for a run.
export function starsFor(acc: number) { return acc >= 100 ? 5 : acc >= 96 ? 4.5 : acc >= 86 ? 4 : acc >= 80 ? 3.5 : acc >= 70 ? 3 : acc >= 66 ? 2.5 : acc >= 50 ? 2 : 1; }
export function starlitesFor(stars: number) { return stars >= 5 ? 300 : stars >= 4 ? 150 : stars >= 2.5 ? 100 : 50; }
const ARROW: Record<SwipeDir, keyof typeof Ionicons.glyphMap> = { up: "arrow-up", left: "arrow-back", right: "arrow-forward" };
const ARROW_CH: Record<SwipeDir, string> = { up: "↑", left: "←", right: "→" };
const MILESTONES = [50, 100, 200];
const MBONUS = [25, 50, 100];
const SPEEDS = [0.5, 0.75, 1];
const LIVE_ACH: { id: string; title: string; icon: keyof typeof Ionicons.glyphMap; tier: "bronze" | "silver" | "gold"; test: (combo: number, score: number) => boolean }[] = [
  { id: "vocopulse", title: "Vocopulse", icon: "flash", tier: "silver", test: c => c >= 25 },
  { id: "combo50", title: "In the Groove", icon: "pulse", tier: "bronze", test: c => c >= 50 },
  { id: "combo100", title: "Unstoppable", icon: "trending-up", tier: "silver", test: c => c >= 100 },
  { id: "combo200", title: "Combo Master", icon: "flame", tier: "gold", test: c => c >= 200 },
  { id: "combo500", title: "Combo Legend", icon: "rocket", tier: "gold", test: c => c >= 500 },
  { id: "highroller", title: "High Roller", icon: "cash", tier: "gold", test: (c, s) => s >= 1000000 },
];

type Geo = { cx: number; hw: number; topY: number; bottomY: number; laneW: number; span: number };

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
function sampleBeads(note: Note): { t: number; x: number }[] {
  const dur = note.duration || 0.5;
  const pts = note.path && note.path.length > 1 ? note.path : [{ t: note.time, x: (note.lane + 0.5) / 4 }, { t: note.time + dur, x: (note.lane + 0.5) / 4 }];
  const start = pts[0].t, end = pts[pts.length - 1].t; const span = Math.max(0.05, end - start);
  const n = Math.max(10, Math.min(48, Math.round(span / 0.035)));
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
const WavySegment = React.memo(function WavySegment({ a, b, clock, lookahead, geo, color, thick }: { a: { t: number; x: number }; b: { t: number; x: number }; clock: Reanimated.SharedValue<number>; lookahead: number; geo: Geo; color: string; thick: number }) {
  const aStyle = useAnimatedStyle(() => {
    const pa = (clock.value - (a.t - lookahead)) / lookahead;
    const pb = (clock.value - (b.t - lookahead)) / lookahead;
    const cpa = pa < 0 ? 0 : pa > 1 ? 1 : pa;
    const cpb = pb < 0 ? 0 : pb > 1 ? 1 : pb;
    const perspA = P_NEAR + (1 - P_NEAR) * cpa;
    const perspB = P_NEAR + (1 - P_NEAR) * cpb;
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
const WavyBead = React.memo(function WavyBead({ bead, clock, lookahead, geo, color }: { bead: { t: number; x: number }; clock: Reanimated.SharedValue<number>; lookahead: number; geo: Geo; color: string }) {
  const size = geo.laneW * 0.6;
  const aStyle = useAnimatedStyle(() => {
    const prog = (clock.value - (bead.t - lookahead)) / lookahead;
    const cp = prog < 0 ? 0 : prog > 1.1 ? 1.1 : prog;
    const persp = P_NEAR + (1 - P_NEAR) * cp;
    const x = geo.cx + (bead.x - 0.5) * geo.hw * persp;
    const y = geo.topY + geo.span * cp;
    let o = 1;
    if (prog < 0.04) o = prog / 0.04;
    if (prog > 1.0) o = 1 - (prog - 1.0) / 0.06;
    if (o < 0) o = 0; if (o > 1) o = 1;
    return { opacity: o, transform: [{ translateX: x }, { translateY: y }, { scale: persp }] };
  });
  return <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: -size / 2, top: -size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderWidth: 2.5, borderColor: "#FFFFFF", shadowColor: color, shadowOpacity: 0.9, shadowRadius: 8, elevation: 6 }, aStyle]}>
    <View style={{ position: "absolute", top: size * 0.16, left: size * 0.24, right: size * 0.24, height: size * 0.34, borderRadius: size / 2, backgroundColor: "rgba(255,255,255,0.5)" }} />
  </Reanimated.View>;
});
const WavyNote = React.memo(function WavyNote({ note, clock, lookahead, geo }: { note: Note; clock: Reanimated.SharedValue<number>; lookahead: number; geo: Geo }) {
  const color = laneColors[note.lane];
  const beads = useMemo(() => sampleBeads(note), [note]);
  const thick = geo.laneW * 0.36;
  const edge = useMemo(() => mixHex(color, "#06051A", 0.45), [color]);
  // Three opaque layers (dark rim → lane colour → white-hot core) so joints never stack into lumps.
  return <>
    {beads.slice(0, -1).map((b, i) => <WavySegment key={`g${i}`} a={b} b={beads[i + 1]} clock={clock} lookahead={lookahead} geo={geo} color={edge} thick={thick * 1.55} />)}
    {beads.slice(0, -1).map((b, i) => <WavySegment key={`c${i}`} a={b} b={beads[i + 1]} clock={clock} lookahead={lookahead} geo={geo} color={color} thick={thick} />)}
    {beads.slice(0, -1).map((b, i) => <WavySegment key={`h${i}`} a={b} b={beads[i + 1]} clock={clock} lookahead={lookahead} geo={geo} color="#FFFFFF" thick={thick * 0.28} />)}
    <WavyBead bead={beads[0]} clock={clock} lookahead={lookahead} geo={geo} color={color} />
  </>;
});
const WavyLayer = React.memo(function WavyLayer({ notes, clock, lookahead, geo }: { notes: Note[]; clock: Reanimated.SharedValue<number>; lookahead: number; geo: Geo }) {
  return <>{notes.filter(n => n.type === "wavy").map(n => <WavyNote key={n.id} note={n} clock={clock} lookahead={lookahead} geo={geo} />)}</>;
});
// Which lane a wavy note occupies at time t — the player must follow it across lanes.
function wavyLaneAt(note: Note, t: number) {
  if (note.path && note.path.length) { let best = note.path[0], bd = Math.abs(note.path[0].t - t); for (const p of note.path) { const d = Math.abs(p.t - t); if (d < bd) { bd = d; best = p; } } return Math.max(0, Math.min(3, Math.floor(best.x * 4))); }
  return note.lane;
}

// ---- Falling note (pure UI-thread motion, memoized so score/combo re-renders never touch it) ----
const FallingNote = React.memo(function FallingNote({ note, clock, lookahead, geo, special, rainbow }: { note: Note; clock: Reanimated.SharedValue<number>; lookahead: number; geo: Geo; special?: boolean; rainbow: Reanimated.SharedValue<number> }) {
  const f = laneFrac(note.lane);
  const color = laneColors[note.lane];
  const isWavy = note.type === "wavy";
  const isHold = note.type === "hold" || note.type === "wavy";
  const isSwipe = note.type === "swipe" && !!note.dir;
  const baseW = geo.laneW * (isSwipe ? 0.7 : 0.8);
  const baseH = isSwipe ? geo.laneW * 0.62 : 28;
  const tailW = baseW * 0.4;
  const tailLen = isHold ? Math.max(24, Math.min(geo.span, ((note.duration || 0.4) / lookahead) * geo.span)) : 0;
  const tilt = (Math.atan2(-f * geo.hw * (1 - P_NEAR), geo.span) * 180) / Math.PI; // lean the tail toward the vanishing point
  const aStyle = useAnimatedStyle(() => {
    const prog = (clock.value - (note.time - lookahead)) / lookahead; // 0 at spawn(top) → 1 at receptor
    const cp = prog < 0 ? 0 : prog > 1.1 ? 1.1 : prog;
    const persp = P_NEAR + (1 - P_NEAR) * cp;
    const x = geo.cx + f * geo.hw * persp;
    const y = geo.topY + geo.span * cp;
    let opacity = 1;
    if (prog < 0.05) opacity = prog / 0.05;
    if (prog > 1.0) opacity = 1 - (prog - 1.0) / 0.12;
    if (opacity < 0) opacity = 0; if (opacity > 1) opacity = 1;
    return { opacity, transform: [{ translateX: x }, { translateY: y }, { scale: persp }] };
  });
  // Special (charged) notes cycle colours smoothly so they read as "power" notes rather than a single lane colour.
  const capStyle = useAnimatedStyle(() => {
    if (!special) return { backgroundColor: color };
    const p = (rainbow.value + note.lane * 0.22) % 1;
    return { backgroundColor: interpolateColor(p, [0, 0.25, 0.5, 0.75, 1], ["#FF4D8D", "#2FE0D6", "#F5C842", "#8E7CFF", "#FF4D8D"]) };
  });
  return (
    <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: -baseW / 2, top: -baseH / 2, width: baseW, height: baseH }, aStyle]}>
      {isHold && !isWavy && <View style={{ position: "absolute", left: baseW / 2 - tailW / 2, bottom: baseH / 2, width: tailW, height: tailLen, borderRadius: tailW / 2, backgroundColor: `${color}55`, borderWidth: 1, borderColor: `${color}AA`, transformOrigin: "50% 100%", transform: [{ rotateZ: `${tilt}deg` }] }} />}
      <View style={{ position: "absolute", left: -6, top: -6, width: baseW + 12, height: baseH + 12, borderRadius: isSwipe ? 18 : 14, backgroundColor: alpha(color, special ? 0.5 : 0.28) }} />
      <Reanimated.View style={[styles.note, { width: baseW, height: baseH, borderRadius: isSwipe ? 14 : 10, borderColor: special || isSwipe ? "#FFFFFF" : "rgba(255,255,255,0.7)", borderWidth: isSwipe ? 2.5 : 1.5 }, capStyle]}>
        <View style={[styles.noteGloss, { borderRadius: baseH / 2, backgroundColor: special ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)" }]} />
        {isSwipe ? <Ionicons name={ARROW[note.dir as SwipeDir]} size={Math.round(baseH * 0.78)} color="#FFFFFF" style={{ textShadowColor: "#000", textShadowRadius: 6 }} />
          : <View style={{ position: "absolute", left: baseW * 0.28, right: baseW * 0.28, top: baseH / 2 - 2, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.95)" }} />}
      </Reanimated.View>
    </Reanimated.View>
  );
});

const NotesLayer = React.memo(function NotesLayer({ notes, clock, lookahead, geo, special, rainbow }: { notes: Note[]; clock: Reanimated.SharedValue<number>; lookahead: number; geo: Geo; special?: boolean; rainbow: Reanimated.SharedValue<number> }) {
  // Wavy notes are drawn entirely by WavyLayer (bead ribbon) — skip them here so they aren't double-drawn.
  return <>{notes.filter(n => n.type !== "wavy").map(n => <FallingNote key={n.id} note={n} clock={clock} lookahead={lookahead} geo={geo} special={special} rainbow={rainbow} />)}</>;
});

// Bright bar shown while a hold is actively sustained — drains from the receptor, leaning along the lane's perspective.
function ActiveHoldBar({ note, clock, lookahead, geo }: { note: Note; clock: Reanimated.SharedValue<number>; lookahead: number; geo: Geo }) {
  const f = laneFrac(note.lane);
  const color = laneColors[note.lane];
  const isWavy = note.type === "wavy";
  const w = geo.laneW * 0.34;
  const x = geo.cx + f * geo.hw;
  const tilt = (Math.atan2(-f * geo.hw * (1 - P_NEAR), geo.span) * 180) / Math.PI;
  const endT = note.time + (note.duration || 0.4);
  const aStyle = useAnimatedStyle(() => {
    const cpTe = (clock.value - (endT - lookahead)) / lookahead;
    const cte = cpTe < 0 ? 0 : cpTe > 1 ? 1 : cpTe;
    const yTe = geo.topY + geo.span * cte;
    return { height: Math.max(0, geo.bottomY - yTe), transform: [{ translateY: yTe }, { rotateZ: `${tilt}deg` }] };
  });
  // Wavy notes render their own continuous trace as they fall — a separate draining bar distorts it,
  // so we skip the bar entirely and let the falling wave + the lit receptor lane guide the trace.
  if (isWavy) return null;
  return <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: x - w / 2, top: 0, width: w, borderRadius: w / 2, backgroundColor: color, transformOrigin: "50% 100%" }, aStyle]}><View style={{ position: "absolute", top: 2, left: w * 0.3, right: w * 0.3, bottom: 2, borderRadius: w / 2, backgroundColor: "rgba(255,255,255,0.35)" }} /></Reanimated.View>;
}

// ---- Static perspective grid (SVG, rendered once) ----
const Grid = React.memo(function Grid({ geo, w, h, tint, fever }: { geo: Geo; w: number; h: number; tint: string; fever: boolean }) {
  const topX = (fr: number) => geo.cx + fr * geo.hw * P_NEAR;
  const botX = (fr: number) => geo.cx + fr * geo.hw;
  const edges = [-0.5, -0.25, 0, 0.25, 0.5];
  const poly = `${topX(-0.5)},${geo.topY} ${topX(0.5)},${geo.topY} ${botX(0.5)},${geo.bottomY} ${botX(-0.5)},${geo.bottomY}`;
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy={`${(geo.topY / h) * 100}%`} r="55%">
          <Stop offset="0" stopColor={fever ? "#FFD600" : tint} stopOpacity={fever ? 0.5 : 0.34} />
          <Stop offset="1" stopColor={fever ? "#FFD600" : tint} stopOpacity={0} />
        </RadialGradient>
        <SvgLinear id="lane" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0A0830" stopOpacity={0.35} />
          <Stop offset="1" stopColor={fever ? "#3A1A40" : "#140F48"} stopOpacity={0.78} />
        </SvgLinear>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill="url(#glow)" />
      <Polygon points={poly} fill="url(#lane)" />
      {edges.map((e, i) => { const outer = i === 0 || i === 4; const c = fever ? "#FFD600" : tint; return outer ? <React.Fragment key={i}><Line x1={topX(e)} y1={geo.topY} x2={botX(e)} y2={geo.bottomY + 40} stroke={c} strokeOpacity={0.25} strokeWidth={9} /><Line x1={topX(e)} y1={geo.topY} x2={botX(e)} y2={geo.bottomY + 40} stroke={c} strokeWidth={2.2} /></React.Fragment> : <Line key={i} x1={topX(e)} y1={geo.topY} x2={botX(e)} y2={geo.bottomY + 40} stroke="rgba(160,200,255,0.16)" strokeWidth={1} />; })}
      <Line x1={geo.cx - geo.hw / 2 - 6} y1={geo.bottomY} x2={geo.cx + geo.hw / 2 + 6} y2={geo.bottomY} stroke={fever ? "#FFD600" : tint} strokeOpacity={0.35} strokeWidth={14} />
      <Line x1={geo.cx - geo.hw / 2 - 6} y1={geo.bottomY} x2={geo.cx + geo.hw / 2 + 6} y2={geo.bottomY} stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={2} />
      {[0.4, 0.68, 0.88].map((p, i) => { const y = geo.topY + geo.span * p; const persp = P_NEAR + (1 - P_NEAR) * p; return <Line key={`d${i}`} x1={geo.cx - geo.hw * 0.5 * persp} y1={y} x2={geo.cx + geo.hw * 0.5 * persp} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />; })}
    </Svg>
  );
});

const Receptors = React.memo(function Receptors({ geo, flash }: { geo: Geo; flash: Animated.Value[] }) {
  const capW = geo.laneW * 0.82;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {laneColors.map((c, l) => {
        const x = geo.cx + laneFrac(l) * geo.hw;
        return (
          <Animated.View key={l} style={[styles.receptor, { width: capW, left: x - capW / 2, top: geo.bottomY - 16, borderColor: c, shadowColor: c, transform: [{ scale: flash[l].interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] }) }] }]}>
            <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: c, opacity: flash[l].interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.95] }) }]} />
            <View style={{ width: capW * 0.34, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.85)" }} />
          </Animated.View>
        );
      })}
    </View>
  );
});

// Hit explosion per lane: expanding ring + light pillar + sparks, all native-driver Animated.
const LaneBursts = React.memo(function LaneBursts({ geo, burst, sparks }: { geo: Geo; burst: Animated.Value[]; sparks: boolean }) {
  const S = sparks ? 7 : 0;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {burst.map((b, l) => {
      const c = laneColors[l]; const x = geo.cx + laneFrac(l) * geo.hw; const y = geo.bottomY; const R = geo.laneW * 0.5;
      const fade = b.interpolate({ inputRange: [0, 0.08, 1], outputRange: [0, 1, 0] });
      return <React.Fragment key={l}>
        <Animated.View style={{ position: "absolute", left: x - R * 0.55, top: y - R * 3.2, width: R * 1.1, height: R * 3.2, borderRadius: R * 0.55, backgroundColor: c, opacity: b.interpolate({ inputRange: [0, 0.06, 1], outputRange: [0, 0.42, 0] }), transform: [{ translateY: R * 1.6 }, { scaleY: b.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }, { translateY: -R * 1.6 }] }} />
        <Animated.View style={{ position: "absolute", left: x - R, top: y - R, width: R * 2, height: R * 2, borderRadius: R, borderWidth: 3, borderColor: c, opacity: fade, transform: [{ scaleY: 0.5 }, { scale: b.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1.7] }) }] }} />
        {Array.from({ length: S }).map((_, i) => { const ang = -Math.PI / 2 + (i - (S - 1) / 2) * 0.36; const d = R * (1.8 + (i % 3) * 0.5); return <Animated.View key={i} style={{ position: "absolute", left: x - 3, top: y - 3, width: 6, height: 6, borderRadius: 3, backgroundColor: i % 2 ? "#FFFFFF" : c, opacity: fade, transform: [{ translateX: b.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(ang) * d] }) }, { translateY: b.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(ang) * d] }) }, { scale: b.interpolate({ inputRange: [0, 1], outputRange: [1.5, 0.2] }) }] }} />; })}
      </React.Fragment>;
    })}
  </View>;
});

// Beat lines rushing down the highway on every beat (brighter on the bar) — pure UI-thread, fixed pool.
function BeatLine({ k, beat, clock, lookahead, geo, fever }: { k: number; beat: number; clock: Reanimated.SharedValue<number>; lookahead: number; geo: Geo; fever: Reanimated.SharedValue<number> }) {
  const st = useAnimatedStyle(() => {
    const c = clock.value; const idx = Math.ceil(c / beat) + k; const prog = (c - (idx * beat - lookahead)) / lookahead;
    const on = prog >= 0 && prog <= 1; const p = on ? prog : 0;
    const persp = P_NEAR + (1 - P_NEAR) * p; const w = geo.hw * persp;
    const bar = idx % 4 === 0;
    return { opacity: on ? ((bar ? 0.5 : 0.16) + fever.value * 0.3) * Math.min(1, p * 5) : 0, width: w, transform: [{ translateX: geo.cx - w / 2 }, { translateY: geo.topY + geo.span * p }] };
  });
  return <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: -1, height: 2, backgroundColor: "#8FE9FF" }, st]} />;
}
const BeatLines = React.memo(function BeatLines({ beat, clock, lookahead, geo, fever }: { beat: number; clock: Reanimated.SharedValue<number>; lookahead: number; geo: Geo; fever: Reanimated.SharedValue<number> }) {
  const n = Math.min(24, Math.ceil(lookahead / beat) + 1);
  return <>{Array.from({ length: n }, (_, k) => <BeatLine key={k} k={k} beat={beat} clock={clock} lookahead={lookahead} geo={geo} fever={fever} />)}</>;
});

const Backdrop = React.memo(function Backdrop({ coverArt, grayscale, theme, w, h, horizon }: { coverArt?: string | number; grayscale: boolean; theme: string; w: number; h: number; horizon: number }) {
  const scene = theme !== "classic";
  return (
    <View testID={`gameplay-theme-${theme}`} style={[StyleSheet.absoluteFill, { backgroundColor: "#06051A" }]}>
      {scene ? <HighwayScene theme={theme} w={w} h={h} horizon={horizon} /> : coverArt ? <Image testID="gameplay-cover-backdrop" source={typeof coverArt === "number" ? coverArt : { uri: coverArt }} style={[styles.cover, { opacity: grayscale ? 0.14 : 0.32 }]} resizeMode="cover" /> : null}
      <LinearGradient colors={scene ? ["rgba(6,5,26,0.15)", "rgba(6,5,26,0.35)", "rgba(6,5,26,0.85)"] : ["rgba(6,5,26,0.45)", "rgba(6,5,26,0.8)", "#06051A"]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
    </View>
  );
});

export default function GameScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { selectedSong, selectedDifficulty, charts, settings, saveResult, testChart, setTestChart, scores, songs, updateSettings } = useAppState();
  const { gameComplete, award, stars } = useStarlites();
  const { nickname, avatar } = useTreeshIdentity();
  const params = useLocalSearchParams<{ practice?: string; tutorial?: string }>();
  const practice = params.practice === "1" && !testChart;
  const tutorial = params.tutorial === "1";
  const practiceRef = useRef(practice); useEffect(() => { practiceRef.current = practice; }, [practice]);
  const chart = testChart || (selectedSong ? charts[`${selectedSong.id}-${selectedDifficulty}`] : undefined);
  const player = useAudioPlayer(selectedSong?.uri ? { uri: selectedSong.uri } : null, { updateInterval: 500 });
  const hitPlayer = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const [countdown, setCountdown] = useState(3);
  const [paused, setPaused] = useState(false);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [rock, setRock] = useState(70);
  const [accuracy, setAccuracy] = useState(100);
  const [progress, setProgress] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [pulseActive, setPulseActive] = useState(false);
  const [judgment, setJudgment] = useState<{ grade: Judgment; plus: boolean; early: boolean | null; flick?: SwipeDir; x: number; y: number; key: number } | null>(null);
  const [feverPop, setFeverPop] = useState(0);
  const [goPop, setGoPop] = useState(0);
  const prog = useProgress();
  const skin = skinById(prog.skin);
  const pendingSwipe = useRef<{ note: Note; grade: Judgment; plus: boolean; early: boolean | null; lane: number; id: string; x: number; y: number; t: number } | null>(null);
  const laneBurst = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const shake = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(0)).current;
  const feverAnim = useRef(new Animated.Value(0)).current;
  const goAnim = useRef(new Animated.Value(0)).current;
  const perfectPlusRef = useRef(0);
  const feverSV = useSharedValue(0);
  const [windowIds, setWindowIds] = useState<string[]>([]);
  const [wavyIds, setWavyIds] = useState<string[]>([]);
  const [activeHold, setActiveHold] = useState<Note | null>(null);
  const [tracePop, setTracePop] = useState<{ key: number; perfect: boolean; x: number } | null>(null);
  const [forceStart, setForceStart] = useState(false);
  const [milestone, setMilestone] = useState<{ combo: number; bonus: number; key: number } | null>(null);
  const [achToast, setAchToast] = useState<{ title: string; icon: keyof typeof Ionicons.glyphMap; tier: "bronze" | "silver" | "gold"; key: number } | null>(null);
  const achAnim = useRef(new Animated.Value(0)).current;
  const unlockedAtStart = useRef<Set<string>>(new Set());
  const achPopped = useRef<Set<string>>(new Set());
  const [rate, setRate] = useState(1);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const rateRef = useRef(1);
  const loopARef = useRef<number | null>(null);
  const loopBRef = useRef<number | null>(null);
  const milestoneIdx = useRef(0);
  const milestoneBonusRef = useRef(0);
  const milestoneAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { loopARef.current = loopA; }, [loopA]);
  useEffect(() => { loopBRef.current = loopB; }, [loopB]);

  const clock = useSharedValue(0);
  const rainbow = useSharedValue(0);
  const traceGlow = useSharedValue(0);
  const traceX = useSharedValue(0);
  useEffect(() => { rainbow.value = withRepeat(withTiming(1, { duration: 2600, easing: RE.linear }), -1, false); }, [rainbow]);
  const pulseActiveRef = useRef(false);
  const fuelRef = useRef(0);        // Vocopulse fuel 0..100 while active
  const missStreakRef = useRef(0);  // consecutive misses (accelerates the drain)
  const lastPulseT = useRef(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { pulseActiveRef.current = pulseActive; }, [pulseActive]);
  useEffect(() => { Animated.timing(pulseAnim, { toValue: pulse, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: false }).start(); }, [pulse, pulseAnim]);
  const touchLane = useRef<Record<string, number>>({});
  const clockStart = useRef(0); const pauseAccum = useRef(0); const pauseAt = useRef(0);
  const resolved = useRef(new Set<string>());
  const counts = useRef({ PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 });
  const comboRef = useRef(0); const maxCombo = useRef(0); const scoreRef = useRef(0); const finishing = useRef(false); const pulseBase = useRef(0); const tickCount = useRef(0); const rockRef = useRef(70); const judgeRef = useRef<{ grade: Judgment; lane: number; plus?: boolean; early?: boolean | null; flick?: SwipeDir } | null>(null);
  const laneFlash = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const pressed = useRef(new Set<number>()).current;
  const judgeAnim = useRef(new Animated.Value(0)).current;
  const traceAnim = useRef(new Animated.Value(0)).current;
  const startedRef = useRef(false);
  const countdownTimer = useRef<any>(null);

  const PAD_BOTTOM = insets.bottom + 66;
  const PAD_H = 148;
  const geo: Geo = useMemo(() => {
    const hw = Math.min(width - 20, 470);
    const bottomY = height - PAD_BOTTOM - PAD_H / 2;
    const topY = insets.top + 128;
    return { cx: width / 2, hw, topY, bottomY, laneW: hw / 4, span: bottomY - topY };
  }, [width, height, insets.top, PAD_BOTTOM]);

  const lookahead = 2.4 / settings.noteSpeed;
  const duration = chart?.duration || 30;
  const sorted = useMemo(() => (chart ? [...chart.notes].sort((a, b) => a.time - b.time) : []), [chart]);
  const wavyNotes = useMemo(() => sorted.filter(n => n.type === "wavy"), [sorted]);
  const scanStart = useRef(0);

  const jsTime = useCallback(() => ((Date.now() - clockStart.current - pauseAccum.current) / 1000) * rateRef.current + settings.audioOffset / 1000, [settings.audioOffset]);
  const flashLane = useCallback((lane: number) => { laneFlash[lane].setValue(1); Animated.timing(laneFlash[lane], { toValue: 0, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); }, [laneFlash]);
  const showJudge = useCallback((grade: Judgment, lane: number, plus = false, early: boolean | null = null, flick?: SwipeDir) => {
    const persp = P_NEAR + (1 - P_NEAR) * 0.62;
    setJudgment({ grade, plus, early, flick, x: geo.cx + laneFrac(lane) * geo.hw * persp, y: geo.topY + geo.span * 0.62, key: Date.now() });
  }, [geo]);
  const fx = !settings.reducedParticles && !settings.performanceMode;
  const fireBurst = useCallback((lane: number) => { laneBurst[lane].setValue(0); Animated.timing(laneBurst[lane], { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); }, [laneBurst]);
  const doShake = useCallback((amp: number) => { if (!fx) return; shake.stopAnimation(); Animated.sequence([amp, -amp * 0.8, amp * 0.55, -amp * 0.3, 0].map(v => Animated.timing(shake, { toValue: v, duration: 45, useNativeDriver: true }))).start(); }, [shake, fx]);
  // A swipe that was grabbed but not flicked correctly (wrong way / released / too slow) counts as a miss.
  const failSwipe = useCallback(() => {
    const p = pendingSwipe.current; if (!p) return; pendingSwipe.current = null;
    counts.current.MISS += 1; comboRef.current = 0; rockRef.current = Math.max(0, rockRef.current - 6);
    judgeRef.current = { grade: "MISS", lane: p.lane };
    if (pulseActiveRef.current) { missStreakRef.current += 1; fuelRef.current -= 34 * missStreakRef.current; } else pulseBase.current = 0;
    doShake(4);
  }, [doShake]);
  const startClock = useCallback((from: number) => { cancelAnimation(clock); clock.value = from; clock.value = withTiming(duration, { duration: Math.max(10, ((duration - from) / rateRef.current) * 1000), easing: RE.linear }); }, [clock, duration]);
  // Vocopulse now auto-fires when the meter fills (no button press needed).
  // Vocopulse: fills over 25 consecutive hits, then stays lit while the streak continues.
  const triggerPulse = useCallback(() => { pulseBase.current = comboRef.current; fuelRef.current = 100; missStreakRef.current = 0; lastPulseT.current = Date.now(); setPulse(100); setPulseActive(true); pulseActiveRef.current = true; setFeverPop(Date.now()); feverSV.value = withTiming(1, { duration: 300 }); doShake(10); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, [feverSV, doShake]);

  // Practice: change playback speed mid-song without a time jump, keeping the highway + audio in sync.
  const applyRate = useCallback((r: number) => {
    const off = settings.audioOffset / 1000;
    const curT = jsTime();
    rateRef.current = r; setRate(r);
    clockStart.current = Date.now() - pauseAccum.current - ((curT - off) / r) * 1000;
    try { player.setPlaybackRate(r, "high"); } catch {}
    if (countdown <= 0 && !paused) startClock(curT);
  }, [jsTime, player, settings.audioOffset, countdown, paused, startClock]);

  // Practice A/B loop jump: seek audio + highway back to `to`, and let notes from there replay.
  const jumpTo = useCallback((to: number) => {
    const off = settings.audioOffset / 1000;
    try { player.seekTo(to); } catch {}
    clockStart.current = Date.now() - pauseAccum.current - ((to - off) / rateRef.current) * 1000;
    let idx = 0; while (idx < sorted.length && sorted[idx].time < to - 0.001) idx++;
    scanStart.current = idx;
    for (const n of sorted) if (n.time >= to - 0.001) resolved.current.delete(n.id);
    comboRef.current = 0; setCombo(0); setActiveHold(null);
    startClock(to);
  }, [player, settings.audioOffset, sorted, startClock]);

  const finish = useCallback(async () => {
    if (!chart || !selectedSong || finishing.current) return; finishing.current = true; player.pause(); cancelAnimation(clock);
    if (tutorial) { const first = !settings.tutorialDone; updateSettings({ tutorialDone: true }); setTestChart(null); if (first) await award(200, "Tutorial complete!"); router.replace("/"); return; }
    if (testChart) { router.back(); return; } // testing a custom chart returns to the editor, no score saved
    if (practiceRef.current) { router.back(); return; } // practice runs aren't scored
    const total = chart.notes.length; const c = counts.current; const remaining = chart.notes.filter(n => !resolved.current.has(n.id)).length; if (remaining) c.MISS += remaining;
    const hits = c.PERFECT + c.GREAT + c.GOOD; // any successful hit counts fully — no misses = 100%
    const acc = total ? Math.round((hits / total) * 10000) / 100 : 0;
    const stars = starsFor(acc);
    const result: ScoreResult = { songId: selectedSong.id, title: selectedSong.title, difficulty: selectedDifficulty, score: scoreRef.current, accuracy: acc, maxCombo: maxCombo.current, stars, perfect: c.PERFECT, great: c.GREAT, good: c.GOOD, miss: c.MISS, totalNotes: total, createdAt: Date.now(), coverArt: selectedSong.coverArt, accent: selectedSong.accent };
    await gameComplete("Vocotap", 0); // count the game; reward is star-based below
    const earned = await award(starlitesFor(stars), `${stars}★ · ${selectedSong.title}`, true);
    const bonus = milestoneBonusRef.current;
    if (bonus > 0) await award(bonus, "Combo milestones", true);
    result.perfectPlus = perfectPlusRef.current;
    const xp = xpForRun(result); const lv = await addXp(xp);
    let lvReward = 0; for (let L = lv.levelBefore + 1; L <= lv.levelAfter; L++) lvReward += levelUpReward(L);
    if (lvReward) await award(lvReward, `Reached level ${lv.levelAfter}`, true);
    Object.assign(result, { xpGained: xp, xpBefore: lv.xpBefore, levelBefore: lv.levelBefore, levelAfter: lv.levelAfter, levelReward: lvReward });
    const cr = await claimCrowns(result);
    if (cr.bonus) await award(cr.bonus, `${cr.crown === "diamond" ? "Diamond" : "Gold"} crown · ${selectedSong.title}`, true);
    result.crownBonus = cr.bonus; result.crownNew = cr.crown;
    result.starlitesEarned = earned + bonus + lvReward + cr.bonus;
    await saveResult(result); setTestChart(null); router.replace("/results");
  }, [chart, selectedSong, selectedDifficulty, saveResult, gameComplete, award, player, clock, setTestChart, tutorial, settings.tutorialDone, updateSettings]);

  // Countdown → start audio + clock. Waits until the audio is actually loaded so playback never
  // starts silent/out of sync; a 2.5s fallback guarantees the game still begins if loading stalls.
  useEffect(() => {
    if (!chart || !selectedSong?.uri || startedRef.current || !(status.isLoaded || forceStart)) return;
    startedRef.current = true;
    let v = 3; setCountdown(v);
    countdownTimer.current = setInterval(() => { v -= 1; setCountdown(v); if (v <= 0) { clearInterval(countdownTimer.current); setGoPop(Date.now()); scanStart.current = 0; clockStart.current = Date.now(); pauseAccum.current = 0; try { player.seekTo(0); if (rateRef.current !== 1) player.setPlaybackRate(rateRef.current, "high"); player.play(); } catch {} startClock(0); } }, 720);
  }, [chart, selectedSong?.uri, status.isLoaded, forceStart, player, startClock]);
  useEffect(() => { const t = setTimeout(() => setForceStart(true), 2500); return () => clearTimeout(t); }, []);
  useEffect(() => () => { if (countdownTimer.current) clearInterval(countdownTimer.current); try { player.pause(); } catch {} cancelAnimation(clock); }, [player, clock]);

  useEffect(() => { ensureHitAudio().then(uri => hitPlayer.replace({ uri })).catch(() => {}); }, [hitPlayer]);
  useEffect(() => { if (!judgment) return; judgeAnim.setValue(0); Animated.sequence([Animated.spring(judgeAnim, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }), Animated.delay(260), Animated.timing(judgeAnim, { toValue: 0, duration: 160, useNativeDriver: true })]).start(); }, [judgment, judgeAnim]);
  useEffect(() => { if (combo <= 2) return; comboAnim.setValue(1); Animated.spring(comboAnim, { toValue: 0, friction: 4, tension: 160, useNativeDriver: true }).start(); }, [combo, comboAnim]);
  useEffect(() => { if (!feverPop) return; feverAnim.setValue(0); Animated.sequence([Animated.spring(feverAnim, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }), Animated.delay(700), Animated.timing(feverAnim, { toValue: 0, duration: 260, useNativeDriver: true })]).start(); }, [feverPop, feverAnim]);
  useEffect(() => { if (!goPop) return; goAnim.setValue(0); Animated.sequence([Animated.spring(goAnim, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }), Animated.delay(250), Animated.timing(goAnim, { toValue: 0, duration: 260, useNativeDriver: true })]).start(); }, [goPop, goAnim]);
  useEffect(() => { if (!tracePop) return; traceAnim.setValue(0); Animated.sequence([Animated.spring(traceAnim, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }), Animated.delay(560), Animated.timing(traceAnim, { toValue: 0, duration: 240, useNativeDriver: true })]).start(); }, [tracePop, traceAnim]);
  useEffect(() => { if (!milestone) return; milestoneAnim.setValue(0); Animated.sequence([Animated.spring(milestoneAnim, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }), Animated.delay(900), Animated.timing(milestoneAnim, { toValue: 0, duration: 280, useNativeDriver: true })]).start(); }, [milestone, milestoneAnim]);
  // Capture which achievements were ALREADY unlocked when the run started, so mid-run pops only fire for NEW ones.
  useEffect(() => { const list = computeAchievements({ scores, charts, songs, points: stars.points, streak: stars.streak, games: stars.games }); unlockedAtStart.current = new Set(list.filter(a => a.unlocked).map(a => a.id)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!achToast) return; achAnim.setValue(0); Animated.sequence([Animated.spring(achAnim, { toValue: 1, friction: 6, tension: 110, useNativeDriver: true }), Animated.delay(2200), Animated.timing(achAnim, { toValue: 0, duration: 300, useNativeDriver: true })]).start(); }, [achToast, achAnim]);

  // Game loop @150ms — pointer-based scan (O(visible)), miss detection, throttled HUD sync.
  useEffect(() => {
    if (!chart || countdown > 0) return;
    const tick = setInterval(() => {
      if (paused || finishing.current) return;
      const t = jsTime();
      if (practiceRef.current && loopBRef.current != null && loopARef.current != null && t >= loopBRef.current) { jumpTo(loopARef.current); return; }
      if (pendingSwipe.current && Date.now() - pendingSwipe.current.t > 550) failSwipe();
      let missLane = -1;
      // Advance the start pointer past notes that have fully passed; flag any unhit ones as misses.
      while (scanStart.current < sorted.length && t - sorted[scanStart.current].time > 0.42) {
        const n = sorted[scanStart.current];
        if (!resolved.current.has(n.id)) { resolved.current.add(n.id); counts.current.MISS += 1; comboRef.current = 0; missLane = n.lane; }
        scanStart.current++;
      }
      const ids: string[] = [];
      for (let j = scanStart.current; j < sorted.length; j++) { const n = sorted[j]; if (n.time - t > lookahead) break; if (!resolved.current.has(n.id)) ids.push(n.id); }
      setWindowIds(prev => (prev.length === ids.length && prev.every((id, i) => id === ids[i])) ? prev : ids);
      // Wavy visibility is TIME-based and independent of hit/resolved state, so tapping/tracing a wavy
      // note never makes its ribbon vanish. It stays on screen from spawn until its tail passes the receptor.
      const wids: string[] = [];
      for (const n of wavyNotes) { const d = n.duration || 0.4; if (t >= n.time - lookahead - 0.15 && t <= n.time + d + 0.35) wids.push(n.id); }
      setWavyIds(prev => (prev.length === wids.length && prev.every((id, i) => id === wids[i])) ? prev : wids);
      if (missLane >= 0) { rockRef.current = Math.max(0, rockRef.current - 6); judgeRef.current = { grade: "MISS", lane: missLane }; doShake(4); if (pulseActiveRef.current) { missStreakRef.current += 1; fuelRef.current -= 34 * missStreakRef.current; if (missStreakRef.current >= 3) fuelRef.current = 0; } else pulseBase.current = comboRef.current; }
      // Sync HUD from refs (taps only touch refs, so this is the single place we re-render — keeps rapid tapping instant).
      setCombo(c => (c === comboRef.current ? c : comboRef.current));
      setRock(r => (r === rockRef.current ? r : rockRef.current));
      setScore(s => (s === scoreRef.current ? s : scoreRef.current));
      if (pulseActiveRef.current) {
        // Fuel drains fully in ~5s if idle; each hit refuels, misses drain it faster.
        const now = Date.now(); const dt = lastPulseT.current ? Math.min(0.25, (now - lastPulseT.current) / 1000) : 0.08; lastPulseT.current = now;
        fuelRef.current -= 20 * dt;
        if (fuelRef.current <= 0) { fuelRef.current = 0; setPulseActive(false); pulseActiveRef.current = false; feverSV.value = withTiming(0, { duration: 400 }); pulseBase.current = comboRef.current; missStreakRef.current = 0; setPulse(0); }
        else setPulse(p => { const v = fuelRef.current; return Math.abs(p - v) < 0.8 ? p : v; });
      } else {
        lastPulseT.current = 0;
        const pv = Math.min(100, Math.max(0, ((comboRef.current - pulseBase.current) / 25) * 100));
        if (pv >= 100) triggerPulse(); else setPulse(p => (p === pv ? p : pv));
      }
      if (judgeRef.current) { showJudge(judgeRef.current.grade, judgeRef.current.lane, !!judgeRef.current.plus, judgeRef.current.early ?? null, judgeRef.current.flick); judgeRef.current = null; }
      if (!practiceRef.current && !testChart) {
        for (const d of LIVE_ACH) {
          if (achPopped.current.has(d.id) || unlockedAtStart.current.has(d.id)) continue;
          if (d.test(comboRef.current, scoreRef.current)) { achPopped.current.add(d.id); setAchToast({ title: d.title, icon: d.icon, tier: d.tier, key: Date.now() }); if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break; }
        }
      }
      tickCount.current++;
      if (tickCount.current % 3 === 0) {
        const c = counts.current; const done = c.PERFECT + c.GREAT + c.GOOD + c.MISS;
        setAccuracy(done ? Math.round(((c.PERFECT + c.GREAT + c.GOOD) / done) * 1000) / 10 : 100);
        setProgress(Math.min(1, t / duration));
      }
      if (rockRef.current <= 0 && !settings.noFail) { finish(); return; }
      if (t >= duration - 0.05) finish();
    }, 150);
    return () => clearInterval(tick);
  }, [chart, countdown, paused, jsTime, lookahead, duration, finish, showJudge, sorted, wavyNotes, settings.noFail, settings.haptics, triggerPulse, jumpTo, testChart, doShake, feverSV, failSwipe]);

  // Hold / wavy sustain. Holds need the start lane held; WAVY notes must be FOLLOWED across
  // lanes (the required lane changes along the path) to keep scoring. Early release grays out
  // but never breaks combo.
  useEffect(() => {
    if (!activeHold) return;
    const note = activeHold; const dur = note.duration || 0.4; const end = note.time + dur; const isWavy = note.type === "wavy";
    let litLane = isWavy ? wavyLaneAt(note, jsTime()) : note.lane;
    laneFlash[litLane].setValue(1);
    if (isWavy) traceX.value = geo.cx + laneFrac(litLane) * geo.hw;
    let followTicks = 0, totalTicks = 0;
    const timer = setInterval(() => {
      const t = jsTime();
      const reqLane = isWavy ? wavyLaneAt(note, t) : note.lane;
      if (reqLane !== litLane) { Animated.timing(laneFlash[litLane], { toValue: 0, duration: 120, useNativeDriver: true }).start(); litLane = reqLane; laneFlash[litLane].setValue(1); }
      const following = pressed.has(reqLane);
      if (isWavy) { totalTicks++; if (following) followTicks++; traceGlow.value = withTiming(following ? 1 : 0.25, { duration: 90 }); traceX.value = withTiming(geo.cx + laneFrac(reqLane) * geo.hw, { duration: 70 }); }
      if (!isWavy && !following && t < end - 0.1) { setActiveHold(null); return; } // hold released early → stop scoring
      if (following) scoreRef.current += Math.round(24 * (pulseActive ? 2 : 1));
      if (t >= end) {
        setActiveHold(null);
        if (following) scoreRef.current += Math.round(400 * (pulseActive ? 2 : 1));
        if (isWavy && totalTicks > 0 && followTicks / totalTicks >= 0.7) {
          const perfect = followTicks / totalTicks >= 0.9;
          scoreRef.current += Math.round((perfect ? 1200 : 500) * (pulseActive ? 2 : 1));
          setTracePop({ key: Date.now(), perfect, x: geo.cx + laneFrac(wavyLaneAt(note, end)) * geo.hw });
          if (perfect) { if (fx) for (let l = 0; l < 4; l++) fireBurst(l); doShake(7); }
          if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }, 80);
    return () => { clearInterval(timer); Animated.timing(laneFlash[litLane], { toValue: 0, duration: 200, useNativeDriver: true }).start(); traceGlow.value = withTiming(0, { duration: 150 }); };
  }, [activeHold, jsTime, laneFlash, pulseActive, pressed, traceGlow, traceX, geo, settings.haptics, fx, fireBurst, doShake]);

  // Glowing spark that rides the receptor line following the traced wavy lane — brighter while on-track.
  const traceSparkStyle = useAnimatedStyle(() => ({ opacity: traceGlow.value, transform: [{ translateX: traceX.value }, { translateY: geo.bottomY }, { scale: 0.7 + traceGlow.value * 0.6 }] }));

  // Taps only mutate refs + fire native-thread animations — no React state, so rapid/back-to-back tapping stays instant.
  // Scores a resolved hit. Swipe notes land here only after a correct flick (or instantly on keyboard).
  const applyHit = useCallback((target: Note, grade: Judgment, plus: boolean, early: boolean | null, lane: number, flick?: SwipeDir) => {
    if (plus) perfectPlusRef.current += 1;
    resolved.current.add(target.id); counts.current[grade] += 1;
    comboRef.current += 1; maxCombo.current = Math.max(maxCombo.current, comboRef.current);
    if (milestoneIdx.current < MILESTONES.length && comboRef.current >= MILESTONES[milestoneIdx.current]) {
      const mi = milestoneIdx.current; milestoneIdx.current += 1;
      const scored = !practiceRef.current && !testChart;
      if (scored) milestoneBonusRef.current += MBONUS[mi];
      setMilestone({ combo: MILESTONES[mi], bonus: scored ? MBONUS[mi] : 0, key: Date.now() }); doShake(8);
      if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (pulseActiveRef.current) { fuelRef.current = Math.min(100, fuelRef.current + 26); missStreakRef.current = 0; }
    const multiplier = Math.min(4, 1 + Math.floor(comboRef.current / 10)) * (pulseActive ? 2 : 1);
    scoreRef.current += Math.round(1000 * weights[grade] * multiplier * (plus ? 1.15 : 1)) + (flick ? 300 * multiplier : 0);
    rockRef.current = Math.min(100, rockRef.current + (grade === "PERFECT" ? 3 : 1));
    judgeRef.current = { grade, lane, plus, early, flick }; flashLane(lane); if (fx) fireBurst(lane);
    if (target.type === "hold" || target.type === "wavy") setActiveHold(target);
    // Fire SFX/haptics off the touch handler so the hit registers instantly.
    if (settings.hitSfx) setTimeout(() => { try { hitPlayer.seekTo(0); hitPlayer.play(); } catch {} }, 0);
    if (settings.haptics) Haptics.impactAsync(grade === "PERFECT" || flick ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
  }, [pulseActive, flashLane, settings.haptics, settings.hitSfx, hitPlayer, testChart, fx, fireBurst, doShake]);


  const hitLane = useCallback((lane: number, touch?: { id: string; x: number; y: number }) => {
    if (!chart || countdown > 0 || paused) return;
    const t = jsTime();
    let target: Note | undefined; let best = Infinity;
    for (let j = scanStart.current; j < sorted.length; j++) { const n = sorted[j]; if (n.time - t > 0.5) break; if (n.lane !== lane || resolved.current.has(n.id)) continue; const d = Math.abs(n.time - t); if (d < best) { best = d; target = n; } }
    if (!target || best > 0.42) { flashLane(lane); return; }
    const grade: Judgment = best <= 0.11 ? "PERFECT" : best <= 0.24 ? "GREAT" : "GOOD";
    const plus = best <= 0.045; const early = grade === "PERFECT" ? null : target.time > t;
    if (target.type === "swipe" && target.dir) {
      // Touch: grab the arrow now, score it once the finger flicks the right way. Keyboard: flick is implied.
      if (touch) { if (pendingSwipe.current) failSwipe(); resolved.current.add(target.id); pendingSwipe.current = { note: target, grade, plus, early, lane, id: touch.id, x: touch.x, y: touch.y, t: Date.now() }; flashLane(lane); return; }
      applyHit(target, grade, plus, early, lane, target.dir); return;
    }
    applyHit(target, grade, plus, early, lane);
  }, [chart, countdown, paused, jsTime, sorted, flashLane, applyHit, failSwipe]);

  const onPadsTouchStart = (e: any) => { for (const tt of e.nativeEvent.changedTouches) { const lane = Math.max(0, Math.min(3, Math.floor((tt.locationX ?? tt.pageX) / (width / 4)))); touchLane.current[String(tt.identifier)] = lane; pressed.add(lane); hitLane(lane, { id: String(tt.identifier), x: tt.pageX, y: tt.pageY }); } };
  // Dragging a finger across lanes retargets the held lane in real time — this is how WAVY notes get TRACED (not just held).
  const onPadsTouchMove = (e: any) => { for (const tt of e.nativeEvent.changedTouches) { const key = String(tt.identifier);
    const ps = pendingSwipe.current;
    if (ps && ps.id === key) { const dx = tt.pageX - ps.x, dy = tt.pageY - ps.y; if (dx * dx + dy * dy >= 22 * 22) { const dir: SwipeDir | null = -dy > Math.abs(dx) ? "up" : Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? "left" : "right") : null; pendingSwipe.current = null; if (dir === ps.note.dir) applyHit(ps.note, ps.grade, ps.plus, ps.early, ps.lane, dir); else { pendingSwipe.current = ps; failSwipe(); } continue; } } const prev = touchLane.current[key]; if (prev === undefined) continue; const lane = Math.max(0, Math.min(3, Math.floor((tt.locationX ?? tt.pageX) / (width / 4)))); if (lane !== prev) { pressed.delete(prev); pressed.add(lane); touchLane.current[key] = lane; flashLane(lane); } } };
  const onPadsTouchEnd = (e: any) => { for (const tt of e.nativeEvent.changedTouches) { const key = String(tt.identifier); if (pendingSwipe.current?.id === key) failSwipe(); const lane = touchLane.current[key]; if (lane !== undefined) { pressed.delete(lane); delete touchLane.current[key]; } } };

  // Desktop keyboard controls: D/F/J/K (or arrow keys) drive the 4 lanes.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const kb = (settings.keyBindings && settings.keyBindings.length === 4 ? settings.keyBindings : ["a", "s", "d", "f"]).map(k => (k || "").toLowerCase());
    const map: Record<string, number> = { arrowleft: 0, arrowup: 1, arrowdown: 2, arrowright: 3 };
    kb.forEach((k, i) => { if (k) map[k] = i; });
    const laneFor = (key: string) => (key ? map[key.toLowerCase()] : undefined);
    const down = (ev: any) => { const lane = laneFor(ev.key); if (lane === undefined || ev.repeat) return; ev.preventDefault(); pressed.add(lane); hitLane(lane); };
    const up = (ev: any) => { const lane = laneFor(ev.key); if (lane === undefined) return; pressed.delete(lane); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [hitLane, pressed, settings.keyBindings]);
  const togglePause = () => { if (paused) { pauseAccum.current += Date.now() - pauseAt.current; player.play(); startClock(jsTime() - settings.audioOffset / 1000); } else { pauseAt.current = Date.now(); player.pause(); cancelAnimation(clock); } setPaused(!paused); };
  const restart = () => { player.seekTo(0); cancelAnimation(clock); clock.value = 0; scanStart.current = 0; pulseBase.current = 0; fuelRef.current = 0; missStreakRef.current = 0; lastPulseT.current = 0; rockRef.current = 70; resolved.current.clear(); counts.current = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 }; scoreRef.current = 0; comboRef.current = 0; perfectPlusRef.current = 0; pendingSwipe.current = null; feverSV.value = 0; milestoneIdx.current = 0; milestoneBonusRef.current = 0; setScore(0); setCombo(0); setRock(70); setAccuracy(100); setProgress(0); setPulse(0); setPulseActive(false); setPaused(false); setActiveHold(null); clockStart.current = Date.now(); pauseAccum.current = 0; try { if (rateRef.current !== 1) player.setPlaybackRate(rateRef.current, "high"); } catch {} player.play(); startClock(0); };

  const visibleNotes = useMemo(() => { if (!chart) return []; const set = new Set(windowIds); return chart.notes.filter(n => set.has(n.id)); }, [chart, windowIds]);
  const visibleWavy = useMemo(() => { const set = new Set(wavyIds); return wavyNotes.filter(n => set.has(n.id)); }, [wavyNotes, wavyIds]);
  if (!chart || !selectedSong?.uri) return <View style={styles.missing}><Text selectable={false} style={styles.missingTitle}>Chart not ready</Text><Text selectable={false} style={styles.missingCopy}>Build a chart for this track, then jump back in.</Text><NeonButton testID="game-back-to-library-button" label="Build a chart" icon="analytics" onPress={() => router.replace("/library")} /></View>;

  const padW = width / 4;
  const pulseReady = pulse >= 100;
  const charged = pulseReady || pulseActive;
  const liveStars = starsFor(accuracy);
  const beat = Math.max(0.25, Math.min(1.2, 60 / (chart.bpm || 120)));
  const mult = Math.min(4, 1 + Math.floor(combo / 10)) * (pulseActive ? 2 : 1);
  const hpColor = rock < 30 ? "#FF0044" : rock < 60 ? "#FFD600" : "#CCFF00";
  const cc = comboColor(combo);
  const jColor = judgment ? judgeColor(judgment.grade, judgment.plus) : "#fff";

  return <View style={styles.root} testID="gameplay-screen">
    <Backdrop coverArt={selectedSong.coverArt} grayscale={settings.grayscaleCovers} theme={prog.theme} w={width} h={height} horizon={geo.topY + geo.span * 0.32} />
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ translateX: shake }, { translateY: shake.interpolate({ inputRange: [-10, 10], outputRange: [4, -4] }) }] }]}>
    <Grid geo={geo} w={width} h={height} tint={skin.glow} fever={pulseActive} />
    <View pointerEvents="none" style={StyleSheet.absoluteFill}><BeatLines beat={beat} clock={clock} lookahead={lookahead} geo={geo} fever={feverSV} /></View>
    {pulseActive && <LinearGradient pointerEvents="none" colors={["rgba(255,214,0,0.16)", "rgba(255,45,122,0.14)", "rgba(181,55,255,0.18)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}

    {/* Highway note layer (native-thread animated, memoized) */}
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <WavyLayer notes={visibleWavy} clock={clock} lookahead={lookahead} geo={geo} />
      <NotesLayer notes={visibleNotes} clock={clock} lookahead={lookahead} geo={geo} special={charged} rainbow={rainbow} />
      {activeHold && <ActiveHoldBar note={activeHold} clock={clock} lookahead={lookahead} geo={geo} />}
    </View>

    <Receptors geo={geo} flash={laneFlash} />
    <LaneBursts geo={geo} burst={laneBurst} sparks={fx} />
    {activeHold?.type === "wavy" && <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: -geo.laneW * 0.35, top: -geo.laneW * 0.35, width: geo.laneW * 0.7, height: geo.laneW * 0.7, borderRadius: geo.laneW * 0.35, backgroundColor: "rgba(255,255,255,0.9)", shadowColor: laneColors[wavyLaneAt(activeHold, 0)], shadowOpacity: 1, shadowRadius: 22, elevation: 12 }, traceSparkStyle]}>
      <View style={{ position: "absolute", top: geo.laneW * 0.16, left: geo.laneW * 0.16, right: geo.laneW * 0.16, bottom: geo.laneW * 0.16, borderRadius: geo.laneW * 0.2, backgroundColor: laneColors[activeHold.lane] }} />
    </Reanimated.View>}
    </Animated.View>

    {/* Combo */}
    {combo > 2 && <Animated.View pointerEvents="none" style={[styles.comboWrap, { top: geo.topY + geo.span * 0.1, transform: [{ scale: comboAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] }) }] }]}>
      <Text selectable={false} style={[styles.combo, { color: cc, textShadowColor: cc }]}>{combo}</Text>
      <Text selectable={false} style={styles.comboLabel}>COMBO</Text>
      {mult > 1 && <View style={[styles.multChip, { borderColor: cc }]}><Text selectable={false} style={[styles.multText, { color: cc }]}>×{mult}</Text></View>}
    </Animated.View>}

    {/* Judgment (per-lane, mid highway) */}
    {judgment && <Animated.View key={`j${judgment.key}`} pointerEvents="none" style={[styles.judgeWrap, { left: judgment.x - 100, top: judgment.y, opacity: judgeAnim, transform: [{ scale: judgeAnim.interpolate({ inputRange: [0, 1], outputRange: [1.7, 1] }) }] }]}>
      <Text selectable={false} testID="judgment-text" style={[styles.judgment, { color: jColor, textShadowColor: jColor }]}>{judgment.grade === "PERFECT" && judgment.plus ? "PERFECT+" : judgment.grade}</Text>
      {judgment.flick && <Text selectable={false} testID="judgment-flick" style={[styles.judgeTiming, { color: "#FFD600", fontSize: 13 }]}>FLICK {ARROW_CH[judgment.flick]}</Text>}
      {!judgment.flick && judgment.early != null && judgment.grade !== "MISS" && <Text selectable={false} style={[styles.judgeTiming, { color: judgment.early ? "#00E5FF" : "#FF8A00" }]}>{judgment.early ? "FAST" : "SLOW"}</Text>}
    </Animated.View>}
    {feverPop > 0 && <Animated.View key={`f${feverPop}`} pointerEvents="none" style={[styles.feverPop, { top: geo.topY + geo.span * 0.24, opacity: feverAnim, transform: [{ scale: feverAnim.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) }] }]}>
      <Text selectable={false} style={styles.feverText}>VOCOPULSE!</Text><Text selectable={false} style={styles.feverSub}>FEVER · ×2 SCORE</Text>
    </Animated.View>}
    {goPop > 0 && <Animated.View key={`g${goPop}`} pointerEvents="none" style={[styles.feverPop, { top: geo.topY + geo.span * 0.3, opacity: goAnim, transform: [{ scale: goAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.1] }) }] }]}><Text selectable={false} style={styles.goText}>GO!</Text></Animated.View>}
    {tracePop?.perfect && fx && <View key={`ts${tracePop.key}`} pointerEvents="none" style={StyleSheet.absoluteFill}>{Array.from({ length: 14 }).map((_, i) => { const ang = (i / 14) * Math.PI * 2; const d = 70 + (i % 3) * 22; return <Animated.View key={i} style={{ position: "absolute", left: tracePop.x - 5, top: geo.bottomY - 40, width: 10, height: 10, borderRadius: 5, backgroundColor: i % 2 ? "#FFD600" : "#FFFFFF", opacity: traceAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }), transform: [{ translateX: traceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(ang) * d] }) }, { translateY: traceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(ang) * d] }) }] }} />; })}</View>}
    {tracePop && <Animated.View key={`t${tracePop.key}`} testID={tracePop.perfect ? "perfect-trace-pop" : "trace-pop"} pointerEvents="none" style={[styles.tracePop, { top: geo.bottomY - 150, left: geo.cx - 150, opacity: traceAnim, transform: [{ translateY: traceAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }, { scale: traceAnim.interpolate({ inputRange: [0, 1], outputRange: [tracePop.perfect ? 1.6 : 0.8, 1] }) }] }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Ionicons name="sparkles" size={17} color={tracePop.perfect ? "#FFD600" : laneColors[1]} /><Text selectable={false} style={[styles.tracePopText, tracePop.perfect && styles.perfectTraceText]}>{tracePop.perfect ? "PERFECT TRACE!" : "Nice trace!"}</Text></View>
      <Text selectable={false} style={styles.traceBonus}>+{tracePop.perfect ? 1200 : 500}</Text>
    </Animated.View>}
    {milestone && <Animated.View key={`m${milestone.key}`} pointerEvents="none" style={[styles.milestone, { top: geo.topY + geo.span * 0.3, left: geo.cx - 150, opacity: milestoneAnim, transform: [{ scale: milestoneAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>
      <Text selectable={false} style={styles.milestoneCombo}>{milestone.combo} COMBO!</Text>
      {milestone.bonus > 0 && <View style={styles.milestoneBonus}><Ionicons name="sparkles" size={13} color={colors.gold} /><Text selectable={false} style={styles.milestoneBonusText}>+{milestone.bonus} Starlites</Text></View>}
    </Animated.View>}
    {achToast && <Animated.View key={`a${achToast.key}`} pointerEvents="none" style={[styles.achToast, { top: insets.top + 70, borderColor: TIER_COLOR[achToast.tier], opacity: achAnim, transform: [{ translateY: achAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }, { scale: achAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
      <View style={[styles.achToastIcon, { backgroundColor: TIER_COLOR[achToast.tier] }]}><Ionicons name={achToast.icon} size={20} color={colors.bg} /></View>
      <View style={{ flex: 1 }}><Text selectable={false} style={styles.achToastLabel}>ACHIEVEMENT UNLOCKED</Text><Text selectable={false} style={styles.achToastTitle} numberOfLines={1}>{achToast.title}</Text></View>
      <Ionicons name="trophy" size={18} color={TIER_COLOR[achToast.tier]} />
    </Animated.View>}

    {/* Top HUD */}
    <View style={[styles.hud, { top: insets.top + 6 }]} pointerEvents="box-none">
      <View style={styles.progTrack}><LinearGradient colors={[skin.glow, colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progFill, { width: `${progress * 100}%` }]} /></View>
      <View style={styles.hudRow}>
        <View style={{ flex: 1 }}>
          <Text selectable={false} style={styles.scoreLabel}>SCORE</Text>
          <Text selectable={false} testID="hud-score" style={[styles.score, { textShadowColor: skin.glow }]}>{score.toLocaleString()}</Text>
          <Text selectable={false} style={styles.songMeta} numberOfLines={1}>{selectedSong.title} · {selectedDifficulty.toUpperCase()}</Text>
        </View>
        <View style={styles.hudRight}>
          <View style={styles.liveStars}>{[0, 1, 2, 3, 4].map(n => { const full = liveStars >= n + 1; const half = !full && liveStars >= n + 0.5; return <Ionicons key={n} name={full ? "star" : half ? "star-half" : "star-outline"} size={13} color={full || half ? colors.gold : "rgba(255,255,255,0.28)"} />; })}</View>
          <Text selectable={false} style={styles.accText}>{accuracy.toFixed(1)}%</Text>
        </View>
        <Pressable testID="pause-game-button" onPress={togglePause} style={styles.pause}><Ionicons name="pause" size={18} color={colors.cyan} /></Pressable>
      </View>
      <View style={styles.hpRow}><Ionicons name="heart" size={13} color={hpColor} /><View style={styles.hpTrack}><View testID="hud-health" style={[styles.hpFill, { width: `${rock}%`, backgroundColor: hpColor, shadowColor: hpColor }]} /></View></View>
    </View>

    {tutorial && (() => { const tt = progress * duration; const st = TUTORIAL_STEPS.find(x => tt >= x.from && tt < x.to) || TUTORIAL_STEPS[0]; return <View testID="tutorial-banner" pointerEvents="none" style={[styles.tutBanner, { top: insets.top + 104 }]}>
      <Text selectable={false} style={styles.tutStep}>TUTORIAL · {st.title}</Text>
      <Text selectable={false} style={styles.tutCopy}>{st.copy}</Text>
    </View>; })()}

    {/* Practice controls — speed + A/B loop (practice mode only) */}
    {practice && <View testID="practice-bar" style={[styles.practice, { top: insets.top + 104 }]} pointerEvents="box-none">
      <View style={styles.practiceRow}>
        <View style={styles.practiceTag}><Ionicons name="school" size={12} color={colors.cyan} /><Text selectable={false} style={styles.practiceTagText}>PRACTICE</Text></View>
        {SPEEDS.map(s => <Pressable key={s} testID={`practice-speed-${s}`} onPress={() => applyRate(s)} style={[styles.spdChip, rate === s && styles.spdChipOn]}><Text selectable={false} style={[styles.spdChipText, rate === s && styles.spdChipTextOn]}>{s}×</Text></Pressable>)}
      </View>
      <View style={styles.practiceRow}>
        <Pressable testID="practice-set-a" onPress={() => setLoopA(Math.max(0, jsTime()))} style={styles.loopBtn}><Text selectable={false} style={styles.loopBtnText}>A {loopA != null ? `· ${Math.floor(loopA / 60)}:${String(Math.floor(loopA % 60)).padStart(2, "0")}` : ""}</Text></Pressable>
        <Pressable testID="practice-set-b" onPress={() => { const b = jsTime(); if (loopA != null && b > loopA + 0.5) setLoopB(b); }} style={styles.loopBtn}><Text selectable={false} style={styles.loopBtnText}>B {loopB != null ? `· ${Math.floor(loopB / 60)}:${String(Math.floor(loopB % 60)).padStart(2, "0")}` : ""}</Text></Pressable>
        <Pressable testID="practice-clear-loop" onPress={() => { setLoopA(null); setLoopB(null); }} style={[styles.loopBtn, styles.loopClear]}><Ionicons name="close" size={13} color={colors.pink} /><Text selectable={false} style={[styles.loopBtnText, { color: colors.pink }]}>Loop</Text></Pressable>
      </View>
    </View>}

    {/* VOCO / Vocopulse meter — auto-fires when full */}
    <View testID="vocopulse-meter" style={[styles.voco, { bottom: PAD_BOTTOM - 54 }, (pulseReady || pulseActive) && styles.vocoReady]}>
      <Ionicons name="flame" size={20} color={pulseActive ? "#FFD600" : pulseReady ? "#FF8A00" : "rgba(255,138,0,0.8)"} />
      <Text selectable={false} style={[styles.vocoLabel, pulseActive && { color: "#FFD600" }]}>{pulseActive ? "FEVER" : "PULSE"}</Text>
      <View style={styles.vocoTrack}><Animated.View style={[styles.vocoFill, { width: pulseAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }]}><LinearGradient colors={pulseActive ? ["#FFD600", "#FF2D7A"] : ["#FF2D7A", "#B537FF", "#00E5FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} /></Animated.View></View>
      <Text selectable={false} style={[styles.vocoMult, (pulseReady || pulseActive) && { color: "#FFB020" }]}>{pulseActive ? "2×" : "1×"}</Text>
    </View>

    {/* Tap pads — single multi-touch surface (supports simultaneous lanes + rapid taps) */}
    <View style={[styles.pads, { height: PAD_H, bottom: PAD_BOTTOM }]} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onTouchStart={onPadsTouchStart} onTouchMove={onPadsTouchMove} onTouchEnd={onPadsTouchEnd} onTouchCancel={onPadsTouchEnd}>
      {settings.showLanePads && laneColors.map((c, l) => <Animated.View key={l} testID={`lane-${l + 1}-hit-pad`} pointerEvents="none" style={{ position: "absolute", left: l * padW + 3, width: padW - 6, top: 4, bottom: 4, borderRadius: 16, backgroundColor: c, opacity: laneFlash[l].interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }) }} />)}
    </View>

    {countdown > 0 && <View style={styles.countdown}><Avatar avatar={avatar} nickname={nickname} size={62} style={{ marginBottom: 14 }} /><Text selectable={false} style={styles.ready}>GET READY, {nickname.toUpperCase()}</Text><Text selectable={false} key={countdown} style={styles.count}>{countdown}</Text><Text selectable={false} style={styles.readySong}>{selectedSong.title}</Text></View>}

    <Modal visible={paused} transparent animationType="fade"><View style={styles.modal}><View style={styles.pauseCard}><View style={styles.pauseIcon}><Ionicons name="pause" size={28} color={colors.cyan} /></View><Text selectable={false} style={styles.pauseTitle}>Paused</Text><Text selectable={false} style={styles.pauseCopy}>The stage is holding your place.</Text><NeonButton testID="resume-game-button" label="Resume" icon="play" onPress={togglePause} /><NeonButton testID="restart-game-button" label="Restart" icon="refresh" variant="secondary" onPress={restart} /><NeonButton testID="exit-game-button" label={tutorial ? "Skip tutorial" : testChart ? "Back to editor" : practice ? "Exit practice" : "Exit song"} icon="close" variant="danger" onPress={() => { player.pause(); cancelAnimation(clock); if (tutorial) { updateSettings({ tutorialDone: true }); setTestChart(null); router.replace("/"); } else if (testChart) { setTestChart(null); router.back(); } else if (practice) { router.back(); } else { router.replace("/library"); } }} /></View></View></Modal>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#06051A", overflow: "hidden" },
  cover: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", opacity: 0.5, transform: [{ scale: 1.2 }] },
  note: { alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.55)" },
  noteGloss: { position: "absolute", top: 1.5, left: 4, right: 4, height: "42%", backgroundColor: "rgba(255,255,255,0.35)" },
  receptor: { position: "absolute", height: 32, borderRadius: 16, borderWidth: 2.5, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,5,26,0.6)", shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  comboWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  combo: { fontSize: 54, lineHeight: 62, fontFamily: fonts.arcadeBlack, textShadowRadius: 22, textShadowOffset: { width: 0, height: 0 } }, comboLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, letterSpacing: 6, fontFamily: fonts.arcade, marginTop: -2 },
  multChip: { marginTop: 6, paddingHorizontal: 10, height: 22, borderRadius: 6, borderWidth: 1.5, justifyContent: "center", backgroundColor: "rgba(6,5,26,0.6)" }, multText: { fontSize: 12, fontFamily: fonts.arcadeBlack, letterSpacing: 1 },
  judgeWrap: { position: "absolute", width: 200, alignItems: "center" },
  judgment: { textAlign: "center", fontSize: 24, fontFamily: fonts.arcadeBlack, letterSpacing: 1.5, textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  judgeTiming: { fontSize: 10, fontFamily: fonts.arcade, letterSpacing: 3, marginTop: 1 },
  feverPop: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  feverText: { color: "#FFD600", fontSize: 40, fontFamily: fonts.arcadeBlack, letterSpacing: 2, ...textGlow("#FF8A00", 26) }, feverSub: { color: "#FFFFFF", fontSize: 12, fontFamily: fonts.arcade, letterSpacing: 4, marginTop: 2, ...textGlow("#FF2D7A", 12) },
  goText: { color: "#CCFF00", fontSize: 96, fontFamily: fonts.arcadeBlack, ...textGlow("#CCFF00", 30) },
  tracePop: { position: "absolute", width: 300, alignItems: "center", justifyContent: "center", gap: 2 },
  perfectTraceText: { color: "#FFD600", fontSize: 24, textShadowColor: "#FF8A00", textShadowRadius: 20 }, traceBonus: { color: "#FFFFFF", fontSize: 13, fontFamily: fonts.arcade, letterSpacing: 2 }, tracePopText: { color: "#EAF6FF", fontSize: 22, fontFamily: fonts.arcadeBlack, textShadowColor: "rgba(47,224,214,0.9)", textShadowRadius: 16 },
  milestone: { position: "absolute", width: 300, alignItems: "center", gap: 8 }, milestoneCombo: { color: colors.gold, fontSize: 36, fontFamily: fonts.arcadeBlack, textShadowColor: "rgba(245,200,66,0.85)", textShadowRadius: 20, letterSpacing: 1 }, milestoneBonus: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, height: 30, borderRadius: 15, backgroundColor: "rgba(245,200,66,0.16)", borderWidth: 1, borderColor: "rgba(245,200,66,0.5)" }, milestoneBonusText: { color: colors.gold, fontSize: 13, fontFamily: fonts.heavy },
  achToast: { position: "absolute", left: 24, right: 24, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 18, backgroundColor: "rgba(16,14,22,0.97)", borderWidth: 1.5, zIndex: 60, shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 16 }, achToastIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" }, achToastLabel: { color: colors.muted, fontSize: 9, letterSpacing: 1.6, fontFamily: fonts.heavy }, achToastTitle: { color: colors.text, fontSize: 17, fontFamily: fonts.display, marginTop: 2 },
  tutBanner: { position: "absolute", left: 24, right: 24, alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "rgba(6,5,26,0.82)", borderWidth: 1.5, borderColor: "#CCFF00", zIndex: 30 },
  tutStep: { color: "#CCFF00", fontSize: 12, fontFamily: fonts.arcadeBlack, letterSpacing: 2 }, tutCopy: { color: "#FFFFFF", fontSize: 14, fontFamily: fonts.bold, textAlign: "center", marginTop: 3 },
  practice: { position: "absolute", left: 12, right: 12, gap: 8, zIndex: 20 }, practiceRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" },
  practiceTag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, height: 30, borderRadius: 15, backgroundColor: "rgba(13,230,210,0.14)", borderWidth: 1, borderColor: "rgba(13,230,210,0.4)" }, practiceTagText: { color: colors.cyan, fontSize: 10, fontFamily: fonts.heavy, letterSpacing: 1 },
  spdChip: { minWidth: 46, height: 30, paddingHorizontal: 10, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" }, spdChipOn: { backgroundColor: colors.cyan, borderColor: colors.cyan }, spdChipText: { color: colors.text, fontSize: 13, fontFamily: fonts.heavy }, spdChipTextOn: { color: colors.bg },
  loopBtn: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: 62, height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", justifyContent: "center" }, loopClear: { borderColor: "rgba(255,92,122,0.5)" }, loopBtnText: { color: colors.text, fontSize: 12, fontFamily: fonts.heavy },
  hud: { position: "absolute", left: 16, right: 16 }, hudRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  scoreLabel: { color: colors.muted, fontSize: 9, letterSpacing: 3, fontFamily: fonts.arcade },
  score: { color: colors.text, fontSize: 28, lineHeight: 34, fontFamily: fonts.arcadeBlack, textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } }, songMeta: { color: "rgba(214,214,255,0.6)", fontSize: 11, fontFamily: fonts.bold, marginTop: 1, letterSpacing: 0.5 },
  hudRight: { alignItems: "flex-end", gap: 4 },
  pause: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,229,255,0.08)", borderWidth: 1, borderColor: "rgba(0,229,255,0.45)" },
  accText: { color: colors.text, fontSize: 13, fontFamily: fonts.arcade, textAlign: "right" },
  liveStars: { flexDirection: "row", alignItems: "center", gap: 1 },
  hpRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }, hpTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" }, hpFill: { height: 6, borderRadius: 3, shadowOpacity: 1, shadowRadius: 6 },
  progTrack: { height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }, progFill: { height: 3, borderRadius: 2 },
  voco: { position: "absolute", left: 18, right: 18, height: 44, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, backgroundColor: "rgba(6,5,26,0.7)", borderWidth: 1, borderColor: "rgba(255,138,0,0.35)" },
  vocoReady: { borderColor: "#FFD600", backgroundColor: "rgba(255,214,0,0.12)", ...neonGlow("#FFD600", 14, 0.6) },
  vocoLabel: { color: "rgba(255,200,120,0.9)", fontSize: 10, letterSpacing: 2, fontFamily: fonts.arcadeBlack, width: 50 }, vocoTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" }, vocoFill: { height: 8, borderRadius: 4 }, vocoMult: { color: "rgba(245,245,247,0.9)", fontSize: 14, fontFamily: fonts.arcadeBlack, width: 30, textAlign: "right" },
  pads: { position: "absolute", left: 0, right: 0, flexDirection: "row" }, pad: { flex: 1, margin: 3, borderRadius: 18 },
  countdown: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)", alignItems: "center", justifyContent: "center" }, ready: { color: colors.cyan, fontSize: 12, letterSpacing: 4, fontFamily: fonts.arcade, ...textGlow(colors.cyan, 10) }, count: { color: colors.text, fontSize: 120, lineHeight: 140, fontFamily: fonts.arcadeBlack, ...textGlow(colors.pink, 30) }, readySong: { color: colors.muted, fontSize: 14, marginTop: 4, fontFamily: fonts.body },
  modal: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", alignItems: "center", justifyContent: "center", padding: 24 }, pauseCard: { width: "100%", maxWidth: 360, padding: 24, borderRadius: 20, gap: 12, backgroundColor: "#0E0B26", borderWidth: 1.5, borderColor: "rgba(0,229,255,0.45)", ...neonGlow(colors.cyan, 20, 0.35) }, pauseIcon: { alignSelf: "center", width: 60, height: 60, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: rgba(0.12), borderWidth: 1.5, borderColor: rgba(0.5) }, pauseTitle: { color: colors.text, textAlign: "center", fontSize: 26, fontFamily: fonts.arcadeBlack, letterSpacing: 3 }, pauseCopy: { color: colors.muted, textAlign: "center", marginBottom: 8, fontSize: 14, fontFamily: fonts.body },
  missing: { flex: 1, justifyContent: "center", padding: 28, gap: 16, backgroundColor: colors.bg }, missingTitle: { color: colors.text, fontSize: 30, fontFamily: fonts.display, textAlign: "center" }, missingCopy: { color: colors.muted, fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 8, fontFamily: fonts.body },
});
