import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VisualizerBackground } from "@/src/components/VisualizerBackground";
import { GlassCard, NeonButton } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { colors } from "@/src/game/theme";
import { useStarlites } from "@/src/game/starlites";

export default function HomeScreen() {
  const { songs, selectSong, setDifficulty, scores, ready } = useAppState();
  const { stars } = useStarlites();
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(entrance, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }).start(); }, [entrance]);
  const quickPlay = () => { const song = songs[0]; if (!song) return; selectSong(song); setDifficulty("Normal"); router.push("/game"); };

  return <View style={styles.root}><VisualizerBackground /><SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
    <View style={styles.topbar}><View><Text style={styles.byline}>TREESH GAME PRESENTS</Text><Text style={styles.logo}>VOCOTAP</Text></View><Pressable testID="home-starlites-button" onPress={() => router.push("/settings")} style={styles.stars}><Ionicons name="sparkles" size={18} color={colors.gold} /><Text style={styles.starsText}>{stars.points.toLocaleString()}</Text></Pressable></View>
    <Animated.View style={[styles.hero, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}>
      <View style={styles.badge}><View style={styles.liveDot} /><Text style={styles.badgeText}>LOCAL AUDIO · ZERO UPLOADS</Text></View>
      <Text style={styles.title}>Your music.{"\n"}<Text style={styles.titleAccent}>Your stage.</Text></Text>
      <Text style={styles.subtitle}>Import any song, generate a chart, then tap, hold, and ride the wave.</Text>
    </Animated.View>
    <View style={styles.actions}>
      <NeonButton testID="browse-library-button" label="Choose a song" icon="musical-notes" onPress={() => router.push("/library")} />
      <NeonButton testID="quick-play-button" label={ready ? "Play 24-note warmup" : "Preparing stage…"} icon="flash" variant="secondary" disabled={!ready} onPress={quickPlay} />
      <View style={styles.smallActions}>
        <Pressable testID="open-editor-button" style={styles.mini} onPress={() => { if (songs[0]) selectSong(songs[0]); router.push("/editor"); }}><Ionicons name="options" size={20} color={colors.lime} /><Text style={styles.miniText}>Editor</Text></Pressable>
        <Pressable testID="open-calibration-button" style={styles.mini} onPress={() => router.push("/settings")}><Ionicons name="speedometer" size={20} color={colors.orange} /><Text style={styles.miniText}>Calibrate</Text></Pressable>
        <Pressable testID="open-guide-button" style={styles.mini} onPress={() => router.push("/guide")}><Ionicons name="help-circle" size={20} color={colors.violet} /><Text style={styles.miniText}>Guide</Text></Pressable>
      </View>
    </View>
    <GlassCard style={styles.statCard} testID="home-progress-card"><View><Text style={styles.statLabel}>RUN HISTORY</Text><Text style={styles.statValue}>{scores.length ? `${Math.max(...scores.map(item => item.stars))}★ BEST` : "READY"}</Text></View><View style={styles.divider} /><View><Text style={styles.statLabel}>VOCOPULSE</Text><Text style={[styles.statValue, { color: colors.cyan }]}>{songs.length} TRACK{songs.length === 1 ? "" : "S"}</Text></View></GlassCard>
  </SafeAreaView></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg }, safe: { flex: 1, paddingHorizontal: 20, justifyContent: "space-between" },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }, byline: { color: colors.cyan, fontSize: 10, fontWeight: "900", letterSpacing: 2.2 }, logo: { color: colors.text, fontSize: 25, fontWeight: "900", letterSpacing: 3 },
  stars: { minHeight: 44, flexDirection: "row", gap: 7, alignItems: "center", paddingHorizontal: 14, borderRadius: 22, backgroundColor: "rgba(10,10,12,0.72)", borderWidth: 1, borderColor: "rgba(255,216,77,0.35)" }, starsText: { color: colors.gold, fontWeight: "900" },
  hero: { paddingTop: 24 }, badge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 11, height: 30, borderRadius: 15, backgroundColor: "rgba(13,230,210,0.10)", borderWidth: 1, borderColor: "rgba(13,230,210,0.28)" }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lime }, badgeText: { color: colors.cyan, fontWeight: "800", fontSize: 10, letterSpacing: 0.8 },
  title: { marginTop: 16, color: colors.text, fontSize: 44, lineHeight: 45, fontWeight: "900", letterSpacing: -1.8 }, titleAccent: { color: colors.lime }, subtitle: { color: "#D0D1D7", marginTop: 14, fontSize: 16, lineHeight: 23, maxWidth: 330 },
  actions: { gap: 12 }, smallActions: { flexDirection: "row", gap: 10 }, mini: { flex: 1, minHeight: 64, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "rgba(15,15,18,0.80)", borderWidth: 1, borderColor: colors.border }, miniText: { color: colors.text, fontSize: 11, fontWeight: "800" },
  statCard: { marginBottom: 8, flexDirection: "row", justifyContent: "space-around", paddingVertical: 13 }, statLabel: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 }, statValue: { color: colors.lime, fontSize: 15, fontWeight: "900", marginTop: 3 }, divider: { width: 1, backgroundColor: colors.border },
});
