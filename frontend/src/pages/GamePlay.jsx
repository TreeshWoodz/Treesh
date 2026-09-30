import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Plus, RotateCcw, Trophy, Users, X } from "lucide-react";
import { Btn } from "@/components/PinkButton";
import { KEEPERS } from "@/components/Scorekeepers";
import { gameById, TYPE_LABEL } from "@/data/games";
import { bumpStats, KEYS, LS, useStored } from "@/lib/storage";

const SOLO = ["ghost", "streak", "race", "tally", "racks"];

export default function GamePlay() {
  const { id } = useParams();
  const nav = useNavigate();
  const game = gameById[id];
  const [profile] = useStored(KEYS.profile, null);
  const me = profile?.nickname || "You";
  const minP = game ? parseInt(game.players, 10) : 1;
  const maxP = game ? parseInt(game.players.split("-").pop(), 10) : 1;
  const [names, setNames] = useState(() => Array.from({ length: Math.max(minP, SOLO.includes(game?.type) ? 1 : 2) }, (_, i) => (i === 0 ? me : `Player ${i + 1}`)));
  const [started, setStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [round, setRound] = useState(0);
  const [log, setLog] = useStored(KEYS.gameLog, []);

  if (!game) {
    return <div className="py-20 text-center"><p className="text-[#B7BBCB]">Game not found.</p><Btn className="mt-4" onClick={() => nav("/games")}>Back to games</Btn></div>;
  }
  const Keeper = KEEPERS[game.type];
  const solo = SOLO.includes(game.type) || maxP === 1;
  const players = names.map((n, i) => n.trim() || `Player ${i + 1}`);
  const history = log.filter((l) => l.gameId === game.id).slice(0, 5);

  const onWin = (w, detail) => {
    setWinner({ name: w, detail });
    bumpStats((s) => { s.games += 1; return s; });
    setLog((cur) => [{ gameId: game.id, winner: w, detail: detail || "", players, at: new Date().toISOString() }, ...cur].slice(0, 200));
  };
  const onResult = () => {};
  const again = () => { setWinner(null); setRound((r) => r + 1); };

  return (
    <div data-testid="game-play-page">
      <button onClick={() => nav("/games")} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#B7BBCB] hover:text-[#F5F6F8]" data-testid="game-back-button"><ArrowLeft size={16} /> All games</button>
      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <div className="lg:order-2">
          <div className="hp-card hp-hero-glow p-5">
            <div className="hp-eyebrow text-[#FF3EA5]">{TYPE_LABEL[game.type]}</div>
            <h1 className="font-display mt-1 text-[34px] leading-tight" data-testid="game-title">{game.name}</h1>
            <p className="mt-1 text-[15px] text-[#B7BBCB]">{game.tagline}</p>
            <div className="mt-3 flex gap-4 text-xs font-semibold text-[#B7BBCB]"><span className="inline-flex items-center gap-1.5"><Users size={13} /> {game.players}</span><span className="inline-flex items-center gap-1.5"><Clock size={13} /> ~{game.mins} min</span></div>
            <div className="hp-eyebrow mb-2 mt-5">Rules</div>
            <ol className="space-y-2" data-testid="game-rules">
              {game.rules.map((r, i) => <li key={i} className="flex gap-2.5 text-[14px] text-[#E6E8EF]"><span className="font-num text-xs font-black text-[#FF3EA5]">{i + 1}</span>{r}</li>)}
            </ol>
          </div>
          {history.length > 0 && (
            <div className="hp-card mt-4 p-5">
              <div className="hp-eyebrow mb-3">Recent results</div>
              <div className="space-y-2">{history.map((h, i) => <div key={i} className="flex items-center justify-between text-sm"><span className="font-bold"><Trophy size={13} className="mr-1.5 inline text-[#FF3EA5]" />{h.winner}</span><span className="text-xs text-[#8B90A6]">{h.detail || new Date(h.at).toLocaleDateString()}</span></div>)}</div>
            </div>
          )}
        </div>

        <div className="lg:order-1" data-testid="games-scorekeeper">
          {!started ? (
            <div className="hp-card p-5">
              <div className="font-display text-xl">{solo ? "Ready?" : "Who's playing?"}</div>
              {!solo && (
                <div className="mt-4 space-y-2">
                  {names.map((n, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={n} onChange={(e) => setNames((c) => c.map((x, j) => (j === i ? e.target.value : x)))} data-testid={`game-player-input-${i}`} className="h-12 flex-1 rounded-xl border border-[#25273a] bg-[#0f1015] px-4 text-[15px] font-semibold focus:border-[#FF3EA5] focus:outline-none" />
                      {names.length > Math.max(minP, 2) && <button onClick={() => setNames((c) => c.filter((_, j) => j !== i))} className="press grid h-12 w-12 place-items-center rounded-xl border border-[#25273a] text-[#8B90A6]" aria-label="remove player"><X size={16} /></button>}
                    </div>
                  ))}
                  {names.length < maxP && <Btn variant="secondary" size="sm" onClick={() => setNames((c) => [...c, `Player ${c.length + 1}`])} data-testid="game-add-player-button"><Plus size={14} /> Add player</Btn>}
                </div>
              )}
              <Btn className="mt-5 h-14 w-full text-base" onClick={() => setStarted(true)} data-testid="game-start-button">Start {game.name}</Btn>
            </div>
          ) : winner ? (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="hp-card hp-hero-glow p-8 text-center" data-testid="game-winner">
              <Trophy size={40} className="mx-auto text-[#FF3EA5]" />
              <div className="hp-eyebrow mt-4">{solo && winner.name !== "The Pro" ? "Final" : "Winner"}</div>
              <div className="font-display mt-1 text-4xl" data-testid="game-winner-name">{winner.name}</div>
              {winner.detail && <div className="mt-2 font-num text-lg font-bold text-[#B7BBCB]">{winner.detail}</div>}
              <div className="mt-6 flex justify-center gap-2">
                <Btn onClick={again} data-testid="game-play-again-button"><RotateCcw size={15} /> Play again</Btn>
                <Btn variant="secondary" onClick={() => nav("/games")}>New game</Btn>
              </div>
            </motion.div>
          ) : (
            <div className="hp-card p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="hp-eyebrow">Scorekeeper</div>
                <button onClick={() => { setStarted(false); setRound((r) => r + 1); }} className="text-xs font-bold text-[#8B90A6] hover:text-[#F5F6F8]" data-testid="game-reset-button">Reset</button>
              </div>
              <Keeper key={round} players={players} config={game.config} onWin={onWin} onResult={onResult} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
