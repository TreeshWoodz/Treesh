import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from "react-native";
import { colors, fonts, rgba, textGlow } from "@/src/game/theme";
import { NeonBackground } from "@/src/components/ui";

const logo = require("../../assets/images/vocotap-logo.png");

// Cold-start screen: full-bleed cohesive gradient with soft edge-anchored accent
// lighting, a clean logo reveal + gentle float, and a slim progress bar with a
// sweeping shimmer. Auto-dismisses when the bar fills.
export function LoadingScreen({ onFinish }: { onFinish: () => void }) {
  const { width } = useWindowDimensions();
  const intro = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(intro, { toValue: 1, friction: 8, tension: 48, useNativeDriver: true }),
        Animated.timing(progress, { toValue: 1, duration: 2300, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      ]),
      Animated.delay(240),
    ]).start(({ finished }) => finished && onFinish());

    const loops = [
      Animated.loop(Animated.timing(shimmer, { toValue: 1, duration: 1250, easing: Easing.inOut(Easing.ease), useNativeDriver: true })),
      Animated.loop(Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])),
    ];
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [intro, progress, shimmer, float, pulse, onFinish]);

  const logoW = Math.min(width * 0.78, 340);
  const barW = Math.min(width * 0.6, 250);
  const translateY = Animated.add(
    intro.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }),
    float.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] }),
  );

  return (
    <View style={styles.root}>
      {/* base gradient — full screen, edge to edge */}
      <NeonBackground />
      {/* soft accent lighting anchored to corners so it reads as ambient glow, not a blob */}
      <LinearGradient pointerEvents="none" colors={[rgba(0.3), "transparent"]} start={{ x: 0.1, y: 0 }} end={{ x: 0.75, y: 0.55 }} style={StyleSheet.absoluteFill} />
      <LinearGradient pointerEvents="none" colors={["transparent", "rgba(255,77,141,0.14)"]} start={{ x: 0.85, y: 0.55 }} end={{ x: 0.3, y: 1 }} style={StyleSheet.absoluteFill} />

      <View style={styles.center}>
        <Animated.Image
          source={logo}
          resizeMode="contain"
          style={{ width: logoW, height: logoW * 0.48, opacity: intro, transform: [{ translateY }, { scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }] }}
        />

        <Animated.View style={[styles.barBlock, { opacity: intro }]}>
          <View style={[styles.track, { width: barW }]}>
            <Animated.View style={[styles.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ["6%", "100%"] }) }]}>
              <LinearGradient colors={["#FF2D7A", "#B537FF", "#00E5FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Animated.View pointerEvents="none" style={[styles.shimmer, { transform: [{ translateX: shimmer.interpolate({ inputRange: [0, 1], outputRange: [-40, barW + 40] }) }, { rotate: "20deg" }] }]} />
          </View>
          <Animated.Text selectable={false} style={[styles.caption, { opacity: pulse }]}>LOADING STAGE</Animated.Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", zIndex: 999 },
  center: { alignItems: "center", gap: 40, paddingHorizontal: 24, marginTop: -20 },
  barBlock: { alignItems: "center", gap: 16 },
  track: { height: 6, borderWidth: 1, borderColor: "rgba(0,229,255,0.4)", borderRadius: 3, backgroundColor: "rgba(255,255,255,0.09)", overflow: "hidden" },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 3, overflow: "hidden" },
  shimmer: { position: "absolute", top: -8, width: 20, height: 22, backgroundColor: "rgba(255,255,255,0.55)", borderRadius: 6 },
  caption: { color: colors.cyan, fontSize: 11, letterSpacing: 5, fontFamily: fonts.arcade, ...textGlow(colors.cyan, 10) },
});
