import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import Reanimated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import Svg, { Defs, LinearGradient as SvgLinear, Line, Polygon, RadialGradient, Rect, Stop } from "react-native-svg";
import { laneColors } from "@/src/game/theme";
import { Geo, P_NEAR, laneFrac } from "./geometry";

// ---- Static perspective grid (SVG, rendered once) ----
export const Grid = React.memo(function Grid({ geo, w, h, tint, fever }: { geo: Geo; w: number; h: number; tint: string; fever: boolean }) {
  const topX = (fr: number) => geo.cx + fr * geo.hw * P_NEAR;
  const botX = (fr: number) => geo.cx + fr * geo.hw;
  const edges = [-0.5, -0.25, 0, 0.25, 0.5];
  const poly = `${topX(-0.5)},${geo.topY} ${topX(0.5)},${geo.topY} ${botX(0.5)},${geo.bottomY} ${botX(-0.5)},${geo.bottomY}`;
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy={`${(geo.topY / h) * 100}%`} r="55%">
          <Stop offset="0" stopColor={fever ? "#FFD600" : tint} stopOpacity={fever ? 0.5 : 0.34} />
          <Stop offset="1" stopColor={fever ? "#FFD600" : tint} stopOpacity={0} />
        </RadialGradient>
        <SvgLinear id="lane" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0A0830" stopOpacity={0.35} />
          <Stop offset="1" stopColor={fever ? "#3A1A40" : "#140F48"} stopOpacity={0.78} />
        </SvgLinear>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill="url(#glow)" />
      <Polygon points={poly} fill="url(#lane)" />
      {edges.map((e, i) => { const outer = i === 0 || i === 4; const c = fever ? "#FFD600" : tint; return outer ? <React.Fragment key={i}><Line x1={topX(e)} y1={geo.topY} x2={botX(e)} y2={geo.bottomY + 40} stroke={c} strokeOpacity={0.25} strokeWidth={9} /><Line x1={topX(e)} y1={geo.topY} x2={botX(e)} y2={geo.bottomY + 40} stroke={c} strokeWidth={2.2} /></React.Fragment> : <Line key={i} x1={topX(e)} y1={geo.topY} x2={botX(e)} y2={geo.bottomY + 40} stroke="rgba(160,200,255,0.16)" strokeWidth={1} />; })}
      <Line x1={geo.cx - geo.hw / 2 - 6} y1={geo.bottomY} x2={geo.cx + geo.hw / 2 + 6} y2={geo.bottomY} stroke={fever ? "#FFD600" : tint} strokeOpacity={0.35} strokeWidth={14} />
      <Line x1={geo.cx - geo.hw / 2 - 6} y1={geo.bottomY} x2={geo.cx + geo.hw / 2 + 6} y2={geo.bottomY} stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={2} />
      {[0.4, 0.68, 0.88].map((p, i) => { const y = geo.topY + geo.span * p; const persp = P_NEAR + (1 - P_NEAR) * p; return <Line key={`d${i}`} x1={geo.cx - geo.hw * 0.5 * persp} y1={y} x2={geo.cx + geo.hw * 0.5 * persp} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />; })}
    </Svg>
  );
});

export const Receptors = React.memo(function Receptors({ geo, flash }: { geo: Geo; flash: Animated.Value[] }) {
  const capW = geo.laneW * 0.82;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {laneColors.map((c, l) => {
        const x = geo.cx + laneFrac(l) * geo.hw;
        return (
          <Animated.View key={l} style={[styles.receptor, { width: capW, left: x - capW / 2, top: geo.bottomY - 16, borderColor: c, shadowColor: c, transform: [{ scale: flash[l].interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] }) }] }]}>
            <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: c, opacity: flash[l].interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.95] }) }]} />
            <View style={{ width: capW * 0.34, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.85)" }} />
          </Animated.View>
        );
      })}
    </View>
  );
});

