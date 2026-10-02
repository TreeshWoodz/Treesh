import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { HighwayScene } from "@/src/components/HighwayScene";
import { alpha, colors } from "@/src/game/theme";

// Studio-style backdrop: the song's cover art as a soft, statically blurred wash behind the highway,
// darkened by a vertical scrim + side vignette so notes always stay legible. No spinning disc.
export const Backdrop = React.memo(function Backdrop({ coverArt, accent, grayscale, theme, w, h, horizon }: { coverArt?: string | number; accent: string; grayscale: boolean; theme: string; w: number; h: number; horizon: number }) {
  const scene = theme !== "classic";
  const src = coverArt ? (typeof coverArt === "number" ? coverArt : { uri: coverArt }) : null;
  return (
    <View testID={`gameplay-theme-${theme}`} style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}>
      {scene && <HighwayScene theme={theme} w={w} h={h} horizon={horizon} />}
      {src && <Image testID="gameplay-cover-backdrop" source={src} blurRadius={scene ? 28 : 22} style={[styles.cover, { opacity: grayscale ? 0.1 : scene ? 0.14 : 0.42 }]} resizeMode="cover" />}
      {!scene && <LinearGradient pointerEvents="none" colors={[alpha(accent, 0.16), alpha(accent, 0)]} style={[styles.wash, { height: horizon * 1.6 }]} />}
      <LinearGradient pointerEvents="none" colors={scene ? ["rgba(6,5,26,0.05)", "rgba(6,5,26,0.35)", "rgba(6,5,26,0.88)", colors.bg] : ["rgba(6,5,26,0.3)", "rgba(6,5,26,0.58)", "rgba(6,5,26,0.92)", colors.bg]} locations={[0, 0.42, 0.8, 1]} style={StyleSheet.absoluteFill} />
      <LinearGradient pointerEvents="none" start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} colors={["rgba(6,5,26,0.75)", "rgba(6,5,26,0)", "rgba(6,5,26,0)", "rgba(6,5,26,0.75)"]} locations={[0, 0.2, 0.8, 1]} style={StyleSheet.absoluteFill} />
    </View>
  );
});

const styles = StyleSheet.create({
  cover: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", transform: [{ scale: 1.18 }] },
  wash: { position: "absolute", top: 0, left: 0, right: 0 },
});
