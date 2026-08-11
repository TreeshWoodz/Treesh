import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { NeonButton, ScreenHeader } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { colors, laneColors, fonts, rgba } from "@/src/game/theme";
import { Chart, Note } from "@/src/game/types";

const noteIcon = { tap: "ellipse", hold: "remove", wavy: "water", slide: "arrow-forward", chord: "grid", special: "sparkles" } as const;
const TAP_MAX = 0.2;

function EditorNote({ note, clock, lookahead, boardH, laneW, color, selected, onPress }: { note: Note; clock: Animated.Value; lookahead: number; boardH: number; laneW: number; color: string; selected: boolean; onPress: () => void }) {
  const size = laneW * 0.54;
  const start = note.time - lookahead;
  const translateY = clock.interpolate({ inputRange: [start, note.time, note.time + 0.4], outputRange: [0, boardH, boardH + 30], extrapolate: "clamp" });
  const opacity = clock.interpolate({ inputRange: [start, start + 0.12, note.time + 0.12, note.time + 0.4], outputRange: [0, 1, 1, 0], extrapolate: "clamp" });
  const isHold = note.type === "hold" || note.type === "wavy";
  const tailLen = isHold ? Math.min(boardH, (note.duration || 0.4) / lookahead * boardH) : 0;
  return <Animated.View style={{ position: "absolute", left: note.lane * laneW + laneW / 2 - size / 2, top: -size / 2, width: size, height: size, opacity, transform: [{ translateY }] }}>
    {isHold && <View style={{ position: "absolute", width: size * 0.4, left: size * 0.3, bottom: size * 0.5, height: tailLen, borderRadius: 8, backgroundColor: `${color}44`, borderWidth: 1, borderColor: `${color}99` }} />}
    <Pressable onPress={onPress} style={[styles.eNote, { width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderColor: selected ? colors.text : "rgba(255,255,255,0.7)", borderWidth: selected ? 3 : 2 }]}><Ionicons name={noteIcon[note.type]} size={size * 0.36} color={colors.bg} /></Pressable>
  </Animated.View>;
}

