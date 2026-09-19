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
import { laneColors, colors, fonts, rgba } from "@/src/game/theme";
import { Note, ScoreResult } from "@/src/game/types";
import { useStarlites } from "@/src/game/starlites";
import { computeAchievements, TIER_COLOR } from "@/src/game/achievements";
import { useTreeshIdentity } from "@/src/game/identity";
import { ensureHitAudio } from "@/src/game/synth";

type Judgment = "PERFECT" | "GREAT" | "GOOD" | "MISS";
const weights = { PERFECT: 1, GREAT: 0.75, GOOD: 0.45, MISS: 0 };
const P_NEAR = 0.12; // lane width at the vanishing point as a fraction of the bottom width
const laneFrac = (lane: number) => (lane + 0.5) / 4 - 0.5;
const judgeColor = (g: Judgment) => (g === "PERFECT" ? "#EAF6FF" : g === "GREAT" ? laneColors[1] : g === "GOOD" ? laneColors[3] : "#FF5C7A");
// Stars from accuracy (half-star tiers) + the Starlite reward for a run.
export function starsFor(acc: number) { return acc >= 100 ? 5 : acc >= 96 ? 4.5 : acc >= 86 ? 4 : acc >= 80 ? 3.5 : acc >= 70 ? 3 : acc >= 66 ? 2.5 : acc >= 50 ? 2 : 1; }
export function starlitesFor(stars: number) { return stars >= 5 ? 300 : stars >= 4 ? 150 : stars >= 2.5 ? 100 : 50; }
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
function sampleBeads(note: Note): { t: number; x: number }[] {
  const dur = note.duration || 0.5;
  const pts = note.path && note.path.length > 1 ? note.path : [{ t: note.time, x: (note.lane + 0.5) / 4 }, { t: note.time + dur, x: (note.lane + 0.5) / 4 }];
  const start = pts[0].t, end = pts[pts.length - 1].t; const span = Math.max(0.05, end - start);
  const n = Math.max(8, Math.min(64, Math.round(span / 0.03)));
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
const WavySegment = React.memo(function WavySegment({ a, b, clock, lookahead, geo, color, thick, glow }: { a: { t: number; x: number }; b: { t: number; x: number }; clock: Reanimated.SharedValue<number>; lookahead: number; geo: Geo; color: string; thick: number; glow?: boolean }) {
  const aStyle = useAnimatedStyle(() => {
    const pa = (clock.value - (a.t - lookahead)) / lookahead;
    const pb = (clock.value - (b.t - lookahead)) / lookahead;
    const cpa = pa < 0 ? 0 : pa > 1.1 ? 1.1 : pa;
    const cpb = pb < 0 ? 0 : pb > 1.1 ? 1.1 : pb;
    const perspA = P_NEAR + (1 - P_NEAR) * cpa;
    const perspB = P_NEAR + (1 - P_NEAR) * cpb;
    const ax = geo.cx + (a.x - 0.5) * geo.hw * perspA, ay = geo.topY + geo.span * cpa;
    const bx = geo.cx + (b.x - 0.5) * geo.hw * perspB, by = geo.topY + geo.span * cpb;
    const dx = bx - ax, dy = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const h = Math.max(3, thick * ((perspA + perspB) / 2)) * (glow ? 1.9 : 1);
    const w = len + h; // overlap joints so the line is gapless
    const midx = (ax + bx) / 2, midy = (ay + by) / 2;
    let o = 1;
    if (pa < 0.04) o = pa / 0.04;
    if (pa > 1.0) o = 1 - (pa - 1.0) / 0.14;
    if (o < 0) o = 0; if (o > 1) o = 1;
    return { width: w, height: h, borderRadius: h / 2, opacity: (glow ? 0.32 : 1) * o, transform: [{ translateX: midx - w / 2 }, { translateY: midy - h / 2 }, { rotateZ: `${angle}rad` }] };
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
    if (prog > 1.0) o = 1 - (prog - 1.0) / 0.12;
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
  const thick = geo.laneW * 0.34;
  return <>
    {beads.slice(0, -1).map((b, i) => <WavySegment key={`g${i}`} a={b} b={beads[i + 1]} clock={clock} lookahead={lookahead} geo={geo} color={color} thick={thick} glow />)}
    {beads.slice(0, -1).map((b, i) => <WavySegment key={`c${i}`} a={b} b={beads[i + 1]} clock={clock} lookahead={lookahead} geo={geo} color={color} thick={thick} />)}
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
  const baseW = geo.laneW * 0.66;
  const baseH = 20;
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
      <Reanimated.View style={[styles.note, { width: baseW, height: baseH, borderRadius: baseH / 2, borderColor: special ? "#FFFFFF" : "rgba(255,255,255,0.55)" }, capStyle]}>
        <View style={[styles.noteGloss, { borderRadius: baseH / 2, backgroundColor: special ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)" }]} />
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
const Grid = React.memo(function Grid({ geo, w, h }: { geo: Geo; w: number; h: number }) {
  const topX = (fr: number) => geo.cx + fr * geo.hw * P_NEAR;
  const botX = (fr: number) => geo.cx + fr * geo.hw;
  const edges = [-0.5, -0.25, 0, 0.25, 0.5];
  const poly = `${topX(-0.5)},${geo.topY} ${topX(0.5)},${geo.topY} ${botX(0.5)},${geo.bottomY} ${botX(-0.5)},${geo.bottomY}`;
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy={`${(geo.topY / h) * 100}%`} r="55%">
          <Stop offset="0" stopColor={colors.purple} stopOpacity={0.4} />
          <Stop offset="1" stopColor={colors.purple} stopOpacity={0} />
        </RadialGradient>
        <SvgLinear id="lane" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#12101C" stopOpacity={0.25} />
          <Stop offset="1" stopColor="#1A1730" stopOpacity={0.55} />
        </SvgLinear>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill="url(#glow)" />
      <Polygon points={poly} fill="url(#lane)" />
      {edges.map((e, i) => <Line key={i} x1={topX(e)} y1={geo.topY} x2={botX(e)} y2={geo.bottomY} stroke="rgba(255,255,255,0.13)" strokeWidth={i === 2 ? 1.3 : 1} />)}
      {[0.4, 0.68, 0.88].map((p, i) => { const y = geo.topY + geo.span * p; const persp = P_NEAR + (1 - P_NEAR) * p; return <Line key={`d${i}`} x1={geo.cx - geo.hw * 0.5 * persp} y1={y} x2={geo.cx + geo.hw * 0.5 * persp} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />; })}
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
          <Animated.View key={l} style={[styles.receptor, { width: capW, left: x - capW / 2, top: geo.bottomY - 16, borderColor: c, transform: [{ scale: flash[l].interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) }] }]}>
            <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: c, opacity: flash[l].interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.92] }) }]} />
          </Animated.View>
        );
      })}
    </View>
  );
});

