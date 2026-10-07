import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { RotateCcw, Megaphone, Bot, User } from "lucide-react";
import { GameHeader, IconBtn } from "@/components/game/GameHeader";
import { PlayingCard, COLOR_HEX } from "@/components/game/PlayingCard";
import { HandFan } from "@/components/game/HandFan";
import { ColorPicker } from "@/components/game/ColorPicker";
import { ResultDialog } from "@/components/game/ResultDialog";
import { Confetti } from "@/components/game/Confetti";
import { SonokoBoard } from "@/components/game/SonokoBoard";
import { generateSudoku } from "@/lib/sudoku";
import { COLORS, BUST, nextId, needed, multFor, makeCard, matches } from "@/lib/sonoko";
import { commitProgress } from "@/lib/progress";
import { sfx } from "@/lib/sound";

const BOTS = {
  easy: { miss: 0.35, err: 0.12, label: "Easy", color: "#34C759", desc: "Ivy is still learning" },
  normal: { miss: 0.15, err: 0.05, label: "Normal", color: "#007AFF", desc: "A fair fight" },
  hard: { miss: 0.03, err: 0, label: "Hard", color: "#FF3B30", desc: "Ivy never misses" },
};
const P = ["You", "Ivy"];
const ON_DISCARD = ["reveal", "skip", "draw2"];
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const empties = (ns) => ns.board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
const draw = (ns) => makeCard(Math.random, ns.board, ns.solution, true);

function newMatch() {
  const { puzzle, solution } = generateSudoku(6, 20);
  const ns = {
    solution, board: puzzle.slice(), given: puzzle.map((v) => v !== 0), cellColors: puzzle.map(() => rnd(COLORS)),
    placedColor: {}, placedBy: {}, hands: [[], []], scores: [0, 0], combos: [0, 0], called: [false, false],
    turn: 0, status: "playing", winner: null, log: "Your turn — match the top card", cardsPlayed: 0, colorMatches: 0,
    top: { id: nextId(), kind: "num", color: rnd(COLORS), value: 1 + Math.floor(Math.random() * 6) },
  };
  for (let k = 0; k < 5; k++) ns.hands.forEach((h) => h.push(draw(ns)));
  return ns;
}

function checkBust(ns) {
  [0, 1].forEach((q) => {
    if (ns.status === "playing" && ns.hands[q].length >= BUST) {
      ns.status = "over";
      ns.winner = 1 - q;
      ns.log = `${P[q]} busted with ${BUST} cards!`;
    }
  });
}

function drawFor(ns, p) {
  ns.hands[p].push(draw(ns));
  ns.combos[p] = 0;
  ns.called[p] = false;
  ns.turn = 1 - p;
  ns.log = `${P[p]} drew a card`;
  checkBust(ns);
}

