import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts } from "@/src/game/theme";

// Paste-a-code importer for shared charts (offline). Calls onImport with the raw code.
export function ImportCodeModal({ visible, onClose, onImport }: { visible: boolean; onClose: () => void; onImport: (code: string) => Promise<boolean> }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const paste = async () => { try { const t = await Clipboard.getStringAsync(); if (t) setCode(t); } catch {} };
  const submit = async () => {
    setError(null); setBusy(true);
    const ok = await onImport(code.trim());
    setBusy(false);
    if (ok) { setCode(""); onClose(); } else setError("That code isn't a valid Vocotap chart.");
  };
  const close = () => { setCode(""); setError(null); onClose(); };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
    <Pressable style={styles.bg} onPress={close}>
      <Pressable style={styles.card} onPress={() => {}}>
        <View style={styles.iconWrap}><Ionicons name="download" size={24} color={colors.cyan} /></View>
        <Text style={styles.title}>Import from code</Text>
        <Text style={styles.sub}>Paste a Vocotap chart code a friend shared with you.</Text>
        <TextInput testID="import-code-input" value={code} onChangeText={setCode} placeholder="VOCO1-…" placeholderTextColor="#6D6F78" multiline style={styles.input} autoCapitalize="none" autoCorrect={false} />
        {error && <View style={styles.errRow}><Ionicons name="alert-circle" size={15} color={colors.pink} /><Text style={styles.errText}>{error}</Text></View>}
        <Pressable testID="import-code-paste" onPress={paste} style={[styles.btn, styles.btnSecondary]}><Ionicons name="clipboard-outline" size={16} color={colors.text} /><Text style={styles.btnSecondaryText}>Paste from clipboard</Text></Pressable>
        <Pressable testID="import-code-submit" onPress={submit} disabled={busy || !code.trim()} style={[styles.btn, styles.btnPrimary, (busy || !code.trim()) && { opacity: 0.5 }]}><Ionicons name="checkmark" size={17} color={colors.bg} /><Text style={styles.btnPrimaryText}>{busy ? "Importing…" : "Import chart"}</Text></Pressable>
        <Pressable testID="import-code-close" onPress={close} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
      </Pressable>
    </Pressable>
  </Modal>;
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", alignItems: "center", justifyContent: "center", padding: 22 },
  card: { width: "100%", maxWidth: 400, borderRadius: 24, padding: 22, gap: 12, backgroundColor: "#101418", borderWidth: 1, borderColor: "rgba(13,230,210,0.35)" },
  iconWrap: { alignSelf: "center", width: 56, height: 56, borderRadius: 18, backgroundColor: "rgba(13,230,210,0.12)", borderWidth: 1, borderColor: "rgba(13,230,210,0.35)", alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontSize: 21, fontFamily: fonts.display, textAlign: "center" },
  sub: { color: colors.muted, fontSize: 13, lineHeight: 19, fontFamily: fonts.body, textAlign: "center" },
  input: { minHeight: 88, borderRadius: 14, padding: 14, color: colors.text, fontSize: 13, fontFamily: fonts.body, backgroundColor: "#0B0E10", borderWidth: 1, borderColor: colors.border, textAlignVertical: "top" },
  errRow: { flexDirection: "row", alignItems: "center", gap: 7 }, errText: { color: colors.pink, fontSize: 12, fontFamily: fonts.bold, flex: 1 },
  btn: { height: 50, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnPrimary: { backgroundColor: colors.cyan }, btnPrimaryText: { color: colors.bg, fontFamily: fonts.heavy, fontSize: 15 },
  btnSecondary: { backgroundColor: colors.panelStrong, borderWidth: 1, borderColor: colors.border }, btnSecondaryText: { color: colors.text, fontFamily: fonts.heavy, fontSize: 14 },
  cancel: { height: 44, alignItems: "center", justifyContent: "center" }, cancelText: { color: colors.muted, fontFamily: fonts.bold, fontSize: 14 },
});
