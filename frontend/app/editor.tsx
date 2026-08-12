import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { NeonButton, ScreenHeader } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { colors, laneColors, fonts, rgba } from "@/src/game/theme";
import { clampHolds } from "@/src/game/chartEngine";
import { Chart, Note } from "@/src/game/types";

const noteIcon = { tap: "ellipse", hold: "remove", wavy: "water", slide: "arrow-forward", chord: "grid", special: "sparkles" } as const;
const TAP_MAX = 0.18; // press longer than this (without moving) → hold note
const MOVE_EPS = 16; // finger travel beyond this → wave note

function EditorNote({ note, clock, lookahead, boardH, laneW, hw, selected, onPress }: { note: Note; clock: Animated.Value; lookahead: number; boardH: number; laneW: number; hw: number; selected: boolean; onPress: () => void }) {
  const size = laneW * 0.52;
  const color = laneColors[note.lane];
  const isHold = note.type === "hold" || note.type === "wavy";
  const dur = isHold ? (note.duration || 0.4) : 0;
  const start = note.time - lookahead;
  // Holds sit at the hit line for their whole duration so you can see them while recording/reviewing.
  const translateY = clock.interpolate({ inputRange: [start, note.time, note.time + dur, note.time + dur + 0.3], outputRange: [0, boardH, boardH, boardH + 30], extrapolate: "clamp" });
  const opacity = clock.interpolate({ inputRange: [start, start + 0.12, note.time + dur + 0.1, note.time + dur + 0.4], outputRange: [0, 1, 1, 0], extrapolate: "clamp" });
  const tailLen = isHold ? Math.min(boardH, (dur / lookahead) * boardH) : 0;
  return <Animated.View style={{ position: "absolute", left: note.lane * laneW + laneW / 2 - size / 2, top: -size / 2, width: size, height: size, opacity, transform: [{ translateY }] }}>
    {isHold && <View style={{ position: "absolute", width: size * 0.4, left: size * 0.3, bottom: size * 0.5, height: tailLen, borderRadius: 8, backgroundColor: `${color}55`, borderWidth: 1, borderColor: `${color}AA` }} />}
    <Pressable onPress={onPress} style={[styles.eNote, { width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderColor: selected ? colors.text : "rgba(255,255,255,0.7)", borderWidth: selected ? 3 : 2 }]}><Ionicons name={noteIcon[note.type]} size={size * 0.36} color={colors.bg} /></Pressable>
  </Animated.View>;
}