export default function EditorScreen() {
  const { width, height } = useWindowDimensions();
  const { selectedSong, selectedDifficulty, setDifficulty, charts, saveChart } = useAppState();
  const existing = selectedSong ? charts[`${selectedSong.id}-Custom`] : undefined;
  const player = useAudioPlayer(selectedSong?.uri ? { uri: selectedSong.uri } : null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const [notes, setNotes] = useState<Note[]>(existing?.notes || []);
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nowLabel, setNowLabel] = useState(0);
  const [flashLane, setFlashLane] = useState(-1);
  const [recording, setRecording] = useState(false);
  const [wavyMode, setWavyMode] = useState(false);

  const clock = useRef(new Animated.Value(0)).current;
  const clockStart = useRef(0);
  const nowRef = useRef(0); const playingRef = useRef(false);
  const undo = useRef<Note[][]>([]); const redo = useRef<Note[][]>([]);
  const recordingRef = useRef(false); const wavyRef = useRef(false);
  const padStart = useRef<Record<number, { time: number; wall: number }>>({});

  const HW = Math.min(width, 460);
  const LANE = HW / 4;
  const DECK_H = 130;
  const BOARD_H = height * 0.4;
  const duration = existing?.duration || status.duration || selectedSong?.duration || 60;
  const lookahead = 2.0;

  useEffect(() => { setNotes(existing?.notes || []); setSelected(new Set()); undo.current = []; redo.current = []; }, [existing]);
  useEffect(() => { nowRef.current = nowLabel; }, [nowLabel]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { recordingRef.current = recording; if (!recording) padStart.current = {}; }, [recording]);
  useEffect(() => { wavyRef.current = wavyMode; }, [wavyMode]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => { const cur = (Date.now() - clockStart.current) / 1000; setNowLabel(cur); if (cur >= duration) { player.pause(); clock.stopAnimation(); setPlaying(false); } }, 120);
    return () => clearInterval(t);
  }, [playing, duration, player, clock]);

  const startClock = useCallback((from: number) => { clock.stopAnimation(); clock.setValue(from); Animated.timing(clock, { toValue: duration, duration: Math.max(10, (duration - from) * 1000), easing: Easing.linear, useNativeDriver: true }).start(); }, [clock, duration]);

  const curTime = () => (playingRef.current ? (Date.now() - clockStart.current) / 1000 : nowRef.current);

  const play = () => { clockStart.current = Date.now() - nowRef.current * 1000; player.seekTo(nowRef.current); player.play(); startClock(nowRef.current); setPlaying(true); };
  const pause = () => { player.pause(); clock.stopAnimation(); setPlaying(false); };
  const seek = (to: number) => { const t = Math.max(0, Math.min(duration, to)); player.seekTo(t); nowRef.current = t; setNowLabel(t); clock.stopAnimation(); clock.setValue(t); if (playingRef.current) { clockStart.current = Date.now() - t * 1000; startClock(t); } };
  const togglePlay = () => (playing ? pause() : play());

  const addNote = useCallback((note: Note) => { setNotes(prev => { undo.current.push(prev); if (undo.current.length > 80) undo.current.shift(); redo.current = []; return [...prev, note].sort((a, b) => a.time - b.time); }); setSaved(false); }, []);

  // Reliable per-lane pads. Notes can ONLY be placed while Record is active (edit-mode gate).
  // Quick tap = tap note · press & hold = long note · Wavy toggle = contoured note.
  const onPadIn = (lane: number) => { if (!recordingRef.current) return; padStart.current[lane] = { time: curTime(), wall: Date.now() }; setFlashLane(lane); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };
  const onPadOut = (lane: number) => {
    const s = padStart.current[lane]; delete padStart.current[lane]; setFlashLane(f => (f === lane ? -1 : f));
    if (!s || !recordingRef.current) return;
    const held = (Date.now() - s.wall) / 1000;
    const type: Note["type"] = wavyRef.current ? "wavy" : held >= TAP_MAX ? "hold" : "tap";
    const duration = type === "tap" ? undefined : Math.max(0.4, Math.min(6, wavyRef.current ? Math.max(held, 0.6) : held));
    addNote({ id: `edit-${Date.now()}-${lane}-${Math.round(s.time * 100)}`, lane, time: Math.max(0, s.time), type, duration });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const toggleSelect = (id: string) => setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const doUndo = () => { if (!undo.current.length) return; setNotes(prev => { redo.current.push(prev); return undo.current.pop()!; }); setSaved(false); };
  const doRedo = () => { if (!redo.current.length) return; setNotes(prev => { undo.current.push(prev); return redo.current.pop()!; }); setSaved(false); };
  const eraseSelected = () => { if (!selected.size) return; setNotes(prev => { undo.current.push(prev); redo.current = []; return prev.filter(n => !selected.has(n.id)); }); setSelected(new Set()); setSaved(false); };
  const eraseAll = () => { if (!notes.length) return; setNotes(prev => { undo.current.push(prev); redo.current = []; return []; }); setSelected(new Set()); setSaved(false); };

  const save = async () => {
    if (!selectedSong) return;
    const chart: Chart = { songId: selectedSong.id, difficulty: "Custom", bpm: existing?.bpm || selectedSong.bpm || 120, duration, notes: [...notes].sort((a, b) => a.time - b.time), waveform: existing?.waveform || Array.from({ length: 96 }, (_, i) => 0.2 + Math.abs(Math.sin(i * 0.5)) * 0.7) };
    await saveChart(chart); setDifficulty("Custom"); setSaved(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const visible = useMemo(() => notes.filter(n => n.time - nowLabel < lookahead && n.time - nowLabel > -0.4), [notes, nowLabel]);

  if (!selectedSong) return <SafeAreaView style={styles.safe} edges={["top"]}><ScreenHeader title="Chart Editor" /><View style={styles.empty}><Ionicons name="musical-notes-outline" size={44} color={colors.purple} /><Text style={styles.emptyTitle}>Choose a track first</Text><Text style={styles.emptyCopy}>Pick a song to build a custom chart for.</Text><NeonButton testID="editor-open-library-button" label="Choose a track" icon="library" onPress={() => router.replace("/library")} /></View></SafeAreaView>;

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
    <ScreenHeader title="Chart Editor" right={<Pressable testID="save-chart-button" onPress={save} style={[styles.save, saved && { backgroundColor: rgba(0.35) }]}><Ionicons name={saved ? "checkmark" : "save"} size={15} color={colors.bg} /><Text style={styles.saveText}>{saved ? "Saved" : "Save"}</Text></Pressable>} />

    <View style={styles.songBar}>
      <View style={{ flex: 1 }}><Text style={styles.song} numberOfLines={1}>{selectedSong.title}</Text><Text style={styles.meta} testID="editor-note-count">{notes.length} NOTES · CUSTOM CHART</Text></View>
      <Pressable testID="editor-change-track-button" onPress={() => router.push("/library")} style={styles.change}><Ionicons name="swap-horizontal" size={15} color={colors.text} /><Text style={styles.changeText}>Change</Text></Pressable>
    </View>

    <View style={styles.modeBar}>
      <Pressable testID="editor-record-button" onPress={() => setRecording(r => !r)} style={[styles.modeBtn, recording && styles.modeBtnRec]}><View style={[styles.recDot, recording && styles.recDotOn]} /><Text style={[styles.modeText, recording && { color: colors.bg }]}>{recording ? "Recording" : "Record"}</Text></Pressable>
      <Pressable testID="editor-wavy-toggle" onPress={() => setWavyMode(w => !w)} style={[styles.modeBtn, wavyMode && styles.modeBtnOn]}><Ionicons name="water" size={14} color={wavyMode ? colors.bg : colors.text} /><Text style={[styles.modeText, wavyMode && { color: colors.bg }]}>Wavy</Text></Pressable>
      <Text style={styles.modeHint} numberOfLines={2}>{recording ? (wavyMode ? "Tap a lane to drop a wavy note" : "Tap = note · press & hold = long note") : "Press Record to add notes"}</Text>
    </View>

    {/* Vertical falling board (matches gameplay orientation) */}
    <View style={styles.boardWrap}>
      <View style={[styles.board, { width: HW }]}>
        {[0, 1, 2, 3, 4].map(l => <View key={l} style={[styles.boardDiv, { left: l * LANE }]} />)}
        {laneColors.map((c, l) => <View key={`ln${l}`} style={[styles.laneNo, { left: l * LANE, width: LANE }]}><Text style={[styles.laneNoText, { color: c }]}>{l + 1}</Text></View>)}
        <View style={styles.hitLineFull} />
        {visible.map(n => <EditorNote key={n.id} note={n} clock={clock} lookahead={lookahead} boardH={BOARD_H} laneW={LANE} color={laneColors[n.lane]} selected={selected.has(n.id)} onPress={() => toggleSelect(n.id)} />)}
      </View>
    </View>

    {/* Live tap deck — per-lane pads (gated by Record) */}
    <View style={[styles.deck, { width: HW, height: DECK_H }]}>
      {laneColors.map((c, l) => <Pressable key={`deck${l}`} testID={`editor-lane-${l + 1}-pad`} onPressIn={() => onPadIn(l)} onPressOut={() => onPadOut(l)} style={[styles.deckPad, { width: LANE, borderColor: flashLane === l ? c : `${c}55`, backgroundColor: flashLane === l ? `${c}44` : `${c}12`, opacity: recording ? 1 : 0.4 }]}><Ionicons name="add" size={18} color={c} /><View style={[styles.deckBar, { backgroundColor: c }]} /></Pressable>)}
    </View>

    {/* Seek */}
    <View style={styles.seekRow}>
      <Pressable testID="editor-rewind-button" onPress={() => seek(nowLabel - 5)} style={styles.seekBtn}><Ionicons name="play-back" size={16} color={colors.text} /></Pressable>
      <Slider testID="editor-seek-slider" style={{ flex: 1, height: 34 }} minimumValue={0} maximumValue={duration} value={nowLabel} onSlidingComplete={seek} minimumTrackTintColor={colors.purple} maximumTrackTintColor="rgba(255,255,255,0.18)" thumbTintColor={colors.purple} />
      <Pressable testID="editor-forward-button" onPress={() => seek(nowLabel + 5)} style={styles.seekBtn}><Ionicons name="play-forward" size={16} color={colors.text} /></Pressable>
    </View>

    {/* Transport */}
    <View style={styles.transport}>
      <Text style={styles.time}>{Math.floor(nowLabel / 60)}:{String(Math.floor(nowLabel % 60)).padStart(2, "0")}</Text>
      <Pressable testID="editor-play-button" onPress={togglePlay} style={styles.playBtn}><Ionicons name={playing ? "pause" : "play"} size={26} color={colors.bg} /></Pressable>
      <Pressable testID="editor-restart-button" onPress={() => seek(0)} style={styles.tBtn}><Ionicons name="refresh" size={20} color={colors.text} /></Pressable>
    </View>

    {/* Edit controls */}
    <View style={styles.controls}>
      <Pressable testID="editor-undo-button" onPress={doUndo} style={styles.ctrl}><Ionicons name="arrow-undo" size={18} color={colors.text} /><Text style={styles.ctrlText}>Undo</Text></Pressable>
      <Pressable testID="editor-redo-button" onPress={doRedo} style={styles.ctrl}><Ionicons name="arrow-redo" size={18} color={colors.text} /><Text style={styles.ctrlText}>Redo</Text></Pressable>
      <Pressable testID="editor-erase-selected-button" onPress={eraseSelected} style={styles.ctrl}><Ionicons name="cut" size={18} color={colors.pink} /><Text style={[styles.ctrlText, { color: colors.pink }]}>Erase {selected.size || ""}</Text></Pressable>
      <Pressable testID="editor-erase-all-button" onPress={eraseAll} style={styles.ctrl}><Ionicons name="trash" size={18} color={colors.pink} /><Text style={[styles.ctrlText, { color: colors.pink }]}>Erase all</Text></Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  save: { minHeight: 36, paddingHorizontal: 13, borderRadius: 18, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.purple }, saveText: { color: colors.bg, fontSize: 12, fontFamily: fonts.heavy },
  songBar: { minHeight: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border }, song: { color: colors.text, fontSize: 17, fontFamily: fonts.heavy }, meta: { color: colors.purple, fontSize: 10, fontWeight: "900", letterSpacing: 0.8, marginTop: 3, fontFamily: fonts.bold }, change: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, changeText: { color: colors.text, fontSize: 12, fontFamily: fonts.bold },
  hintBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: rgba(0.08) }, hintText: { color: colors.text, fontSize: 11, flex: 1, fontFamily: fonts.body },
  modeBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: rgba(0.08) },
  modeBtn: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, modeBtnRec: { backgroundColor: colors.pink, borderColor: colors.pink }, modeBtnOn: { backgroundColor: colors.purple, borderColor: colors.purple }, modeText: { color: colors.text, fontSize: 12, fontFamily: fonts.heavy }, recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.5)" }, recDotOn: { backgroundColor: colors.bg }, modeHint: { flex: 1, color: colors.muted, fontSize: 10, fontFamily: fonts.body, textAlign: "right" },
  boardWrap: { flex: 1, alignItems: "center", backgroundColor: "#08080C", overflow: "hidden" }, board: { flex: 1, overflow: "hidden" }, boardDiv: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.08)" }, laneNo: { position: "absolute", top: 8, alignItems: "center" }, laneNoText: { fontSize: 11, fontFamily: fonts.heavy, opacity: 0.5 }, hitLineFull: { position: "absolute", left: 0, right: 0, bottom: "16%", height: 2, backgroundColor: "rgba(255,255,255,0.4)" }, eNote: { alignItems: "center", justifyContent: "center" },
  deck: { alignSelf: "center", flexDirection: "row", paddingHorizontal: 4, paddingVertical: 8, gap: 6 }, deckPad: { flex: 1, borderRadius: 16, borderWidth: 1.5, alignItems: "center", justifyContent: "space-between", paddingVertical: 12 }, deckBar: { width: "40%", height: 5, borderRadius: 3 },
  seekRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16 }, seekBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  transport: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18, paddingVertical: 6 }, time: { color: colors.muted, fontSize: 13, fontFamily: fonts.bold, width: 44, textAlign: "center" }, playBtn: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center", backgroundColor: colors.purple, shadowColor: colors.purple, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8 }, tBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  controls: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 8, paddingTop: 2 }, ctrl: { flex: 1, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 3, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, ctrlText: { color: colors.text, fontSize: 11, fontFamily: fonts.bold },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28, gap: 14 }, emptyTitle: { color: colors.text, fontSize: 24, fontFamily: fonts.display, textAlign: "center" }, emptyCopy: { color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 6, fontFamily: fonts.body },
});
