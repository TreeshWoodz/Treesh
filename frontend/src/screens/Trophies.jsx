import { createPortal } from "react-dom";
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X } from "lucide-react";
import { useGame } from "@/game/GameContext";
import { TROPHIES, TIER_COLORS, STARLITE_RULES as R } from "@/game/data";
import { Page, Header, Progress, fmt } from "@/components/cz/ui";
import { Icon } from "@/components/cz/Icon";

export default function Trophies() {
  const { save } = useGame();
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState(null);
  const rows = useMemo(() => TROPHIES.map((t) => {
    let v = 0; try { v = t.val(save) || 0; } catch (e) { v = 0; }
    return { t, v: Math.min(v, t.goal), done: !!save.trophies[t.id], at: save.trophies[t.id] };
  }), [save]);
  const unlocked = rows.filter((r) => r.done);
  const earned = unlocked.reduce((a, r) => a + R.tierReward[r.t.tier], 0);
  const list = tab === "done" ? unlocked : tab === "todo" ? rows.filter((r) => !r.done).sort((a, b) => b.v / b.t.goal - a.v / a.t.goal) : rows;
  const tiers = ["bronze", "silver", "gold", "platinum"].map((k) => ({ k, n: unlocked.filter((r) => r.t.tier === k).length, of: rows.filter((r) => r.t.tier === k).length }));

  return (
    <Page testid="trophies-screen">
      <Header title="Trophies" sub={`${unlocked.length} of ${TROPHIES.length} unlocked · ${fmt(earned)} Starlites earned`} testid="trophies" />
      <div className="lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-6">
      <div className="cz-card p-4 lg:p-6">
        <div className="flex items-end justify-between">
          <div><p className="font-num text-4xl leading-none" data-testid="trophies-count">{unlocked.length}<span className="text-lg text-white/40">/{TROPHIES.length}</span></p><p className="mt-1 text-xs text-white/50">Collection progress</p></div>
          <div className="flex gap-2">
            {tiers.map((x) => (
              <div key={x.k} className="text-center"><div className="mx-auto h-3 w-3 rounded-full" style={{ background: TIER_COLORS[x.k], boxShadow: `0 0 10px ${TIER_COLORS[x.k]}` }} /><p className="font-num mt-1 text-xs">{x.n}/{x.of}</p></div>
            ))}
          </div>
        </div>
        <div className="mt-3"><Progress value={(unlocked.length / TROPHIES.length) * 100} color="linear-gradient(90deg, var(--accent), #ffd36b)" /></div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-white/[.05] p-1 lg:mt-0" data-testid="trophies-tabs">
        {[["all", "All"], ["todo", "In progress"], ["done", "Unlocked"]].map(([id, l]) => (
          <button key={id} type="button" onClick={() => setTab(id)} data-testid={`trophies-tab-${id}`} className="cz-press relative rounded-xl py-2 text-xs font-extrabold">
            {tab === id ? <motion.span layoutId="trtab" className="absolute inset-0 rounded-xl" style={{ background: "rgb(var(--accent-rgb) / .25)" }} /> : null}
            <span className="relative">{l}</span>
          </button>
        ))}
      </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5 lg:gap-3 xl:grid-cols-6" data-testid="trophies-grid">
        {list.map(({ t, v, done }, i) => {
          const c = TIER_COLORS[t.tier];
          return (
            <motion.button key={t.id} type="button" layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(0.4, i * 0.015) }} onClick={() => setOpen(t.id)} data-testid={`trophy-tile-${t.id}`}
              className="cz-press cz-focus relative flex flex-col items-center rounded-2xl border p-3 text-center" style={{ background: done ? `linear-gradient(180deg, ${c}1f, rgba(255,255,255,.03))` : "rgba(255,255,255,.035)", borderColor: done ? `${c}66` : "rgba(255,255,255,.08)" }}>
              <span className="relative grid h-12 w-12 place-items-center rounded-full" style={{ background: done ? `${c}26` : "rgba(255,255,255,.05)", color: done ? c : "rgba(255,255,255,.35)", boxShadow: done ? `0 0 0 2px ${c}88, 0 0 22px ${c}40` : "inset 0 0 0 1px rgba(255,255,255,.1)" }}>
                <Icon name={t.icon} size={21} />
                {!done ? <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-[#1a1d27] text-white/50"><Lock size={10} /></span> : null}
              </span>
              <p className={`mt-2 line-clamp-2 text-[11px] font-extrabold leading-tight ${done ? "" : "text-white/70"}`}>{t.name}</p>
              <div className="mt-2 w-full"><Progress value={(v / t.goal) * 100} h={3} color={done ? c : "var(--accent)"} /></div>
              <p className="mt-1 text-[10px] font-bold" style={{ color: done ? c : "rgba(255,255,255,.4)" }}>{done ? t.tier.toUpperCase() : `${fmt(v)}/${fmt(t.goal)}`}</p>
            </motion.button>
          );
        })}
      </div>
      {!list.length ? <p className="mt-8 text-center text-sm text-white/50">Nothing here yet. Go play a run!</p> : null}

      {createPortal(<AnimatePresence>
        {open ? (() => {
          const r = rows.find((x) => x.t.id === open); const c = TIER_COLORS[r.t.tier];
          return (
            <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)} data-testid="trophy-detail">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="cz-solid relative w-full max-w-sm p-6 text-center">
                <button type="button" onClick={() => setOpen(null)} aria-label="Close" data-testid="trophy-detail-close" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/5"><X size={16} /></button>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full" style={{ background: `${c}22`, color: r.done ? c : "rgba(255,255,255,.4)", boxShadow: `0 0 0 3px ${c}${r.done ? "aa" : "33"}, 0 0 40px ${c}${r.done ? "55" : "00"}` }}><Icon name={r.t.icon} size={34} /></div>
                <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color: c }}>{r.t.tier}</p>
                <h3 className="font-display mt-1 text-2xl">{r.t.name}</h3>
                <p className="mt-1 text-sm text-white/65">{r.t.desc}</p>
                <div className="mt-4"><Progress value={(r.v / r.t.goal) * 100} color={c} /></div>
                <p className="mt-2 text-xs text-white/50">{r.done ? `Unlocked ${new Date(r.at).toLocaleDateString()}` : `${fmt(r.v)} / ${fmt(r.t.goal)}`} · Reward +{R.tierReward[r.t.tier]} Starlites</p>
              </motion.div>
            </motion.div>
          );
        })() : null}
      </AnimatePresence>, document.body)}
    </Page>
  );
}