const Backdrop = React.memo(function Backdrop({ coverArt, grayscale }: { coverArt?: string | number; grayscale: boolean }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#07060C" }]}>
      {coverArt && <Image testID="gameplay-cover-backdrop" source={typeof coverArt === "number" ? coverArt : { uri: coverArt }} style={[styles.cover, { opacity: grayscale ? 0.14 : 0.32 }]} resizeMode="cover" />}
      <LinearGradient colors={["rgba(7,6,12,0.4)", "rgba(7,6,12,0.72)", "#07060C"]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
    </View>
  );
});

export default function GameScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { selectedSong, selectedDifficulty, charts, settings, saveResult, testChart, setTestChart, scores, songs } = useAppState();
  const { gameComplete, award, stars } = useStarlites();
  const { nickname, avatar } = useTreeshIdentity();
  const practice = useLocalSearchParams<{ practice?: string }>().practice === "1" && !testChart;
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
  const [judgment, setJudgment] = useState<{ grade: Judgment; x: number; y: number; key: number } | null>(null);
  const [windowIds, setWindowIds] = useState<string[]>([]);
  const [wavyIds, setWavyIds] = useState<string[]>([]);
  const [activeHold, setActiveHold] = useState<Note | null>(null);
  const [tracePop, setTracePop] = useState<{ key: number } | null>(null);
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
  const comboRef = useRef(0); const maxCombo = useRef(0); const scoreRef = useRef(0); const finishing = useRef(false); const pulseBase = useRef(0); const tickCount = useRef(0); const rockRef = useRef(70); const judgeRef = useRef<{ grade: Judgment; lane: number } | null>(null);
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
  const showJudge = useCallback((grade: Judgment, lane: number) => {
    const persp = P_NEAR + (1 - P_NEAR) * 0.52;
    setJudgment({ grade, x: geo.cx + laneFrac(lane) * geo.hw * persp, y: geo.topY + geo.span * 0.52, key: Date.now() });
  }, [geo]);
  const startClock = useCallback((from: number) => { cancelAnimation(clock); clock.value = from; clock.value = withTiming(duration, { duration: Math.max(10, ((duration - from) / rateRef.current) * 1000), easing: RE.linear }); }, [clock, duration]);
  // Vocopulse now auto-fires when the meter fills (no button press needed).
  // Vocopulse: fills over 25 consecutive hits, then stays lit while the streak continues.
  const triggerPulse = useCallback(() => { pulseBase.current = comboRef.current; fuelRef.current = 100; missStreakRef.current = 0; lastPulseT.current = Date.now(); setPulse(100); setPulseActive(true); pulseActiveRef.current = true; Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, []);

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
    result.starlitesEarned = earned + bonus;
    await saveResult(result); setTestChart(null); router.replace("/results");
  }, [chart, selectedSong, selectedDifficulty, saveResult, gameComplete, award, player, clock, setTestChart]);

  // Countdown → start audio + clock. Waits until the audio is actually loaded so playback never
  // starts silent/out of sync; a 2.5s fallback guarantees the game still begins if loading stalls.
  useEffect(() => {
    if (!chart || !selectedSong?.uri || startedRef.current || !(status.isLoaded || forceStart)) return;
    startedRef.current = true;
    let v = 3; setCountdown(v);
    countdownTimer.current = setInterval(() => { v -= 1; setCountdown(v); if (v <= 0) { clearInterval(countdownTimer.current); scanStart.current = 0; clockStart.current = Date.now(); pauseAccum.current = 0; try { player.seekTo(0); if (rateRef.current !== 1) player.setPlaybackRate(rateRef.current, "high"); player.play(); } catch {} startClock(0); } }, 720);
  }, [chart, selectedSong?.uri, status.isLoaded, forceStart, player, startClock]);
  useEffect(() => { const t = setTimeout(() => setForceStart(true), 2500); return () => clearTimeout(t); }, []);
  useEffect(() => () => { if (countdownTimer.current) clearInterval(countdownTimer.current); try { player.pause(); } catch {} cancelAnimation(clock); }, [player, clock]);

  useEffect(() => { ensureHitAudio().then(uri => hitPlayer.replace({ uri })).catch(() => {}); }, [hitPlayer]);
  useEffect(() => { if (!judgment) return; judgeAnim.setValue(0); Animated.sequence([Animated.spring(judgeAnim, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }), Animated.delay(260), Animated.timing(judgeAnim, { toValue: 0, duration: 160, useNativeDriver: true })]).start(); }, [judgment, judgeAnim]);
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
      if (missLane >= 0) { rockRef.current = Math.max(0, rockRef.current - 6); judgeRef.current = { grade: "MISS", lane: missLane }; if (pulseActiveRef.current) { missStreakRef.current += 1; fuelRef.current -= 34 * missStreakRef.current; if (missStreakRef.current >= 3) fuelRef.current = 0; } else pulseBase.current = comboRef.current; }
      // Sync HUD from refs (taps only touch refs, so this is the single place we re-render — keeps rapid tapping instant).
      setCombo(c => (c === comboRef.current ? c : comboRef.current));
      setRock(r => (r === rockRef.current ? r : rockRef.current));
      setScore(s => (s === scoreRef.current ? s : scoreRef.current));
      if (pulseActiveRef.current) {
        // Fuel drains fully in ~5s if idle; each hit refuels, misses drain it faster.
        const now = Date.now(); const dt = lastPulseT.current ? Math.min(0.25, (now - lastPulseT.current) / 1000) : 0.08; lastPulseT.current = now;
        fuelRef.current -= 20 * dt;
        if (fuelRef.current <= 0) { fuelRef.current = 0; setPulseActive(false); pulseActiveRef.current = false; pulseBase.current = comboRef.current; missStreakRef.current = 0; setPulse(0); }
        else setPulse(p => { const v = fuelRef.current; return Math.abs(p - v) < 0.8 ? p : v; });
      } else {
        lastPulseT.current = 0;
        const pv = Math.min(100, Math.max(0, ((comboRef.current - pulseBase.current) / 25) * 100));
        if (pv >= 100) triggerPulse(); else setPulse(p => (p === pv ? p : pv));
      }
      if (judgeRef.current) { showJudge(judgeRef.current.grade, judgeRef.current.lane); judgeRef.current = null; }
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
  }, [chart, countdown, paused, jsTime, lookahead, duration, finish, showJudge, sorted, wavyNotes, settings.noFail, settings.haptics, triggerPulse, jumpTo, testChart]);

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
          scoreRef.current += Math.round(500 * (pulseActive ? 2 : 1));
          setTracePop({ key: Date.now() });
          if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }, 80);
    return () => { clearInterval(timer); Animated.timing(laneFlash[litLane], { toValue: 0, duration: 200, useNativeDriver: true }).start(); traceGlow.value = withTiming(0, { duration: 150 }); };
  }, [activeHold, jsTime, laneFlash, pulseActive, pressed, traceGlow, traceX, geo, settings.haptics]);

  // Glowing spark that rides the receptor line following the traced wavy lane — brighter while on-track.
  const traceSparkStyle = useAnimatedStyle(() => ({ opacity: traceGlow.value, transform: [{ translateX: traceX.value }, { translateY: geo.bottomY }, { scale: 0.7 + traceGlow.value * 0.6 }] }));

  // Taps only mutate refs + fire native-thread animations — no React state, so rapid/back-to-back tapping stays instant.
  const hitLane = useCallback((lane: number) => {
    if (!chart || countdown > 0 || paused) return;
    const t = jsTime();
    let target: Note | undefined; let best = Infinity;
    for (let j = scanStart.current; j < sorted.length; j++) { const n = sorted[j]; if (n.time - t > 0.5) break; if (n.lane !== lane || resolved.current.has(n.id)) continue; const d = Math.abs(n.time - t); if (d < best) { best = d; target = n; } }
    if (!target || best > 0.42) { flashLane(lane); return; }
    const grade: Judgment = best <= 0.11 ? "PERFECT" : best <= 0.24 ? "GREAT" : "GOOD";
    resolved.current.add(target.id); counts.current[grade] += 1;
    comboRef.current += 1; maxCombo.current = Math.max(maxCombo.current, comboRef.current);
    if (milestoneIdx.current < MILESTONES.length && comboRef.current >= MILESTONES[milestoneIdx.current]) {
      const mi = milestoneIdx.current; milestoneIdx.current += 1;
      const scored = !practiceRef.current && !testChart;
      if (scored) milestoneBonusRef.current += MBONUS[mi];
      setMilestone({ combo: MILESTONES[mi], bonus: scored ? MBONUS[mi] : 0, key: Date.now() });
      if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (pulseActiveRef.current) { fuelRef.current = Math.min(100, fuelRef.current + 26); missStreakRef.current = 0; }
    const multiplier = Math.min(4, 1 + Math.floor(comboRef.current / 10)) * (pulseActive ? 2 : 1);
    scoreRef.current += Math.round(1000 * weights[grade] * multiplier);
    rockRef.current = Math.min(100, rockRef.current + (grade === "PERFECT" ? 3 : 1));
    judgeRef.current = { grade, lane }; flashLane(lane);
    if (target.type === "hold" || target.type === "wavy") setActiveHold(target);
    // Fire SFX/haptics off the touch handler so the hit registers instantly.
    if (settings.hitSfx) setTimeout(() => { try { hitPlayer.seekTo(0); hitPlayer.play(); } catch {} }, 0);
    if (settings.haptics) Haptics.impactAsync(grade === "PERFECT" ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
  }, [chart, countdown, paused, jsTime, pulseActive, flashLane, settings.haptics, settings.hitSfx, hitPlayer, sorted, testChart]);

  const onPadsTouchStart = (e: any) => { for (const tt of e.nativeEvent.changedTouches) { const lane = Math.max(0, Math.min(3, Math.floor((tt.locationX ?? tt.pageX) / (width / 4)))); touchLane.current[String(tt.identifier)] = lane; pressed.add(lane); hitLane(lane); } };
  // Dragging a finger across lanes retargets the held lane in real time — this is how WAVY notes get TRACED (not just held).
  const onPadsTouchMove = (e: any) => { for (const tt of e.nativeEvent.changedTouches) { const key = String(tt.identifier); const prev = touchLane.current[key]; if (prev === undefined) continue; const lane = Math.max(0, Math.min(3, Math.floor((tt.locationX ?? tt.pageX) / (width / 4)))); if (lane !== prev) { pressed.delete(prev); pressed.add(lane); touchLane.current[key] = lane; flashLane(lane); } } };
  const onPadsTouchEnd = (e: any) => { for (const tt of e.nativeEvent.changedTouches) { const key = String(tt.identifier); const lane = touchLane.current[key]; if (lane !== undefined) { pressed.delete(lane); delete touchLane.current[key]; } } };

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
  const restart = () => { player.seekTo(0); cancelAnimation(clock); clock.value = 0; scanStart.current = 0; pulseBase.current = 0; fuelRef.current = 0; missStreakRef.current = 0; lastPulseT.current = 0; rockRef.current = 70; resolved.current.clear(); counts.current = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 }; scoreRef.current = 0; comboRef.current = 0; milestoneIdx.current = 0; milestoneBonusRef.current = 0; setScore(0); setCombo(0); setRock(70); setAccuracy(100); setProgress(0); setPulse(0); setPulseActive(false); setPaused(false); setActiveHold(null); clockStart.current = Date.now(); pauseAccum.current = 0; try { if (rateRef.current !== 1) player.setPlaybackRate(rateRef.current, "high"); } catch {} player.play(); startClock(0); };

  const visibleNotes = useMemo(() => { if (!chart) return []; const set = new Set(windowIds); return chart.notes.filter(n => set.has(n.id)); }, [chart, windowIds]);
  const visibleWavy = useMemo(() => { const set = new Set(wavyIds); return wavyNotes.filter(n => set.has(n.id)); }, [wavyNotes, wavyIds]);
  if (!chart || !selectedSong?.uri) return <View style={styles.missing}><Text selectable={false} style={styles.missingTitle}>Chart not ready</Text><Text selectable={false} style={styles.missingCopy}>Build a chart for this track, then jump back in.</Text><NeonButton testID="game-back-to-library-button" label="Build a chart" icon="analytics" onPress={() => router.replace("/library")} /></View>;

  const padW = width / 4;
  const pulseReady = pulse >= 100;
  const charged = pulseReady || pulseActive;
  const liveStars = starsFor(accuracy);

  return <View style={styles.root} testID="gameplay-screen">
    <Backdrop coverArt={selectedSong.coverArt} grayscale={settings.grayscaleCovers} />
    <Grid geo={geo} w={width} h={height} />
    {pulseActive && <LinearGradient pointerEvents="none" colors={["rgba(255,77,141,0.16)", "rgba(179,124,255,0.14)", "rgba(47,224,214,0.16)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}

    {/* Highway note layer (native-thread animated, memoized) */}
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <WavyLayer notes={visibleWavy} clock={clock} lookahead={lookahead} geo={geo} />
      <NotesLayer notes={visibleNotes} clock={clock} lookahead={lookahead} geo={geo} special={charged} rainbow={rainbow} />
      {activeHold && <ActiveHoldBar note={activeHold} clock={clock} lookahead={lookahead} geo={geo} />}
    </View>

    <Receptors geo={geo} flash={laneFlash} />
    {activeHold?.type === "wavy" && <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: -geo.laneW * 0.35, top: -geo.laneW * 0.35, width: geo.laneW * 0.7, height: geo.laneW * 0.7, borderRadius: geo.laneW * 0.35, backgroundColor: "rgba(255,255,255,0.9)", shadowColor: laneColors[wavyLaneAt(activeHold, 0)], shadowOpacity: 1, shadowRadius: 22, elevation: 12 }, traceSparkStyle]}>
      <View style={{ position: "absolute", top: geo.laneW * 0.16, left: geo.laneW * 0.16, right: geo.laneW * 0.16, bottom: geo.laneW * 0.16, borderRadius: geo.laneW * 0.2, backgroundColor: laneColors[activeHold.lane] }} />
    </Reanimated.View>}

    {/* Combo */}
    {combo > 2 && <View pointerEvents="none" style={[styles.comboWrap, { top: geo.topY + geo.span * 0.06 }]}>
      <View style={styles.comboGlow} />
      <Text selectable={false} style={styles.combo}>{combo}</Text>
      <Text selectable={false} style={styles.comboLabel}>COMBO</Text>
    </View>}

    {/* Judgment (per-lane, mid highway) */}
    {judgment && <Animated.Text selectable={false} key={judgment.key} pointerEvents="none" style={[styles.judgment, { color: judgeColor(judgment.grade), left: judgment.x - 90, top: judgment.y, opacity: judgeAnim, transform: [{ translateY: judgeAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>{judgment.grade === "MISS" ? "Miss" : judgment.grade === "PERFECT" ? "Perfect" : judgment.grade === "GREAT" ? "Great" : "Good"}</Animated.Text>}
    {tracePop && <Animated.View key={tracePop.key} pointerEvents="none" style={[styles.tracePop, { top: geo.bottomY - 128, left: geo.cx - 110, opacity: traceAnim, transform: [{ translateY: traceAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }, { scale: traceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}><Ionicons name="sparkles" size={17} color={laneColors[1]} /><Text selectable={false} style={styles.tracePopText}>Nice trace!</Text></Animated.View>}
    {milestone && <Animated.View key={milestone.key} pointerEvents="none" style={[styles.milestone, { top: geo.topY + geo.span * 0.3, left: geo.cx - 150, opacity: milestoneAnim, transform: [{ scale: milestoneAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>
      <Text selectable={false} style={styles.milestoneCombo}>{milestone.combo} COMBO!</Text>
      {milestone.bonus > 0 && <View style={styles.milestoneBonus}><Ionicons name="sparkles" size={13} color={colors.gold} /><Text selectable={false} style={styles.milestoneBonusText}>+{milestone.bonus} Starlites</Text></View>}
    </Animated.View>}
    {achToast && <Animated.View key={achToast.key} pointerEvents="none" style={[styles.achToast, { top: insets.top + 70, borderColor: TIER_COLOR[achToast.tier], opacity: achAnim, transform: [{ translateY: achAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }, { scale: achAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
      <View style={[styles.achToastIcon, { backgroundColor: TIER_COLOR[achToast.tier] }]}><Ionicons name={achToast.icon} size={20} color={colors.bg} /></View>
      <View style={{ flex: 1 }}><Text selectable={false} style={styles.achToastLabel}>ACHIEVEMENT UNLOCKED</Text><Text selectable={false} style={styles.achToastTitle} numberOfLines={1}>{achToast.title}</Text></View>
      <Ionicons name="trophy" size={18} color={TIER_COLOR[achToast.tier]} />
    </Animated.View>}

    {/* Top HUD */}
    <View style={[styles.hud, { top: insets.top + 6 }]} pointerEvents="box-none">
      <View style={styles.hudRow}>
        <View style={{ flex: 1 }}>
          <Text selectable={false} style={styles.score}>{score.toLocaleString()}</Text>
          <Text selectable={false} style={styles.songMeta} numberOfLines={1}>{selectedSong.title} · {selectedDifficulty}</Text>
        </View>
        <Pressable testID="pause-game-button" onPress={togglePause} style={styles.pause}><Ionicons name="pause" size={18} color={colors.text} /></Pressable>
      </View>
      <View style={styles.accRow}>
        <View style={styles.accTrack}><LinearGradient colors={["#FF4D8D", "#B37CFF", "#2FE0D6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.accFill, { width: `${accuracy}%` }]} /></View>
        <View style={styles.liveStars}>{[0, 1, 2, 3, 4].map(n => { const full = liveStars >= n + 1; const half = !full && liveStars >= n + 0.5; return <Ionicons key={n} name={full ? "star" : half ? "star-half" : "star-outline"} size={13} color={full || half ? colors.gold : "rgba(255,255,255,0.28)"} />; })}</View>
        <Text selectable={false} style={styles.accText}>{accuracy.toFixed(1)}%</Text>
      </View>
      <View style={styles.progTrack}><View style={[styles.progFill, { width: `${progress * 100}%`, backgroundColor: rock < 30 ? "#FF5C7A" : "rgba(255,255,255,0.5)" }]} /></View>
    </View>

    {/* Practice controls — speed + A/B loop (practice mode only) */}
    {practice && <View testID="practice-bar" style={[styles.practice, { top: insets.top + 92 }]} pointerEvents="box-none">
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
      <Ionicons name="flame" size={20} color={pulseActive ? "#FFB020" : pulseReady ? "#FF7A45" : "rgba(255,120,70,0.8)"} />
      <View style={styles.vocoTrack}><Animated.View style={[styles.vocoFill, { width: pulseAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }]}><LinearGradient colors={pulseActive ? ["#FFB020", "#FF4D8D"] : ["#FF4D8D", "#B37CFF", "#2FE0D6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} /></Animated.View></View>
      <Text selectable={false} style={[styles.vocoMult, (pulseReady || pulseActive) && { color: "#FFB020" }]}>{pulseActive ? "2×" : "1×"}</Text>
    </View>

    {/* Tap pads — single multi-touch surface (supports simultaneous lanes + rapid taps) */}
    <View style={[styles.pads, { height: PAD_H, bottom: PAD_BOTTOM }]} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onTouchStart={onPadsTouchStart} onTouchMove={onPadsTouchMove} onTouchEnd={onPadsTouchEnd} onTouchCancel={onPadsTouchEnd}>
      {settings.showLanePads && laneColors.map((c, l) => <Animated.View key={l} testID={`lane-${l + 1}-hit-pad`} pointerEvents="none" style={{ position: "absolute", left: l * padW + 3, width: padW - 6, top: 4, bottom: 4, borderRadius: 16, backgroundColor: c, opacity: laneFlash[l].interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }) }} />)}
    </View>

    {countdown > 0 && <View style={styles.countdown}><Avatar avatar={avatar} nickname={nickname} size={62} style={{ marginBottom: 14 }} /><Text selectable={false} style={styles.ready}>GET READY, {nickname.toUpperCase()}</Text><Text selectable={false} key={countdown} style={styles.count}>{countdown}</Text><Text selectable={false} style={styles.readySong}>{selectedSong.title}</Text></View>}

    <Modal visible={paused} transparent animationType="fade"><View style={styles.modal}><View style={styles.pauseCard}><View style={styles.pauseIcon}><Ionicons name="pause" size={28} color={colors.purple} /></View><Text selectable={false} style={styles.pauseTitle}>Paused</Text><Text selectable={false} style={styles.pauseCopy}>The stage is holding your place.</Text><NeonButton testID="resume-game-button" label="Resume" icon="play" onPress={togglePause} /><NeonButton testID="restart-game-button" label="Restart" icon="refresh" variant="secondary" onPress={restart} /><NeonButton testID="exit-game-button" label={testChart ? "Back to editor" : practice ? "Exit practice" : "Exit song"} icon="close" variant="danger" onPress={() => { player.pause(); cancelAnimation(clock); if (testChart) { setTestChart(null); router.back(); } else if (practice) { router.back(); } else { router.replace("/library"); } }} /></View></View></Modal>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07060C", overflow: "hidden" },
  cover: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", opacity: 0.5, transform: [{ scale: 1.2 }] },
  note: { alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.55)" },
  noteGloss: { position: "absolute", top: 1.5, left: 4, right: 4, height: "42%", backgroundColor: "rgba(255,255,255,0.35)" },
  receptor: { position: "absolute", height: 32, borderRadius: 16, borderWidth: 2.5, overflow: "hidden" },
  comboWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" }, comboGlow: { position: "absolute", width: 110, height: 110, borderRadius: 55, backgroundColor: rgba(0.16), top: -22 },
  combo: { color: colors.text, fontSize: 48, lineHeight: 52, fontFamily: fonts.display, textShadowColor: rgba(0.9), textShadowRadius: 14 }, comboLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: 5, fontFamily: fonts.heavy, marginTop: 1 },
  judgment: { position: "absolute", width: 180, textAlign: "center", fontSize: 26, fontFamily: fonts.display, letterSpacing: 0.5 },
  tracePop: { position: "absolute", width: 220, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, tracePopText: { color: "#EAF6FF", fontSize: 24, fontFamily: fonts.display, textShadowColor: "rgba(47,224,214,0.9)", textShadowRadius: 16 },
  milestone: { position: "absolute", width: 300, alignItems: "center", gap: 8 }, milestoneCombo: { color: colors.gold, fontSize: 40, fontFamily: fonts.display, textShadowColor: "rgba(245,200,66,0.85)", textShadowRadius: 20, letterSpacing: 1 }, milestoneBonus: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, height: 30, borderRadius: 15, backgroundColor: "rgba(245,200,66,0.16)", borderWidth: 1, borderColor: "rgba(245,200,66,0.5)" }, milestoneBonusText: { color: colors.gold, fontSize: 13, fontFamily: fonts.heavy },
  achToast: { position: "absolute", left: 24, right: 24, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 18, backgroundColor: "rgba(16,14,22,0.97)", borderWidth: 1.5, zIndex: 60, shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 16 }, achToastIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" }, achToastLabel: { color: colors.muted, fontSize: 9, letterSpacing: 1.6, fontFamily: fonts.heavy }, achToastTitle: { color: colors.text, fontSize: 17, fontFamily: fonts.display, marginTop: 2 },
  practice: { position: "absolute", left: 12, right: 12, gap: 8, zIndex: 20 }, practiceRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" },
  practiceTag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, height: 30, borderRadius: 15, backgroundColor: "rgba(13,230,210,0.14)", borderWidth: 1, borderColor: "rgba(13,230,210,0.4)" }, practiceTagText: { color: colors.cyan, fontSize: 10, fontFamily: fonts.heavy, letterSpacing: 1 },
  spdChip: { minWidth: 46, height: 30, paddingHorizontal: 10, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" }, spdChipOn: { backgroundColor: colors.cyan, borderColor: colors.cyan }, spdChipText: { color: colors.text, fontSize: 13, fontFamily: fonts.heavy }, spdChipTextOn: { color: colors.bg },
  loopBtn: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: 62, height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", justifyContent: "center" }, loopClear: { borderColor: "rgba(255,92,122,0.5)" }, loopBtnText: { color: colors.text, fontSize: 12, fontFamily: fonts.heavy },
  hud: { position: "absolute", left: 18, right: 18 }, hudRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  score: { color: colors.text, fontSize: 34, lineHeight: 38, fontFamily: fonts.display, textShadowColor: rgba(0.6), textShadowRadius: 12 }, songMeta: { color: "rgba(245,245,247,0.55)", fontSize: 13, fontFamily: fonts.body, marginTop: 1 },
  pause: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  accRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }, accTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" }, accFill: { height: 7, borderRadius: 4 }, accText: { color: "rgba(245,245,247,0.85)", fontSize: 13, fontFamily: fonts.bold, width: 52, textAlign: "right" },
  liveStars: { flexDirection: "row", alignItems: "center", gap: 1 },
  progTrack: { height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 8, overflow: "hidden" }, progFill: { height: 4, borderRadius: 2 },
  voco: { position: "absolute", left: 18, right: 18, height: 44, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  vocoReady: { borderColor: "#FFE27A", backgroundColor: "rgba(255,226,122,0.12)" },
  vocoLabel: { color: "rgba(245,245,247,0.8)", fontSize: 12, letterSpacing: 2, fontFamily: fonts.heavy }, vocoTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" }, vocoFill: { height: 8, borderRadius: 4 }, vocoMult: { color: "rgba(245,245,247,0.9)", fontSize: 14, fontFamily: fonts.heavy, width: 26, textAlign: "right" },
  pads: { position: "absolute", left: 0, right: 0, flexDirection: "row" }, pad: { flex: 1, margin: 3, borderRadius: 18 },
  countdown: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)", alignItems: "center", justifyContent: "center" }, ready: { color: colors.purple, fontSize: 13, letterSpacing: 4, fontFamily: fonts.heavy }, count: { color: colors.text, fontSize: 118, lineHeight: 132, fontFamily: fonts.display }, readySong: { color: colors.muted, fontSize: 14, marginTop: 4, fontFamily: fonts.body },
  modal: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", alignItems: "center", justifyContent: "center", padding: 24 }, pauseCard: { width: "100%", maxWidth: 360, padding: 24, borderRadius: 28, gap: 12, backgroundColor: "#121214", borderWidth: 1, borderColor: colors.border }, pauseIcon: { alignSelf: "center", width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", backgroundColor: rgba(0.14), borderWidth: 1, borderColor: colors.purpleSoft }, pauseTitle: { color: colors.text, textAlign: "center", fontSize: 30, fontFamily: fonts.display }, pauseCopy: { color: colors.muted, textAlign: "center", marginBottom: 8, fontSize: 14, fontFamily: fonts.body },
  missing: { flex: 1, justifyContent: "center", padding: 28, gap: 16, backgroundColor: colors.bg }, missingTitle: { color: colors.text, fontSize: 30, fontFamily: fonts.display, textAlign: "center" }, missingCopy: { color: colors.muted, fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 8, fontFamily: fonts.body },
});
