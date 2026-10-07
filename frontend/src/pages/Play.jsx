import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Loader2 } from "lucide-react";
import { useGame, today } from "@/lib/store";
import { BASE, MODES_BY_ID, POWERUPS } from "@/data/game";
import { buildQuestions } from "@/lib/questions";
import { aiQuestions } from "@/lib/api";
import { sfx } from "@/lib/sound";
import { ModeIcon } from "@/components/game/ModeIcon";
import { Results } from "@/components/game/Results";

const multFor = (combo) => Math.min(5, 1 + Math.floor(combo / 3));
const init = (cfg) => ({ idx: 0, lives: cfg.lives || 0, combo: 0, bestCombo: 0, score: 0, correct: 0, misses: 0, answered: null, hidden: [], time: cfg.global || cfg.timer, over: false, learned: [] });

const HypeBar = ({ combo }) => {
  const m = multFor(combo);
  return (
    <div data-testid="combo-meter" className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-black/40 overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-[var(--eb-a1)] via-[var(--eb-a2)] to-[var(--eb-gold)]" animate={{ width: `${m >= 5 ? 100 : ((combo % 3) / 3) * 100}%` }} />
      </div>
      <span className={`font-mono font-extrabold text-sm ${m >= 5 ? "text-orange-400" : "text-[var(--eb-gold)]"}`}>{m >= 5 ? "FIRE 5x" : `${m}x`}</span>
    </div>
  );
};

const PowerBar = ({ q, g, onUse, cfg }) => {
  const { state } = useGame();
  const can = { fifty: q.options.length > 2 && !g.hidden.length, skip: true, time: true, heart: !!cfg.lives };
  return (
    <div className="flex gap-2 flex-wrap">
      {POWERUPS.map((p) => (
        <button key={p.id} data-testid={`powerup-${p.id}-btn`} disabled={!!g.answered || !can[p.id] || state.powerups[p.id] < 1} onClick={() => onUse(p.id)}
          className="lift flex items-center gap-1.5 px-3 py-2 rounded-full border border-[var(--eb-border)] text-xs font-bold disabled:opacity-30">
          <ModeIcon name={p.icon} className="w-3.5 h-3.5 text-[var(--eb-gold)]" />{p.name}<span className="font-mono text-slate-400">×{state.powerups[p.id]}</span>
        </button>
      ))}
    </div>
  );
};

const Option = ({ text, i, g, q, onPick }) => {
  const picked = g.answered?.choice === i;
  const reveal = g.answered && i === q.answer;
  const cls = reveal ? "border-emerald-400 bg-emerald-500/20" : picked ? "border-red-400 bg-red-500/20 shake" : "border-[var(--eb-border)] hover:bg-[var(--eb-surface2)]";
  if (g.hidden.includes(i)) return <div className="rounded-2xl border border-dashed border-[var(--eb-border)] opacity-20 min-h-[64px]" />;
  return (
    <button data-testid={`quiz-option-button-${i}`} disabled={!!g.answered} onClick={() => onPick(i)}
      className={`lift text-left rounded-2xl border px-5 py-4 min-h-[64px] font-semibold text-base sm:text-lg bg-[var(--eb-surface)] ${cls}`}>
      <span className="font-mono text-xs text-slate-500 mr-3">{String.fromCharCode(65 + i)}</span>{text}
    </button>
  );
};

