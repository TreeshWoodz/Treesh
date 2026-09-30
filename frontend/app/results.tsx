import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassCard, NeonButton, ScreenHeader, SongCover } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { useStarlites } from "@/src/game/starlites";
import { dailyPool, pickDaily, isDailyClaimed, recordDailyDone, dailyStreakBonus, claimWeeklyChest } from "@/src/game/dailyChallenge";
import { alpha, colors, fonts, neonGlow, textGlow } from "@/src/game/theme";
import { CROWN_COLOR, CROWN_LABEL, GRADE_COLOR, gradeFor, isAllPerfect, isFullCombo, levelInfo, masteryFor } from "@/src/game/progression";

export default function ResultsScreen() {
  const { lastResult, songs, treeshSongs, mineSongs } = useAppState();
  const { award } = useStarlites();
  const [daily, setDaily] = useState<{ bonus: number; streak: number } | null>(null);
  const [chest, setChest] = useState<{ reward: number; week: number } | null>(null);
  const [showChest, setShowChest] = useState(false);
  // Daily Challenge completion: award a growing streak bonus once if this run met today's featured song + star target.
  useEffect(() => {
    if (!lastResult) return;
    const dc = pickDaily(dailyPool(songs, treeshSongs, mineSongs));
    if (!dc || lastResult.songId !== dc.song.id || lastResult.stars < dc.targetStars) return;
    isDailyClaimed().then(async claimed => {
      if (claimed) return;
      const streak = await recordDailyDone();
      const bonus = dailyStreakBonus(streak);
      await award(bonus, `Daily Challenge · ${streak}-day streak`, true);
      setDaily({ bonus, streak });
      const chestReward = await claimWeeklyChest(streak);
      if (chestReward) { await award(chestReward, `${streak}-day streak chest`, true); setChest({ reward: chestReward, week: streak / 7 }); setShowChest(true); }
    });
  }, [lastResult, songs, treeshSongs, mineSongs, award]);
  if (!lastResult) return <SafeAreaView style={styles.safe}><ScreenHeader title="Results" /><View style={styles.empty}><Text style={styles.title}>No recent run</Text><NeonButton testID="results-library-button" label="Choose a song" icon="library" onPress={() => router.replace("/library")} /></View></SafeAreaView>;
  return <ResultsBody daily={daily} chest={chest} showChest={showChest} onCollect={() => setShowChest(false)} />;
}

