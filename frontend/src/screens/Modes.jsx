import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Check, Sparkles, Lock } from "lucide-react";
import { useGame } from "@/game/GameContext";
import { MODES, MODE_BY_ID, DIFFICULTIES, DIFF_ORDER } from "@/game/data";
import { dayKey } from "@/game/storage";
import { Page, Header, StarPill, fmt } from "@/components/cz/ui";
import { Icon } from "@/components/cz/Icon";

export default function Modes() {
  const { save, params, go, commit, points, setBoosterArmed, bankState } = useGame();
  const [sel, setSel] = useState(params.select || save.lastMode || "classic");
  const [diff, setDiff] = useState(save.lastDifficulty || "normal");
  const m = MODE_BY_ID[sel] || MODE_BY_ID.classic;
  const effDiff = m.fixedDifficulty || diff;
  const best = save.bests[m.id];
  const dailyDone = m.id === "daily" && save.daily.lastDate === dayKey();
  const boosters = save.inventory.booster || 0;

  const start = () => {
    commit((d) => { d.lastMode = m.id; if (m.difficulty) d.lastDifficulty = diff; return d; });
    go("play", { mode: m.id, difficulty: effDiff, k: Date.now() });
  };

  return (
    <Page testid="modes-screen">
      <Header title="Choose a mode" sub="Eight ways to chain" right={<StarPill value={points} testid="modes-starlites-balance" onClick={() => go("shop")} />} testid="modes" />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-6">
      <div className="grid grid-cols-2 gap-2.5 lg:gap-3" data-testid="mode-select-grid">
        {MODES.map((x) => {
          const on = x.id === sel;
          return (
            <button key={x.id} type="button" onClick={() => setSel(x.id)} data-testid={`mode-option-${x.id}`} aria-pressed={on}
              className="cz-press cz-focus relative flex items-center gap-2.5 rounded-2xl border p-3 text-left lg:p-4"
              style={{ background: on ? "rgb(var(--accent-rgb) / .16)" : "rgba(255,255,255,.04)", borderColor: on ? "rgb(var(--accent-rgb) / .6)" : "rgba(255,255,255,.08)" }}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: on ? "var(--accent)" : "rgba(255,255,255,.07)", color: on ? "var(--accent-ink)" : "#fff" }}><Icon name={x.icon} size={17} /></span>
              <span className="min-w-0"><span className="block truncate text-sm font-extrabold">{x.name}</span><span className="block truncate text-[10px] font-bold uppercase tracking-wider text-white/45">{x.tag}</span></span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }} className="cz-card mt-4 overflow-hidden p-5 lg:sticky lg:top-28 lg:mt-0 lg:p-7" data-testid="mode-detail">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">{m.name}</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/65">{m.blurb}</p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ background: "var(--accent)", color: "var(--accent-ink)", boxShadow: "0 10px 30px rgb(var(--accent-rgb) / .4)" }}><Icon name={m.icon} size={22} /></span>
          </div>
          <ul className="mt-4 space-y-1.5">
            {m.rules.map((r) => <li key={r} className="flex items-start gap-2 text-sm text-white/80"><Check size={15} className="mt-0.5 shrink-0 cz-text-accent" />{r}</li>)}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="cz-chip px-2.5 py-1">Score ×{m.scoreMult}</span>
            <span className="cz-chip px-2.5 py-1 text-[#ffd36b]">Starlites ×{m.starMult}</span>
            <span className="cz-chip px-2.5 py-1 text-white/70" data-testid="mode-best">{best ? `Best ${fmt(best.score)} · ${best.links} links` : "No best yet"}</span>
          </div>

          <p className="mb-2 mt-5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/50">Difficulty</p>
          <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-black/30 p-1" data-testid="mode-select-difficulty-toggle">
            {DIFF_ORDER.map((id) => {
              const d = DIFFICULTIES[id];
              const on = effDiff === id;
              const locked = !m.difficulty && !on;
              return (
                <button key={id} type="button" disabled={!m.difficulty} onClick={() => setDiff(id)} data-testid={`difficulty-${id}`} aria-pressed={on}
                  className="cz-press cz-focus relative rounded-xl py-2.5 text-xs font-extrabold disabled:cursor-not-allowed" style={{ color: on ? "#0a0a0f" : locked ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.75)" }}>
                  {on ? <motion.span layoutId="diffpill" className="absolute inset-0 rounded-xl" style={{ background: d.color }} /> : null}
                  <span className="relative">{d.name}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-white/45">{!m.difficulty ? (m.id === "daily" ? "Daily Chain always plays on Normal so it’s fair for everyone." : "Zen has no clock, so difficulty doesn’t apply.") : `${DIFFICULTIES[effDiff].time}s per word · ×${DIFFICULTIES[effDiff].mult} score · ×${DIFFICULTIES[effDiff].star} Starlites${DIFFICULTIES[effDiff].hintsOk ? "" : " · no hints"}`}</p>

          <button type="button" disabled={!boosters} onClick={() => setBoosterArmed(!save.boosterArmed)} data-testid="mode-booster-toggle" aria-pressed={save.boosterArmed}
            className="cz-press cz-focus mt-4 flex w-full items-center gap-3 rounded-2xl border p-3 text-left disabled:opacity-50" style={{ borderColor: save.boosterArmed ? "rgba(255,211,107,.6)" : "rgba(255,255,255,.1)", background: save.boosterArmed ? "rgba(255,211,107,.1)" : "rgba(255,255,255,.03)" }}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ffd36b]/15 text-[#ffd36b]">{boosters ? <Sparkles size={17} /> : <Lock size={16} />}</span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">Starlite Booster {save.boosterArmed ? "armed" : ""}</span><span className="block text-[11px] text-white/50">{boosters ? `2× Starlites this run · ${boosters} owned` : "Buy boosters in the Gift Shop"}</span></span>
            <span className={`h-6 w-11 rounded-full p-0.5 transition-colors ${save.boosterArmed ? "bg-[#ffd36b]" : "bg-white/15"}`}><span className={`block h-5 w-5 rounded-full bg-white transition-transform ${save.boosterArmed ? "translate-x-5" : ""}`} /></span>
          </button>

          <button type="button" onClick={start} disabled={bankState !== "ready"} data-testid="mode-select-start-button" className="cz-press cz-focus cz-btn-primary cz-shimmer mt-5 flex h-15 w-full items-center justify-center gap-2 rounded-[20px] py-4 text-lg font-extrabold">
            <Play size={20} className="fill-current" />{dailyDone ? "Practice (already scored today)" : `Start ${m.name}`}
          </button>
        </motion.div>
      </AnimatePresence>
      </div>
    </Page>
  );
}
