import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Check } from "lucide-react";
import { LEXICON } from "@/data/lexicon";
import { useGame } from "@/lib/store";

const TYPES = ["all", "slang", "grammar", "culture"];

export default function Lexicon() {
  const { state, learn } = useGame();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const list = useMemo(() => LEXICON.filter((t) => (type === "all" || t.type === type) && (t.term + t.meaning).toLowerCase().includes(q.toLowerCase())), [q, type]);
  return (
    <div data-testid="lexicon-page">
      <div className="text-xs uppercase tracking-[0.3em] text-[var(--eb-gold)]">{state.learned.length}/{LEXICON.length} learned</div>
      <h1 className="font-display text-6xl sm:text-7xl mt-1">THE LEXICON</h1>
      <p className="text-slate-400 max-w-xl mt-2">AAVE is a full, rule-governed language variety. Study the words, the grammar and the culture behind them. Terms you answer right in-game get marked as learned.</p>
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input data-testid="lexicon-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a word or meaning..."
            className="w-full rounded-full bg-[var(--eb-surface)] border border-[var(--eb-border)] pl-11 pr-4 py-3 outline-none focus:border-[var(--eb-gold)]" />
        </div>
        <div className="flex gap-1 p-1 rounded-full border border-[var(--eb-border)] bg-[var(--eb-surface)]">
          {TYPES.map((t) => (
            <button key={t} data-testid={`lexicon-filter-${t}`} onClick={() => setType(t)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${type === t ? "bg-[var(--eb-gold)] text-[var(--eb-on-gold)]" : "text-slate-400"}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {list.map((t, i) => {
          const known = state.learned.includes(t.term);
          return (
            <motion.div key={t.term} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}
              data-testid="lexicon-term-card" className={`glass rounded-3xl p-5 flex flex-col ${known ? "border-[var(--eb-gold)]/60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="font-display text-3xl leading-none">{t.term}</div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--eb-border)] text-[var(--eb-a2)]">{t.type}</span>
              </div>
              <div className="font-semibold mt-2">{t.meaning}</div>
              <div className="text-sm italic text-slate-300 mt-2">"{t.example}"</div>
              <div className="text-xs text-slate-500 mt-2">{t.note}</div>
              <button data-testid={`learn-term-${i}`} disabled={known} onClick={() => learn(t.term)}
                className={`mt-4 self-start flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${known ? "bg-[var(--eb-gold)] text-[var(--eb-on-gold)]" : "border border-[var(--eb-border)] hover:border-[var(--eb-gold)]"}`}>
                <Check className="w-3.5 h-3.5" />{known ? "Learned" : "Mark learned"}
              </button>
            </motion.div>
          );
        })}
      </div>
      {!list.length && <p className="text-slate-400 mt-8" data-testid="lexicon-empty">No terms match that. Try another word.</p>}
    </div>
  );
}
