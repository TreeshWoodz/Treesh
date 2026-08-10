import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NeonButton, ScreenHeader } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { colors, laneColors } from "@/src/game/theme";
import { Chart, Note, NoteType } from "@/src/game/types";

const tools: { type: NoteType | "erase"; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: "tap", label: "Tap", icon: "ellipse" }, { type: "hold", label: "Hold", icon: "remove" }, { type: "wavy", label: "Wavy", icon: "water" }, { type: "slide", label: "Slide", icon: "arrow-forward" }, { type: "erase", label: "Erase", icon: "trash" },
];

export default function EditorScreen() {
  const { selectedSong, selectedDifficulty, charts, saveChart } = useAppState();
  const original = selectedSong ? charts[`${selectedSong.id}-${selectedDifficulty}`] : undefined;
  const [chart, setChart] = useState<Chart | null>(original || null);
  const [tool, setTool] = useState<NoteType | "erase">("tap");
  const [snap, setSnap] = useState(true); const [zoom, setZoom] = useState(58); const [saved, setSaved] = useState(false);
  const undo = useRef<Note[][]>([]); const redo = useRef<Note[][]>([]);
  useEffect(() => setChart(original || null), [original]);
  const width = Math.max(900, (chart?.duration || 12) * zoom);
  const beatWidth = chart ? (60 / chart.bpm) * zoom : 30;
  const beatLines = useMemo(() => chart ? Array.from({ length: Math.ceil(chart.duration * chart.bpm / 60) + 1 }, (_, i) => i * beatWidth) : [], [chart, beatWidth]);

  const commit = (nextNotes: Note[]) => { if (!chart) return; undo.current.push(chart.notes); if (undo.current.length > 30) undo.current.shift(); redo.current = []; setChart({ ...chart, notes: nextNotes }); setSaved(false); };
  const editLane = (lane: number, x: number) => {
    if (!chart) return; let time = Math.max(0, Math.min(chart.duration, x / zoom)); if (snap) time = Math.round(time / (60 / chart.bpm / 2)) * (60 / chart.bpm / 2);
    const near = chart.notes.find(note => note.lane === lane && Math.abs(note.time - time) < 0.24);
    if (tool === "erase" || near) return commit(chart.notes.filter(note => note.id !== near?.id));
    const note: Note = { id: `edit-${Date.now()}-${lane}`, lane, time, type: tool, duration: tool === "hold" ? 1.2 : tool === "wavy" ? 1.8 : undefined };
    commit([...chart.notes, note].sort((a, b) => a.time - b.time));
  };
  const doUndo = () => { if (!chart || !undo.current.length) return; const previous = undo.current.pop()!; redo.current.push(chart.notes); setChart({ ...chart, notes: previous }); };
  const doRedo = () => { if (!chart || !redo.current.length) return; const next = redo.current.pop()!; undo.current.push(chart.notes); setChart({ ...chart, notes: next }); };

  if (!chart || !selectedSong) return <SafeAreaView style={styles.safe}><ScreenHeader title="Chart Editor" /><View style={styles.empty}><Text style={styles.emptyTitle}>Build a chart first</Text><NeonButton testID="editor-open-library-button" label="Choose song" icon="library" onPress={() => router.replace("/library")} /></View></SafeAreaView>;
  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}><ScreenHeader title="Chart Editor" right={<Pressable testID="save-chart-button" onPress={async () => { await saveChart(chart); setSaved(true); }} style={styles.save}><Ionicons name={saved ? "checkmark" : "save"} size={16} color={colors.bg} /><Text style={styles.saveText}>{saved ? "Saved" : "Save"}</Text></Pressable>} />
    <View style={styles.songBar}><View><Text style={styles.song} numberOfLines={1}>{selectedSong.title}</Text><Text style={styles.meta}>{chart.bpm} BPM · {chart.notes.length} NOTES · {selectedDifficulty.toUpperCase()}</Text></View><Pressable testID="test-chart-button" style={styles.test} onPress={() => router.push("/game")}><Ionicons name="play" size={15} color={colors.bg} /><Text style={styles.testText}>TEST</Text></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolRow} contentContainerStyle={styles.tools}>{tools.map(item => <Pressable key={item.type} testID={`editor-${item.type}-tool`} onPress={() => setTool(item.type)} style={[styles.tool, tool === item.type && styles.toolActive]}><Ionicons name={item.icon} size={16} color={tool === item.type ? colors.bg : colors.muted} /><Text style={[styles.toolText, tool === item.type && styles.toolTextActive]}>{item.label}</Text></Pressable>)}</ScrollView>
    <View style={styles.timelineWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.timeline} contentContainerStyle={{ width }}>
        <View style={[styles.lanes, { width }]}>{beatLines.map((left, index) => <View key={index} style={[styles.beat, { left, opacity: index % 4 === 0 ? 0.58 : 0.22 }]} />)}
          {laneColors.map((color, lane) => <Pressable key={color} testID={`editor-lane-${lane + 1}`} onPress={event => editLane(lane, event.nativeEvent.locationX)} style={[styles.lane, { borderColor: `${color}33` }]}><Text style={[styles.laneNumber, { color }]}>{lane + 1}</Text></Pressable>)}
          {chart.notes.map(note => <Pressable key={note.id} onPress={() => commit(chart.notes.filter(item => item.id !== note.id))} style={[styles.note, { left: note.time * zoom - 13, top: note.lane * 78 + 26, backgroundColor: laneColors[note.lane], width: note.duration ? Math.max(28, note.duration * zoom) : 28 }]}><Ionicons name={note.type === "wavy" ? "water" : note.type === "hold" ? "remove" : "ellipse"} size={13} color={colors.bg} /></Pressable>)}
        </View>
      </ScrollView>
      <View pointerEvents="none" style={styles.playhead}><View style={styles.playheadTop} /></View>
    </View>
    <View style={styles.waveform}>{chart.waveform.map((value, index) => <View key={index} style={[styles.wave, { height: 4 + value * 35 }]} />)}</View>
    <View style={styles.controls}><Pressable testID="editor-undo-button" style={styles.controlButton} onPress={doUndo}><Ionicons name="arrow-undo" size={20} color={colors.text} /></Pressable><Pressable testID="editor-redo-button" style={styles.controlButton} onPress={doRedo}><Ionicons name="arrow-redo" size={20} color={colors.text} /></Pressable><Pressable testID="editor-snap-toggle" style={[styles.snap, snap && styles.snapOn]} onPress={() => setSnap(!snap)}><Ionicons name="magnet" size={17} color={snap ? colors.bg : colors.text} /><Text style={[styles.snapText, snap && { color: colors.bg }]}>SNAP 1/2</Text></Pressable><View style={styles.zoom}><Pressable testID="editor-zoom-out-button" onPress={() => setZoom(value => Math.max(35, value - 10))}><Ionicons name="remove" size={23} color={colors.text} /></Pressable><Text style={styles.zoomText}>{zoom}%</Text><Pressable testID="editor-zoom-in-button" onPress={() => setZoom(value => Math.min(110, value + 10))}><Ionicons name="add" size={23} color={colors.text} /></Pressable></View></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, save: { minHeight: 38, paddingHorizontal: 12, borderRadius: 19, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.lime }, saveText: { color: colors.bg, fontSize: 12, fontWeight: "900" }, songBar: { height: 66, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border }, song: { color: colors.text, fontSize: 17, fontWeight: "900", maxWidth: 260 }, meta: { color: colors.cyan, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginTop: 4 }, test: { minHeight: 38, paddingHorizontal: 13, borderRadius: 19, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.cyan }, testText: { color: colors.bg, fontSize: 11, fontWeight: "900" },
  toolRow: { height: 56, flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.border }, tools: { height: 56, gap: 8, paddingHorizontal: 16, alignItems: "center" }, tool: { flexShrink: 0, height: 36, paddingHorizontal: 13, borderRadius: 18, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, toolActive: { backgroundColor: colors.cyan, borderColor: colors.cyan }, toolText: { color: colors.muted, fontSize: 11, fontWeight: "800" }, toolTextActive: { color: colors.bg },
  timelineWrap: { flex: 1, minHeight: 310, backgroundColor: "#090A0F", overflow: "hidden" }, timeline: { flex: 1 }, lanes: { height: 312 }, lane: { height: 78, borderBottomWidth: 1, backgroundColor: "rgba(255,255,255,0.012)" }, laneNumber: { position: "absolute", left: 8, top: 8, fontSize: 10, fontWeight: "900" }, beat: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: colors.cyan }, note: { position: "absolute", height: 27, minWidth: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" }, playhead: { position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, backgroundColor: colors.text }, playheadTop: { position: "absolute", top: 0, left: -5, width: 12, height: 12, backgroundColor: colors.text, transform: [{ rotate: "45deg" }] },
  waveform: { height: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 6, backgroundColor: colors.panel }, wave: { width: 2, backgroundColor: colors.violet, borderRadius: 1 }, controls: { minHeight: 68, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, borderTopWidth: 1, borderTopColor: colors.border }, controlButton: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel }, snap: { height: 40, paddingHorizontal: 11, borderRadius: 13, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, snapOn: { backgroundColor: colors.lime, borderColor: colors.lime }, snapText: { color: colors.text, fontSize: 9, fontWeight: "900" }, zoom: { marginLeft: "auto", height: 40, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, borderRadius: 13, backgroundColor: colors.panel }, zoomText: { color: colors.text, minWidth: 32, textAlign: "center", fontSize: 11, fontWeight: "800" }, empty: { flex: 1, justifyContent: "center", padding: 24, gap: 20 }, emptyTitle: { color: colors.text, fontSize: 28, fontWeight: "900", textAlign: "center" },
});
