import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import { HighwayScene } from "@/src/components/HighwayScene";
import { alpha, neonGlow } from "@/src/game/theme";

// The song's cover art spins as a glowing "sun" disc behind the far end of the highway.
function CoverDisc({ coverArt, accent, cx, cy, r }: { coverArt: string | number; accent: string; cx: number; cy: number; r: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  const glowA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: true }));
    const b = Animated.loop(Animated.sequence([Animated.timing(glowA, { toValue: 1, duration: 1600, useNativeDriver: true }), Animated.timing(glowA, { toValue: 0, duration: 1600, useNativeDriver: true })]));
    a.start(); b.start(); return () => { a.stop(); b.stop(); };
  }, [spin, glowA]);
  return <View testID="gameplay-cover-disc" pointerEvents="none" style={{ position: "absolute", left: cx - r * 1.6, top: cy - r * 1.6, width: r * 3.2, height: r * 3.2, alignItems: "center", justifyContent: "center" }}>
    <Animated.View style={{ position: "absolute", width: r * 3.2, height: r * 3.2, borderRadius: r * 1.6, backgroundColor: accent, opacity: glowA.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.22] }) }} />
    <View style={{ position: "absolute", width: r * 2.4, height: r * 2.4, borderRadius: r * 1.2, borderWidth: 2, borderColor: alpha(accent, 0.6) }} />
    <Animated.View style={{ width: r * 2, height: r * 2, borderRadius: r, overflow: "hidden", borderWidth: 3, borderColor: "#FFFFFF", ...neonGlow(accent, 24, 0.9), transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }}>
      <Image source={typeof coverArt === "number" ? coverArt : { uri: coverArt }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      <View style={{ position: "absolute", left: r - 7, top: r - 7, width: 14, height: 14, borderRadius: 7, backgroundColor: "#06051A", borderWidth: 2, borderColor: "rgba(255,255,255,0.7)" }} />
    </Animated.View>
  </View>;
}

export const Backdrop = React.memo(function Backdrop({ coverArt, accent, grayscale, theme, w, h, horizon, disc }: { coverArt?: string | number; accent: string; grayscale: boolean; theme: string; w: number; h: number; horizon: number; disc: { cx: number; cy: number; r: number } }) {
  const scene = theme !== "classic";
  const src = coverArt ? (typeof coverArt === "number" ? coverArt : { uri: coverArt }) : null;
  return (
    <View testID={`gameplay-theme-${theme}`} style={[StyleSheet.absoluteFill, { backgroundColor: "#06051A" }]}>
      {scene ? <HighwayScene theme={theme} w={w} h={h} horizon={horizon} /> : src ? <Image testID="gameplay-cover-backdrop" source={src} blurRadius={18} style={[styles.cover, { opacity: grayscale ? 0.18 : 0.55 }]} resizeMode="cover" /> : null}
      {scene && src && <Image source={src} blurRadius={24} style={[styles.cover, { opacity: 0.16 }]} resizeMode="cover" />}
      <LinearGradient colors={scene ? ["rgba(6,5,26,0.15)", "rgba(6,5,26,0.35)", "rgba(6,5,26,0.85)"] : [alpha(accent, 0.18), "rgba(6,5,26,0.7)", "#06051A"]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {coverArt && !grayscale && <CoverDisc coverArt={coverArt} accent={accent} cx={disc.cx} cy={disc.cy} r={disc.r} />}
    </View>
  );
});

const styles = StyleSheet.create({
  cover: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", opacity: 0.5, transform: [{ scale: 1.2 }] },
});
