import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import Reanimated, { interpolateColor, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { laneColors, alpha } from "@/src/game/theme";
import { Note, SwipeDir } from "@/src/game/types";
import { Geo, P_NEAR, laneFrac } from "./geometry";

const ARROW: Record<SwipeDir, keyof typeof Ionicons.glyphMap> = { up: "arrow-up", left: "arrow-back", right: "arrow-forward" };

// ---- Falling note (pure UI-thread motion, memoized so score/combo re-renders never touch it) ----
const FallingNote = React.memo(function FallingNote({ note, clock, lookahead, geo, special, rainbow }: { note: Note; clock: SharedValue<number>; lookahead: number; geo: Geo; special?: boolean; rainbow: SharedValue<number> }) {
  const f = laneFrac(note.lane);
  const color = laneColors[note.lane];
  const isWavy = note.type === "wavy";
  const isHold = note.type === "hold" || note.type === "wavy";
  const isSwipe = note.type === "swipe" && !!note.dir;
  const baseW = geo.laneW * (isSwipe ? 0.7 : 0.8);
  const baseH = isSwipe ? geo.laneW * 0.62 : 28;
  const tailW = baseW * 0.4;
  const tailLen = isHold ? Math.max(24, Math.min(geo.span, ((note.duration || 0.4) / lookahead) * geo.span)) : 0;
  const tilt = (Math.atan2(-f * geo.hw * (1 - P_NEAR), geo.span) * 180) / Math.PI; // lean the tail toward the vanishing point
  const aStyle = useAnimatedStyle(() => {
    const prog = (clock.value - (note.time - lookahead)) / lookahead; // 0 at spawn(top) → 1 at receptor
    const cp = prog < 0 ? 0 : prog > 1.1 ? 1.1 : prog;
    const persp = P_NEAR + (1 - P_NEAR) * cp;
    const x = geo.cx + f * geo.hw * persp;
    const y = geo.topY + geo.span * cp;
    let opacity = 1;
    if (prog < 0.05) opacity = prog / 0.05;
    if (prog > 1.0) opacity = 1 - (prog - 1.0) / 0.12;
    if (opacity < 0) opacity = 0; if (opacity > 1) opacity = 1;
    return { opacity, transform: [{ translateX: x }, { translateY: y }, { scale: persp }] };
  });
  // Special (charged) notes cycle colours smoothly so they read as "power" notes rather than a single lane colour.
  const capStyle = useAnimatedStyle(() => {
    if (!special) return { backgroundColor: color };
    const p = (rainbow.value + note.lane * 0.22) % 1;
    return { backgroundColor: interpolateColor(p, [0, 0.25, 0.5, 0.75, 1], ["#FF4D8D", "#2FE0D6", "#F5C842", "#8E7CFF", "#FF4D8D"]) };
  });
  return (
    <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: -baseW / 2, top: -baseH / 2, width: baseW, height: baseH }, aStyle]}>
      {isHold && !isWavy && <View style={{ position: "absolute", left: baseW / 2 - tailW / 2, bottom: baseH / 2, width: tailW, height: tailLen, borderRadius: tailW / 2, backgroundColor: `${color}55`, borderWidth: 1, borderColor: `${color}AA`, transformOrigin: "50% 100%", transform: [{ rotateZ: `${tilt}deg` }] }} />}
      <View style={{ position: "absolute", left: -6, top: -6, width: baseW + 12, height: baseH + 12, borderRadius: isSwipe ? 18 : 14, backgroundColor: alpha(color, special ? 0.5 : 0.28) }} />
      <Reanimated.View style={[styles.note, { width: baseW, height: baseH, borderRadius: isSwipe ? 14 : 10, borderColor: special || isSwipe ? "#FFFFFF" : "rgba(255,255,255,0.7)", borderWidth: isSwipe ? 2.5 : 1.5 }, capStyle]}>
        <View style={[styles.noteGloss, { borderRadius: baseH / 2, backgroundColor: special ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)" }]} />
        {isSwipe ? <Ionicons name={ARROW[note.dir as SwipeDir]} size={Math.round(baseH * 0.78)} color="#FFFFFF" style={{ textShadowColor: "#000", textShadowRadius: 6 }} />
          : <View style={{ position: "absolute", left: baseW * 0.28, right: baseW * 0.28, top: baseH / 2 - 2, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.95)" }} />}
      </Reanimated.View>
    </Reanimated.View>
  );
});

export const NotesLayer = React.memo(function NotesLayer({ notes, clock, lookahead, geo, special, rainbow }: { notes: Note[]; clock: SharedValue<number>; lookahead: number; geo: Geo; special?: boolean; rainbow: SharedValue<number> }) {
  // Wavy notes are drawn entirely by WavyLayer (bead ribbon) — skip them here so they aren't double-drawn.
  return <>{notes.filter(n => n.type !== "wavy").map(n => <FallingNote key={n.id} note={n} clock={clock} lookahead={lookahead} geo={geo} special={special} rainbow={rainbow} />)}</>;
});

// Bright bar shown while a hold is actively sustained — drains from the receptor, leaning along the lane's perspective.
export function ActiveHoldBar({ note, clock, lookahead, geo }: { note: Note; clock: SharedValue<number>; lookahead: number; geo: Geo }) {
  const f = laneFrac(note.lane);
  const color = laneColors[note.lane];
  const isWavy = note.type === "wavy";
  const w = geo.laneW * 0.34;
  const x = geo.cx + f * geo.hw;
  const tilt = (Math.atan2(-f * geo.hw * (1 - P_NEAR), geo.span) * 180) / Math.PI;
  const endT = note.time + (note.duration || 0.4);
  const aStyle = useAnimatedStyle(() => {
    const cpTe = (clock.value - (endT - lookahead)) / lookahead;
    const cte = cpTe < 0 ? 0 : cpTe > 1 ? 1 : cpTe;
    const yTe = geo.topY + geo.span * cte;
    return { height: Math.max(0, geo.bottomY - yTe), transform: [{ translateY: yTe }, { rotateZ: `${tilt}deg` }] };
  });
  // Wavy notes render their own continuous trace as they fall — a separate draining bar distorts it,
  // so we skip the bar entirely and let the falling wave + the lit receptor lane guide the trace.
  if (isWavy) return null;
  return <Reanimated.View pointerEvents="none" style={[{ position: "absolute", left: x - w / 2, top: 0, width: w, borderRadius: w / 2, backgroundColor: color, transformOrigin: "50% 100%" }, aStyle]}><View style={{ position: "absolute", top: 2, left: w * 0.3, right: w * 0.3, bottom: 2, borderRadius: w / 2, backgroundColor: "rgba(255,255,255,0.35)" }} /></Reanimated.View>;
}

const styles = StyleSheet.create({
  note: { alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.55)" },
  noteGloss: { position: "absolute", top: 1.5, left: 4, right: 4, height: "42%", backgroundColor: "rgba(255,255,255,0.35)" },
});
