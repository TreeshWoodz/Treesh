import { BoardFit } from "@/components/game/BoardFit";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { RotateCcw, Pencil, Eraser, Lightbulb, Clock, X } from "lucide-react";
import { GameHeader, IconBtn } from "@/components/game/GameHeader";
import { ResultDialog } from "@/components/game/ResultDialog";
import { Confetti } from "@/components/game/Confetti";
import { generateSudoku } from "@/lib/sudoku";
import { commitProgress, fmtTime } from "@/lib/progress";
import { sfx } from "@/lib/sound";

const DIFFS = {
  easy: { holes: 38, base: 1000, label: "Easy", color: "#34C759" },
  medium: { holes: 46, base: 2000, label: "Medium", color: "#007AFF" },
  hard: { holes: 54, base: 3500, label: "Hard", color: "#FF3B30" },
};

const peers = (a, b) => {
  const ra = Math.floor(a / 9), ca = a % 9, rb = Math.floor(b / 9), cb = b % 9;
  return ra === rb || ca === cb || (Math.floor(ra / 3) === Math.floor(rb / 3) && Math.floor(ca / 3) === Math.floor(cb / 3));
};

const Setup = ({ onStart }) => (
  <div className="w-full max-w-xl mx-auto px-4 py-6 rise">
    <p className="eyebrow">Classic mode</p>
    <h2 className="font-display font-black uppercase italic text-5xl sm:text-6xl tracking-tight mt-1">Pure Sudoku</h2>
    <p className="text-slate-400 mt-3">Fill every row, column and 3×3 box with 1–9. Three mistakes and you're out.</p>
    <div className="mt-8 grid gap-3">
      {Object.entries(DIFFS).map(([id, d]) => (
        <button
          key={id}
          type="button"
          data-testid={`sudoku-difficulty-${id}-button`}
          onClick={() => onStart(id)}
          className="group glass rounded-2xl p-4 flex items-center justify-between text-left transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#1E2640]"
        >
          <div className="flex items-center gap-4">
            <span className="h-12 w-2 rounded-full" style={{ background: d.color }} />
            <div>
              <p className="font-display text-3xl font-black uppercase italic">{d.label}</p>
              <p className="text-slate-400 text-sm">{81 - d.holes} clues given</p>
            </div>
          </div>
          <span className="font-display text-xl font-black uppercase transition-transform duration-200 group-hover:translate-x-1" style={{ color: d.color }}>
            Play →
          </span>
        </button>
      ))}
    </div>
  </div>
);

