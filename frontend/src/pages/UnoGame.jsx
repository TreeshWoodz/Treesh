import { useEffect, useRef, useState } from "react";
import { StartBar } from "@/components/menu/StartBar";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { RotateCw, RotateCcw, Bot, Megaphone, SkipForward } from "lucide-react";
import { GameHeader, IconBtn } from "@/components/game/GameHeader";
import { PlayingCard, COLOR_HEX } from "@/components/game/PlayingCard";
import { HandFan } from "@/components/game/HandFan";
import { ColorPicker } from "@/components/game/ColorPicker";
import { ResultDialog } from "@/components/game/ResultDialog";
import { Confetti } from "@/components/game/Confetti";
import { newGame, applyPlay, drawInto, canPlay, nextIdx, aiChoose, cardPoints, BOT_NAMES } from "@/lib/uno";
import { commitProgress } from "@/lib/progress";
import { sfx } from "@/lib/sound";

const Setup = ({ onStart }) => {
  const [pick, setPick] = useState(2);
  return (
  <div className="w-full max-w-xl mx-auto px-4 pt-6 pb-40 rise">
    <p className="eyebrow">Classic mode</p>
    <h2 className="font-display font-black uppercase italic text-5xl sm:text-6xl tracking-tight mt-1">Uno vs bots</h2>
    <p className="text-slate-400 mt-3">Match color or number, sling action cards, and don't forget to yell UNO! when you're down to one.</p>
    <div className="mt-8 grid grid-cols-3 gap-3">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          type="button"
          data-testid={`uno-opponents-${n}-button`}
          data-selected={pick === n}
          onClick={() => { setPick(n); sfx.select(); }}
          className="glass rounded-3xl p-5 flex flex-col items-center gap-2 transition-[transform,background-color] duration-200 hover:-translate-y-1 hover:bg-[#1E2640]"
        >
          <div className="flex -space-x-2">
            {Array.from({ length: n }).map((_, k) => (
              <span key={k} className="h-9 w-9 rounded-full grid place-items-center border-2 border-[#161C2E]" style={{ background: Object.values(COLOR_HEX)[k + 1] }}>
                <Bot className="w-4 h-4 text-[#0B0F19]" />
              </span>
            ))}
          </div>
          <p className="font-display text-4xl font-black">{n}</p>
          <p className="eyebrow">{n === 1 ? "Bot" : "Bots"}</p>
        </button>
      ))}
    </div>
    <StartBar onPlay={() => onStart(pick)} label={`${pick} bot${pick > 1 ? "s" : ""}`} />
  </div>
  );
};

const Opponent = ({ s, p }) => {
  const count = s.hands[p].length;
  const active = s.turn === p && s.winner === null;
  return (
    <div data-testid={`uno-opponent-${p}`} className={`glass rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2 flex flex-col items-center gap-1 min-w-0 flex-1 max-w-[150px] transition-[transform,box-shadow] duration-300 ${active ? "ring-2 ring-brand -translate-y-1 shadow-[0_0_24px_rgb(var(--brand-rgb)/0.35)]" : ""}`}>
      <div className="flex items-center gap-1.5">
        <Bot className={`w-4 h-4 ${active ? "text-brand" : "text-slate-400"}`} />
        <span className="font-display font-black uppercase text-lg">{BOT_NAMES[p]}</span>
        {count === 1 && <span className="text-[10px] font-black bg-[#FF3B30] rounded px-1">UNO</span>}
      </div>
      <div className="flex -space-x-5 h-10">
        {Array.from({ length: Math.min(count, 7) }).map((_, k) => (
          <PlayingCard key={k} faceDown size="xs" style={{ transform: `rotate(${(k - 3) * 5}deg)` }} />
        ))}
      </div>
      <span data-testid={`uno-opponent-${p}-count`} className="font-mono text-xs text-slate-300">{count} cards</span>
    </div>
  );
};

