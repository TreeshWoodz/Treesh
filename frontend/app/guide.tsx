import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassCard, NeonButton, ScreenHeader } from "@/src/components/ui";
import { colors, laneColors, fonts } from "@/src/game/theme";

const steps = [
  { icon: "musical-notes" as const, title: "Pick your sound", copy: "Choose a Treesh Music track or import an audio file from your device. Vocotap keeps a private copy on your phone." },
  { icon: "pulse" as const, title: "Build the chart", copy: "Pick Easy through Expert and the on-device engine maps the tempo, beat spacing and note shapes. Or record your own in the editor." },
  { icon: "game-controller" as const, title: "Own the highway", copy: "Tap the notes as they hit the line, hold the tails, trace the waves, charge Vocopulse, then chase your best score." },
];

const noteTypes: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; copy: string }[] = [
  { key: "tap", label: "Tap", icon: "ellipse", color: laneColors[0], copy: "A single quick tap on its lane the instant it reaches the glowing receptor. The tighter your timing, the higher the judgment." },
  { key: "hold", label: "Hold", icon: "remove", color: laneColors[1], copy: "Press the head and keep your finger down for the whole glowing tail, then release right as it ends." },
  { key: "wavy", label: "Wavy", icon: "water", color: laneColors[2], copy: "Press the head, then slide your finger across the lanes and follow the wave path with your fingertip until the tail finishes." },
  { key: "slide", label: "Slide", icon: "arrow-forward", color: laneColors[3], copy: "Flick from this lane toward the arrow as the note lands to catch it cleanly." },
  { key: "special", label: "Special", icon: "sparkles", color: colors.purple, copy: "A bonus note. Hit it clean for a big burst of Vocopulse charge and extra flair." },
];

const faqs = [
  ["Where are my songs stored?", "Inside Vocotap's private device storage. Audio, charts, scores and Starlites are never uploaded anywhere."],
  ["What is Vocopulse?", "A meter you charge by hitting notes. At 50% or higher tap it to trigger an eight-second 2X score multiplier with amplified visuals."],
  ["How does the rock meter work?", "It rises with clean hits and drops on misses. If you leave No Fail off and it empties, the run ends early."],
  ["Can I make my own chart?", "Yes. Open the editor, press Record then Play, and tap the four lanes in time. Hold for long notes and drag across lanes for wavy notes."],
  ["Why won't a file play on iPhone?", "Playback depends on the file's internal codec, not just its extension. MP3, AAC/M4A and WAV are the most reliable."],
  ["My taps feel early or late", "Open Calibrate and use the audio offset slider, or the Speaker / Wired / Bluetooth presets, until your taps land in sync."],
  ["How do Starlites carry over?", "Vocotap uses the exact same treesh_stars data as the Treesh website, so your balance and history stay in sync on a shared build."],
];