// Hit explosion per lane: expanding ring + light pillar + sparks, all native-driver Animated.
export const LaneBursts = React.memo(function LaneBursts({ geo, burst, sparks }: { geo: Geo; burst: Animated.Value[]; sparks: boolean }) {
  const S = sparks ? 7 : 0;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {burst.map((b, l) => {
      const c = laneColors[l]; const x = geo.cx + laneFrac(l) * geo.hw; const y = geo.bottomY; const R = geo.laneW * 0.5;
      const fade = b.interpolate({ inputRange: [0, 0.08, 1], outputRange: [0, 1, 0] });
      return <React.Fragment key={l}>
        <Animated.View style={{ position: "absolute", left: x - R * 0.55, top: y - R * 3.2, width: R * 1.1, height: R * 3.2, borderRadius: R * 0.55, backgroundColor: c, opacity: b.interpolate({ inputRange: [0, 0.06, 1], outputRange: [0, 0.42, 0] }), transform: [{ translateY: R * 1.6 }, { scaleY: b.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }, { translateY: -R * 1.6 }] }} />
        <Animated.View style={{ position: "absolute", left: x - R, top: y - R, width: R * 2, height: R * 2, borderRadius: R, borderWidth: 3, borderColor: c, opacity: fade, transform: [{ scaleY: 0.5 }, { scale: b.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1.7] }) }] }} />
        {Array.from({ length: S }).map((_, i) => { const ang = -Math.PI / 2 + (i - (S - 1) / 2) * 0.36; const d = R * (1.8 + (i % 3) * 0.5); return <Animated.View key={i} style={{ position: "absolute", left: x - 3, top: y - 3, width: 6, height: 6, borderRadius: 3, backgroundColor: i % 2 ? "#FFFFFF" : c, opacity: fade, transform: [{ translateX: b.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(ang) * d] }) }, { translateY: b.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(ang) * d] }) }, { scale: b.interpolate({ inputRange: [0, 1], outputRange: [1.5, 0.2] }) }] }} />; })}
      </React.Fragment>;
    })}
  </View>;
});

// Beat lines rushing down the highway on every beat (brighter on the bar) — pure UI-thread, fixed pool.
function BeatLine({ k, beat, clock, lookahead, geo, fever }: { k: number; beat: number; clock: SharedValue<number>; lookahead: number; geo: Geo; fever: SharedValue<number> }) {
  const st = useAnimatedStyle(() => {
    const c = clock.value; const idx = Math.ceil(c / beat) + k; const prog = (c - (idx * beat - lookahead)) / lookahead;
    const on = prog >= 0 && prog <= 1; const p = on ? prog : 0;
    const persp = P_NEAR + (1 - P_NEAR) * p; const w = geo.hw * persp;
    const bar = idx % 4 === 0;
    return { opacity: on ? ((bar ? 0.5 : 0.16) + fever.value * 0.3) * Math.min(1, p * 5) : 0, width: w, transform: [{ translateX: geo.cx - w / 2 }, { translateY: geo.topY + geo.span * p }] };
  });
  return <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: -1, height: 2, backgroundColor: "#8FE9FF" }, st]} />;
}
// Strike line thumps on every beat (brighter on the bar) — gives the highway a heartbeat.
export function StrikePulse({ beat, clock, geo, color }: { beat: number; clock: SharedValue<number>; geo: Geo; color: string }) {
  const st = useAnimatedStyle(() => {
    const ph = clock.value / beat; const f = ph - Math.floor(ph); const k = (1 - f) * (1 - f);
    const bar = Math.floor(ph) % 4 === 0 ? 1 : 0.6;
    return { opacity: clock.value > 0 ? k * bar : 0, transform: [{ scaleY: 1 + k * 1.6 }] };
  });
  return <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: geo.cx - geo.hw / 2 - 10, top: geo.bottomY - 5, width: geo.hw + 20, height: 10, borderRadius: 5, backgroundColor: color, shadowColor: color, shadowOpacity: 1, shadowRadius: 16 }, st]} />;
}
export const BeatLines = React.memo(function BeatLines({ beat, clock, lookahead, geo, fever }: { beat: number; clock: SharedValue<number>; lookahead: number; geo: Geo; fever: SharedValue<number> }) {
  const n = Math.min(24, Math.ceil(lookahead / beat) + 1);
  return <>{Array.from({ length: n }, (_, k) => <BeatLine key={k} k={k} beat={beat} clock={clock} lookahead={lookahead} geo={geo} fever={fever} />)}</>;
});

const styles = StyleSheet.create({
  receptor: { position: "absolute", height: 32, borderRadius: 16, borderWidth: 2.5, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,5,26,0.6)", shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
});
