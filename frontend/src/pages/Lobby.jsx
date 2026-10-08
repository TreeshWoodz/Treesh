import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Gift, Flame, Play, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useGame, today } from "@/lib/store";
import { BASE, MODES, rankFor, ACHIEVEMENTS } from "@/data/game";
import { LEXICON } from "@/data/lexicon";
import { Starlite } from "@/components/game/Starlite";
import { ModeIcon } from "@/components/game/ModeIcon";

const HERO = "https://images.unsplash.com/photo-1709510713058-ec6703495efb?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600";
const fade = (i) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08 } });

const Ticker = () => (
  <div className="overflow-hidden border-y border-[var(--eb-border)] py-2 my-8">
    <div className="marquee flex gap-8 whitespace-nowrap w-max">
      {[...LEXICON, ...LEXICON].map((t, i) => (
        <span key={i} className="font-display text-xl text-slate-500">{t.term} <span className="text-[var(--eb-gold)]">✦</span></span>
      ))}
    </div>
  </div>
);

const DailyCard = () => {
  const { state, claimDaily, canClaimDaily } = useGame();
  const claim = () => { const r = claimDaily(); if (r) toast.success(`+${r} Starlites claimed`, { description: "Come back tomorrow to keep the streak alive." }); };
  return (
    <motion.div {...fade(2)} className="glass rounded-3xl p-6 flex flex-col">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400"><Gift className="w-4 h-4 text-[var(--eb-a2)]" />Daily drop</div>
      <div className="font-display text-4xl mt-3">DAY {canClaimDaily ? state.streak.count + 1 : state.streak.count} STREAK</div>
      <p className="text-sm text-slate-400 mt-1">Claim every day. Rewards stack up to day 7, plus a bonus heart each week.</p>
      <button data-testid="claim-daily-reward-btn" disabled={!canClaimDaily} onClick={claim}
        className="lift mt-auto pt-0 mt-5 flex items-center justify-center gap-2 py-3 rounded-full font-extrabold uppercase tracking-wider bg-[var(--eb-a2)] text-white disabled:bg-white/5 disabled:text-slate-500">
        <Starlite className="w-4 h-4" />{canClaimDaily ? "Claim Starlites" : "Claimed — see you tomorrow"}
      </button>
    </motion.div>
  );
};

export default function Lobby() {
  const { state } = useGame();
  const { rank, next, pct } = rankFor(state.xp);
  const dailyDone = state.dailyDone === today();
  return (
    <div data-testid="lobby-page">
      <motion.section {...fade(0)} className="relative overflow-hidden rounded-[2rem] border border-[var(--eb-border)] min-h-[360px] flex items-end">
        <img src={HERO} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--eb-bg)] via-[var(--eb-bg)]/70 to-transparent" />
        <div className="relative p-6 sm:p-10 w-full">
          <div className="text-xs uppercase tracking-[0.35em] text-[var(--eb-gold)]">Treesh Games presents</div>
          <h1 className="font-display text-7xl sm:text-8xl lg:text-9xl leading-[0.85] mt-2">EBON<span className="text-gold-grad">ICS</span></h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-md mt-3">The language. The culture. The game. Prove you speak fluent AAVE — and stack Starlites doing it.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link data-testid="quick-play-btn" to={`${BASE}/play/say_less`} className="lift flex items-center gap-2 px-7 py-3.5 rounded-full bg-[var(--eb-gold)] text-[var(--eb-on-gold)] font-extrabold uppercase tracking-wider gold-glow"><Play className="w-5 h-5 fill-current" />Quick play</Link>
            <Link data-testid="all-modes-btn" to={`${BASE}/modes`} className="lift flex items-center gap-2 px-7 py-3.5 rounded-full border border-[var(--eb-border)] bg-black/30 font-bold">All {MODES.length} modes<ChevronRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </motion.section>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <motion.div {...fade(1)} className="glass rounded-3xl p-6" data-testid="rank-card">
          <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Your rank</div>
          <div className="font-display text-5xl mt-2 text-[var(--eb-gold)]" data-testid="rank-name">{rank.name}</div>
          <div className="h-2 rounded-full bg-black/40 mt-4 overflow-hidden"><div className="h-full bg-gradient-to-r from-[var(--eb-a1)] to-[var(--eb-gold)]" style={{ width: `${pct}%` }} /></div>
          <div className="text-xs font-mono text-slate-400 mt-2">{next ? `${next.xp - state.xp} XP to ${next.name}` : "Max rank reached"}</div>
          <div className="grid grid-cols-3 gap-2 mt-5 text-center">
            {[["Games", state.gamesPlayed], ["Correct", state.totalCorrect], ["Trophies", Object.keys(state.achievements).length + "/" + ACHIEVEMENTS.length]].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-black/25 py-2"><div className="font-mono font-extrabold">{v}</div><div className="text-[10px] uppercase tracking-wider text-slate-500">{l}</div></div>
            ))}
          </div>
        </motion.div>
        <DailyCard />
        <motion.div {...fade(3)}>
          <Link to={`${BASE}/play/daily_cookout`} data-testid="start-daily-cookout-btn" className={`lift block h-full rounded-3xl p-6 border ${dailyDone ? "border-[var(--eb-border)] bg-[var(--eb-surface)]" : "border-[var(--eb-a1)] bg-gradient-to-br from-[var(--eb-a1)]/30 to-[var(--eb-surface)]"}`}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-300"><Flame className="w-4 h-4 text-orange-400" />Daily Cookout</div>
            <div className="font-display text-4xl mt-3">{dailyDone ? "PLATE CLEARED" : "TODAY'S PLATE IS READY"}</div>
            <p className="text-sm text-slate-300 mt-1">{dailyDone ? "You already ate today. New plate drops at midnight." : "5 questions. Same for everybody. Double Starlites."}</p>
            <div className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[var(--eb-gold)]">{dailyDone ? "View" : "Pull up"} <ChevronRight className="w-4 h-4" /></div>
          </Link>
        </motion.div>
      </div>

      <Ticker />

      <h2 className="font-display text-4xl">PICK YOUR GAME</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {MODES.filter((m) => m.id !== "daily_cookout").map((m, i) => (
          <motion.div key={m.id} {...fade(i + 4)} className={i === 0 ? "sm:col-span-2 lg:col-span-1" : ""}>
            <Link to={`${BASE}/play/${m.id}`} data-testid={`lobby-mode-${m.id}`} className="lift glass rounded-3xl p-5 flex items-start gap-4 h-full">
              <div className="w-12 h-12 rounded-2xl grid place-items-center bg-[var(--eb-surface2)] text-[var(--eb-gold)] shrink-0"><ModeIcon name={m.icon} className="w-6 h-6" /></div>
              <div>
                <div className="font-display text-2xl leading-none">{m.title}</div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--eb-a2)] mt-1">{m.badge}</div>
                <p className="text-sm text-slate-400 mt-2">{m.blurb}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