export default function SudokuGame() {
  const [diff, setDiff] = useState(null);
  const [g, setG] = useState(null);
  const [sel, setSel] = useState(null);
  const [notesMode, setNotesMode] = useState(false);
  const [wrong, setWrong] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);

  const start = (d) => {
    const { puzzle, solution } = generateSudoku(9, DIFFS[d].holes);
    setG({ solution, board: puzzle.slice(), given: puzzle.map((v) => v !== 0), notes: Array(81).fill(0), mistakes: 0, hints: 3, status: "playing" });
    setDiff(d);
    setSel(null);
    setSeconds(0);
    setResult(null);
    setResultOpen(false);
  };

  useEffect(() => {
    if (!g || g.status !== "playing") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [g?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const end = (ng, won) => {
    ng.status = won ? "won" : "lost";
    setG(ng);
    const d = DIFFS[diff];
    const score = won ? Math.max(0, d.base + Math.max(0, 3000 - seconds * 2) - ng.mistakes * 200 - (3 - ng.hints) * 300) : 0;
    setResult({
      won, score,
      rows: [["Difficulty", d.label], ["Time", fmtTime(seconds)], ["Mistakes", `${ng.mistakes}/3`], ["Hints used", 3 - ng.hints]],
    });
    setTimeout(() => setResultOpen(true), won ? 700 : 400);
    won ? sfx.win() : sfx.lose();
    commitProgress((s, p) => {
      s.modesPlayed.sudoku = 1;
      s.sudokuPlayed++;
      if (won) {
        s.sudokuWins++;
        if (diff === "hard") s.sudokuHardWins++;
        if (diff === "easy" && seconds < 300) s.sudokuFast++;
        const best = s.sudokuBest[diff];
        s.sudokuBest = { ...s.sudokuBest, [diff]: best ? Math.min(best, seconds) : seconds };
      }
      p.xp += won ? 100 + Math.round(score / 15) : 20;
    });
  };

  const fillCell = (ng, i, v) => {
    ng.board[i] = v;
    ng.notes[i] = 0;
    for (let k = 0; k < 81; k++) if (peers(i, k)) ng.notes[k] &= ~(1 << v);
  };

  const input = (v) => {
    if (!g || g.status !== "playing" || sel === null || g.given[sel] || g.board[sel]) return;
    const ng = { ...g, board: [...g.board], notes: [...g.notes] };
    if (notesMode) {
      ng.notes[sel] ^= 1 << v;
      sfx.select();
      return setG(ng);
    }
    if (v !== g.solution[sel]) {
      ng.mistakes++;
      setWrong({ i: sel, v });
      setTimeout(() => setWrong(null), 700);
      sfx.error();
      if (ng.mistakes >= 3) return end(ng, false);
      toast.error(`Not a ${v}! ${3 - ng.mistakes} mistake${3 - ng.mistakes === 1 ? "" : "s"} left`);
      return setG(ng);
    }
    fillCell(ng, sel, v);
    sfx.play();
    if (ng.board.every((x, k) => x === ng.solution[k])) return end(ng, true);
    setG(ng);
  };

  const erase = () => {
    if (!g || sel === null || g.given[sel] || g.board[sel]) return;
    const notes = [...g.notes];
    notes[sel] = 0;
    setG({ ...g, notes });
  };

  const hint = () => {
    if (!g || g.status !== "playing" || g.hints <= 0) return;
    let i = sel !== null && !g.board[sel] ? sel : g.board.findIndex((v) => v === 0);
    if (i < 0) return;
    const ng = { ...g, board: [...g.board], notes: [...g.notes], hints: g.hints - 1 };
    fillCell(ng, i, g.solution[i]);
    setSel(i);
    sfx.combo();
    if (ng.board.every((x, k) => x === ng.solution[k])) return end(ng, true);
    setG(ng);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (!g) return;
      if (/^[1-9]$/.test(e.key)) input(Number(e.key));
      else if (e.key === "Backspace" || e.key === "Delete") erase();
      else if (e.key.toLowerCase() === "n") setNotesMode((m) => !m);
      else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const cur = sel ?? 0;
        const d = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key];
        setSel((cur + d + 81) % 81);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!g)
    return (
      <div className="min-h-[100dvh] bg-arcade">
        <GameHeader title="Sudoku" accent="#007AFF" />
        <Setup onStart={start} />
      </div>
    );

  const selVal = sel !== null ? g.board[sel] : 0;
  const counts = Array(10).fill(0);
  g.board.forEach((v) => v && counts[v]++);

  return (
    <div className="h-[100dvh] overflow-hidden bg-arcade flex flex-col" data-testid="sudoku-game">
      <Confetti active={g.status === "won"} />
      <GameHeader
        title="Sudoku"
        accent="#007AFF"
        right={
          <IconBtn testid="sudoku-restart-button" label="New puzzle" onClick={() => start(diff)}>
            <RotateCcw className="w-4 h-4" />
          </IconBtn>
        }
      />
      <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-3 sm:px-6 pb-[max(env(safe-area-inset-bottom),8px)] flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[minmax(0,1fr)] lg:gap-8">
        <section className="flex-1 min-h-0 flex flex-col gap-2 lg:h-full">
          <div className="flex items-center justify-between text-sm">
            <span className="font-display text-xl font-black uppercase italic" style={{ color: DIFFS[diff].color }}>{DIFFS[diff].label}</span>
            <span data-testid="sudoku-mistakes" className="font-mono font-bold text-slate-300 flex items-center gap-1">
              <X className="w-4 h-4 text-[#FF3B30]" /> {g.mistakes}/3
            </span>
            <span data-testid="sudoku-timer" className="font-mono font-bold text-slate-300 flex items-center gap-1">
              <Clock className="w-4 h-4 text-[#007AFF]" /> {fmtTime(seconds)}
            </span>
          </div>
          <BoardFit>
          <div data-testid="sudoku-board" className="grid grid-cols-9 aspect-square w-full rounded-2xl overflow-hidden border-2 border-white/30 bg-[#0F1424] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            {g.board.map((v, i) => {
              const r = Math.floor(i / 9), c = i % 9;
              const isSel = sel === i;
              const related = sel !== null && peers(sel, i);
              const same = selVal && v === selVal;
              const isWrong = wrong?.i === i;
              let bg = "transparent";
              if (related) bg = "rgba(255,255,255,0.05)";
              if (same) bg = "rgba(0,122,255,0.28)";
              if (isSel) bg = "rgba(0,122,255,0.5)";
              if (isWrong) bg = "rgba(255,59,48,0.45)";
              return (
                <button
                  key={i}
                  type="button"
                  data-testid={`sudoku-cell-${r}-${c}`}
                  onClick={() => setSel(i)}
                  style={{ background: bg }}
                  className={`relative flex items-center justify-center border-white/[0.08] ${c < 8 ? "border-r" : ""} ${r < 8 ? "border-b" : ""} ${
                    c === 2 || c === 5 ? "!border-r-2 !border-r-white/35" : ""
                  } ${r === 2 || r === 5 ? "!border-b-2 !border-b-white/35" : ""} ${isWrong ? "animate-shake" : ""} transition-colors duration-150`}
                >
                  {isWrong ? (
                    <span className="font-mono font-extrabold text-lg sm:text-2xl text-[#FF3B30]">{wrong.v}</span>
                  ) : v ? (
                    <motion.span
                      initial={g.given[i] ? false : { scale: 0.3 }}
                      animate={{ scale: 1 }}
                      className={`font-mono font-extrabold text-lg sm:text-2xl ${g.given[i] ? "text-slate-200" : "text-[#5AA9FF]"}`}
                    >
                      {v}
                    </motion.span>
                  ) : g.notes[i] ? (
                    <span className="grid grid-cols-3 w-full h-full p-[2px]">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <span key={n} className="font-mono text-[8px] sm:text-[10px] leading-none text-slate-400 flex items-center justify-center">
                          {g.notes[i] & (1 << n) ? n : ""}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          </BoardFit>
        </section>
        <aside className="shrink-0 w-full max-w-[600px] mx-auto space-y-2 lg:space-y-3 lg:self-center">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["notes", Pencil, notesMode ? "Notes on" : "Notes", () => setNotesMode((m) => !m), notesMode],
              ["erase", Eraser, "Erase", erase, false],
              ["hint", Lightbulb, `Hint (${g.hints})`, hint, false],
            ].map(([id, Icon, label, fn, on]) => (
              <button
                key={id}
                type="button"
                data-testid={`sudoku-${id}-button`}
                onClick={fn}
                className={`h-12 lg:h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-xs font-bold border transition-colors duration-150 ${
                  on ? "bg-[#007AFF] border-white/40 text-white" : "glass text-slate-200 hover:bg-[#1E2640]"
                }`}
              >
                <Icon className="w-5 h-5" /> {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-9 lg:grid-cols-3 gap-1.5 lg:gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                data-testid={`sudoku-numpad-${n}`}
                disabled={counts[n] >= 9}
                onClick={() => input(n)}
                className="h-12 lg:h-20 rounded-xl lg:rounded-2xl glass flex flex-col items-center justify-center transition-[transform,background-color] duration-150 hover:bg-[#1E2640] active:scale-90 disabled:opacity-20"
              >
                <span className="font-mono text-2xl lg:text-4xl font-extrabold text-white">{n}</span>
                <span className="text-[9px] lg:text-xs text-slate-500 font-mono">{9 - counts[n]}</span>
              </button>
            ))}
          </div>
          <p className="hidden lg:block text-xs text-slate-500">Keyboard: 1–9 to fill · arrows to move · N for notes · Backspace to erase</p>
          {g.status !== "playing" && result && !resultOpen && (
            <button type="button" data-testid="sudoku-show-results-button" onClick={() => setResultOpen(true)} className="w-full h-11 rounded-xl bg-brand text-brand-ink font-black uppercase">
              View results
            </button>
          )}
        </aside>
      </main>
      {result && (
        <ResultDialog
          open={resultOpen}
          onClose={() => setResultOpen(false)}
          won={result.won}
          title={result.won ? "Solved!" : "Game over"}
          subtitle={result.won ? `${DIFFS[diff].label} cleared in ${fmtTime(seconds)}` : "Three mistakes — try again"}
          score={result.score}
          rows={result.rows}
          mode="sudoku"
          onPlayAgain={() => start(diff)}
        />
      )}
    </div>
  );
}
