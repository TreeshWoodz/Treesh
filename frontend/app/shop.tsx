import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Polygon, Rect } from "react-native-svg";
import { ScreenHeader } from "@/src/components/ui";
import { buySkin, buyTheme, equipSkin, equipTheme, HighwayTheme, Skin, SKINS, THEMES, useProgress } from "@/src/game/progression";
import { HighwayScene } from "@/src/components/HighwayScene";
import { useStarlites } from "@/src/game/starlites";
import { alpha, colors, fonts, neonGlow, textGlow } from "@/src/game/theme";

// Mini perspective highway showing a skin's lane colours with a few falling notes.
function SkinPreview({ skin, w = 120, h = 84 }: { skin: Skin; w?: number; h?: number }) {
  const top = 0.18, cx = w / 2, hw = w * 0.92;
  const x = (fr: number, p: number) => cx + fr * hw * (top + (1 - top) * p);
  const notes = [[0, 0.78], [1, 0.45], [2, 0.62], [3, 0.3], [1, 0.9], [2, 0.18]];
  return <Svg width={w} height={h}>
    <Polygon points={`${x(-0.5, 0)},0 ${x(0.5, 0)},0 ${x(0.5, 1)},${h} ${x(-0.5, 1)},${h}`} fill="rgba(20,15,72,0.8)" />
    {[-0.5, -0.25, 0, 0.25, 0.5].map((e, i) => <Line key={i} x1={x(e, 0)} y1={0} x2={x(e, 1)} y2={h} stroke={i === 0 || i === 4 ? skin.glow : "rgba(160,200,255,0.2)"} strokeWidth={i === 0 || i === 4 ? 1.6 : 1} />)}
    <Line x1={x(-0.5, 0.88)} y1={h * 0.88} x2={x(0.5, 0.88)} y2={h * 0.88} stroke="#fff" strokeOpacity={0.8} strokeWidth={1.2} />
    {notes.map(([l, p], i) => { const fr = (l + 0.5) / 4 - 0.5; const sc = top + (1 - top) * p; const nw = (hw / 4) * 0.66 * sc; return <Rect key={i} x={x(fr, p) - nw / 2} y={h * p - 3 * sc} width={nw} height={7 * sc} rx={3.5 * sc} fill={skin.lanes[l]} stroke="#fff" strokeOpacity={0.6} strokeWidth={0.8} />; })}
  </Svg>;
}

// Mini gameplay scene: the theme's scenery with a small highway running from the horizon.
function ThemePreview({ theme, w = 120, h = 84 }: { theme: HighwayTheme; w?: number; h?: number }) {
  const hz = h * 0.42; const cx = w / 2; const top = w * 0.08, bot = w * 0.9;
  return <View style={{ width: w, height: h, borderRadius: 8, overflow: "hidden", backgroundColor: "#06051A" }}>
    {theme.id === "classic" ? <Svg width={w} height={h}><Line x1={0} y1={hz} x2={w} y2={hz} stroke="#FF2D7A" strokeOpacity={0.6} />{[-3, -2, -1, 0, 1, 2, 3].map(i => <Line key={i} x1={cx + i * 6} y1={hz} x2={cx + i * 40} y2={h} stroke="#B537FF" strokeOpacity={0.35} />)}</Svg> : <HighwayScene theme={theme.id} w={w} h={h} horizon={hz} />}
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <Polygon points={`${cx - top / 2},${hz} ${cx + top / 2},${hz} ${cx + bot / 2},${h} ${cx - bot / 2},${h}`} fill="rgba(20,15,72,0.7)" />
      {[-0.5, 0, 0.5].map((e, i) => <Line key={i} x1={cx + e * top} y1={hz} x2={cx + e * bot} y2={h} stroke={e === 0 ? "rgba(160,200,255,0.25)" : theme.glow} strokeWidth={1.4} />)}
    </Svg>
  </View>;
}

