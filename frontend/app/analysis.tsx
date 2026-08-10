import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, GlassCard, NeonButton } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { colors } from "@/src/game/theme";
import { Difficulty } from "@/src/game/types";

const difficulties: Difficulty[] = ["Easy", "Normal", "Hard", "Expert"];

export default function AnalysisScreen() {
  const { selectedSong, selectedDifficulty, setDifficulty, analyzeSong } = useAppState();
  const player = useAudioPlayer(selectedSong?.uri ? { uri: selectedSong.uri } : null);
  const status = useAudioPlayerStatus(player);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const bars = useMemo(() => Array.from({ length: 48 }, (_, i) => 10 + Math.abs(Math.sin(i * 0.71)) * 58), []);
  useEffect(() => { if (!selectedSong?.uri) setError("This track is not available locally yet."); }, [selectedSong]);
  const run = async () => {
    if (!selectedSong?.uri) return;
    setProgress(0); setDone(false); setError("");
    const timer = setInterval(() => setProgress(value => Math.min(94, value + 3)), 55);
    try { const duration = status.duration || selectedSong.duration || 30; await new Promise(resolve => setTimeout(resolve, 1900)); await analyzeSong(selectedSong, duration, selectedDifficulty); setProgress(100); setDone(true); }
    catch { setError("This device could not decode the audio. Try MP3, AAC, M4A, or WAV."); }
    finally { clearInterval(timer); }
  };
  if (!selectedSong) return <SafeAreaView style={styles.safe}><ScreenHeader title="Auto-chart" /><View style={styles.center}><Text style={styles.title}>Choose a song first</Text><NeonButton testID="analysis-library-button" label="Open library" icon="library" onPress={() => router.replace("/library")} /></View></SafeAreaView>;

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}><ScreenHeader title="Auto-chart" /><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.hero}><View style={[styles.orb, { borderColor: selectedSong.accent }]}><Ionicons name="pulse" size={42} color={selectedSong.accent} /><Text style={styles.percent}>{progress}%</Text></View><Text style={styles.title}>{selectedSong.title}</Text><Text style={styles.artist}>{selectedSong.artist}</Text></View>
    <GlassCard testID="analysis-waveform-card"><View style={styles.wave}>{bars.map((height, index) => <View key={index} style={[styles.wavebar, { height, opacity: index / bars.length * 100 <= progress ? 1 : 0.18 }]} />)}</View><View style={styles.scan}><View style={[styles.scanFill, { width: `${progress}%` }]} /></View></GlassCard>
    <Text style={styles.label}>DIFFICULTY</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chips}>{difficulties.map(item => <Text key={item} testID={`difficulty-${item.toLowerCase()}-chip`} onPress={() => setDifficulty(item)} style={[styles.chip, selectedDifficulty === item && styles.chipActive]}>{item}</Text>)}</ScrollView>
    <View style={styles.metrics}><GlassCard style={styles.metric}><Text style={styles.metricLabel}>TEMPO</Text><Text style={styles.metricValue}>{selectedSong.bpm || "AUTO"}</Text><Text style={styles.unit}>BPM</Text></GlassCard><GlassCard style={styles.metric}><Text style={styles.metricLabel}>SOURCE</Text><Text style={styles.metricValue}>{selectedSong.source === "built-in" ? "24" : progress ? Math.max(12, Math.round(progress * 0.8)) : "—"}</Text><Text style={styles.unit}>NOTES</Text></GlassCard><GlassCard style={styles.metric}><Text style={styles.metricLabel}>PRIVACY</Text><Text style={[styles.metricValue, { color: colors.lime }]}>LOCAL</Text><Text style={styles.unit}>ONLY</Text></GlassCard></View>
    {!!error && <GlassCard style={styles.error}><Ionicons name="warning" size={20} color={colors.pink} /><Text style={styles.errorText}>{error}</Text></GlassCard>}
    {!done ? <NeonButton testID="start-analysis-button" label={progress ? "Analyzing beats…" : "Build chart on device"} icon="analytics" disabled={progress > 0} onPress={run} /> : <><NeonButton testID="play-generated-chart-button" label="Play generated chart" icon="play" onPress={() => router.replace("/game")} /><NeonButton testID="edit-generated-chart-button" label="Hand-edit first" icon="options" variant="secondary" onPress={() => router.replace("/editor")} /></>}
    <Text style={styles.footnote}>Audio never leaves this device. Native codec support varies; MP3, AAC/M4A, and WAV are the most reliable on iPhone.</Text>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, content: { padding: 18, gap: 16, paddingBottom: 34 }, center: { flex: 1, justifyContent: "center", padding: 24, gap: 20 }, hero: { alignItems: "center", paddingTop: 12 }, orb: { width: 116, height: 116, borderRadius: 58, borderWidth: 3, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, shadowColor: colors.cyan, shadowOpacity: 0.35, shadowRadius: 18 }, percent: { color: colors.text, fontSize: 16, fontWeight: "900", marginTop: 4 }, title: { color: colors.text, fontSize: 27, fontWeight: "900", marginTop: 16, textAlign: "center" }, artist: { color: colors.muted, marginTop: 5 },
  wave: { height: 88, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, wavebar: { width: 3, borderRadius: 2, backgroundColor: colors.cyan }, scan: { height: 3, backgroundColor: colors.panelStrong, borderRadius: 2 }, scanFill: { height: 3, backgroundColor: colors.lime, borderRadius: 2 },
  label: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 }, chipRow: { height: 56, marginHorizontal: -18 }, chips: { paddingHorizontal: 18, gap: 9, alignItems: "center" }, chip: { height: 36, flexShrink: 0, minWidth: 82, textAlign: "center", textAlignVertical: "center", paddingTop: 9, color: colors.muted, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }, chipActive: { color: colors.bg, backgroundColor: colors.cyan, borderColor: colors.cyan },
  metrics: { flexDirection: "row", gap: 8 }, metric: { flex: 1, alignItems: "center", paddingHorizontal: 5, paddingVertical: 12 }, metricLabel: { color: colors.muted, fontSize: 8, fontWeight: "900" }, metricValue: { color: colors.text, fontSize: 19, fontWeight: "900", marginTop: 5 }, unit: { color: colors.muted, fontSize: 8, marginTop: 2 }, error: { flexDirection: "row", gap: 10, borderColor: colors.pink }, errorText: { color: colors.text, flex: 1, lineHeight: 19 }, footnote: { color: colors.muted, textAlign: "center", fontSize: 11, lineHeight: 16, paddingHorizontal: 10 },
});