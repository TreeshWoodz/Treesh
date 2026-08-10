import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "@/src/game/theme";
import { useStarlites } from "@/src/game/starlites";

export function ScreenHeader({ title, back = true, right }: { title: string; back?: boolean; right?: React.ReactNode }) {
  const { stars } = useStarlites();
  return <View style={styles.header} testID="screen-header">
    <View style={styles.headerSide}>{back && <Pressable testID="header-back-button" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>}</View>
    <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
    <View style={[styles.headerSide, styles.headerRight]}>{right || <View style={styles.stars}><Ionicons name="sparkles" size={15} color={colors.gold} /><Text style={styles.starText} testID="starlites-balance">{stars.points.toLocaleString()}</Text></View>}</View>
  </View>;
}

export function GlassCard({ children, style, testID }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[]; testID?: string }) {
  return <View testID={testID} style={[styles.card, style]}>{children}</View>;
}

export function NeonButton({ label, onPress, icon = "play", variant = "primary", disabled, loading, testID }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; variant?: "primary" | "secondary" | "danger"; disabled?: boolean; loading?: boolean; testID: string }) {
  const handle = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); };
  return <Pressable testID={testID} disabled={disabled || loading} onPress={handle} style={({ pressed }) => [styles.button, variant === "secondary" && styles.secondary, variant === "danger" && styles.danger, (disabled || loading) && styles.disabled, pressed && styles.buttonPressed]}>
    {loading ? <ActivityIndicator color={variant === "primary" ? colors.bg : colors.text} /> : <><Ionicons name={icon} size={19} color={variant === "primary" ? colors.bg : colors.text} /><Text style={[styles.buttonText, variant === "primary" && styles.primaryText]}>{label}</Text></>}
  </Pressable>;
}

const styles = StyleSheet.create({
  header: { height: 58, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(10,10,12,0.94)", borderBottomWidth: 1, borderBottomColor: colors.border },
  headerSide: { width: 94, flexDirection: "row", alignItems: "center" }, headerRight: { justifyContent: "flex-end" },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: "800", letterSpacing: 0.5, flex: 1, textAlign: "center" },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" }, pressed: { opacity: 0.6 },
  stars: { minHeight: 36, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 18, backgroundColor: "rgba(255,216,77,0.10)", borderWidth: 1, borderColor: "rgba(255,216,77,0.25)" }, starText: { color: colors.gold, fontSize: 13, fontWeight: "900" },
  card: { backgroundColor: "rgba(21,21,24,0.88)", borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, overflow: "hidden" },
  button: { minHeight: 54, borderRadius: 27, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.cyan },
  secondary: { backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }, danger: { backgroundColor: "rgba(255,0,85,0.16)", borderWidth: 1, borderColor: colors.pink },
  buttonText: { color: colors.text, fontSize: 15, fontWeight: "900", letterSpacing: 0.4 }, primaryText: { color: colors.bg }, buttonPressed: { transform: [{ scale: 0.97 }], opacity: 0.86 }, disabled: { opacity: 0.4 },
});