function resolve(ns, p, card, cell, wildColor) {
  const out = { cells: [], pts: 0, colorMatch: false, extra: false, mistake: false };
  const mult = multFor(ns.combos[p]);
  const take = () => (ns.hands[p] = ns.hands[p].filter((c) => c.id !== card.id));
  const fill = (i, color) => {
    ns.board[i] = ns.solution[i];
    ns.placedColor[i] = color;
    ns.placedBy[i] = p === 0 ? "you" : "bot";
    out.cells.push(i);
  };
  if (card.kind === "num" && card.value !== ns.solution[cell]) {
    ns.combos[p] = 0;
    ns.called[p] = false;
    ns.hands[p].push(draw(ns));
    ns.turn = 1 - p;
    ns.log = `${P[p]} misplaced a ${card.value} — +1 penalty card`;
    out.mistake = true;
    checkBust(ns);
    return out;
  }
  take();
  ns.combos[p]++;
  if (card.kind === "num" || card.kind === "wild") {
    fill(cell, card.kind === "wild" ? wildColor : card.color);
    out.colorMatch = card.kind === "num" && card.color === ns.cellColors[cell];
    out.pts = (out.colorMatch ? 200 : 100) * mult;
    ns.top = card.kind === "wild" ? { ...card, color: wildColor } : card;
    ns.log = `${P[p]} placed a ${ns.solution[cell]}${out.colorMatch ? " — color match!" : ""}`;
  } else {
    ns.top = card;
    if (card.kind === "reveal") {
      const i = rnd(empties(ns));
      fill(i, card.color);
      out.pts = 75 * mult;
      ns.log = `${P[p]} revealed a cell`;
    } else if (card.kind === "skip") {
      out.extra = true;
      ns.log = `${P[p]} played Skip — ${P[1 - p]} loses a turn`;
    } else {
      ns.hands[1 - p].push(draw(ns), draw(ns));
      ns.called[1 - p] = false;
      out.extra = true;
      ns.log = `${P[p]} played +2 — ${P[1 - p]} draws 2`;
    }
  }
  ns.scores[p] += out.pts;
  if (p === 0) {
    ns.cardsPlayed++;
    if (out.colorMatch) ns.colorMatches++;
  }
  const need = needed(ns.board, ns.solution);
  [0, 1].forEach((q) => {
    const burned = ns.hands[q].filter((c) => c.kind === "num" && need[c.value] === 0);
    ns.hands[q] = ns.hands[q].filter((c) => !burned.includes(c));
    ns.scores[q] += burned.length * 25;
  });
  if (ns.board.every((v) => v)) {
    ns.status = "over";
    ns.winner = ns.scores[0] === ns.scores[1] ? "tie" : ns.scores[0] > ns.scores[1] ? 0 : 1;
    return out;
  }
  if (ns.hands[p].length === 0) {
    if (ns.called[p]) {
      const bonus = 500 * multFor(ns.combos[p]);
      ns.scores[p] += bonus;
      ns.log += ` · SONOKO! +${bonus}`;
    }
    for (let k = 0; k < 5; k++) ns.hands[p].push(draw(ns));
  }
  [0, 1].forEach((q) => ns.hands[q].length !== 1 && (ns.called[q] = false));
  ns.turn = out.extra ? p : 1 - p;
  checkBust(ns);
  return out;
}

function botMove(ns, cfg, hard) {
  const hand = ns.hands[1];
  const playable = hand.filter((c) => matches(c, ns.top));
  if (!playable.length || Math.random() < cfg.miss) return drawFor(ns, 1);
  if (hand.length === 1 && Math.random() < 0.85) {
    ns.called[1] = true;
    toast("Ivy: SONOKO!");
  }
  const threat = ns.hands[0].length <= 3;
  const prio = (c) => ({ num: 5, reveal: 4.5, skip: 4, draw2: threat ? 7 : 3, wild: 1 })[c.kind];
  const card = playable.sort((x, y) => prio(y) - prio(x))[0];
  const open = empties(ns);
  let cell = null, color;
  if (card.kind === "num") {
    const right = open.filter((i) => ns.solution[i] === card.value);
    const wrong = open.filter((i) => ns.solution[i] !== card.value);
    if (wrong.length && Math.random() < cfg.err) cell = rnd(wrong);
    else {
      const tinted = right.filter((i) => ns.cellColors[i] === card.color);
      cell = hard && tinted.length ? tinted[0] : rnd(right);
    }
  } else if (card.kind === "wild") {
    cell = rnd(open);
    const counts = {};
    hand.forEach((c) => c.id !== card.id && c.color !== "wild" && (counts[c.color] = (counts[c.color] || 0) + 1));
    color = Object.entries(counts).sort((x, y) => y[1] - x[1])[0]?.[0] || rnd(COLORS);
  }
  return resolve(ns, 1, card, cell, color);
}