export default function Play() {
  const { mode } = useParams();
  const cfg = MODES_BY_ID[mode];
  const { state, finishRound, spendPowerup } = useGame();
  const [qs, setQs] = useState(null);
  const [err, setErr] = useState(false);
  const [g, setG] = useState(() => init(cfg || {}));
  const [result, setResult] = useState(null);
  const [run, setRun] = useState(0);
  const fetching = useRef(false);
  const qsRef = useRef(null);
  qsRef.current = qs;

  const load = useCallback(async () => {
    setErr(false); setResult(null); setG(init(cfg)); setQs(null);
    if (cfg.kind !== "ai") return setQs(buildQuestions(cfg.kind));
    try { setQs(await aiQuestions([])); } catch { setErr(true); }
  }, [cfg]);

  useEffect(() => { if (cfg) load(); }, [cfg, load, run]);

  // endless AI: prefetch more
  useEffect(() => {
    if (cfg?.kind !== "ai" || !qs || fetching.current || g.idx < qs.length - 3) return;
    fetching.current = true;
    aiQuestions(qs.map((q) => q.term)).then((more) => setQs((p) => [...p, ...more])).catch(() => {}).finally(() => { fetching.current = false; });
  }, [g.idx, qs, cfg]);

  // timer
  useEffect(() => {
    if (!qs || g.over || (g.answered && !cfg.global)) return;
    const t = setInterval(() => setG((p) => (p.answered && !cfg.global) || p.over ? p : { ...p, time: p.time - 1 }), 1000);
    return () => clearInterval(t);
  }, [qs, g.over, g.answered, cfg]);

  useEffect(() => {
    if (!qs || g.over || g.time > 0) return;
    if (cfg.global) setG((p) => ({ ...p, over: true }));
    else if (!g.answered) pick(-1);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!g.over || result) return;
    const total = cfg.total || null;
    const round = { mode, score: g.score, correct: g.correct, bestCombo: g.bestCombo, perfect: !!total && g.misses === 0 && g.correct === total, learned: g.learned };
    setResult({ ...round, total, reward: finishRound(round) });
  }, [g.over]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cfg || cfg.kind === "flip") return <Navigate to={`${BASE}/modes`} replace />;
  if (cfg.daily && state.dailyDone === today() && !result) {
    return (
      <div data-testid="daily-locked" className="glass rounded-3xl p-8 max-w-lg">
        <div className="font-display text-5xl">PLATE CLEARED</div>
        <p className="text-slate-400 mt-2">You already finished today's Daily Cookout. A fresh plate drops at midnight.</p>
        <Link to={`${BASE}/modes`} className="inline-block mt-6 px-6 py-3 rounded-full bg-[var(--eb-gold)] text-[#0B0914] font-extrabold uppercase">Other modes</Link>
      </div>
    );
  }
  if (result) return <Results {...result} title={cfg.title} onAgain={() => setRun((r) => r + 1)} />;
  if (err) return (
    <div data-testid="ai-error" className="glass rounded-3xl p-8 max-w-lg">
      <div className="font-display text-4xl">THE KITCHEN IS BUSY</div>
      <p className="text-slate-400 mt-2">The AI couldn't cook up questions right now. Try again in a moment.</p>
      <button data-testid="ai-retry-btn" onClick={load} className="mt-6 px-6 py-3 rounded-full bg-[var(--eb-gold)] text-[#0B0914] font-extrabold uppercase">Retry</button>
    </div>
  );
  if (!qs) return <div data-testid="loading-questions" className="flex items-center gap-3 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" />Cooking up fresh questions...</div>;

  const q = qs[Math.min(g.idx, qs.length - 1)];
  const delay = cfg.global ? 450 : 1500;

  function advance(p) {
    const last = (cfg.total && p.idx + 1 >= cfg.total) || p.idx + 1 >= qsRef.current.length || (cfg.lives && p.lives <= 0);
    return last ? { ...p, over: true } : { ...p, idx: p.idx + 1, answered: null, hidden: [], time: cfg.global ? p.time : cfg.timer };
  }

  function pick(i) {
    const right = i === q.answer;
    right ? sfx.correct() : sfx.wrong();
    setG((p) => {
      if (p.answered) return p;
      const combo = right ? p.combo + 1 : 0;
      const gain = right ? 100 * multFor(p.combo) + (cfg.global ? 0 : p.time * 5) : 0;
      return {
        ...p, answered: { choice: i, right }, combo, bestCombo: Math.max(p.bestCombo, combo), score: p.score + gain,
        correct: p.correct + (right ? 1 : 0), misses: p.misses + (right ? 0 : 1),
        lives: !right && cfg.lives ? p.lives - 1 : p.lives,
        learned: right && q.term ? [...p.learned, q.term] : p.learned,
      };
    });
    setTimeout(() => setG((p) => (p.over ? p : advance(p))), delay);
  }

  function applyPowerup(id) {
    if (!spendPowerup(id)) return;
    sfx.coin();
    if (id === "fifty") {
      const wrong = q.options.map((_, i) => i).filter((i) => i !== q.answer).sort(() => Math.random() - 0.5).slice(0, 2);
      setG((p) => ({ ...p, hidden: wrong }));
    } else if (id === "skip") setG((p) => advance(p));
    else if (id === "time") setG((p) => ({ ...p, time: p.time + 10 }));
    else if (id === "heart") setG((p) => ({ ...p, lives: p.lives + 1 }));
  }

  const maxT = cfg.global || cfg.timer;
  return (
    <div data-testid="play-screen" className="max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to={`${BASE}/modes`} data-testid="quit-game-btn" className="p-2 rounded-full border border-[var(--eb-border)] hover:bg-white/5"><X className="w-4 h-4" /></Link>
        <div className="font-display text-2xl">{cfg.title}</div>
        <div className="ml-auto flex items-center gap-4 font-mono text-sm">
          {cfg.lives ? <span data-testid="lives-count" className="flex items-center gap-1 text-[var(--eb-a2)]"><Heart className="w-4 h-4 fill-current" />{g.lives}</span> : null}
          <span data-testid="question-counter" className="text-slate-400">{cfg.total ? `${g.idx + 1}/${cfg.total}` : `#${g.idx + 1}`}</span>
          <span data-testid="score-display" className="text-[var(--eb-gold)] font-extrabold">{g.score.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-black/40 overflow-hidden">
          <div className={`h-full transition-[width] duration-1000 ease-linear ${g.time <= 5 ? "bg-red-500" : "bg-[var(--eb-gold)]"}`} style={{ width: `${Math.min(100, (g.time / maxT) * 100)}%` }} />
        </div>
        <span data-testid="timer-display" className={`font-mono font-extrabold w-10 text-right ${g.time <= 5 ? "text-red-400" : ""}`}>{Math.max(0, g.time)}s</span>
      </div>
      <div className="mt-3"><HypeBar combo={g.combo} /></div>

      <AnimatePresence mode="wait">
        <motion.div key={g.idx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>
          <div className="glass rounded-3xl p-6 sm:p-8 mt-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--eb-a2)]">{q.kind || "AI Remix"}</div>
            <h1 data-testid="question-prompt" className="font-display text-4xl sm:text-5xl leading-tight mt-2">{q.prompt}</h1>
            {q.sub && <p className="text-slate-400 italic mt-2">{q.sub}</p>}
          </div>
          <div className={`grid gap-3 mt-4 ${q.options.length === 2 ? "grid-cols-2" : "sm:grid-cols-2"}`}>
            {q.options.map((o, i) => <Option key={i} text={o} i={i} g={g} q={q} onPick={pick} />)}
          </div>
          {g.answered && (
            <motion.div data-testid="answer-feedback" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`mt-4 rounded-2xl p-4 border ${g.answered.right ? "border-emerald-500/50 bg-emerald-500/10" : "border-red-500/50 bg-red-500/10"}`}>
              <div className="font-display text-2xl">{g.answered.right ? (g.combo >= 5 ? "ON FIRE!" : "THAT'S RIGHT") : g.answered.choice === -1 ? "TIME'S UP" : "NAH, THAT'S CAP"}</div>
              {!cfg.global && <p className="text-sm text-slate-300">{q.explanation}</p>}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6"><PowerBar q={q} g={g} cfg={cfg} onUse={applyPowerup} /></div>
    </div>
  );
}
