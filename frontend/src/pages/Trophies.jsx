import { motion } from "framer-motion";
import { Award, Lock, Trophy } from "lucide-react";
import { useGame } from "@/lib/store";
import { ACHIEVEMENTS, MODES, TIERS, tierFor } from "@/data/game";

const ModeTrophies = ({ m, best }) => {
  const tier = tierFor(m.id, best);
  return (
    <div data-testid={`trophy-track-${m.id}`} className="glass rounded-3xl p-5">
      <div className="flex justify-between items-baseline"><div className="font-display text-2xl">{m.title}</div><div className="font-mono text-xs text-slate-400">BEST {best.toLocaleString()}</div></div>
      <div className="grid grid-cols-4 gap-2 mt-3">
        {TIERS.map((t, i) => (
          <div key={t.name} className={`rounded-2xl p-2 text-center border ${i <= tier ? "" : "opacity-30 border-[var(--eb-border)]"}`} style={i <= tier ? { borderColor: t.color, boxShadow: `0 0 16px ${t.color}40` } : {}}>
            <Trophy className="w-6 h-6 mx-auto" style={{ color: t.color }} />
            <div className="text-[10px] font-bold uppercase mt-1">{t.name}</div>
            <div className="text-[10px] font-mono text-slate-500">{m.tiers[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Trophies() {
  const { state } = useGame();
  const got = Object.keys(state.achievements).length;
  return (
    <div data-testid="trophies-page">
      <div className="text-xs uppercase tracking-[0.3em] text-[var(--eb-gold)]">{got}/{ACHIEVEMENTS.length} achievements</div>
      <h1 className="font-display text-6xl sm:text-7xl mt-1">TROPHY ROOM</h1>
      <div className="h-2 rounded-full bg-black/40 mt-4 overflow-hidden max-w-md"><div className="h-full bg-[var(--eb-gold)]" style={{ width: `${(got / ACHIEVEMENTS.length) * 100}%` }} /></div>

      <h2 className="font-display text-3xl mt-8">ACHIEVEMENTS</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
        {ACHIEVEMENTS.map((a, i) => {
          const on = !!state.achievements[a.id];
          return (
            <motion.div key={a.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.025 }}
              data-testid={`achievement-${a.id}`} data-unlocked={on} className={`rounded-2xl p-4 flex items-center gap-3 border ${on ? "border-[var(--eb-gold)] bg-[var(--eb-surface2)] gold-glow" : "border-[var(--eb-border)] bg-[var(--eb-surface)] opacity-60"}`}>
              <div className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${on ? "bg-[var(--eb-gold)] text-[#0B0914]" : "bg-black/30 text-slate-500"}`}>{on ? <Award className="w-6 h-6" /> : <Lock className="w-5 h-5" />}</div>
              <div><div className="font-bold">{a.name}</div><div className="text-xs text-slate-400">{a.desc}</div><div className="text-[10px] font-mono text-[var(--eb-gold)] mt-0.5">+{a.reward} Starlites</div></div>
            </motion.div>
          );
        })}
      </div>

      <h2 className="font-display text-3xl mt-10">MODE TROPHIES</h2>
      <div className="grid md:grid-cols-2 gap-4 mt-3">{MODES.map((m) => <ModeTrophies key={m.id} m={m} best={state.best[m.id] || 0} />)}</div>
    </div>
  );
}
