import { useState } from "react";
import { motion } from "framer-motion";
import { Star, RotateCcw, Home, ArrowRight, BarChart3, PlusCircle, BookOpen } from "lucide-react";
import { StarliteAmount } from "./Starlite";
import { randomFact } from "../game/facts";
import { artFor } from "../game/config";
import { GameBackground } from "./GameBackground";

const CultureFact = () => {
  const [fact] = useState(randomFact);
  return (
    <motion.div data-testid="culture-fact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
      className="culture-fact mt-4 text-left">
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--ac-hi)]"><BookOpen size={12} /> Did you know?</div>
      <p data-testid="culture-fact-text" className="mt-1 text-[12px] leading-snug text-slate-200">{fact}</p>
    </motion.div>
  );
};

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

const Shell = ({ children, testId, art }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`result-screen ${art ? "bg-app" : "result-overlay"}`} data-testid={testId}>
    {art && <GameBackground art={art} variant="result" />}
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
  <Shell testId="result-modal" art={artFor(cfg)}>
    <div className="eyebrow">{cfg.title}</div>
    <h2 data-testid="result-title" className="font-display text-3xl font-black text-gold">
      {cfg.mode === "colorpop" ? (result.win ? "Board Painted!" : `${result.pct}% Painted`) : result.win ? (cfg.mode === "classic" ? "Level Complete!" : "Blitz Complete!") : cfg.mode === "daily" ? "Nice Try!" : "Level Failed"}
    </h2>
    {cfg.target || cfg.mode === "colorpop" ? <div className="mt-5"><Stars count={result.stars} /></div> : null}
    <div className="mt-6 grid grid-cols-2 gap-3">
      <div className="stat-box"><div className="hud-label">Score</div><div data-testid="result-score" className="font-display text-2xl font-black text-white tabular-nums">{result.score.toLocaleString()}</div></div>
      <div className="stat-box"><div className="hud-label">Earned</div><div data-testid="result-starlites" className="mt-1 text-xl"><StarliteAmount value={result.reward} size={20} /></div></div>
    </div>
    {result.bonus > 0 && <div className="mt-3 text-xs font-bold uppercase tracking-wider text-[var(--ac-hi)]">Blitz Finale +{result.bonus.toLocaleString()} from leftover moves</div>}
    {result.newBest && <div data-testid="result-new-best" className="mt-3 text-xs font-black uppercase tracking-[0.25em] text-emerald-400">New personal best</div>}
    <CultureFact />
    <div className="mt-6 flex flex-col gap-3">
      {onNext && <button data-testid="result-next-btn" onClick={onNext} className="btn-bronze w-full">{cfg.mode === "colorpop" ? "Next Difficulty" : "Next Level"} <ArrowRight size={18} /></button>}
      <div className="grid grid-cols-3 gap-2">
        <button data-testid="result-replay-btn" onClick={onReplay} className="btn-ghost"><RotateCcw size={16} /> Replay</button>
        <button data-testid="result-ranks-btn" onClick={onRanks} className="btn-ghost"><BarChart3 size={16} /> Ranks</button>
        <button data-testid="result-home-btn" onClick={onHome} className="btn-ghost"><Home size={16} /> Home</button>
      </div>
    </div>
  </Shell>
);
