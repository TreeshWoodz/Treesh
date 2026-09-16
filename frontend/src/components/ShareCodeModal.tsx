import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/src/game/theme";

// Shows a shareable chart code with Copy + native Share-sheet actions (fully offline).
export function ShareCodeModal({ visible, code, title, onClose }: { visible: boolean; code: string; title: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await Clipboard.setStringAsync(code); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  const share = async () => {
    try { await Share.share({ message: `Play my Vocotap chart "${title}"! Paste this code in the app (Library → Customs → Import from code):\n\n${code}` }); } catch {}
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.bg} onPress={onClose}>
      <Pressable style={styles.card} onPress={() => {}}>
        <View style={styles.iconWrap}><Ionicons name="share-social" size={24} color={colors.purple} /></View>
        <Text style={styles.title}>Share this chart</Text>
        <Text style={styles.sub}>Send this code to a friend — they paste it into Library → Customs → Import from code.</Text>
        <ScrollView style={styles.codeBox} contentContainerStyle={{ padding: 12 }}><Text testID="share-code-text" selectable style={styles.code}>{code}</Text></ScrollView>
        <Pressable testID="share-code-copy" onPress={copy} style={[styles.btn, styles.btnPrimary]}><Ionicons name={copied ? "checkmark" : "copy"} size={17} color={colors.bg} /><Text style={styles.btnPrimaryText}>{copied ? "Copied!" : "Copy code"}</Text></Pressable>
        <Pressable testID="share-code-share" onPress={share} style={[styles.btn, styles.btnSecondary]}><Ionicons name="share-outline" size={17} color={colors.text} /><Text style={styles.btnSecondaryText}>Share via…</Text></Pressable>
        <Pressable testID="share-code-close" onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Done</Text></Pressable>
      </Pressable>
    </Pressable>
  </Modal>;
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", alignItems: "center", justifyContent: "center", padding: 22 },
  card: { width: "100%", maxWidth: 400, borderRadius: 24, padding: 22, gap: 12, backgroundColor: "#141018", borderWidth: 1, borderColor: "rgba(142,124,255,0.4)", alignItems: "stretch" },
  iconWrap: { alignSelf: "center", width: 56, height: 56, borderRadius: 18, backgroundColor: "rgba(142,124,255,0.14)", borderWidth: 1, borderColor: "rgba(142,124,255,0.4)", alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontSize: 21, fontFamily: fonts.display, textAlign: "center" },
  sub: { color: colors.muted, fontSize: 13, lineHeight: 19, fontFamily: fonts.body, textAlign: "center" },
  codeBox: { maxHeight: 130, borderRadius: 14, backgroundColor: "#0B0910", borderWidth: 1, borderColor: colors.border },
  code: { color: colors.cyan, fontSize: 12, fontFamily: fonts.body, lineHeight: 17 },
  btn: { height: 50, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnPrimary: { backgroundColor: colors.purple }, btnPrimaryText: { color: colors.bg, fontFamily: fonts.heavy, fontSize: 15 },
  btnSecondary: { backgroundColor: colors.panelStrong, borderWidth: 1, borderColor: colors.border }, btnSecondaryText: { color: colors.text, fontFamily: fonts.heavy, fontSize: 15 },
  cancel: { height: 44, alignItems: "center", justifyContent: "center" }, cancelText: { color: colors.muted, fontFamily: fonts.bold, fontSize: 14 },
});