export default function ShopScreen() {
  const prog = useProgress();
  const { stars, award } = useStarlites();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const equipped = SKINS.find(s => s.id === prog.skin) || SKINS[0];

  const onTheme = async (t: HighwayTheme) => {
    if (prog.themes.includes(t.id)) { await equipTheme(t.id); setMsg(`${t.name} equipped`); Haptics.selectionAsync(); return; }
    if (stars.points < t.price) { setMsg(`Need ${(t.price - stars.points).toLocaleString()} more Starlites`); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); return; }
    if (confirm !== `t-${t.id}`) { setConfirm(`t-${t.id}`); return; }
    await award(-t.price, `Highway theme · ${t.name}`, true);
    await buyTheme(t.id); setConfirm(null); setMsg(`Unlocked ${t.name}!`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const onPress = async (skin: Skin) => {
    const owned = prog.owned.includes(skin.id);
    if (owned) { await equipSkin(skin.id); setMsg(`${skin.name} equipped`); Haptics.selectionAsync(); return; }
    if (stars.points < skin.price) { setMsg(`Need ${(skin.price - stars.points).toLocaleString()} more Starlites`); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); return; }
    if (confirm !== skin.id) { setConfirm(skin.id); return; }
    await award(-skin.price, `Note skin · ${skin.name}`, true);
    await buySkin(skin.id); setConfirm(null); setMsg(`Unlocked ${skin.name}!`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}><ScreenHeader title="Shop" />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { borderColor: alpha(equipped.glow, 0.55) }, neonGlow(equipped.glow, 18, 0.35)]}>
        <SkinPreview skin={equipped} w={150} h={104} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.eyebrow}>EQUIPPED</Text>
          <Text style={[styles.heroName, { textShadowColor: equipped.glow }]}>{equipped.name}</Text>
          <View style={styles.swatches}>{equipped.lanes.map((c, i) => <View key={i} style={[styles.swatch, { backgroundColor: c }]} />)}</View>
          <View style={styles.balance}><Ionicons name="sparkles" size={13} color={colors.gold} /><Text style={styles.balanceText}>{stars.points.toLocaleString()}</Text></View>
        </View>
      </View>
      {msg && <Pressable testID="shop-message" onPress={() => setMsg(null)} style={styles.msg}><Ionicons name="information-circle" size={16} color={colors.cyan} /><Text style={styles.msgText}>{msg}</Text></Pressable>}
      <Text style={styles.section}>NOTE SKINS · {prog.owned.length}/{SKINS.length} OWNED</Text>
      {SKINS.map(skin => {
        const owned = prog.owned.includes(skin.id); const on = prog.skin === skin.id; const afford = stars.points >= skin.price; const asking = confirm === skin.id;
        return <Pressable key={skin.id} testID={`skin-card-${skin.id}`} onPress={() => onPress(skin)} style={({ pressed }) => [styles.card, { borderColor: on ? skin.glow : alpha(skin.glow, 0.28) }, on && neonGlow(skin.glow, 14, 0.4), pressed && { transform: [{ scale: 0.985 }] }]}>
          <SkinPreview skin={skin} />
          <View style={{ flex: 1, gap: 5 }}>
            <View style={[styles.tag, { borderColor: alpha(skin.glow, 0.6) }]}><Text style={[styles.tagText, { color: skin.glow }]}>{skin.tag}</Text></View>
            <Text style={styles.name}>{skin.name}</Text>
            <View style={styles.swatches}>{skin.lanes.map((c, i) => <View key={i} style={[styles.swatchSm, { backgroundColor: c }]} />)}</View>
          </View>
          <View testID={`skin-action-${skin.id}`} style={[styles.action, on ? styles.actionOn : owned ? styles.actionOwned : asking ? styles.actionConfirm : !afford && styles.actionLocked]}>
            {on ? <><Ionicons name="checkmark" size={14} color="#001018" /><Text style={[styles.actionText, { color: "#001018" }]}>ON</Text></>
              : owned ? <Text style={styles.actionText}>EQUIP</Text>
              : <><Ionicons name={afford ? "sparkles" : "lock-closed"} size={12} color={asking ? "#001018" : colors.gold} /><Text style={[styles.actionText, { color: asking ? "#001018" : colors.gold }]}>{asking ? "CONFIRM" : skin.price.toLocaleString()}</Text></>}
          </View>
        </Pressable>;
      })}
      <Text style={styles.section}>HIGHWAY THEMES · {prog.themes.length}/{THEMES.length} OWNED</Text>
      {THEMES.map(t => {
        const owned = prog.themes.includes(t.id); const on = prog.theme === t.id; const afford = stars.points >= t.price; const asking = confirm === `t-${t.id}`;
        return <Pressable key={t.id} testID={`theme-card-${t.id}`} onPress={() => onTheme(t)} style={({ pressed }) => [styles.card, { borderColor: on ? t.glow : alpha(t.glow, 0.28) }, on && neonGlow(t.glow, 14, 0.4), pressed && { transform: [{ scale: 0.985 }] }]}>
          <ThemePreview theme={t} />
          <View style={{ flex: 1, gap: 5 }}>
            <View style={[styles.tag, { borderColor: alpha(t.glow, 0.6) }]}><Text style={[styles.tagText, { color: t.glow }]}>{t.tag}</Text></View>
            <Text style={styles.name}>{t.name}</Text>
          </View>
          <View testID={`theme-action-${t.id}`} style={[styles.action, on ? styles.actionOn : owned ? styles.actionOwned : asking ? styles.actionConfirm : !afford && styles.actionLocked]}>
            {on ? <><Ionicons name="checkmark" size={14} color="#001018" /><Text style={[styles.actionText, { color: "#001018" }]}>ON</Text></>
              : owned ? <Text style={styles.actionText}>EQUIP</Text>
              : <><Ionicons name={afford ? "sparkles" : "lock-closed"} size={12} color={asking ? "#001018" : colors.gold} /><Text style={[styles.actionText, { color: asking ? "#001018" : colors.gold }]}>{asking ? "CONFIRM" : t.price.toLocaleString()}</Text></>}
          </View>
        </Pressable>;
      })}
      <Text style={styles.hint}>Earn Starlites by clearing songs, hitting combo milestones, daily challenges and levelling up.</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" }, content: { padding: 16, gap: 12, paddingBottom: 40 },
  hero: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 16, borderWidth: 1.5, backgroundColor: "rgba(14,11,38,0.85)" },
  eyebrow: { color: colors.cyan, fontSize: 10, fontFamily: fonts.arcade, letterSpacing: 2 },
  heroName: { color: colors.text, fontSize: 20, fontFamily: fonts.arcadeBlack, textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } },
  swatches: { flexDirection: "row", gap: 5 }, swatch: { width: 20, height: 8, borderRadius: 4 }, swatchSm: { width: 16, height: 6, borderRadius: 3 },
  balance: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }, balanceText: { color: colors.gold, fontFamily: fonts.arcade, fontSize: 13 },
  msg: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, backgroundColor: "rgba(0,229,255,0.08)", borderWidth: 1, borderColor: "rgba(0,229,255,0.35)" }, msgText: { color: colors.text, fontFamily: fonts.bold, fontSize: 13, flex: 1 },
  section: { color: colors.cyan, fontSize: 11, fontFamily: fonts.arcade, letterSpacing: 2, marginTop: 6, ...textGlow(colors.cyan, 8) },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 14, borderWidth: 1.5, backgroundColor: "rgba(14,11,38,0.8)" },
  tag: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 }, tagText: { fontSize: 8, fontFamily: fonts.arcadeBlack, letterSpacing: 1.2 },
  name: { color: colors.text, fontSize: 15, fontFamily: fonts.arcadeBlack, letterSpacing: 0.5 },
  action: { minWidth: 82, height: 38, paddingHorizontal: 10, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1.5, borderColor: "rgba(255,214,0,0.6)", backgroundColor: "rgba(255,214,0,0.08)" },
  actionOn: { backgroundColor: colors.lime, borderColor: colors.lime }, actionOwned: { borderColor: colors.cyan, backgroundColor: "rgba(0,229,255,0.1)" }, actionConfirm: { backgroundColor: colors.gold, borderColor: colors.gold }, actionLocked: { opacity: 0.55 },
  actionText: { color: colors.cyan, fontSize: 11, fontFamily: fonts.arcadeBlack, letterSpacing: 1 },
  hint: { color: colors.muted, fontSize: 12, fontFamily: fonts.body, textAlign: "center", marginTop: 8, lineHeight: 18 },
});