const Setup = ({ onStart }) => (
  <div className="w-full max-w-xl mx-auto px-4 py-6 rise">
    <p className="eyebrow">Head-to-head</p>
    <h2 className="font-display font-black uppercase italic text-5xl sm:text-6xl tracking-tight mt-1">Sonoko Versus</h2>
    <p className="text-slate-400 mt-3 text-sm sm:text-base">
      You and Ivy share one grid, one top card and take turns. Each turn: place a matching card on its correct cell, or draw. Skip and +2 cards
      steal an extra turn. Highest score when the grid is full wins — bust at {BUST} cards and you lose.
    </p>
    <div className="mt-8 grid gap-3">
      {Object.entries(BOTS).map(([id, b]) => (
        <button
          key={id}
          type="button"
          data-testid={`versus-difficulty-${id}-button`}
          onClick={() => onStart(id)}
          className="group glass rounded-2xl p-4 flex items-center justify-between text-left transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#1E2640]"
        >
          <div className="flex items-center gap-4">
            <span className="h-12 w-12 rounded-2xl grid place-items-center" style={{ background: b.color }}>
              <Bot className="w-6 h-6 text-[#0B0F19]" />
            </span>
            <div>
              <p className="font-display text-3xl font-black uppercase italic">{b.label}</p>
              <p className="text-slate-400 text-sm">{b.desc}</p>
            </div>
          </div>
          <span className="font-display text-xl font-black uppercase transition-transform duration-200 group-hover:translate-x-1" style={{ color: b.color }}>
            Fight →
          </span>
        </button>
      ))}
    </div>
  </div>
);

const Side = ({ name, icon: Icon, score, combo, cards, called, active, color, testid }) => (
  <div
    data-testid={testid}
    className={`glass rounded-2xl px-3 py-2 transition-[opacity,box-shadow] duration-300 ${active ? "ring-2" : "opacity-70"}`}
    style={active ? { "--tw-ring-color": color, boxShadow: `0 0 24px ${color}55` } : {}}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="font-display font-black uppercase text-lg flex items-center gap-1.5" style={{ color }}>
        <Icon className="w-4 h-4" /> {name}
      </span>
      {called && <span className="text-[10px] font-black bg-[#FFCC00] text-[#0B0F19] rounded px-1.5">SONOKO</span>}
    </div>
    <div className="flex items-end justify-between gap-2">
      <span data-testid={`${testid}-score`} className="font-mono text-xl sm:text-2xl font-extrabold">{score.toLocaleString()}</span>
      <span className="font-mono text-[11px] text-slate-400">x{multFor(combo)} · {cards} cards</span>
    </div>
  </div>
);

