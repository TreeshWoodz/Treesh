import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, NeonButton } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { TREESH_CATALOG, TREESH_URL } from "@/src/game/catalog";
import { colors } from "@/src/game/theme";
import { Song } from "@/src/game/types";

export default function LibraryScreen() {
  const { songs, selectSong, importSong } = useAppState();
  const [tab, setTab] = useState<"treesh" | "device">("treesh");
  const [query, setQuery] = useState("");
  const [pickedTreesh, setPickedTreesh] = useState<Song | null>(null);
  const source = tab === "treesh" ? TREESH_CATALOG : songs;
  const visible = useMemo(() => source.filter(song => `${song.title} ${song.artist}`.toLowerCase().includes(query.toLowerCase())), [source, query]);
  const choose = (song: Song) => { if (song.source === "treesh") return setPickedTreesh(song); selectSong(song); router.push("/analysis"); };
  const doImport = async () => { const song = await importSong(); if (song) router.push("/analysis"); };

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}><ScreenHeader title="Song Library" />
    <View style={styles.chrome}>
      <View style={styles.search}><Ionicons name="search" size={18} color={colors.muted} /><TextInput testID="library-search-input" value={query} onChangeText={setQuery} placeholder="Search songs or artists" placeholderTextColor="#6D6F78" style={styles.input} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chips}>
        <Pressable testID="treesh-library-chip" onPress={() => setTab("treesh")} style={[styles.chip, tab === "treesh" && styles.chipActive]}><Text style={[styles.chipText, tab === "treesh" && styles.chipTextActive]}>Treesh Music</Text></Pressable>
        <Pressable testID="device-library-chip" onPress={() => setTab("device")} style={[styles.chip, tab === "device" && styles.chipActive]}><Text style={[styles.chipText, tab === "device" && styles.chipTextActive]}>On this device</Text></Pressable>
        <View style={styles.chip}><Text style={styles.chipText}>All difficulties</Text></View><View style={styles.chip}><Text style={styles.chipText}>Newest</Text></View>
      </ScrollView>
    </View>
    <ScrollView style={styles.list} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionRow}><View><Text style={styles.eyebrow}>{tab === "treesh" ? "DEFAULT CATALOG" : "PRIVATE LIBRARY"}</Text><Text style={styles.heading}>{tab === "treesh" ? "Treesh Music" : "Your imports"}</Text></View><Text style={styles.count}>{visible.length} songs</Text></View>
      {visible.map((song, index) => <Pressable key={song.id} testID={`song-card-${song.id}`} onPress={() => choose(song)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={[styles.cover, { backgroundColor: `${song.accent}20`, borderColor: `${song.accent}55` }]}><View style={[styles.disc, { borderColor: song.accent }]}><Ionicons name={song.source === "treesh" ? "musical-note" : "phone-portrait"} size={20} color={song.accent} /></View><Text style={[styles.track, { color: song.accent }]}>{String(index + 1).padStart(2, "0")}</Text></View>
        <View style={styles.meta}><Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text><Text style={styles.artist} numberOfLines={1}>{song.artist}</Text><View style={styles.badge}><Text style={styles.badgeText}>{song.source === "treesh" ? "TREESH" : song.source === "built-in" ? "WARMUP" : "LOCAL"}</Text></View></View>
        <View style={styles.play}><Ionicons name="play" size={19} color={colors.bg} /></View>
      </Pressable>)}
      {!visible.length && <View style={styles.empty}><Ionicons name="musical-notes-outline" size={42} color={colors.cyan} /><Text style={styles.emptyTitle}>No songs found</Text><Text style={styles.emptyCopy}>Import an audio file to build your first chart.</Text></View>}
      <View style={{ height: 96 }} />
    </ScrollView>
    <View style={styles.importBar}><NeonButton testID="import-audio-button" label="Import audio from device" icon="add" onPress={doImport} /></View>
    <Modal visible={!!pickedTreesh} transparent animationType="slide" onRequestClose={() => setPickedTreesh(null)}><Pressable style={styles.scrim} onPress={() => setPickedTreesh(null)}><Pressable style={styles.sheet} onPress={() => {}}>
      <View style={styles.handle} /><Ionicons name="leaf" size={30} color={colors.lime} /><Text style={styles.sheetTitle}>{pickedTreesh?.title}</Text><Text style={styles.sheetCopy}>Treesh currently publishes this catalog’s metadata without a documented direct audio download. Open it on Treesh, or import a copy already saved on your device.</Text>
      <NeonButton testID="open-treesh-button" label="Open on Treesh" icon="open-outline" onPress={() => WebBrowser.openBrowserAsync(TREESH_URL)} /><NeonButton testID="import-treesh-copy-button" label="Import downloaded copy" icon="download-outline" variant="secondary" onPress={async () => { setPickedTreesh(null); await doImport(); }} />
    </Pressable></Pressable></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, chrome: { height: 114, backgroundColor: "rgba(10,10,12,0.96)", borderBottomWidth: 1, borderBottomColor: colors.border }, search: { height: 46, marginHorizontal: 16, marginTop: 6, borderRadius: 15, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.panel }, input: { flex: 1, color: colors.text, fontSize: 15 },
  chipRow: { height: 56 }, chips: { gap: 8, paddingHorizontal: 16, alignItems: "center" }, chip: { flexShrink: 0, height: 36, justifyContent: "center", paddingHorizontal: 15, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel }, chipActive: { backgroundColor: "rgba(13,230,210,0.13)", borderColor: colors.cyan }, chipText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, chipTextActive: { color: colors.cyan },
  list: { flex: 1 }, content: { padding: 16, gap: 12 }, sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 5 }, eyebrow: { color: colors.cyan, fontSize: 9, letterSpacing: 1.5, fontWeight: "900" }, heading: { color: colors.text, fontSize: 24, fontWeight: "900", marginTop: 4 }, count: { color: colors.muted, fontSize: 12 },
  card: { minHeight: 92, flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 20, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] }, cover: { width: 70, height: 70, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" }, disc: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }, track: { position: "absolute", bottom: 4, right: 6, fontSize: 9, fontWeight: "900" }, meta: { flex: 1, paddingHorizontal: 13 }, songTitle: { color: colors.text, fontSize: 16, fontWeight: "800" }, artist: { color: colors.muted, marginTop: 3, fontSize: 12 }, badge: { alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.06)" }, badgeText: { color: colors.cyan, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 }, play: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.lime, alignItems: "center", justifyContent: "center" },
  empty: { paddingVertical: 70, alignItems: "center" }, emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "900", marginTop: 14 }, emptyCopy: { color: colors.muted, marginTop: 7 }, importBar: { position: "absolute", left: 16, right: 16, bottom: 12 },
  scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" }, sheet: { minHeight: "52%", paddingHorizontal: 22, paddingTop: 12, paddingBottom: 34, gap: 14, backgroundColor: colors.panel, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.cyan }, handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: "#55565E", alignSelf: "center", marginBottom: 9 }, sheetTitle: { color: colors.text, fontSize: 26, fontWeight: "900" }, sheetCopy: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 8 },
});
