import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Reanimated, { Easing as RE, cancelAnimation, interpolateColor, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient as SvgLinear, Line, Path, Polygon, RadialGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NeonButton } from "@/src/components/ui";
import { Avatar } from "@/src/components/Avatar";
import { useAppState } from "@/src/game/AppState";
import { laneColors, colors, fonts, rgba } from "@/src/game/theme";
import { Note, ScoreResult } from "@/src/game/types";
import { useStarlites } from "@/src/game/starlites";
import { useTreeshIdentity } from "@/src/game/identity";
import { ensureHitAudio } from "@/src/game/synth";

type Judgment = "PERFECT" | "GREAT" | "GOOD" | "MISS";
const weights = { PERFECT: 1, GREAT: 0.75, GOOD: 0.45, MISS: 0 };
const P_NEAR = 0.12; // lane width at the vanishing point as a fraction of the bottom width
const laneFrac = (lane: number) => (lane + 0.5) / 4 - 0.5;
const judgeColor = (g: Judgment) => (g === "PERFECT" ? "#EAF6FF" : g === "GREAT" ? laneColors[1] : g === "GOOD" ? laneColors[3] : "#FF5C7A");

type Geo = { cx: number; hw: number; topY: number; bottomY: number; laneW: number; span: number };

// Builds the wavy-hold path (SVG coords, y-down; bottom = head, top = tail end).
// If the note carries a recorded finger path, we trace it; otherwise fall back to a
// gentle sine. Amplitude tapers toward the top so it reads with the highway's depth.
function wavePathData(note: Note, tailLen: number, hw: number, cx: number) {
  const dur = note.duration || 0.4;
  if (note.path && note.path.length > 1) {
    const laneC = (note.lane + 0.5) / 4;
    const pts = note.path
      .map(p => {
        const frac = Math.max(0, Math.min(1, (p.t - note.time) / dur));
        const dev = Math.max(-0.5, Math.min(0.5, p.x - laneC));
        return [cx + dev * hw * (1 - 0.45 * frac), tailLen * (1 - frac)] as [number, number];
      })
      .sort((a, b) => b[1] - a[1]);
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
    return d;
  }
  const steps = 22; const cycles = Math.max(1.6, tailLen / 46); const amp = cx * 0.5;
  let d = `M ${cx} ${tailLen.toFixed(1)}`;
  for (let i = 1; i <= steps; i++) { const t = i / steps; const y = tailLen * (1 - t); const x = cx + amp * (1 - 0.4 * t) * Math.sin(t * cycles * Math.PI * 2); d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`; }
  return d;
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
  const waveW = geo.laneW * 2.2; // wide enough to trace multi-lane finger movement
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
      {isHold && (isWavy
        ? <Svg width={waveW} height={tailLen} style={{ position: "absolute", left: baseW / 2 - waveW / 2, bottom: baseH / 2, transformOrigin: "50% 100%", transform: [{ rotateZ: `${tilt}deg` }] }} pointerEvents="none"><Path d={wavePathData(note, tailLen, geo.hw, waveW / 2)} stroke={color} strokeWidth={tailW * 0.85} strokeOpacity={0.95} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
        : <View style={{ position: "absolute", left: baseW / 2 - tailW / 2, bottom: baseH / 2, width: tailW, height: tailLen, borderRadius: tailW / 2, backgroundColor: `${color}55`, borderWidth: 1, borderColor: `${color}AA`, transformOrigin: "50% 100%", transform: [{ rotateZ: `${tilt}deg` }] }} />)}
      <Reanimated.View style={[styles.note, { width: baseW, height: baseH, borderRadius: baseH / 2, borderColor: special ? "#FFFFFF" : "rgba(255,255,255,0.55)" }, capStyle]}>
        <View style={[styles.noteGloss, { borderRadius: baseH / 2, backgroundColor: special ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)" }]} />
      </Reanimated.View>
    </Reanimated.View>
  );
});

const NotesLayer = React.memo(function NotesLayer({ notes, clock, lookahead, geo, special, rainbow }: { notes: Note[]; clock: Reanimated.SharedValue<number>; lookahead: number; geo: Geo; special?: boolean; rainbow: Reanimated.SharedValue<number> }) {
  return <>{notes.map(n => <FallingNote key={n.id} note={n} clock={clock} lookahead={lookahead} geo={geo} special={special} rainbow={rainbow} />)}</>;
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
  if (isWavy) {
    const waveW = geo.laneW * 2.2;
    const fullTailPix = Math.max(24, Math.min(geo.span, ((note.duration || 0.4) / lookahead) * geo.span));
    return <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: x - waveW / 2, top: 0, width: waveW, overflow: "hidden", transformOrigin: "50% 100%" }, aStyle]}>
      <Svg width={waveW} height={fullTailPix} style={{ position: "absolute", left: 0, bottom: 0 }} pointerEvents="none">
        <Path d={wavePathData(note, fullTailPix, geo.hw, waveW / 2)} stroke={color} strokeWidth={geo.laneW * 0.3} strokeOpacity={0.98} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d={wavePathData(note, fullTailPix, geo.hw, waveW / 2)} stroke="rgba(255,255,255,0.55)" strokeWidth={geo.laneW * 0.12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Reanimated.View>;
  }
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
  const { selectedSong, selectedDifficulty, charts, settings, saveResult, testChart, setTestChart } = useAppState();
  const { gameComplete, discoverSong, listen } = useStarlites();
  const { nickname, avatar } = useTreeshIdentity();
  const chart = testChart || (selectedSong ? charts[`${selectedSong.id}-${selectedDifficulty}`] : undefined);
  const player = useAudioPlayer(selectedSong?.uri ? { uri: selectedSong.uri } : null, { updateInterval: 500 });
  const hitPlayer = useAudioPlayer(null);

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
  const [activeHold, setActiveHold] = useState<Note | null>(null);

  const clock = useSharedValue(0);
  const rainbow = useSharedValue(0);
  useEffect(() => { rainbow.value = withRepeat(withTiming(1, { duration: 2600, easing: RE.linear }), -1, false); }, [rainbow]);
  const pulseActiveRef = useRef(false);
  const drainUntil = useRef(0); // when >0, Vocopulse is draining and will end at this timestamp
  useEffect(() => { pulseActiveRef.current = pulseActive; }, [pulseActive]);
  const touchLane = useRef<Record<string, number>>({});
  const clockStart = useRef(0); const pauseAccum = useRef(0); const pauseAt = useRef(0);
  const resolved = useRef(new Set<string>());
  const counts = useRef({ PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 });
  const comboRef = useRef(0); const maxCombo = useRef(0); const scoreRef = useRef(0); const finishing = useRef(false); const pulseBase = useRef(0); const tickCount = useRef(0); const rockRef = useRef(70); const judgeRef = useRef<{ grade: Judgment; lane: number } | null>(null);
  const laneFlash = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const pressed = useRef(new Set<number>()).current;
  const judgeAnim = useRef(new Animated.Value(0)).current;

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
  const scanStart = useRef(0);

  const jsTime = useCallback(() => (Date.now() - clockStart.current - pauseAccum.current) / 1000 + settings.audioOffset / 1000, [settings.audioOffset]);
  const flashLane = useCallback((lane: number) => { laneFlash[lane].setValue(1); Animated.timing(laneFlash[lane], { toValue: 0, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); }, [laneFlash]);
  const showJudge = useCallback((grade: Judgment, lane: number) => {
    const persp = P_NEAR + (1 - P_NEAR) * 0.52;
    setJudgment({ grade, x: geo.cx + laneFrac(lane) * geo.hw * persp, y: geo.topY + geo.span * 0.52, key: Date.now() });
  }, [geo]);
  const startClock = useCallback((from: number) => { cancelAnimation(clock); clock.value = from; clock.value = withTiming(duration, { duration: Math.max(10, (duration - from) * 1000), easing: RE.linear }); }, [clock, duration]);
  // Vocopulse now auto-fires when the meter fills (no button press needed).
  // Vocopulse: fills over 25 consecutive hits, then stays lit while the streak continues.
  const triggerPulse = useCallback(() => { pulseBase.current = comboRef.current; setPulse(100); setPulseActive(true); pulseActiveRef.current = true; drainUntil.current = 0; Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, []);

  const finish = useCallback(async () => {
    if (!chart || !selectedSong || finishing.current) return; finishing.current = true; player.pause(); cancelAnimation(clock);
    if (testChart) { router.back(); return; } // testing a custom chart returns to the editor, no score saved
    const total = chart.notes.length; const c = counts.current; const remaining = chart.notes.filter(n => !resolved.current.has(n.id)).length; if (remaining) c.MISS += remaining;
    const acc = total ? Math.round(((c.PERFECT + c.GREAT * 0.75 + c.GOOD * 0.45) / total) * 10000) / 100 : 0;
    const stars = acc >= 97 ? 5 : acc >= 90 ? 4 : acc >= 78 ? 3 : acc >= 60 ? 2 : acc > 0 ? 1 : 0;
    const result: ScoreResult = { songId: selectedSong.id, title: selectedSong.title, difficulty: selectedDifficulty, score: scoreRef.current, accuracy: acc, maxCombo: maxCombo.current, stars, perfect: c.PERFECT, great: c.GREAT, good: c.GOOD, miss: c.MISS, totalNotes: total, createdAt: Date.now() };
    let earned = 0;
    earned += await gameComplete("Vocotap", total); // Starlites only when the chart has 200+ notes
    earned += await listen(chart.duration);
    if (chart.duration > 20) earned += await discoverSong(selectedSong.id);
    result.starlitesEarned = earned;
    await saveResult(result); setTestChart(null); router.replace("/results");
  }, [chart, selectedSong, selectedDifficulty, saveResult, gameComplete, discoverSong, listen, player, clock, setTestChart]);

  // Countdown → start audio + clock.
  useEffect(() => {
    if (!chart || !selectedSong?.uri) return;
    let v = 3; setCountdown(v);
    const timer = setInterval(() => { v -= 1; setCountdown(v); if (v <= 0) { clearInterval(timer); scanStart.current = 0; clockStart.current = Date.now(); pauseAccum.current = 0; player.seekTo(0); player.play(); startClock(0); } }, 720);
    return () => { clearInterval(timer); player.pause(); cancelAnimation(clock); };
  }, [chart, selectedSong?.uri, player, startClock, clock]);

  useEffect(() => { ensureHitAudio().then(uri => hitPlayer.replace({ uri })).catch(() => {}); }, [hitPlayer]);
  useEffect(() => { if (!judgment) return; judgeAnim.setValue(0); Animated.sequence([Animated.spring(judgeAnim, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }), Animated.delay(260), Animated.timing(judgeAnim, { toValue: 0, duration: 160, useNativeDriver: true })]).start(); }, [judgment, judgeAnim]);

  // Game loop @150ms — pointer-based scan (O(visible)), miss detection, throttled HUD sync.
  useEffect(() => {
    if (!chart || countdown > 0) return;
    const tick = setInterval(() => {
      if (paused || finishing.current) return;
      const t = jsTime();
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
      if (missLane >= 0) { rockRef.current = Math.max(0, rockRef.current - 6); judgeRef.current = { grade: "MISS", lane: missLane }; if (pulseActiveRef.current && drainUntil.current === 0) drainUntil.current = Date.now() + 3000; else if (!pulseActiveRef.current) pulseBase.current = comboRef.current; }
      // Sync HUD from refs (taps only touch refs, so this is the single place we re-render — keeps rapid tapping instant).
      setCombo(c => (c === comboRef.current ? c : comboRef.current));
      setRock(r => (r === rockRef.current ? r : rockRef.current));
      setScore(s => (s === scoreRef.current ? s : scoreRef.current));
      if (pulseActiveRef.current) {
        if (drainUntil.current) {
          const rem = drainUntil.current - Date.now();
          if (rem <= 0) { setPulseActive(false); pulseActiveRef.current = false; drainUntil.current = 0; pulseBase.current = comboRef.current; setPulse(0); }
          else setPulse(p => { const v = (rem / 3000) * 100; return Math.abs(p - v) < 1 ? p : v; });
        } else setPulse(p => (p === 100 ? p : 100)); // stays lit while the streak holds
      } else {
        const pv = Math.min(100, Math.max(0, ((comboRef.current - pulseBase.current) / 25) * 100));
        if (pv >= 100) triggerPulse(); else setPulse(p => (p === pv ? p : pv));
      }
      if (judgeRef.current) { showJudge(judgeRef.current.grade, judgeRef.current.lane); judgeRef.current = null; }
      tickCount.current++;
      if (tickCount.current % 3 === 0) {
        const c = counts.current; const done = c.PERFECT + c.GREAT + c.GOOD + c.MISS;
        setAccuracy(done ? Math.round(((c.PERFECT + c.GREAT * 0.75 + c.GOOD * 0.45) / done) * 1000) / 10 : 100);
        setProgress(Math.min(1, t / duration));
      }
      if (rockRef.current <= 0 && !settings.noFail) { finish(); return; }
      if (t >= duration - 0.05) finish();
    }, 150);
    return () => clearInterval(tick);
  }, [chart, countdown, paused, jsTime, lookahead, duration, finish, showJudge, sorted, settings.noFail, triggerPulse]);

  // Hold / wavy sustain — finger must stay on the lane for the full tail. Receptor stays lit while held.
  useEffect(() => {
    if (!activeHold) return;
    const end = activeHold.time + (activeHold.duration || 0.4); const lane = activeHold.lane;
    laneFlash[lane].setValue(1);
    const timer = setInterval(() => {
      const t = jsTime();
      // Releasing early no longer counts as a miss — the note grays out, combo holds and continues.
      if (!pressed.has(lane) && t < end - 0.1) { setActiveHold(null); return; }
      scoreRef.current += Math.round(24 * (pulseActive ? 2 : 1));
      if (t >= end) { setActiveHold(null); scoreRef.current += Math.round(400 * (pulseActive ? 2 : 1)); }
    }, 90);
    return () => { clearInterval(timer); Animated.timing(laneFlash[lane], { toValue: 0, duration: 200, useNativeDriver: true }).start(); };
  }, [activeHold, jsTime, laneFlash, pulseActive, pressed]);

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
    const multiplier = Math.min(4, 1 + Math.floor(comboRef.current / 10)) * (pulseActive ? 2 : 1);
    scoreRef.current += Math.round(1000 * weights[grade] * multiplier);
    rockRef.current = Math.min(100, rockRef.current + (grade === "PERFECT" ? 3 : 1));
    judgeRef.current = { grade, lane }; flashLane(lane);
    if (target.type === "hold" || target.type === "wavy") setActiveHold(target);
    // Fire SFX/haptics off the touch handler so the hit registers instantly.
    if (settings.hitSfx) setTimeout(() => { try { hitPlayer.seekTo(0); hitPlayer.play(); } catch {} }, 0);
    if (settings.haptics) Haptics.impactAsync(grade === "PERFECT" ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
  }, [chart, countdown, paused, jsTime, pulseActive, flashLane, settings.haptics, settings.hitSfx, hitPlayer, sorted]);

  const onPadsTouchStart = (e: any) => { for (const tt of e.nativeEvent.changedTouches) { const lane = Math.max(0, Math.min(3, Math.floor((tt.locationX ?? tt.pageX) / (width / 4)))); touchLane.current[String(tt.identifier)] = lane; pressed.add(lane); hitLane(lane); } };
  const onPadsTouchEnd = (e: any) => { for (const tt of e.nativeEvent.changedTouches) { const key = String(tt.identifier); const lane = touchLane.current[key]; if (lane !== undefined) { pressed.delete(lane); delete touchLane.current[key]; } } };
  const togglePause = () => { if (paused) { pauseAccum.current += Date.now() - pauseAt.current; player.play(); startClock(jsTime() - settings.audioOffset / 1000); } else { pauseAt.current = Date.now(); player.pause(); cancelAnimation(clock); } setPaused(!paused); };
  const restart = () => { player.seekTo(0); cancelAnimation(clock); clock.value = 0; scanStart.current = 0; pulseBase.current = 0; drainUntil.current = 0; rockRef.current = 70; resolved.current.clear(); counts.current = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 }; scoreRef.current = 0; comboRef.current = 0; setScore(0); setCombo(0); setRock(70); setAccuracy(100); setProgress(0); setPulse(0); setPulseActive(false); setPaused(false); setActiveHold(null); clockStart.current = Date.now(); pauseAccum.current = 0; player.play(); startClock(0); };

  const visibleNotes = useMemo(() => { if (!chart) return []; const set = new Set(windowIds); return chart.notes.filter(n => set.has(n.id)); }, [chart, windowIds]);
  if (!chart || !selectedSong?.uri) return <View style={styles.missing}><Text selectable={false} style={styles.missingTitle}>Chart not ready</Text><Text selectable={false} style={styles.missingCopy}>Build a chart for this track, then jump back in.</Text><NeonButton testID="game-back-to-library-button" label="Build a chart" icon="analytics" onPress={() => router.replace("/library")} /></View>;

  const padW = width / 4;
  const pulseReady = pulse >= 100;
  const charged = pulseReady || pulseActive;

  return <View style={styles.root} testID="gameplay-screen">
    <Backdrop coverArt={selectedSong.coverArt} grayscale={settings.grayscaleCovers} />
    <Grid geo={geo} w={width} h={height} />
    {pulseActive && <LinearGradient pointerEvents="none" colors={["rgba(255,77,141,0.16)", "rgba(179,124,255,0.14)", "rgba(47,224,214,0.16)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}

    {/* Highway note layer (native-thread animated, memoized) */}
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <NotesLayer notes={visibleNotes} clock={clock} lookahead={lookahead} geo={geo} special={charged} rainbow={rainbow} />
      {activeHold && <ActiveHoldBar note={activeHold} clock={clock} lookahead={lookahead} geo={geo} />}
    </View>

    <Receptors geo={geo} flash={laneFlash} />

    {/* Combo */}
    {combo > 2 && <View pointerEvents="none" style={[styles.comboWrap, { top: geo.topY + geo.span * 0.06 }]}>
      <View style={styles.comboGlow} />
      <Text selectable={false} style={styles.combo}>{combo}</Text>
      <Text selectable={false} style={styles.comboLabel}>COMBO</Text>
    </View>}

    {/* Judgment (per-lane, mid highway) */}
    {judgment && <Animated.Text selectable={false} key={judgment.key} pointerEvents="none" style={[styles.judgment, { color: judgeColor(judgment.grade), left: judgment.x - 90, top: judgment.y, opacity: judgeAnim, transform: [{ translateY: judgeAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>{judgment.grade === "MISS" ? "Miss" : judgment.grade === "PERFECT" ? "Perfect" : judgment.grade === "GREAT" ? "Great" : "Good"}</Animated.Text>}

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
        <Text selectable={false} style={styles.accText}>{accuracy.toFixed(1)}%</Text>
      </View>
      <View style={styles.progTrack}><View style={[styles.progFill, { width: `${progress * 100}%`, backgroundColor: rock < 30 ? "#FF5C7A" : "rgba(255,255,255,0.5)" }]} /></View>
    </View>

    {/* VOCO / Vocopulse meter — auto-fires when full */}
    <View testID="vocopulse-meter" style={[styles.voco, { bottom: PAD_BOTTOM - 54 }, (pulseReady || pulseActive) && styles.vocoReady]}>
      <Ionicons name="flame" size={20} color={pulseActive ? "#FFB020" : pulseReady ? "#FF7A45" : "rgba(255,120,70,0.8)"} />
      <View style={styles.vocoTrack}><LinearGradient colors={pulseActive ? ["#FFB020", "#FF4D8D"] : ["#FF4D8D", "#B37CFF", "#2FE0D6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.vocoFill, { width: `${pulseActive ? 100 : pulse}%` }]} /></View>
      <Text selectable={false} style={[styles.vocoMult, (pulseReady || pulseActive) && { color: "#FFB020" }]}>{pulseActive ? "2×" : "1×"}</Text>
    </View>

    {/* Tap pads — single multi-touch surface (supports simultaneous lanes + rapid taps) */}
    <View style={[styles.pads, { height: PAD_H, bottom: PAD_BOTTOM }]} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => false} onTouchStart={onPadsTouchStart} onTouchEnd={onPadsTouchEnd} onTouchCancel={onPadsTouchEnd}>
      {settings.showLanePads && laneColors.map((c, l) => <Animated.View key={l} testID={`lane-${l + 1}-hit-pad`} pointerEvents="none" style={{ position: "absolute", left: l * padW + 3, width: padW - 6, top: 4, bottom: 4, borderRadius: 16, backgroundColor: c, opacity: laneFlash[l].interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }) }} />)}
    </View>

    {countdown > 0 && <View style={styles.countdown}><Avatar avatar={avatar} nickname={nickname} size={62} style={{ marginBottom: 14 }} /><Text selectable={false} style={styles.ready}>GET READY, {nickname.toUpperCase()}</Text><Text selectable={false} key={countdown} style={styles.count}>{countdown}</Text><Text selectable={false} style={styles.readySong}>{selectedSong.title}</Text></View>}

    <Modal visible={paused} transparent animationType="fade"><View style={styles.modal}><View style={styles.pauseCard}><View style={styles.pauseIcon}><Ionicons name="pause" size={28} color={colors.purple} /></View><Text selectable={false} style={styles.pauseTitle}>Paused</Text><Text selectable={false} style={styles.pauseCopy}>The stage is holding your place.</Text><NeonButton testID="resume-game-button" label="Resume" icon="play" onPress={togglePause} /><NeonButton testID="restart-game-button" label="Restart" icon="refresh" variant="secondary" onPress={restart} /><NeonButton testID="exit-game-button" label={testChart ? "Back to editor" : "Exit song"} icon="close" variant="danger" onPress={() => { player.pause(); cancelAnimation(clock); if (testChart) { setTestChart(null); router.back(); } else { router.replace("/library"); } }} /></View></View></Modal>
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
  hud: { position: "absolute", left: 18, right: 18 }, hudRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  score: { color: colors.text, fontSize: 34, lineHeight: 38, fontFamily: fonts.display, textShadowColor: rgba(0.6), textShadowRadius: 12 }, songMeta: { color: "rgba(245,245,247,0.55)", fontSize: 13, fontFamily: fonts.body, marginTop: 1 },
  pause: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  accRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }, accTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" }, accFill: { height: 7, borderRadius: 4 }, accText: { color: "rgba(245,245,247,0.85)", fontSize: 13, fontFamily: fonts.bold, width: 52, textAlign: "right" },
  progTrack: { height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 8, overflow: "hidden" }, progFill: { height: 4, borderRadius: 2 },
  voco: { position: "absolute", left: 18, right: 18, height: 44, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  vocoReady: { borderColor: "#FFE27A", backgroundColor: "rgba(255,226,122,0.12)" },
  vocoLabel: { color: "rgba(245,245,247,0.8)", fontSize: 12, letterSpacing: 2, fontFamily: fonts.heavy }, vocoTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" }, vocoFill: { height: 8, borderRadius: 4 }, vocoMult: { color: "rgba(245,245,247,0.9)", fontSize: 14, fontFamily: fonts.heavy, width: 26, textAlign: "right" },
  pads: { position: "absolute", left: 0, right: 0, flexDirection: "row" }, pad: { flex: 1, margin: 3, borderRadius: 18 },
  countdown: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)", alignItems: "center", justifyContent: "center" }, ready: { color: colors.purple, fontSize: 13, letterSpacing: 4, fontFamily: fonts.heavy }, count: { color: colors.text, fontSize: 118, lineHeight: 132, fontFamily: fonts.display }, readySong: { color: colors.muted, fontSize: 14, marginTop: 4, fontFamily: fonts.body },
  modal: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", alignItems: "center", justifyContent: "center", padding: 24 }, pauseCard: { width: "100%", maxWidth: 360, padding: 24, borderRadius: 28, gap: 12, backgroundColor: "#121214", borderWidth: 1, borderColor: colors.border }, pauseIcon: { alignSelf: "center", width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", backgroundColor: rgba(0.14), borderWidth: 1, borderColor: colors.purpleSoft }, pauseTitle: { color: colors.text, textAlign: "center", fontSize: 30, fontFamily: fonts.display }, pauseCopy: { color: colors.muted, textAlign: "center", marginBottom: 8, fontSize: 14, fontFamily: fonts.body },
  missing: { flex: 1, justifyContent: "center", padding: 28, gap: 16, backgroundColor: colors.bg }, missingTitle: { color: colors.text, fontSize: 30, fontFamily: fonts.display, textAlign: "center" }, missingCopy: { color: colors.muted, fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 8, fontFamily: fonts.body },
});
