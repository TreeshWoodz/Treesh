import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, laneColors } from "@/src/game/theme";
import { Note, SwipeDir } from "@/src/game/types";
import { ARROW_ICON, FLICK_DIRS } from "./EditorTools";
import { fmtTime } from "./editorMath";

const LABEL: Record<string, string> = { tap: "TAP", hold: "HOLD", wavy: "WAVY", swipe: "FLICK", slide: "SLIDE", chord: "CHORD", special: "SPECIAL" };

type Props = { notes: Note[]; clipCount: number; onNudge: (dir: 1 | -1) => void; onLane: (d: 1 | -1) => void; onDir: (d: SwipeDir) => void; onDelete: () => void; onClose: () => void; onCopy: () => void; onPaste: () => void; onDuplicate: () => void; onMirror: () => void };

function IBtn({ testID, icon, label, onPress, color = colors.text }: { testID: string; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color?: string }) {
  return <Pressable testID={testID} onPress={onPress} style={styles.btn}><Ionicons name={icon} size={16} color={color} /><Text selectable={false} style={[styles.btnText, { color }]}>{label}</Text></Pressable>;
}

// Floating panel for the selected note(s): move in time / lane, set flick direction, delete.
export function Inspector({ notes, clipCount, onNudge, onLane, onDir, onDelete, onClose, onCopy, onPaste, onDuplicate, onMirror }: Props) {
  const n = notes.length === 1 ? notes[0] : undefined;
  const flickable = !!n && (n.type === "swipe" || n.type === "tap");
  return (
    <View testID="editor-inspector" style={styles.card}>
      <View style={styles.head}>
        {n && <View style={[styles.dot, { backgroundColor: laneColors[n.lane] }]} />}
        <Text selectable={false} style={styles.title} numberOfLines={1}>{n ? `${LABEL[n.type] || n.type.toUpperCase()} · LANE ${n.lane + 1}` : `${notes.length} NOTES SELECTED`}</Text>
        {n && <Text selectable={false} style={styles.time}>{fmtTime(n.time)}{n.duration ? ` · ${n.duration.toFixed(2)}s` : ""}</Text>}
        <Pressable testID="editor-inspector-close" onPress={onClose} hitSlop={8} style={styles.close}><Ionicons name="close" size={15} color={colors.muted} /></Pressable>
      </View>
      <View style={styles.row}>
        <IBtn testID="editor-nudge-earlier" icon="chevron-down" label="Earlier" onPress={() => onNudge(-1)} />
        <IBtn testID="editor-nudge-later" icon="chevron-up" label="Later" onPress={() => onNudge(1)} />
        <IBtn testID="editor-lane-left" icon="chevron-back" label="Lane" onPress={() => onLane(-1)} />
        <IBtn testID="editor-lane-right" icon="chevron-forward" label="Lane" onPress={() => onLane(1)} />
        <IBtn testID="editor-inspector-delete" icon="trash" label="Delete" color={colors.pink} onPress={onDelete} />
      </View>
      <View style={styles.row}>
        <IBtn testID="editor-inspector-copy" icon="copy" label={`Copy ${notes.length}`} color={colors.cyan} onPress={onCopy} />
        <IBtn testID="editor-inspector-mirror" icon="swap-horizontal" label="Mirror" color={colors.purple} onPress={onMirror} />
        <IBtn testID="editor-inspector-duplicate" icon="duplicate" label="Duplicate" color={colors.cyan} onPress={onDuplicate} />
        <IBtn testID="editor-inspector-paste" icon="clipboard" label={clipCount ? `Paste ${clipCount}` : "Paste"} color={clipCount ? colors.gold : colors.muted} onPress={onPaste} />
      </View>
      {flickable && (
        <View style={styles.dirRow}>
          <Text selectable={false} style={styles.dirLabel}>{n!.type === "swipe" ? "FLICK" : "MAKE FLICK"}</Text>
          {FLICK_DIRS.map(d => {
            const on = n!.type === "swipe" && (n!.dir || "up") === d;
            return <Pressable key={d} testID={`editor-flick-dir-${d}`} onPress={() => onDir(d)} style={[styles.dir, on && styles.dirOn]}><Ionicons name={ARROW_ICON[d]} size={18} color={on ? colors.bg : colors.text} /></Pressable>;
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: "absolute", left: 10, right: 10, bottom: 8, padding: 10, gap: 8, borderRadius: 16, backgroundColor: "rgba(12,10,36,0.95)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 14 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { flex: 1, color: colors.text, fontSize: 11, letterSpacing: 1.4, fontFamily: fonts.arcadeBlack },
  time: { color: colors.muted, fontSize: 11, fontFamily: fonts.bold },
  close: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" },
  row: { flexDirection: "row", gap: 6 },
  btn: { flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 1, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  btnText: { fontSize: 9, fontFamily: fonts.heavy },
  dirRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  dirLabel: { color: colors.lime, fontSize: 9, letterSpacing: 2, fontFamily: fonts.arcadeBlack, marginRight: 4 },
  dir: { width: 48, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  dirOn: { backgroundColor: colors.lime, borderColor: colors.lime },
});
