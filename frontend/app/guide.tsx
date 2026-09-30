import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassCard, NeonButton, ScreenHeader } from "@/src/components/ui";
import { colors, laneColors, fonts } from "@/src/game/theme";

const steps = [
  { icon: "musical-notes" as const, title: "Pick your sound", copy: "Choose a Treesh Music track, replay a Quick Play pick, or import your own audio. Vocotap keeps a private copy on your device and reads the beat right on your phone." },
  { icon: "pulse" as const, title: "Build the chart", copy: "Pick Easy through Expert and the on-device engine lays notes on the real beat with phrasing, long notes and waves. Or craft your own in the Editor." },
  { icon: "game-controller" as const, title: "Own the highway", copy: "Tap notes on the line, hold the tails, trace the waves, keep your streak to fire Vocopulse, then chase Starlites, trophies and the Daily Challenge." },
];

const noteTypes: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; copy: string }[] = [
  { key: "tap", label: "Tap", icon: "ellipse", color: laneColors[0], copy: "A single quick tap on its lane the instant it reaches the glowing receptor. Tighter timing = higher judgment (Perfect / Great / Good)." },
  { key: "hold", label: "Long note", icon: "remove", color: laneColors[1], copy: "Press the head and keep your finger down for the whole glowing tail. Letting go early no longer breaks your combo — it just stops scoring." },
  { key: "wavy", label: "Wavy", icon: "water", color: laneColors[2], copy: "Tap the white head, then DRAG your finger sideways to follow the glowing ribbon as it curves across lanes — its shape traces the exact path it was charted on. A bright spark rides the hit line to show which lane to be in; keep it lit until the wave finishes for a Nice trace bonus." },
];

const modes: { icon: keyof typeof Ionicons.glyphMap; title: string; copy: string; color: string }[] = [
  { icon: "flame", title: "Daily Challenge", color: colors.gold, copy: "A new featured song each day with a 3★ target. Clear it for bonus Starlites — and play on back-to-back days to grow a streak (the bonus climbs from 250 up to 1,000). Every 7th day in a row drops a weekly streak chest with extra Starlites. The home card warns you when today's run is the only thing keeping your streak alive." },
  { icon: "school", title: "Practice mode", color: colors.cyan, copy: "From a song's screen, tap Practice to slow the track to 0.5×, 0.75× or 1× and loop a tricky section: set point A, then point B, and it repeats between them. Practice runs aren't scored — just for drilling." },
  { icon: "share-social", title: "Share & import charts", color: colors.purple, copy: "In the Editor or a custom song's menu, tap Share code to copy a short code or send it with the share sheet. Friends paste it under Library → Customs → Import from code (or just open a shared link) to play your chart instantly — all offline." },
  { icon: "ribbon", title: "Levels, grades & crowns", color: colors.lime, copy: "Every run earns XP to level up (with a Starlite reward each level). Runs are graded S+ / S / A / B / C / D, and each song earns a crown: bronze for a clear, gold for a Full Combo and diamond for All Perfect." },
  { icon: "color-palette", title: "Skin Shop", color: colors.pink, copy: "Spend Starlites on new note skins — Synthwave, Glacier, Toxic, Inferno, Prism and the legendary Midas — that recolour the whole highway." },
  { icon: "trophy", title: "Leaderboards", color: laneColors[3], copy: "Tap the trophy on the home screen to see your personal bests per song and difficulty, then chase your own high scores." },
];

