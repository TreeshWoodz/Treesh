import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { StarlitesModal } from "@/src/components/StarlitesModal";
import { ProfileModal } from "@/src/components/ProfileModal";
import { LevelBadge, SongCover } from "@/src/components/ui";
import { GRADE_COLOR, levelInfo, levelTitle, masteryFor, useProgress } from "@/src/game/progression";
import { Avatar } from "@/src/components/Avatar";
import { useAppState } from "@/src/game/AppState";
import { computeAchievements } from "@/src/game/achievements";
import { dailyPool, pickDaily, isDailyClaimed, getDailyHistory, computeStreak, dailyStreakBonus } from "@/src/game/dailyChallenge";
import { colors, fonts, neonGlow, textGlow } from "@/src/game/theme";
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
  const lv = levelInfo(useProgress().xp);
  const crowns = useMemo(() => new Set(scores.filter(r => r.stars >= 3).map(r => r.songId)).size, [scores]);
  const lastPlayed = scores.length ? [...scores].sort((a, b) => b.createdAt - a.createdAt)[0] : null;
  const quickPlay = (song?: Song) => { if (!song) return; selectSong(song); setDifficulty("Normal"); router.push("/analysis"); };
  const fade = { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] };

  // Daily Challenge — one featured song/day with a star target + Starlite bonus.
  const daily = useMemo(() => pickDaily(dailyPool(songs, treeshSongs, mineSongs)), [songs, treeshSongs, mineSongs]);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  useEffect(() => { isDailyClaimed().then(setDailyClaimed); getDailyHistory().then(h => setDailyStreak(computeStreak(h))); }, [scores]);

  return <View style={styles.root}>
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <Pressable testID="home-profile-button" onPress={() => setProfileOpen(true)} style={styles.greet}><Avatar avatar={avatar} nickname={nickname} size={40} /><View><Text style={styles.greetName} numberOfLines={1}>{nickname}</Text><Text style={styles.byline}>{levelTitle(lv.level)}</Text></View></Pressable>
          <View style={styles.topRight}>
            <LevelBadge testID="home-level-badge" onPress={() => setProfileOpen(true)} />
          </View>
        </View>
        <View style={styles.currencyRow}>
          <Pressable testID="home-starlites-button" onPress={() => setStarsOpen(true)} style={styles.stars}><Ionicons name="sparkles" size={15} color={colors.gold} /><Text style={styles.starsText}>{stars.points.toLocaleString()}</Text><Ionicons name="add-circle" size={16} color={colors.gold} /></Pressable>
          <Pressable testID="home-leaderboards-button" onPress={() => router.push("/leaderboards")} style={styles.iconPill}><Ionicons name="trophy" size={16} color={colors.gold} /><Text style={styles.iconPillText}>RANKS</Text></Pressable>
          <Pressable testID="home-shop-button" onPress={() => router.push("/shop")} style={[styles.iconPill, { borderColor: "rgba(255,45,122,0.55)", backgroundColor: "rgba(255,45,122,0.1)" }]}><Ionicons name="color-palette" size={16} color={colors.pink} /><Text style={[styles.iconPillText, { color: colors.pink }]}>SHOP</Text></Pressable>
        </View>

        <Animated.View style={[styles.logoWrap, fade]}>
          <Animated.View pointerEvents="none" style={[styles.logoGlow, { opacity: bg.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }]}>
            <Svg width={320} height={170}><Defs><RadialGradient id="lg" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#B537FF" stopOpacity={0.55} /><Stop offset="0.6" stopColor="#FF2D7A" stopOpacity={0.12} /><Stop offset="1" stopColor="#FF2D7A" stopOpacity={0} /></RadialGradient></Defs><Ellipse cx={160} cy={85} rx={160} ry={85} fill="url(#lg)" /></Svg>
          </Animated.View>
          <Image source={require("../assets/images/vocotap-logo-v2.png")} resizeMode="contain" style={styles.logoImg} />
          <Text style={styles.tagline}>TAP · HOLD · RIDE THE WAVE</Text>
        </Animated.View>

        {/* Quick Play — swipeable carousel of device + Treesh tracks */}
        {slides.length > 0 && <Animated.View style={fade}>
          <View style={styles.qpHead}>
            <View style={styles.featuredTag}><View style={styles.liveDot} /><Text style={styles.featuredTagText}>{ready ? "QUICK PLAY" : "LOADING"}</Text></View>
            {dotCount > 1 && <View style={styles.dots}>{Array.from({ length: dotCount }).map((_, i) => <View key={i} style={[styles.dot, i === slide % dotCount && { width: 18, backgroundColor: colors.cyan }]} />)}</View>}
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
              {slides.map((s, i) => { const m = masteryFor(scores, s.id); return <Pressable key={`${s.id}-${i}`} testID={i === 0 ? "quick-play-button" : `quick-play-slide-${i}`} disabled={!ready} onPress={() => quickPlay(s)} style={({ pressed }) => [styles.featured, { width: CARD_W, marginRight: 12 }, pressed && styles.pressed]}>
                <SongCover coverArt={s.coverArt} accent={s.accent} seed={s.id} label={s.title} iconSize={64} style={styles.featuredArt} />
                <LinearGradient colors={["rgba(6,5,26,0.1)", "rgba(6,5,26,0.45)", "rgba(6,5,26,0.96)"]} style={StyleSheet.absoluteFill} />
                <View style={styles.slideTagRow}>
                  <View style={styles.srcTag}><Ionicons name={s.source === "device" ? "phone-portrait" : "musical-notes"} size={11} color={colors.cyan} /><Text style={styles.srcTagText}>{s.source === "device" ? "YOUR IMPORT" : s.source === "built-in" ? "WARMUP" : "TREESH MUSIC"}</Text></View>
                  {m.grade && <View style={[styles.gradeTag, { borderColor: GRADE_COLOR[m.grade] }]}><Text style={[styles.gradeTagText, { color: GRADE_COLOR[m.grade] }]}>{m.grade}</Text></View>}
                </View>
                <View style={styles.featuredBottom}>
                  <View style={{ flex: 1 }}><Text style={styles.featuredTitle} numberOfLines={1}>{s.title}</Text><Text style={styles.featuredArtist} numberOfLines={1}>{s.artist}</Text></View>
                  <View style={styles.featuredPlay}><Ionicons name="play" size={26} color="#001018" /></View>
                </View>
                <View pointerEvents="none" style={styles.featuredEdge} />
              </Pressable>; })}
            </ScrollView>
            {slides.length > 1 && <>
              <Pressable testID="quick-play-prev" onPress={() => goTo(slide - 1)} style={[styles.navArrow, { left: 6 }]} hitSlop={6}><Ionicons name="chevron-back" size={20} color={colors.cyan} /></Pressable>
              <Pressable testID="quick-play-next" onPress={() => goTo(slide + 1)} style={[styles.navArrow, { right: 18 }]} hitSlop={6}><Ionicons name="chevron-forward" size={20} color={colors.cyan} /></Pressable>
            </>}
          </View>
        </Animated.View>}

        {/* Primary action */}
        <Animated.View style={fade}>
          <Pressable testID="browse-library-button" onPress={() => router.push("/library")} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <LinearGradient pointerEvents="none" colors={[colors.cyan, "#6A5CFF", colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
            <LinearGradient pointerEvents="none" colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.05)", "transparent"]} locations={[0, 0.5, 1]} style={styles.glossPrimary} />
            <View style={styles.primaryIcon}><Ionicons name="play" size={26} color={colors.text} /></View>
            <View style={{ flex: 1 }}><Text style={styles.primaryTitle}>PLAY</Text><Text style={styles.primaryCopy}>Pick any song · auto-charted to the beat</Text></View>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </Pressable>
        </Animated.View>

        {/* Daily Challenge */}
        {daily && <Animated.View style={fade}>
          <Pressable testID="daily-challenge-card" onPress={() => quickPlay(daily.song)} style={({ pressed }) => [styles.daily, pressed && styles.pressed]}>
            <LinearGradient pointerEvents="none" colors={["rgba(255,214,0,0.2)", "rgba(255,138,0,0.08)", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={styles.dailyCover}><SongCover coverArt={daily.song.coverArt} accent={daily.song.accent} seed={daily.song.id} label={daily.song.title} iconSize={24} style={{ width: "100%", height: "100%" }} /></View>
            <View style={{ flex: 1 }}>
              <View style={styles.dailyTagRow}><Ionicons name="flame" size={12} color={colors.gold} /><Text style={styles.dailyTag}>DAILY CHALLENGE</Text>{dailyStreak > 0 && <Text style={styles.dailyStreak}>🔥 {dailyStreak}-DAY</Text>}</View>
              <Text style={styles.dailyTitle} numberOfLines={1}>{daily.song.title}</Text>
              {dailyClaimed ? <Text style={styles.dailySub} numberOfLines={1}>Completed today — nice!</Text>
                : dailyStreak > 0 ? <Text style={[styles.dailySub, styles.dailyWarn]} numberOfLines={1}>⚠️ Play today to keep your {dailyStreak}-day streak!</Text>
                : <Text style={styles.dailySub} numberOfLines={1}>Earn {daily.targetStars}★ for +{dailyStreakBonus(1)} Starlites</Text>}
            </View>
            {dailyClaimed ? <View style={styles.dailyDone}><Ionicons name="checkmark" size={20} color="#001018" /></View> : <View style={styles.dailyPlay}><Ionicons name="play" size={22} color="#001018" /></View>}
          </Pressable>
        </Animated.View>}

        {/* Mode grid */}
        <Animated.View style={[styles.tiles, fade]}>
          {[
            { key: "editor", testID: "open-editor-button", icon: "construct" as const, label: "EDITOR", caption: "Build charts", tint: colors.purple, onPress: () => router.push("/editor") },
            { key: "shop", testID: "open-shop-tile", icon: "color-palette" as const, label: "SKINS", caption: "Note styles", tint: colors.pink, onPress: () => router.push("/shop") },
            { key: "settings", testID: "open-calibration-button", icon: "options" as const, label: "SETTINGS", caption: "Tune & sync", tint: colors.cyan, onPress: () => router.push("/settings") },
            { key: "guide", testID: "open-guide-button", icon: "compass" as const, label: "GUIDE", caption: "How to play", tint: colors.lime, onPress: () => router.push("/guide") },
          ].map(t => (
            <Pressable key={t.key} testID={t.testID} onPress={t.onPress} style={({ pressed }) => [styles.tile, { borderColor: `${t.tint}66` }, pressed && styles.pressed]}>
              <LinearGradient pointerEvents="none" colors={[`${t.tint}30`, "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={[styles.tileIcon, { borderColor: t.tint, shadowColor: t.tint }]}><Ionicons name={t.icon} size={20} color={t.tint} /></View>
              <Text style={styles.tileText} numberOfLines={1}>{t.label}</Text>
              <Text style={styles.tileCaption} numberOfLines={1}>{t.caption}</Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Profile snapshot */}
        <Animated.View style={fade}>
          <Pressable testID="home-progress-card" onPress={() => setProfileOpen(true)} style={({ pressed }) => [styles.snapCard, pressed && styles.pressed]}>
            <View style={styles.snapRow}>
              <View style={styles.snapCol}><Text style={styles.statLabel}>BEST</Text><View style={styles.statInline}><Ionicons name="star" size={14} color={colors.gold} /><Text style={styles.statValue}>{bestStars || 0}</Text></View></View>
              <View style={styles.statDivider} />
              <View style={styles.snapCol}><Text style={styles.statLabel}>GAMES</Text><View style={styles.statInline}><Ionicons name="game-controller" size={14} color={colors.cyan} /><Text style={[styles.statValue, { color: colors.cyan }]}>{stars.games}</Text></View></View>
              <View style={styles.statDivider} />
              <View style={styles.snapCol}><Text style={styles.statLabel}>CROWNS</Text><View style={styles.statInline}><Ionicons name="ribbon" size={14} color={colors.lime} /><Text style={[styles.statValue, { color: colors.lime }]}>{crowns}</Text></View></View>
              <View style={styles.statDivider} />
              <View style={styles.snapCol}><Text style={styles.statLabel}>TROPHIES</Text><View style={styles.statInline}><Ionicons name="trophy" size={14} color={colors.gold} /><Text style={[styles.statValue, { color: colors.gold }]}>{unlockedCount}</Text></View></View>
            </View>
            <View style={styles.snapFoot}>
              <View style={{ flex: 1 }}><Text style={styles.snapFootLabel}>{lastPlayed ? "LAST PLAYED" : "RECENTLY PLAYED"}</Text><Text style={styles.snapFootText} numberOfLines={1}>{lastPlayed ? lastPlayed.title : "Nothing yet — pick a song to begin"}</Text></View>
              <View style={styles.snapCta}><Text style={styles.snapCtaText}>PROFILE</Text><Ionicons name="chevron-forward" size={14} color="#001018" /></View>
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
  root: { flex: 1, backgroundColor: "transparent" }, safe: { flex: 1 }, content: { paddingHorizontal: 18, paddingBottom: 32, gap: 16 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 6 },
  greet: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }, greetName: { color: colors.text, fontSize: 15, fontFamily: fonts.heavy, maxWidth: 140 },
  byline: { color: colors.lime, fontSize: 9, letterSpacing: 2, fontFamily: fonts.arcade, marginTop: 2 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  currencyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stars: { flex: 1, minHeight: 40, flexDirection: "row", gap: 7, alignItems: "center", paddingHorizontal: 12, borderRadius: 10, backgroundColor: "rgba(255,214,0,0.08)", borderWidth: 1, borderColor: "rgba(255,214,0,0.45)" }, starsText: { flex: 1, color: colors.gold, fontFamily: fonts.arcadeBlack, fontSize: 14 },
  iconPill: { height: 40, paddingHorizontal: 12, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,214,0,0.08)", borderWidth: 1, borderColor: "rgba(255,214,0,0.45)" }, iconPillText: { color: colors.gold, fontSize: 10, fontFamily: fonts.arcadeBlack, letterSpacing: 1 },
  logoWrap: { alignItems: "center", marginTop: -4 }, logoGlow: { position: "absolute", top: -14 },
  logoImg: { width: 290, height: 140 },
  tagline: { color: colors.cyan, fontSize: 10, letterSpacing: 4, fontFamily: fonts.arcade, marginTop: -6, ...textGlow(colors.cyan, 10) },
  featured: { height: 230, borderRadius: 18, overflow: "hidden", justifyContent: "space-between", borderWidth: 1.5, borderColor: "rgba(0,229,255,0.55)", ...neonGlow(colors.cyan, 18, 0.35) }, featuredArt: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  featuredEdge: { position: "absolute", left: 20, right: 20, top: 0, height: 2, backgroundColor: colors.cyan, borderRadius: 1 },
  featuredTag: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, height: 28, borderRadius: 8, backgroundColor: "rgba(0,229,255,0.1)", borderWidth: 1, borderColor: "rgba(0,229,255,0.45)" }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.lime, ...neonGlow(colors.lime, 6, 1) }, featuredTagText: { color: colors.cyan, fontSize: 10, fontFamily: fonts.arcadeBlack, letterSpacing: 1.5 },
  dots: { flexDirection: "row", alignItems: "center", gap: 5, height: 28 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.3)" },
  featuredBottom: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }, featuredTitle: { color: colors.text, fontSize: 22, fontFamily: fonts.arcadeBlack, letterSpacing: 0.3 }, featuredArtist: { color: "rgba(214,214,255,0.75)", fontSize: 13, marginTop: 3, fontFamily: fonts.bold },
  featuredPlay: { width: 58, height: 58, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan, ...neonGlow(colors.cyan, 16, 0.8) },
  primary: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, borderRadius: 16, ...neonGlow(colors.pink, 20, 0.5) }, glossPrimary: { position: "absolute", top: 0, left: 0, right: 0, height: "55%", borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  primaryIcon: { width: 50, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  primaryTitle: { color: colors.text, fontSize: 26, fontFamily: fonts.arcadeBlack, letterSpacing: 4, ...textGlow("#000", 8) }, primaryCopy: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontFamily: fonts.bold, marginTop: 1 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "47%", flexGrow: 1, height: 104, borderRadius: 14, justifyContent: "center", paddingHorizontal: 14, gap: 4, overflow: "hidden", backgroundColor: "rgba(14,11,38,0.78)", borderWidth: 1 },
  tileIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1.5, backgroundColor: "rgba(6,5,26,0.6)", shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, marginBottom: 4 },
  tileText: { color: colors.text, fontSize: 13, fontFamily: fonts.arcadeBlack, letterSpacing: 1.5 }, tileCaption: { color: colors.muted, fontSize: 11, fontFamily: fonts.bold },
  statLabel: { color: colors.muted, fontSize: 8, fontFamily: fonts.arcade, letterSpacing: 1.4 }, statInline: { flexDirection: "row", alignItems: "center", gap: 5 }, statValue: { color: colors.text, fontSize: 15, fontFamily: fonts.arcadeBlack }, statDivider: { width: 1, height: 36, backgroundColor: colors.border },
  snapCard: { borderRadius: 16, backgroundColor: "rgba(14,11,38,0.8)", borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  snapRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 6 }, snapCol: { flex: 1, alignItems: "center", gap: 7 },
  snapFoot: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "rgba(0,229,255,0.04)", borderTopWidth: 1, borderTopColor: colors.border }, snapFootLabel: { color: colors.muted, fontSize: 8, letterSpacing: 1.4, fontFamily: fonts.arcade }, snapFootText: { color: colors.text, fontSize: 14, fontFamily: fonts.bold, marginTop: 3 },
  snapCta: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, height: 32, borderRadius: 8, backgroundColor: colors.cyan }, snapCtaText: { color: "#001018", fontSize: 10, fontFamily: fonts.arcadeBlack, letterSpacing: 1 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  daily: { minHeight: 84, flexDirection: "row", alignItems: "center", gap: 13, padding: 12, borderRadius: 16, overflow: "hidden", backgroundColor: "rgba(14,11,38,0.8)", borderWidth: 1.5, borderColor: "rgba(255,214,0,0.55)", ...neonGlow(colors.gold, 14, 0.3) },
  dailyCover: { width: 58, height: 58, borderRadius: 10, overflow: "hidden", backgroundColor: colors.bg, borderWidth: 1, borderColor: "rgba(255,214,0,0.5)" },
  dailyTagRow: { flexDirection: "row", alignItems: "center", gap: 5 }, dailyTag: { color: colors.gold, fontSize: 9, letterSpacing: 1.5, fontFamily: fonts.arcadeBlack }, dailyStreak: { color: colors.lime, fontSize: 9, letterSpacing: 0.8, fontFamily: fonts.arcadeBlack, marginLeft: 2 },
  dailyTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.heavy, marginTop: 3 }, dailySub: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: fonts.body, marginTop: 2 }, dailyWarn: { color: colors.gold, fontFamily: fonts.bold },
  dailyPlay: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold, ...neonGlow(colors.gold, 12, 0.7) }, dailyDone: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.lime },
  qpHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingHorizontal: 2 },
  slideTagRow: { padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  srcTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, height: 26, borderRadius: 7, backgroundColor: "rgba(6,5,26,0.7)", borderWidth: 1, borderColor: "rgba(0,229,255,0.4)" },
  srcTagText: { color: colors.cyan, fontSize: 9, fontFamily: fonts.arcadeBlack, letterSpacing: 1 },
  gradeTag: { minWidth: 40, height: 34, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,5,26,0.75)" }, gradeTagText: { fontSize: 16, fontFamily: fonts.arcadeBlack },
  navArrow: { position: "absolute", top: 95, width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,5,26,0.7)", borderWidth: 1, borderColor: "rgba(0,229,255,0.45)" },
});
