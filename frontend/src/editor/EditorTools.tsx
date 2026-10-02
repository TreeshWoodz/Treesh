import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { alpha, colors, fonts } from "@/src/game/theme";
import { SwipeDir } from "@/src/game/types";
import { Tool } from "./editorMath";

export const ARROW_ICON: Record<SwipeDir, keyof typeof Ionicons.glyphMap> = { up: "arrow-up", left: "arrow-back", right: "arrow-forward" };
export const FLICK_DIRS: SwipeDir[] = ["left", "up", "right"];
export const TOOLS: { id: Tool; icon: keyof typeof Ionicons.glyphMap; label: string; color: string }[] = [
  { id: "select", icon: "scan", label: "Select", color: colors.text },
  { id: "tap", icon: "ellipse", label: "Tap", color: colors.cyan },
  { id: "hold", icon: "reorder-two", label: "Hold", color: colors.pink },
  { id: "flick", icon: "arrow-up-circle", label: "Flick", color: colors.lime },
  { id: "wavy", icon: "water", label: "Wavy", color: colors.purple },
  { id: "erase", icon: "backspace", label: "Erase", color: colors.red },
];

// Direction chips for new flick notes (floats over the board so the layout never jumps).
export function FlickDirRow({ flickDir, onFlickDir }: { flickDir: SwipeDir; onFlickDir: (d: SwipeDir) => void }) {
  return (
    <View style={styles.dirRow}>
      <Text selectable={false} style={styles.dirLabel}>NEW FLICK</Text>
      {FLICK_DIRS.map(d => {
        const on = flickDir === d;
        return <Pressable key={d} testID={`editor-new-flick-${d}`} onPress={() => onFlickDir(d)} style={[styles.dir, on && styles.dirOn]}><Ionicons name={ARROW_ICON[d]} size={16} color={on ? colors.bg : colors.text} /></Pressable>;
      })}
    </View>
  );
}

// Note-type toolbar (segmented).
export function EditorTools({ tool, onTool }: { tool: Tool; onTool: (t: Tool) => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {TOOLS.map(t => {
          const on = tool === t.id;
          return (
            <Pressable key={t.id} testID={`editor-tool-${t.id}`} onPress={() => onTool(t.id)} style={[styles.tool, on && { backgroundColor: alpha(t.color, 0.14), borderColor: alpha(t.color, 0.8) }]}>
              <Ionicons name={t.icon} size={17} color={on ? t.color : colors.muted} />
              <Text selectable={false} style={[styles.label, { color: on ? t.color : colors.muted }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingTop: 8 },
  bar: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 16, backgroundColor: "rgba(12,10,36,0.74)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  tool: { flex: 1, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 2, borderWidth: 1, borderColor: "transparent" },
  label: { fontSize: 10, fontFamily: fonts.heavy, letterSpacing: 0.3 },
  dirRow: { flexDirection: "row", alignItems: "center", alignSelf: "center", gap: 6, padding: 4, paddingLeft: 10, borderRadius: 14, backgroundColor: "rgba(12,10,36,0.9)", borderWidth: 1, borderColor: "rgba(204,255,0,0.35)" },
  dirLabel: { color: colors.lime, fontSize: 9, letterSpacing: 2, fontFamily: fonts.arcadeBlack, marginRight: 4 },
  dir: { width: 44, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  dirOn: { backgroundColor: colors.lime, borderColor: colors.lime },
});
