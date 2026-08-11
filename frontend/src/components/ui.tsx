import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, fonts, glow, rgba } from "@/src/game/theme";
import { useStarlites } from "@/src/game/starlites";

const GLOSS = ["rgba(255,255,255,0.28)", "rgba(255,255,255,0.06)", "transparent"] as const;

export function ScreenHeader({ title, back = true, right }: { title: string; back?: boolean; right?: React.ReactNode }) {
  const { stars } = useStarlites();
  return <View style={styles.header} testID="screen-header">
    <View style={styles.headerSide}>{back && <Pressable testID="header-back-button" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>}</View>
    <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
    <View style={[styles.headerSide, styles.headerRight]}>{right || <View style={styles.stars}><Ionicons name="sparkles" size={15} color={colors.gold} /><Text style={styles.starText} testID="starlites-balance">{stars.points.toLocaleString()}</Text></View>}</View>
  </View>;
}

export function GlassCard({ children, style, testID }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[]; testID?: string }) {
  return <View testID={testID} style={[styles.card, style]}><LinearGradient pointerEvents="none" colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0.02)", "transparent"]} locations={[0, 0.45, 1]} style={styles.glossCard} />{children}</View>;
}

// Renders cover art, or a branded gradient placeholder (accent wash + music glyph) when a song has none.
export function SongCover({ coverArt, accent, style, iconSize = 34, testID }: { coverArt?: string | number; accent: string; style?: StyleProp<ViewStyle>; iconSize?: number; testID?: string }) {
  if (coverArt) return <Image testID={testID} source={typeof coverArt === "number" ? coverArt : { uri: coverArt }} style={style as StyleProp<ViewStyle>} resizeMode="cover" />;
  return <View testID={testID} style={[style, styles.coverPh]}>
    <LinearGradient colors={[`${accent}66`, "#0B0912", "#08080A"]} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
    <Ionicons name="musical-notes" size={iconSize} color={`${accent}CC`} />
  </View>;
}

export function NeonButton({ label, onPress, icon = "play", variant = "primary", disabled, loading, testID }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; variant?: "primary" | "secondary" | "danger"; disabled?: boolean; loading?: boolean; testID: string }) {
  const handle = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); };
  return <Pressable testID={testID} disabled={disabled || loading} onPress={handle} style={({ pressed }) => [styles.button, variant === "primary" && glow.purple, variant === "secondary" && styles.secondary, variant === "danger" && styles.danger, (disabled || loading) && styles.disabled, pressed && styles.buttonPressed]}>
    <LinearGradient pointerEvents="none" colors={GLOSS} locations={[0, 0.5, 1]} style={styles.glossBtn} />
    {loading ? <ActivityIndicator color={variant === "primary" ? colors.bg : colors.text} /> : <><Ionicons name={icon} size={19} color={variant === "primary" ? colors.bg : colors.text} /><Text style={[styles.buttonText, variant === "primary" && styles.primaryText]}>{label}</Text></>}
  </Pressable>;
}

const styles = StyleSheet.create({
  header: { height: 58, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(10,10,11,0.92)", borderBottomWidth: 1, borderBottomColor: colors.border },
  headerSide: { width: 94, flexDirection: "row", alignItems: "center" }, headerRight: { justifyContent: "flex-end" },
  headerTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.display, letterSpacing: 0.3, flex: 1, textAlign: "center" },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: colors.border }, pressed: { opacity: 0.6 },
  stars: { minHeight: 36, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 18, backgroundColor: rgba(0.12), borderWidth: 1, borderColor: rgba(0.28) }, starText: { color: colors.gold, fontSize: 13, fontFamily: fonts.heavy },
  card: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.38, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 7 },
  coverPh: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  glossCard: { position: "absolute", top: 0, left: 0, right: 0, height: "60%", borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  glossBtn: { position: "absolute", top: 0, left: 0, right: 0, height: "58%", borderTopLeftRadius: 27, borderTopRightRadius: 27 },
  button: { minHeight: 54, borderRadius: 27, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.purple, shadowColor: colors.purple, shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  secondary: { backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } }, danger: { backgroundColor: "rgba(255,77,109,0.16)", borderWidth: 1, borderColor: colors.pink, shadowColor: colors.pink, shadowOpacity: 0.3, shadowRadius: 12 },
  buttonText: { color: colors.text, fontSize: 15, fontFamily: fonts.heavy, letterSpacing: 0.3 }, primaryText: { color: colors.bg }, buttonPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 }, disabled: { opacity: 0.4 },
});
