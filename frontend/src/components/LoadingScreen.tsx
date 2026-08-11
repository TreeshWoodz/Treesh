import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from "react-native";
import { colors, fonts, laneColors, rgba } from "@/src/game/theme";

const logo = require("../../assets/images/vocotap-logo.png");
const BARS = 7;

// Animated cold-start screen: neon logo reveal + music-equalizer bars + a filling
// progress bar. Pure RN Animated (native-driver where possible), auto-dismisses.
export function LoadingScreen({ onFinish }: { onFinish: () => void }) {
  const { width } = useWindowDimensions();
  const logoIn = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const bars = useRef(Array.from({ length: BARS }, () => new Animated.Value(0.25))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoIn, { toValue: 1, friction: 7, tension: 46, useNativeDriver: true }),
        Animated.timing(progress, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      ]),
      Animated.delay(180),
    ]).start(({ finished }) => finished && onFinish());

    Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();

    const loops = bars.map((b, i) => {
      const anim = Animated.loop(Animated.sequence([
        Animated.timing(b, { toValue: 1, duration: 320 + i * 40, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(b, { toValue: 0.25, duration: 300 + i * 30, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]));
      setTimeout(() => anim.start(), i * 90);
      return anim;
    });
    return () => loops.forEach(l => l.stop());
  }, [logoIn, progress, float, glow, bars, onFinish]);

  const logoW = Math.min(width * 0.86, 380);

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0C0A14", "#08080A", "#060509"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />

      <View style={styles.center}>
        {/* pulsing glow halo */}
        <Animated.View pointerEvents="none" style={[styles.halo, { width: logoW * 1.3, height: logoW * 1.3, opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] }), transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }] }]}>
          <LinearGradient colors={[rgba(0.7), "transparent"]} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.Image
          source={logo}
          resizeMode="contain"
          style={[styles.logo, {
            width: logoW, height: logoW * 0.48,
            opacity: logoIn,
            transform: [
              { scale: logoIn.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
              { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] }) },
            ],
          }]}
        />

        {/* equalizer bars */}
        <View style={styles.bars}>
          {bars.map((b, i) => (
            <Animated.View key={i} style={[styles.bar, {
              backgroundColor: laneColors[i % laneColors.length],
              transform: [{ scaleY: b }],
            }]} />
          ))}
        </View>

        {/* progress track */}
        <View style={styles.track}>
          <Animated.View style={[styles.fillWrap, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ["4%", "100%"] }) }]}>
            <LinearGradient colors={["#FF4D8D", "#8E7CFF", "#2FE0D6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>
        <Animated.Text style={[styles.caption, { opacity: logoIn }]}>TUNING THE STAGE</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: "#08080A", alignItems: "center", justifyContent: "center", zIndex: 999 },
  center: { alignItems: "center", gap: 26, paddingHorizontal: 24 },
  halo: { position: "absolute", borderRadius: 999, alignSelf: "center", top: -40 },
  logo: {},
  bars: { flexDirection: "row", alignItems: "center", gap: 7, height: 40 },
  bar: { width: 6, height: 40, borderRadius: 3 },
  track: { width: 200, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" },
  fillWrap: { height: 6, borderRadius: 3, overflow: "hidden" },
  caption: { color: colors.muted, fontSize: 11, letterSpacing: 4, fontFamily: fonts.heavy },
});
