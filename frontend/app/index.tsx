import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StarlitesModal } from "@/src/components/StarlitesModal";
import { ProfileModal } from "@/src/components/ProfileModal";
import { SongCover } from "@/src/components/ui";
import { Avatar } from "@/src/components/Avatar";
import { useAppState } from "@/src/game/AppState";
import { computeAchievements } from "@/src/game/achievements";
import { dailyPool, pickDaily, isDailyClaimed } from "@/src/game/dailyChallenge";
import { colors, fonts, rgba } from "@/src/game/theme";
import { useStarlites } from "@/src/game/starlites";
import { useTreeshIdentity } from "@/src/game/identity";
import { Song } from "@/src/game/types";

export default function HomeScreen() {
  const { songs, treeshSongs, charts, selectSong, setDifficulty, scores, ready, mineSongs } = useAppState();
  const { stars } = useStarlites();
  const { nickname, avatar } = useTreeshIdentity();
  const { width } = useWindowDimensions();
  const [starsOpen, setStarsOpen] = useState(false);
  const entrance = useRef(new Animated.Value(0)).current;
  const bg = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(entrance, { toValue: 1, friction: 9, tension: 50, useNativeDriver: true }).start(); }, [entrance]);
  useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(bg, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.timing(bg, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })])).start(); }, [bg]);

  // Quick Play reel — interleave a shuffled mix of device imports + Treesh Music so the carousel shows real variety.
  const slides = useMemo(() => {
    const shuffle = (arr: Song[]) => arr.map(v => [Math.random(), v] as [number, Song]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
    const device = shuffle([...songs.filter(s => s.source === "device"), ...mineSongs]);
    const treesh = shuffle([...songs.filter(s => s.source === "built-in"), ...treeshSongs]);
    const merged: Song[] = [];
    for (let i = 0; i < Math.max(device.length, treesh.length); i++) { if (device[i]) merged.push(device[i]); if (treesh[i]) merged.push(treesh[i]); }
    return merged.slice(0, 12);
  }, [songs, treeshSongs, mineSongs]);

  const CARD_W = width - 40;
  const STEP = CARD_W + 12;
  const scrollRef = useRef<ScrollView>(null);
  const [slide, setSlide] = useState(0);
  const userTouching = useRef(false);
  useEffect(() => { if (slide >= slides.length && slides.length) setSlide(0); }, [slides.length, slide]);
  // Gentle auto-advance that pauses while the user is swiping.
  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      if (userTouching.current) return;
      setSlide(s => { const n = (s + 1) % slides.length; scrollRef.current?.scrollTo({ x: n * STEP, animated: true }); return n; });
    }, 4600);
    return () => clearInterval(id);
  }, [slides.length, STEP]);
  const goTo = (i: number) => { const idx = Math.max(0, Math.min(slides.length - 1, i)); scrollRef.current?.scrollTo({ x: idx * STEP, animated: true }); setSlide(idx); };
  const onScrollEnd = (e: any) => { const idx = Math.round(e.nativeEvent.contentOffset.x / STEP); setSlide(Math.max(0, Math.min(slides.length - 1, idx))); };

  const dotCount = Math.min(slides.length, 7);
  const bestStars = scores.length ? Math.max(...scores.map(item => item.stars)) : 0;
  const [profileOpen, setProfileOpen] = useState(false);
  const achievements = useMemo(() => computeAchievements({ scores, charts, songs, points: stars.points, streak: stars.streak, games: stars.games }), [scores, charts, songs, stars]);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const lastPlayed = scores.length ? [...scores].sort((a, b) => b.createdAt - a.createdAt)[0] : null;
  const quickPlay = (song?: Song) => { if (!song) return; selectSong(song); setDifficulty("Normal"); router.push("/analysis"); };
  const fade = { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] };

  // Daily Challenge — one featured song/day with a star target + Starlite bonus.
  const daily = useMemo(() => pickDaily(dailyPool(songs, treeshSongs, mineSongs)), [songs, treeshSongs, mineSongs]);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  useEffect(() => { isDailyClaimed().then(setDailyClaimed); }, [scores]);

  return <View style={styles.root}>
    <LinearGradient colors={[rgba(0.32), "#0B0912", "#08080A"]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: bg }]} pointerEvents="none"><LinearGradient colors={["#08080A", rgba(0.26), "#0B0912"]} start={{ x: 0.9, y: 0.1 }} end={{ x: 0.1, y: 1 }} style={StyleSheet.absoluteFill} /></Animated.View>
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: bg.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }) }]} pointerEvents="none"><LinearGradient colors={["transparent", rgba(0.18), "transparent"]} start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }} style={StyleSheet.absoluteFill} /></Animated.View>
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <Pressable testID="home-profile-button" onPress={() => setProfileOpen(true)} style={styles.greet}><Avatar avatar={avatar} nickname={nickname} size={44} /><View><Text style={styles.byline}>WELCOME BACK</Text><Text style={styles.greetName} numberOfLines={1}>{nickname}</Text></View></Pressable>
          <View style={styles.topRight}>
            <Pressable testID="home-leaderboards-button" onPress={() => router.push("/leaderboards")} style={styles.iconPill}><Ionicons name="trophy" size={16} color={colors.gold} /></Pressable>
            <Pressable testID="home-starlites-button" onPress={() => setStarsOpen(true)} style={styles.stars}><Ionicons name="sparkles" size={16} color={colors.gold} /><Text style={styles.starsText}>{stars.points.toLocaleString()}</Text></Pressable>
          </View>
        </View>

        <Animated.View style={fade}>
          <Image source={require("../assets/images/vocotap-logo-v2.png")} resizeMode="contain" style={styles.logoImg} />
          <Text style={styles.title}>Your music,{"\n"}<Text style={styles.titleAccent}>your stage.</Text></Text>
          <Text style={styles.subtitle}>Import any track, auto build a chart, then tap, hold and ride the wave.</Text>
        </Animated.View>

        {/* Quick Play — swipeable carousel of device + Treesh tracks */}
        {slides.length > 0 && <Animated.View style={fade}>
          <View style={styles.qpHead}>
            <View style={styles.featuredTag}><View style={styles.liveDot} /><Text style={styles.featuredTagText}>{ready ? "QUICK PLAY" : "PREPARING"}</Text></View>
            {dotCount > 1 && <View style={styles.dots}>{Array.from({ length: dotCount }).map((_, i) => <View key={i} style={[styles.dot, i === slide % dotCount && { width: 16, backgroundColor: colors.purple }]} />)}</View>}
          </View>
          <View>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={STEP}
              disableIntervalMomentum
              contentContainerStyle={{ paddingRight: 12 }}
              onScrollBeginDrag={() => { userTouching.current = true; }}
              onMomentumScrollEnd={(e) => { userTouching.current = false; onScrollEnd(e); }}
              onScrollEndDrag={onScrollEnd}
            >
              {slides.map((s, i) => <Pressable key={`${s.id}-${i}`} testID={i === 0 ? "quick-play-button" : `quick-play-slide-${i}`} disabled={!ready} onPress={() => quickPlay(s)} style={({ pressed }) => [styles.featured, { width: CARD_W, marginRight: 12 }, pressed && styles.pressed]}>
                <SongCover coverArt={s.coverArt} accent={s.accent} seed={s.id} label={s.title} iconSize={64} style={styles.featuredArt} />
                <LinearGradient colors={["rgba(6,6,10,0.12)", "rgba(6,6,10,0.5)", "rgba(6,6,10,0.94)"]} style={StyleSheet.absoluteFill} />
                <View style={styles.slideTagRow}><View style={styles.srcTag}><Ionicons name={s.source === "device" ? "phone-portrait" : "musical-notes"} size={11} color={colors.text} /><Text style={styles.srcTagText}>{s.source === "device" ? "YOUR IMPORT" : s.source === "built-in" ? "WARMUP" : "TREESH MUSIC"}</Text></View></View>
                <View style={styles.featuredBottom}>
                  <View style={{ flex: 1 }}><Text style={styles.featuredTitle} numberOfLines={1}>{s.title}</Text><Text style={styles.featuredArtist} numberOfLines={1}>{s.artist}</Text></View>
                  <View style={[styles.featuredPlay, { backgroundColor: s.accent }]}><Ionicons name="play" size={26} color={colors.bg} /></View>
                </View>
              </Pressable>)}
            </ScrollView>
            {slides.length > 1 && <>
              <Pressable testID="quick-play-prev" onPress={() => goTo(slide - 1)} style={[styles.navArrow, { left: 6 }]} hitSlop={6}><Ionicons name="chevron-back" size={20} color={colors.text} /></Pressable>
              <Pressable testID="quick-play-next" onPress={() => goTo(slide + 1)} style={[styles.navArrow, { right: 18 }]} hitSlop={6}><Ionicons name="chevron-forward" size={20} color={colors.text} /></Pressable>
            </>}
          </View>
        </Animated.View>}

        {/* Daily Challenge */}
        {daily && <Animated.View style={fade}>
          <Pressable testID="daily-challenge-card" onPress={() => quickPlay(daily.song)} style={({ pressed }) => [styles.daily, pressed && styles.pressed]}>
            <LinearGradient pointerEvents="none" colors={["rgba(245,200,66,0.22)", "rgba(255,122,69,0.10)", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={styles.dailyCover}><SongCover coverArt={daily.song.coverArt} accent={daily.song.accent} seed={daily.song.id} label={daily.song.title} iconSize={24} style={{ width: "100%", height: "100%" }} /></View>
            <View style={{ flex: 1 }}>
              <View style={styles.dailyTagRow}><Ionicons name="flame" size={12} color={colors.gold} /><Text style={styles.dailyTag}>DAILY CHALLENGE</Text></View>
              <Text style={styles.dailyTitle} numberOfLines={1}>{daily.song.title}</Text>
              <Text style={styles.dailySub} numberOfLines={1}>{dailyClaimed ? "Completed today — nice!" : `Earn ${daily.targetStars}★ for +${daily.bonus} Starlites`}</Text>
            </View>
            {dailyClaimed ? <View style={styles.dailyDone}><Ionicons name="checkmark" size={20} color={colors.bg} /></View> : <View style={styles.dailyPlay}><Ionicons name="play" size={22} color={colors.bg} /></View>}
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
          {[
            { key: "editor", testID: "open-editor-button", icon: "construct" as const, label: "Editor", caption: "Build charts", tint: "#8E7CFF", onPress: () => router.push("/editor") },
            { key: "settings", testID: "open-calibration-button", icon: "options" as const, label: "Settings", caption: "Tune & sync", tint: "#2FE0D6", onPress: () => router.push("/settings") },
            { key: "guide", testID: "open-guide-button", icon: "compass" as const, label: "How to play", caption: "Learn it", tint: "#F5C842", onPress: () => router.push("/guide") },
          ].map(t => (
            <Pressable key={t.key} testID={t.testID} onPress={t.onPress} style={({ pressed }) => [styles.tile, { borderColor: `${t.tint}3D` }, pressed && styles.pressed]}>
              <LinearGradient pointerEvents="none" colors={[`${t.tint}2E`, "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.tileGlow} />
              <View style={[styles.tileIcon, { shadowColor: t.tint }]}>
                <LinearGradient colors={[t.tint, `${t.tint}99`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <View style={styles.tileIconGloss} />
                <Ionicons name={t.icon} size={22} color="#0A0A0B" />
              </View>
              <View style={styles.tileTextWrap}>
                <Text style={styles.tileText} numberOfLines={1}>{t.label}</Text>
                <Text style={styles.tileCaption} numberOfLines={1}>{t.caption}</Text>
              </View>
            </Pressable>
          ))}
        </Animated.View>

        {/* Profile snapshot */}
        <Animated.View style={fade}>
          <Pressable testID="home-progress-card" onPress={() => setProfileOpen(true)} style={({ pressed }) => [styles.snapCard, pressed && styles.pressed]}>
            <View style={styles.snapRow}>
              <View style={styles.snapCol}><Text style={styles.statLabel}>BEST</Text><View style={styles.statInline}><Ionicons name="star" size={15} color={colors.gold} /><Text style={styles.statValue}>{bestStars || 0}</Text></View></View>
              <View style={styles.statDivider} />
              <View style={styles.snapCol}><Text style={styles.statLabel}>GAMES</Text><View style={styles.statInline}><Ionicons name="game-controller" size={14} color={colors.cyan} /><Text style={[styles.statValue, { color: colors.cyan }]}>{stars.games}</Text></View></View>
              <View style={styles.statDivider} />
              <View style={styles.snapCol}><Text style={styles.statLabel}>TROPHIES</Text><View style={styles.statInline}><Ionicons name="trophy" size={14} color={colors.gold} /><Text style={[styles.statValue, { color: colors.gold }]}>{unlockedCount}</Text></View></View>
            </View>
            <View style={styles.snapFoot}>
              <View style={{ flex: 1 }}><Text style={styles.snapFootLabel}>{lastPlayed ? "LAST PLAYED" : "RECENTLY PLAYED"}</Text><Text style={styles.snapFootText} numberOfLines={1}>{lastPlayed ? lastPlayed.title : "Nothing yet — pick a song to begin"}</Text></View>
              <View style={styles.snapCta}><Text style={styles.snapCtaText}>Profile</Text><Ionicons name="chevron-forward" size={14} color={colors.bg} /></View>
            </View>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
    <StarlitesModal visible={starsOpen} onClose={() => setStarsOpen(false)} />
    <ProfileModal visible={profileOpen} onClose={() => setProfileOpen(false)} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg }, safe: { flex: 1 }, content: { paddingHorizontal: 20, paddingBottom: 32, gap: 18 },
  blobTop: { position: "absolute", top: -120, right: -80, width: 320, height: 320, borderRadius: 160, opacity: 0.9 }, blobBottom: { position: "absolute", bottom: -140, left: -90, width: 340, height: 340, borderRadius: 170, opacity: 0.7 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 6, marginBottom: 4 },
  greet: { flexDirection: "row", alignItems: "center", gap: 11 }, greetName: { color: colors.text, fontSize: 18, fontFamily: fonts.heavy, maxWidth: 150 },
  byline: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 2, fontFamily: fonts.bold }, logoImg: { width: 300, height: 160, marginBottom: 4, marginLeft: -6, marginTop: -6 },
  stars: { minHeight: 40, flexDirection: "row", gap: 7, alignItems: "center", paddingHorizontal: 14, borderRadius: 20, backgroundColor: rgba(0.1), borderWidth: 1, borderColor: rgba(0.32) }, starsText: { color: colors.gold, fontFamily: fonts.heavy, fontSize: 14 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 }, iconPill: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: rgba(0.1), borderWidth: 1, borderColor: rgba(0.32) },
  title: { color: colors.text, fontSize: 38, lineHeight: 41, fontFamily: fonts.display, letterSpacing: -0.5, marginTop: 2 }, titleAccent: { color: colors.purple }, subtitle: { color: colors.muted, marginTop: 12, fontSize: 15, lineHeight: 22, maxWidth: 320, fontFamily: fonts.body },
  featured: { height: 220, borderRadius: 26, overflow: "hidden", justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 14 }, featuredArt: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  featuredTop: { flexDirection: "row", padding: 16, justifyContent: "space-between", alignItems: "flex-start" }, featuredTag: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.45)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lime }, featuredTagText: { color: colors.text, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  dots: { flexDirection: "row", alignItems: "center", gap: 5, height: 28 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  featuredBottom: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }, featuredTitle: { color: colors.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.5 }, featuredArtist: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 3 }, featuredPlay: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  primary: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, borderRadius: 22, backgroundColor: colors.lime, shadowColor: colors.purple, shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 }, glossPrimary: { position: "absolute", top: 0, left: 0, right: 0, height: "58%", borderTopLeftRadius: 22, borderTopRightRadius: 22 }, glossTile: { position: "absolute", top: 0, left: 0, right: 0, height: "55%", borderTopLeftRadius: 20, borderTopRightRadius: 20 }, primaryIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.12)" }, primaryTitle: { color: colors.bg, fontSize: 18, fontFamily: fonts.heavy }, primaryCopy: { color: "rgba(10,10,12,0.7)", fontSize: 13, fontFamily: fonts.bold, marginTop: 2 },
  tiles: { flexDirection: "row", gap: 10 }, tile: { flex: 1, height: 118, borderRadius: 22, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 6, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 }, tileGlow: { position: "absolute", top: 0, left: 0, right: 0, height: "72%" }, tileIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", overflow: "hidden", shadowOpacity: 0.65, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 8 }, tileIconGloss: { position: "absolute", top: 0, left: 0, right: 0, height: "52%", backgroundColor: "rgba(255,255,255,0.32)" }, tileTextWrap: { alignItems: "center", gap: 3 }, tileText: { color: colors.text, fontSize: 13.5, fontFamily: fonts.heavy }, tileCaption: { color: colors.muted, fontSize: 9, letterSpacing: 0.8, fontFamily: fonts.bold, textTransform: "uppercase" },
  statCard: { flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 8, borderRadius: 22, backgroundColor: colors.panel, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 }, statCol: { flex: 1, alignItems: "center", gap: 8 }, statLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 }, statInline: { flexDirection: "row", alignItems: "center", gap: 6 }, statValue: { color: colors.text, fontSize: 16, fontWeight: "900" }, statDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.09)" },
  snapCard: { borderRadius: 22, backgroundColor: colors.panel, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  snapRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 8 }, snapCol: { flex: 1, alignItems: "center", gap: 7 },
  snapFoot: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: "rgba(255,255,255,0.03)", borderTopWidth: 1, borderTopColor: colors.border }, snapFootLabel: { color: colors.muted, fontSize: 9, letterSpacing: 1.3, fontFamily: fonts.bold }, snapFootText: { color: colors.text, fontSize: 14, fontFamily: fonts.bold, marginTop: 2 },
  snapCta: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: colors.purple }, snapCtaText: { color: colors.bg, fontSize: 12, fontFamily: fonts.heavy },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  daily: { minHeight: 84, flexDirection: "row", alignItems: "center", gap: 13, padding: 12, borderRadius: 22, overflow: "hidden", backgroundColor: "rgba(245,200,66,0.06)", borderWidth: 1, borderColor: "rgba(245,200,66,0.4)", shadowColor: colors.gold, shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  dailyCover: { width: 58, height: 58, borderRadius: 14, overflow: "hidden", backgroundColor: colors.bg, borderWidth: 1, borderColor: "rgba(245,200,66,0.4)" },
  dailyTagRow: { flexDirection: "row", alignItems: "center", gap: 5 }, dailyTag: { color: colors.gold, fontSize: 9, letterSpacing: 1.4, fontFamily: fonts.heavy },
  dailyTitle: { color: colors.text, fontSize: 17, fontFamily: fonts.heavy, marginTop: 3 }, dailySub: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: fonts.body, marginTop: 2 },
  dailyPlay: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold }, dailyDone: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.lime },
  qpHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingHorizontal: 2 },
  slideTagRow: { padding: 16 },
  srcTag: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  srcTagText: { color: colors.text, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  navArrow: { position: "absolute", top: 90, width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,8,12,0.62)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
});
