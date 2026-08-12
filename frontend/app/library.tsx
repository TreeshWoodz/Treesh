import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, NeonButton } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { colors, fonts } from "@/src/game/theme";
import { Song } from "@/src/game/types";

export default function LibraryScreen() {
  const { songs, treeshSongs, selectSong, importSong } = useAppState();
  const [tab, setTab] = useState<"treesh" | "device">("treesh");
  const [query, setQuery] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const source = tab === "treesh" ? treeshSongs : songs;
  const visible = useMemo(() => source.filter(song => `${song.title} ${song.artist}`.toLowerCase().includes(query.toLowerCase())), [source, query]);
  const choose = (song: Song) => { selectSong(song); router.push("/analysis"); };
  const doImport = async () => { setImportError(null); try { const song = await importSong(); if (song) router.push("/analysis"); } catch (error) { setImportError(error instanceof Error ? error.message : "Import failed. Try another file."); } };

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}><ScreenHeader title="Song Library" />
    <View style={styles.chrome}>
      <View style={styles.search}><Ionicons name="search" size={18} color={colors.muted} /><TextInput testID="library-search-input" value={query} onChangeText={setQuery} placeholder="Search songs or artists" placeholderTextColor="#6D6F78" style={styles.input} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chips}>
        <Pressable testID="treesh-library-chip" onPress={() => setTab("treesh")} style={[styles.chip, tab === "treesh" && styles.chipActive]}><Text style={[styles.chipText, tab === "treesh" && styles.chipTextActive]}>Treesh Music</Text></Pressable>
        <Pressable testID="device-library-chip" onPress={() => setTab("device")} style={[styles.chip, tab === "device" && styles.chipActive]}><Text style={[styles.chipText, tab === "device" && styles.chipTextActive]}>On this device</Text></Pressable>
      </ScrollView>
    </View>
    <ScrollView style={styles.list} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionRow}><View><Text style={styles.eyebrow}>{tab === "treesh" ? "FULL CATALOG" : "PRIVATE LIBRARY"}</Text><Text style={styles.heading}>{tab === "treesh" ? "Treesh Music" : "Your imports"}</Text></View><Text style={styles.count}>{visible.length} songs</Text></View>
      {visible.map((song, index) => <Pressable key={song.id} testID={`song-card-${song.id}`} onPress={() => choose(song)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={[styles.cover, { borderColor: `${song.accent}55` }]}>
          {song.coverArt ? <Image source={typeof song.coverArt === "number" ? song.coverArt : { uri: song.coverArt }} style={styles.coverImg} resizeMode="cover" /> : <View style={[styles.disc, { borderColor: song.accent }]}><Ionicons name={song.source === "treesh" ? "musical-note" : "phone-portrait"} size={20} color={song.accent} /></View>}
        </View>
        <View style={styles.meta}><Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text><Text style={styles.artist} numberOfLines={1}>{song.artist}</Text><View style={styles.badge}><Text style={styles.badgeText}>{song.source === "treesh" ? "TREESH" : song.source === "built-in" ? "WARMUP" : "LOCAL"}{song.genre ? ` · ${song.genre.toUpperCase()}` : ""}</Text></View></View>
        <View style={styles.play}><Ionicons name="play" size={19} color={colors.bg} /></View>
      </Pressable>)}
      {!visible.length && <View style={styles.empty}><Ionicons name="musical-notes-outline" size={42} color={colors.cyan} /><Text style={styles.emptyTitle}>{tab === "treesh" ? "Loading catalog…" : "No songs yet"}</Text><Text style={styles.emptyCopy}>{tab === "treesh" ? "Fetching the full Treesh library." : "Import an audio file to build your first chart."}</Text></View>}
      <View style={{ height: 96 }} />
    </ScrollView>
    <View style={styles.importBar}>
      {importError && <Pressable testID="import-error-banner" onPress={() => setImportError(null)} style={styles.errorBanner}><Ionicons name="alert-circle" size={16} color="#FF4D6D" /><Text style={styles.errorText} numberOfLines={2}>{importError}</Text><Ionicons name="close" size={15} color={colors.muted} /></Pressable>}
      <NeonButton testID="import-audio-button" label="Import audio from device" icon="add" onPress={doImport} />
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, chrome: { height: 114, backgroundColor: "rgba(10,10,12,0.96)", borderBottomWidth: 1, borderBottomColor: colors.border }, search: { height: 46, marginHorizontal: 16, marginTop: 6, borderRadius: 15, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.panel }, input: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.body },
  chipRow: { height: 56 }, chips: { gap: 8, paddingHorizontal: 16, alignItems: "center" }, chip: { flexShrink: 0, height: 36, justifyContent: "center", paddingHorizontal: 15, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel }, chipActive: { backgroundColor: "rgba(147,40,255,0.13)", borderColor: colors.cyan }, chipText: { color: colors.muted, fontSize: 12, fontFamily: fonts.bold }, chipTextActive: { color: colors.cyan },
  list: { flex: 1 }, content: { padding: 16, gap: 12 }, sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 5 }, eyebrow: { color: colors.cyan, fontSize: 9, letterSpacing: 1.5, fontFamily: fonts.heavy }, heading: { color: colors.text, fontSize: 24, fontFamily: fonts.display, marginTop: 4 }, count: { color: colors.muted, fontSize: 12, fontFamily: fonts.body },
  card: { minHeight: 92, flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 20, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] }, cover: { width: 70, height: 70, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: colors.bg }, coverImg: { width: "100%", height: "100%" }, disc: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }, meta: { flex: 1, paddingHorizontal: 13 }, songTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.heavy }, artist: { color: colors.muted, marginTop: 3, fontSize: 12, fontFamily: fonts.body }, badge: { alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.06)" }, badgeText: { color: colors.cyan, fontSize: 8, fontFamily: fonts.heavy, letterSpacing: 0.7 }, play: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.lime, alignItems: "center", justifyContent: "center" },
  empty: { paddingVertical: 70, alignItems: "center" }, emptyTitle: { color: colors.text, fontSize: 20, fontFamily: fonts.display, marginTop: 14 }, emptyCopy: { color: colors.muted, marginTop: 7, fontFamily: fonts.body, textAlign: "center" }, importBar: { position: "absolute", left: 16, right: 16, bottom: 12, gap: 8 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 14, backgroundColor: "rgba(255,77,109,0.12)", borderWidth: 1, borderColor: "rgba(255,77,109,0.4)" }, errorText: { flex: 1, color: colors.text, fontSize: 12, fontFamily: fonts.bold },
});
