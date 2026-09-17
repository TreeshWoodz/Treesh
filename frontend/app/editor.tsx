import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Slider from "@react-native-community/slider";
import { NeonButton, ScreenHeader } from "@/src/components/ui";
import { ShareCodeModal } from "@/src/components/ShareCodeModal";
import { useAppState } from "@/src/game/AppState";
import { colors, laneColors, fonts, rgba } from "@/src/game/theme";
import { clampHolds, generateChart } from "@/src/game/chartEngine";
import { encodeChartCode } from "@/src/game/shareCode";
import { Chart, Note } from "@/src/game/types";

const noteIcon = { tap: "ellipse", hold: "remove", wavy: "water", slide: "arrow-forward", chord: "grid", special: "sparkles" } as const;

const TUTORIAL: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: "sparkles", title: "Welcome to the Editor", body: "Build a custom chart by tapping in time with the music. Here's the quick tour." },
  { icon: "radio-button-on", title: "1 · Record", body: "Turn on Record, then press Play. Everything you tap on the board becomes a note." },
  { icon: "hand-left", title: "2 · Three note types", body: "Tap = note · press & hold = long note · drag sideways = wavy note. Use two fingers to place notes at the same time." },
  { icon: "construct", title: "3 · Fix & fill", body: "Tap a note then Erase to remove it. Undo and Redo anytime. Generate rest auto-fills the remainder of the track." },
  { icon: "save", title: "4 · Test & save", body: "Test plays your chart instantly. Save keeps it, and the share icon exports it as a file you can send to friends." },
];
const TAP_MAX = 0.18; // press longer than this (without moving) → hold note
const MOVE_EPS = 16; // finger travel beyond this → wave note

