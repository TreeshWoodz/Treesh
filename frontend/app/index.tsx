import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StarlitesModal } from "@/src/components/StarlitesModal";
import { SongCover } from "@/src/components/ui";
import { Avatar } from "@/src/components/Avatar";
import { useAppState } from "@/src/game/AppState";
import { colors, fonts, rgba } from "@/src/game/theme";
import { useStarlites } from "@/src/game/starlites";
import { useTreeshIdentity } from "@/src/game/identity";
import { Song } from "@/src/game/types";

export default function HomeScreen() {
  const { songs, selectSong, setDifficulty, scores, ready } = useAppState();
  const { stars } = useStarlites();
  const { nickname, avatar } = useTreeshIdentity();
  const [starsOpen, setStarsOpen] = useState(false);
  const entrance = useRef(new Animated.Value(0)).current;
  const bg = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(entrance, { toValue: 1, friction: 9, tension: 50, useNativeDriver: true }).start(); }, [entrance]);
  useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(bg, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.timing(bg, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })])).start(); }, [bg]);

  // Quick Play slideshow — interleave a shuffled mix of custom (device) + Treesh songs so the reel shows variety.
  const slides = useMemo(() => {
    if (!songs.length) return [] as Song[];
    const shuffle = (arr: Song[]) => arr.map(v => [Math.random(), v] as [number, Song]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
    const device = shuffle(songs.filter(s => s.source === "device"));
    const treesh = shuffle(songs.filter(s => s.source !== "device"));
    const merged: Song[] = [];
    for (let i = 0; i < Math.max(device.length, treesh.length); i++) { if (device[i]) merged.push(device[i]); if (treesh[i]) merged.push(treesh[i]); }
    return merged.slice(0, 12);
  }, [songs]);
  const [slide, setSlide] = useState(0);
  const slideFade = useRef(new Animated.Value(1)).current;
  useEffect(() => { if (slides.length < 2) return; const id = setInterval(() => setSlide(s => (s + 1) % slides.length), 4200); return () => clearInterval(id); }, [slides.length]);
  useEffect(() => { if (slide >= slides.length && slides.length) setSlide(0); }, [slides.length, slide]);
  useEffect(() => { slideFade.setValue(0.35); Animated.timing(slideFade, { toValue: 1, duration: 550, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); }, [slide, slideFade]);

  const featured = slides[slide] || songs[0];
  const dotCount = Math.min(slides.length, 7);
  const bestStars = scores.length ? Math.max(...scores.map(item => item.stars)) : 0;
  const quickPlay = () => { if (!featured) return; selectSong(featured); setDifficulty("Normal"); router.push("/game"); };
  const fade = { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] };

  return <View style={styles.root}>
    <LinearGradient colors={[rgba(0.32), "#0B0912", "#08080A"]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: bg }]} pointerEvents="none"><LinearGradient colors={["#08080A", rgba(0.26), "#0B0912"]} start={{ x: 0.9, y: 0.1 }} end={{ x: 0.1, y: 1 }} style={StyleSheet.absoluteFill} /></Animated.View>
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: bg.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }) }]} pointerEvents="none"><LinearGradient colors={["transparent", rgba(0.18), "transparent"]} start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }} style={StyleSheet.absoluteFill} /></Animated.View>
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.greet}><Avatar avatar={avatar} nickname={nickname} size={44} /><View><Text style={styles.byline}>WELCOME BACK</Text><Text style={styles.greetName} numberOfLines={1}>{nickname}</Text></View></View>
          <Pressable testID="home-starlites-button" onPress={() => setStarsOpen(true)} style={styles.stars}><Ionicons name="sparkles" size={16} color={colors.gold} /><Text style={styles.starsText}>{stars.points.toLocaleString()}</Text></Pressable>
        </View>

        <Animated.View style={fade}>
          <Text style={styles.logo}>VOCOTAP</Text>
          <Text style={styles.title}>Your music,{"\n"}<Text style={styles.titleAccent}>your stage.</Text></Text>
          <Text style={styles.subtitle}>Import any track, auto build a chart, then tap, hold and ride the wave.</Text>
        </Animated.View>

        {/* Featured play card — auto-cycling Quick Play slideshow */}
        {featured && <Animated.View style={fade}>
          <Pressable testID="quick-play-button" disabled={!ready} onPress={quickPlay} style={({ pressed }) => [styles.featured, pressed && styles.pressed]}>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: slideFade }]}><SongCover coverArt={featured.coverArt} accent={featured.accent} iconSize={64} style={styles.featuredArt} /></Animated.View>
            <LinearGradient colors={["rgba(6,6,10,0.15)", "rgba(6,6,10,0.55)", "rgba(6,6,10,0.94)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.featuredTop}>
              <View style={styles.featuredTag}><View style={styles.liveDot} /><Text style={styles.featuredTagText}>{ready ? "QUICK PLAY" : "PREPARING"}</Text></View>
              {dotCount > 1 && <View style={styles.dots}>{Array.from({ length: dotCount }).map((_, i) => <View key={i} style={[styles.dot, i === slide % dotCount && { width: 16, backgroundColor: featured.accent }]} />)}</View>}
            </View>
            <Animated.View style={[styles.featuredBottom, { opacity: slideFade }]}>
              <View style={{ flex: 1 }}><Text style={styles.featuredTitle} numberOfLines={1}>{featured.title}</Text><Text style={styles.featuredArtist} numberOfLines={1}>{featured.artist}</Text></View>
              <View style={[styles.featuredPlay, { backgroundColor: featured.accent }]}><Ionicons name="play" size={26} color={colors.bg} /></View>
            </Animated.View>
          </Pressable>
        </Animated.View>}

        {/* Primary action */}
        <Animated.View style={fade}>
          <Pressable testID="browse-library-button" onPress={() => router.push("/library")} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <LinearGradient pointerEvents="none" colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.06)", "transparent"]} locations={[0, 0.5, 1]} style={styles.glossPrimary} />
            <View style={styles.primaryIcon}><Ionicons name="musical-notes" size={22} color={colors.bg} /></View>
            <View style={{ flex: 1 }}><Text style={styles.primaryTitle}>Choose a song</Text><Text style={styles.primaryCopy}>Browse Treesh Music or import your own</Text></View>
            <Ionicons name="chevron-forward" size={20} color={colors.bg} />
          </Pressable>
        </Animated.View>

        {/* Secondary tiles */}
        <Animated.View style={[styles.tiles, fade]}>
          <Pressable testID="open-editor-button" style={({ pressed }) => [styles.tile, pressed && styles.pressed]} onPress={() => { if (songs[0]) selectSong(songs[0]); router.push("/editor"); }}><LinearGradient pointerEvents="none" colors={["rgba(255,255,255,0.13)", "transparent"]} style={styles.glossTile} /><View style={[styles.tileIcon, { backgroundColor: "rgba(147,40,255,0.18)" }]}><Ionicons name="options" size={20} color={colors.text} /></View><Text style={styles.tileText}>Editor</Text></Pressable>
          <Pressable testID="open-calibration-button" style={({ pressed }) => [styles.tile, pressed && styles.pressed]} onPress={() => router.push("/settings")}><LinearGradient pointerEvents="none" colors={["rgba(255,255,255,0.13)", "transparent"]} style={styles.glossTile} /><View style={[styles.tileIcon, { backgroundColor: "rgba(147,40,255,0.18)" }]}><Ionicons name="speedometer" size={20} color={colors.text} /></View><Text style={styles.tileText}>Calibrate</Text></Pressable>
          <Pressable testID="open-guide-button" style={({ pressed }) => [styles.tile, pressed && styles.pressed]} onPress={() => router.push("/guide")}><LinearGradient pointerEvents="none" colors={["rgba(255,255,255,0.13)", "transparent"]} style={styles.glossTile} /><View style={[styles.tileIcon, { backgroundColor: "rgba(147,40,255,0.18)" }]}><Ionicons name="help-buoy" size={20} color={colors.text} /></View><Text style={styles.tileText}>How to play</Text></Pressable>
        </Animated.View>

        {/* Stats */}
        <Animated.View style={[styles.statCard, fade]} testID="home-progress-card">
          <View style={styles.statCol}><Text style={styles.statLabel}>BEST RESULT</Text><View style={styles.statInline}><Ionicons name="star" size={16} color={colors.gold} /><Text style={styles.statValue}>{bestStars ? `${bestStars} star${bestStars === 1 ? "" : "s"}` : "Ready"}</Text></View></View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}><Text style={styles.statLabel}>LIBRARY</Text><View style={styles.statInline}><Ionicons name="disc" size={15} color={colors.cyan} /><Text style={[styles.statValue, { color: colors.cyan }]}>{songs.length} track{songs.length === 1 ? "" : "s"}</Text></View></View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
    <StarlitesModal visible={starsOpen} onClose={() => setStarsOpen(false)} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg }, safe: { flex: 1 }, content: { paddingHorizontal: 20, paddingBottom: 32, gap: 18 },
  blobTop: { position: "absolute", top: -120, right: -80, width: 320, height: 320, borderRadius: 160, opacity: 0.9 }, blobBottom: { position: "absolute", bottom: -140, left: -90, width: 340, height: 340, borderRadius: 170, opacity: 0.7 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 6, marginBottom: 4 },
  greet: { flexDirection: "row", alignItems: "center", gap: 11 }, greetName: { color: colors.text, fontSize: 18, fontFamily: fonts.heavy, maxWidth: 150 },
  byline: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 2, fontFamily: fonts.bold }, logo: { color: colors.purple, fontSize: 13, letterSpacing: 4, fontFamily: fonts.display, marginBottom: 4 },
  stars: { minHeight: 40, flexDirection: "row", gap: 7, alignItems: "center", paddingHorizontal: 14, borderRadius: 20, backgroundColor: rgba(0.1), borderWidth: 1, borderColor: rgba(0.32) }, starsText: { color: colors.gold, fontFamily: fonts.heavy, fontSize: 14 },
  title: { color: colors.text, fontSize: 38, lineHeight: 41, fontFamily: fonts.display, letterSpacing: -0.5, marginTop: 2 }, titleAccent: { color: colors.purple }, subtitle: { color: colors.muted, marginTop: 12, fontSize: 15, lineHeight: 22, maxWidth: 320, fontFamily: fonts.body },
  featured: { height: 220, borderRadius: 26, overflow: "hidden", justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 14 }, featuredArt: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  featuredTop: { flexDirection: "row", padding: 16, justifyContent: "space-between", alignItems: "flex-start" }, featuredTag: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.45)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lime }, featuredTagText: { color: colors.text, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  dots: { flexDirection: "row", alignItems: "center", gap: 5, height: 28 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  featuredBottom: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }, featuredTitle: { color: colors.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.5 }, featuredArtist: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 3 }, featuredPlay: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  primary: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.lime, shadowColor: colors.purple, shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 }, glossPrimary: { position: "absolute", top: 0, left: 0, right: 0, height: "58%", borderTopLeftRadius: 22, borderTopRightRadius: 22 }, glossTile: { position: "absolute", top: 0, left: 0, right: 0, height: "55%", borderTopLeftRadius: 20, borderTopRightRadius: 20 }, primaryIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.12)" }, primaryTitle: { color: colors.bg, fontSize: 18, fontFamily: fonts.heavy }, primaryCopy: { color: "rgba(10,10,12,0.7)", fontSize: 13, fontFamily: fonts.bold, marginTop: 2 },
  tiles: { flexDirection: "row", gap: 10 }, tile: { flex: 1, minHeight: 96, borderRadius: 20, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 }, tileIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" }, tileText: { color: colors.text, fontSize: 12, fontFamily: fonts.bold },
  statCard: { flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 8, borderRadius: 22, backgroundColor: colors.panel, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 }, statCol: { flex: 1, alignItems: "center", gap: 8 }, statLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 }, statInline: { flexDirection: "row", alignItems: "center", gap: 6 }, statValue: { color: colors.text, fontSize: 16, fontWeight: "900" }, statDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.09)" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
