import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { computeAchievements, TIER_COLOR } from "@/src/game/achievements";
import { NeonBackground, SongCover } from "@/src/components/ui";
import { levelInfo, levelTitle, useProgress, gradeFor, GRADE_COLOR } from "@/src/game/progression";
import { useAppState } from "@/src/game/AppState";
import { useStarlites } from "@/src/game/starlites";
import { useTreeshIdentity } from "@/src/game/identity";
import { getDailyHistory, computeStreak } from "@/src/game/dailyChallenge";
import { colors, fonts, rgba, neonGlow, textGlow } from "@/src/game/theme";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WD = ["S", "M", "T", "W", "T", "F", "S"];

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function ProfileModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { scores, charts, songs, treeshSongs } = useAppState();
  const { stars } = useStarlites();
  const { nickname, avatar, accent } = useTreeshIdentity();

  const achievements = useMemo(() => computeAchievements({ scores, charts, songs, points: stars.points, streak: stars.streak, games: stars.games }), [scores, charts, songs, stars]);
  const unlocked = achievements.filter(a => a.unlocked);
  const recentAchievement = unlocked[unlocked.length - 1];
  const recent = useMemo(() => [...scores].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5), [scores]);
  const bestStars = scores.reduce((m, s) => Math.max(m, s.stars), 0);
  const notesHit = scores.reduce((sum, s) => sum + s.perfect + s.great + s.good, 0);
  const initial = (nickname || "V").trim().charAt(0).toUpperCase();
  const prog = useProgress(); const lv = levelInfo(prog.xp);

  // Daily Challenge history → a little month calendar of cleared days + current streak.
  const [history, setHistory] = useState<string[]>([]);
  useEffect(() => { if (visible) getDailyHistory().then(setHistory); }, [visible]);
  const cal = useMemo(() => {
    const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
    const cleared = new Set(history);
    const lead = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const cells: { day: number | null; done: boolean; today: boolean }[] = [];
    for (let i = 0; i < lead; i++) cells.push({ day: null, done: false, today: false });
    for (let d = 1; d <= days; d++) cells.push({ day: d, done: cleared.has(`${y}-${m + 1}-${d}`), today: d === now.getDate() });
    return { cells, label: `${MONTHS[m]} ${y}`, streak: computeStreak(history), cleared: cleared.size };
  }, [history]);

  const stat = (label: string, value: string) => <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;

  const desktop = useWindowDimensions().width >= 960;
  return <Modal visible={visible} animationType={desktop ? "fade" : "slide"} transparent onRequestClose={onClose}>
    <View style={desktop ? styles.deskOverlay : styles.root}><View style={desktop ? styles.deskPanel : styles.fill}>
      <NeonBackground />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.head}>
          <Text style={styles.headTitle}>PROFILE</Text>
          <Pressable testID="profile-close" onPress={onClose} hitSlop={10} style={styles.closeBtn}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={[styles.avatar, { borderColor: accent }]}>
              {avatar ? <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} /> : <Text style={[styles.avatarText, { color: accent }]}>{initial}</Text>}
            </View>
            <Text style={styles.name}>{nickname}</Text>
            <View style={styles.starPill}><Ionicons name="sparkles" size={14} color={colors.gold} /><Text style={styles.starPillText}>{stars.points.toLocaleString()} Starlites</Text></View>
          </View>

          <View testID="profile-level-card" style={styles.lvCard}>
            <View style={styles.lvRow}><Text style={styles.lvBig}>LV {lv.level}</Text><Text style={styles.lvTitle}>{levelTitle(lv.level)}</Text><Text style={styles.lvXp}>{lv.into} / {lv.need} XP</Text></View>
            <View style={styles.lvTrack}><LinearGradient colors={[colors.cyan, colors.lime]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: "100%", width: `${Math.max(3, lv.frac * 100)}%` }} /></View>
          </View>

          <View style={styles.statStrip}>{stat("GAMES", String(stars.games))}{stat("BEST", `${bestStars}★`)}{stat("NOTES", notesHit.toLocaleString())}{stat("STREAK", `${stars.streak}d`)}</View>

          {recentAchievement && <View style={styles.recentAch}>
            <View style={[styles.recentAchIcon, { backgroundColor: TIER_COLOR[recentAchievement.tier] }]}><Ionicons name={recentAchievement.icon} size={20} color={colors.bg} /></View>
            <View style={{ flex: 1 }}><Text style={styles.recentAchLabel}>RECENT ACHIEVEMENT</Text><Text style={styles.recentAchTitle}>{recentAchievement.title}</Text></View>
          </View>}

          <Text style={styles.sectionTitle}>RECENTLY PLAYED</Text>
          {recent.length ? recent.map((s, i) => { const song = [...songs, ...treeshSongs].find(x => x.id === s.songId); const cover = s.coverArt ?? song?.coverArt; const acc = s.accent ?? song?.accent ?? colors.purple; return <View key={`${s.songId}-${s.createdAt}-${i}`} style={styles.playRow}>
            <View style={styles.playCover}><SongCover coverArt={cover} accent={acc} seed={s.songId} label={s.title} iconSize={16} style={{ width: "100%", height: "100%" }} /></View>
            <View style={{ flex: 1 }}><Text style={styles.playTitle} numberOfLines={1}>{s.title}</Text><Text style={styles.playSub}>{s.difficulty} · {s.accuracy.toFixed(1)}% · {timeAgo(s.createdAt)}</Text></View>
            <Text style={[styles.playGrade, { color: GRADE_COLOR[gradeFor(s)] }]}>{gradeFor(s)}</Text>
          </View>; }) : <Text style={styles.empty}>No runs yet — play a song to fill this in.</Text>}

          <Text style={styles.sectionTitle}>CHALLENGE HISTORY{cal.streak > 0 ? ` · 🔥 ${cal.streak}-DAY STREAK` : ""}</Text>
          <View style={styles.calCard}>
            <Text style={styles.calMonth}>{cal.label}</Text>
            <View style={styles.calRow}>{WD.map((w, i) => <Text key={i} style={styles.calWd}>{w}</Text>)}</View>
            <View style={styles.calGrid}>{cal.cells.map((c, i) => <View key={i} style={styles.calCell}>{c.day != null && <View style={[styles.calDay, c.done && styles.calDayDone, c.today && !c.done && styles.calDayToday]}><Text style={[styles.calDayText, c.done && { color: colors.bg }]}>{c.day}</Text></View>}</View>)}</View>
            <View style={styles.calLegend}><View style={[styles.calDot, { backgroundColor: colors.gold }]} /><Text style={styles.calLegendText}>Challenge cleared · {cal.cleared} total</Text></View>
          </View>

          <Text style={styles.sectionTitle}>ACHIEVEMENTS · {unlocked.length}/{achievements.length}</Text>
          <View style={styles.grid}>
            {achievements.map(a => <View key={a.id} style={[styles.ach, a.unlocked && { borderColor: TIER_COLOR[a.tier] }]}>
              <View style={[styles.achIcon, { backgroundColor: a.unlocked ? TIER_COLOR[a.tier] : "rgba(255,255,255,0.08)" }]}><Ionicons name={a.unlocked ? a.icon : "lock-closed"} size={18} color={a.unlocked ? colors.bg : colors.muted} /></View>
              <Text style={[styles.achTitle, !a.unlocked && { color: colors.muted }]} numberOfLines={1}>{a.title}</Text>
              <Text style={styles.achDesc} numberOfLines={2}>{a.desc}</Text>
              <View style={styles.achTrack}><View style={[styles.achFill, { width: `${a.progress * 100}%`, backgroundColor: a.unlocked ? TIER_COLOR[a.tier] : colors.purple }]} /></View>
              <Text style={styles.achGoal}>{a.goalText}</Text>
            </View>)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg }, fill: { flex: 1 },
  deskOverlay: { flex: 1, backgroundColor: "rgba(6,5,26,0.82)", alignItems: "center", justifyContent: "center", padding: 24 },
  deskPanel: { width: "100%", maxWidth: 580, height: "90%", maxHeight: 880, borderRadius: 24, overflow: "hidden", backgroundColor: colors.bg, borderWidth: 1, borderColor: "rgba(0,229,255,0.3)" },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 12 },
  headTitle: { color: colors.text, fontSize: 15, letterSpacing: 3, fontFamily: fonts.arcadeBlack, ...textGlow(colors.cyan, 10) },
  lvCard: { padding: 14, borderRadius: 16, backgroundColor: "rgba(0,229,255,0.07)", borderWidth: 1, borderColor: "rgba(0,229,255,0.4)", gap: 10 },
  lvRow: { flexDirection: "row", alignItems: "baseline", gap: 10 }, lvBig: { color: colors.cyan, fontFamily: fonts.arcadeBlack, fontSize: 22, ...textGlow(colors.cyan, 12) }, lvTitle: { flex: 1, color: colors.lime, fontFamily: fonts.arcade, fontSize: 11, letterSpacing: 2 }, lvXp: { color: colors.muted, fontFamily: fonts.arcade, fontSize: 10 },
  lvTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  playGrade: { fontFamily: fonts.arcadeBlack, fontSize: 20, width: 40, textAlign: "center" },
  closeBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  content: { padding: 18, paddingBottom: 40, gap: 16 },
  hero: { alignItems: "center", gap: 10 },
  avatar: { width: 92, height: 92, borderRadius: 46, overflow: "hidden", borderWidth: 3, ...neonGlow(colors.cyan, 16, 0.6), alignItems: "center", justifyContent: "center", backgroundColor: colors.panel },
  avatarText: { fontSize: 40, fontFamily: fonts.display },
  name: { color: colors.text, fontSize: 22, fontFamily: fonts.arcadeBlack, letterSpacing: 1 },
  starPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: "rgba(245,200,66,0.12)", borderWidth: 1, borderColor: "rgba(245,200,66,0.35)" },
  starPillText: { color: colors.gold, fontSize: 12, fontFamily: fonts.heavy },
  statStrip: { flexDirection: "row", borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, paddingVertical: 14 },
  stat: { flex: 1, alignItems: "center" }, statValue: { color: colors.text, fontSize: 16, fontFamily: fonts.arcadeBlack }, statLabel: { color: colors.muted, fontSize: 9, letterSpacing: 1, marginTop: 3, fontFamily: fonts.bold },
  recentAch: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: rgba(0.1), borderWidth: 1, borderColor: rgba(0.35) },
  recentAchIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  recentAchLabel: { color: colors.muted, fontSize: 9, letterSpacing: 1.4, fontFamily: fonts.bold }, recentAchTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.display, marginTop: 2 },
  sectionTitle: { color: colors.cyan, fontSize: 11, letterSpacing: 2, fontFamily: fonts.arcade, marginTop: 6 },
  playRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, paddingHorizontal: 13, borderRadius: 13, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  playCover: { width: 40, height: 40, borderRadius: 10, overflow: "hidden", backgroundColor: colors.bg },
  playTitle: { color: colors.text, fontSize: 14, fontFamily: fonts.bold }, playSub: { color: colors.muted, fontSize: 11, marginTop: 2 }, playStars: { flexDirection: "row" },
  empty: { color: colors.muted, fontSize: 13, paddingVertical: 8 },
  calCard: { padding: 14, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, gap: 8 },
  calMonth: { color: colors.text, fontSize: 14, fontFamily: fonts.arcade, letterSpacing: 1, textAlign: "center" },
  calRow: { flexDirection: "row" }, calWd: { flex: 1, textAlign: "center", color: colors.muted, fontSize: 10, fontFamily: fonts.heavy },
  calGrid: { flexDirection: "row", flexWrap: "wrap" }, calCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", padding: 2 },
  calDay: { width: "88%", aspectRatio: 1, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)" },
  calDayDone: { backgroundColor: colors.gold }, calDayToday: { borderWidth: 1.5, borderColor: colors.cyan },
  calDayText: { color: colors.muted, fontSize: 12, fontFamily: fonts.bold },
  calLegend: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 2 }, calDot: { width: 10, height: 10, borderRadius: 5 }, calLegendText: { color: colors.muted, fontSize: 11, fontFamily: fonts.body },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  ach: { width: "47.6%", flexGrow: 1, padding: 13, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, gap: 6 },
  achIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  achTitle: { color: colors.text, fontSize: 13, fontFamily: fonts.heavy }, achDesc: { color: colors.muted, fontSize: 10.5, lineHeight: 14, minHeight: 28 },
  achTrack: { height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }, achFill: { height: 5, borderRadius: 3 },
  achGoal: { color: colors.muted, fontSize: 9, fontFamily: fonts.bold, textAlign: "right" },
});