export default function EditorScreen() {
  const { width, height } = useWindowDimensions();
  const { selectedSong, selectedDifficulty, setDifficulty, charts, saveChart, setTestChart } = useAppState();
  const existing = selectedSong ? charts[`${selectedSong.id}-Custom`] : undefined;
  const player = useAudioPlayer(selectedSong?.uri ? { uri: selectedSong.uri } : null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  // Blank canvas — the chart always starts empty; recording live builds it up.
  const [notes, setNotes] = useState<Note[]>([]);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nowLabel, setNowLabel] = useState(0);
  const [flashLane, setFlashLane] = useState(-1);
  const [drawing, setDrawing] = useState(false);
  const [drawTick, setDrawTick] = useState(0);
  const [boardH, setBoardH] = useState(0);

  const clock = useRef(new Animated.Value(0)).current;
  const clockStart = useRef(0);
  const nowRef = useRef(0); const playingRef = useRef(false); const recordingRef = useRef(false);
  const undo = useRef<Note[][]>([]); const redo = useRef<Note[][]>([]);
  const cap = useRef<{ startX: number; startTime: number; wall: number; moved: boolean; points: { t: number; x: number }[] } | null>(null);

  const HW = Math.min(width, 460);
  const LANE = HW / 4;
  const BOARD_H = height * 0.42;
  const duration = existing?.duration || status.duration || selectedSong?.duration || 60;
  const lookahead = 2.0;

  useEffect(() => { nowRef.current = nowLabel; }, [nowLabel]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { recordingRef.current = recording; if (!recording) { cap.current = null; setFlashLane(-1); setDrawing(false); } }, [recording]);

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

  // The whole board is the live input surface — but only while Record is on (capture-phase steals touches from note-select).
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponderCapture: () => recordingRef.current,
    onMoveShouldSetPanResponderCapture: () => recordingRef.current,
    onPanResponderGrant: (e) => {
      if (!recordingRef.current) return;
      const x = e.nativeEvent.locationX; const t = curTime();
      cap.current = { startX: x, startTime: t, wall: Date.now(), moved: false, points: [{ t, x: x / HW }] };
      setFlashLane(laneFromX(x)); setDrawing(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onPanResponderMove: (e) => {
      const c = cap.current; if (!c) return;
      const x = e.nativeEvent.locationX; if (Math.abs(x - c.startX) > MOVE_EPS) c.moved = true;
      c.points.push({ t: curTime(), x: Math.max(0, Math.min(1, x / HW)) });
      setFlashLane(laneFromX(x)); setDrawTick(v => v + 1);
    },
    onPanResponderRelease: () => {
      const c = cap.current; cap.current = null; setFlashLane(-1); setDrawing(false);
      if (!c || !recordingRef.current) return;
      const held = (Date.now() - c.wall) / 1000; const lane = laneFromX(c.startX);
      const base = { id: `edit-${Date.now()}-${lane}-${Math.round(c.startTime * 100)}`, lane, time: Math.max(0, c.startTime) };
      if (c.moved) addNote({ ...base, type: "wavy", duration: Math.max(0.3, held), path: c.points });
      else if (held >= TAP_MAX) addNote({ ...base, type: "hold", duration: Math.max(0.3, held) });
      else addNote({ ...base, type: "tap" });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    onPanResponderTerminate: () => { cap.current = null; setFlashLane(-1); setDrawing(false); },
  })).current;

  const toggleSelect = (id: string) => setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const doUndo = () => { if (!undo.current.length) return; setNotes(prev => { redo.current.push(prev); return undo.current.pop()!; }); setSaved(false); };
  const doRedo = () => { if (!redo.current.length) return; setNotes(prev => { undo.current.push(prev); return redo.current.pop()!; }); setSaved(false); };
  const eraseSelected = () => { if (!selected.size) return; setNotes(prev => { undo.current.push(prev); redo.current = []; return prev.filter(n => !selected.has(n.id)); }); setSelected(new Set()); setSaved(false); };
  const eraseAll = () => { if (!notes.length) return; setNotes(prev => { undo.current.push(prev); redo.current = []; return []; }); setSelected(new Set()); setSaved(false); };

  const buildChart = (): Chart => ({ songId: selectedSong!.id, difficulty: "Custom", bpm: existing?.bpm || selectedSong!.bpm || 120, duration, notes: clampHolds(notes), waveform: existing?.waveform || Array.from({ length: 96 }, (_, i) => 0.2 + Math.abs(Math.sin(i * 0.5)) * 0.7) });

  const save = async () => {
    if (!selectedSong || !notes.length) return;
    await saveChart(buildChart()); setDifficulty("Custom"); setSaved(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Play the current in-editor chart immediately — no save required.
  const test = () => {
    if (!selectedSong || !notes.length) return;
    pause(); setTestChart(buildChart()); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/game");
  };

  const visible = useMemo(() => notes.filter(n => { const end = n.time + ((n.type === "hold" || n.type === "wavy") ? (n.duration || 0) : 0); return n.time - nowLabel < lookahead && end - nowLabel > -0.4; }), [notes, nowLabel]);

  // Live preview of the note being drawn (recomputed each drawTick from the active capture).
  const bH = boardH || BOARD_H;
  const preview = useMemo(() => {
    if (!drawing) return null;
    const c = cap.current; if (!c) return null;
    const held = (Date.now() - c.wall) / 1000;
    const lane = laneFromX(c.startX);
    const last = c.points[c.points.length - 1];
    const type = c.moved ? "wavy" : held >= TAP_MAX ? "hold" : "tap";
    return { lane, held, type, x: (last?.x ?? c.startX / HW) * HW, points: c.points };
  }, [drawing, drawTick, HW, BOARD_H]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selectedSong) return <SafeAreaView style={styles.safe} edges={["top"]}><ScreenHeader title="Chart Editor" /><View style={styles.empty}><Ionicons name="musical-notes-outline" size={44} color={colors.purple} /><Text selectable={false} style={styles.emptyTitle}>Choose a track first</Text><Text selectable={false} style={styles.emptyCopy}>Pick a song to build a custom chart for.</Text><NeonButton testID="editor-open-library-button" label="Choose a track" icon="library" onPress={() => router.replace("/library")} /></View></SafeAreaView>;

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
    <ScreenHeader title="Chart Editor" right={<Pressable testID="save-chart-button" onPress={save} style={[styles.save, saved && { backgroundColor: rgba(0.35) }]}><Ionicons name={saved ? "checkmark" : "save"} size={15} color={colors.bg} /><Text selectable={false} style={styles.saveText}>{saved ? "Saved" : "Save"}</Text></Pressable>} />

    <View style={styles.songBar}>
      <View style={{ flex: 1 }}><Text selectable={false} style={styles.song} numberOfLines={1}>{selectedSong.title}</Text><Text selectable={false} style={styles.meta} testID="editor-note-count">{notes.length} NOTES · CUSTOM CHART</Text></View>
      <Pressable testID="editor-change-track-button" onPress={() => router.push("/library")} style={styles.change}><Ionicons name="swap-horizontal" size={15} color={colors.text} /><Text selectable={false} style={styles.changeText}>Change</Text></Pressable>
    </View>

    <View style={styles.modeBar}>
      <Pressable testID="editor-record-button" onPress={() => setRecording(r => !r)} style={[styles.modeBtn, recording && styles.modeBtnRec]}><View style={[styles.recDot, recording && styles.recDotOn]} /><Text selectable={false} style={[styles.modeText, recording && { color: colors.bg }]}>{recording ? "Recording" : "Record"}</Text></Pressable>
      <Pressable testID="editor-test-button" onPress={test} style={styles.testBtn}><Ionicons name="game-controller" size={15} color={colors.bg} /><Text selectable={false} style={styles.testText}>Test</Text></Pressable>
      <Text selectable={false} style={styles.modeHint} numberOfLines={2}>{recording ? "Play, then tap = note · hold = long · drag = wave" : "Record, then Play to place notes"}</Text>
    </View>

    {/* Falling board — doubles as the live input surface while recording */}
    <View style={styles.boardWrap}>
      <View style={[styles.board, { width: HW }]} onLayout={e => setBoardH(e.nativeEvent.layout.height)} {...pan.panHandlers}>
        {[0, 1, 2, 3, 4].map(l => <View key={l} style={[styles.boardDiv, { left: l * LANE }]} />)}
        {laneColors.map((c, l) => <View key={`g${l}`} style={[styles.laneCol, { left: l * LANE, width: LANE, backgroundColor: flashLane === l ? `${c}22` : "transparent" }]} />)}
        {laneColors.map((c, l) => <View key={`ln${l}`} style={[styles.laneNo, { left: l * LANE, width: LANE }]}><Text selectable={false} style={[styles.laneNoText, { color: c }]}>{l + 1}</Text></View>)}
        <View style={styles.hitLineFull} />
        {visible.map(n => <EditorNote key={n.id} note={n} clock={clock} lookahead={lookahead} boardH={BOARD_H} laneW={LANE} hw={HW} selected={selected.has(n.id)} onPress={() => toggleSelect(n.id)} />)}
        {preview && (() => {
          const size = LANE * 0.52; const color = laneColors[preview.lane]; const hitY = bH * 0.84;
          const cx = preview.type === "wavy" ? Math.max(size / 2, Math.min(HW - size / 2, preview.x)) : preview.lane * LANE + LANE / 2;
          const tailLen = preview.type === "tap" ? 0 : Math.min(bH * 0.8, (preview.held / lookahead) * bH);
          const trail = preview.points.slice(-16);
          return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {tailLen > 0 && <View style={{ position: "absolute", left: cx - size * 0.2, top: hitY - tailLen, width: size * 0.4, height: tailLen, borderRadius: 8, backgroundColor: `${color}55`, borderWidth: 1, borderColor: `${color}AA` }} />}
            {preview.type === "wavy" && trail.map((p, i) => <View key={i} style={{ position: "absolute", left: p.x * HW - 3, top: hitY - (trail.length - 1 - i) * 7 - 3, width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: 0.3 + (i / trail.length) * 0.6 }} />)}
            <View style={{ position: "absolute", left: cx - size / 2, top: hitY - size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderWidth: 3, borderColor: colors.text, alignItems: "center", justifyContent: "center", opacity: 0.95 }}>
              <Ionicons name={noteIcon[preview.type]} size={size * 0.36} color={colors.bg} />
            </View>
          </View>;
        })()}
        {recording && <View pointerEvents="none" style={styles.recBadge}><View style={styles.recBadgeDot} /><Text selectable={false} style={styles.recBadgeText}>REC</Text></View>}
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
  songBar: { minHeight: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border }, song: { color: colors.text, fontSize: 17, fontFamily: fonts.heavy }, meta: { color: colors.purple, fontSize: 10, fontWeight: "900", letterSpacing: 0.8, marginTop: 3, fontFamily: fonts.bold }, change: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, changeText: { color: colors.text, fontSize: 12, fontFamily: fonts.bold },
  modeBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: rgba(0.08) },
  modeBtn: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, modeBtnRec: { backgroundColor: colors.pink, borderColor: colors.pink }, modeText: { color: colors.text, fontSize: 12, fontFamily: fonts.heavy }, recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.5)" }, recDotOn: { backgroundColor: colors.bg }, modeHint: { flex: 1, color: colors.muted, fontSize: 10, fontFamily: fonts.body, textAlign: "right" },
  boardWrap: { flex: 1, alignItems: "center", backgroundColor: "#08080C", overflow: "hidden" }, board: { flex: 1, overflow: "hidden" }, boardDiv: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.08)" }, laneCol: { position: "absolute", top: 0, bottom: 0 }, laneNo: { position: "absolute", top: 8, alignItems: "center" }, laneNoText: { fontSize: 11, fontFamily: fonts.heavy, opacity: 0.5 }, hitLineFull: { position: "absolute", left: 0, right: 0, bottom: "16%", height: 2, backgroundColor: "rgba(255,255,255,0.4)" }, eNote: { alignItems: "center", justifyContent: "center" },
  recBadge: { position: "absolute", top: 8, right: 10, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: colors.pink }, recBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.pink }, recBadgeText: { color: colors.text, fontSize: 10, fontFamily: fonts.heavy, letterSpacing: 1 },
  seekRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginTop: 6 }, seekBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  transport: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, paddingVertical: 6 }, testBtn: { flexDirection: "row", alignItems: "center", gap: 5, height: 36, paddingHorizontal: 13, borderRadius: 18, backgroundColor: colors.lime }, testText: { color: colors.bg, fontSize: 13, fontFamily: fonts.heavy }, time: { color: colors.muted, fontSize: 13, fontFamily: fonts.bold, width: 40, textAlign: "center" }, playBtn: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center", backgroundColor: colors.purple, shadowColor: colors.purple, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8 }, tBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  controls: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 8, paddingTop: 2 }, ctrl: { flex: 1, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 3, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, ctrlText: { color: colors.text, fontSize: 11, fontFamily: fonts.bold },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28, gap: 14 }, emptyTitle: { color: colors.text, fontSize: 24, fontFamily: fonts.display, textAlign: "center" }, emptyCopy: { color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 6, fontFamily: fonts.body },
});
