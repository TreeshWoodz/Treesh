import { motion } from "framer-motion";
import { Star, RotateCcw, Home, ArrowRight, BarChart3, PlusCircle } from "lucide-react";
import { StarliteAmount } from "./Starlite";

const Stars = ({ count }) => (
  <div className="flex justify-center gap-2" data-testid="result-stars">
    {[1, 2, 3].map((i) => (
      <motion.div key={i} initial={{ scale: 0, rotate: -40 }} animate={{ scale: i <= count ? 1 : 0.8, rotate: 0 }}
        transition={{ delay: 0.25 + i * 0.18, type: "spring", stiffness: 300 }}>
        <Star size={i === 2 ? 56 : 44} className={i <= count ? "fill-[#FFC800] text-[#FFC800] drop-glow" : "text-white/15"} />
      </motion.div>
    ))}
  </div>
);

const Shell = ({ children, testId }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="result-screen bg-app" data-testid={testId}>
    <motion.div initial={{ y: 40, scale: 0.9 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="modal-card w-full max-w-sm text-center">
      {children}
    </motion.div>
  </motion.div>
);

export const ContinueModal = ({ cost, owned, onContinue, onGiveUp }) => (
  <Shell testId="continue-modal">
    <div className="eyebrow">So close</div>
    <h2 className="font-display text-3xl font-black text-white">Out of Moves</h2>
    <p className="mt-3 text-sm text-slate-300">Keep the party going with 5 more moves.</p>
    <button data-testid="continue-btn" onClick={onContinue} className="btn-bronze mt-6 w-full">
      <PlusCircle size={18} /> +5 Moves {owned > 0 ? `(use 1 of ${owned})` : <StarliteAmount value={cost} className="text-[var(--ac-ink)]" />}
    </button>
    <button data-testid="give-up-btn" onClick={onGiveUp} className="btn-ghost mt-3 w-full">Give up</button>
  </Shell>
);

export const ResultModal = ({ cfg, result, onReplay, onNext, onHome, onRanks }) => (
  <Shell testId="result-modal">
    <div className="eyebrow">{cfg.title}</div>
    <h2 data-testid="result-title" className="font-display text-3xl font-black text-gold">
      {result.win ? (cfg.mode === "classic" ? "Level Complete!" : "Blitz Complete!") : cfg.mode === "daily" ? "Nice Try!" : "Level Failed"}
    </h2>
    {cfg.target ? <div className="mt-5"><Stars count={result.stars} /></div> : null}
    <div className="mt-6 grid grid-cols-2 gap-3">
      <div className="stat-box"><div className="hud-label">Score</div><div data-testid="result-score" className="font-display text-2xl font-black text-white tabular-nums">{result.score.toLocaleString()}</div></div>
      <div className="stat-box"><div className="hud-label">Earned</div><div data-testid="result-starlites" className="mt-1 text-xl"><StarliteAmount value={result.reward} size={20} /></div></div>
    </div>
    {result.bonus > 0 && <div className="mt-3 text-xs font-bold uppercase tracking-wider text-[var(--ac-hi)]">Blitz Bonus +{result.bonus.toLocaleString()} for leftover moves</div>}
    {result.newBest && <div data-testid="result-new-best" className="mt-3 text-xs font-black uppercase tracking-[0.25em] text-emerald-400">New personal best</div>}
    <div className="mt-6 flex flex-col gap-3">
      {onNext && <button data-testid="result-next-btn" onClick={onNext} className="btn-bronze w-full">Next Level <ArrowRight size={18} /></button>}
      <div className="grid grid-cols-3 gap-2">
        <button data-testid="result-replay-btn" onClick={onReplay} className="btn-ghost"><RotateCcw size={16} /> Replay</button>
        <button data-testid="result-ranks-btn" onClick={onRanks} className="btn-ghost"><BarChart3 size={16} /> Ranks</button>
        <button data-testid="result-home-btn" onClick={onHome} className="btn-ghost"><Home size={16} /> Home</button>
      </div>
    </div>
  </Shell>
);
