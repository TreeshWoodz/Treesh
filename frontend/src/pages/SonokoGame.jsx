import { BoardFit } from "@/components/game/BoardFit";
import { StartBar } from "@/components/menu/StartBar";
import { DeckStack, TopCardSlot, CallButton } from "@/components/game/TableBits";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Heart, RotateCcw, Flame, Clock, CalendarDays, GraduationCap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { GameHeader, IconBtn } from "@/components/game/GameHeader";
import { PlayingCard, COLOR_HEX } from "@/components/game/PlayingCard";
import { HandFan } from "@/components/game/HandFan";
import { ColorPicker } from "@/components/game/ColorPicker";
import { ResultDialog } from "@/components/game/ResultDialog";
import { Confetti } from "@/components/game/Confetti";
import { SonokoBoard } from "@/components/game/SonokoBoard";
import { DailyShare } from "@/components/game/DailyShare";
import { COLORS, BUST, nextId, needed, multFor, makeCard, matches } from "@/lib/sonoko";
import { buildTutorial, tutorialSteps } from "@/lib/tutorial";
import { generateSudoku, makeRng, seedFromString, shuffle } from "@/lib/sudoku";
import { commitProgress, todayStr, yesterdayStr, fmtTime, useProfile, loadProfile } from "@/lib/progress";
import { sfx } from "@/lib/sound";

const HOLES = { easy: 14, normal: 18, hard: 22 };

const Setup = ({ daily, onStart, profile }) => {
  const [pick, setPick] = useState("normal");
  return (
  <div className="w-full max-w-xl mx-auto px-4 pt-6 pb-40 rise">
    <p className="eyebrow">{daily ? `Daily challenge · ${todayStr()}` : "Hybrid mode"}</p>
    <h2 className="font-display font-black uppercase italic text-5xl sm:text-6xl tracking-tight mt-1">
      {daily ? "Today's grid" : "Choose your heat"}
    </h2>
    <p className="text-slate-400 mt-3 text-sm sm:text-base">
      Play a card that matches the top card's <b className="text-white">color or number</b>, then drop it in the cell where that number
      belongs. Match the cell's tint for double points. Empty your hand after calling <b className="text-brand">SONOKO!</b>
    </p>
    {daily ? (
      <div className="mt-8 glass rounded-3xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-10 h-10 text-[#34C759]" />
          <div>
            <p className="font-display text-2xl font-black uppercase">Streak: {profile.stats.dailyStreak} days</p>
            <p className="text-slate-400 text-sm">Same puzzle & deck for everyone today.</p>
          </div>
        </div>
        <button
          type="button"
          data-testid="daily-start-button"
          onClick={() => onStart("normal")}
          className="h-12 px-6 rounded-2xl bg-[#34C759] text-[#0B0F19] font-black uppercase transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          Start
        </button>
      </div>
    ) : (
      <div className="mt-8 grid gap-3">
        {[
          ["easy", "Easy", "14 empty cells · warm-up", "#34C759"],
          ["normal", "Normal", "18 empty cells · the classic", "#007AFF"],
          ["hard", "Hard", "22 empty cells · for card sharks", "#FF3B30"],
        ].map(([id, label, desc, c]) => (
          <button
            key={id}
            type="button"
            data-testid={`sonoko-difficulty-${id}-button`}
            data-selected={pick === id}
          onClick={() => { setPick(id); sfx.select(); }}
            className="group glass rounded-2xl p-4 flex items-center justify-between text-left transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#1E2640]"
          >
            <div className="flex items-center gap-4">
              <span className="h-12 w-2 rounded-full" style={{ background: c }} />
              <div>
                <p className="font-display text-3xl font-black uppercase italic">{label}</p>
                <p className="text-slate-400 text-sm">{desc}</p>
              </div>
            </div>
            <span className="font-display text-xl font-black uppercase transition-transform duration-200 group-hover:translate-x-1" style={{ color: c }}>
              {pick === id ? "Selected" : "Tap"}
            </span>
          </button>
        ))}
        <Link
          to="/play/tutorial"
          data-testid="sonoko-tutorial-link"
          className="glass rounded-2xl p-4 flex items-center gap-3 text-slate-300 transition-colors duration-150 hover:bg-[#1E2640]"
        >
          <GraduationCap className="w-6 h-6 text-brand" /> New here? Take the 60-second tutorial
        </Link>
      </div>
    )}
    {daily && profile.lastDailyResult?.date === todayStr() && (
      <div className="mt-4">
        <p className="eyebrow mb-2">Your latest result today</p>
        <DailyShare result={profile.lastDailyResult} />
      </div>
    )}
    <StartBar onPlay={() => onStart(pick)} label={daily ? "Daily" : pick} />
  </div>
  );
};

