import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { computeAchievements, TIER_COLOR } from "@/src/game/achievements";
import { SongCover } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { useStarlites } from "@/src/game/starlites";
import { useTreeshIdentity } from "@/src/game/identity";
import { colors, fonts, rgba } from "@/src/game/theme";

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

  const stat = (label: string, value: string) => <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;

  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={styles.root}>
      <LinearGradient colors={[rgba(0.4), "#0B0912", "#08080A"]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
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

          <View style={styles.statStrip}>{stat("GAMES", String(stars.games))}{stat("BEST", `${bestStars}★`)}{stat("NOTES", notesHit.toLocaleString())}{stat("STREAK", `${stars.streak}d`)}</View>

          {recentAchievement && <View style={styles.recentAch}>
            <View style={[styles.recentAchIcon, { backgroundColor: TIER_COLOR[recentAchievement.tier] }]}><Ionicons name={recentAchievement.icon} size={20} color={colors.bg} /></View>
            <View style={{ flex: 1 }}><Text style={styles.recentAchLabel}>RECENT ACHIEVEMENT</Text><Text style={styles.recentAchTitle}>{recentAchievement.title}</Text></View>
          </View>}

          <Text style={styles.sectionTitle}>RECENTLY PLAYED</Text>
          {recent.length ? recent.map((s, i) => { const song = [...songs, ...treeshSongs].find(x => x.id === s.songId); const cover = s.coverArt ?? song?.coverArt; const acc = s.accent ?? song?.accent ?? colors.purple; return <View key={`${s.songId}-${s.createdAt}-${i}`} style={styles.playRow}>
            <View style={styles.playCover}><SongCover coverArt={cover} accent={acc} seed={s.songId} label={s.title} iconSize={16} style={{ width: "100%", height: "100%" }} /></View>
            <View style={{ flex: 1 }}><Text style={styles.playTitle} numberOfLines={1}>{s.title}</Text><Text style={styles.playSub}>{s.difficulty} · {s.accuracy.toFixed(1)}% · {timeAgo(s.createdAt)}</Text></View>
            <View style={styles.playStars}>{[0, 1, 2, 3, 4].map(n => <Ionicons key={n} name={n < s.stars ? "star" : "star-outline"} size={12} color={n < s.stars ? colors.gold : "#4C4C55"} />)}</View>
          </View>; }) : <Text style={styles.empty}>No runs yet — play a song to fill this in.</Text>}

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
  </Modal>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 12 },
  headTitle: { color: colors.text, fontSize: 13, letterSpacing: 3, fontFamily: fonts.heavy },
  closeBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  content: { padding: 18, paddingBottom: 40, gap: 16 },
  hero: { alignItems: "center", gap: 10 },
  avatar: { width: 92, height: 92, borderRadius: 46, overflow: "hidden", borderWidth: 3, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel },
  avatarText: { fontSize: 40, fontFamily: fonts.display },
  name: { color: colors.text, fontSize: 24, fontFamily: fonts.display },
  starPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: "rgba(245,200,66,0.12)", borderWidth: 1, borderColor: "rgba(245,200,66,0.35)" },
  starPillText: { color: colors.gold, fontSize: 12, fontFamily: fonts.heavy },
  statStrip: { flexDirection: "row", borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, paddingVertical: 14 },
  stat: { flex: 1, alignItems: "center" }, statValue: { color: colors.text, fontSize: 18, fontFamily: fonts.heavy }, statLabel: { color: colors.muted, fontSize: 9, letterSpacing: 1, marginTop: 3, fontFamily: fonts.bold },
  recentAch: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: rgba(0.1), borderWidth: 1, borderColor: rgba(0.35) },
  recentAchIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  recentAchLabel: { color: colors.muted, fontSize: 9, letterSpacing: 1.4, fontFamily: fonts.bold }, recentAchTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.display, marginTop: 2 },
  sectionTitle: { color: colors.muted, fontSize: 10, letterSpacing: 1.5, fontFamily: fonts.heavy, marginTop: 4 },
  playRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, paddingHorizontal: 13, borderRadius: 13, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  playCover: { width: 40, height: 40, borderRadius: 10, overflow: "hidden", backgroundColor: colors.bg },
  playTitle: { color: colors.text, fontSize: 14, fontFamily: fonts.bold }, playSub: { color: colors.muted, fontSize: 11, marginTop: 2 }, playStars: { flexDirection: "row" },
  empty: { color: colors.muted, fontSize: 13, paddingVertical: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  ach: { width: "47.6%", flexGrow: 1, padding: 13, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, gap: 6 },
  achIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  achTitle: { color: colors.text, fontSize: 13, fontFamily: fonts.heavy }, achDesc: { color: colors.muted, fontSize: 10.5, lineHeight: 14, minHeight: 28 },
  achTrack: { height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }, achFill: { height: 5, borderRadius: 3 },
  achGoal: { color: colors.muted, fontSize: 9, fontFamily: fonts.bold, textAlign: "right" },
});
