import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import Reanimated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import Svg, { Defs, LinearGradient as SvgLinear, Line, Polygon, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors, laneColors } from "@/src/game/theme";
import { Geo, laneFrac } from "./geometry";

// ---- Static perspective highway (SVG, rendered once): crisp 1px separators that fade into the
// horizon, thin edge rails, faint per-lane colour tint and a clean strike line. ----
export const Grid = React.memo(function Grid({ geo, w, h, tint, fever }: { geo: Geo; w: number; h: number; tint: string; fever: boolean }) {
  const topX = (fr: number) => geo.cx + fr * geo.hw * geo.pn;
  const botX = (fr: number) => geo.cx + fr * geo.hw;
  const rail = fever ? colors.gold : tint;
  const yEnd = geo.bottomY + 44;
  const poly = `${topX(-0.5)},${geo.topY} ${topX(0.5)},${geo.topY} ${botX(0.5)},${yEnd} ${botX(-0.5)},${yEnd}`;
  const lanePoly = (l: number) => { const a = -0.5 + l * 0.25, b = a + 0.25; return `${topX(a)},${geo.topY} ${topX(b)},${geo.topY} ${botX(b)},${yEnd} ${botX(a)},${yEnd}`; };
  const half = geo.hw / 2;
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="hz" cx="50%" cy={`${(geo.topY / h) * 100}%`} r="45%">
          <Stop offset="0" stopColor={rail} stopOpacity={fever ? 0.32 : 0.16} />
          <Stop offset="1" stopColor={rail} stopOpacity={0} />
        </RadialGradient>
        <SvgLinear id="surf" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0A0828" stopOpacity={0.15} />
          <Stop offset="0.5" stopColor="#0C0A30" stopOpacity={0.62} />
          <Stop offset="1" stopColor={fever ? "#2A1A30" : "#0E0B34"} stopOpacity={0.9} />
        </SvgLinear>
        {laneColors.map((c, l) => <SvgLinear key={l} id={`lt${l}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={c} stopOpacity={0} /><Stop offset="1" stopColor={c} stopOpacity={0.07} /></SvgLinear>)}
        <SvgLinear id="sep" gradientUnits="userSpaceOnUse" x1="0" y1={geo.topY} x2="0" y2={yEnd}><Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} /><Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.13} /></SvgLinear>
        <SvgLinear id="rail" gradientUnits="userSpaceOnUse" x1="0" y1={geo.topY} x2="0" y2={yEnd}><Stop offset="0" stopColor={rail} stopOpacity={0.05} /><Stop offset="0.6" stopColor={rail} stopOpacity={0.7} /><Stop offset="1" stopColor={rail} stopOpacity={1} /></SvgLinear>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill="url(#hz)" />
      <Polygon points={poly} fill="url(#surf)" />
      {laneColors.map((_, l) => <Polygon key={l} points={lanePoly(l)} fill={`url(#lt${l})`} />)}
      {[-0.25, 0, 0.25].map(e => <Line key={e} x1={topX(e)} y1={geo.topY} x2={botX(e)} y2={yEnd} stroke="url(#sep)" strokeWidth={1} />)}
      {[-0.5, 0.5].map(e => <React.Fragment key={e}>
        <Line x1={topX(e)} y1={geo.topY} x2={botX(e)} y2={yEnd} stroke="url(#rail)" strokeOpacity={0.18} strokeWidth={6} />
        <Line x1={topX(e)} y1={geo.topY} x2={botX(e)} y2={yEnd} stroke="url(#rail)" strokeWidth={1.5} />
      </React.Fragment>)}
      <Line x1={geo.cx - half} y1={geo.bottomY} x2={geo.cx + half} y2={geo.bottomY} stroke={rail} strokeOpacity={0.22} strokeWidth={8} />
      <Line x1={geo.cx - half} y1={geo.bottomY} x2={geo.cx + half} y2={geo.bottomY} stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={1.5} />
    </Svg>
  );
});

// Crisp outlined receptors that fill with lane colour on press.
export const Receptors = React.memo(function Receptors({ geo, flash }: { geo: Geo; flash: Animated.Value[] }) {
  const capW = geo.laneW * 0.8;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {laneColors.map((c, l) => {
        const x = geo.cx + laneFrac(l) * geo.hw;
        return (
          <Animated.View key={l} style={[styles.receptor, { width: capW, left: x - capW / 2, top: geo.bottomY - 11, borderColor: c, transform: [{ scale: flash[l].interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }]}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c, opacity: flash[l].interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.85] }) }]} />
            <View style={[styles.receptorMark, { width: capW * 0.3 }]} />
          </Animated.View>
        );
      })}
    </View>
  );
});

