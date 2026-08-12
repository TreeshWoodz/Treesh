import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, NeonButton, SongCover } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { colors, fonts, rgba } from "@/src/game/theme";
import { Difficulty } from "@/src/game/types";

const standard: Difficulty[] = ["Easy", "Normal", "Hard", "Expert"];
const meta: Record<string, { note: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Easy: { note: "Relaxed", icon: "leaf" }, Normal: { note: "Balanced", icon: "musical-note" }, Hard: { note: "Fast", icon: "flame" }, Expert: { note: "Brutal", icon: "skull" }, Custom: { note: "Your chart", icon: "options" },
};

export default function AnalysisScreen() {
  const { selectedSong, selectedDifficulty, setDifficulty, charts, generateAll } = useAppState();
  const player = useAudioPlayer(selectedSong?.uri ? { uri: selectedSong.uri } : null);
  const status = useAudioPlayerStatus(player);
  const [building, setBuilding] = useState(true);
  const built = useRef(false);
  const hasCustom = selectedSong ? !!charts[`${selectedSong.id}-Custom`] : false;
  const available = [...standard, ...(hasCustom ? ["Custom" as Difficulty] : [])];

  useEffect(() => {
    if (!selectedSong?.uri || built.current) return;
    const build = async (duration: number) => { built.current = true; await generateAll(selectedSong, duration); if (selectedDifficulty === "Custom" && !hasCustom) setDifficulty("Normal"); setBuilding(false); };
    if (status.duration && status.duration > 1) build(status.duration);
    else { const t = setTimeout(() => build(selectedSong.duration || 180), 2200); return () => clearTimeout(t); }
  }, [selectedSong, status.duration, generateAll, selectedDifficulty, hasCustom, setDifficulty]);

  if (!selectedSong) return <SafeAreaView style={styles.safe}><ScreenHeader title="Song" /><View style={styles.center}><Text style={styles.title}>Choose a song first</Text><NeonButton testID="analysis-library-button" label="Open library" icon="library" onPress={() => router.replace("/library")} /></View></SafeAreaView>;

  const play = () => router.replace("/game");
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

      {building ? <View style={styles.building}><ActivityIndicator color={colors.purple} /><Text style={styles.buildingText}>Auto-building charts…</Text></View>
        : <>
          <Text style={styles.label}>SELECT DIFFICULTY</Text>
          <View style={styles.grid}>
            {available.map(d => { const active = selectedDifficulty === d; return <Pressable key={d} testID={`difficulty-${d.toLowerCase()}-chip`} onPress={() => setDifficulty(d)} style={[styles.diff, active && styles.diffActive]}>
              <View style={[styles.diffIcon, active && { backgroundColor: rgba(0.9) }]}><Ionicons name={meta[d].icon} size={18} color={active ? colors.bg : colors.purple} /></View>
              <Text style={[styles.diffName, active && { color: colors.bg }]}>{d}</Text>
              <Text style={[styles.diffNote, active && { color: "rgba(10,10,11,0.7)" }]}>{meta[d].note}</Text>
            </Pressable>; })}
          </View>
          <NeonButton testID="play-generated-chart-button" label={`Play ${selectedDifficulty}`} icon="play" onPress={play} />
          <NeonButton testID="edit-generated-chart-button" label={hasCustom ? "Edit custom chart" : "Create a custom chart"} icon="options" variant="secondary" onPress={() => router.push("/editor")} />
        </>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, content: { padding: 20, gap: 16, paddingBottom: 40 }, center: { flex: 1, justifyContent: "center", padding: 24, gap: 20 },
  hero: { alignItems: "center", paddingTop: 6 }, cover: { width: 168, height: 168, borderRadius: 26, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, shadowColor: colors.purple, shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  title: { color: colors.text, fontSize: 26, fontFamily: fonts.display, marginTop: 18, textAlign: "center" }, artist: { color: colors.muted, marginTop: 6, fontFamily: fonts.body, fontSize: 14 },
  building: { alignItems: "center", gap: 12, paddingVertical: 40 }, buildingText: { color: colors.muted, fontFamily: fonts.bold, fontSize: 14 },
  label: { color: colors.muted, fontSize: 10, letterSpacing: 1.5, fontFamily: fonts.heavy, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, diff: { width: "47%", flexGrow: 1, padding: 14, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, gap: 8, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 5 }, diffActive: { backgroundColor: colors.purple, borderColor: colors.purple }, diffIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: rgba(0.15) }, diffName: { color: colors.text, fontSize: 17, fontFamily: fonts.heavy }, diffNote: { color: colors.muted, fontSize: 12, fontFamily: fonts.body },
});