export default function VersusGame() {
  const [diff, setDiff] = useState(null);
  const [s, setS] = useState(null);
  const ref = useRef(null);
  const [sel, setSel] = useState(null);
  const [shakeId, setShakeId] = useState(null);
  const [errCell, setErrCell] = useState(null);
  const [pendingWild, setPendingWild] = useState(null);
  const [floaters, setFloaters] = useState([]);
  const [result, setResult] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);

  const commit = (ns) => {
    ref.current = ns;
    setS(ns);
  };

  const start = (d) => {
    setDiff(d);
    setSel(null);
    setResult(null);
    setResultOpen(false);
    commit(newMatch());
  };

  const float = (cells, pts, color) =>
    cells.forEach((i) => {
      const id = nextId();
      setFloaters((f) => [...f, { id, i, text: `+${pts}`, color }]);
      setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 900);
    });

  const finish = (ns) => {
    const won = ns.winner === 0;
    won ? sfx.win() : sfx.lose();
    setResult({
      won,
      title: won ? "You win!" : ns.winner === "tie" ? "Tie game" : "Ivy wins",
      score: won ? ns.scores[0] : 0,
      rows: [["Your score", ns.scores[0].toLocaleString()], ["Ivy's score", ns.scores[1].toLocaleString()], ["Bot level", BOTS[diff].label], ["Cards you played", ns.cardsPlayed]],
      subtitle: ns.log,
    });
    setTimeout(() => setResultOpen(true), 700);
    commitProgress((st, p) => {
      st.modesPlayed.versus = 1;
      st.versusPlayed++;
      st.cardsPlayed += ns.cardsPlayed;
      st.colorMatches += ns.colorMatches;
      if (won) {
        st.versusWins++;
        if (diff === "hard") st.versusHardWins++;
      }
      p.xp += won ? 150 + Math.round(ns.scores[0] / 12) : 30;
    });
  };

  const after = (ns, out, p) => {
    if (out?.mistake) {
      if (p === 0) {
        setErrCell(out.cell);
        setTimeout(() => setErrCell(null), 500);
      }
      sfx.error();
    } else if (out?.cells.length) {
      float(out.cells, out.pts, p === 0 ? "#FFCC00" : "#FF3B30");
      sfx.play();
    } else sfx.draw();
    commit(ns);
    if (ns.status === "over") finish(ns);
  };

  useEffect(() => {
    if (!s || s.status !== "playing" || s.turn !== 1) return;
    const t = setTimeout(() => {
      const ns = structuredClone(ref.current);
      const out = botMove(ns, BOTS[diff], diff === "hard");
      after(ns, out, 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [s]); // eslint-disable-line react-hooks/exhaustive-deps

  const humanPlay = (card, cell, color) => {
    const ns = structuredClone(ref.current);
    const out = resolve(ns, 0, card, cell, color);
    if (out.mistake) {
      out.cell = cell;
      toast.error(`A ${card.value} doesn't go there! +1 penalty card, turn lost`);
    }
    setSel(null);
    after(ns, out, 0);
  };

  const myTurn = s && s.turn === 0 && s.status === "playing";

  const tapCard = (card) => {
    if (!myTurn) return;
    if (!matches(card, s.top)) {
      setShakeId(card.id);
      setTimeout(() => setShakeId(null), 420);
      return sfx.error();
    }
    if (ON_DISCARD.includes(card.kind) && sel?.id === card.id) return humanPlay(card, null);
    setSel(sel?.id === card.id ? null : card);
    sfx.select();
  };

  const tapCell = (i) => {
    if (!myTurn || s.board[i] || !sel || ON_DISCARD.includes(sel.kind)) return;
    if (sel.kind === "wild") return setPendingWild({ card: sel, i });
    humanPlay(sel, i);
  };

  const onDraw = () => {
    if (!myTurn) return;
    const ns = structuredClone(s);
    drawFor(ns, 0);
    setSel(null);
    after(ns, null, 0);
  };

  const callSonoko = () => {
    if (!myTurn) return;
    if (s.hands[0].length !== 1) return toast("Call SONOKO! when you hold exactly 1 card");
    const ns = structuredClone(s);
    ns.called[0] = true;
    commit(ns);
    sfx.call();
    toast.success("SONOKO!");
  };

  if (!s)
    return (
      <div className="min-h-[100dvh] bg-arcade">
        <GameHeader title="Versus" accent="#FF3B30" />
        <Setup onStart={start} />
      </div>
    );

  const hint = !myTurn
    ? s.status === "over" ? "Match over" : "Ivy is thinking…"
    : sel
    ? ON_DISCARD.includes(sel.kind) ? "Tap the card again to play it" : sel.kind === "wild" ? "Tap any empty cell" : `Tap the cell where this ${sel.value} belongs`
    : "Your turn — play a matching card or draw";

  return (
    <div className="min-h-[100dvh] bg-arcade flex flex-col" data-testid="versus-game">
      <Confetti active={s.winner === 0} />
      <GameHeader
        title="Versus"
        accent="#FF3B30"
        right={
          <IconBtn testid="versus-restart-button" label="Restart" onClick={() => start(diff)}>
            <RotateCcw className="w-4 h-4" />
          </IconBtn>
        }
      />
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-3 lg:gap-8 items-start">
        <section className="versus-board-wrap space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Side testid="versus-you" name="You" icon={User} score={s.scores[0]} combo={s.combos[0]} cards={s.hands[0].length} called={s.called[0]} active={s.turn === 0} color="#FFCC00" />
            <Side testid="versus-bot" name={`Ivy · ${BOTS[diff].label}`} icon={Bot} score={s.scores[1]} combo={s.combos[1]} cards={s.hands[1].length} called={s.called[1]} active={s.turn === 1} color="#FF3B30" />
          </div>
          <SonokoBoard
            g={s}
            testid="versus-board"
            cellPrefix="versus-cell"
            floaters={floaters}
            errCell={errCell}
            armed={myTurn && !!sel && !ON_DISCARD.includes(sel.kind)}
            onTap={tapCell}
          />
        </section>
        <aside className="w-full space-y-3">
          <div className="glass rounded-3xl p-3 sm:p-4 flex items-center justify-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-1">
              <PlayingCard faceDown size="md" testid="draw-pile-button" onClick={onDraw} className={myTurn ? "hover:-translate-y-1 transition-transform duration-150" : "opacity-70"} />
              <span className="eyebrow !text-[10px]">Draw</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <AnimatePresence mode="popLayout">
                <motion.div key={s.top.id} initial={{ scale: 1.4, rotate: -14, opacity: 0 }} animate={{ scale: 1, rotate: 4, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                  <PlayingCard card={s.top} size="lg" testid="discard-pile-top-card" />
                </motion.div>
              </AnimatePresence>
              <span className="eyebrow !text-[10px]">Top card</span>
            </div>
            <button
              type="button"
              data-testid="versus-call-button"
              onClick={callSonoko}
              className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full font-display font-black italic uppercase text-sm sm:text-base leading-none border-4 transition-[transform,background-color] duration-200 active:scale-90 ${
                s.called[0] ? "bg-[#34C759] border-white text-[#0B0F19]" : myTurn && s.hands[0].length === 1 ? "bg-[#FFCC00] border-white text-[#0B0F19] animate-glow scale-110" : "bg-white/5 border-white/15 text-slate-400"
              }`}
            >
              <Megaphone className="w-5 h-5 mx-auto mb-0.5" />
              {s.called[0] ? "Called" : "Sonoko!"}
            </button>
          </div>
          <div className="hidden lg:block glass rounded-2xl px-4 py-3 text-center">
            <p data-testid="versus-turn-indicator" className="font-display text-xl font-black uppercase italic" style={{ color: myTurn ? "#FFCC00" : "#FF3B30" }}>
              {s.status === "over" ? (s.winner === 0 ? "You win!" : s.winner === "tie" ? "Tie!" : "Ivy wins") : myTurn ? "Your turn" : "Ivy's turn"}
            </p>
            <p data-testid="versus-log" className="text-xs sm:text-sm text-slate-300">{s.log}</p>
          </div>
          <div className="hidden lg:flex justify-center -space-x-6 py-2" aria-hidden>
            {s.hands[1].slice(0, 10).map((c, k) => (
              <PlayingCard key={c.id} faceDown size="sm" style={{ transform: `rotate(${(k - 4) * 4}deg)` }} />
            ))}
          </div>
        </aside>
      </main>

      <div className="sticky bottom-0 w-full z-20 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/95 to-transparent pt-3 pb-[max(env(safe-area-inset-bottom),8px)]">
        <p data-testid="versus-hint" className={`text-center text-xs sm:text-sm px-4 font-semibold ${myTurn ? "text-[#FFCC00]" : "text-slate-300"}`}>{hint}</p>
        <div className="max-w-3xl mx-auto">
          <HandFan
            cards={s.hands[0]}
            renderCard={(c, i) => (
              <PlayingCard
                card={c}
                size="md"
                testid={`player-hand-card-${i}`}
                selected={sel?.id === c.id}
                dim={!myTurn || !matches(c, s.top)}
                shake={shakeId === c.id}
                onClick={() => tapCard(c)}
                className="lg:hover:-translate-y-3"
              />
            )}
          />
        </div>
        {s.status === "over" && result && !resultOpen && (
          <div className="flex justify-center pb-2">
            <button type="button" data-testid="versus-show-results-button" onClick={() => setResultOpen(true)} className="h-11 px-6 rounded-xl bg-[#FFCC00] text-[#0B0F19] font-black uppercase">
              View results
            </button>
          </div>
        )}
      </div>

      <ColorPicker
        open={!!pendingWild}
        testPrefix="versus-color"
        onPick={(color) => {
          const { card, i } = pendingWild;
          setPendingWild(null);
          humanPlay(card, i, color);
        }}
      />
      {result && (
        <ResultDialog
          open={resultOpen}
          onClose={() => setResultOpen(false)}
          won={result.won}
          title={result.title}
          subtitle={result.subtitle}
          score={result.score}
          rows={result.rows}
          mode="versus"
          onPlayAgain={() => start(diff)}
        />
      )}
    </div>
  );
}