function ResultsBody({ daily, chest, showChest, onCollect }: { daily: { bonus: number; streak: number } | null; chest: { reward: number; week: number } | null; showChest: boolean; onCollect: () => void }) {
  const { lastResult: r, scores, songs, treeshSongs } = useAppState();
  const pop = useRef(new Animated.Value(0)).current;
  const glowA = useRef(new Animated.Value(0)).current;
  const xpA = useRef(new Animated.Value(0)).current;
  const countA = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    Animated.sequence([Animated.delay(150), Animated.spring(pop, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true })]).start();
    Animated.loop(Animated.sequence([Animated.timing(glowA, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.timing(glowA, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true })])).start();
    Animated.timing(countA, { toValue: 1, duration: 1300, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    Animated.sequence([Animated.delay(700), Animated.timing(xpA, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: false })]).start();
    const id = countA.addListener(({ value }) => setShown(Math.round(value * (r?.score || 0))));
    return () => countA.removeListener(id);
  }, [pop, glowA, xpA, countA, r?.score]);
  if (!r) return null;
  const best = Math.max(...scores.filter(item => item.songId === r.songId && item.difficulty === r.difficulty).map(item => item.score));
  const grade = gradeFor(r); const gc = GRADE_COLOR[grade];
  const fc = isFullCombo(r); const ap = isAllPerfect(r);
  const crown = masteryFor(scores, r.songId, r.difficulty).crown;
  const song = [...songs, ...treeshSongs].find(s => s.id === r.songId);
  const cover = r.coverArt ?? song?.coverArt;
  const accent = r.accent ?? song?.accent ?? colors.cyan;
  const plus = r.perfectPlus ?? 0;
  const lvBefore = levelInfo(r.xpBefore ?? 0); const lvAfter = levelInfo((r.xpBefore ?? 0) + (r.xpGained ?? 0));
  const leveled = (r.levelAfter ?? lvAfter.level) > (r.levelBefore ?? lvBefore.level);
  const fromFrac = leveled ? 0 : lvBefore.frac;
  const tiles: [string, number | string, string][] = [["PERFECT+", plus, "#CCFF00"], ["PERFECT", r.perfect - plus, "#00E5FF"], ["GREAT", r.great, "#FF2D7A"], ["GOOD", r.good, "#B537FF"], ["MISS", r.miss, "#FF0044"], ["MAX COMBO", `${r.maxCombo}×`, "#FFD600"]];
  return <View style={styles.root}>
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}><ScreenHeader title="Stage Clear" back={false} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.songRow}>
          <View style={[styles.cover, { borderColor: alpha(accent, 0.6) }]}><SongCover coverArt={cover} accent={accent} seed={r.songId} label={r.title} iconSize={20} style={StyleSheet.absoluteFill} /></View>
          <View style={{ flex: 1 }}><Text style={styles.song} numberOfLines={1}>{r.title}</Text><Text style={styles.diff}>{r.difficulty.toUpperCase()}{crown !== "none" ? `  ·  ${CROWN_LABEL[crown].toUpperCase()}` : ""}</Text></View>
          {crown !== "none" && <Ionicons name="ribbon" size={26} color={CROWN_COLOR[crown]} />}
        </View>
        <View style={styles.gradeStage}>
          <Animated.View style={[styles.gradeGlow, { backgroundColor: gc, opacity: glowA.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.3] }), transform: [{ scale: glowA.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) }] }]} />
          <Animated.View style={[styles.gradeRing, { borderColor: gc, transform: [{ rotate: "45deg" }, { scale: pop }] }]} />
          <Animated.Text testID="results-grade" style={[styles.grade, { color: gc, textShadowColor: gc, opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [2.4, 1] }) }] }]}>{grade}</Animated.Text>
        </View>
        <View style={styles.stars}>{[0, 1, 2, 3, 4].map(index => { const full = r.stars >= index + 1; const half = !full && r.stars >= index + 0.5; return <Ionicons key={index} name={full ? "star" : half ? "star-half" : "star-outline"} size={30} color={full || half ? colors.gold : "#3A3860"} />; })}</View>
        <Text style={styles.score} testID="results-score">{shown.toLocaleString()}</Text>
        <Text style={styles.scoreLabel}>{r.score >= best ? "NEW PERSONAL BEST" : `BEST ${best.toLocaleString()}`}  ·  {r.accuracy.toFixed(2)}%</Text>
        <View style={styles.medals}>
          {ap ? <View testID="medal-all-perfect" style={[styles.medal, { backgroundColor: "#7DF9FF" }]}><Ionicons name="diamond" size={14} color="#001018" /><Text style={styles.medalText}>ALL PERFECT</Text></View>
            : fc ? <View testID="medal-full-combo" style={[styles.medal, { backgroundColor: colors.lime }]}><Ionicons name="flash" size={14} color="#001018" /><Text style={styles.medalText}>FULL COMBO</Text></View> : null}
          {daily && <View testID="daily-reward-badge" style={[styles.medal, { backgroundColor: colors.gold }]}><Ionicons name="flame" size={14} color="#001018" /><Text style={styles.medalText}>DAILY · {daily.streak}D · +{daily.bonus}</Text></View>}
          {chest && <View testID="streak-chest-badge" style={[styles.medal, { backgroundColor: colors.purple }]}><Ionicons name="gift" size={14} color="#001018" /><Text style={styles.medalText}>WEEK {chest.week} CHEST · +{chest.reward}</Text></View>}
        </View>
      </View>

      <View testID="judgment-breakdown-card" style={styles.tiles}>
        {tiles.map(([label, value, c]) => <View key={label} style={[styles.tile, { borderColor: alpha(c, 0.45) }]}><Text style={[styles.tileValue, { color: c, textShadowColor: c }]}>{value}</Text><Text style={styles.tileLabel}>{label}</Text></View>)}
      </View>

      <GlassCard testID="results-xp-card" tint={colors.cyan}>
        <View style={styles.xpHead}>
          <Text style={styles.xpLevel}>LV {lvAfter.level}</Text>
          {leveled && <View testID="level-up-badge" style={styles.lvUp}><Text style={styles.lvUpText}>LEVEL UP!</Text></View>}
          <Text style={styles.xpGain}>+{r.xpGained ?? 0} XP</Text>
        </View>
        <View style={styles.xpTrack}><Animated.View style={{ height: "100%", width: xpA.interpolate({ inputRange: [0, 1], outputRange: [`${fromFrac * 100}%`, `${Math.max(2, lvAfter.frac * 100)}%`] }) }}><LinearGradient colors={[colors.cyan, colors.lime]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} /></Animated.View></View>
        <Text style={styles.xpSub}>{lvAfter.into} / {lvAfter.need} XP to level {lvAfter.level + 1}{leveled && r.levelReward ? `  ·  +${r.levelReward} Starlites reward` : ""}</Text>
      </GlassCard>

      <GlassCard testID="results-starlites-card" style={styles.starCard} tint={colors.gold}>
        <View style={styles.starLeft}><View style={styles.starIcon}><Ionicons name="sparkles" size={20} color="#001018" /></View><View><Text style={styles.starTitle}>STARLITES EARNED</Text><Text style={styles.starSub}>Spend them on note skins in the Shop</Text></View></View>
        <Text style={styles.starAmount}>+{r.starlitesEarned ?? 0}</Text>
      </GlassCard>
      <NeonButton testID="results-replay-button" label="Play again" icon="refresh" onPress={() => router.replace("/game")} />
      <View style={styles.btnRow}>
        <Pressable testID="results-leaderboard-button" onPress={() => router.replace({ pathname: "/leaderboards", params: { focus: r.songId } })} style={styles.smallBtn}><Ionicons name="trophy" size={18} color={colors.gold} /><Text style={styles.smallBtnText}>RANKS</Text></Pressable>
        <Pressable testID="results-edit-chart-button" onPress={() => router.replace("/editor")} style={styles.smallBtn}><Ionicons name="construct" size={18} color={colors.purple} /><Text style={styles.smallBtnText}>EDIT</Text></Pressable>
        <Pressable testID="results-continue-button" onPress={() => router.replace("/")} style={styles.smallBtn}><Ionicons name="home" size={18} color={colors.cyan} /><Text style={styles.smallBtnText}>HOME</Text></Pressable>
      </View>
    </ScrollView></SafeAreaView>
    {showChest && chest && <ChestReveal reward={chest.reward} week={chest.week} onCollect={onCollect} />}
  </View>;
}

