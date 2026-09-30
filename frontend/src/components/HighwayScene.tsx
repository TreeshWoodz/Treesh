// Static SVG scenery drawn behind the gameplay highway (and in Shop previews) for each highway theme.
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Polygon, RadialGradient, Rect, Stop } from "react-native-svg";

function rng(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

function City({ w, h, hz }: { w: number; h: number; hz: number }) {
  const { back, front, windows } = useMemo(() => {
    const r = rng(7); const back: number[][] = []; const front: number[][] = []; const windows: number[][] = [];
    for (let x = -10; x < w; ) { const bw = w * (0.07 + r() * 0.07); back.push([x, hz * (0.28 + r() * 0.34), bw]); x += bw + 2; }
    for (let x = -6; x < w; ) {
      const bw = w * (0.08 + r() * 0.08); const bh = hz * (0.14 + r() * 0.26); front.push([x, bh, bw]);
      for (let wy = hz - bh + 6; wy < hz - 6; wy += 9) for (let wx = x + 4; wx < x + bw - 5; wx += 7) if (r() < 0.32) windows.push([wx, wy, r() < 0.5 ? 0 : 1]);
      x += bw + 3;
    }
    return { back, front, windows };
  }, [w, hz]);
  return <>
    <Defs>
      <LinearGradient id="citySky" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#07021A" /><Stop offset="0.65" stopColor="#3A0A5C" /><Stop offset="1" stopColor="#FF2D7A" /></LinearGradient>
      <RadialGradient id="moonGlow" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#FF9CD0" stopOpacity={0.45} /><Stop offset="1" stopColor="#FF9CD0" stopOpacity={0} /></RadialGradient>
    </Defs>
    <Rect x={0} y={0} width={w} height={hz} fill="url(#citySky)" />
    <Circle cx={w * 0.78} cy={hz * 0.3} r={w * 0.2} fill="url(#moonGlow)" />
    <Circle cx={w * 0.78} cy={hz * 0.3} r={w * 0.075} fill="#FFE3F3" opacity={0.92} />
    {back.map(([x, bh, bw], i) => <Rect key={`b${i}`} x={x} y={hz - bh} width={bw} height={bh} fill="#240D4A" />)}
    {front.map(([x, bh, bw], i) => <Rect key={`f${i}`} x={x} y={hz - bh} width={bw} height={bh} fill="#0C0524" />)}
    {windows.map(([x, y, c], i) => <Rect key={`w${i}`} x={x} y={y} width={3} height={4} fill={c ? "#00E5FF" : "#FFD600"} opacity={0.85} />)}
    <Rect x={0} y={hz} width={w} height={h - hz} fill="#08031C" />
    <Line x1={0} y1={hz} x2={w} y2={hz} stroke="#FF2D7A" strokeWidth={2} />
  </>;
}

function Space({ w, h, hz }: { w: number; h: number; hz: number }) {
  const stars = useMemo(() => { const r = rng(11); return Array.from({ length: 110 }, () => [r() * w, r() * h, 0.5 + r() * 1.4, 0.35 + r() * 0.65]); }, [w, h]);
  const pr = w * 0.13;
  return <>
    <Defs>
      <LinearGradient id="spaceBg" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#02010A" /><Stop offset="1" stopColor="#0B0630" /></LinearGradient>
      <RadialGradient id="neb1" cx="28%" cy="22%" r="45%"><Stop offset="0" stopColor="#B537FF" stopOpacity={0.45} /><Stop offset="1" stopColor="#B537FF" stopOpacity={0} /></RadialGradient>
      <RadialGradient id="neb2" cx="78%" cy="55%" r="45%"><Stop offset="0" stopColor="#00E5FF" stopOpacity={0.22} /><Stop offset="1" stopColor="#00E5FF" stopOpacity={0} /></RadialGradient>
      <LinearGradient id="planet" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#8B5CFF" /><Stop offset="1" stopColor="#FF2D7A" /></LinearGradient>
    </Defs>
    <Rect x={0} y={0} width={w} height={h} fill="url(#spaceBg)" />
    <Rect x={0} y={0} width={w} height={h} fill="url(#neb1)" />
    <Rect x={0} y={0} width={w} height={h} fill="url(#neb2)" />
    {stars.map(([x, y, r, o], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={o} />)}
    {[[0.15, 0.12], [0.62, 0.08], [0.9, 0.4]].map(([fx, fy], i) => <G key={`fl${i}`} opacity={0.9}><Line x1={w * fx - 7} y1={h * fy} x2={w * fx + 7} y2={h * fy} stroke="#fff" strokeWidth={1} /><Line x1={w * fx} y1={h * fy - 7} x2={w * fx} y2={h * fy + 7} stroke="#fff" strokeWidth={1} /></G>)}
    <Circle cx={w * 0.8} cy={hz * 0.45} r={pr} fill="url(#planet)" />
    <Ellipse cx={w * 0.8} cy={hz * 0.45} rx={pr * 1.8} ry={pr * 0.42} fill="none" stroke="#FFD6F5" strokeOpacity={0.7} strokeWidth={2} />
  </>;
}

function Sunset({ w, h, hz }: { w: number; h: number; hz: number }) {
  const sr = Math.min(w * 0.34, hz * 0.8);
  const stripes = [0.18, 0.34, 0.48, 0.6, 0.72, 0.83];
  return <>
    <Defs>
      <LinearGradient id="sunSky" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#12022E" /><Stop offset="0.6" stopColor="#6E1466" /><Stop offset="1" stopColor="#FF6A00" /></LinearGradient>
      <LinearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFE600" /><Stop offset="1" stopColor="#FF2D7A" /></LinearGradient>
      <LinearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#2A0540" /><Stop offset="1" stopColor="#07021A" /></LinearGradient>
    </Defs>
    <Rect x={0} y={0} width={w} height={hz} fill="url(#sunSky)" />
    <Circle cx={w / 2} cy={hz} r={sr} fill="url(#sun)" />
    {stripes.map((p, i) => <Rect key={i} x={w / 2 - sr} y={hz - sr * (1 - p)} width={sr * 2} height={2 + i * 1.6} fill="#5A1060" />)}
    <Polygon points={`0,${hz} ${w * 0.12},${hz - hz * 0.2} ${w * 0.22},${hz - hz * 0.1} ${w * 0.34},${hz - hz * 0.26} ${w * 0.46},${hz}`} fill="#2A0845" />
    <Polygon points={`${w * 0.55},${hz} ${w * 0.68},${hz - hz * 0.22} ${w * 0.78},${hz - hz * 0.12} ${w * 0.9},${hz - hz * 0.3} ${w},${hz - hz * 0.16} ${w},${hz}`} fill="#2A0845" />
    <Rect x={0} y={hz} width={w} height={h - hz} fill="url(#ground)" />
    {[0.06, 0.16, 0.32, 0.55, 0.85].map((p, i) => <Line key={`g${i}`} x1={0} y1={hz + (h - hz) * p} x2={w} y2={hz + (h - hz) * p} stroke="#FF2D7A" strokeOpacity={0.35} strokeWidth={1} />)}
    <Line x1={0} y1={hz} x2={w} y2={hz} stroke="#FFD600" strokeWidth={1.5} />
  </>;
}

export const HighwayScene = React.memo(function HighwayScene({ theme, w, h, horizon }: { theme: string; w: number; h: number; horizon: number }) {
  if (theme === "classic") return null;
  return <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
    {theme === "city" ? <City w={w} h={h} hz={horizon} /> : theme === "space" ? <Space w={w} h={h} hz={horizon} /> : <Sunset w={w} h={h} hz={horizon} />}
  </Svg>;
});
