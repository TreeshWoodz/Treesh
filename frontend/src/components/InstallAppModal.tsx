import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/src/game/theme";
import { InstallMode, useInstallApp } from "@/src/pwa/install";

const STEPS: Record<Exclude<InstallMode, "prompt">, { icon: keyof typeof Ionicons.glyphMap; text: string }[]> = {
  ios: [
    { icon: "share-outline", text: "Tap the Share button in Safari's toolbar" },
    { icon: "add-circle-outline", text: "Scroll down and tap \u201CAdd to Home Screen\u201D" },
    { icon: "checkmark-circle-outline", text: "Tap Add, then open Vocotap from your Home Screen" },
  ],
  "mac-safari": [
    { icon: "menu-outline", text: "In Safari's menu bar choose File \u2192 Add to Dock" },
    { icon: "checkmark-circle-outline", text: "Click Add, then launch Vocotap from your Dock" },
  ],
  firefox: [
    { icon: "alert-circle-outline", text: "Firefox can't install web apps" },
    { icon: "globe-outline", text: "Open Vocotap in Chrome, Edge or Safari to install it" },
  ],
  "browser-menu": [
    { icon: "download-outline", text: "Click the install icon at the right of the address bar" },
    { icon: "ellipsis-vertical", text: "Or open the browser menu \u2192 \u201CInstall Vocotap\u201D / \u201CAdd to Home screen\u201D" },
  ],
};

// Explains how to install Vocotap as a full-screen app (or fires the native prompt where supported).
export function InstallAppModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { mode, promptInstall } = useInstallApp();
  const install = async () => { await promptInstall(); onClose(); };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View testID="install-app-modal" style={styles.card}>
          <View style={styles.icon}><Ionicons name="phone-portrait" size={26} color={colors.cyan} /></View>
          <Text selectable={false} style={styles.title}>Install Vocotap</Text>
          <Text selectable={false} style={styles.copy}>Play full-screen with no browser bars, straight from your Home Screen or desktop.</Text>
          {mode === "prompt" ? (
            <Pressable testID="install-app-confirm" onPress={install} style={styles.primary}><Ionicons name="download" size={17} color={colors.bg} /><Text selectable={false} style={styles.primaryText}>Install now</Text></Pressable>
          ) : (
            <View testID={`install-steps-${mode}`} style={styles.steps}>
              {STEPS[mode].map((s, i) => (
                <View key={i} style={styles.step}>
                  <View style={styles.stepNum}><Text selectable={false} style={styles.stepNumText}>{i + 1}</Text></View>
                  <Ionicons name={s.icon} size={18} color={colors.cyan} />
                  <Text selectable={false} style={styles.stepText}>{s.text}</Text>
                </View>
              ))}
            </View>
          )}
          <Pressable testID="install-app-close" onPress={onClose} style={styles.secondary}><Text selectable={false} style={styles.secondaryText}>{mode === "prompt" ? "Not now" : "Got it"}</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(6,5,26,0.85)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 380, borderRadius: 24, padding: 22, alignItems: "center", backgroundColor: colors.bg1, borderWidth: 1, borderColor: "rgba(0,229,255,0.35)" },
  icon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,229,255,0.1)", borderWidth: 1, borderColor: "rgba(0,229,255,0.4)", marginBottom: 14 },
  title: { color: colors.text, fontSize: 20, fontFamily: fonts.display, textAlign: "center" },
  copy: { color: colors.muted, fontSize: 14, lineHeight: 20, fontFamily: fonts.body, textAlign: "center", marginTop: 8 },
  steps: { alignSelf: "stretch", gap: 10, marginTop: 18 },
  step: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan },
  stepNumText: { color: colors.bg, fontSize: 11, fontFamily: fonts.heavy },
  stepText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18, fontFamily: fonts.bold },
  primary: { alignSelf: "stretch", height: 50, borderRadius: 16, marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.cyan },
  primaryText: { color: colors.bg, fontSize: 15, fontFamily: fonts.heavy },
  secondary: { alignSelf: "stretch", height: 46, borderRadius: 16, marginTop: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  secondaryText: { color: colors.muted, fontSize: 14, fontFamily: fonts.heavy },
});
