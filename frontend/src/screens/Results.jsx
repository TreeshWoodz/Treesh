import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, House, Share2, LayoutGrid, Link2, Crown } from "lucide-react";
import { useGame } from "@/game/GameContext";
import { MODE_BY_ID, DIFFICULTIES, TIER_COLORS, STARLITE_RULES as R, levelFromXp } from "@/game/data";
import { cap } from "@/game/words";
import { Page, StarGlyph, Progress, SectionTitle, fmt } from "@/components/cz/ui";
import { Icon } from "@/components/cz/Icon";

function CountUp({ to, ms = 1100, className, testid }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf; const t0 = performance.now();
    const f = (t) => { const k = Math.min(1, (t - t0) / ms); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <span className={className} data-testid={testid}>{fmt(v)}</span>;
}

export default function Results() {
  const { params, go, save, toast, points } = useGame();
  const r = params.results;
  if (!r) return <Page nav={false} testid="results-screen"><button type="button" onClick={() => go("home")} className="cz-btn-primary mt-20 w-full rounded-2xl py-4 font-extrabold">Back home</button></Page>;
  const mode = MODE_BY_ID[r.mode];
  const diff = DIFFICULTIES[r.difficulty];
  const lv = levelFromXp(save.xp);
  const leveled = lv.level > r.lvlBefore;
  const headline = r.endedBy === "time" ? "Time’s up" : r.endedBy === "ended" ? "Run complete" : r.endedBy === "wrong" ? "Chain snapped" : "Game over";

  const share = async () => {
    const text = `I chained ${r.links} words for ${fmt(r.score)} points in Chainz ${mode.name}${mode.difficulty ? ` (${diff.name})` : ""}! ${r.chain.slice(0, 6).map((c) => cap(c.a)).join(" → ")}${r.chain.length > 6 ? " → …" : ""}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Chainz", text }); return; }
      await navigator.clipboard.writeText(text);
      toast({ kind: "info", title: "Copied to clipboard", sub: "Paste it anywhere to brag", icon: "Sparkles" });
    } catch (e) { /* user cancelled */ }
  };

  return (
    <Page nav={false} testid="results-screen">
      <div className="pt-[max(22px,env(safe-area-inset-top))] text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-white/50">{mode.name}{mode.difficulty ? ` · ${diff.name}` : ""}</p>
        <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="font-display mt-1 text-4xl">{headline}</motion.h1>
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="relative mt-5 overflow-hidden rounded-[28px] border border-white/10 p-6 text-center"
        style={{ background: "radial-gradient(100% 90% at 50% 0%, rgb(var(--accent-rgb) / .35), transparent 60%), #0d0f16" }}>
        {r.newBest ? (
          <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: -6 }} transition={{ delay: 0.9, type: "spring", stiffness: 300, damping: 12 }}
            className="absolute right-4 top-4 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold text-[#1a1406]" style={{ background: "linear-gradient(180deg,#ffe39a,#f5c451)" }} data-testid="results-new-best">
            <Crown size={13} />NEW BEST
          </motion.span>
        ) : null}
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/55">Score</p>
        <CountUp to={r.score} className="font-num block text-6xl leading-tight" testid="results-score" />
        <p className="text-xs text-white/50">{r.prevBest && !r.newBest ? `Best ${fmt(r.prevBest.score)}` : r.newBest && r.prevBest ? `Previous best ${fmt(r.prevBest.score)}` : "\u00a0"}</p>
        <div className="mt-5 grid grid-cols-4 gap-2">
          {[["Links", r.links], ["Best chain", r.bestStreak], ["Speedy", r.fast], ["Misses", r.mistakes]].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-black/30 px-1 py-2.5"><p className="font-num text-xl">{v}</p><p className="text-[10px] font-bold uppercase tracking-wider text-white/45">{k}</p></div>
          ))}
        </div>
      </motion.div>

      {/* Starlites */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }} className="cz-card mt-3 p-5" style={{ borderColor: "rgba(255,211,107,.25)" }} data-testid="results-starlites-earned">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><StarGlyph size={22} /><span className="font-extrabold">Starlites earned</span></div>
          <span className="flex items-center gap-1 text-3xl">+<CountUp to={r.total} ms={1400} className="font-num cz-gold-text" testid="results-starlites-total" /></span>
        </div>
        <div className="mt-3 space-y-1.5">
          {r.breakdown.length ? r.breakdown.map((b, i) => (
            <motion.div key={b.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.12 }} className="flex items-center justify-between text-sm">
              <span className="text-white/75">{b.label}{b.note ? <span className="ml-1.5 text-[11px] text-white/40">{b.note}</span> : null}</span>
              <span className="font-extrabold text-[#ffd36b]">+{b.amount}</span>
            </motion.div>
          )) : <p className="text-sm text-white/50">Link at least one word to earn Starlites.</p>}
        </div>
        <p className="mt-3 text-[11px] text-white/45">
          {r.booster ? "Booster doubled your run earnings. " : ""}{r.capped ? "Daily soft cap reached: run earnings halved. " : ""}
          ×{diff.star} difficulty · ×{mode.starMult} mode. Banked to your Treesh wallet (now {fmt(points)}).
        </p>
      </motion.div>

      {r.trophies && r.trophies.length ? (
        <>
          <SectionTitle>Trophies unlocked</SectionTitle>
          <div className="space-y-2" data-testid="results-trophies">
            {r.trophies.map((t, i) => (
              <motion.div key={t.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6 + i * 0.15 }} className="cz-card flex items-center gap-3 p-3" style={{ borderColor: `${TIER_COLORS[t.tier]}55` }}>
                <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${TIER_COLORS[t.tier]}22`, color: TIER_COLORS[t.tier] }}><Icon name={t.icon} size={20} /></span>
                <div className="min-w-0 flex-1"><p className="truncate font-extrabold">{t.name}</p><p className="truncate text-xs text-white/50">{t.desc}</p></div>
                <span className="text-sm font-extrabold text-[#ffd36b]">+{R.tierReward[t.tier]}</span>
              </motion.div>
            ))}
          </div>
        </>
      ) : null}

      <div className="cz-card mt-3 p-4">
        <div className="flex items-center justify-between text-sm"><span className="font-extrabold">Level {lv.level}{leveled ? <span className="ml-2 rounded-full px-2 py-0.5 text-[10px]" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>LEVEL UP!</span> : null}</span><span className="text-xs font-bold text-white/50">+{fmt(r.xpGained)} XP</span></div>
        <div className="mt-2"><Progress value={lv.pct} /></div>
      </div>

      {r.chain.length ? (
        <>
          <SectionTitle>Your chain</SectionTitle>
          <div className="cz-card flex flex-wrap items-center gap-1.5 p-4" data-testid="results-chain">
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white/60">{cap(r.chain[0].p)}</span>
            {r.chain.map((c, i) => (
              <React.Fragment key={i}>
                <Link2 size={12} className="text-white/30" />
                <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${c.gold ? "border-[#ffd36b]/50 text-[#ffd36b]" : "border-white/10 text-white/85"}`}>{cap(c.a)}{c.full ? <span className="ml-1 text-white/40">({cap(c.full)})</span> : null}</span>
              </React.Fragment>
            ))}
          </div>
        </>
      ) : null}

      <div className="sticky bottom-0 mt-5 grid grid-cols-4 gap-2 pb-[max(14px,env(safe-area-inset-bottom))] pt-3" style={{ background: "linear-gradient(0deg, rgba(7,8,11,1) 60%, rgba(7,8,11,0))" }}>
        <button type="button" onClick={() => go("play", { mode: r.mode, difficulty: r.difficulty, k: Date.now() })} data-testid="results-play-again-button" className="cz-press cz-focus cz-btn-primary col-span-2 flex h-14 items-center justify-center gap-2 rounded-2xl font-extrabold"><RotateCcw size={18} />Play again</button>
        <button type="button" onClick={() => go("modes", { select: r.mode })} data-testid="results-modes-button" aria-label="Modes" className="cz-press cz-focus cz-btn-ghost grid h-14 place-items-center rounded-2xl"><LayoutGrid size={19} /></button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => go("home")} data-testid="results-home-button" aria-label="Home" className="cz-press cz-focus cz-btn-ghost grid h-14 place-items-center rounded-2xl"><House size={18} /></button>
          <button type="button" onClick={share} data-testid="results-share-button" aria-label="Share" className="cz-press cz-focus cz-btn-ghost grid h-14 place-items-center rounded-2xl"><Share2 size={18} /></button>
        </div>
      </div>
    </Page>
  );
}
