import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { alpha, colors } from "@/src/game/theme";
import { Note } from "@/src/game/types";

const BINS = 72;

// Whole-song overview: note-density bars + playhead. Tap or drag anywhere to scrub.
export const Timeline = React.memo(function Timeline({ notes, duration, now, onSeek }: { notes: Note[]; duration: number; now: number; onSeek: (t: number) => void }) {
  const [w, setW] = useState(0);
  const bins = useMemo(() => {
    const arr = new Array(BINS).fill(0);
    for (const n of notes) arr[Math.min(BINS - 1, Math.max(0, Math.floor((n.time / duration) * BINS)))]++;
    const m = Math.max(1, ...arr);
    return arr.map(v => v / m);
  }, [notes, duration]);
  const seekAt = (e: any) => { if (w) onSeek(Math.max(0, Math.min(1, (e.nativeEvent.locationX ?? 0) / w)) * duration); };
  const pct = `${Math.min(100, (now / Math.max(0.01, duration)) * 100)}%` as const;
  return (
    <View testID="editor-timeline" style={styles.wrap} onLayout={e => setW(e.nativeEvent.layout.width)} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderTerminationRequest={() => false} onResponderGrant={seekAt} onResponderMove={seekAt}>
      <View pointerEvents="none" style={[styles.played, { width: pct }]} />
      <View pointerEvents="none" style={styles.bins}>
        {bins.map((v, i) => <View key={i} style={[styles.bin, { height: 3 + v * 20, backgroundColor: v ? alpha(colors.cyan, 0.3 + v * 0.6) : "rgba(255,255,255,0.1)" }]} />)}
      </View>
      <View pointerEvents="none" style={[styles.head, { left: pct }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flex: 1, height: 36, borderRadius: 10, overflow: "hidden", justifyContent: "center", backgroundColor: "rgba(12,10,36,0.74)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  played: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,229,255,0.08)" },
  bins: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, gap: 1 },
  bin: { flex: 1, borderRadius: 1 },
  head: { position: "absolute", top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: colors.text },
});
