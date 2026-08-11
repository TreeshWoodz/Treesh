import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "@/src/game/theme";
import { useStarlites } from "@/src/game/starlites";

const REASON_ICON: { match: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { match: "streak", icon: "flame", color: colors.orange },
  { match: "check-in", icon: "calendar", color: colors.cyan },
  { match: "complete", icon: "trophy", color: colors.gold },
  { match: "discovered", icon: "sparkles", color: colors.violet },
  { match: "listening", icon: "headset", color: colors.lime },
  { match: "beat", icon: "musical-notes", color: colors.pink },
];

function iconFor(reason: string) {
  const hit = REASON_ICON.find(item => reason.toLowerCase().includes(item.match));
  return hit || { icon: "star" as const, color: colors.gold };
}

function timeAgo(t: number) {
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export function StarlitesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { stars } = useStarlites();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.scrim} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={() => {}}>
        <View style={styles.handle} />
        <LinearGradient colors={["rgba(147,40,255,0.14)", "transparent"]} style={styles.headerGlow} pointerEvents="none" />
        <View style={styles.header}>
          <View style={styles.badge}><Ionicons name="sparkles" size={26} color={colors.gold} /></View>
          <Text style={styles.total} testID="starlites-total">{stars.points.toLocaleString()}</Text>
          <Text style={styles.totalLabel}>STARLITES</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statValue}>{stars.streak}</Text><Text style={styles.statLabel}>DAY STREAK</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.stat}><Text style={styles.statValue}>{stars.games}</Text><Text style={styles.statLabel}>GAMES</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.stat}><Text style={styles.statValue}>{stars.totalMin}</Text><Text style={styles.statLabel}>MINUTES</Text></View>
        </View>
        <Text style={styles.sectionTitle}>HOW YOU EARNED THEM</Text>
        <ScrollView style={styles.log} contentContainerStyle={styles.logContent} showsVerticalScrollIndicator={false} testID="starlites-history-list">
          {stars.log.length === 0 && <View style={styles.empty}><Ionicons name="sparkles-outline" size={38} color={colors.muted} /><Text style={styles.emptyText}>Play a song or check in daily to start earning Starlites.</Text></View>}
          {stars.log.map((entry, index) => { const meta = iconFor(entry.r); return <View key={`${entry.t}-${index}`} style={styles.entry} testID={`starlite-entry-${index}`}>
            <View style={[styles.entryIcon, { backgroundColor: `${meta.color}1F` }]}><Ionicons name={meta.icon} size={17} color={meta.color} /></View>
            <View style={styles.entryText}><Text style={styles.entryReason}>{entry.r}</Text><Text style={styles.entryTime}>{timeAgo(entry.t)}</Text></View>
            <Text style={styles.entryAmount}>+{entry.a}</Text>
          </View>; })}
          <View style={{ height: 12 }} />
        </ScrollView>
        <Pressable testID="starlites-close-button" onPress={onClose} style={styles.close}><Text style={styles.closeText}>Done</Text></Pressable>
      </Pressable>
    </Pressable>
  </Modal>;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet: { maxHeight: "84%", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, backgroundColor: "#0F0F13", borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: "rgba(147,40,255,0.24)", overflow: "hidden" },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: "#3A3A42", alignSelf: "center", marginBottom: 8 },
  headerGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 180 },
  header: { alignItems: "center", paddingTop: 8 },
  badge: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(147,40,255,0.12)", borderWidth: 1, borderColor: "rgba(147,40,255,0.35)" },
  total: { color: colors.gold, fontSize: 40, fontWeight: "900", marginTop: 12, letterSpacing: -0.5 }, totalLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 2.5, marginTop: 2 },
  statsRow: { flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 6, paddingVertical: 16, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  stat: { flex: 1, alignItems: "center" }, statValue: { color: colors.text, fontSize: 22, fontWeight: "900" }, statLabel: { color: colors.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1.2, marginTop: 3 }, statDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.09)" },
  sectionTitle: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginTop: 22, marginBottom: 10, paddingLeft: 4 },
  log: { flexGrow: 0 }, logContent: { gap: 8 },
  entry: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.035)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  entryIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  entryText: { flex: 1 }, entryReason: { color: colors.text, fontSize: 14, fontWeight: "700" }, entryTime: { color: colors.muted, fontSize: 11, marginTop: 2 },
  entryAmount: { color: colors.gold, fontSize: 16, fontWeight: "900" },
  empty: { alignItems: "center", paddingVertical: 40, gap: 12 }, emptyText: { color: colors.muted, fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 260 },
  close: { marginTop: 16, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }, closeText: { color: colors.text, fontSize: 15, fontWeight: "800" },
});