// Hit burst per lane: short light shaft + crisp ring + a few sparks (all native-driver Animated).
export const LaneBursts = React.memo(function LaneBursts({ geo, burst, sparks }: { geo: Geo; burst: Animated.Value[]; sparks: boolean }) {
  const S = sparks ? 5 : 0;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {burst.map((b, l) => {
      const c = laneColors[l]; const x = geo.cx + laneFrac(l) * geo.hw; const y = geo.bottomY; const R = geo.laneW * 0.46;
      const fade = b.interpolate({ inputRange: [0, 0.08, 1], outputRange: [0, 1, 0] });
      return <React.Fragment key={l}>
        <Animated.View style={{ position: "absolute", left: x - R * 0.45, top: y - R * 2.8, width: R * 0.9, height: R * 2.8, borderRadius: R * 0.45, backgroundColor: c, opacity: b.interpolate({ inputRange: [0, 0.06, 1], outputRange: [0, 0.24, 0] }), transform: [{ translateY: R * 1.4 }, { scaleY: b.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }, { translateY: -R * 1.4 }] }} />
        <Animated.View style={{ position: "absolute", left: x - R, top: y - R, width: R * 2, height: R * 2, borderRadius: R, borderWidth: 2, borderColor: c, opacity: fade, transform: [{ scaleY: 0.45 }, { scale: b.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.55] }) }] }} />
        {Array.from({ length: S }).map((_, i) => { const ang = -Math.PI / 2 + (i - (S - 1) / 2) * 0.42; const d = R * (1.7 + (i % 2) * 0.5); return <Animated.View key={i} style={{ position: "absolute", left: x - 2, top: y - 2, width: 4, height: 4, borderRadius: 2, backgroundColor: i % 2 ? "#FFFFFF" : c, opacity: fade, transform: [{ translateX: b.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(ang) * d] }) }, { translateY: b.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(ang) * d] }) }] }} />; })}
      </React.Fragment>;
    })}
  </View>;
});

// Hairline beat markers flowing down the highway (brighter on the bar) — pure UI-thread, fixed pool.
function BeatLine({ k, beat, clock, lookahead, geo, fever, barEvery, strength }: { k: number; beat: number; clock: SharedValue<number>; lookahead: number; geo: Geo; fever: SharedValue<number>; barEvery: number; strength: number }) {
  const st = useAnimatedStyle(() => {
    const c = clock.value; const idx = Math.ceil(c / beat) + k; const prog = (c - (idx * beat - lookahead)) / lookahead;
    const on = prog >= 0 && prog <= 1; const p = on ? prog : 0;
    const persp = geo.pn + (1 - geo.pn) * p; const w = geo.hw * persp;
    const bar = idx % barEvery === 0;
    return { opacity: on ? ((bar ? 0.24 : 0.07) * strength + fever.value * 0.14) * Math.min(1, p * 4) : 0, width: w, transform: [{ translateX: geo.cx - w / 2 }, { translateY: geo.topY + geo.span * p }] };
  });
  return <Reanimated.View pointerEvents="none" style={[styles.beatLine, st]} />;
}
// Strike line breathes on every beat (stronger on the bar).
export function StrikePulse({ beat, clock, geo, color }: { beat: number; clock: SharedValue<number>; geo: Geo; color: string }) {
  const st = useAnimatedStyle(() => {
    const ph = clock.value / beat; const f = ph - Math.floor(ph); const k = (1 - f) * (1 - f);
    const bar = Math.floor(ph) % 4 === 0 ? 0.6 : 0.3;
    return { opacity: clock.value > 0 ? k * bar : 0, transform: [{ scaleY: 1 + k }] };
  });
  return <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: geo.cx - geo.hw / 2, top: geo.bottomY - 3, width: geo.hw, height: 6, borderRadius: 3, backgroundColor: color }, st]} />;
}
export const BeatLines = React.memo(function BeatLines({ beat, clock, lookahead, geo, fever, barEvery = 4, strength = 1, max = 24 }: { beat: number; clock: SharedValue<number>; lookahead: number; geo: Geo; fever: SharedValue<number>; barEvery?: number; strength?: number; max?: number }) {
  const n = Math.min(max, Math.ceil(lookahead / beat) + 1);
  return <>{Array.from({ length: n }, (_, k) => <BeatLine key={k} k={k} beat={beat} clock={clock} lookahead={lookahead} geo={geo} fever={fever} barEvery={barEvery} strength={strength} />)}</>;
});

const styles = StyleSheet.create({
  receptor: { position: "absolute", height: 22, borderRadius: 7, borderWidth: 1.5, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6,5,26,0.55)" },
  receptorMark: { height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.75)" },
  beatLine: { position: "absolute", left: 0, top: 0, height: 1, backgroundColor: "#FFFFFF" },
});
