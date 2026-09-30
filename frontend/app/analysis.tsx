import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, NeonButton, SongCover } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { analyzeAudio, analyzeAudioNative, AudioAnalysis } from "@/src/game/audioAnalysis";
import { colors, fonts, neonGlow, textGlow } from "@/src/game/theme";
import { CROWN_BONUS, CROWN_COLOR, GRADE_COLOR, masteryFor } from "@/src/game/progression";
import { Difficulty } from "@/src/game/types";

const analysisKey = (songId: string) => `vocotap_analysis_${songId}`;
async function readCachedAnalysis(songId: string): Promise<AudioAnalysis | null> {
  try { const raw = await AsyncStorage.getItem(analysisKey(songId)); return raw ? JSON.parse(raw) as AudioAnalysis : null; } catch { return null; }
}
async function writeCachedAnalysis(songId: string, data: AudioAnalysis) {
  try { await AsyncStorage.setItem(analysisKey(songId), JSON.stringify(data)); } catch {}
}

const standard: Difficulty[] = ["Easy", "Normal", "Hard", "Expert"];
const DCOL: Record<string, string> = { Easy: "#CCFF00", Normal: "#00E5FF", Hard: "#FF8A00", Expert: "#FF2D7A", Custom: "#B537FF" };
const meta: Record<string, { note: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Easy: { note: "Relaxed", icon: "leaf" }, Normal: { note: "Balanced", icon: "musical-note" }, Hard: { note: "Fast", icon: "flame" }, Expert: { note: "Brutal", icon: "skull" }, Custom: { note: "Your chart", icon: "options" },
};

