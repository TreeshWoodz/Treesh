import React from "react";
import { motion } from "framer-motion";
import { Link2, Timer, Flame, Play, ArrowRight } from "lucide-react";
import { useGame } from "@/game/GameContext";
import { MODES, POWERUPS, STARLITE_RULES as R } from "@/game/data";
import { LS } from "@/game/storage";
import { awardStars } from "@/game/treesh";
import { Page, Header, SectionTitle, StarGlyph, Wordmark } from "@/components/cz/ui";
import { Icon } from "@/components/cz/Icon";

const Step = ({ n, title, children, i }) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }} className="cz-card p-4">
    <div className="flex items-center gap-3">
      <span className="font-num grid h-9 w-9 place-items-center rounded-xl text-lg" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>{n}</span>
      <h3 className="font-extrabold">{title}</h3>
    </div>
    <div className="mt-2.5 text-sm leading-relaxed text-white/70">{children}</div>
  </motion.div>
);
const Chip = ({ children, hot }) => <span className={`rounded-xl border px-3 py-1.5 text-sm font-extrabold ${hot ? "border-[var(--accent)] bg-[rgb(var(--accent-rgb)/.18)]" : "border-white/12 bg-white/5"}`}>{children}</span>;

export default function HowTo() {
  const { go, toast, refreshWallet } = useGame();
  const first = !LS.get("chainz_seen_howto", false);
  const done = () => {
    if (first && !LS.get("chainz_welcome_bonus", false)) {
      LS.set("chainz_welcome_bonus", true);
      awardStars(100, "Chainz welcome bonus");
      refreshWallet();
      setTimeout(() => toast({ kind: "star", title: "+100 Starlites", sub: "Welcome gift. Spend it in the Gift Shop", ms: 4200 }), 400);
    }
    LS.set("chainz_seen_howto", true);
    go("home");
  };
  return (
    <Page nav={!first} testid="howto-screen">
      {first ? <div className="pb-2 pt-[max(20px,env(safe-area-inset-top))]"><Wordmark /><p className="mt-4 font-display text-3xl leading-tight">Welcome to the new Chainz.</p></div> : <Header title="How to play" sub="Chainz in 60 seconds" testid="howto" />}
      <div className="mt-3 space-y-3">
        <Step n="1" title="Link a word" i={0}>
          You get a prompt. Type any word that’s connected to it.
          <div className="mt-3 flex flex-wrap items-center gap-2"><Chip>Fire</Chip><Link2 size={16} className="text-white/40" /><Chip hot>Truck</Chip></div>
        </Step>
        <Step n="2" title="Your word becomes the prompt" i={1}>
          That’s the chain. Keep it alive for as long as you can.
          <div className="mt-3 flex flex-wrap items-center gap-2"><Chip>Truck</Chip><Link2 size={16} className="text-white/40" /><Chip hot>Wheel</Chip><Link2 size={16} className="text-white/40" /><Chip hot>Chair</Chip></div>
        </Step>
        <Step n="3" title="Beat the clock, build combos" i={2}>
          <span className="flex items-start gap-2"><Timer size={16} className="mt-0.5 shrink-0 cz-text-accent" />Faster answers score more. Every 5 links in a row raises your multiplier (up to ×5).</span>
          <span className="mt-1.5 flex items-start gap-2"><Flame size={16} className="mt-0.5 shrink-0 text-[#ffd36b]" />Golden words pay double points plus bonus Starlites.</span>
        </Step>
      </div>

      <SectionTitle>Earning Starlites</SectionTitle>
      <div className="cz-card p-4 text-sm" style={{ borderColor: "rgba(255,211,107,.22)" }} data-testid="howto-starlites">
        {[["Each link", `+${R.perLink}`], ["Every 5-link combo", `+${R.comboBonus}`], [`Answer under ${R.speedThreshold}s`, `+${R.speedBonus}`], ["Golden word", `+${R.goldWord}`], ["Run with 5+ links", `+${R.completion}`], ["New personal best", `+${R.personalBest}`], ["First run of the day", `+${R.firstRunOfDay}`], ["Daily Chain (grows with streak)", `+${R.dailyBase}–${R.dailyBase + R.dailyStreakCap}`], ["Trophies", `+${R.tierReward.bronze}–${R.tierReward.platinum}`]].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-1"><span className="text-white/70">{k}</span><span className="flex items-center gap-1 font-extrabold text-[#ffd36b]"><StarGlyph size={12} />{v}</span></div>
        ))}
        <p className="mt-2 text-[11px] text-white/45">In-run Starlites are multiplied by difficulty (up to ×2 on Insane) and mode, then banked into your Treesh wallet when the run ends.</p>
      </div>

      <SectionTitle>Modes</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        {MODES.map((m) => (
          <div key={m.id} className="cz-card p-3"><div className="flex items-center gap-2"><Icon name={m.icon} size={16} className="cz-text-accent" /><p className="text-sm font-extrabold">{m.name}</p></div><p className="mt-1 text-[11px] leading-snug text-white/50">{m.rules[0]}</p></div>
        ))}
      </div>

      <SectionTitle>Power-ups</SectionTitle>
      <div className="cz-card divide-y divide-white/[.06]">
        {POWERUPS.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3"><Icon name={p.icon} size={18} style={{ color: p.color }} /><div><p className="text-sm font-extrabold">{p.name}</p><p className="text-[11px] text-white/50">{p.desc}</p></div></div>
        ))}
      </div>

      <button type="button" onClick={done} data-testid="howto-done-button" className="cz-press cz-focus cz-btn-primary mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-extrabold">
        {first ? <>Claim 100 Starlites &amp; play <ArrowRight size={18} /></> : <><Play size={18} className="fill-current" />Got it</>}
      </button>
    </Page>
  );
}
