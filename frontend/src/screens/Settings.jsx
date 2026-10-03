import React, { useState } from "react";
import { Volume2, Music, Vibrate, Sparkles, Waves, Eye, Keyboard as KbIcon, Timer, Palette, Globe, Trash2, Link2, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useGame } from "@/game/GameContext";
import * as A from "@/game/audio";
import { Page, Header, SectionTitle } from "@/components/cz/ui";

const SWATCHES = ["#9328ff", "#6366f1", "#60a5fa", "#22d3ee", "#2dd4bf", "#34d399", "#a3e635", "#c3ab69", "#f59e0b", "#fb7185", "#ec4899", "#ef4444"];

const Row = ({ icon: I, title, desc, children, testid }) => (
  <div className="flex items-center gap-3 px-4 py-3.5" data-testid={testid}>
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[.06]"><I size={17} className="cz-text-accent" /></span>
    <div className="min-w-0 flex-1"><p className="text-sm font-extrabold">{title}</p>{desc ? <p className="text-[11px] leading-snug text-white/45">{desc}</p> : null}</div>
    {children}
  </div>
);
const Seg = ({ value, options, onChange, testid }) => (
  <div className="flex gap-1 rounded-xl bg-black/35 p-1" data-testid={testid}>
    {options.map(([v, l]) => (
      <button key={v} type="button" onClick={() => onChange(v)} data-testid={`${testid}-${v}`} className="cz-press rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold"
        style={{ background: value === v ? "var(--accent)" : "transparent", color: value === v ? "var(--accent-ink)" : "rgba(255,255,255,.65)" }}>{l}</button>
    ))}
  </div>
);

