import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { cancelAnimation, Easing as RE, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { NeonButton, ScreenHeader } from "@/src/components/ui";
import { ShareCodeModal } from "@/src/components/ShareCodeModal";
import { useAppState } from "@/src/game/AppState";
import { alpha, colors, fonts, rgba } from "@/src/game/theme";
import { clampHolds, generateChart } from "@/src/game/chartEngine";
import { encodeChartCode } from "@/src/game/shareCode";
import { skinById, useProgress } from "@/src/game/progression";
import { Chart, Note, SwipeDir } from "@/src/game/types";
import { Geo } from "@/src/game/components/geometry";
import { BeatLines, Grid, Receptors } from "@/src/game/components/Highway";
import { NotesLayer } from "@/src/game/components/FallingNote";
import { WavyLayer } from "@/src/game/components/WavyNote";
import { EditorTools, FlickDirRow, TOOLS } from "@/src/editor/EditorTools";
import { Inspector } from "@/src/editor/Inspector";
import { Timeline } from "@/src/editor/Timeline";
import { boardPoint, clamp, fmtTime, hitTest, Snap, SNAPS, snapStep, snapTime, Tool, ZOOMS } from "@/src/editor/editorMath";

const TUTORIAL: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: "sparkles", title: "Welcome to the Studio", body: "Build charts on the same 3D highway you play on. Here's the quick tour." },
  { icon: "construct", title: "1 · Pick a tool", body: "Tap, Hold, Flick and Wavy place notes. Select edits them, Erase removes them." },
  { icon: "hand-left", title: "2 · Step mode", body: "While paused, tap the highway to place a note exactly where you touch. With Hold or Wavy, drag upward to set the length (and sideways to shape a wave)." },
  { icon: "radio-button-on", title: "3 · Live record", body: "Turn on Record and press Play: tap = note · press & hold = long note · drag sideways = wavy · quick flick up/left/right = flick note." },
  { icon: "grid", title: "4 · Snap, zoom & scrub", body: "Snap locks notes to the beat (1/4, 1/8, 1/16). Zoom spreads notes out. Drag the timeline or use the beat buttons to move through the song." },
  { icon: "save", title: "5 · Test & save", body: "Test plays your chart instantly. Save keeps it; share or export it to send to friends." },
];
const TAP_MAX = 0.18; // press longer than this (live) → hold note
const MOVE_EPS = 16;  // sideways travel beyond this (live) → wavy note
const FLICK_MAX = 0.28, FLICK_MIN = 26; // a quick stroke this long → flick note
type Capture = { sx: number; sy: number; lx: number; ly: number; t0: number; wall: number; lane: number; moved: boolean; points: { t: number; x: number }[] };
type StepDrag = { t0: number; lane: number; sx: number; sy: number; points: { t: number; x: number }[] };