// Vertical sine-wave path (SVG y-down) shared by editor notes + live preview so "wavy" reads as a squiggle.
function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2; const my = (pts[i][1] + pts[i + 1][1]) / 2; d += ` Q ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`; }
  const last = pts[pts.length - 1]; d += ` L ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
  return d;
}
// Wave that traces the recorded finger path (relative to the note's lane), else a gentle sine.
function waveData(note: Note, len: number, laneW: number, cx: number) {
  if (note.path && note.path.length > 1) {
    const laneC = (note.lane + 0.5) / 4;
    const pts = note.path.map((p, i) => {
      const frac = note.path!.length > 1 ? i / (note.path!.length - 1) : 0;
      const dev = Math.max(-1, Math.min(1, (p.x - laneC) * 4)); // lanes of deviation
      return [cx + dev * laneW * 0.42, len * (1 - frac)] as [number, number];
    }).sort((a, b) => b[1] - a[1]);
    return smoothPath(pts);
  }
  const steps = 22; const cycles = Math.max(1.5, len / 40); const amp = cx * 0.5;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) { const t = i / steps; pts.push([cx + amp * Math.sin(t * cycles * Math.PI * 2), len * (1 - t)]); }
  return smoothPath(pts);
}

// Absolute board-space contour for the live wavy preview: traces the finger's real horizontal
// path across the whole board (oldest point = head at the hit line, newest = current finger at top).
function contourPath(points: { t: number; x: number }[], hw: number, height: number) {
  if (!points || points.length < 2) return "";
  const n = points.length;
  const pts = points.map((p, i) => [Math.max(6, Math.min(hw - 6, p.x * hw)), height * (1 - i / (n - 1))] as [number, number]);
  return smoothPath(pts);
}

function EditorNote({ note, clock, lookahead, boardH, laneW, hw, selected, onPress }: { note: Note; clock: Animated.Value; lookahead: number; boardH: number; laneW: number; hw: number; selected: boolean; onPress: () => void }) {
  const size = laneW * 0.52;
  const color = laneColors[note.lane];
  const isWavy = note.type === "wavy";
  const isHold = note.type === "hold" || note.type === "wavy";
  const dur = isHold ? (note.duration || 0.4) : 0;
  const start = note.time - lookahead;
  // Holds sit at the hit line for their whole duration so you can see them while recording/reviewing.
  const translateY = clock.interpolate({ inputRange: [start, note.time, note.time + dur, note.time + dur + 0.3], outputRange: [0, boardH, boardH, boardH + 30], extrapolate: "clamp" });
  const opacity = clock.interpolate({ inputRange: [start, start + 0.12, note.time + dur + 0.1, note.time + dur + 0.4], outputRange: [0, 1, 1, 0], extrapolate: "clamp" });
  const tailLen = isHold ? Math.min(boardH, (dur / lookahead) * boardH) : 0;
  const bw = laneW * 4; // full board width — draw the wave faithfully in absolute board coords (matches gameplay + live preview)
  const wavePath = isWavy ? contourPath(note.path || [], bw, tailLen) : "";
  return <Animated.View style={{ position: "absolute", left: note.lane * laneW + laneW / 2 - size / 2, top: -size / 2, width: size, height: size, opacity, transform: [{ translateY }] }}>
    {isHold && (isWavy
      ? <Svg width={bw} height={tailLen} style={{ position: "absolute", left: -(note.lane * laneW + laneW / 2 - size / 2), bottom: size * 0.5, overflow: "visible" }} pointerEvents="none">
          <Path d={wavePath} stroke={color} strokeWidth={size * 0.5} strokeOpacity={0.26} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d={wavePath} stroke={color} strokeWidth={size * 0.3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d={wavePath} stroke="rgba(255,255,255,0.7)" strokeWidth={size * 0.1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      : <View style={{ position: "absolute", width: size * 0.4, left: size * 0.3, bottom: size * 0.5, height: tailLen, borderRadius: 8, backgroundColor: `${color}55`, borderWidth: 1, borderColor: `${color}AA` }} />)}
    <Pressable onPress={onPress} style={[styles.eNote, { width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderColor: selected ? colors.text : "rgba(255,255,255,0.7)", borderWidth: selected ? 3 : 2 }]}><Ionicons name={noteIcon[note.type]} size={size * 0.36} color={colors.bg} /></Pressable>
  </Animated.View>;
}

export default function EditorScreen() {
  const { width, height } = useWindowDimensions();
  const { selectedSong, selectedDifficulty, setDifficulty, charts, saveChart, setTestChart, exportChart, settings, updateSettings } = useAppState();
  const existing = selectedSong ? charts[`${selectedSong.id}-Custom`] : undefined;
  const player = useAudioPlayer(selectedSong?.uri ? { uri: selectedSong.uri } : null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  // Blank canvas — the chart always starts empty; recording live builds it up.
  const [notes, setNotes] = useState<Note[]>([]);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tutorial, setTutorial] = useState(false);
  const [tStep, setTStep] = useState(0);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 1900); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { if (selectedSong && !settings.editorTutorialSeen) { setTStep(0); setTutorial(true); } }, [selectedSong, settings.editorTutorialSeen]);
  const endTutorial = () => { setTutorial(false); if (!settings.editorTutorialSeen) updateSettings({ editorTutorialSeen: true }); };
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nowLabel, setNowLabel] = useState(0);
  const [flashLane, setFlashLane] = useState(-1);
  const [drawing, setDrawing] = useState(false);
  const [drawTick, setDrawTick] = useState(0);
  const [boardH, setBoardH] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);

  const clock = useRef(new Animated.Value(0)).current;
  const clockStart = useRef(0);
  const recPulse = useRef(new Animated.Value(1)).current;
  const nowRef = useRef(0); const playingRef = useRef(false); const recordingRef = useRef(false);
  const undo = useRef<Note[][]>([]); const redo = useRef<Note[][]>([]);
  const captures = useRef<Map<number, { startX: number; startTime: number; wall: number; moved: boolean; points: { t: number; x: number }[] }>>(new Map());

  const HW = Math.min(width, 460);
  const LANE = HW / 4;
  const BOARD_H = height * 0.42;
  const duration = existing?.duration || status.duration || selectedSong?.duration || 60;
  const lookahead = 2.0;

  useEffect(() => { nowRef.current = nowLabel; }, [nowLabel]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { recordingRef.current = recording; if (!recording) { captures.current.clear(); setFlashLane(-1); setDrawing(false); } }, [recording]);

  // Blink the Record button's dot while recording (replaces the separate REC badge).
  useEffect(() => {
    if (!recording) { recPulse.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([Animated.timing(recPulse, { toValue: 0.2, duration: 480, useNativeDriver: true }), Animated.timing(recPulse, { toValue: 1, duration: 480, useNativeDriver: true })]));
    loop.start(); return () => { loop.stop(); recPulse.setValue(1); };
  }, [recording, recPulse]);

  // While a note is being drawn, tick so the live preview (hold tail growth / wave trail) re-renders.
  useEffect(() => { if (!drawing) return; const t = setInterval(() => setDrawTick(x => x + 1), 60); return () => clearInterval(t); }, [drawing]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => { const cur = (Date.now() - clockStart.current) / 1000; setNowLabel(cur); if (cur >= duration) { player.pause(); clock.stopAnimation(); setPlaying(false); } }, 110);
    return () => clearInterval(t);
  }, [playing, duration, player, clock]);

  const startClock = useCallback((from: number) => { clock.stopAnimation(); clock.setValue(from); Animated.timing(clock, { toValue: duration, duration: Math.max(10, (duration - from) * 1000), easing: Easing.linear, useNativeDriver: true }).start(); }, [clock, duration]);
  const curTime = () => (playingRef.current ? (Date.now() - clockStart.current) / 1000 : nowRef.current);

  const play = () => { clockStart.current = Date.now() - nowRef.current * 1000; player.seekTo(nowRef.current); player.play(); startClock(nowRef.current); setPlaying(true); };
  const pause = () => { player.pause(); clock.stopAnimation(); setPlaying(false); };
  const seek = (to: number) => { const t = Math.max(0, Math.min(duration, to)); player.seekTo(t); nowRef.current = t; setNowLabel(t); clock.stopAnimation(); clock.setValue(t); if (playingRef.current) { clockStart.current = Date.now() - t * 1000; startClock(t); } };
  const togglePlay = () => (playing ? pause() : play());

  const addNote = useCallback((note: Note) => { setNotes(prev => { undo.current.push(prev); if (undo.current.length > 120) undo.current.shift(); redo.current = []; return [...prev, note].sort((a, b) => a.time - b.time); }); setSaved(false); }, []);

  const laneFromX = (x: number) => Math.max(0, Math.min(3, Math.floor(x / LANE)));

  const commitCapture = useCallback((c: { startX: number; startTime: number; wall: number; moved: boolean; points: { t: number; x: number }[] }) => {
    const held = (Date.now() - c.wall) / 1000; const lane = Math.max(0, Math.min(3, Math.floor(c.startX / LANE)));
    const base = { id: `edit-${Date.now()}-${lane}-${Math.round(c.startTime * 100)}-${Math.floor(Math.random() * 9999)}`, lane, time: Math.max(0, c.startTime) };
    if (c.moved) addNote({ ...base, type: "wavy", duration: Math.max(0.3, held), path: c.points });
    else if (held >= TAP_MAX) addNote({ ...base, type: "hold", duration: Math.max(0.3, held) });
    else addNote({ ...base, type: "tap" });
  }, [addNote, LANE]);

  // Multi-touch board: every finger down opens its own capture, so multiple notes can be
  // placed at the exact same instant. Uses the Responder lifecycle (works for touch on native
  // AND mouse on web — raw onTouch* events never fire for a mouse pointer in React Native Web).
  const touchesOf = (e: any) => {
    const ct = e.nativeEvent.changedTouches;
    if (ct && ct.length) return ct as { identifier: number; locationX: number }[];
    const n = e.nativeEvent;
    return [{ identifier: n.identifier ?? 0, locationX: n.locationX ?? 0 }];
  };
  const onBoardStart = (e: any) => {
    if (!recordingRef.current) return;
    const time = curTime();
    for (const touch of touchesOf(e)) { const x = touch.locationX; captures.current.set(touch.identifier, { startX: x, startTime: time, wall: Date.now(), moved: false, points: [{ t: time, x: x / HW }] }); }
    const first = touchesOf(e)[0]; if (first) setFlashLane(laneFromX(first.locationX));
    setDrawing(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const onBoardMove = (e: any) => {
    if (!recordingRef.current) return;
    for (const touch of touchesOf(e)) {
      let c = captures.current.get(touch.identifier);
      const x = touch.locationX;
      if (!c) { const time = curTime(); captures.current.set(touch.identifier, { startX: x, startTime: time, wall: Date.now(), moved: false, points: [{ t: time, x: x / HW }] }); setDrawing(true); continue; }
      if (Math.abs(x - c.startX) > MOVE_EPS) c.moved = true; c.points.push({ t: curTime(), x: Math.max(0, Math.min(1, x / HW)) });
    }
    const first = touchesOf(e)[0]; if (first) setFlashLane(laneFromX(first.locationX)); setDrawTick(v => v + 1);
  };
  const onBoardEnd = (e: any) => {
    for (const touch of touchesOf(e)) { const c = captures.current.get(touch.identifier); if (!c) continue; captures.current.delete(touch.identifier); if (recordingRef.current) commitCapture(c); }
    if (!captures.current.size) { setFlashLane(-1); setDrawing(false); } else setDrawTick(v => v + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Auto-fill notes from the last placed note (or the playhead) to the end of the song.
  const generateRest = useCallback(() => {
    if (!selectedSong) return;
    const lastTime = notes.reduce((m, n) => Math.max(m, n.time + (n.duration || 0)), 0);
    const from = Math.max(lastTime + 0.5, nowRef.current);
    const full = generateChart(selectedSong.id, selectedSong.fileName || selectedSong.title, duration, "Normal");
    const additions = full.notes.filter(n => n.time > from).map(n => ({ ...n, id: `gen-${n.id}` }));
    if (!additions.length) return;
    setNotes(prev => { undo.current.push(prev); redo.current = []; return [...prev, ...additions].sort((a, b) => a.time - b.time); });
    setSaved(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [selectedSong, notes, duration]);

  const toggleSelect = (id: string) => setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const doUndo = () => { if (!undo.current.length) return; setNotes(prev => { redo.current.push(prev); return undo.current.pop()!; }); setSaved(false); };
  const doRedo = () => { if (!redo.current.length) return; setNotes(prev => { undo.current.push(prev); return redo.current.pop()!; }); setSaved(false); };
  const eraseSelected = () => { if (!selected.size) return; setNotes(prev => { undo.current.push(prev); redo.current = []; return prev.filter(n => !selected.has(n.id)); }); setSelected(new Set()); setSaved(false); };
  const eraseAll = () => { if (!notes.length) return; setNotes(prev => { undo.current.push(prev); redo.current = []; return []; }); setSelected(new Set()); setSaved(false); };

  const buildChart = (): Chart => ({ songId: selectedSong!.id, difficulty: "Custom", bpm: existing?.bpm || selectedSong!.bpm || 120, duration, notes: clampHolds(notes), waveform: existing?.waveform || Array.from({ length: 96 }, (_, i) => 0.2 + Math.abs(Math.sin(i * 0.5)) * 0.7) });

  const save = async () => {
    if (!selectedSong) return;
    if (!notes.length) { setToast("Add some notes first"); return; }
    await saveChart(buildChart()); setDifficulty("Custom"); setSaved(true); setToast("Chart saved \u2713"); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  const doExport = async () => {
    if (!selectedSong || !notes.length) { setToast("Add notes before exporting"); return; }
    try { await exportChart(buildChart(), selectedSong); setToast("Chart file exported"); } catch { setToast("Export failed"); }
  };
  const doShareCode = () => {
    if (!selectedSong || !notes.length) { setToast("Add notes before sharing"); return; }
    try { setShareCode(encodeChartCode(buildChart(), selectedSong)); } catch { setToast("Couldn't build a code"); }
  };

  // Play the current in-editor chart immediately — no save required.
  const test = () => {
    if (!selectedSong || !notes.length) return;
    pause(); setTestChart(buildChart()); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/game");
  };

  const visible = useMemo(() => notes.filter(n => { const end = n.time + ((n.type === "hold" || n.type === "wavy") ? (n.duration || 0) : 0); return n.time - nowLabel < lookahead && end - nowLabel > -0.4; }), [notes, nowLabel]);

  // Live preview for every finger currently drawing (recomputed each drawTick).
  const bH = boardH || BOARD_H;
  const previews = useMemo(() => {
    if (!drawing) return [] as { lane: number; held: number; type: "tap" | "hold" | "wavy"; x: number; points: { t: number; x: number }[] }[];
    return Array.from(captures.current.values()).map(c => {
      const held = (Date.now() - c.wall) / 1000;
      const lane = Math.max(0, Math.min(3, Math.floor(c.startX / LANE)));
      const last = c.points[c.points.length - 1];
      const type: "tap" | "hold" | "wavy" = c.moved ? "wavy" : held >= TAP_MAX ? "hold" : "tap";
      return { lane, held, type, x: (last?.x ?? c.startX / HW) * HW, points: c.points };
    });
  }, [drawing, drawTick, HW, LANE, BOARD_H]);

  if (!selectedSong) return <SafeAreaView style={styles.safe} edges={["top"]}><ScreenHeader title="Editor" /><View style={styles.empty}><Ionicons name="musical-notes-outline" size={44} color={colors.purple} /><Text selectable={false} style={styles.emptyTitle}>Choose a track first</Text><Text selectable={false} style={styles.emptyCopy}>Pick a song to build a custom chart for.</Text><NeonButton testID="editor-open-library-button" label="Choose a track" icon="library" onPress={() => router.replace({ pathname: "/library", params: { pick: "editor" } })} /></View></SafeAreaView>;

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
    <ScreenHeader title="Editor" right={<View style={styles.hRight}><Pressable testID="editor-help-button" onPress={() => { setTStep(0); setTutorial(true); }} style={styles.hBtn}><Ionicons name="help" size={16} color={colors.text} /></Pressable><Pressable testID="editor-share-code-button" onPress={doShareCode} style={styles.hBtn}><Ionicons name="share-social-outline" size={15} color={colors.text} /></Pressable><Pressable testID="export-chart-button" onPress={doExport} style={styles.hBtn}><Ionicons name="download-outline" size={15} color={colors.text} /></Pressable><Pressable testID="save-chart-button" onPress={save} style={[styles.save, saved && { backgroundColor: rgba(0.35) }]}><Ionicons name={saved ? "checkmark" : "save"} size={15} color={colors.bg} /><Text selectable={false} style={styles.saveText}>{saved ? "Saved" : "Save"}</Text></Pressable></View>} />
    <ShareCodeModal visible={!!shareCode} code={shareCode || ""} title={selectedSong.title} onClose={() => setShareCode(null)} />
    {toast && <View pointerEvents="none" style={styles.toast}><Ionicons name="checkmark-circle" size={16} color={colors.lime} /><Text selectable={false} style={styles.toastText}>{toast}</Text></View>}
    <Modal visible={tutorial} transparent animationType="fade" onRequestClose={endTutorial}>
      <View style={styles.tutOverlay}>
        <View style={styles.tutCard}>
          <View style={styles.tutIconWrap}><Ionicons name={TUTORIAL[tStep].icon} size={28} color={colors.purple} /></View>
          <Text selectable={false} style={styles.tutStep}>STEP {tStep + 1} OF {TUTORIAL.length}</Text>
          <Text selectable={false} style={styles.tutTitle}>{TUTORIAL[tStep].title}</Text>
          <Text selectable={false} style={styles.tutBody}>{TUTORIAL[tStep].body}</Text>
          <View style={styles.tutDots}>{TUTORIAL.map((_, i) => <View key={i} style={[styles.tutDot, i === tStep && styles.tutDotOn]} />)}</View>
          <View style={styles.tutBtns}>
            <Pressable testID="tutorial-skip-button" onPress={endTutorial} style={styles.tutSkip}><Text selectable={false} style={styles.tutSkipText}>Skip</Text></Pressable>
            <Pressable testID="tutorial-next-button" onPress={() => (tStep < TUTORIAL.length - 1 ? setTStep(tStep + 1) : endTutorial())} style={styles.tutNext}><Text selectable={false} style={styles.tutNextText}>{tStep < TUTORIAL.length - 1 ? "Next" : "Got it"}</Text><Ionicons name="arrow-forward" size={16} color={colors.bg} /></Pressable>
          </View>
        </View>
      </View>
    </Modal>

    <View style={styles.songBar}>
      <View style={{ flex: 1 }}><Text selectable={false} style={styles.song} numberOfLines={1}>{selectedSong.title}</Text><Text selectable={false} style={styles.meta} testID="editor-note-count">{notes.length} NOTES · CUSTOM CHART</Text></View>
      <Pressable testID="editor-change-track-button" onPress={() => router.push({ pathname: "/library", params: { pick: "editor" } })} style={styles.change}><Ionicons name="swap-horizontal" size={15} color={colors.text} /><Text selectable={false} style={styles.changeText}>Change</Text></Pressable>
    </View>

    <View style={styles.modeBar}>
      <Pressable testID="editor-record-button" onPress={() => setRecording(r => !r)} style={[styles.modeBtn, recording && styles.modeBtnRec]}><Animated.View style={[styles.recDot, recording && styles.recDotOn, recording && { opacity: recPulse }]} /><Text selectable={false} style={[styles.modeText, recording && { color: colors.bg }]}>{recording ? "Recording" : "Record"}</Text></Pressable>
      <Pressable testID="editor-test-button" onPress={test} style={styles.testBtn}><Ionicons name="game-controller" size={15} color={colors.bg} /><Text selectable={false} style={styles.testText}>Test</Text></Pressable>
      <Pressable testID="editor-generate-rest-button" onPress={generateRest} style={styles.genBtn}><Ionicons name="sparkles" size={14} color={colors.bg} /><Text selectable={false} style={styles.genText}>Generate rest</Text></Pressable>
    </View>

    {showHint ? (
      <View style={styles.hintCard}>
        <Ionicons name="bulb" size={16} color={colors.gold} />
        <Text selectable={false} style={styles.hintText}>{recording ? "Recording is ON. Press Play, then on the board: tap = note · press & hold = long note · drag sideways = wavy note. Use two or more fingers to place notes at the same time." : "Turn on Record, press Play, then tap the lanes in time with the song. Tap Generate rest to auto-fill the remainder of the track."}</Text>
        <Pressable testID="editor-hint-toggle" onPress={() => setShowHint(false)} hitSlop={8} style={styles.hintClose}><Ionicons name="close" size={15} color={colors.muted} /></Pressable>
      </View>
    ) : (
      <Pressable testID="editor-hint-toggle" onPress={() => setShowHint(true)} style={styles.hintShow}><Ionicons name="bulb" size={13} color={colors.gold} /><Text selectable={false} style={styles.hintShowText}>Show tips</Text></Pressable>
    )}

    {/* Falling board — doubles as the live input surface while recording */}
    <View style={styles.boardWrap}>
      <View style={[styles.board, { width: HW }]} onLayout={e => setBoardH(e.nativeEvent.layout.height)} onStartShouldSetResponder={() => recordingRef.current} onMoveShouldSetResponder={() => recordingRef.current} onResponderTerminationRequest={() => false} onResponderGrant={onBoardStart} onResponderMove={onBoardMove} onResponderRelease={onBoardEnd} onResponderTerminate={onBoardEnd}>
        {[0, 1, 2, 3, 4].map(l => <View key={l} style={[styles.boardDiv, { left: l * LANE }]} />)}
        {laneColors.map((c, l) => <View key={`g${l}`} style={[styles.laneCol, { left: l * LANE, width: LANE, backgroundColor: flashLane === l ? `${c}22` : "transparent" }]} />)}
        {laneColors.map((c, l) => <View key={`ln${l}`} style={[styles.laneNo, { left: l * LANE, width: LANE }]}><Text selectable={false} style={[styles.laneNoText, { color: c }]}>{l + 1}</Text></View>)}
        <View style={styles.hitLineFull} />
        <View pointerEvents={recording ? "none" : "box-none"} style={StyleSheet.absoluteFill}>
          {visible.map(n => <EditorNote key={n.id} note={n} clock={clock} lookahead={lookahead} boardH={BOARD_H} laneW={LANE} hw={HW} selected={selected.has(n.id)} onPress={() => toggleSelect(n.id)} />)}
        </View>
        {previews.map((preview, idx) => {
          const size = LANE * 0.52; const color = laneColors[preview.lane]; const hitY = bH * 0.84;
          const tailLen = preview.type === "tap" ? 0 : Math.min(bH * 0.8, (preview.held / lookahead) * bH);
          const startX = (preview.points[0]?.x ?? (preview.lane + 0.5) / 4) * HW; // head stays where the note began
          const tipX = Math.max(0, Math.min(HW, preview.x));                       // current finger position
          const headX = preview.type === "wavy" ? startX : preview.lane * LANE + LANE / 2;
          const wavePath = preview.type === "wavy" && tailLen > 0 && preview.points.length > 1 ? contourPath(preview.points, HW, tailLen) : "";
          return <View key={idx} pointerEvents="none" style={StyleSheet.absoluteFill}>
            {preview.type === "hold" && tailLen > 0 && <View style={{ position: "absolute", left: headX - size * 0.2, top: hitY - tailLen, width: size * 0.4, height: tailLen, borderRadius: 8, backgroundColor: `${color}55`, borderWidth: 1, borderColor: `${color}AA` }} />}
            {wavePath !== "" && <Svg width={HW} height={tailLen} style={{ position: "absolute", left: 0, top: hitY - tailLen }} pointerEvents="none">
              <Path d={wavePath} stroke={color} strokeWidth={size * 0.5} strokeOpacity={0.26} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Path d={wavePath} stroke={color} strokeWidth={size * 0.3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Path d={wavePath} stroke="rgba(255,255,255,0.75)" strokeWidth={size * 0.1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>}
            {preview.type === "wavy" && tailLen > 0 && <View style={{ position: "absolute", left: tipX - size * 0.2, top: hitY - tailLen - size * 0.2, width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2, backgroundColor: "#fff", borderWidth: 2, borderColor: color, shadowColor: color, shadowOpacity: 0.9, shadowRadius: 8, elevation: 6 }} />}
            <View style={{ position: "absolute", left: headX - size / 2, top: hitY - size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderWidth: 3, borderColor: colors.text, alignItems: "center", justifyContent: "center", opacity: 0.97 }}>
              <Ionicons name={noteIcon[preview.type]} size={size * 0.36} color={colors.bg} />
            </View>
          </View>;
        })}
      </View>
    </View>

    {/* Seek */}
    <View style={styles.seekRow}>
      <Pressable testID="editor-rewind-button" onPress={() => seek(nowLabel - 5)} style={styles.seekBtn}><Ionicons name="play-back" size={16} color={colors.text} /></Pressable>
      <Slider testID="editor-seek-slider" style={{ flex: 1, height: 34 }} minimumValue={0} maximumValue={duration} value={nowLabel} onSlidingComplete={seek} minimumTrackTintColor={colors.purple} maximumTrackTintColor="rgba(255,255,255,0.18)" thumbTintColor={colors.purple} />
      <Pressable testID="editor-forward-button" onPress={() => seek(nowLabel + 5)} style={styles.seekBtn}><Ionicons name="play-forward" size={16} color={colors.text} /></Pressable>
    </View>

    {/* Transport */}
    <View style={styles.transport}>
      <Text selectable={false} style={styles.time}>{Math.floor(nowLabel / 60)}:{String(Math.floor(nowLabel % 60)).padStart(2, "0")}</Text>
      <Pressable testID="editor-play-button" onPress={togglePlay} style={styles.playBtn}><Ionicons name={playing ? "pause" : "play"} size={26} color={colors.bg} /></Pressable>
      <Pressable testID="editor-restart-button" onPress={() => seek(0)} style={styles.tBtn}><Ionicons name="refresh" size={20} color={colors.text} /></Pressable>
    </View>

    {/* Edit controls */}
    <View style={styles.controls}>
      <Pressable testID="editor-undo-button" onPress={doUndo} style={styles.ctrl}><Ionicons name="arrow-undo" size={18} color={colors.text} /><Text selectable={false} style={styles.ctrlText}>Undo</Text></Pressable>
      <Pressable testID="editor-redo-button" onPress={doRedo} style={styles.ctrl}><Ionicons name="arrow-redo" size={18} color={colors.text} /><Text selectable={false} style={styles.ctrlText}>Redo</Text></Pressable>
      <Pressable testID="editor-erase-selected-button" onPress={eraseSelected} style={styles.ctrl}><Ionicons name="cut" size={18} color={colors.pink} /><Text selectable={false} style={[styles.ctrlText, { color: colors.pink }]}>Erase {selected.size || ""}</Text></Pressable>
      <Pressable testID="editor-erase-all-button" onPress={eraseAll} style={styles.ctrl}><Ionicons name="trash" size={18} color={colors.pink} /><Text selectable={false} style={[styles.ctrlText, { color: colors.pink }]}>Erase all</Text></Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  save: { minHeight: 36, paddingHorizontal: 13, borderRadius: 18, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.purple }, saveText: { color: colors.bg, fontSize: 12, fontFamily: fonts.heavy },
  hRight: { flexDirection: "row", alignItems: "center", gap: 6 }, hBtn: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: colors.panelStrong, borderWidth: 1, borderColor: colors.border }, toast: { position: "absolute", top: 92, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14, backgroundColor: "rgba(20,22,26,0.97)", borderWidth: 1, borderColor: colors.lime, zIndex: 50, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 10 }, toastText: { color: colors.text, fontFamily: fonts.heavy, fontSize: 13 },
  tutOverlay: { flex: 1, backgroundColor: "rgba(6,6,9,0.82)", alignItems: "center", justifyContent: "center", padding: 26 }, tutCard: { width: "100%", maxWidth: 360, borderRadius: 24, padding: 24, backgroundColor: "#14141B", borderWidth: 1, borderColor: "rgba(142,124,255,0.4)", alignItems: "center", shadowColor: colors.purple, shadowOpacity: 0.4, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 16 }, tutIconWrap: { width: 60, height: 60, borderRadius: 20, backgroundColor: "rgba(142,124,255,0.14)", borderWidth: 1, borderColor: "rgba(142,124,255,0.4)", alignItems: "center", justifyContent: "center", marginBottom: 16 }, tutStep: { color: colors.purple, fontSize: 10, letterSpacing: 1.6, fontFamily: fonts.heavy }, tutTitle: { color: colors.text, fontSize: 21, fontFamily: fonts.display, marginTop: 8, textAlign: "center" }, tutBody: { color: colors.muted, fontSize: 14, lineHeight: 20, fontFamily: fonts.body, textAlign: "center", marginTop: 10 }, tutDots: { flexDirection: "row", gap: 6, marginTop: 20 }, tutDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.18)" }, tutDotOn: { backgroundColor: colors.purple, width: 20 }, tutBtns: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 22, alignSelf: "stretch" }, tutSkip: { flex: 1, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.panelStrong, borderWidth: 1, borderColor: colors.border }, tutSkipText: { color: colors.muted, fontFamily: fonts.heavy, fontSize: 14 }, tutNext: { flex: 1.4, height: 48, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: colors.purple }, tutNextText: { color: colors.bg, fontFamily: fonts.heavy, fontSize: 15 },
  songBar: { minHeight: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border }, song: { color: colors.text, fontSize: 17, fontFamily: fonts.heavy }, meta: { color: colors.purple, fontSize: 10, fontWeight: "900", letterSpacing: 0.8, marginTop: 3, fontFamily: fonts.bold }, change: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, changeText: { color: colors.text, fontSize: 12, fontFamily: fonts.bold },
  modeBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: rgba(0.08) },
  genBtn: { flexDirection: "row", alignItems: "center", gap: 5, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: colors.gold, marginLeft: "auto" }, genText: { color: colors.bg, fontSize: 12, fontFamily: fonts.heavy },
  hintCard: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 14, backgroundColor: "rgba(245,200,66,0.08)", borderWidth: 1, borderColor: "rgba(245,200,66,0.25)" }, hintText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 17, fontFamily: fonts.body }, hintClose: { width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)" }, hintShow: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 12, marginBottom: 8, paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: "rgba(245,200,66,0.08)", borderWidth: 1, borderColor: "rgba(245,200,66,0.25)" }, hintShowText: { color: colors.gold, fontSize: 11, fontFamily: fonts.heavy },
  modeBtn: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, modeBtnRec: { backgroundColor: colors.pink, borderColor: colors.pink }, modeText: { color: colors.text, fontSize: 12, fontFamily: fonts.heavy }, recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.5)" }, recDotOn: { backgroundColor: colors.bg }, modeHint: { flex: 1, color: colors.muted, fontSize: 10, fontFamily: fonts.body, textAlign: "right" },
  boardWrap: { flex: 1, alignItems: "center", backgroundColor: "#08080C", overflow: "hidden" }, board: { flex: 1, overflow: "hidden" }, boardDiv: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.08)" }, laneCol: { position: "absolute", top: 0, bottom: 0 }, laneNo: { position: "absolute", top: 8, alignItems: "center" }, laneNoText: { fontSize: 11, fontFamily: fonts.heavy, opacity: 0.5 }, hitLineFull: { position: "absolute", left: 0, right: 0, bottom: "16%", height: 2, backgroundColor: "rgba(255,255,255,0.4)" }, eNote: { alignItems: "center", justifyContent: "center" },
  seekRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginTop: 6 }, seekBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  transport: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, paddingVertical: 6 }, testBtn: { flexDirection: "row", alignItems: "center", gap: 5, height: 36, paddingHorizontal: 13, borderRadius: 18, backgroundColor: colors.lime }, testText: { color: colors.bg, fontSize: 13, fontFamily: fonts.heavy }, time: { color: colors.muted, fontSize: 13, fontFamily: fonts.bold, width: 40, textAlign: "center" }, playBtn: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center", backgroundColor: colors.purple, shadowColor: colors.purple, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8 }, tBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  controls: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 8, paddingTop: 2 }, ctrl: { flex: 1, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 3, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, ctrlText: { color: colors.text, fontSize: 11, fontFamily: fonts.bold },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28, gap: 14 }, emptyTitle: { color: colors.text, fontSize: 24, fontFamily: fonts.display, textAlign: "center" }, emptyCopy: { color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 6, fontFamily: fonts.body },
});