export default function AnalysisScreen() {
  const { selectedSong, selectedDifficulty, setDifficulty, charts, generateFor, scores } = useAppState();
  const player = useAudioPlayer(selectedSong?.uri ? { uri: selectedSong.uri } : null);
  const status = useAudioPlayerStatus(player);
  const [phase, setPhase] = useState<"pick" | "building" | "analyzing" | "error">("pick");
  const [progress, setProgress] = useState(0);
  const onsetsPromise = useRef<Promise<AudioAnalysis | null> | null>(null);
  const hasCustom = selectedSong ? !!charts[`${selectedSong.id}-Custom`] : false;
  const available = [...standard, ...(hasCustom ? ["Custom" as Difficulty] : [])];

  // Kick off audio analysis in the background as soon as the screen opens (web only; native analyses on Play).
  useEffect(() => { if (Platform.OS === "web" && selectedSong?.uri && !onsetsPromise.current) onsetsPromise.current = analyzeAudio(selectedSong.uri).catch(() => null); }, [selectedSong?.uri]);
  useEffect(() => { if (selectedDifficulty === "Custom" && !hasCustom) setDifficulty("Normal"); }, [selectedDifficulty, hasCustom, setDifficulty]);

  if (!selectedSong) return <SafeAreaView style={styles.safe}><ScreenHeader title="Song" /><View style={styles.center}><Text style={styles.title}>Choose a song first</Text><NeonButton testID="analysis-library-button" label="Open library" icon="library" onPress={() => router.replace("/library")} /></View></SafeAreaView>;

  // Resolve the best available beat analysis for this song, caching the result so replays are instant.
  // Web decodes the whole file up front; native fast-plays the track silently once to read its PCM.
  const resolveAnalysis = async (durHint: number): Promise<AudioAnalysis | null> => {
    if (!selectedSong.uri) return null;
    const cached = await readCachedAnalysis(selectedSong.id);
    if (cached && cached.onsets && cached.onsets.length > 6) return cached;
    if (Platform.OS === "web") {
      const web = await Promise.race([onsetsPromise.current ?? analyzeAudio(selectedSong.uri), new Promise<null>(r => setTimeout(() => r(null), 15000))]);
      if (web && web.onsets.length > 6) writeCachedAnalysis(selectedSong.id, web);
      return web;
    }
    setPhase("analyzing"); setProgress(0);
    const native = await analyzeAudioNative(selectedSong.uri, durHint, p => setProgress(p));
    if (native && native.onsets.length > 6) writeCachedAnalysis(selectedSong.id, native);
    return native;
  };

  const play = async (isPractice = false) => {
    const target = isPractice ? { pathname: "/game" as const, params: { practice: "1" } } : ("/game" as const);
    if (selectedDifficulty === "Custom") { router.replace(target); return; }
    if (!selectedSong.uri) { setPhase("error"); return; } // no playable audio (e.g. CORS-blocked) → offer retry/back/edit
    try {
      const durHint = status.duration && status.duration > 1 ? status.duration : selectedSong.duration || 180;
      const onsets = await resolveAnalysis(durHint);
      setPhase("building");
      const duration = onsets?.duration && onsets.duration > 1 ? onsets.duration : durHint;
      const chart = await generateFor(selectedSong, duration, selectedDifficulty, onsets);
      if (!chart.notes.length) throw new Error("empty-chart");
      router.replace(target);
    } catch { setPhase("error"); }
  };
  const retry = () => { onsetsPromise.current = selectedSong.uri ? analyzeAudio(selectedSong.uri).catch(() => null) : Promise.resolve(null); setPhase("pick"); play(); };

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}><ScreenHeader title="Song" />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.cover}>
          <SongCover coverArt={selectedSong.coverArt} accent={selectedSong.accent} seed={selectedSong.id} label={selectedSong.title} iconSize={54} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={["transparent", "rgba(10,10,11,0.9)"]} style={StyleSheet.absoluteFill} />
        </View>
        <Text style={styles.title} numberOfLines={2}>{selectedSong.title}</Text>
        <Text style={styles.artist}>{selectedSong.artist}{selectedSong.genre ? `  ·  ${selectedSong.genre}` : ""}</Text>
      </View>

      {phase === "building" ? <View style={styles.building}><ActivityIndicator color={colors.purple} /><Text style={styles.buildingText}>Building your {selectedDifficulty} chart…</Text><Text style={styles.buildingSub}>Matching notes to the beat</Text></View>
        : phase === "analyzing" ? <View style={styles.building}>
          <Ionicons name="pulse" size={40} color={colors.cyan} />
          <Text style={styles.buildingText}>Listening to the beat…</Text>
          <Text style={styles.buildingSub}>Reading the track to chart it to the music (one time per song)</Text>
          <View testID="analyze-progress-track" style={styles.progOuter}><View style={[styles.progInner, { width: `${Math.round(progress * 100)}%` }]} /></View>
          <Text style={styles.progPct}>{Math.round(progress * 100)}%</Text>
        </View>
        : phase === "error" ? <View style={styles.building}><Ionicons name="alert-circle" size={42} color={colors.pink} /><Text style={styles.buildingText}>Couldn&apos;t build a chart for this track.</Text>
          <NeonButton testID="analysis-retry-button" label="Try again" icon="refresh" onPress={retry} />
          <NeonButton testID="analysis-edit-button" label="Make your own chart" icon="options" variant="secondary" onPress={() => router.push("/editor")} />
          <NeonButton testID="analysis-back-button" label="Back to library" icon="library" variant="secondary" onPress={() => router.replace("/library")} />
        </View>
        : <>
          <Text style={styles.label}>SELECT DIFFICULTY</Text>
          <View style={styles.grid}>
            {available.map(d => { const active = selectedDifficulty === d; const c = DCOL[d]; const m = masteryFor(scores, selectedSong.id, d); return <Pressable key={d} testID={`difficulty-${d.toLowerCase()}-chip`} onPress={() => setDifficulty(d)} style={[styles.diff, { borderColor: active ? c : `${c}40` }, active && { backgroundColor: `${c}22`, ...neonGlow(c, 14, 0.5) }]}>
              <View style={styles.diffTop}>
                <View style={[styles.diffIcon, { borderColor: c, backgroundColor: active ? c : "transparent" }]}><Ionicons name={meta[d].icon} size={18} color={active ? "#001018" : c} /></View>
                {m.grade && <View style={styles.diffBest}><Text style={[styles.diffGrade, { color: GRADE_COLOR[m.grade] }]}>{m.grade}</Text><Ionicons name="ribbon" size={12} color={CROWN_COLOR[m.crown]} /></View>}
              </View>
              <Text style={[styles.diffName, { color: active ? c : colors.text }]}>{d.toUpperCase()}</Text>
              <Text style={styles.diffNote}>{m.best ? `Best ${m.best.score.toLocaleString()}` : meta[d].note}</Text>
            </Pressable>; })}
          </View>
          {selectedDifficulty !== "Custom" && (() => { const c = masteryFor(scores, selectedSong.id, selectedDifficulty).crown; const gold = c === "gold" || c === "diamond"; const dia = c === "diamond"; return <View testID="crown-goals" style={styles.goals}>
            <Text style={styles.goalsTitle}>CROWN CHALLENGES · {selectedDifficulty.toUpperCase()}</Text>
            {[["gold", "Gold crown", "Full Combo — no misses", CROWN_BONUS.gold, gold], ["diamond", "Diamond crown", "All Perfect — every hit Perfect", CROWN_BONUS.diamond, dia]].map(([k, name, req, bonus, done]) => <View key={String(k)} testID={`crown-goal-${k}`} style={styles.goalRow}>
              <Ionicons name={done ? "checkmark-circle" : "ribbon"} size={22} color={CROWN_COLOR[k as "gold" | "diamond"]} />
              <View style={{ flex: 1 }}><Text style={styles.goalName}>{String(name)}</Text><Text style={styles.goalReq}>{String(req)}</Text></View>
              <Text style={[styles.goalBonus, done && { color: colors.muted, textDecorationLine: "line-through" }]}>+{String(bonus)}</Text>
            </View>)}
          </View>; })()}
          <NeonButton testID="play-generated-chart-button" label={selectedDifficulty === "Custom" ? "Play custom chart" : `Generate & play ${selectedDifficulty}`} icon="play" onPress={() => play(false)} />
          <NeonButton testID="practice-mode-button" label="Practice mode (slow + loop)" icon="school" variant="secondary" onPress={() => play(true)} />
          <NeonButton testID="edit-generated-chart-button" label={hasCustom ? "Edit custom chart" : "Create a custom chart"} icon="options" variant="secondary" onPress={() => router.push("/editor")} />
        </>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" }, content: { padding: 20, gap: 16, paddingBottom: 40 }, center: { flex: 1, justifyContent: "center", padding: 24, gap: 20 },
  hero: { alignItems: "center", paddingTop: 6 }, cover: { width: 168, height: 168, borderRadius: 18, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: 2, borderColor: colors.cyan, ...neonGlow(colors.cyan, 24, 0.55) },
  title: { color: colors.text, fontSize: 22, fontFamily: fonts.arcadeBlack, marginTop: 18, textAlign: "center", letterSpacing: 0.5, ...textGlow(colors.pink, 14) }, artist: { color: colors.muted, marginTop: 6, fontFamily: fonts.body, fontSize: 14 },
  building: { alignItems: "center", gap: 12, paddingVertical: 34 }, buildingText: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, textAlign: "center" }, buildingSub: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, marginTop: -4, textAlign: "center", maxWidth: 280 },
  progOuter: { width: "80%", maxWidth: 300, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden", marginTop: 8 }, progInner: { height: 8, borderRadius: 4, backgroundColor: colors.cyan }, progPct: { color: colors.cyan, fontFamily: fonts.heavy, fontSize: 13 },
  goals: { padding: 14, borderRadius: 14, gap: 10, backgroundColor: "rgba(14,11,38,0.82)", borderWidth: 1, borderColor: "rgba(255,214,0,0.35)" },
  goalsTitle: { color: colors.gold, fontSize: 10, fontFamily: fonts.arcade, letterSpacing: 1.5 },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 12 }, goalName: { color: colors.text, fontSize: 14, fontFamily: fonts.heavy }, goalReq: { color: colors.muted, fontSize: 11, fontFamily: fonts.body, marginTop: 1 },
  goalBonus: { color: colors.gold, fontSize: 14, fontFamily: fonts.arcadeBlack },
  label: { color: colors.cyan, fontSize: 11, letterSpacing: 2, fontFamily: fonts.arcade, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, diff: { width: "47%", flexGrow: 1, padding: 14, borderRadius: 14, backgroundColor: "rgba(14,11,38,0.82)", borderWidth: 1.5, gap: 8 }, diffTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, diffBest: { flexDirection: "row", alignItems: "center", gap: 4 }, diffGrade: { fontSize: 16, fontFamily: fonts.arcadeBlack }, diffIcon: { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" }, diffName: { fontSize: 15, fontFamily: fonts.arcadeBlack, letterSpacing: 1 }, diffNote: { color: colors.muted, fontSize: 12, fontFamily: fonts.bold },
});
