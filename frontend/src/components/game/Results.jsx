import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home, Award } from "lucide-react";
import { BASE, rankFor } from "@/data/game";
import { useGame, playerName } from "@/lib/store";
import { Starlite } from "@/components/game/Starlite";
import { Confetti } from "@/components/game/Confetti";

const Stat = ({ label, value, testid }) => (
  <div className="glass rounded-2xl p-4">
    <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">{label}</div>
    <div data-testid={testid} className="font-mono text-2xl font-extrabold mt-1">{value}</div>
  </div>
);

export const Results = ({ mode, title, score, correct, total, bestCombo, reward, onAgain }) => {
  const { state, profile } = useGame();
  const { rank, next, pct } = rankFor(state.xp);
  const party = reward.isBest || reward.unlocked.length > 0;
  return (
    <motion.div data-testid="results-screen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      {party && <Confetti />}
      <div className="text-xs uppercase tracking-[0.3em] text-[var(--eb-gold)]">{title} · Round over</div>
      <h1 className="font-display text-6xl sm:text-7xl mt-2">{reward.isBest ? "NEW PERSONAL BEST" : correct >= (total || 1) * 0.7 ? "YOU ATE THAT" : "RUN IT BACK"}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
        <Stat label="Score" value={score.toLocaleString()} testid="result-score" />
        <Stat label="Correct" value={total ? `${correct}/${total}` : correct} testid="result-correct" />
        <Stat label="Best combo" value={`${bestCombo}x`} testid="result-combo" />
        <div className="rounded-2xl p-4 border border-[var(--eb-gold)] gold-glow bg-[var(--eb-surface)]">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--eb-gold)]">Starlites</div>
          <div data-testid="result-starlites" className="font-mono text-2xl font-extrabold mt-1 flex items-center gap-1 text-[var(--eb-gold)]"><Starlite className="w-5 h-5" />+{reward.earned}</div>
        </div>
      </div>
      {reward.unlocked.length > 0 && (
        <div className="mt-6 space-y-2" data-testid="result-achievements">
          {reward.unlocked.map((a) => (
            <div key={a.id} className="glass rounded-xl p-3 flex items-center gap-3">
              <Award className="w-6 h-6 text-[var(--eb-gold)]" />
              <div><div className="font-bold">{a.name}</div><div className="text-xs text-slate-400">{a.desc} · +{a.reward} Starlites</div></div>
            </div>
          ))}
        </div>
      )}
      <div className="glass rounded-2xl p-4 mt-6">
        <div className="flex justify-between text-sm"><span className="font-bold">{rank.name}</span><span className="text-slate-400 font-mono">{next ? `${state.xp}/${next.xp} XP` : "MAX"}</span></div>
        <div className="h-2 rounded-full bg-black/40 mt-2 overflow-hidden"><div className="h-full bg-[var(--eb-gold)]" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="flex flex-wrap gap-3 mt-8">
        <button data-testid="play-again-btn" onClick={onAgain} className="lift flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--eb-gold)] text-[#0B0914] font-extrabold uppercase tracking-wider"><RotateCcw className="w-4 h-4" />Run it back</button>
        <Link data-testid="results-modes-btn" to={`${BASE}/modes`} className="lift flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--eb-border)] font-bold"><Trophy className="w-4 h-4" />Other modes</Link>
        <Link data-testid="results-lobby-btn" to={BASE} className="lift flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--eb-border)] font-bold"><Home className="w-4 h-4" />Lobby</Link>
      </div>
      {playerName(profile).length < 2 && <p className="text-xs text-slate-400 mt-4">Add a name on your <Link className="underline text-[var(--eb-gold)]" to={`${BASE}/profile`}>Profile</Link> to post your scores.</p>}
    </motion.div>
  );
};