export default function EditorScreen() {
  const { selectedSong, setDifficulty, charts, saveChart, setTestChart, exportChart, settings, updateSettings } = useAppState();
  const existing = selectedSong ? charts[`${selectedSong.id}-Custom`] : undefined;
  const player = useAudioPlayer(selectedSong?.uri ? { uri: selectedSong.uri } : null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const skin = skinById(useProgress().skin);

  const [notes, setNotes] = useState<Note[]>([]); // blank canvas — the chart is built up here
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tutorial, setTutorial] = useState(false);
  const [tStep, setTStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(0);
  const [tool, setTool] = useState<Tool>("tap");
  const [flickDir, setFlickDir] = useState<SwipeDir>("up");
  const [snap, setSnap] = useState<Snap>(8);
  const [zoomIdx, setZoomIdx] = useState(2);
  const [draft, setDraft] = useState<Note | null>(null);
  const [board, setBoard] = useState({ w: 0, h: 0 });
  const [shareCode, setShareCode] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 1900); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { if (selectedSong && !settings.editorTutorialSeen) { setTStep(0); setTutorial(true); } }, [selectedSong, settings.editorTutorialSeen]);
  const endTutorial = () => { setTutorial(false); if (!settings.editorTutorialSeen) updateSettings({ editorTutorialSeen: true }); };

  const clock = useSharedValue(0);
  const rainbow = useSharedValue(0);
  const zero = useSharedValue(0);
  const flash = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const clockStart = useRef(0);
  const nowRef = useRef(0); const playingRef = useRef(false); const recordingRef = useRef(false);
  const undo = useRef<Note[][]>([]); const redo = useRef<Note[][]>([]);
  const captures = useRef<Map<number, Capture>>(new Map());
  const stepDrag = useRef<StepDrag | null>(null);

  const bpm = existing?.bpm || selectedSong?.bpm || 120;
  const duration = existing?.duration || status.duration || selectedSong?.duration || 60;
  const lookahead = ZOOMS[zoomIdx];
  const step = snapStep(bpm, snap);
  const beatLen = 60 / bpm;
  const geo: Geo = useMemo(() => { const hw = Math.max(200, Math.min(board.w - 24, 440)); const topY = 12; const bottomY = Math.max(topY + 100, board.h - 44); return { cx: board.w / 2, hw, topY, bottomY, laneW: hw / 4, span: bottomY - topY, pn: 0.42 }; }, [board]);

  useEffect(() => { recordingRef.current = recording; if (!recording) captures.current.clear(); }, [recording]);
  const setTime = (t: number) => { nowRef.current = t; setNow(t); };
  const startClock = useCallback((from: number) => { cancelAnimation(clock); clock.value = from; clock.value = withTiming(duration, { duration: Math.max(10, (duration - from) * 1000), easing: RE.linear }); }, [clock, duration]);
  const curTime = () => (playingRef.current ? (Date.now() - clockStart.current) / 1000 : nowRef.current);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => { const cur = (Date.now() - clockStart.current) / 1000; setTime(cur); if (cur >= duration) { try { player.pause(); } catch {} cancelAnimation(clock); playingRef.current = false; setPlaying(false); } }, 100);
    return () => clearInterval(t);
  }, [playing, duration, player, clock]);

  const play = () => { if (nowRef.current >= duration - 0.1) setTime(0); clockStart.current = Date.now() - nowRef.current * 1000; try { player.seekTo(nowRef.current); player.play(); } catch {} startClock(nowRef.current); playingRef.current = true; setPlaying(true); };
  const pause = () => { const t = curTime(); try { player.pause(); } catch {} cancelAnimation(clock); playingRef.current = false; setPlaying(false); setTime(t); clock.value = t; };
  const seek = (to: number) => { const t = clamp(to, 0, duration); try { player.seekTo(t); } catch {} setTime(t); if (playingRef.current) { clockStart.current = Date.now() - t * 1000; startClock(t); } else { cancelAnimation(clock); clock.value = t; } };
  const stepBy = (dir: 1 | -1) => { const s = step || beatLen; seek(snapTime(nowRef.current, s) + dir * s); };

  const flashLane = (l: number) => { flash[l].setValue(1); Animated.timing(flash[l], { toValue: 0, duration: 260, useNativeDriver: true }).start(); };
  const commit = useCallback((fn: (prev: Note[]) => Note[]) => { setNotes(prev => { const next = fn(prev); if (next === prev) return prev; undo.current.push(prev); if (undo.current.length > 150) undo.current.shift(); redo.current = []; return [...next].sort((a, b) => a.time - b.time); }); setSaved(false); }, []);
  const place = (n: Omit<Note, "id">) => {
    commit(prev => (prev.some(p => p.lane === n.lane && Math.abs(p.time - n.time) < 0.03) ? prev : [...prev, { ...n, id: `edit-${Date.now()}-${n.lane}-${Math.round(n.time * 100)}-${Math.floor(Math.random() * 9999)}` }]));
    flashLane(n.lane); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ---- Board input: live recording (Record + Play) or precise step placement / editing ----
  const touchesOf = (e: any): { identifier: number; locationX: number; locationY: number }[] => {
    const ct = e.nativeEvent.changedTouches; if (ct && ct.length) return ct;
    const n = e.nativeEvent; return [{ identifier: n.identifier ?? 0, locationX: n.locationX ?? 0, locationY: n.locationY ?? 0 }];
  };
  const live = () => recordingRef.current && playingRef.current;
  const commitLive = (c: Capture) => {
    const held = (Date.now() - c.wall) / 1000; const dx = c.lx - c.sx, dy = c.ly - c.sy; const t = snapTime(c.t0, step);
    const flick: SwipeDir | null = held <= FLICK_MAX && dx * dx + dy * dy >= FLICK_MIN * FLICK_MIN ? (-dy > Math.abs(dx) ? "up" : Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : null) : null;
    if (flick) { setFlickDir(flick); return place({ lane: c.lane, time: t, type: "swipe", dir: flick }); }
    if (c.moved && c.points.length > 2) return place({ lane: c.lane, time: c.t0, type: "wavy", duration: Math.max(0.3, held), path: c.points });
    if (held >= TAP_MAX) return place({ lane: c.lane, time: t, type: "hold", duration: Math.max(step || 0.3, snapTime(held, step)) });
    place(tool === "flick" ? { lane: c.lane, time: t, type: "swipe", dir: flickDir } : { lane: c.lane, time: t, type: "tap" });
  };
  const onBoardStart = (e: any) => {
    if (live()) {
      for (const tc of touchesOf(e)) { const b = boardPoint(geo, curTime(), lookahead, tc.locationX, tc.locationY); const t0 = curTime(); captures.current.set(tc.identifier, { sx: tc.locationX, sy: tc.locationY, lx: tc.locationX, ly: tc.locationY, t0, wall: Date.now(), lane: b.lane, moved: false, points: [{ t: t0, x: b.x }] }); flash[b.lane].setValue(1); }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); return;
    }
    const tc = touchesOf(e)[0]; if (!tc) return;
    const b = boardPoint(geo, curTime(), lookahead, tc.locationX, tc.locationY);
    if (tool === "select" || tool === "erase") {
      const hit = hitTest(notes, b.t, b.lane, Math.max(0.1, lookahead * 0.06));
      if (tool === "erase") { if (hit) { commit(prev => prev.filter(n => n.id !== hit.id)); setSelected(prev => { const s = new Set(prev); s.delete(hit.id); return s; }); flashLane(hit.lane); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } return; }
      if (!hit) { setSelected(new Set()); return; }
      setSelected(prev => { const s = new Set(prev); if (s.has(hit.id)) s.delete(hit.id); else s.add(hit.id); return s; }); Haptics.selectionAsync(); return;
    }
    stepDrag.current = { t0: snapTime(b.t, step), lane: b.lane, sx: tc.locationX, sy: tc.locationY, points: [{ t: b.t, x: b.x }] };
    if (tool === "hold") setDraft({ id: "draft", lane: b.lane, time: snapTime(b.t, step), type: "hold", duration: step || 0.25 });
    flash[b.lane].setValue(1);
  };
  const onBoardMove = (e: any) => {
    if (live()) {
      for (const tc of touchesOf(e)) { const c = captures.current.get(tc.identifier); if (!c) continue; c.lx = tc.locationX; c.ly = tc.locationY; if (Math.abs(c.lx - c.sx) > MOVE_EPS) c.moved = true; c.points.push({ t: curTime(), x: boardPoint(geo, curTime(), lookahead, c.lx, c.ly).x }); }
      return;
    }
    const s = stepDrag.current; const tc = touchesOf(e)[0]; if (!s || !tc) return;
    const b = boardPoint(geo, curTime(), lookahead, tc.locationX, tc.locationY);
    if (tool === "hold") { const end = Math.max(s.t0 + (step || 0.1), snapTime(b.t, step)); setDraft({ id: "draft", lane: s.lane, time: s.t0, type: "hold", duration: end - s.t0 }); }
    if (tool === "wavy") { const last = s.points[s.points.length - 1]; if (b.t > last.t + 0.02) { s.points.push({ t: b.t, x: b.x }); setDraft({ id: "draft", lane: s.lane, time: s.points[0].t, type: "wavy", duration: b.t - s.points[0].t, path: [...s.points] }); } }
  };
  const onBoardEnd = (e: any) => {
    if (captures.current.size) {
      for (const tc of touchesOf(e)) { const c = captures.current.get(tc.identifier); if (!c) continue; captures.current.delete(tc.identifier); Animated.timing(flash[c.lane], { toValue: 0, duration: 200, useNativeDriver: true }).start(); if (recordingRef.current) commitLive(c); }
      return;
    }
    const s = stepDrag.current; stepDrag.current = null; setDraft(null); if (!s) return;
    Animated.timing(flash[s.lane], { toValue: 0, duration: 200, useNativeDriver: true }).start();
    if (tool === "tap") place({ lane: s.lane, time: s.t0, type: "tap" });
    else if (tool === "flick") place({ lane: s.lane, time: s.t0, type: "swipe", dir: flickDir });
    else if (tool === "hold") place({ lane: s.lane, time: s.t0, type: "hold", duration: draft?.type === "hold" && draft.duration ? draft.duration : Math.max(step * 2, 0.5) });
    else if (tool === "wavy") {
      const p = s.points; const span = p.length > 1 ? p[p.length - 1].t - p[0].t : 0;
      if (p.length >= 3 && span >= 0.25) place({ lane: s.lane, time: p[0].t, type: "wavy", duration: span, path: p });
      else setToast("Drag upward across lanes to draw a wave");
    }
  };

  // ---- Selection editing ----
  const selNotes = useMemo(() => notes.filter(n => selected.has(n.id)), [notes, selected]);
  const nudge = step || 0.05;
  const nudgeSel = (d: 1 | -1) => commit(prev => prev.map(n => (selected.has(n.id) ? { ...n, time: Math.max(0, n.time + d * nudge), path: n.path?.map(p => ({ ...p, t: p.t + d * nudge })) } : n)));
  const laneSel = (d: 1 | -1) => commit(prev => prev.map(n => (selected.has(n.id) ? { ...n, lane: clamp(n.lane + d, 0, 3), path: n.path?.map(p => ({ ...p, x: clamp(p.x + d * 0.25, 0.04, 0.96) })) } : n)));
  const dirSel = (d: SwipeDir) => { setFlickDir(d); commit(prev => prev.map(n => (selected.has(n.id) && (n.type === "swipe" || n.type === "tap") ? { ...n, type: "swipe", dir: d } : n))); };
  const eraseSelected = () => { if (!selected.size) return; commit(prev => prev.filter(n => !selected.has(n.id))); setSelected(new Set()); };
  const eraseAll = () => { if (!notes.length) return; commit(() => []); setSelected(new Set()); };
  const doUndo = () => { if (!undo.current.length) return; setNotes(prev => { redo.current.push(prev); return undo.current.pop()!; }); setSaved(false); };
  const doRedo = () => { if (!redo.current.length) return; setNotes(prev => { undo.current.push(prev); return redo.current.pop()!; }); setSaved(false); };

  // Auto-fill notes from the last placed note (or the playhead) to the end of the song.
  const generateRest = () => {
    if (!selectedSong) return;
    const lastTime = notes.reduce((m, n) => Math.max(m, n.time + (n.duration || 0)), 0);
    const from = Math.max(lastTime + 0.5, nowRef.current);
    const additions = generateChart(selectedSong.id, selectedSong.fileName || selectedSong.title, duration, "Normal").notes.filter(n => n.time > from).map(n => ({ ...n, id: `gen-${n.id}` }));
    if (!additions.length) { setToast("Nothing left to fill"); return; }
    commit(prev => [...prev, ...additions]); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const buildChart = (): Chart => ({ songId: selectedSong!.id, difficulty: "Custom", bpm, duration, notes: clampHolds(notes), waveform: existing?.waveform || Array.from({ length: 96 }, (_, i) => 0.2 + Math.abs(Math.sin(i * 0.5)) * 0.7) });
  const save = async () => { if (!selectedSong) return; if (!notes.length) { setToast("Add some notes first"); return; } await saveChart(buildChart()); setDifficulty("Custom"); setSaved(true); setToast("Chart saved \u2713"); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); };
  const doExport = async () => { if (!selectedSong || !notes.length) { setToast("Add notes before exporting"); return; } try { await exportChart(buildChart(), selectedSong); setToast("Chart file exported"); } catch { setToast("Export failed"); } };
  const doShareCode = () => { if (!selectedSong || !notes.length) { setToast("Add notes before sharing"); return; } try { setShareCode(encodeChartCode(buildChart(), selectedSong)); } catch { setToast("Couldn't build a code"); } };
  const test = () => { if (!selectedSong || !notes.length) { setToast("Add some notes first"); return; } pause(); setTestChart(buildChart()); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/game"); };

  const visible = useMemo(() => {
    const lo = now - 0.6, hi = now + lookahead + 0.2;
    const v = notes.filter(n => n.time < hi && n.time + (n.duration || 0) > lo);
    if (draft) v.push(draft);
    return v;
  }, [notes, now, lookahead, draft]);
  const visibleWavy = useMemo(() => visible.filter(n => n.type === "wavy"), [visible]);

  if (!selectedSong) return <SafeAreaView style={styles.safe} edges={["top"]}><ScreenHeader title="Editor" /><View style={styles.empty}><Ionicons name="musical-notes-outline" size={44} color={colors.purple} /><Text selectable={false} style={styles.emptyTitle}>Choose a track first</Text><Text selectable={false} style={styles.emptyCopy}>Pick a song to build a custom chart for.</Text><NeonButton testID="editor-open-library-button" label="Choose a track" icon="library" onPress={() => router.replace({ pathname: "/library", params: { pick: "editor" } })} /></View></SafeAreaView>;

  const cover = selectedSong.coverArt ? (typeof selectedSong.coverArt === "number" ? selectedSong.coverArt : { uri: selectedSong.coverArt }) : null;
  const accent = selectedSong.accent || colors.cyan;
  const liveRec = recording && playing;
  const toolMeta = TOOLS.find(t => t.id === tool)!;

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
    <ScreenHeader title="Editor" right={<View style={styles.hRight}><Pressable testID="editor-help-button" onPress={() => { setTStep(0); setTutorial(true); }} style={styles.hBtn}><Ionicons name="help" size={16} color={colors.text} /></Pressable><Pressable testID="editor-share-code-button" onPress={doShareCode} style={styles.hBtn}><Ionicons name="share-social-outline" size={15} color={colors.text} /></Pressable><Pressable testID="export-chart-button" onPress={doExport} style={styles.hBtn}><Ionicons name="download-outline" size={15} color={colors.text} /></Pressable><Pressable testID="save-chart-button" onPress={save} style={[styles.save, saved && { backgroundColor: rgba(0.35) }]}><Ionicons name={saved ? "checkmark" : "save"} size={15} color={colors.bg} /><Text selectable={false} style={styles.saveText}>{saved ? "Saved" : "Save"}</Text></Pressable></View>} />
    <ShareCodeModal visible={!!shareCode} code={shareCode || ""} title={selectedSong.title} onClose={() => setShareCode(null)} />
    {toast && <View pointerEvents="none" style={styles.toast}><Ionicons name="checkmark-circle" size={16} color={colors.lime} /><Text selectable={false} style={styles.toastText}>{toast}</Text></View>}
    <Modal visible={tutorial} transparent animationType="fade" onRequestClose={endTutorial}>
      <View style={styles.tutOverlay}><View style={styles.tutCard}>
        <View style={styles.tutIconWrap}><Ionicons name={TUTORIAL[tStep].icon} size={28} color={colors.cyan} /></View>
        <Text selectable={false} style={styles.tutStep}>STEP {tStep + 1} OF {TUTORIAL.length}</Text>
        <Text selectable={false} style={styles.tutTitle}>{TUTORIAL[tStep].title}</Text>
        <Text selectable={false} style={styles.tutBody}>{TUTORIAL[tStep].body}</Text>
        <View style={styles.tutDots}>{TUTORIAL.map((_, i) => <View key={i} style={[styles.tutDot, i === tStep && styles.tutDotOn]} />)}</View>
        <View style={styles.tutBtns}>
          <Pressable testID="tutorial-skip-button" onPress={endTutorial} style={styles.tutSkip}><Text selectable={false} style={styles.tutSkipText}>Skip</Text></Pressable>
          <Pressable testID="tutorial-next-button" onPress={() => (tStep < TUTORIAL.length - 1 ? setTStep(tStep + 1) : endTutorial())} style={styles.tutNext}><Text selectable={false} style={styles.tutNextText}>{tStep < TUTORIAL.length - 1 ? "Next" : "Got it"}</Text><Ionicons name="arrow-forward" size={16} color={colors.bg} /></Pressable>
        </View>
      </View></View>
    </Modal>

    <View style={styles.songBar}>
      <View style={[styles.thumb, { borderColor: alpha(accent, 0.55) }]}>{cover ? <Image source={cover} style={styles.thumbImg} resizeMode="cover" /> : <LinearGradient colors={[accent, colors.purple]} style={[styles.thumbImg, styles.center]}><Ionicons name="musical-notes" size={16} color={colors.text} /></LinearGradient>}</View>
      <View style={{ flex: 1, minWidth: 0 }}><Text selectable={false} style={styles.song} numberOfLines={1}>{selectedSong.title}</Text><Text selectable={false} style={styles.meta} testID="editor-note-count">{notes.length} NOTES · {Math.round(bpm)} BPM · CUSTOM</Text></View>
      <Pressable testID="editor-change-track-button" onPress={() => router.push({ pathname: "/library", params: { pick: "editor" } })} style={styles.change}><Ionicons name="swap-horizontal" size={15} color={colors.text} /><Text selectable={false} style={styles.changeText}>Change</Text></Pressable>
    </View>

    <EditorTools tool={tool} onTool={t => { setTool(t); Haptics.selectionAsync(); }} />

    {/* 3D highway board — same projection + note art as gameplay */}
    <View style={styles.boardWrap} onLayout={e => setBoard({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <View testID="editor-board" style={StyleSheet.absoluteFill} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderTerminationRequest={() => false} onResponderGrant={onBoardStart} onResponderMove={onBoardMove} onResponderRelease={onBoardEnd} onResponderTerminate={onBoardEnd}>
        {board.w > 0 && <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Grid geo={geo} w={board.w} h={board.h} tint={liveRec ? colors.pink : skin.glow} fever={false} />
          <BeatLines beat={step || beatLen} barEvery={snap ? snap : 4} strength={2.2} max={64} clock={clock} lookahead={lookahead} geo={geo} fever={zero} />
          <Receptors geo={geo} flash={flash} />
          <WavyLayer notes={visibleWavy} clock={clock} lookahead={lookahead} geo={geo} selectedIds={selected} />
          <NotesLayer notes={visible} clock={clock} lookahead={lookahead} geo={geo} rainbow={rainbow} selectedIds={selected} />
        </View>}
      </View>
      <View style={styles.boardTop} pointerEvents="box-none">
        <View style={styles.chipGroup}>
          <Pressable testID="editor-zoom-out" onPress={() => setZoomIdx(i => Math.min(ZOOMS.length - 1, i + 1))} hitSlop={4} style={styles.chipBtn}><Ionicons name="remove" size={15} color={colors.text} /></Pressable>
          <Text selectable={false} testID="editor-zoom-label" style={styles.chipText}>{ZOOMS[zoomIdx]}s</Text>
          <Pressable testID="editor-zoom-in" onPress={() => setZoomIdx(i => Math.max(0, i - 1))} hitSlop={4} style={styles.chipBtn}><Ionicons name="add" size={15} color={colors.text} /></Pressable>
        </View>
        <View style={styles.chipGroup}>
          <Text selectable={false} style={styles.chipLabel}>SNAP</Text>
          {SNAPS.map(sn => <Pressable key={sn} testID={`editor-snap-${sn || "off"}`} onPress={() => setSnap(sn)} style={[styles.snapChip, snap === sn && styles.snapOn]}><Text selectable={false} style={[styles.snapText, snap === sn && { color: colors.bg }]}>{sn ? `1/${sn}` : "Off"}</Text></Pressable>)}
        </View>
      </View>
      {tool === "flick" && <View style={styles.flickRow} pointerEvents="box-none"><FlickDirRow flickDir={flickDir} onFlickDir={setFlickDir} /></View>}
      <View pointerEvents="none" style={styles.modeBadge}><View style={[styles.modeDot, { backgroundColor: liveRec ? colors.pink : playing ? colors.cyan : toolMeta.color }]} /><Text selectable={false} testID="editor-mode-label" style={styles.modeText}>{liveRec ? "LIVE RECORDING" : playing ? "PLAYING · TAP TO PLACE" : `STEP MODE · ${toolMeta.label.toUpperCase()}`}</Text></View>
      {selNotes.length > 0 && <Inspector notes={selNotes} onNudge={nudgeSel} onLane={laneSel} onDir={dirSel} onDelete={eraseSelected} onClose={() => setSelected(new Set())} />}
    </View>

    <View style={styles.timeRow}>
      <Text selectable={false} testID="editor-time" style={styles.time}>{fmtTime(now)}</Text>
      <Timeline notes={notes} duration={duration} now={now} onSeek={seek} />
      <Text selectable={false} style={styles.time}>{fmtTime(duration).slice(0, -3)}</Text>
    </View>

    <View style={styles.transport}>
      <Pressable testID="editor-record-button" onPress={() => setRecording(r => !r)} style={[styles.recBtn, recording && styles.recOn]}><View style={[styles.recDot, recording && { backgroundColor: colors.bg }]} /><Text selectable={false} style={[styles.recText, recording && { color: colors.bg }]}>{recording ? "REC ON" : "REC"}</Text></Pressable>
      <Pressable testID="editor-step-back" onPress={() => stepBy(-1)} style={styles.tBtn}><Ionicons name="play-skip-back" size={17} color={colors.text} /></Pressable>
      <Pressable testID="editor-play-button" onPress={() => (playing ? pause() : play())} style={styles.playBtn}><Ionicons name={playing ? "pause" : "play"} size={26} color={colors.bg} /></Pressable>
      <Pressable testID="editor-step-forward" onPress={() => stepBy(1)} style={styles.tBtn}><Ionicons name="play-skip-forward" size={17} color={colors.text} /></Pressable>
      <Pressable testID="editor-test-button" onPress={test} style={styles.testBtn}><Ionicons name="game-controller" size={15} color={colors.bg} /><Text selectable={false} style={styles.testText}>Test</Text></Pressable>
    </View>

    <View style={styles.actions}>
      <Pressable testID="editor-undo-button" onPress={doUndo} style={styles.act}><Ionicons name="arrow-undo" size={17} color={colors.text} /><Text selectable={false} style={styles.actText}>Undo</Text></Pressable>
      <Pressable testID="editor-redo-button" onPress={doRedo} style={styles.act}><Ionicons name="arrow-redo" size={17} color={colors.text} /><Text selectable={false} style={styles.actText}>Redo</Text></Pressable>
      <Pressable testID="editor-restart-button" onPress={() => seek(0)} style={styles.act}><Ionicons name="refresh" size={17} color={colors.text} /><Text selectable={false} style={styles.actText}>Start</Text></Pressable>
      <Pressable testID="editor-erase-selected-button" onPress={eraseSelected} style={styles.act}><Ionicons name="cut" size={17} color={colors.pink} /><Text selectable={false} style={[styles.actText, { color: colors.pink }]}>Erase {selected.size || ""}</Text></Pressable>
      <Pressable testID="editor-erase-all-button" onPress={eraseAll} style={styles.act}><Ionicons name="trash" size={17} color={colors.pink} /><Text selectable={false} style={[styles.actText, { color: colors.pink }]}>Clear</Text></Pressable>
      <Pressable testID="editor-generate-rest-button" onPress={generateRest} style={[styles.act, styles.fill]}><Ionicons name="sparkles" size={17} color={colors.gold} /><Text selectable={false} style={[styles.actText, { color: colors.gold }]}>Fill rest</Text></Pressable>
    </View>
  </SafeAreaView>;
}

const GLASS = { backgroundColor: "rgba(12,10,36,0.74)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" } as const;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" }, center: { alignItems: "center", justifyContent: "center" },
  save: { minHeight: 36, paddingHorizontal: 13, borderRadius: 18, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.cyan }, saveText: { color: colors.bg, fontSize: 12, fontFamily: fonts.heavy },
  hRight: { flexDirection: "row", alignItems: "center", gap: 6 }, hBtn: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", ...GLASS },
  toast: { position: "absolute", top: 92, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14, backgroundColor: "rgba(14,11,38,0.97)", borderWidth: 1, borderColor: colors.lime, zIndex: 50, elevation: 10 }, toastText: { color: colors.text, fontFamily: fonts.heavy, fontSize: 13 },
  tutOverlay: { flex: 1, backgroundColor: "rgba(6,5,26,0.85)", alignItems: "center", justifyContent: "center", padding: 26 }, tutCard: { width: "100%", maxWidth: 360, borderRadius: 24, padding: 24, backgroundColor: colors.bg1, borderWidth: 1, borderColor: "rgba(0,229,255,0.35)", alignItems: "center" }, tutIconWrap: { width: 60, height: 60, borderRadius: 20, backgroundColor: "rgba(0,229,255,0.1)", borderWidth: 1, borderColor: "rgba(0,229,255,0.4)", alignItems: "center", justifyContent: "center", marginBottom: 16 }, tutStep: { color: colors.cyan, fontSize: 10, letterSpacing: 1.6, fontFamily: fonts.heavy }, tutTitle: { color: colors.text, fontSize: 20, fontFamily: fonts.display, marginTop: 8, textAlign: "center" }, tutBody: { color: colors.muted, fontSize: 14, lineHeight: 20, fontFamily: fonts.body, textAlign: "center", marginTop: 10 }, tutDots: { flexDirection: "row", gap: 6, marginTop: 20 }, tutDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.18)" }, tutDotOn: { backgroundColor: colors.cyan, width: 20 }, tutBtns: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 22, alignSelf: "stretch" }, tutSkip: { flex: 1, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", ...GLASS }, tutSkipText: { color: colors.muted, fontFamily: fonts.heavy, fontSize: 14 }, tutNext: { flex: 1.4, height: 48, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: colors.cyan }, tutNextText: { color: colors.bg, fontFamily: fonts.heavy, fontSize: 15 },
  songBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingTop: 4 },
  thumb: { width: 38, height: 38, borderRadius: 9, overflow: "hidden", borderWidth: 1 }, thumbImg: { width: "100%", height: "100%" },
  song: { color: colors.text, fontSize: 15, fontFamily: fonts.heavy }, meta: { color: colors.cyan, fontSize: 9, letterSpacing: 1.2, marginTop: 2, fontFamily: fonts.arcade },
  change: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, flexDirection: "row", alignItems: "center", gap: 5, ...GLASS }, changeText: { color: colors.text, fontSize: 12, fontFamily: fonts.bold },
  boardWrap: { flex: 1, marginTop: 8, overflow: "hidden", backgroundColor: "rgba(6,5,26,0.55)" },
  boardTop: { position: "absolute", top: 8, left: 8, right: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chipGroup: { flexDirection: "row", alignItems: "center", gap: 4, padding: 3, borderRadius: 14, ...GLASS },
  chipBtn: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" },
  chipText: { color: colors.text, fontSize: 11, fontFamily: fonts.arcade, minWidth: 34, textAlign: "center" }, chipLabel: { color: colors.muted, fontSize: 8, letterSpacing: 1.6, fontFamily: fonts.arcadeBlack, marginHorizontal: 4 },
  snapChip: { minWidth: 34, height: 30, paddingHorizontal: 6, borderRadius: 10, alignItems: "center", justifyContent: "center" }, snapOn: { backgroundColor: colors.cyan }, snapText: { color: colors.text, fontSize: 10, fontFamily: fonts.heavy },
  flickRow: { position: "absolute", top: 52, left: 0, right: 0, alignItems: "center" },
  modeBadge: { position: "absolute", bottom: 10, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 24, borderRadius: 12, backgroundColor: "rgba(6,5,26,0.7)" },
  modeDot: { width: 7, height: 7, borderRadius: 4 }, modeText: { color: colors.text, fontSize: 9, letterSpacing: 1.6, fontFamily: fonts.arcadeBlack },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, marginTop: 8 },
  time: { color: colors.muted, fontSize: 11, fontFamily: fonts.bold, width: 50, textAlign: "center", fontVariant: ["tabular-nums"] },
  transport: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 8 },
  recBtn: { flexDirection: "row", alignItems: "center", gap: 6, height: 40, paddingHorizontal: 12, borderRadius: 20, ...GLASS }, recOn: { backgroundColor: colors.pink, borderColor: colors.pink }, recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.pink }, recText: { color: colors.text, fontSize: 11, fontFamily: fonts.arcadeBlack, letterSpacing: 1 },
  tBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", ...GLASS },
  playBtn: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan },
  testBtn: { flexDirection: "row", alignItems: "center", gap: 5, height: 40, paddingHorizontal: 13, borderRadius: 20, backgroundColor: colors.lime }, testText: { color: colors.bg, fontSize: 12, fontFamily: fonts.heavy },
  actions: { flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingBottom: 6 },
  act: { flex: 1, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 2, ...GLASS }, fill: { borderColor: "rgba(255,214,0,0.35)" }, actText: { color: colors.text, fontSize: 9, fontFamily: fonts.heavy },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28, gap: 14 }, emptyTitle: { color: colors.text, fontSize: 24, fontFamily: fonts.display, textAlign: "center" }, emptyCopy: { color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 6, fontFamily: fonts.body },
});
