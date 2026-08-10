import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NeonButton } from "@/src/components/ui";
import { useAppState } from "@/src/game/AppState";
import { laneColors, colors } from "@/src/game/theme";
import { Note, ScoreResult } from "@/src/game/types";
import { useStarlites } from "@/src/game/starlites";
import { ensureHitAudio } from "@/src/game/synth";

type Judgment = "PERFECT" | "GREAT" | "GOOD" | "MISS";
const weights = { PERFECT: 1, GREAT: 0.75, GOOD: 0.45, MISS: 0 };

export default function GameScreen() {
  const { width, height } = useWindowDimensions();
  const { selectedSong, selectedDifficulty, charts, settings, saveResult } = useAppState();
  const { gameComplete, discoverSong, listen } = useStarlites();
  const chart = selectedSong ? charts[`${selectedSong.id}-${selectedDifficulty}`] : undefined;
  const player = useAudioPlayer(selectedSong?.uri ? { uri: selectedSong.uri } : null, { updateInterval: settings.performanceMode ? 80 : 35 });
  const hitPlayer = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [countdown, setCountdown] = useState(3);
  const [paused, setPaused] = useState(false);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [rock, setRock] = useState(72);
  const [pulse, setPulse] = useState(0);
  const [pulseActive, setPulseActive] = useState(false);
  const [judgment, setJudgment] = useState<Judgment | null>(null);
  const [resolvedVersion, setResolvedVersion] = useState(0);
  const [activeHold, setActiveHold] = useState<Note | null>(null);
  const [fingerLane, setFingerLane] = useState(-1);
  const [particles, setParticles] = useState<{ id: number; lane: number; color: string }[]>([]);
  const resolved = useRef(new Set<string>());
  const counts = useRef({ PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 });
  const comboRef = useRef(0); const maxCombo = useRef(0); const scoreRef = useRef(0); const finishing = useRef(false);
  const gameWidth = Math.min(width, 560); const laneWidth = gameWidth / 4; const hitY = height - 152; const travel = height * 0.69;
  const lookahead = 3.1 / settings.noteSpeed;
  const currentTime = Math.max(0, status.currentTime + settings.audioOffset / 1000);

  const spawn = useCallback((lane: number, color: string) => {
    if (settings.performanceMode || settings.reducedParticles) return;
    const id = Date.now() + Math.random(); setParticles(value => [...value.slice(-10), { id, lane, color }]);
    setTimeout(() => setParticles(value => value.filter(item => item.id !== id)), 420);
  }, [settings.performanceMode, settings.reducedParticles]);

  const finish = useCallback(async () => {
    if (!chart || !selectedSong || finishing.current) return; finishing.current = true; player.pause();
    const total = chart.notes.length; const c = counts.current; const remaining = chart.notes.filter(note => !resolved.current.has(note.id)).length; if (remaining) c.MISS += remaining;
    const accuracy = total ? Math.round(((c.PERFECT + c.GREAT * 0.75 + c.GOOD * 0.45) / total) * 10000) / 100 : 0;
    const stars = accuracy >= 97 ? 5 : accuracy >= 90 ? 4 : accuracy >= 78 ? 3 : accuracy >= 60 ? 2 : accuracy > 0 ? 1 : 0;
    const result: ScoreResult = { songId: selectedSong.id, title: selectedSong.title, difficulty: selectedDifficulty, score: scoreRef.current, accuracy, maxCombo: maxCombo.current, stars, perfect: c.PERFECT, great: c.GREAT, good: c.GOOD, miss: c.MISS, totalNotes: total, createdAt: Date.now() };
    await saveResult(result); await gameComplete("Vocotap"); await listen(chart.duration); if (chart.duration > 20) await discoverSong(selectedSong.id); router.replace("/results");
  }, [chart, selectedSong, selectedDifficulty, saveResult, gameComplete, discoverSong, listen, player]);

  useEffect(() => {
    if (!chart || !selectedSong?.uri) return;
    let value = 3; setCountdown(value);
    const timer = setInterval(() => { value -= 1; setCountdown(value); if (value <= 0) { clearInterval(timer); player.seekTo(0); player.play(); } }, 780);
    return () => { clearInterval(timer); player.pause(); };
  }, [chart, selectedSong?.uri, player]);

  useEffect(() => { ensureHitAudio().then(uri => hitPlayer.replace({ uri })).catch(() => {}); }, [hitPlayer]);

  useEffect(() => {
    if (!chart || countdown > 0 || paused || finishing.current) return;
    let missed = false;
    chart.notes.forEach(note => { if (!resolved.current.has(note.id) && currentTime - note.time > 0.42) { resolved.current.add(note.id); counts.current.MISS += 1; comboRef.current = 0; setCombo(0); setRock(value => Math.max(0, value - 8)); setJudgment("MISS"); missed = true; } });
    if (missed) setResolvedVersion(value => value + 1);
    if ((status.didJustFinish || currentTime >= chart.duration - 0.08) && currentTime > 1) finish();
  }, [currentTime, chart, countdown, paused, status.didJustFinish, finish]);

  useEffect(() => { if (rock <= 0 && !settings.noFail) finish(); }, [rock, settings.noFail, finish]);

  useEffect(() => {
    if (!activeHold || !chart || resolved.current.has(`${activeHold.id}-complete`)) return;
    const end = activeHold.time + (activeHold.duration || 0);
    if (currentTime >= end) { resolved.current.add(`${activeHold.id}-complete`); setActiveHold(null); setPulse(value => Math.min(100, value + 12)); spawn(activeHold.lane, laneColors[activeHold.lane]); }
  }, [currentTime, activeHold, chart, spawn]);

  const hitLane = useCallback((lane: number) => {
    if (!chart || countdown > 0 || paused) return;
    const target = chart.notes.filter(note => note.lane === lane && !resolved.current.has(note.id)).sort((a, b) => Math.abs(a.time - currentTime) - Math.abs(b.time - currentTime))[0];
    if (!target) return;
    const delta = Math.abs(target.time - currentTime); if (delta > 0.42) return;
    const grade: Judgment = delta <= 0.12 ? "PERFECT" : delta <= 0.25 ? "GREAT" : "GOOD";
    resolved.current.add(target.id); counts.current[grade] += 1;
    comboRef.current += 1; maxCombo.current = Math.max(maxCombo.current, comboRef.current); setCombo(comboRef.current);
    const multiplier = Math.min(4, 1 + Math.floor(comboRef.current / 10)) * (pulseActive ? 2 : 1);
    scoreRef.current += Math.round(1000 * weights[grade] * multiplier); setScore(scoreRef.current);
    setRock(value => Math.min(100, value + (grade === "PERFECT" ? 3 : 1))); setPulse(value => Math.min(100, value + (target.type === "special" ? 20 : 3)));
    setJudgment(grade); setResolvedVersion(value => value + 1); spawn(lane, laneColors[lane]);
    if (settings.hitSfx) { hitPlayer.seekTo(0); hitPlayer.play(); }
    if (target.type === "hold" || target.type === "wavy") setActiveHold(target);
    if (settings.haptics) Haptics.impactAsync(grade === "PERFECT" ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
  }, [chart, countdown, paused, currentTime, pulseActive, spawn, settings.haptics, settings.hitSfx, hitPlayer]);

  const moveFinger = (pageX: number) => {
    const lane = Math.max(0, Math.min(3, Math.floor(pageX / (width / 4)))); setFingerLane(lane);
    if (activeHold?.type === "wavy") { const expected = Math.max(0, Math.min(3, Math.round(activeHold.lane + Math.sin((currentTime - activeHold.time) * 7) * 1.15))); if (lane === expected) spawn(lane, laneColors[lane]); }
  };
  const activatePulse = () => { if (pulse < 50 || pulseActive) return; setPulseActive(true); setPulse(0); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setTimeout(() => setPulseActive(false), 8000); };
  const togglePause = () => { if (paused) player.play(); else player.pause(); setPaused(!paused); };

  const visibleNotes = useMemo(() => chart?.notes.filter(note => !resolved.current.has(note.id) && note.time - currentTime < lookahead && note.time - currentTime > -0.5) || [], [chart, currentTime, resolvedVersion, lookahead]);
  if (!chart || !selectedSong?.uri) return <SafeAreaView style={styles.missing}><Text style={styles.missingTitle}>Chart not ready</Text><NeonButton testID="game-back-to-library-button" label="Build a chart" icon="analytics" onPress={() => router.replace("/library")} /></SafeAreaView>;

  return <View style={[styles.root, pulseActive && styles.pulseRoot]} testID="gameplay-screen">
    <View style={styles.sky}>{selectedSong.coverArt && <Image testID="gameplay-cover-backdrop" source={typeof selectedSong.coverArt === "number" ? selectedSong.coverArt : { uri: selectedSong.coverArt }} style={styles.coverBackdrop} resizeMode="cover" />}<LinearGradient colors={["rgba(7,7,11,0.12)", `${selectedSong.accent}36`, "rgba(7,7,11,0.92)"]} style={StyleSheet.absoluteFill} /><View style={styles.sun} /><View style={styles.eq}>{chart.waveform.slice(0, 30).map((value, i) => <View key={i} style={[styles.eqBar, { height: 15 + value * 70, opacity: 0.2 + value * 0.4, backgroundColor: i % 3 === 0 ? selectedSong.accent : colors.cyan }]} />)}</View></View>
    <View style={[styles.highway, { width: gameWidth }]} onTouchMove={event => moveFinger(event.nativeEvent.pageX)}>
      {[0, 1, 2, 3, 4].map(line => <View key={line} style={[styles.laneLine, { left: line * laneWidth - 1, transform: [{ rotate: `${(line - 2) * 1.5}deg` }] }]} />)}
      {visibleNotes.map(note => { const ratio = 1 - (note.time - currentTime) / lookahead; const y = Math.max(38, ratio * travel); const scale = 0.42 + ratio * 0.68; const waveLane = note.type === "wavy" ? Math.max(0, Math.min(3, note.lane + Math.sin((currentTime - note.time) * 4) * 0.45)) : note.lane; return <View key={note.id} style={[styles.noteWrap, { left: waveLane * laneWidth + laneWidth * 0.16, top: y, width: laneWidth * 0.68, transform: [{ scale }] }]}>
        {(note.type === "hold" || note.type === "wavy") && <View style={[styles.holdTail, { height: Math.max(34, (note.duration || 0.5) * 76), backgroundColor: `${laneColors[note.lane]}55`, transform: note.type === "wavy" ? [{ rotate: `${Math.sin(y * 0.05) * 18}deg` }] : [] }]} />}
        <View style={[styles.note, { backgroundColor: laneColors[note.lane], shadowColor: laneColors[note.lane] }]}><Ionicons name={note.type === "wavy" ? "water" : note.type === "hold" ? "remove" : note.type === "special" ? "sparkles" : "ellipse"} size={16} color={colors.bg} /></View>
      </View>; })}
      <View style={[styles.hitLine, { top: hitY - (height - travel) }]} />
    </View>
    <SafeAreaView style={styles.hud} edges={["top", "bottom"]} pointerEvents="box-none">
      <View style={styles.topHud}><View><Text style={styles.scoreLabel}>SCORE</Text><Text style={styles.score}>{score.toString().padStart(7, "0")}</Text></View><View style={styles.songHud}><Text style={styles.song} numberOfLines={1}>{selectedSong.title}</Text><Text style={styles.difficulty}>{selectedDifficulty.toUpperCase()}</Text></View><Pressable testID="pause-game-button" onPress={togglePause} style={styles.pause}><Ionicons name="pause" size={21} color={colors.text} /></Pressable></View>
      <View style={styles.judgmentArea} pointerEvents="none">{!!judgment && <Text key={`${judgment}-${currentTime}`} style={[styles.judgment, { color: judgment === "PERFECT" ? colors.cyan : judgment === "MISS" ? colors.pink : colors.lime }]}>{judgment}</Text>}{combo > 1 && <Text style={styles.combo}>{combo}<Text style={styles.comboX}>× COMBO</Text></Text>}</View>
      <View style={styles.bottomHud}>
        <View style={styles.meterRow}><Text style={styles.meterLabel}>ROCK</Text><View style={styles.meter}><View style={[styles.meterFill, { width: `${rock}%`, backgroundColor: rock < 30 ? colors.pink : colors.lime }]} /></View></View>
        <View style={styles.pads}>{laneColors.map((color, lane) => <Pressable key={color} testID={`lane-${lane + 1}-hit-pad`} onPressIn={() => { setFingerLane(lane); hitLane(lane); }} onPressOut={() => { setFingerLane(-1); if (activeHold?.type !== "wavy") setActiveHold(null); }} style={({ pressed }) => [styles.pad, { borderColor: color, backgroundColor: pressed || fingerLane === lane ? `${color}55` : `${color}16` }, pressed && styles.padPressed]}><View style={[styles.padCore, { backgroundColor: color }]} /></Pressable>)}</View>
        <Pressable testID="activate-vocopulse-button" onPress={activatePulse} style={[styles.pulseButton, pulse >= 50 && styles.pulseReady]}><Ionicons name="flash" size={15} color={pulse >= 50 ? colors.bg : colors.cyan} /><Text style={[styles.pulseText, pulse >= 50 && { color: colors.bg }]}>VOCOPULSE {Math.round(pulse)}%</Text></Pressable>
      </View>
    </SafeAreaView>
    {particles.map(item => <View key={item.id} pointerEvents="none" style={[styles.particleBurst, { left: item.lane * laneWidth + laneWidth / 2, borderColor: item.color }]}>{[0,1,2,3,4,5].map(dot => <View key={dot} style={[styles.particle, { backgroundColor: item.color, transform: [{ translateX: (dot - 2.5) * 11 }, { translateY: -Math.abs(dot - 2.5) * 7 }] }]} />)}</View>)}
    {countdown > 0 && <View style={styles.countdown}><Text style={styles.ready}>GET READY</Text><Text style={styles.count}>{countdown}</Text></View>}
    <Modal visible={paused} transparent animationType="fade"><View style={styles.modal}><View style={styles.pauseCard}><Text style={styles.pauseTitle}>PAUSED</Text><Text style={styles.pauseCopy}>The stage is holding your place.</Text><NeonButton testID="resume-game-button" label="Resume" icon="play" onPress={togglePause} /><NeonButton testID="restart-game-button" label="Restart" icon="refresh" variant="secondary" onPress={() => { player.seekTo(0); resolved.current.clear(); counts.current = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 }; scoreRef.current = 0; comboRef.current = 0; setScore(0); setCombo(0); setPaused(false); player.play(); }} /><NeonButton testID="exit-game-button" label="Exit song" icon="close" variant="danger" onPress={() => { player.pause(); router.replace("/library"); }} /></View></View></Modal>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07070B", overflow: "hidden" }, pulseRoot: { backgroundColor: "#08221F" }, sky: { ...StyleSheet.absoluteFillObject, backgroundColor: "#080817", overflow: "hidden" }, coverBackdrop: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", opacity: 0.32, transform: [{ scale: 1.14 }] }, sun: { position: "absolute", top: "20%", alignSelf: "center", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,0,85,0.12)", borderWidth: 2, borderColor: "rgba(255,0,85,0.36)" }, eq: { position: "absolute", left: 0, right: 0, top: "26%", height: 90, flexDirection: "row", alignItems: "center", justifyContent: "space-around" }, eqBar: { width: 4 },
  highway: { position: "absolute", alignSelf: "center", top: 112, bottom: 110, backgroundColor: "rgba(5,8,14,0.86)", borderTopLeftRadius: 150, borderTopRightRadius: 150, overflow: "hidden", transform: [{ perspective: 700 }, { rotateX: "7deg" }] }, laneLine: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: "rgba(13,230,210,0.24)" }, hitLine: { position: "absolute", left: 0, right: 0, height: 5, backgroundColor: colors.text, shadowColor: colors.cyan, shadowRadius: 12, shadowOpacity: 1 },
  noteWrap: { position: "absolute", height: 32, alignItems: "center", justifyContent: "center" }, note: { width: "100%", height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", shadowRadius: 12, shadowOpacity: 1 }, holdTail: { position: "absolute", bottom: 12, width: "48%", borderRadius: 12 },
  hud: { flex: 1, justifyContent: "space-between" }, topHud: { height: 84, paddingHorizontal: 15, paddingTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", backgroundColor: "rgba(7,7,11,0.74)" }, scoreLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 }, score: { color: colors.text, fontSize: 22, fontWeight: "900", letterSpacing: 1 }, songHud: { flex: 1, alignItems: "center", paddingHorizontal: 8 }, song: { color: colors.text, maxWidth: 190, fontSize: 13, fontWeight: "800" }, difficulty: { color: colors.cyan, marginTop: 5, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 }, pause: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)" },
  judgmentArea: { position: "absolute", top: "43%", alignSelf: "center", alignItems: "center" }, judgment: { fontSize: 28, fontWeight: "900", fontStyle: "italic", letterSpacing: 1.3, textShadowColor: "rgba(255,255,255,0.4)", textShadowRadius: 10 }, combo: { color: colors.text, fontSize: 46, lineHeight: 50, fontWeight: "900" }, comboX: { color: colors.muted, fontSize: 10 },
  bottomHud: { paddingHorizontal: 12, gap: 8, backgroundColor: "rgba(7,7,11,0.86)" }, meterRow: { flexDirection: "row", alignItems: "center", gap: 8 }, meterLabel: { color: colors.muted, width: 34, fontSize: 8, fontWeight: "900" }, meter: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.panelStrong, overflow: "hidden" }, meterFill: { height: 6, borderRadius: 3 }, pads: { height: 62, flexDirection: "row", gap: 7 }, pad: { flex: 1, borderRadius: 16, borderWidth: 2, alignItems: "center", justifyContent: "center" }, padPressed: { transform: [{ scale: 0.94 }] }, padCore: { width: 22, height: 8, borderRadius: 4 }, pulseButton: { alignSelf: "center", minHeight: 34, paddingHorizontal: 15, borderRadius: 17, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: colors.cyan, backgroundColor: "rgba(13,230,210,0.10)", marginBottom: 4 }, pulseReady: { backgroundColor: colors.cyan }, pulseText: { color: colors.cyan, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  particleBurst: { position: "absolute", bottom: 128, width: 4, height: 4, borderWidth: 1 }, particle: { position: "absolute", width: 6, height: 6, borderRadius: 3 }, countdown: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,5,8,0.68)", alignItems: "center", justifyContent: "center" }, ready: { color: colors.cyan, fontSize: 14, fontWeight: "900", letterSpacing: 4 }, count: { color: colors.text, fontSize: 104, lineHeight: 120, fontWeight: "900" },
  modal: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", alignItems: "center", justifyContent: "center", padding: 24 }, pauseCard: { width: "100%", maxWidth: 380, padding: 24, borderRadius: 26, gap: 13, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.cyan }, pauseTitle: { color: colors.text, textAlign: "center", fontSize: 34, fontWeight: "900", letterSpacing: 3 }, pauseCopy: { color: colors.muted, textAlign: "center", marginBottom: 8 }, missing: { flex: 1, justifyContent: "center", padding: 24, gap: 20, backgroundColor: colors.bg }, missingTitle: { color: colors.text, fontSize: 28, fontWeight: "900", textAlign: "center" },
});
