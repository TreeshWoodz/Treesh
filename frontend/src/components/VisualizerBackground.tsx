import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import { colors } from "@/src/game/theme";

const bars = Array.from({ length: 18 }, (_, index) => 0.22 + Math.abs(Math.sin(index * 1.7)) * 0.7);

export function VisualizerBackground({ intensity = 1 }: { intensity?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }), Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true })])).start(); }, [pulse]);
  return <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="audio-visualizer-background">
    <Image source={require("../../assets/images/vocotap-bg.jpg")} style={styles.image} resizeMode="cover" />
    <LinearGradient colors={["rgba(10,10,12,0.10)", "rgba(10,10,12,0.58)", colors.bg]} style={StyleSheet.absoluteFill} />
    <View style={styles.bars}>{bars.map((height, index) => <Animated.View key={index} style={[styles.bar, { height: `${Math.min(100, height * 100 * intensity)}%`, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.22 + (index % 3) * 0.08, 0.72] }), transform: [{ scaleY: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.12] }) }] }]} />)}</View>
  </View>;
}

const styles = StyleSheet.create({
  image: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", opacity: 0.52 },
  bars: { position: "absolute", left: 0, right: 0, bottom: 110, height: 120, flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 8 },
  bar: { width: 5, minHeight: 12, borderRadius: 4, backgroundColor: colors.cyan, shadowColor: colors.cyan, shadowRadius: 8, shadowOpacity: 0.9 },
});