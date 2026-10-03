import { useLayout } from "@/src/hooks/useLayout";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, NeonButton, SongCover } from "@/src/components/ui";
import { ShareCodeModal } from "@/src/components/ShareCodeModal";
import { ImportCodeModal } from "@/src/components/ImportCodeModal";
import { useAppState } from "@/src/game/AppState";
import { encodeChartCode } from "@/src/game/shareCode";
import { colors, fonts, neonGlow, textGlow } from "@/src/game/theme";
import { CROWN_COLOR, GRADE_COLOR, masteryFor } from "@/src/game/progression";
import { Song } from "@/src/game/types";

export default function LibraryScreen() {
  const { desktop } = useLayout();
  const { songs, treeshSongs, charts, scores, selectSong, setDifficulty, importSong, renameSong, deleteSong, deleteChart, exportChart, importChart, importChartFromCode, mineSongs, refreshLibrary, refreshing } = useAppState();
  const forEditor = useLocalSearchParams<{ pick?: string }>().pick === "editor";
  const [tab, setTab] = useState<"treesh" | "device" | "customs">("treesh");
  const [query, setQuery] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [menu, setMenu] = useState<Song | null>(null);
  const [renameText, setRenameText] = useState("");
  const [artistText, setArtistText] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [importCodeOpen, setImportCodeOpen] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareTitle, setShareTitle] = useState("");

  const customSongs = useMemo(() => songs.filter(s => charts[`${s.id}-Custom`]), [songs, charts]);
  const deviceSongs = useMemo(() => { const seen = new Set<string>(); return [...songs, ...mineSongs].filter(s => (s.source === "device" || s.source === "built-in") && !seen.has(s.id) && seen.add(s.id)); }, [songs, mineSongs]);
  const source = tab === "treesh" ? treeshSongs : tab === "device" ? deviceSongs : customSongs;
  const visible = useMemo(() => source.filter(song => `${song.title} ${song.artist}`.toLowerCase().includes(query.toLowerCase())), [source, query]);
  const choose = (song: Song) => { selectSong(song); if (forEditor) { router.replace("/editor"); return; } if (tab === "customs") { setDifficulty("Custom"); router.push("/game"); } else router.push("/analysis"); };
  const doImport = async () => { setImportError(null); try { const song = await importSong(); if (song) { selectSong(song); router.replace(forEditor ? "/editor" : "/analysis"); } } catch (error) { setImportError(error instanceof Error ? error.message : "Import failed. Try another file."); } };
  const doImportChart = async () => { setImportError(null); try { const chart = await importChart(); if (chart) setTab("customs"); } catch (error) { setImportError(error instanceof Error ? error.message : "Couldn't import that chart."); } };
  const openMenu = (song: Song) => { setRenameText(song.title); setArtistText(song.artist); setMenu(song); };
  const doRename = async () => { if (menu) await renameSong(menu.id, renameText, artistText); setMenu(null); };
  const doDelete = async () => { if (menu) await deleteSong(menu.id); setMenu(null); };
  const doExport = async () => { if (menu && charts[`${menu.id}-Custom`]) await exportChart(charts[`${menu.id}-Custom`], menu); setMenu(null); };
  const doShareCode = () => { if (menu && charts[`${menu.id}-Custom`]) { setShareTitle(menu.title); setShareCode(encodeChartCode(charts[`${menu.id}-Custom`], menu)); } setMenu(null); };
  const doImportCode = async (code: string) => { try { const chart = await importChartFromCode(code); if (chart) { setTab("customs"); return true; } return false; } catch { return false; } };
  const togglePick = (id: string) => setPicked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const deletePicked = async () => { for (const id of picked) await deleteChart(`${id}-Custom`); setPicked(new Set()); setSelectMode(false); };
  const onCardPress = (song: Song) => { if (tab === "customs" && selectMode) togglePick(song.id); else choose(song); };

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}><ScreenHeader title="Song Library" />
    <View style={[styles.chrome, desktop && styles.chromeWide]}>
      <View style={styles.searchRow}>
        <View style={styles.search}><Ionicons name="search" size={18} color={colors.cyan} /><TextInput testID="library-search-input" value={query} onChangeText={setQuery} placeholder="Search songs or artists" placeholderTextColor="#6D6F78" style={styles.input} /></View>
        <Pressable testID="library-refresh-button" onPress={() => refreshLibrary()} disabled={refreshing} hitSlop={6} style={styles.refreshBtn}>{refreshing ? <ActivityIndicator size="small" color={colors.cyan} /> : <Ionicons name="refresh" size={19} color={colors.cyan} />}</Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chips}>
        <Pressable testID="treesh-library-chip" onPress={() => setTab("treesh")} style={[styles.chip, tab === "treesh" && styles.chipActive]}><Text style={[styles.chipText, tab === "treesh" && styles.chipTextActive]}>Treesh Music</Text></Pressable>
        <Pressable testID="device-library-chip" onPress={() => setTab("device")} style={[styles.chip, tab === "device" && styles.chipActive]}><Text style={[styles.chipText, tab === "device" && styles.chipTextActive]}>On this device</Text></Pressable>
        <Pressable testID="customs-library-chip" onPress={() => setTab("customs")} style={[styles.chip, tab === "customs" && styles.chipActive]}><Text style={[styles.chipText, tab === "customs" && styles.chipTextActive]}>Customs</Text></Pressable>
      </ScrollView>
    </View>
    <ScrollView style={styles.list} contentContainerStyle={[styles.content, desktop && styles.grid]} showsVerticalScrollIndicator={false}>
      <View style={[styles.sectionRow, { width: "100%" }]}>
        <View><Text style={styles.eyebrow}>{tab === "treesh" ? "FULL CATALOG" : tab === "customs" ? "YOUR CHARTS" : "PRIVATE LIBRARY"}</Text><Text style={styles.heading}>{tab === "treesh" ? "Treesh Music" : tab === "customs" ? "Custom charts" : "Your imports"}</Text></View>
        {tab === "customs" && customSongs.length > 0 ? <Pressable testID="customs-select-toggle" onPress={() => { setSelectMode(m => !m); setPicked(new Set()); }} style={styles.selectBtn}><Text style={styles.selectBtnText}>{selectMode ? "Cancel" : "Select"}</Text></Pressable> : <Text style={styles.count}>{visible.length} songs</Text>}
      </View>
      {visible.map((song) => { const picking = tab === "customs" && selectMode; const isPicked = picked.has(song.id); return <Pressable key={song.id} testID={`song-card-${song.id}`} onPress={() => onCardPress(song)} style={({ pressed }) => [styles.card, desktop && styles.gridCard, pressed && styles.pressed, isPicked && styles.cardPicked]}>
        {picking && <View style={[styles.check, isPicked && styles.checkOn]}>{isPicked && <Ionicons name="checkmark" size={16} color={colors.bg} />}</View>}
        <View style={[styles.cover, { borderColor: `${song.accent}55` }]}>
          <SongCover coverArt={song.coverArt} accent={song.accent} seed={song.id} label={song.title} iconSize={22} style={styles.coverImg} testID={`song-cover-${song.id}`} />
        </View>
        <View style={styles.meta}><Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text><Text style={styles.artist} numberOfLines={1}>{song.artist}</Text><View style={styles.badge}><Text style={styles.badgeText}>{tab === "customs" ? "CUSTOM CHART" : song.source === "treesh" ? "TREESH" : song.source === "built-in" ? "WARMUP" : song.id.startsWith("treesh-mine-") ? "MY MUSIC" : "LOCAL"}{song.genre && !song.id.startsWith("treesh-mine-") ? ` · ${song.genre.toUpperCase()}` : ""}</Text></View></View>
        {!picking && !song.id.startsWith("treesh-mine-") && (song.source === "device" || song.source === "built-in" || tab === "customs") && <Pressable testID={`song-menu-${song.id}`} onPress={() => openMenu(song)} hitSlop={8} style={styles.menuBtn}><Ionicons name="ellipsis-vertical" size={18} color={colors.muted} /></Pressable>}
        {!picking && (() => { const m = masteryFor(scores, song.id); return m.grade ? <View testID={`song-mastery-${song.id}`} style={styles.mastery}><Text style={[styles.masteryGrade, { color: GRADE_COLOR[m.grade] }]}>{m.grade}</Text><Ionicons name="ribbon" size={13} color={CROWN_COLOR[m.crown]} /></View> : null; })()}
        {!picking && <View style={styles.play}><Ionicons name="play" size={19} color="#001018" /></View>}
      </Pressable>; })}
      {!visible.length && <View style={[styles.empty, { width: "100%" }]}><Ionicons name={tab === "customs" ? "construct-outline" : "musical-notes-outline"} size={42} color={colors.cyan} /><Text style={styles.emptyTitle}>{tab === "treesh" ? "Loading catalog…" : tab === "customs" ? "No custom charts yet" : "No songs yet"}</Text><Text style={styles.emptyCopy}>{tab === "treesh" ? "Fetching the full Treesh library." : tab === "customs" ? "Build one in the Editor, or import a chart file below." : "Import an audio file to build your first chart."}</Text></View>}
      <View style={{ height: 110, width: "100%" }} />
    </ScrollView>

    <View style={styles.importBar}>
      {importError && <Pressable testID="import-error-banner" onPress={() => setImportError(null)} style={styles.errorBanner}><Ionicons name="alert-circle" size={16} color="#FF4D6D" /><Text style={styles.errorText} numberOfLines={2}>{importError}</Text><Ionicons name="close" size={15} color={colors.muted} /></Pressable>}
      {tab === "customs" && selectMode ? <NeonButton testID="delete-selected-charts" label={`Delete ${picked.size} selected`} icon="trash" variant="danger" onPress={deletePicked} />
        : tab === "customs" ? <>
            <NeonButton testID="import-code-button" label="Import from code" icon="link" onPress={() => setImportCodeOpen(true)} />
            <NeonButton testID="import-chart-button" label="Import chart file" icon="download" variant="secondary" onPress={doImportChart} />
          </>
        : <NeonButton testID="import-audio-button" label="Import audio from device" icon="add" onPress={doImport} />}
    </View>

    <ImportCodeModal visible={importCodeOpen} onClose={() => setImportCodeOpen(false)} onImport={doImportCode} />
    <ShareCodeModal visible={!!shareCode} code={shareCode || ""} title={shareTitle} onClose={() => setShareCode(null)} />

    <Modal visible={!!menu} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
      <Pressable style={styles.modalBg} onPress={() => setMenu(null)}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetEyebrow}>MANAGE SONG</Text>
          <TextInput testID="song-rename-input" value={renameText} onChangeText={setRenameText} placeholder="Song name" placeholderTextColor="#6D6F78" style={styles.sheetInput} />
          <TextInput testID="song-artist-input" value={artistText} onChangeText={setArtistText} placeholder="Artist name" placeholderTextColor="#6D6F78" style={styles.sheetInput} />
          <NeonButton testID="song-rename-save" label="Save changes" icon="checkmark" onPress={doRename} />
          {menu && charts[`${menu.id}-Custom`] && <NeonButton testID="song-share-code" label="Share chart code" icon="share-social" variant="secondary" onPress={doShareCode} />}
          {menu && charts[`${menu.id}-Custom`] && <NeonButton testID="song-export-chart" label="Export custom chart" icon="download-outline" variant="secondary" onPress={doExport} />}
          <NeonButton testID="song-delete" label={menu?.source === "built-in" ? "Hide Voco Warmup" : "Delete song"} icon="trash" variant="danger" onPress={doDelete} />
          <Pressable testID="song-menu-close" onPress={() => setMenu(null)} style={styles.sheetCancel}><Text style={styles.sheetCancelText}>Cancel</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  chromeWide: { backgroundColor: "transparent", borderBottomWidth: 0 },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: 12 }, gridCard: { width: "49.2%" },
  safe: { flex: 1, backgroundColor: "transparent" }, chrome: { height: 114, backgroundColor: "rgba(6,5,26,0.7)", borderBottomWidth: 1, borderBottomColor: colors.border }, searchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 6 }, search: { flex: 1, height: 46, borderRadius: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.panel, borderWidth: 1, borderColor: "rgba(0,229,255,0.35)" }, refreshBtn: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, input: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.body },
  chipRow: { height: 56 }, chips: { gap: 8, paddingHorizontal: 16, alignItems: "center" }, chip: { flexShrink: 0, height: 36, justifyContent: "center", paddingHorizontal: 15, borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel }, chipActive: { backgroundColor: "rgba(0,229,255,0.14)", borderColor: colors.cyan, ...neonGlow(colors.cyan, 10, 0.45) }, chipText: { color: colors.muted, fontSize: 10, fontFamily: fonts.arcade, letterSpacing: 1 }, chipTextActive: { color: colors.cyan },
  list: { flex: 1 }, content: { padding: 16, gap: 12 }, sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 5 }, eyebrow: { color: colors.cyan, fontSize: 9, letterSpacing: 2, fontFamily: fonts.arcade }, heading: { color: colors.text, fontSize: 20, fontFamily: fonts.arcadeBlack, marginTop: 4, letterSpacing: 0.5, ...textGlow(colors.pink, 12) }, count: { color: colors.muted, fontSize: 12, fontFamily: fonts.body },
  card: { minHeight: 88, flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 14, backgroundColor: "rgba(14,11,38,0.82)", borderWidth: 1, borderColor: colors.border }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] }, cover: { width: 66, height: 66, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: colors.bg }, coverImg: { width: "100%", height: "100%" }, disc: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }, meta: { flex: 1, paddingHorizontal: 13 }, songTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.heavy }, artist: { color: colors.muted, marginTop: 3, fontSize: 12, fontFamily: fonts.body }, badge: { alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: "rgba(0,229,255,0.3)", backgroundColor: "rgba(0,229,255,0.06)" }, badgeText: { color: colors.cyan, fontSize: 8, fontFamily: fonts.heavy, letterSpacing: 0.7 }, play: { width: 42, height: 42, borderRadius: 10, backgroundColor: colors.cyan, alignItems: "center", justifyContent: "center", ...neonGlow(colors.cyan, 10, 0.6) },
  mastery: { alignItems: "center", marginRight: 10, gap: 1 }, masteryGrade: { fontSize: 18, fontFamily: fonts.arcadeBlack },
  empty: { paddingVertical: 70, alignItems: "center" }, emptyTitle: { color: colors.text, fontSize: 20, fontFamily: fonts.display, marginTop: 14 }, emptyCopy: { color: colors.muted, marginTop: 7, fontFamily: fonts.body, textAlign: "center" }, importBar: { position: "absolute", left: 16, right: 16, bottom: 12, gap: 8 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 14, backgroundColor: "rgba(255,77,109,0.12)", borderWidth: 1, borderColor: "rgba(255,77,109,0.4)" }, errorText: { flex: 1, color: colors.text, fontSize: 12, fontFamily: fonts.bold },
  menuBtn: { width: 34, height: 44, alignItems: "center", justifyContent: "center" },
  selectBtn: { paddingHorizontal: 14, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.cyan }, selectBtnText: { color: colors.cyan, fontSize: 12, fontFamily: fonts.heavy },
  cardPicked: { borderColor: colors.cyan, backgroundColor: "rgba(13,230,210,0.08)" }, check: { width: 24, height: 24, borderRadius: 12, marginLeft: 4, marginRight: 2, borderWidth: 2, borderColor: colors.muted, alignItems: "center", justifyContent: "center" }, checkOn: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center", justifyContent: "flex-end", padding: 16, paddingBottom: 30 },
  sheet: { width: "100%", maxWidth: 440, padding: 20, borderRadius: 18, gap: 12, backgroundColor: "#0E0B26", borderWidth: 1.5, borderColor: "rgba(0,229,255,0.4)" },
  sheetEyebrow: { color: colors.muted, fontSize: 10, letterSpacing: 1.6, fontFamily: fonts.heavy },
  sheetInput: { height: 50, borderRadius: 14, paddingHorizontal: 15, color: colors.text, fontSize: 16, fontFamily: fonts.bold, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  sheetCancel: { height: 46, alignItems: "center", justifyContent: "center" }, sheetCancelText: { color: colors.muted, fontSize: 14, fontFamily: fonts.bold },
});
