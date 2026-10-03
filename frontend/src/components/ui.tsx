import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing, Image, Pressable, StyleProp, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from "react-native";
import Svg, { Defs, Line, RadialGradient, Rect, Stop, LinearGradient as SvgLinear } from "react-native-svg";
import { alpha, colors, fonts, neonGlow, textGlow } from "@/src/game/theme";
import { useStarlites } from "@/src/game/starlites";
import { levelInfo, useProgress } from "@/src/game/progression";

const GLOSS = ["rgba(255,255,255,0.28)", "rgba(255,255,255,0.06)", "transparent"] as const;

// Deterministic neon palette per song so every placeholder looks like distinct album art.
const PALETTES = [["#FF2D7A", "#8B5CFF"], ["#00E5FF", "#3A6FF0"], ["#FFD600", "#FF8A00"], ["#B537FF", "#00E5FF"], ["#FF2D7A", "#FFB020"], ["#39FF14", "#00E5FF"], ["#B537FF", "#FF2D7A"], ["#FF8A00", "#B537FF"]];
function seededPalette(seed: string) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

// App-wide synthwave backdrop: glowing orbs + a perspective neon floor grid. Rendered once behind the stack.
export function NeonBackground() {
  const { width: w, height: h } = useWindowDimensions();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.timing(pulse, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })])).start(); }, [pulse]);
  const horizon = h * 0.7; const cx = w / 2;
  const rays = Array.from({ length: 13 }, (_, i) => (i - 6) / 6);
  const rows = [0.04, 0.1, 0.19, 0.31, 0.47, 0.68, 0.95];
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}>
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="orbA" cx="85%" cy="8%" r="60%"><Stop offset="0" stopColor="#B537FF" stopOpacity={0.42} /><Stop offset="1" stopColor="#B537FF" stopOpacity={0} /></RadialGradient>
        <RadialGradient id="orbB" cx="5%" cy="62%" r="55%"><Stop offset="0" stopColor="#00E5FF" stopOpacity={0.22} /><Stop offset="1" stopColor="#00E5FF" stopOpacity={0} /></RadialGradient>
        <SvgLinear id="floor" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FF2D7A" stopOpacity={0.0} /><Stop offset="1" stopColor="#FF2D7A" stopOpacity={0.14} /></SvgLinear>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill="url(#orbA)" />
      <Rect x={0} y={0} width={w} height={h} fill="url(#orbB)" />
      <Rect x={0} y={horizon} width={w} height={h - horizon} fill="url(#floor)" />
      <Line x1={0} y1={horizon} x2={w} y2={horizon} stroke="#FF2D7A" strokeOpacity={0.5} strokeWidth={1.2} />
      {rays.map((r, i) => <Line key={`r${i}`} x1={cx + r * w * 0.18} y1={horizon} x2={cx + r * w * 1.6} y2={h} stroke="#B537FF" strokeOpacity={0.22} strokeWidth={1} />)}
      {rows.map((p, i) => <Line key={`h${i}`} x1={0} y1={horizon + (h - horizon) * p} x2={w} y2={horizon + (h - horizon) * p} stroke="#00E5FF" strokeOpacity={0.08 + p * 0.14} strokeWidth={1} />)}
    </Svg>
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] }) }]}>
      <LinearGradient colors={["transparent", "rgba(255,45,122,0.10)", "transparent"]} locations={[0.45, 0.7, 0.95]} style={StyleSheet.absoluteFill} />
    </Animated.View>
  </View>;
}