export default function GuideScreen() {
  const [step, setStep] = useState(0);
  const [openNote, setOpenNote] = useState("tap");
  const [openFaq, setOpenFaq] = useState(0);
  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}><ScreenHeader title="How to Play" />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}><Text style={styles.eyebrow}>60 SECOND TOUR</Text><Text style={styles.heading}>From audio to encore</Text><View style={styles.dots}>{steps.map((_, i) => <View key={i} style={[styles.dot, i === step && styles.dotActive]} />)}</View></View>

      <GlassCard testID="tutorial-step-card" style={styles.tutorial}>
        <View style={[styles.iconRing, { borderColor: laneColors[step % 4] }]}><Ionicons name={steps[step].icon} size={36} color={laneColors[step % 4]} /></View>
        <Text style={styles.stepNumber}>STEP {step + 1} OF 3</Text>
        <Text style={styles.stepTitle}>{steps[step].title}</Text>
        <Text style={styles.stepCopy}>{steps[step].copy}</Text>
        <View style={styles.tutorialButtons}>
          <Pressable testID="tutorial-previous-button" disabled={step === 0} onPress={() => setStep(v => v - 1)} style={[styles.circle, step === 0 && { opacity: 0.25 }]}><Ionicons name="arrow-back" size={20} color={colors.text} /></Pressable>
          <Pressable testID="tutorial-next-button" onPress={() => setStep(v => (v === 2 ? 0 : v + 1))} style={styles.next}><Text style={styles.nextText}>{step === 2 ? "REPLAY" : "NEXT"}</Text><Ionicons name={step === 2 ? "refresh" : "arrow-forward"} size={17} color={colors.bg} /></Pressable>
        </View>
      </GlassCard>

      <Text style={styles.sectionTitle}>NOTE LANGUAGE</Text>
      <Text style={styles.sectionHint}>Tap any note to learn how to play it.</Text>
      <View style={styles.notes}>
        {noteTypes.map(note => { const open = openNote === note.key; return <Pressable key={note.key} testID={`note-type-${note.key}`} onPress={() => setOpenNote(open ? "" : note.key)} style={[styles.noteCard, open && { borderColor: note.color }]}>
          <View style={styles.noteRow}>
            <View style={[styles.noteIcon, { backgroundColor: `${note.color}22`, borderColor: note.color }]}><Ionicons name={note.icon} size={20} color={note.color} /></View>
            <Text style={styles.noteLabel}>{note.label}</Text>
            <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
          </View>
          {open && <Text style={styles.noteCopy}>{note.copy}</Text>}
        </Pressable>; })}
      </View>

      <Text style={styles.sectionTitle}>FAQ</Text>
      <View style={styles.faqs}>{faqs.map(([q, a], i) => <Pressable key={q} testID={`faq-item-${i + 1}`} onPress={() => setOpenFaq(openFaq === i ? -1 : i)} style={styles.faq}>
        <View style={styles.faqHead}><Text style={styles.question}>{q}</Text><Ionicons name={openFaq === i ? "remove" : "add"} size={20} color={colors.purple} /></View>
        {openFaq === i && <Text style={styles.answer}>{a}</Text>}
      </Pressable>)}</View>

      <NeonButton testID="guide-start-playing-button" label="Start playing" icon="play" onPress={() => router.replace("/library")} />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, content: { padding: 18, gap: 16, paddingBottom: 40 },
  hero: { alignItems: "center", paddingTop: 6 }, eyebrow: { color: colors.purple, fontSize: 10, letterSpacing: 2, fontFamily: fonts.heavy }, heading: { color: colors.text, fontSize: 28, fontFamily: fonts.display, marginTop: 6 }, dots: { flexDirection: "row", gap: 6, marginTop: 12 }, dot: { width: 18, height: 4, borderRadius: 2, backgroundColor: colors.panelStrong }, dotActive: { width: 34, backgroundColor: colors.purple },
  tutorial: { alignItems: "center", paddingVertical: 22 }, iconRing: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, borderWidth: 1.5 }, stepNumber: { color: colors.muted, fontSize: 9, letterSpacing: 1.4, marginTop: 14, fontFamily: fonts.heavy }, stepTitle: { color: colors.text, fontSize: 22, fontFamily: fonts.display, marginTop: 6 }, stepCopy: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 8, minHeight: 64, fontFamily: fonts.body },
  tutorialButtons: { flexDirection: "row", gap: 10, marginTop: 16 }, circle: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.panelStrong }, next: { height: 48, minWidth: 120, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: colors.purple }, nextText: { color: colors.bg, fontSize: 11, letterSpacing: 1, fontFamily: fonts.heavy },
  sectionTitle: { color: colors.muted, fontSize: 10, letterSpacing: 1.5, fontFamily: fonts.heavy, marginTop: 8 }, sectionHint: { color: colors.muted, fontSize: 12, marginTop: -8, fontFamily: fonts.body },
  notes: { gap: 8 }, noteCard: { padding: 14, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, noteRow: { flexDirection: "row", alignItems: "center", gap: 12 }, noteIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 }, noteLabel: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.heavy }, noteCopy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 12, fontFamily: fonts.body },
  faqs: { borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: colors.border }, faq: { padding: 16, backgroundColor: colors.panel, borderBottomWidth: 1, borderBottomColor: colors.border }, faqHead: { minHeight: 26, flexDirection: "row", alignItems: "center", gap: 10 }, question: { color: colors.text, flex: 1, fontSize: 14, fontFamily: fonts.bold }, answer: { color: colors.muted, fontSize: 13, lineHeight: 20, paddingTop: 10, fontFamily: fonts.body },
});
