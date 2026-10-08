import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Loader2, Send, ArrowRight, Sparkles } from "lucide-react";
import { FLIP_PROMPTS } from "@/data/content";
import { BASE, MODES_BY_ID } from "@/data/game";
import { shuffle } from "@/lib/questions";
import { judgeFlip } from "@/lib/api";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sound";
import { Results } from "@/components/game/Results";

const cfg = MODES_BY_ID.flip_it;
const pickRounds = () => shuffle(FLIP_PROMPTS).slice(0, cfg.total);

const localJudge = (p, answer) => {
  const a = answer.toLowerCase();
  const hits = p.keys.filter((k) => a.includes(k)).length;
  const score = hits ? Math.min(85, 60 + hits * 15) : Math.min(35, 10 + a.split(" ").length * 3);
  return { score, verdict: hits ? "Solid flip" : "Not quite", feedback: "AI judge was offline, so this was scored by keyword match.", example: "", source: "local" };
};

const Verdict = ({ v }) => (
  <motion.div data-testid="flip-it-verdict" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-3xl p-6 mt-4">
    <div className="flex items-end gap-4">
      <div data-testid="flip-it-score" className={`font-display text-7xl leading-none ${v.score >= 70 ? "text-[var(--eb-gold)]" : "text-slate-300"}`}>{v.score}</div>
      <div className="pb-2"><div className="font-display text-2xl">{v.verdict}</div><div className="text-[10px] uppercase tracking-widest text-slate-500">{v.source === "ai" ? "Judged by Claude AI" : "Offline judge"}</div></div>
    </div>
    <p className="text-sm text-slate-300 mt-3">{v.feedback}</p>
    {v.example && <p className="text-sm mt-2"><span className="text-[var(--eb-a2)] font-bold">Model flip:</span> {v.example}</p>}
  </motion.div>
);

export default function FlipIt() {
  const { finishRound } = useGame();
  const [rounds, setRounds] = useState(pickRounds);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [scores, setScores] = useState([]);
  const [result, setResult] = useState(null);
  const p = rounds[idx];

  const submit = async () => {
    if (!input.trim() || busy) return;
    setBusy(true);
    let v;
    try { v = await judgeFlip({ prompt: p.text, direction: p.dir, answer: input.trim() }); } catch { v = localJudge(p, input); }
    v.score >= 70 ? sfx.correct() : sfx.wrong();
    setVerdict(v); setScores((s) => [...s, v.score]); setBusy(false);
  };

  const next = () => {
    if (idx + 1 < rounds.length) { setIdx(idx + 1); setInput(""); setVerdict(null); return; }
    const score = scores.reduce((a, b) => a + b, 0);
    let combo = 0, best = 0;
    scores.forEach((s) => { combo = s >= 70 ? combo + 1 : 0; best = Math.max(best, combo); });
    const round = { mode: "flip_it", score, correct: scores.filter((s) => s >= 70).length, bestCombo: best, perfect: scores.every((s) => s >= 70), flipBest: Math.max(...scores) };
    setResult({ ...round, total: rounds.length, reward: finishRound(round) });
  };

  const again = () => { setRounds(pickRounds()); setIdx(0); setInput(""); setVerdict(null); setScores([]); setResult(null); };
  if (result) return <Results {...result} title="Flip It" onAgain={again} />;

  return (
    <div data-testid="flip-it-screen" className="max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to={`${BASE}/modes`} data-testid="quit-game-btn" className="p-2 rounded-full border border-[var(--eb-border)] hover:bg-white/5"><X className="w-4 h-4" /></Link>
        <div className="font-display text-2xl">Flip It</div>
        <span className="ml-auto font-mono text-sm text-slate-400" data-testid="question-counter">{idx + 1}/{rounds.length}</span>
        <span className="font-mono text-sm font-extrabold text-[var(--eb-gold)]" data-testid="score-display">{scores.reduce((a, b) => a + b, 0)}</span>
      </div>
      <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 sm:p-8 mt-6">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[var(--eb-a2)]"><Sparkles className="w-3.5 h-3.5" />Flip it into {p.dir === "to_aave" ? "AAVE" : "Standard English"}</div>
        <h1 data-testid="flip-it-prompt" className="font-display text-5xl sm:text-6xl leading-tight mt-3">"{p.text}"</h1>
      </motion.div>
      <div className="mt-4 flex gap-2">
        <input data-testid="flip-it-input" value={input} disabled={!!verdict || busy} maxLength={200} autoFocus
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={p.dir === "to_aave" ? "Say it how we say it..." : "Translate to standard English..."}
          className="flex-1 rounded-2xl bg-[var(--eb-surface)] border border-[var(--eb-border)] px-5 py-4 text-lg outline-none focus:border-[var(--eb-gold)] transition-colors" />
        {!verdict ? (
          <button data-testid="flip-it-submit-btn" onClick={submit} disabled={busy || !input.trim()} className="lift px-6 rounded-2xl bg-[var(--eb-gold)] text-[var(--eb-on-gold)] font-extrabold uppercase disabled:opacity-40 flex items-center gap-2">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}<span className="hidden sm:inline">{busy ? "Judging" : "Flip"}</span>
          </button>
        ) : (
          <button data-testid="flip-it-next-btn" onClick={next} className="lift px-6 rounded-2xl bg-[var(--eb-a2)] text-white font-extrabold uppercase flex items-center gap-2">
            {idx + 1 < rounds.length ? "Next" : "Finish"}<ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
      {busy && <p className="text-sm text-slate-400 mt-3">The judge is listening to your flow...</p>}
      {verdict && <Verdict v={verdict} />}
    </div>
  );
}