// Celebratory chest-opening moment shown when a weekly streak chest drops.
function ChestReveal({ reward, week, onCollect }: { reward: number; week: number; onCollect: () => void }) {
  const pop = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const open = useRef(new Animated.Value(0)).current;
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    Animated.sequence([
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.sequence([-1, 1, -1, 1, 0].map(v => Animated.timing(shake, { toValue: v, duration: 75, useNativeDriver: true }))),
      Animated.delay(120),
      Animated.timing(open, { toValue: 1, duration: 460, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
    ]).start(() => setOpened(true));
  }, [pop, shake, open]);
  const rot = shake.interpolate({ inputRange: [-1, 1], outputRange: ["-11deg", "11deg"] });
  const P = 9;
  return <View style={styles.chestOverlay}>
    <View style={styles.chestStage}>
      <Animated.View style={[styles.chestGlow, { opacity: open.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.5] }), transform: [{ scale: open.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] }) }] }]} />
      {Array.from({ length: P }).map((_, i) => { const ang = (i / P) * Math.PI * 2; return <Animated.View key={i} pointerEvents="none" style={{ position: "absolute", opacity: open.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 0] }), transform: [{ translateX: open.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(ang) * 130] }) }, { translateY: open.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(ang) * 130] }) }, { scale: open.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.15] }) }] }}><Ionicons name="sparkles" size={20} color={colors.gold} /></Animated.View>; })}
      <Animated.View style={{ position: "absolute", opacity: open.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0] }), transform: [{ scale: pop }, { rotateZ: rot }] }}><Ionicons name="gift" size={108} color={colors.gold} /></Animated.View>
      <Animated.View pointerEvents="none" style={[styles.chestReward, { opacity: open, transform: [{ scale: open.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}>
        <Ionicons name="sparkles" size={34} color={colors.gold} />
        <Text style={styles.chestBig}>+{reward}</Text>
        <Text style={styles.chestSmall}>STARLITES</Text>
      </Animated.View>
    </View>
    <Text style={styles.chestTitle}>WEEK {week} STREAK CHEST!</Text>
    <Text style={styles.chestSub}>Keep the daily habit alive for even bigger chests.</Text>
    <Pressable testID="chest-collect-button" onPress={onCollect} disabled={!opened} style={[styles.chestBtn, !opened && { opacity: 0.4 }]}><Ionicons name="sparkles" size={17} color={colors.bg} /><Text style={styles.chestBtnText}>Collect</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" }, safe: { flex: 1, backgroundColor: "transparent" }, content: { padding: 18, gap: 14, paddingBottom: 36 },
  hero: { alignItems: "center", paddingTop: 4 },
  songRow: { flexDirection: "row", alignItems: "center", gap: 12, alignSelf: "stretch", padding: 10, borderRadius: 14, backgroundColor: "rgba(20,16,52,0.6)", borderWidth: 1, borderColor: colors.border },
  cover: { width: 52, height: 52, borderRadius: 10, overflow: "hidden", borderWidth: 1.5, backgroundColor: colors.panel },
  song: { color: colors.text, fontSize: 16, fontFamily: fonts.heavy }, diff: { color: colors.cyan, fontSize: 10, fontFamily: fonts.arcade, letterSpacing: 1.5, marginTop: 4 },
  gradeStage: { width: 220, height: 200, alignItems: "center", justifyContent: "center", marginTop: 8 },
  gradeGlow: { position: "absolute", width: 170, height: 170, borderRadius: 85 },
  gradeRing: { position: "absolute", width: 130, height: 130, borderRadius: 18, borderWidth: 2.5 },
  grade: { fontSize: 104, lineHeight: 124, fontFamily: fonts.arcadeBlack, textShadowRadius: 30, textShadowOffset: { width: 0, height: 0 } },
  stars: { flexDirection: "row", gap: 2, marginTop: 2 },
  score: { color: colors.text, fontSize: 40, lineHeight: 50, fontFamily: fonts.arcadeBlack, marginTop: 8, letterSpacing: 1, ...textGlow(colors.cyan, 16) },
  scoreLabel: { color: colors.lime, fontSize: 10, fontFamily: fonts.arcade, letterSpacing: 1.5, marginTop: 2 },
  medals: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 },
  medal: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 32, borderRadius: 8 }, medalText: { color: "#001018", fontSize: 11, fontFamily: fonts.arcadeBlack, letterSpacing: 0.8 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { width: "31.5%", flexGrow: 1, paddingVertical: 14, alignItems: "center", borderRadius: 12, borderWidth: 1, backgroundColor: "rgba(14,11,38,0.78)" },
  tileValue: { fontSize: 20, fontFamily: fonts.arcadeBlack, textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } }, tileLabel: { color: colors.muted, fontSize: 8.5, fontFamily: fonts.arcade, letterSpacing: 1.2, marginTop: 5 },
  xpHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }, xpLevel: { color: colors.cyan, fontSize: 20, fontFamily: fonts.arcadeBlack, ...textGlow(colors.cyan, 10) }, xpGain: { marginLeft: "auto", color: colors.lime, fontSize: 14, fontFamily: fonts.arcadeBlack },
  lvUp: { paddingHorizontal: 10, height: 24, borderRadius: 6, justifyContent: "center", backgroundColor: colors.pink, ...neonGlow(colors.pink, 12, 0.8) }, lvUpText: { color: "#fff", fontSize: 10, fontFamily: fonts.arcadeBlack, letterSpacing: 1 },
  xpTrack: { height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }, xpSub: { color: colors.muted, fontSize: 11, fontFamily: fonts.bold, marginTop: 8 },
  starCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, starLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }, starIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" }, starTitle: { color: colors.text, fontSize: 11, fontFamily: fonts.arcadeBlack, letterSpacing: 1 }, starSub: { color: colors.muted, fontSize: 11, marginTop: 3, fontFamily: fonts.body }, starAmount: { fontSize: 24, fontFamily: fonts.arcadeBlack, color: colors.gold, ...textGlow(colors.gold, 12) },
  btnRow: { flexDirection: "row", gap: 10 }, smallBtn: { flex: 1, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: "rgba(14,11,38,0.8)", borderWidth: 1, borderColor: colors.border }, smallBtnText: { color: colors.text, fontSize: 9, fontFamily: fonts.arcade, letterSpacing: 1.5 },
  empty: { flex: 1, justifyContent: "center", padding: 24, gap: 20 }, title: { color: colors.text, fontSize: 24, fontFamily: fonts.arcadeBlack, textAlign: "center" },
  chestOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(4,3,16,0.92)", alignItems: "center", justifyContent: "center", gap: 14, zIndex: 100, padding: 28 },
  chestStage: { width: 240, height: 240, alignItems: "center", justifyContent: "center" },
  chestGlow: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: colors.gold },
  chestReward: { position: "absolute", alignItems: "center" }, chestBig: { color: colors.gold, fontSize: 48, fontFamily: fonts.arcadeBlack, ...textGlow(colors.gold, 22) }, chestSmall: { color: colors.text, fontSize: 12, fontFamily: fonts.arcade, letterSpacing: 2, marginTop: -2 },
  chestTitle: { color: colors.text, fontSize: 20, fontFamily: fonts.arcadeBlack, textAlign: "center", letterSpacing: 1 }, chestSub: { color: colors.muted, fontSize: 13, textAlign: "center", maxWidth: 280, lineHeight: 19, fontFamily: fonts.body },
  chestBtn: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8, height: 52, paddingHorizontal: 34, borderRadius: 12, backgroundColor: colors.gold, ...neonGlow(colors.gold, 16, 0.6) }, chestBtnText: { color: "#001018", fontSize: 14, fontFamily: fonts.arcadeBlack, letterSpacing: 1.5 },
});