const Stat = ({ icon: Icon, label, value, testid, color = "#fff" }) => (
  <div className="glass rounded-2xl px-2 sm:px-3 py-2 flex items-center gap-2 min-w-0">
    <Icon className="hidden sm:block w-4 h-4 shrink-0" style={{ color }} />
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 leading-none">{label}</p>
      <p data-testid={testid} className="font-mono font-extrabold text-base sm:text-lg leading-tight truncate">{value}</p>
    </div>
  </div>
);

export default function SonokoGame({ daily = false, tutorial = false }) {
  const profile = useProfile();
  const navigate = useNavigate();
  const [tut, setTut] = useState(null);
  const [coachShake, setCoachShake] = useState(false);
  const tutStep = tut && tut.step < tut.steps.length ? tut.steps[tut.step] : null;
  const date = todayStr();
  const [diff, setDiff] = useState(null);
  const [g, setG] = useState(null);
  const rngRef = useRef(Math.random);
  const [sel, setSel] = useState(null);
  const [selCell, setSelCell] = useState(null);
  const [shakeId, setShakeId] = useState(null);
  const [errCell, setErrCell] = useState(null);
  const [pendingWild, setPendingWild] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [floaters, setFloaters] = useState([]);
  const [msg, setMsg] = useState("");

  const finishTutorial = () =>
    commitProgress((s, p) => {
      s.tutorialDone = 1;
      p.tutorialDone = true;
    });

  const advance = () => {
    if (!tut) return;
    const step = tut.step + 1;
    setTut({ ...tut, step });
    if (step >= tut.steps.length) finishTutorial();
  };

  const nudge = () => {
    sfx.error();
    setCoachShake(true);
    setTimeout(() => setCoachShake(false), 420);
  };

  const skipTutorial = () => {
    finishTutorial();
    navigate("/play/sonoko");
  };

  const startTutorial = () => {
    const T = buildTutorial();
    rngRef.current = T.rng;
    setG({
      solution: T.solution, board: T.puzzle.slice(), cellColors: T.cellColors, hand: T.hand, top: T.top,
      given: T.puzzle.map((v) => v !== 0), placedColor: {}, lives: 3, score: 0, combo: 0, maxCombo: 0,
      called: false, status: "playing", colorMatches: 0, cardsPlayed: 0, calls: 0, mistakes: 0,
    });
    setTut({ T, steps: tutorialSteps(T), step: 0 });
    setDiff("easy");
    setSel(null);
    setSelCell(null);
    setSeconds(0);
    setResult(null);
    setResultOpen(false);
  };

  useEffect(() => {
    if (tutorial) startTutorial();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = (d) => {
    if (tutorial) return startTutorial();
    const seed = daily ? `sonoko-daily-${date}` : `${Date.now()}-${Math.random()}`;
    const rng = makeRng(seedFromString(seed));
    rngRef.current = rng;
    const { puzzle, solution } = generateSudoku(6, HOLES[d], rng);
    const cellColors = puzzle.map(() => COLORS[Math.floor(rng() * 4)]);
    const board = puzzle.slice();
    const hand = Array.from({ length: 5 }, () => makeCard(rng, board, solution));
    const top = { id: nextId(), kind: "num", color: COLORS[Math.floor(rng() * 4)], value: 1 + Math.floor(rng() * 6) };
    setG({
      solution, board, cellColors, hand, top, given: puzzle.map((v) => v !== 0), placedColor: {},
      lives: 3, score: 0, combo: 0, maxCombo: 0, called: false, status: "playing",
      colorMatches: 0, cardsPlayed: 0, calls: 0, mistakes: 0,
    });
    setDiff(d);
    setSel(null);
    setSelCell(null);
    setSeconds(0);
    setResult(null);
    setResultOpen(false);
    setMsg("Pick a card that matches the top card");
  };

  useEffect(() => {
    if (!g || g.status !== "playing") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [g?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const float = (i, text, color = "var(--brand)") => {
    const id = nextId();
    setFloaters((f) => [...f, { id, i, text, color }]);
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 900);
  };

  const endGame = (ng, won, reason) => {
    ng.status = won ? "won" : "lost";
    const timeBonus = won ? Math.max(0, 3000 - seconds * 5) : 0;
    const lifeBonus = won ? ng.lives * 500 : 0;
    const final = ng.score + timeBonus + lifeBonus;
    setG(ng);
    setSel(null);
    const share = daily && {
      date, score: final, won, time: fmtTime(seconds), lives: ng.lives,
      streak: won && loadProfile().stats.lastDaily !== date
        ? (loadProfile().stats.lastDaily === yesterdayStr() ? loadProfile().stats.dailyStreak + 1 : 1)
        : loadProfile().stats.dailyStreak,
      grid: ng.board.map((v, i) => (ng.given[i] ? "given" : v ? ng.placedColor[i] : "empty")),
    };
    setResult({
      won, final, share,
      subtitle: won ? `Solved in ${fmtTime(seconds)}` : reason,
      rows: [
        ["Card points", ng.score.toLocaleString()],
        ["Time bonus", `+${timeBonus}`],
        ["Heart bonus", `+${lifeBonus}`],
        ["Best combo", ng.maxCombo],
        ["Color matches", ng.colorMatches],
      ],
    });
    setTimeout(() => setResultOpen(true), won ? 700 : 400);
    won ? sfx.win() : sfx.lose();
    if (tutorial)
      return commitProgress((s, p) => {
        s.tutorialDone = 1;
        p.tutorialDone = true;
        p.xp += 150;
      });
    commitProgress((s, p) => {
      if (share) p.lastDailyResult = share;
      s.modesPlayed[daily ? "daily" : "sonoko"] = 1;
      s.sonokoPlayed++;
      s.cardsPlayed += ng.cardsPlayed;
      s.sonokoCalls += ng.calls;
      s.colorMatches += ng.colorMatches;
      s.maxCombo = Math.max(s.maxCombo, ng.maxCombo);
      if (won) {
        s.sonokoWins++;
        s.sonokoBest = Math.max(s.sonokoBest, final);
        if (ng.mistakes === 0) s.flawless++;
        if (daily) {
          s.dailyWins++;
          if (s.lastDaily !== date) {
            s.dailyStreak = s.lastDaily === yesterdayStr() ? s.dailyStreak + 1 : 1;
            s.lastDaily = date;
            s.bestDailyStreak = Math.max(s.bestDailyStreak, s.dailyStreak);
          }
        }
      }
      p.xp += Math.round(final / 10) + (won ? 120 : 25);
    });
  };

  const afterPlay = (ng) => {
    const need = needed(ng.board, ng.solution);
    const burned = ng.hand.filter((c) => c.kind === "num" && need[c.value] === 0);
    if (burned.length) {
      ng.hand = ng.hand.filter((c) => !burned.includes(c));
      ng.score += burned.length * 25;
      toast(`All ${burned[0].value}s placed — burned ${burned.length} dead card${burned.length > 1 ? "s" : ""} (+${burned.length * 25})`);
    }
    if (ng.board.every((v) => v !== 0)) return endGame(ng, true);
    if (ng.hand.length === 0) {
      if (ng.called) {
        const bonus = 500 * multFor(ng.combo);
        ng.score += bonus;
        ng.calls++;
        sfx.call();
        toast.success(`SONOKO! Hand cleared · +${bonus}`);
      } else {
        ng.combo = 0;
        toast.error("Hand cleared without calling SONOKO! — combo lost");
      }
      ng.hand = Array.from({ length: 5 }, () => makeCard(rngRef.current, ng.board, ng.solution));
    }
    if (ng.hand.length !== 1) ng.called = false;
    setG(ng);
  };

  const mistake = (card, i) => {
    const ng = { ...g, hand: [...g.hand] };
    ng.lives -= 1;
    ng.combo = 0;
    ng.mistakes++;
    setErrCell(i);
    setTimeout(() => setErrCell(null), 500);
    sfx.error();
    setSel(null);
    setSelCell(null);
    if (ng.lives <= 0) return endGame(ng, false, "Out of hearts");
    ng.hand.push(makeCard(rngRef.current, ng.board, ng.solution));
    ng.called = false;
    toast.error(`A ${card.value} doesn't go there! −1 heart, +1 penalty card`);
    if (ng.hand.length >= BUST) return endGame(ng, false, `Hand bust — ${BUST} cards`);
    setG(ng);
  };

  const place = (card, i, wildColor) => {
    const value = card.kind === "wild" ? g.solution[i] : card.value;
    if (value !== g.solution[i]) return mistake(card, i);
    const ng = { ...g, board: [...g.board], placedColor: { ...g.placedColor } };
    const mult = multFor(g.combo);
    const colorMatch = card.kind === "num" && card.color === g.cellColors[i];
    const pts = (colorMatch ? 200 : 100) * mult;
    ng.board[i] = value;
    ng.placedColor[i] = card.kind === "wild" ? wildColor : card.color;
    ng.hand = g.hand.filter((c) => c.id !== card.id);
    ng.combo = g.combo + 1;
    ng.maxCombo = Math.max(g.maxCombo, ng.combo);
    ng.score += pts;
    ng.cardsPlayed++;
    if (colorMatch) ng.colorMatches++;
    ng.top = card.kind === "wild" ? { ...card, color: wildColor } : card;
    float(i, `+${pts}${colorMatch ? " ★" : ""}`, colorMatch ? COLOR_HEX[card.color] : "var(--brand)");
    if (multFor(ng.combo) > mult) {
      sfx.combo();
      toast(`Combo x${multFor(ng.combo)}!`);
    } else sfx.play();
    setSel(null);
    setSelCell(null);
    setMsg(colorMatch ? "Color match! Double points" : "Nice! Keep the chain going");
    afterPlay(ng);
    if (tutStep?.t === "cell") advance();
  };

  const playReveal = (card) => {
    const ng = { ...g, board: [...g.board], placedColor: { ...g.placedColor } };
    const empties = shuffle(ng.board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0)).slice(0, 2);
    empties.forEach((i) => {
      ng.board[i] = ng.solution[i];
      ng.placedColor[i] = card.color;
      float(i, "+75", COLOR_HEX[card.color]);
    });
    ng.score += empties.length * 75;
    ng.hand = g.hand.filter((c) => c.id !== card.id);
    ng.top = card;
    ng.combo = g.combo + 1;
    ng.maxCombo = Math.max(g.maxCombo, ng.combo);
    ng.cardsPlayed++;
    sfx.combo();
    setSel(null);
    setMsg(`Reveal filled ${empties.length} cells`);
    afterPlay(ng);
  };

  const tapCard = (card) => {
    if (g.status !== "playing") return;
    if (tutStep && !(tutStep.t === "card" && tutStep.id === card.id)) return nudge();
    if (!matches(card, g.top)) {
      setShakeId(card.id);
      setTimeout(() => setShakeId(null), 420);
      sfx.error();
      setMsg("That card doesn't match the top card's color or number");
      return;
    }
    if (card.kind === "reveal") {
      if (sel?.id === card.id) return playReveal(card);
      setSel(card);
      sfx.select();
      return setMsg("Tap the Reveal card again to auto-fill 2 cells");
    }
    if (selCell !== null) return attempt(card, selCell);
    if (sel?.id === card.id) {
      setSel(null);
      return setMsg("Pick a card that matches the top card");
    }
    setSel(card);
    sfx.select();
    if (tutStep) advance();
    setMsg(card.kind === "wild" ? "Wild! Tap any empty cell — it fills itself" : `Now tap the cell where this ${card.value} belongs`);
  };

  const attempt = (card, i) => {
    if (card.kind === "wild") return setPendingWild({ card, i });
    place(card, i);
  };

  const tapCell = (i) => {
    if (g.status !== "playing" || g.board[i]) return;
    if (tutStep && !(tutStep.t === "cell" && tutStep.i === i && sel)) return nudge();
    if (sel && sel.kind !== "reveal") return attempt(sel, i);
    setSelCell(selCell === i ? null : i);
    setMsg("Cell selected — now tap a matching card");
  };

  const draw = () => {
    if (g.status !== "playing") return;
    if (tutStep && tutStep.t !== "draw") return nudge();
    const card = tutStep ? tut.T.wild : makeCard(rngRef.current, g.board, g.solution);
    const ng = { ...g, hand: [...g.hand, card], combo: 0, called: false };
    if (tutStep) advance();
    sfx.draw();
    setSel(null);
    if (ng.hand.length >= BUST) return endGame(ng, false, `Hand bust — ${BUST} cards`);
    setMsg(ng.hand.length >= 10 ? `Careful! ${BUST} cards = bust` : "Drew a card · combo reset");
    setG(ng);
  };

  const callSonoko = () => {
    if (g.status !== "playing") return;
    if (tutStep && tutStep.t !== "call") return nudge();
    if (g.hand.length !== 1) return toast("Call SONOKO! when you hold exactly 1 card");
    if (g.called) return;
    setG({ ...g, called: true });
    if (tutStep) advance();
    sfx.call();
    toast.success("SONOKO! Now play your last card for the bonus");
  };

  if (!g && tutorial) return <div className="min-h-[100dvh] bg-arcade" />;
  if (!g)
    return (
      <div className="min-h-[100dvh] bg-arcade">
        <GameHeader title={tutorial ? "Tutorial" : daily ? "Daily" : "Sonoko"} accent={daily ? "#34C759" : "var(--brand)"} />
        <Setup daily={daily} onStart={start} profile={profile} />
      </div>
    );

  const mult = multFor(g.combo);
  const canCall = g.hand.length === 1 && !g.called && g.status === "playing" && (!tutStep || tutStep.t === "call");

  return (
    <div className="h-[100dvh] overflow-hidden bg-arcade flex flex-col" data-testid="sonoko-game">
      <Confetti active={g.status === "won"} />
      <GameHeader
        title={tutorial ? "Tutorial" : daily ? "Daily" : "Sonoko"}
        accent={daily ? "#34C759" : "var(--brand)"}
        right={
          <IconBtn testid="sonoko-restart-button" label="Restart" onClick={() => start(diff)}>
            <RotateCcw className="w-4 h-4" />
          </IconBtn>
        }
      />
      <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto px-3 sm:px-6 flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[minmax(0,1fr)] lg:gap-8 lg:pb-2">
        <section className="flex-1 min-h-0 flex flex-col gap-2 lg:h-full">
          <div className="flex gap-1.5 sm:gap-2">
          <TopCardSlot card={g.top} />
          <div className="flex-1 min-w-0 grid grid-cols-4 gap-1.5 sm:gap-2">
            <Stat icon={Flame} label="Score" value={g.score.toLocaleString()} testid="sonoko-score" color="var(--brand)" />
            <Stat icon={Flame} label="Combo" value={`x${mult}`} testid="sonoko-combo" color="#FF3B30" />
            <Stat icon={Clock} label="Time" value={fmtTime(seconds)} testid="sonoko-timer" color="#007AFF" />
            <div className="glass rounded-2xl px-2 py-2 flex items-center justify-center gap-0.5" data-testid="sonoko-lives">
              {[0, 1, 2].map((k) => (
                <Heart
                  key={k}
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${k < g.lives ? "text-[#FF3B30] fill-[#FF3B30]" : "text-slate-600 scale-75"}`}
                />
              ))}
            </div>
          </div>
          </div>
          <BoardFit>
          <SonokoBoard
            g={g}
            floaters={floaters}
            errCell={errCell}
            selCell={selCell}
            armed={!!sel && sel.kind !== "reveal" && g.status === "playing"}
            glowCell={tutStep?.t === "cell" ? tutStep.i : null}
            onTap={tapCell}
          />
          </BoardFit>
        </section>

        <aside className="hidden lg:block w-full space-y-3 lg:self-center">
          <div className="glass rounded-3xl p-4 space-y-3 text-sm">
            <p className="eyebrow">Run stats</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Cards played", g.cardsPlayed],
                ["Color matches", g.colorMatches],
                ["Best combo", g.maxCombo],
                ["Sonoko calls", g.calls],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-[#0B0F19]/70 p-3">
                  <p className="text-slate-400 text-xs">{k}</p>
                  <p className="font-mono text-xl font-extrabold">{v}</p>
                </div>
              ))}
            </div>
            <p className="text-slate-400 leading-relaxed">
              <b className="text-white">Rules:</b> match color or number · place on the right cell · tint match = 2× · wrong cell = −1 heart · {BUST} cards = bust.
            </p>
          </div>
        </aside>
      </main>

      <div className="shrink-0 w-full z-20 pt-1 pb-[max(env(safe-area-inset-bottom),6px)]">
        {tutStep ? (
          <div data-testid="tutorial-coach" className={`max-w-xl mx-3 sm:mx-auto glass rounded-2xl p-3 sm:p-4 !border-brand/50 ${coachShake ? "animate-shake" : ""}`}>
            <div className="flex items-start gap-3">
              <GraduationCap className="w-6 h-6 text-brand shrink-0 mt-0.5" />
              <div className="flex-1">
                <p data-testid="tutorial-step-title" className="font-display text-lg sm:text-xl font-black uppercase leading-tight">{tutStep.title}</p>
                <p data-testid="tutorial-step-text" className="text-xs sm:text-sm text-slate-300">{tutStep.text}</p>
              </div>
              <span className="font-mono text-[10px] text-slate-500">{tut.step + 1}/{tut.steps.length}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <button type="button" data-testid="tutorial-skip-button" onClick={skipTutorial} className="text-xs text-slate-400 underline underline-offset-2 hover:text-white">
                Skip tutorial
              </button>
              {tutStep.t === "next" && (
                <button type="button" data-testid="tutorial-next-button" onClick={advance} className="h-9 px-5 rounded-lg bg-brand text-brand-ink font-black text-sm uppercase transition-transform duration-150 active:scale-95">
                  Next
                </button>
              )}
            </div>
          </div>
        ) : (
          <p data-testid="sonoko-hint" className="text-center text-xs sm:text-sm text-slate-300 px-4 font-medium min-h-[1.25rem]">
            {g.status === "playing" ? msg : g.status === "won" ? "Grid complete!" : "Game over"}
          </p>
        )}
        <div className="max-w-3xl mx-auto flex items-end gap-1 sm:gap-3 px-2">
          <DeckStack
            testid="draw-pile-button"
            onClick={draw}
            className={tutStep?.t === "draw" ? "ring-4 ring-brand animate-glow" : ""}
            label={
              <span data-testid="sonoko-hand-count" className={`font-mono text-[10px] sm:text-xs font-bold ${g.hand.length >= 10 ? "text-[#FF3B30]" : "text-slate-400"}`}>
                {g.hand.length}/{BUST}
              </span>
            }
          />
          <div className="flex-1 min-w-0">
          <HandFan
            cards={g.hand}
            renderCard={(c, i) => (
              <PlayingCard
                card={c}
                size="md"
                testid={`player-hand-card-${i}`}
                selected={sel?.id === c.id}
                dim={g.status === "playing" && !matches(c, g.top)}
                shake={shakeId === c.id}
                onClick={() => tapCard(c)}
                className={`lg:hover:-translate-y-3 ${tutStep?.t === "card" && tutStep.id === c.id ? "ring-4 ring-brand animate-glow" : ""}`}
              />
            )}
          />
          </div>
          <CallButton testid="sonoko-call-button" onClick={callSonoko} called={g.called} ready={canCall} />
        </div>
        {g.status !== "playing" && result && !resultOpen && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              data-testid="sonoko-show-results-button"
              onClick={() => setResultOpen(true)}
              className="h-11 px-6 rounded-xl bg-brand text-brand-ink font-black uppercase"
            >
              View results
            </button>
          </div>
        )}
      </div>

      <ColorPicker
        open={!!pendingWild}
        testPrefix="wild-color"
        only={tutStep ? ["yellow"] : null}
        onPick={(color) => {
          const { card, i } = pendingWild;
          setPendingWild(null);
          place(card, i, color);
        }}
      />
      {result && (
        <ResultDialog
          open={resultOpen}
          onClose={() => setResultOpen(false)}
          won={result.won}
          title={result.won ? "Sonoko!" : "Busted"}
          subtitle={result.subtitle}
          score={result.final}
          rows={result.rows}
          mode={daily ? "daily" : "sonoko"}
          date={date}
          allowSubmit={!tutorial}
          extra={result.share && <DailyShare result={result.share} />}
          playAgainLabel={tutorial ? "Real game" : undefined}
          onPlayAgain={() => (tutorial ? navigate("/play/sonoko") : start(diff))}
        />
      )}
    </div>
  );
}
