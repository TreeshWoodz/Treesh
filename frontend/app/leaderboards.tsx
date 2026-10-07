import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, SongCover } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { colors, fonts, rgba } from "@/src/game/theme";
import { Difficulty, ScoreResult, Song } from "@/src/game/types";

const DIFFS: Difficulty[] = ["Easy", "Normal", "Hard", "Expert", "Custom"];
const StarRow = ({ n, size = 13 }: { n: number; size?: number }) => <View style={{ flexDirection: "row" }}>{[0, 1, 2, 3, 4].map(i => { const full = n >= i + 1; const half = !full && n >= i + 0.5; return <Ionicons key={i} name={full ? "star" : half ? "star-half" : "star-outline"} size={size} color={full || half ? colors.gold : "rgba(255,255,255,0.25)"} />; })}</View>;

export default function LeaderboardsScreen() {
  const { scores, songs, treeshSongs } = useAppState();
  const focus = useLocalSearchParams<{ focus?: string }>().focus;
  const [open, setOpen] = useState<string | null>(focus ?? null);

  const songLookup = useMemo(() => { const m: Record<string, Song> = {}; [...songs, ...treeshSongs].forEach(s => { m[s.id] = s; }); return m; }, [songs, treeshSongs]);

  // Group personal runs per song, keeping each song's best run for the headline.
  const boards = useMemo(() => {
    const bysong: Record<string, ScoreResult[]> = {};
    for (const s of scores) (byong(bysong, s.songId)).push(s);
    return Object.entries(bysong).map(([songId, runs]) => {
      const sorted = [...runs].sort((a, b) => b.score - a.score);
      const best = sorted[0];
      return { songId, title: best.title, runs: sorted, best };
    }).sort((a, b) => b.best.score - a.best.score);
  }, [scores]);

  return <View style={styles.root}>
    {useWindowDimensions().width < 960 && <LinearGradient colors={[rgba(0.28), "#0B0912", "#08080A"]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />}
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Leaderboards" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Your personal bests — chase your own high scores on every song and difficulty.</Text>
        {!boards.length && <View style={styles.empty}><Ionicons name="trophy-outline" size={44} color={colors.gold} /><Text style={styles.emptyTitle}>No scores yet</Text><Text style={styles.emptyCopy}>Play any song to set your first record.</Text><Pressable testID="leaderboards-play-button" onPress={() => router.replace("/library")} style={styles.playCta}><Ionicons name="play" size={16} color={colors.bg} /><Text style={styles.playCtaText}>Choose a song</Text></Pressable></View>}
        {boards.map((b, idx) => {
          const song = songLookup[b.songId];
          const isOpen = open === b.songId;
          const perDiff = DIFFS.map(d => { const runs = b.runs.filter(r => r.difficulty === d); if (!runs.length) return null; return { d, best: runs[0], plays: runs.length }; }).filter(Boolean) as { d: Difficulty; best: ScoreResult; plays: number }[];
          return <View key={b.songId} style={styles.card}>
            <Pressable testID={`leaderboard-song-${idx}`} onPress={() => setOpen(isOpen ? null : b.songId)} style={styles.cardHead}>
              <Text style={styles.rank}>{idx + 1}</Text>
              <View style={styles.cover}><SongCover coverArt={song?.coverArt ?? b.best.coverArt} accent={song?.accent || b.best.accent || "#8E7CFF"} seed={b.songId} label={b.title} iconSize={20} style={{ width: "100%", height: "100%" }} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{b.title}</Text>
                <View style={styles.headMeta}><StarRow n={b.best.stars} /><Text style={styles.plays}>{b.runs.length} play{b.runs.length > 1 ? "s" : ""}</Text></View>
              </View>
              <View style={styles.bestBox}><Text style={styles.bestScore}>{b.best.score.toLocaleString()}</Text><Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.muted} /></View>
            </Pressable>
            {isOpen && <View style={styles.detail}>
              {perDiff.map(pd => <View key={pd.d} testID={`leaderboard-diff-${pd.d.toLowerCase()}`} style={styles.diffRow}>
                <View style={styles.diffTag}><Text style={styles.diffTagText}>{pd.d.toUpperCase()}</Text></View>
                <StarRow n={pd.best.stars} size={12} />
                <Text style={styles.diffAcc}>{pd.best.accuracy.toFixed(1)}%</Text>
                <Text style={styles.diffCombo}>{pd.best.maxCombo}×</Text>
                <Text style={styles.diffScore}>{pd.best.score.toLocaleString()}</Text>
              </View>)}
              <Pressable testID={`leaderboard-replay-${idx}`} onPress={() => router.replace("/library")} style={styles.replayRow}><Ionicons name="refresh" size={14} color={colors.cyan} /><Text style={styles.replayText}>Play again from the library</Text></Pressable>
            </View>}
          </View>;
        })}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  </View>;
}

// tiny helper so we don't repeat the "create-if-missing" bucket pattern
function byong(map: Record<string, ScoreResult[]>, key: string) { if (!map[key]) map[key] = []; return map[key]; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" }, safe: { flex: 1, backgroundColor: "transparent" }, content: { padding: 16, gap: 12 },
  intro: { color: colors.muted, fontSize: 13, lineHeight: 19, fontFamily: fonts.body, marginBottom: 2 },
  empty: { paddingVertical: 70, alignItems: "center", gap: 10 }, emptyTitle: { color: colors.text, fontSize: 22, fontFamily: fonts.display }, emptyCopy: { color: colors.muted, fontFamily: fonts.body, textAlign: "center" }, playCta: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10, paddingHorizontal: 18, height: 44, borderRadius: 22, backgroundColor: colors.lime }, playCtaText: { color: colors.bg, fontFamily: fonts.heavy, fontSize: 14 },
  card: { borderRadius: 14, backgroundColor: "rgba(14,11,38,0.82)", borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 }, rank: { color: colors.gold, fontSize: 18, fontFamily: fonts.display, width: 22, textAlign: "center" },
  cover: { width: 52, height: 52, borderRadius: 13, overflow: "hidden", backgroundColor: colors.bg }, title: { color: colors.text, fontSize: 16, fontFamily: fonts.heavy }, headMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }, plays: { color: colors.muted, fontSize: 11, fontFamily: fonts.body },
  bestBox: { alignItems: "flex-end", gap: 2 }, bestScore: { color: colors.text, fontSize: 14, fontFamily: fonts.arcadeBlack },
  detail: { paddingHorizontal: 12, paddingBottom: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  diffRow: { flexDirection: "row", alignItems: "center", gap: 10 }, diffTag: { width: 62, paddingVertical: 3, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center" }, diffTagText: { color: colors.cyan, fontSize: 9, fontFamily: fonts.heavy, letterSpacing: 0.6 }, diffAcc: { color: colors.muted, fontSize: 12, fontFamily: fonts.bold, width: 52 }, diffCombo: { color: colors.muted, fontSize: 12, fontFamily: fonts.bold, flex: 1 }, diffScore: { color: colors.text, fontSize: 13, fontFamily: fonts.heavy },
  replayRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" }, replayText: { color: colors.cyan, fontSize: 12, fontFamily: fonts.bold },
});