export default function UnoGame() {
  const [opp, setOpp] = useState(null);
  const [s, setS] = useState(null);
  const ref = useRef(null);
  const [pendingWild, setPendingWild] = useState(null);
  const [shakeId, setShakeId] = useState(null);
  const [result, setResult] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);

  const commit = (ns) => {
    ref.current = ns;
    setS(ns);
  };

  const start = (n) => {
    setOpp(n);
    setResult(null);
    setResultOpen(false);
    commit(newGame(n));
  };

  const finish = (ns) => {
    const won = ns.winner === 0;
    const pts = won ? ns.hands.reduce((t, h) => t + h.reduce((a, c) => a + cardPoints(c), 0), 0) : 0;
    const score = won ? pts * 10 + opp * 250 : 0;
    won ? sfx.win() : sfx.lose();
    setResult({ won, score, rows: [["Opponents", opp], ["Points in bot hands", pts], ["Cards you played", ns.played]] });
    setTimeout(() => setResultOpen(true), 700);
    commitProgress((st, p) => {
      st.modesPlayed.uno = 1;
      st.unoPlayed++;
      st.cardsPlayed += ns.played;
      if (won) {
        st.unoWins++;
        if (opp === 3) st.uno3Wins++;
      }
      p.xp += won ? 150 + Math.round(score / 20) : 30;
    });
  };

  useEffect(() => {
    if (!s || s.winner !== null || s.turn === 0) return;
    const t = setTimeout(() => {
      const ns = structuredClone(ref.current);
      const p = ns.turn;
      let move = aiChoose(ns, p);
      if (!move) {
        drawInto(ns, p, 1);
        move = aiChoose(ns, p);
        const drawn = ns.hands[p][ns.hands[p].length - 1];
        if (!move || move.card.id !== drawn.id) {
          ns.turn = nextIdx(ns, p);
          ns.log = `${BOT_NAMES[p]} drew a card`;
          sfx.draw();
          return commit(ns);
        }
      }
      applyPlay(ns, p, move.card.id, move.chosen);
      sfx.play();
      if (ns.hands[p].length === 1) toast(`${BOT_NAMES[p]}: UNO!`);
      commit(ns);
      if (ns.winner !== null) finish(ns);
    }, 900);
    return () => clearTimeout(t);
  }, [s]); // eslint-disable-line react-hooks/exhaustive-deps

  const humanPlay = (card, chosen) => {
    const cur = ref.current;
    const ns = structuredClone(cur);
    const forgot = cur.hands[0].length === 2 && !cur.unoCalled;
    applyPlay(ns, 0, card.id, chosen);
    ns.played++;
    ns.unoCalled = false;
    if (forgot && ns.winner === null) {
      drawInto(ns, 0, 2);
      toast.error("You forgot to call UNO! +2 penalty cards");
      sfx.error();
    } else sfx.play();
    commit(ns);
    if (ns.winner !== null) finish(ns);
  };

  const tapCard = (card) => {
    if (s.turn !== 0 || s.winner !== null) return;
    const top = s.discard[s.discard.length - 1];
    const blocked = s.drawnId !== null && card.id !== s.drawnId;
    if (blocked || !canPlay(card, top, s.color)) {
      setShakeId(card.id);
      setTimeout(() => setShakeId(null), 420);
      sfx.error();
      if (blocked) toast("Play the card you just drew, or pass");
      return;
    }
    if (card.color === "wild") return setPendingWild(card);
    humanPlay(card);
  };

  const draw = () => {
    if (s.turn !== 0 || s.winner !== null || s.drawnId !== null) return;
    const ns = structuredClone(s);
    drawInto(ns, 0, 1);
    const c = ns.hands[0][ns.hands[0].length - 1];
    sfx.draw();
    if (canPlay(c, ns.discard[ns.discard.length - 1], ns.color)) {
      ns.drawnId = c.id;
      ns.log = "You drew a playable card — play it or pass";
    } else {
      ns.turn = nextIdx(ns, 0);
      ns.log = "You drew a card";
    }
    commit(ns);
  };

  const pass = () => {
    if (s.turn !== 0 || s.drawnId === null) return;
    commit({ ...structuredClone(s), drawnId: null, turn: nextIdx(s, 0), log: "You passed" });
  };

  const callUno = () => {
    if (s.turn !== 0 || s.winner !== null) return;
    if (s.hands[0].length > 2) return toast("Call UNO! when you have 2 cards or fewer");
    commit({ ...structuredClone(s), unoCalled: true });
    sfx.call();
    toast.success("UNO!");
  };

  if (!s)
    return (
      <div className="min-h-[100dvh] bg-arcade">
        <GameHeader title="Classic Uno" accent="#FF3B30" />
        <Setup onStart={start} />
      </div>
    );

  const top = s.discard[s.discard.length - 1];
  const myTurn = s.turn === 0 && s.winner === null;
  const hand = s.hands[0];

  return (
    <div className="h-[100dvh] overflow-hidden bg-arcade flex flex-col" data-testid="uno-game">
      <Confetti active={s.winner === 0} />
      <GameHeader
        title="Classic Uno"
        accent="#FF3B30"
        right={
          <IconBtn testid="uno-restart-button" label="Restart" onClick={() => start(opp)}>
            <RotateCcw className="w-4 h-4" />
          </IconBtn>
        }
      />
      <main className="flex-1 min-h-0 w-full max-w-5xl mx-auto px-3 sm:px-6 flex flex-col gap-3 sm:gap-5 pt-1">
        <div className="shrink-0 flex justify-center gap-2 sm:gap-4">
          {s.hands.slice(1).map((_, k) => (
            <Opponent key={k} s={s} p={k + 1} />
          ))}
        </div>

        <div className="flex-1 min-h-0 glass rounded-[2rem] p-3 sm:p-8 flex flex-col items-center justify-center gap-2 sm:gap-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${COLOR_HEX[s.color]}, transparent 65%)` }} />
          <div className="relative flex items-center gap-6 sm:gap-10">
            <div className="flex flex-col items-center gap-1">
              <PlayingCard
                faceDown
                size="pile"
                testid="draw-pile-button"
                onClick={draw}
                className={myTurn && s.drawnId === null ? "hover:-translate-y-1 transition-transform duration-150 ring-2 ring-white/40" : "opacity-80"}
              />
              <span className="eyebrow !text-[10px]">Draw · {s.deck.length}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <AnimatePresence mode="popLayout">
                <motion.div key={top.id} initial={{ scale: 1.5, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 5, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                  <PlayingCard card={top} size="pile" testid="discard-pile-top-card" />
                </motion.div>
              </AnimatePresence>
              <span className="eyebrow !text-[10px]">Discard</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div data-testid="uno-current-color" className="h-10 w-10 rounded-full border-4 border-white shadow-lg" style={{ background: COLOR_HEX[s.color] }} title={s.color} />
              <motion.div data-testid="uno-direction" animate={{ rotate: s.dir === 1 ? 0 : 180 }} className="text-slate-300">
                {s.dir === 1 ? <RotateCw className="w-7 h-7" /> : <RotateCcw className="w-7 h-7" />}
              </motion.div>
            </div>
          </div>
          <p data-testid="uno-turn-indicator" className={`relative font-display text-2xl sm:text-3xl font-black uppercase italic ${myTurn ? "text-brand" : "text-slate-300"}`}>
            {s.winner !== null ? (s.winner === 0 ? "You win!" : `${BOT_NAMES[s.winner]} wins`) : myTurn ? "Your turn" : `${BOT_NAMES[s.turn]} is thinking...`}
          </p>
          <p data-testid="uno-log" className="relative text-sm text-slate-300 text-center">{s.log}</p>
        </div>
      </main>

      <div className="shrink-0 w-full z-20 pt-1 pb-[max(env(safe-area-inset-bottom),6px)]">
        <div className="flex justify-center gap-3">
          <button
            type="button"
            data-testid="uno-call-button"
            onClick={callUno}
            className={`h-12 px-6 rounded-full font-display text-xl font-black italic uppercase border-4 flex items-center gap-2 transition-[transform,background-color] duration-200 active:scale-90 ${
              s.unoCalled ? "bg-[#34C759] border-white text-[#0B0F19]" : myTurn && hand.length <= 2 ? "bg-[#FF3B30] border-white text-white animate-glow" : "bg-white/5 border-white/15 text-slate-400"
            }`}
          >
            <Megaphone className="w-5 h-5" /> UNO!
          </button>
          {s.drawnId !== null && myTurn && (
            <button
              type="button"
              data-testid="uno-pass-button"
              onClick={pass}
              className="h-12 px-5 rounded-full bg-white/10 border-2 border-white/20 font-bold flex items-center gap-2 transition-colors duration-150 hover:bg-white/20"
            >
              <SkipForward className="w-4 h-4" /> Pass
            </button>
          )}
        </div>
        <div className="max-w-4xl mx-auto">
          <HandFan
            cards={hand}
            renderCard={(c, i) => (
              <PlayingCard
                card={c}
                size="md"
                testid={`player-hand-card-${i}`}
                dim={!myTurn || !canPlay(c, top, s.color) || (s.drawnId !== null && c.id !== s.drawnId)}
                shake={shakeId === c.id}
                onClick={() => tapCard(c)}
                className="lg:hover:-translate-y-3"
              />
            )}
          />
        </div>
        {s.winner !== null && !resultOpen && result && (
          <div className="flex justify-center pb-2">
            <button type="button" data-testid="uno-show-results-button" onClick={() => setResultOpen(true)} className="h-11 px-6 rounded-xl bg-brand text-brand-ink font-black uppercase">
              View results
            </button>
          </div>
        )}
      </div>

      <ColorPicker
        open={!!pendingWild}
        testPrefix="uno-color"
        onPick={(color) => {
          const card = pendingWild;
          setPendingWild(null);
          humanPlay(card, color);
        }}
      />
      {result && (
        <ResultDialog
          open={resultOpen}
          onClose={() => setResultOpen(false)}
          won={result.won}
          title={result.won ? "Victory" : "Defeat"}
          subtitle={result.won ? `You beat ${opp} bot${opp > 1 ? "s" : ""}` : `${BOT_NAMES[s.winner]} emptied their hand first`}
          score={result.score}
          rows={result.rows}
          mode="uno"
          onPlayAgain={() => start(opp)}
        />
      )}
    </div>
  );
}