const faqs = [
  ["How does auto-charting work?", "Vocotap listens to the song on your device the first time you pick it (a quick one-time 'analysing' pass), then places notes on the real beats — bass drives the left lanes, treble the right. The result is cached so replays are instant."],
  ["Where are my songs stored?", "Inside Vocotap's private device storage. Audio, charts, scores and Starlites are never uploaded anywhere."],
  ["What is PERFECT+?", "The tightest timing window. Nail it for a score bonus. Great / Good hits also show FAST or SLOW so you know which way to adjust."],
  ["What is Vocopulse?", "A fever meter that fills as you hit 25 notes in a row. When it fires the highway turns gold, the screen shakes and your score doubles — as long as your streak continues. Miss a note and it drains away over 3 seconds, then re-arms after another 25 hits."],
  ["How do I earn Starlites?", "Finish a run to earn Starlites based on your star rating (a 5★ run pays the most). You also get bonus Starlites for combo milestones at 50 / 100 / 200, and for clearing the Daily Challenge (which grows with your streak)."],
  ["What are combo milestones?", "Hit 50, 100 or 200 notes in a row and a celebration pops up with bonus Starlites — keep the chain going for bigger rewards."],
  ["What are Achievements?", "33 trophies you unlock by playing — big combos, 5-star runs, full combos, Expert clears, building custom charts and more. New ones pop up mid-game the moment you earn them. Tap your avatar on the home screen to see them all plus your challenge-history calendar."],
  ["Can I make my own chart?", "Yes. Open the Editor, press Record then Play, and tap the four lanes in time. Hold for long notes, drag sideways for waves, and use two or more fingers to place notes at the same time. Tap Generate rest to auto-fill the remainder, then Share code to send it to friends."],
  ["What is the Customs library?", "Every song you've charted lives under Library → Customs. Tap one to jump straight into play, or use Select to remove charts in bulk. You can also export a chart to a file, share it as a code, or import one."],
  ["Do keyboards work on desktop?", "Yes. On a computer, use D / F / J / K (or the arrow keys) for the four lanes, alongside mouse and touch. You can remap the keys in Settings."],
  ["My taps feel early or late", "Open Settings and use the audio-offset presets — Speaker / Wired / Bluetooth — or the fine slider until your taps land in sync. The active preset is highlighted."],
  ["Where did Neon Warmup go?", "It's now Voco Warmup. If you delete it, you can bring it back any time from Settings → Restore Voco Warmup."],
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

      <Text style={styles.sectionTitle}>MODES & EXTRAS</Text>
      <View style={styles.notes}>
        {modes.map(m => <View key={m.title} style={styles.noteCard}>
          <View style={styles.noteRow}>
            <View style={[styles.noteIcon, { backgroundColor: `${m.color}22`, borderColor: m.color }]}><Ionicons name={m.icon} size={20} color={m.color} /></View>
            <Text style={styles.noteLabel}>{m.title}</Text>
          </View>
          <Text style={styles.noteCopy}>{m.copy}</Text>
        </View>)}
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
  safe: { flex: 1, backgroundColor: "transparent" }, content: { padding: 18, gap: 16, paddingBottom: 40 },
  hero: { alignItems: "center", paddingTop: 6 }, eyebrow: { color: colors.purple, fontSize: 10, letterSpacing: 2, fontFamily: fonts.heavy }, heading: { color: colors.text, fontSize: 28, fontFamily: fonts.display, marginTop: 6 }, dots: { flexDirection: "row", gap: 6, marginTop: 12 }, dot: { width: 18, height: 4, borderRadius: 2, backgroundColor: colors.panelStrong }, dotActive: { width: 34, backgroundColor: colors.purple },
  tutorial: { alignItems: "center", paddingVertical: 22 }, iconRing: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, borderWidth: 1.5 }, stepNumber: { color: colors.muted, fontSize: 9, letterSpacing: 1.4, marginTop: 14, fontFamily: fonts.heavy }, stepTitle: { color: colors.text, fontSize: 22, fontFamily: fonts.display, marginTop: 6 }, stepCopy: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 8, minHeight: 64, fontFamily: fonts.body },
  tutorialButtons: { flexDirection: "row", gap: 10, marginTop: 16 }, circle: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.panelStrong }, next: { height: 48, minWidth: 120, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: colors.purple }, nextText: { color: colors.bg, fontSize: 11, letterSpacing: 1, fontFamily: fonts.heavy },
  sectionTitle: { color: colors.cyan, fontSize: 11, letterSpacing: 2, fontFamily: fonts.arcade, marginTop: 8 }, sectionHint: { color: colors.muted, fontSize: 12, marginTop: -8, fontFamily: fonts.body },
  notes: { gap: 8 }, noteCard: { padding: 14, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, noteRow: { flexDirection: "row", alignItems: "center", gap: 12 }, noteIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 }, noteLabel: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.heavy }, noteCopy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 12, fontFamily: fonts.body },
  faqs: { borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: colors.border }, faq: { padding: 16, backgroundColor: colors.panel, borderBottomWidth: 1, borderBottomColor: colors.border }, faqHead: { minHeight: 26, flexDirection: "row", alignItems: "center", gap: 10 }, question: { color: colors.text, flex: 1, fontSize: 14, fontFamily: fonts.bold }, answer: { color: colors.muted, fontSize: 13, lineHeight: 20, paddingTop: 10, fontFamily: fonts.body },
});