export function ScreenHeader({ title, back = true, right }: { title: string; back?: boolean; right?: React.ReactNode }) {
  const { stars } = useStarlites();
  const { width } = useWindowDimensions();
  return <View style={[styles.header, width >= 960 && styles.headerWide]} testID="screen-header">
    <View style={styles.headerLeft}>{back && <Pressable testID="header-back-button" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><Ionicons name="chevron-back" size={22} color={colors.cyan} /></Pressable>}</View>
    <Text style={styles.headerTitle} numberOfLines={1}>{title.toUpperCase()}</Text>
    <View style={styles.headerRight}>{right || <View style={styles.stars}><Ionicons name="sparkles" size={14} color={colors.gold} /><Text style={styles.starText} testID="starlites-balance">{stars.points.toLocaleString()}</Text></View>}</View>
    <LinearGradient pointerEvents="none" colors={["transparent", colors.cyan, colors.pink, "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerLine} />
  </View>;
}

export function GlassCard({ children, style, testID, tint = colors.cyan }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[]; testID?: string; tint?: string }) {
  return <View testID={testID} style={[styles.card, { borderColor: alpha(tint, 0.3) }, style]}>
    <LinearGradient pointerEvents="none" colors={[alpha(tint, 0.12), "transparent"]} locations={[0, 0.6]} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" style={[styles.cardEdge, { backgroundColor: alpha(tint, 0.7) }]} />
    {children}
  </View>;
}

// Player level chip with a mini XP bar (Home/Profile).
export function LevelBadge({ testID = "level-badge", onPress }: { testID?: string; onPress?: () => void }) {
  const p = useProgress(); const info = levelInfo(p.xp);
  return <Pressable testID={testID} onPress={onPress} style={styles.lvl}>
    <View style={styles.lvlHex}><Text style={styles.lvlNum}>{info.level}</Text></View>
    <View style={{ gap: 4 }}>
      <Text style={styles.lvlLabel}>LEVEL {info.level}</Text>
      <View style={styles.lvlTrack}><LinearGradient colors={[colors.cyan, colors.lime]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${Math.max(4, info.frac * 100)}%`, height: "100%" }} /></View>
    </View>
  </Pressable>;
}

// Renders cover art, or a vibrant deterministic gradient placeholder (unique per song) when a song has none.
export function SongCover({ coverArt, accent, style, iconSize = 34, testID, seed, label }: { coverArt?: string | number; accent: string; style?: StyleProp<ViewStyle>; iconSize?: number; testID?: string; seed?: string; label?: string }) {
  if (coverArt) return <Image testID={testID} source={typeof coverArt === "number" ? coverArt : { uri: coverArt }} style={style as StyleProp<ViewStyle>} resizeMode="cover" />;
  const [a, b] = seededPalette(seed || label || accent);
  const initial = (label || "").trim().charAt(0).toUpperCase();
  return <View testID={testID} style={[style, styles.coverPh]}>
    <LinearGradient colors={[a, b, "#0B0912"]} start={{ x: 0.1, y: 0 }} end={{ x: 0.95, y: 1 }} style={StyleSheet.absoluteFill} />
    <LinearGradient pointerEvents="none" colors={GLOSS} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
    {initial ? <Text style={{ fontSize: iconSize * 1.8, lineHeight: iconSize * 2.1, fontFamily: fonts.arcadeBlack, color: "rgba(255,255,255,0.94)", textShadowColor: "rgba(0,0,0,0.35)", textShadowRadius: 8 }}>{initial}</Text> : <Ionicons name="musical-notes" size={iconSize} color="rgba(255,255,255,0.9)" />}
    <Ionicons name="musical-note" size={iconSize * 0.5} color="rgba(255,255,255,0.55)" style={{ position: "absolute", right: iconSize * 0.35, bottom: iconSize * 0.3 }} />
  </View>;
}

export function NeonButton({ label, onPress, icon = "play", variant = "primary", disabled, loading, testID }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; variant?: "primary" | "secondary" | "danger"; disabled?: boolean; loading?: boolean; testID: string }) {
  const handle = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); };
  const tint = variant === "danger" ? colors.pink : colors.cyan;
  const primary = variant === "primary";
  return <Pressable testID={testID} disabled={disabled || loading} onPress={handle} style={({ pressed }) => [styles.button, primary ? neonGlow(colors.cyan, 16, 0.55) : { borderColor: alpha(tint, 0.65), backgroundColor: alpha(tint, 0.07) }, (disabled || loading) && styles.disabled, pressed && styles.buttonPressed]}>
    {primary && <LinearGradient pointerEvents="none" colors={[colors.cyan, "#00A3FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} />}
    {primary && <LinearGradient pointerEvents="none" colors={GLOSS} locations={[0, 0.5, 1]} style={styles.glossBtn} />}
    {loading ? <ActivityIndicator color={primary ? "#000" : colors.text} /> : <><Ionicons name={icon} size={18} color={primary ? "#00121A" : tint} /><Text style={[styles.buttonText, { color: primary ? "#00121A" : tint }]}>{label.toUpperCase()}</Text></>}
  </Pressable>;
}

const styles = StyleSheet.create({
  header: { height: 60, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(6,5,26,0.82)" },
  headerWide: { backgroundColor: "transparent" },
  headerLine: { position: "absolute", left: 0, right: 0, bottom: 0, height: 1.5, opacity: 0.8 },
  headerLeft: { minWidth: 44, flexShrink: 0, flexDirection: "row", alignItems: "center" }, headerRight: { flexShrink: 0, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  headerTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.arcadeBlack, letterSpacing: 2, flex: 1, textAlign: "center", marginHorizontal: 8, ...textGlow(colors.cyan, 10) },
  iconButton: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,229,255,0.08)", borderWidth: 1, borderColor: "rgba(0,229,255,0.4)" }, pressed: { opacity: 0.6 },
  stars: { minHeight: 34, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, backgroundColor: "rgba(255,214,0,0.1)", borderWidth: 1, borderColor: "rgba(255,214,0,0.4)" }, starText: { color: colors.gold, fontSize: 12, fontFamily: fonts.arcade },
  card: { backgroundColor: colors.panel, borderWidth: 1, borderRadius: 16, padding: 16, overflow: "hidden" },
  cardEdge: { position: "absolute", top: 0, left: 18, right: 18, height: 1.5, borderRadius: 1 },
  coverPh: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  glossBtn: { position: "absolute", top: 0, left: 0, right: 0, height: "55%", borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  button: { minHeight: 54, borderRadius: 12, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)" },
  buttonText: { fontSize: 13, fontFamily: fonts.arcadeBlack, letterSpacing: 1.5 }, buttonPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 }, disabled: { opacity: 0.4 },
  lvl: { flexDirection: "row", alignItems: "center", gap: 9 },
  lvlHex: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,229,255,0.12)", borderWidth: 1.5, borderColor: colors.cyan, transform: [{ rotate: "45deg" }], ...neonGlow(colors.cyan, 10, 0.6) },
  lvlNum: { color: colors.text, fontFamily: fonts.arcadeBlack, fontSize: 15, transform: [{ rotate: "-45deg" }] },
  lvlLabel: { color: colors.cyan, fontFamily: fonts.arcadeBlack, fontSize: 10, letterSpacing: 1.5 },
  lvlTrack: { width: 86, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" },
});
