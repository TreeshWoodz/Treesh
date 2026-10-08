import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useGame, today } from "@/lib/store";
import { BASE, MODES, TIERS, tierFor } from "@/data/game";
import { ModeIcon } from "@/components/game/ModeIcon";

const testId = (id) => `start-${id.replaceAll("_", "-")}-btn`;

export default function Modes() {
  const { state } = useGame();
  return (
    <div data-testid="modes-page">
      <div className="text-xs uppercase tracking-[0.3em] text-[var(--eb-gold)]">{MODES.length} ways to play</div>
      <h1 className="font-display text-6xl sm:text-7xl mt-1">GAME MODES</h1>
      <p className="text-slate-400 max-w-xl mt-2">Every mode has its own trophy track — Bronze to Platinum. Combos stack your multiplier up to 5x.</p>
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        {MODES.map((m, i) => {
          const best = state.best[m.id] || 0;
          const tier = tierFor(m.id, best);
          const locked = m.daily && state.dailyDone === today();
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass rounded-3xl p-6 flex flex-col lift">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl grid place-items-center bg-[var(--eb-surface2)] text-[var(--eb-gold)]"><ModeIcon name={m.icon} className="w-7 h-7" /></div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[var(--eb-border)] text-[var(--eb-a2)]">{m.badge}</span>
              </div>
              <div className="font-display text-4xl mt-4">{m.title}</div>
              <p className="text-sm text-slate-400 mt-1">{m.blurb}</p>
              <div className="flex items-center gap-3 mt-4 text-xs font-mono text-slate-400">
                <span>BEST {best.toLocaleString()}</span>
                {tier >= 0 && <span className="px-2 py-0.5 rounded-full font-bold" style={{ color: TIERS[tier].color, border: `1px solid ${TIERS[tier].color}` }}>{TIERS[tier].name.toUpperCase()}</span>}
              </div>
              <Link to={locked ? "#" : `${BASE}/play/${m.id}`} data-testid={testId(m.id)} aria-disabled={locked}
                className={`mt-5 flex items-center justify-center gap-2 py-3 rounded-full font-extrabold uppercase tracking-wider ${locked ? "bg-white/5 text-slate-500 pointer-events-none" : "bg-[var(--eb-gold)] text-[var(--eb-on-gold)]"}`}>
                <Play className="w-4 h-4 fill-current" />{locked ? "Done for today" : "Play"}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
