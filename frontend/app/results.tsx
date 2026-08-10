import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VisualizerBackground } from "@/src/components/VisualizerBackground";
import { GlassCard, NeonButton, ScreenHeader } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { colors } from "@/src/game/theme";

export default function ResultsScreen() {
  const { lastResult, scores } = useAppState();
  const scale = useRef(new Animated.Value(0.5)).current;
  useEffect(() => { Animated.spring(scale, { toValue: 1, friction: 5, tension: 55, useNativeDriver: true }).start(); }, [scale]);
  if (!lastResult) return <SafeAreaView style={styles.safe}><ScreenHeader title="Results" /><View style={styles.empty}><Text style={styles.title}>No recent run</Text><NeonButton testID="results-library-button" label="Choose a song" icon="library" onPress={() => router.replace("/library")} /></View></SafeAreaView>;
  const best = Math.max(...scores.filter(item => item.songId === lastResult.songId && item.difficulty === lastResult.difficulty).map(item => item.score));
  const fullCombo = lastResult.maxCombo === lastResult.totalNotes && lastResult.miss === 0;
  return <View style={styles.root}><VisualizerBackground intensity={1.2} /><SafeAreaView style={styles.safe} edges={["top", "bottom"]}><ScreenHeader title="Run Complete" back={false} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}><Text style={styles.eyebrow}>{lastResult.score >= best ? "NEW PERSONAL BEST" : "SCORE SAVED LOCALLY"}</Text><Text style={styles.song}>{lastResult.title}</Text><Text style={styles.diff}>{lastResult.difficulty.toUpperCase()}</Text>
        <Animated.View style={[styles.stars, { transform: [{ scale }] }]}>{[0,1,2,3,4].map(index => <Ionicons key={index} name={index < lastResult.stars ? "star" : "star-outline"} size={42} color={index < lastResult.stars ? colors.gold : "#4C4C55"} />)}</Animated.View>
        <Text style={styles.score}>{lastResult.score.toLocaleString()}</Text><Text style={styles.scoreLabel}>FINAL SCORE</Text>
        {fullCombo && <View style={styles.fc}><Ionicons name="flash" size={17} color={colors.bg} /><Text style={styles.fcText}>{lastResult.totalNotes}/{lastResult.totalNotes} FULL COMBO</Text></View>}
      </View>
      <GlassCard testID="results-summary-card" style={styles.summary}><View style={styles.primaryStat}><Text style={styles.statValue}>{lastResult.accuracy.toFixed(2)}%</Text><Text style={styles.statLabel}>ACCURACY</Text></View><View style={styles.rule} /><View style={styles.primaryStat}><Text style={styles.statValue}>{lastResult.maxCombo}×</Text><Text style={styles.statLabel}>MAX COMBO</Text></View></GlassCard>
      <GlassCard testID="judgment-breakdown-card"><Text style={styles.cardTitle}>JUDGMENT BREAKDOWN</Text>{[["Perfect", lastResult.perfect, colors.cyan], ["Great", lastResult.great, colors.lime], ["Good", lastResult.good, colors.orange], ["Miss", lastResult.miss, colors.pink]].map(([label, value, color]) => <View key={String(label)} style={styles.row}><View style={[styles.dot, { backgroundColor: String(color) }]} /><Text style={styles.rowLabel}>{label}</Text><View style={styles.rowTrack}><View style={[styles.rowFill, { width: `${lastResult.totalNotes ? Number(value) / lastResult.totalNotes * 100 : 0}%`, backgroundColor: String(color) }]} /></View><Text style={styles.rowValue}>{value}</Text></View>)}</GlassCard>
      <NeonButton testID="results-replay-button" label="Replay" icon="refresh" onPress={() => router.replace("/game")} /><NeonButton testID="results-edit-chart-button" label="Hand-edit chart" icon="options" variant="secondary" onPress={() => router.replace("/editor")} /><NeonButton testID="results-continue-button" label="Continue" icon="arrow-forward" variant="secondary" onPress={() => router.replace("/")} />
    </ScrollView></SafeAreaView></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg }, safe: { flex: 1, backgroundColor: "rgba(10,10,12,0.58)" }, content: { padding: 18, gap: 14, paddingBottom: 36 }, hero: { alignItems: "center", paddingVertical: 12 }, eyebrow: { color: colors.lime, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, song: { color: colors.text, fontSize: 26, fontWeight: "900", textAlign: "center", marginTop: 8 }, diff: { color: colors.cyan, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginTop: 4 }, stars: { flexDirection: "row", marginTop: 18 }, score: { color: colors.text, fontSize: 45, lineHeight: 52, fontWeight: "900", marginTop: 10, letterSpacing: 1 }, scoreLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.8 }, fc: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12, backgroundColor: colors.lime, paddingHorizontal: 14, height: 34, borderRadius: 17 }, fcText: { color: colors.bg, fontSize: 11, fontWeight: "900" },
  summary: { flexDirection: "row", alignItems: "center" }, primaryStat: { flex: 1, alignItems: "center" }, statValue: { color: colors.text, fontSize: 25, fontWeight: "900" }, statLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginTop: 3 }, rule: { height: 40, width: 1, backgroundColor: colors.border }, cardTitle: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.3, marginBottom: 11 }, row: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 9 }, dot: { width: 7, height: 7, borderRadius: 4 }, rowLabel: { color: colors.text, width: 53, fontWeight: "700", fontSize: 13 }, rowTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.panelStrong, overflow: "hidden" }, rowFill: { height: 5 }, rowValue: { color: colors.text, width: 28, textAlign: "right", fontWeight: "900" }, empty: { flex: 1, justifyContent: "center", padding: 24, gap: 20 }, title: { color: colors.text, fontSize: 28, fontWeight: "900", textAlign: "center" },
});