export default function Settings() {
  const { save, updateSettings, treeshAccent, resetProgress, toast, isEmbedded } = useGame();
  const s = save.settings;
  const [hex, setHex] = useState(s.customAccent);
  const tog = (k, testid) => <Switch checked={!!s[k]} onCheckedChange={(v) => { updateSettings({ [k]: v }); A.sfxTap(); }} data-testid={testid} className="data-[state=checked]:bg-[var(--accent)]" />;

  return (
    <Page testid="settings-screen">
      <Header title="Settings" sub="Make Chainz yours" testid="settings" />

      <div className="lg:columns-2 lg:gap-6 lg:[&>section:first-child>div:first-child]:mt-0">
      <section className="break-inside-avoid lg:pb-1">
      <SectionTitle>Controls</SectionTitle>
      <div className="cz-card divide-y divide-white/[.06]">
        <Row icon={KbIcon} title="Use system keyboard" desc="Type with your device’s own keyboard instead of the Chainz keyboard" testid="settings-row-system-keyboard">{tog("systemKeyboard", "settings-system-keyboard-toggle")}</Row>
        <Row icon={Vibrate} title="Haptics" desc="Vibrate on links and misses (supported devices)">{tog("haptics", "settings-haptics-toggle")}</Row>
        <Row icon={Globe} title="Online word check" desc="Accept more real related words via Datamuse. Built-in bank is used offline">{tog("onlineWords", "settings-online-toggle")}</Row>
      </div>

      </section>
      <section className="break-inside-avoid lg:pb-1">
      <SectionTitle>Audio</SectionTitle>
      <div className="cz-card divide-y divide-white/[.06]">
        <Row icon={Volume2} title="Sound effects">{tog("sfx", "settings-sfx-toggle")}</Row>
        <Row icon={Music} title="Ambient music" desc="A soft generative soundtrack">{tog("music", "settings-music-toggle")}</Row>
        <div className="px-4 py-4">
          <div className="mb-3 flex items-center justify-between text-sm font-extrabold"><span>Master volume</span><span className="font-num text-white/70" data-testid="settings-volume-value">{s.volume}%</span></div>
          <Slider value={[s.volume]} min={0} max={100} step={5} onValueChange={(v) => updateSettings({ volume: v[0] })} onValueCommit={() => A.sfxCorrect(1)} data-testid="settings-volume-slider" />
        </div>
      </div>

      </section>
      <section className="break-inside-avoid lg:pb-1">
      <SectionTitle>Visuals</SectionTitle>
      <div className="cz-card divide-y divide-white/[.06]">
        <Row icon={Sparkles} title="Particle effects">{tog("particles", "settings-particles-toggle")}</Row>
        <Row icon={Waves} title="Screen shake" desc="Shake the input on a miss">{tog("shake", "settings-shake-toggle")}</Row>
        <Row icon={Eye} title="Reduced motion" desc="Calmer transitions, no background animation">{tog("reducedMotion", "settings-reduced-motion-toggle")}</Row>
        <Row icon={Link2} title="Show chain trail" desc="Your recent links above the prompt">{tog("showTrail", "settings-trail-toggle")}</Row>
        <Row icon={Timer} title="Timer style"><Seg value={s.timerStyle} onChange={(v) => updateSettings({ timerStyle: v })} options={[["ring", "Ring"], ["bar", "Bar"]]} testid="settings-timer-style" /></Row>
        <Row icon={Timer} title="Countdown"><Seg value={s.countdown} onChange={(v) => updateSettings({ countdown: v })} options={[["numeric", "3-2-1"], ["text", "Words"], ["skip", "Skip"]]} testid="settings-countdown-style" /></Row>
      </div>

      </section>
      <section className="break-inside-avoid lg:pb-1">
      <SectionTitle>Theme colour</SectionTitle>
      <div className="cz-card p-4" data-testid="settings-accent">
        <Seg value={s.accentSource} onChange={(v) => updateSettings({ accentSource: v })} options={[["treesh", "Treesh accent"], ["custom", "Custom"]]} testid="settings-accent-source-select" />
        <p className="mt-3 text-xs text-white/50">
          {s.accentSource === "treesh" ? (treeshAccent ? <>Following your Treesh accent <span className="font-bold" style={{ color: treeshAccent }}>{treeshAccent.toUpperCase()}</span>. Change it in Treesh and Chainz updates instantly.</> : "No Treesh accent found on this device. Using Treesh Purple.") : "Pick any colour for Chainz only."}
        </p>
        {s.accentSource === "custom" ? (
          <>
            <div className="mt-3 grid grid-cols-6 gap-2">
              {SWATCHES.map((c) => (
                <button key={c} type="button" onClick={() => { setHex(c); updateSettings({ customAccent: c }); }} aria-label={c} data-testid={`settings-swatch-${c.slice(1)}`}
                  className="cz-press grid aspect-square place-items-center rounded-full" style={{ background: c, boxShadow: s.customAccent === c ? `0 0 0 3px #0b0d12, 0 0 0 5px ${c}` : "none" }}>
                  {s.customAccent === c ? <Check size={16} color="#fff" /> : null}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Palette size={16} className="text-white/50" />
              <input type="color" value={s.customAccent} onChange={(e) => { setHex(e.target.value); updateSettings({ customAccent: e.target.value }); }} data-testid="settings-color-input" className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
              <input value={hex} onChange={(e) => { setHex(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) updateSettings({ customAccent: e.target.value.toLowerCase() }); }} data-testid="settings-hex-input" className="h-9 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 font-mono text-sm uppercase focus:outline-none" />
            </div>
          </>
        ) : null}
      </div>

      </section>
      <section className="break-inside-avoid lg:pb-1">
      <SectionTitle>Data</SectionTitle>
      <div className="cz-card p-4">
        <p className="text-xs leading-relaxed text-white/50">Chainz saves progress on this device (localStorage + IndexedDB). Starlites live in your Treesh wallet{isEmbedded ? " and sync live with Treesh" : ""}. Resetting Chainz never touches your Treesh library, profile or Starlites.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button type="button" data-testid="settings-reset-button" className="cz-press mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--bad)]/40 bg-[var(--bad)]/10 text-sm font-extrabold text-[var(--bad)]"><Trash2 size={16} />Reset Chainz progress</button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-white/10 bg-[#10131b] text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all Chainz progress?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">Trophies, bests, stats, cosmetics and power-ups will be erased. Your settings and Treesh Starlites stay.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="settings-reset-cancel" className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
              <AlertDialogAction data-testid="settings-reset-confirm" className="bg-[var(--bad)] text-white hover:bg-[var(--bad)]/90" onClick={async () => { await resetProgress(); toast({ kind: "info", title: "Chainz progress reset", icon: "Repeat" }); }}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </section>
      </div>
      <p className="mt-6 text-center text-[11px] text-white/35">Chainz v2.0 · Treesh Games · Word data by Datamuse</p>
    </Page>
  );
}
