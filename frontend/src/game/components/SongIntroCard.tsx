import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/src/components/Avatar";
import { alpha, colors, fonts, neonGlow, textGlow } from "@/src/game/theme";
import { Difficulty, Song } from "@/src/game/types";

const DIFF_COLOR: Record<Difficulty, string> = { Easy: colors.lime, Normal: colors.cyan, Hard: colors.pink, Expert: colors.purple, Custom: colors.gold };
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

type Props = {
  song: Song; difficulty: Difficulty; bpm?: number; notes: number; duration: number;
  countdown: number; nickname: string; avatar: any; mode?: "tutorial" | "practice" | "test";
};

// Pre-song intro: cover art, title, difficulty + chart stats, then the 3-2-1 countdown.
export function SongIntroCard({ song, difficulty, bpm, notes, duration, countdown, nickname, avatar, mode }: Props) {
  const enter = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const dc = DIFF_COLOR[difficulty] || colors.cyan;
  const accent = song.accent || colors.cyan;
  useEffect(() => {
    Animated.spring(enter, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }));
    loop.start(); return () => loop.stop();
  }, [enter, spin]);
  useEffect(() => { pop.setValue(0); Animated.spring(pop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start(); }, [countdown, pop]);

  const src = song.coverArt ? (typeof song.coverArt === "number" ? song.coverArt : { uri: song.coverArt }) : null;
  const modeLabel = mode === "tutorial" ? "TUTORIAL" : mode === "practice" ? "PRACTICE" : mode === "test" ? "TEST CHART" : null;
  const stats: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    ...(bpm ? [{ icon: "pulse" as const, label: `${Math.round(bpm)} BPM` }] : []),
    { icon: "musical-notes", label: `${notes} NOTES` },
    { icon: "time", label: fmt(duration) },
  ];

  return (
    <View testID="song-intro-card" style={styles.overlay}>
      <Animated.View style={[styles.card, { borderColor: alpha(accent, 0.55), opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }, { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
        {modeLabel && <View style={styles.modeTag}><Text selectable={false} style={styles.modeText}>{modeLabel}</Text></View>}
        <View style={styles.coverWrap}>
          <Animated.View style={[styles.halo, { borderColor: alpha(accent, 0.5), transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }]}>
            <View style={[styles.haloDot, { backgroundColor: accent }]} />
          </Animated.View>
          <View style={[styles.cover, { borderColor: accent }, neonGlow(accent, 26, 0.8)]}>
            {src ? <Image testID="song-intro-cover" source={src} style={styles.coverImg} resizeMode="cover" />
              : <LinearGradient colors={[accent, colors.purple, colors.bg1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.coverImg, styles.coverFallback]}><Ionicons name="musical-notes" size={64} color="#FFFFFF" /></LinearGradient>}
          </View>
        </View>
        <Text selectable={false} testID="song-intro-title" style={styles.title} numberOfLines={2}>{song.title}</Text>
        {!!song.artist && <Text selectable={false} style={styles.artist} numberOfLines={1}>{song.artist}</Text>}
        <View testID="song-intro-difficulty" style={[styles.diff, { borderColor: dc, backgroundColor: alpha(dc, 0.14) }, neonGlow(dc, 12, 0.5)]}>
          <Text selectable={false} style={[styles.diffText, { color: dc }]}>{difficulty.toUpperCase()}</Text>
        </View>
        <View style={styles.stats}>
          {stats.map(s => <View key={s.label} style={styles.stat}><Ionicons name={s.icon} size={12} color={colors.muted} /><Text selectable={false} style={styles.statText}>{s.label}</Text></View>)}
        </View>
      </Animated.View>

      <View style={styles.ready}>
        <Avatar avatar={avatar} nickname={nickname} size={36} />
        <Text selectable={false} style={styles.readyText} numberOfLines={1}>GET READY, {nickname.toUpperCase()}</Text>
      </View>
      <Animated.Text selectable={false} testID="song-intro-countdown" style={[styles.count, { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1.8, 1] }) }] }]}>{countdown}</Animated.Text>
    </View>
  );
}

const COVER = 176;
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(6,5,26,0.78)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 18 },
  card: { width: "100%", maxWidth: 360, alignItems: "center", paddingTop: 28, paddingBottom: 22, paddingHorizontal: 20, borderRadius: 24, borderWidth: 1.5, backgroundColor: "rgba(14,11,38,0.88)" },
  modeTag: { position: "absolute", top: 12, right: 12, paddingHorizontal: 10, height: 24, borderRadius: 12, justifyContent: "center", backgroundColor: alpha(colors.lime, 0.14), borderWidth: 1, borderColor: colors.lime },
  modeText: { color: colors.lime, fontSize: 9, letterSpacing: 2, fontFamily: fonts.arcadeBlack },
  coverWrap: { width: COVER + 36, height: COVER + 36, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  halo: { position: "absolute", width: COVER + 34, height: COVER + 34, borderRadius: (COVER + 34) / 2, borderWidth: 1.5, borderStyle: "dashed" },
  haloDot: { position: "absolute", top: -5, left: (COVER + 34) / 2 - 5, width: 10, height: 10, borderRadius: 5 },
  cover: { width: COVER, height: COVER, borderRadius: 20, borderWidth: 2.5, overflow: "hidden", backgroundColor: colors.bg1 },
  coverImg: { width: "100%", height: "100%" },
  coverFallback: { alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontSize: 24, lineHeight: 30, fontFamily: fonts.arcadeBlack, textAlign: "center", letterSpacing: 0.5, ...textGlow(colors.pink, 14) },
  artist: { color: colors.muted, fontSize: 14, fontFamily: fonts.bold, marginTop: 4, textAlign: "center" },
  diff: { marginTop: 14, paddingHorizontal: 18, height: 32, borderRadius: 16, borderWidth: 1.5, justifyContent: "center" },
  diffText: { fontSize: 13, letterSpacing: 3, fontFamily: fonts.arcadeBlack },
  stats: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 },
  stat: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: colors.border },
  statText: { color: colors.text, fontSize: 10, letterSpacing: 1, fontFamily: fonts.arcade },
  ready: { flexDirection: "row", alignItems: "center", gap: 10, maxWidth: 360 },
  readyText: { color: colors.cyan, fontSize: 12, letterSpacing: 3, fontFamily: fonts.arcade, ...textGlow(colors.cyan, 10), flexShrink: 1 },
  count: { color: colors.text, fontSize: 72, lineHeight: 84, fontFamily: fonts.arcadeBlack, ...textGlow(colors.pink, 30) },
});
