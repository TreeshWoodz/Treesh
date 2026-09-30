import { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, RotateCcw, Undo2, X } from "lucide-react";
import { Btn } from "@/components/PinkButton";
import { beep } from "@/context/TimerContext";

export function useUndo(init) {
  const [s, setS] = useState(init);
  const hist = useRef([]);
  const set = (next) => {
    hist.current.push(s);
    setS(typeof next === "function" ? next(s) : next);
  };
  const undo = () => hist.current.length && setS(hist.current.pop());
  const reset = (v) => { hist.current = []; setS(v); };
  return [s, set, undo, reset, hist.current.length];
}

const Card = ({ active, out, children, onClick, testid }) => (
  <div onClick={onClick} data-testid={testid} className={`rounded-2xl border p-4 transition-colors ${active ? "border-[#FF3EA5]/70 bg-[#17121a]" : "border-[#22243a] bg-[#121319]"} ${out ? "opacity-40" : ""} ${onClick ? "cursor-pointer" : ""}`}>{children}</div>
);
const Undo = ({ onClick }) => (
  <Btn variant="secondary" size="sm" onClick={onClick} data-testid="game-undo-button"><Undo2 size={14} /> Undo</Btn>
);
const BigBtns = ({ onMake, onMiss, makeLabel = "Make", missLabel = "Miss" }) => (
  <div className="grid grid-cols-2 gap-3">
    <button onClick={onMake} data-testid="game-make-button" className="press flex h-20 items-center justify-center gap-2 rounded-2xl bg-[#FF3EA5] text-lg font-extrabold text-[#0A0A0D]"><Check size={22} /> {makeLabel}</button>
    <button onClick={onMiss} data-testid="game-miss-button" className="press flex h-20 items-center justify-center gap-2 rounded-2xl border border-[#2a2c40] bg-[#171923] text-lg font-extrabold text-[#F5F6F8]"><X size={22} /> {missLabel}</button>
  </div>
);
const nextAlive = (i, n, alive) => { for (let k = 1; k <= n; k++) { const j = (i + k) % n; if (alive(j)) return j; } return i; };

/* ---------------- letters (HORSE / PIG) ---------------- */
export function Letters({ players, config, onWin }) {
  const word = config.word;
  const [s, set, undo] = useUndo({ letters: players.map(() => 0) });
  const alive = s.letters.map((l) => l < word.length);
  useEffect(() => { if (alive.filter(Boolean).length === 1 && players.length > 1) onWin(players[alive.indexOf(true)]); }, [s]); // eslint-disable-line
  return (
    <div className="space-y-3">
      {players.map((p, i) => (
        <Card key={i} out={!alive[i]} testid="letters-player">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-base font-extrabold">{p}</div>
              <div className="mt-2 flex gap-1.5">
                {word.split("").map((ch, k) => (
                  <span key={k} className={`grid h-10 w-9 place-items-center rounded-lg font-display text-lg ${k < s.letters[i] ? "bg-[#FF3EA5] text-[#0A0A0D]" : "border border-[#2a2c40] text-[#3d4058]"}`}>{ch}</span>
                ))}
              </div>
            </div>
            <Btn variant={alive[i] ? "secondary" : "ghost"} size="sm" disabled={!alive[i]} onClick={() => set((c) => ({ letters: c.letters.map((l, j) => (j === i ? l + 1 : l)) }))} data-testid={`letters-add-${i}`}><Plus size={14} /> Letter</Btn>
          </div>
        </Card>
      ))}
      <Undo onClick={undo} />
    </div>
  );
}

/* ---------------- spots (Around the World / Five Spot) ---------------- */
export function Spots({ players, config, onWin }) {
  const { spots, makes = 1 } = config;
  const [s, set, undo] = useUndo({ pos: players.map(() => 0), made: players.map(() => 0), turn: 0 });
  const cur = s.turn;
  const make = () => set((c) => {
    const pos = [...c.pos], made = [...c.made];
    made[cur] += 1;
    if (made[cur] >= makes) { pos[cur] += 1; made[cur] = 0; beep(990, 0.1); }
    if (pos[cur] >= spots.length) setTimeout(() => onWin(players[cur]), 50);
    return { ...c, pos, made };
  });
  const miss = () => set((c) => ({ ...c, made: c.made.map((m, j) => (j === cur ? 0 : m)), turn: (c.turn + 1) % players.length }));
  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {players.map((p, i) => (
          <Card key={i} active={i === cur} testid="spots-player">
            <div className="flex items-center justify-between"><span className="font-extrabold">{p}</span><span className="font-num text-sm font-bold text-[#B7BBCB]">{Math.min(s.pos[i], spots.length)}/{spots.length}</span></div>
            <div className="mt-2.5 flex gap-1">
              {spots.map((_, k) => <span key={k} className={`h-2 flex-1 rounded-full ${k < s.pos[i] ? "bg-[#FF3EA5]" : k === s.pos[i] && i === cur ? "bg-[#FF3EA5]/35" : "bg-[#22243a]"}`} />)}
            </div>
          </Card>
        ))}
      </div>
      <div className="rounded-2xl border border-[#22243a] bg-[#0f1015] p-4 text-center">
        <div className="hp-eyebrow">{players[cur]} shooting from</div>
        <div className="font-display mt-1 text-2xl text-[#F5F6F8]" data-testid="spots-current">{spots[Math.min(s.pos[cur], spots.length - 1)]}</div>
        {makes > 1 && <div className="mt-1 font-num text-sm text-[#B7BBCB]">{s.made[cur]}/{makes} makes</div>}
      </div>
      <BigBtns onMake={make} onMiss={miss} missLabel={players.length > 1 ? "Miss · next" : "Miss"} />
      <Undo onClick={undo} />
    </div>
  );
}

/* ---------------- points (21, 33, King, Cutthroat, Make-it-take-it) ---------------- */
export function Points({ players, config, onWin }) {
  const { target, values, bust } = config;
  const [s, set, undo] = useUndo({ scores: players.map(() => 0), sel: 0 });
  const add = (v) => set((c) => {
    const scores = [...c.scores];
    let n = scores[c.sel] + v;
    if (bust && n > target) n = bust;
    scores[c.sel] = n;
    if (n === target || (!bust && n >= target)) setTimeout(() => onWin(players[c.sel]), 50);
    return { ...c, scores };
  });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {players.map((p, i) => (
          <Card key={i} active={i === s.sel} onClick={() => set((c) => ({ ...c, sel: i }))} testid="points-player">
            <div className="truncate text-sm font-bold text-[#B7BBCB]">{p}</div>
            <div className="font-num text-4xl font-black text-[#F5F6F8]">{s.scores[i]}</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#22243a]"><div className="h-full bg-[#FF3EA5]" style={{ width: `${Math.min(100, (s.scores[i] / target) * 100)}%` }} /></div>
          </Card>
        ))}
      </div>
      <div className="text-center text-xs font-semibold text-[#8B90A6]">Tap a player, then add points. First to {bust ? "exactly " : ""}{target}{bust ? ` · bust back to ${bust}` : ""}.</div>
      <div className={`grid gap-3 ${values.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {values.map((v) => <button key={v} onClick={() => add(v)} data-testid={`points-add-${v}`} className="press h-20 rounded-2xl bg-[#FF3EA5] font-num text-3xl font-black text-[#0A0A0D]">+{v}</button>)}
      </div>
      <Undo onClick={undo} />
    </div>
  );
}

/* ---------------- elimination (Knockout) ---------------- */
export function Elimination({ players, onWin }) {
  const [s, set, undo] = useUndo({ out: [] });
  useEffect(() => { const alive = players.filter((_, i) => !s.out.includes(i)); if (alive.length === 1 && players.length > 1) onWin(alive[0]); }, [s]); // eslint-disable-line
  return (
    <div className="space-y-3">
      <div className="text-center text-sm font-bold text-[#B7BBCB]" data-testid="elim-remaining">{players.length - s.out.length} still standing</div>
      <div className="grid grid-cols-2 gap-2.5">
        {players.map((p, i) => {
          const out = s.out.includes(i);
          return (
            <Card key={i} out={out} testid="elim-player">
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate font-extrabold ${out ? "line-through" : ""}`}>{p}</span>
                {!out && <Btn size="sm" variant="danger" onClick={() => set((c) => ({ out: [...c.out, i] }))} data-testid={`elim-out-${i}`}>Out</Btn>}
              </div>
            </Card>
          );
        })}
      </div>
      <Undo onClick={undo} />
    </div>
  );
}

/* ---------------- ghost (Beat the Pro) ---------------- */
export function Ghost({ players, config, onWin }) {
  const [s, set, undo] = useUndo({ you: 0, pro: 0 });
  const check = (n) => { if (n.you >= config.target) setTimeout(() => onWin(players[0]), 50); else if (n.pro >= config.target) setTimeout(() => onWin("The Pro"), 50); return n; };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[[players[0], s.you, "#FF3EA5"], ["The Pro", s.pro, "#F5F6F8"]].map(([n, v, c]) => (
          <Card key={n} testid="ghost-score"><div className="text-sm font-bold text-[#B7BBCB]">{n}</div><div className="font-num text-5xl font-black" style={{ color: c }}>{v}</div></Card>
        ))}
      </div>
      <div className="text-center text-xs font-semibold text-[#8B90A6]">Make = +{config.you} you · Miss = +{config.pro} pro · first to {config.target}</div>
      <BigBtns onMake={() => set((c) => check({ ...c, you: c.you + config.you }))} onMiss={() => set((c) => check({ ...c, pro: c.pro + config.pro }))} />
      <Undo onClick={undo} />
    </div>
  );
}

function useCountdown(seconds, onEnd) {
  const [left, setLeft] = useState(seconds);
  const [on, setOn] = useState(false);
  const end = useRef(0);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => {
      const l = Math.max(0, (end.current - Date.now()) / 1000);
      setLeft(l);
      if (l <= 3.05 && l > 0 && Math.abs(l - Math.round(l)) < 0.11) beep(740, 0.08);
      if (l <= 0) { setOn(false); beep(520, 0.4); onEnd && onEnd(); }
    }, 100);
    return () => clearInterval(t);
  }, [on]); // eslint-disable-line
  return { left, on, start: () => { end.current = Date.now() + seconds * 1000; setLeft(seconds); setOn(true); beep(990, 0.15); }, reset: () => { setOn(false); setLeft(seconds); } };
}

const ClockFace = ({ left, total }) => (
  <div className="text-center">
    <div className="font-num text-7xl font-black" style={{ color: left <= 10 && left > 0 ? "#FF3EA5" : "#F5F6F8" }} data-testid="game-clock">{Math.ceil(left)}</div>
    <div className="mx-auto mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-[#22243a]"><div className="h-full bg-[#FF3EA5]" style={{ width: `${(left / total) * 100}%` }} /></div>
  </div>
);

/* ---------------- timed (Hot Shot, Mikan, Lightning FT) ---------------- */
export function Timed({ players, config, onWin, onResult }) {
  const [cur, setCur] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState({});
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const cd = useCountdown(config.seconds, () => {
    const r = { ...results, [cur]: scoreRef.current };
    setResults(r);
    onResult && onResult(players[cur], scoreRef.current);
    if (Object.keys(r).length === players.length) {
      const best = Object.entries(r).sort((a, b) => b[1] - a[1])[0];
      setTimeout(() => onWin(players[best[0]], `${best[1]} pts`), 300);
    }
  });
  return (
    <div className="space-y-4">
      {players.length > 1 && (
        <div className="flex flex-wrap gap-2">{players.map((p, i) => <button key={i} disabled={cd.on} className="hp-chip" data-active={cur === i} onClick={() => { setCur(i); setScore(0); cd.reset(); }}>{p}{results[i] != null && ` · ${results[i]}`}</button>)}</div>
      )}
      <Card><ClockFace left={cd.left} total={config.seconds} /><div className="mt-3 text-center"><span className="hp-eyebrow">{players[cur]}</span><div className="font-num text-4xl font-black text-[#FF3EA5]" data-testid="timed-score">{score}</div></div></Card>
      {!cd.on ? (
        <Btn className="h-16 w-full text-lg" onClick={() => { setScore(0); cd.start(); }} data-testid="timed-start-button">{results[cur] != null ? "Go again" : `Start ${config.seconds}s`}</Btn>
      ) : (
        <div className={`grid gap-2.5 ${config.values.length > 1 ? "grid-cols-5" : "grid-cols-1"}`}>
          {config.values.map((v) => <button key={v} onClick={() => setScore((x) => x + v)} data-testid={`timed-add-${v}`} className="press h-20 rounded-2xl bg-[#FF3EA5] font-num text-2xl font-black text-[#0A0A0D]">{config.values.length > 1 ? `+${v}` : "MAKE"}</button>)}
        </div>
      )}
    </div>
  );
}

/* ---------------- racks (3PT contest) ---------------- */
export function Racks({ players, config, onWin, onResult }) {
  const { racks, balls, seconds } = config;
  const empty = () => Array.from({ length: racks }, () => Array(balls).fill(0));
  const [grid, setGrid] = useState(empty);
  const [moneyRack, setMoneyRack] = useState(-1);
  const gridRef = useRef(grid);
  gridRef.current = grid;
  const val = (r, b) => (r === moneyRack || b === balls - 1 ? 2 : 1);
  const total = (g) => g.reduce((a, row, r) => a + row.reduce((x, v, b) => x + (v === 1 ? val(r, b) : 0), 0), 0);
  const cd = useCountdown(seconds, () => { const t = total(gridRef.current); onResult && onResult(players[0], t); setTimeout(() => onWin(players[0], `${t} pts`), 300); });
  const tap = (r, b) => setGrid((g) => g.map((row, i) => (i !== r ? row : row.map((v, j) => (j !== b ? v : (v + 1) % 3)))));
  return (
    <div className="space-y-4">
      <Card><ClockFace left={cd.left} total={seconds} /><div className="mt-3 text-center font-num text-4xl font-black text-[#FF3EA5]" data-testid="racks-score">{total(grid)}</div></Card>
      <div className="space-y-2">
        {grid.map((row, r) => (
          <div key={r} className="flex items-center gap-2">
            <button onClick={() => setMoneyRack(moneyRack === r ? -1 : r)} className={`w-16 shrink-0 rounded-lg py-1 text-[10px] font-extrabold uppercase ${moneyRack === r ? "bg-[#FF3EA5] text-[#0A0A0D]" : "text-[#8B90A6]"}`} data-testid={`racks-money-${r}`}>Rack {r + 1}{moneyRack === r ? " $" : ""}</button>
            <div className="grid flex-1 grid-cols-5 gap-2">
              {row.map((v, b) => (
                <button key={b} onClick={() => tap(r, b)} data-testid={`racks-ball-${r}-${b}`} className={`press grid h-12 place-items-center rounded-full border-2 text-xs font-black ${v === 1 ? "border-[#FF3EA5] bg-[#FF3EA5] text-[#0A0A0D]" : v === 2 ? "border-[#4a1f26] bg-[#2a1216] text-[#FF7A7A]" : val(r, b) === 2 ? "border-[#FF9A3C]/70 text-[#FF9A3C]" : "border-[#2a2c40] text-[#6f7489]"}`}>
                  {v === 1 ? <Check size={16} /> : v === 2 ? <X size={16} /> : val(r, b) === 2 ? "$" : ""}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-[#8B90A6]">Tap a ball: make → miss → clear. $ = money ball (2 pts). Tap a rack label to make it your money rack.</div>
      {!cd.on && <Btn className="h-14 w-full" onClick={() => { setGrid(empty()); cd.start(); }} data-testid="racks-start-button">Start {seconds}s</Btn>}
    </div>
  );
}

/* ---------------- streak ---------------- */
export function Streak({ config, onResult }) {
  const [s, set, undo] = useUndo({ cur: 0, best: 0, total: 0 });
  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 text-center">
          <div><div className="hp-eyebrow">Streak</div><div className="font-num text-6xl font-black text-[#FF3EA5]" data-testid="streak-current">{s.cur}</div></div>
          <div><div className="hp-eyebrow">Best</div><div className="font-num text-6xl font-black" data-testid="streak-best">{s.best}</div></div>
        </div>
        <div className="mt-3 text-center text-xs font-semibold text-[#8B90A6]">Target {config.target} · {s.best >= config.target ? "Target hit. Raise it." : `${config.target - s.best} to go`}</div>
      </Card>
      <BigBtns onMake={() => set((c) => { const cur = c.cur + 1; if (cur === config.target) beep(1200, 0.3); return { cur, best: Math.max(c.best, cur), total: c.total + 1 }; })} onMiss={() => set((c) => { if (c.cur > 0) onResult && onResult("streak", c.best); return { ...c, cur: 0, total: c.total + 1 }; })} />
      <Undo onClick={undo} />
    </div>
  );
}

/* ---------------- golf ---------------- */
export function Golf({ players, config, onWin }) {
  const { holes, par } = config;
  const [s, set, undo] = useUndo({ hole: 0, strokes: players.map(() => Array(holes).fill(0)) });
  const totals = s.strokes.map((r) => r.reduce((a, b) => a + b, 0));
  const bump = (i, d) => set((c) => ({ ...c, strokes: c.strokes.map((r, j) => (j !== i ? r : r.map((v, h) => (h === c.hole ? Math.max(0, v + d) : v)))) }));
  const next = () => {
    if (s.hole < holes - 1) set((c) => ({ ...c, hole: c.hole + 1 }));
    else { const best = totals.indexOf(Math.min(...totals)); onWin(players[best], `${totals[best]} strokes (par ${holes * par})`); }
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">{Array.from({ length: holes }).map((_, h) => <span key={h} className={`grid h-8 flex-1 place-items-center rounded-lg font-num text-xs font-black ${h === s.hole ? "bg-[#FF3EA5] text-[#0A0A0D]" : h < s.hole ? "bg-[#22243a] text-[#B7BBCB]" : "border border-[#22243a] text-[#6f7489]"}`}>{h + 1}</span>)}</div>
      <div className="space-y-2.5">
        {players.map((p, i) => (
          <Card key={i} testid="golf-player">
            <div className="flex items-center justify-between gap-3">
              <div><div className="font-extrabold">{p}</div><div className="text-xs text-[#8B90A6]">Total <span className="font-num font-bold text-[#E6E8EF]">{totals[i]}</span></div></div>
              <div className="flex items-center gap-3">
                <button onClick={() => bump(i, -1)} className="press grid h-11 w-11 place-items-center rounded-full border border-[#2a2c40]" aria-label="minus stroke"><Minus size={16} /></button>
                <span className="w-8 text-center font-num text-3xl font-black text-[#FF3EA5]" data-testid={`golf-strokes-${i}`}>{s.strokes[i][s.hole]}</span>
                <button onClick={() => bump(i, 1)} className="press grid h-11 w-11 place-items-center rounded-full bg-[#FF3EA5] text-[#0A0A0D]" aria-label="add stroke" data-testid={`golf-add-${i}`}><Plus size={16} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex gap-2"><Btn className="flex-1" onClick={next} data-testid="golf-next-hole">{s.hole < holes - 1 ? `Next hole (${s.hole + 2})` : "Finish round"}</Btn><Undo onClick={undo} /></div>
    </div>
  );
}

/* ---------------- grid (Tic-Tac-Toe) ---------------- */
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export function Grid({ players, onWin }) {
  const [s, set, undo, reset] = useUndo({ cells: Array(9).fill(null), turn: 0, pick: null });
  const P = players.slice(0, 2);
  const decide = (made) => set((c) => {
    const cells = [...c.cells];
    if (made && c.pick != null) cells[c.pick] = c.turn;
    const w = LINES.find((l) => l.every((k) => cells[k] === c.turn));
    if (w) setTimeout(() => onWin(P[c.turn]), 60);
    else if (cells.every((x) => x !== null)) setTimeout(() => { reset({ cells: Array(9).fill(null), turn: 0, pick: null }); }, 900);
    return { cells, turn: 1 - c.turn, pick: null };
  });
  const labels = ["L corner", "L block", "L elbow", "Mid baseline", "Paint", "FT line", "R corner", "R block", "R elbow"];
  return (
    <div className="space-y-4">
      <div className="text-center text-sm font-bold"><span className="text-[#FF3EA5]">{P[s.turn]}</span> · pick a square, then shoot</div>
      <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
        {s.cells.map((v, k) => (
          <button key={k} disabled={v !== null} onClick={() => set((c) => ({ ...c, pick: k }))} data-testid={`grid-cell-${k}`} className={`press flex aspect-square flex-col items-center justify-center rounded-2xl border text-center ${s.pick === k ? "border-[#FF3EA5] bg-[#17121a]" : "border-[#22243a] bg-[#121319]"}`}>
            {v === null ? <span className="px-1 text-[10.5px] font-bold text-[#8B90A6]">{labels[k]}</span> : <span className={`font-display text-5xl ${v === 0 ? "text-[#FF3EA5]" : "text-[#F5F6F8]"}`}>{v === 0 ? "X" : "O"}</span>}
          </button>
        ))}
      </div>
      {s.pick !== null && <BigBtns onMake={() => decide(true)} onMiss={() => decide(false)} />}
      <Undo onClick={undo} />
    </div>
  );
}

/* ---------------- race (Beat the Clock) ---------------- */
export function Race({ players, config, onWin, onResult }) {
  const [makes, setMakes] = useState(0);
  const [t0, setT0] = useState(null);
  const [now, setNow] = useState(0);
  const [final, setFinal] = useState(null);
  useEffect(() => { if (!t0 || final != null) return; const i = setInterval(() => setNow(Date.now()), 50); return () => clearInterval(i); }, [t0, final]);
  const el = final != null ? final : t0 ? (now - t0) / 1000 : 0;
  const make = () => { const m = makes + 1; setMakes(m); if (m >= config.target) { const f = (Date.now() - t0) / 1000; setFinal(f); onResult && onResult(players[0], f); setTimeout(() => onWin(players[0], `${f.toFixed(1)}s`), 300); } };
  return (
    <div className="space-y-4">
      <Card><div className="text-center"><div className="font-num text-7xl font-black" data-testid="race-time">{el.toFixed(1)}</div><div className="mt-2 font-num text-lg font-bold text-[#FF3EA5]">{makes}/{config.target} makes</div></div></Card>
      {!t0 ? <Btn className="h-16 w-full text-lg" onClick={() => { setT0(Date.now()); setNow(Date.now()); beep(990, 0.15); }} data-testid="race-start-button">Start clock</Btn> : final == null ? <button onClick={make} className="press h-24 w-full rounded-2xl bg-[#FF3EA5] text-2xl font-extrabold text-[#0A0A0D]" data-testid="race-make-button">MAKE</button> : <Btn variant="secondary" className="w-full" onClick={() => { setMakes(0); setT0(null); setFinal(null); }}><RotateCcw size={15} /> Again</Btn>}
    </div>
  );
}

/* ---------------- tally (100 shots) ---------------- */
export function Tally({ players, config, onWin }) {
  const [s, set, undo] = useUndo({ m: 0, x: 0 });
  const n = s.m + s.x;
  const pct = n ? Math.round((s.m / n) * 100) : 0;
  const add = (made) => set((c) => { const nn = { m: c.m + (made ? 1 : 0), x: c.x + (made ? 0 : 1) }; if (nn.m + nn.x >= config.total) setTimeout(() => onWin(players[0], `${nn.m}/${config.total} · ${Math.round((nn.m / config.total) * 100)}%`), 60); return nn; });
  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-3 text-center">
          <div><div className="hp-eyebrow">Makes</div><div className="font-num text-5xl font-black text-[#FF3EA5]" data-testid="tally-makes">{s.m}</div></div>
          <div><div className="hp-eyebrow">Shots</div><div className="font-num text-5xl font-black">{n}</div></div>
          <div><div className="hp-eyebrow">FG%</div><div className="font-num text-5xl font-black" data-testid="tally-pct">{pct}</div></div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#22243a]"><div className="h-full bg-[#FF3EA5]" style={{ width: `${(n / config.total) * 100}%` }} /></div>
      </Card>
      <BigBtns onMake={() => add(true)} onMiss={() => add(false)} />
      <Undo onClick={undo} />
    </div>
  );
}

export const KEEPERS = { letters: Letters, spots: Spots, points: Points, elimination: Elimination, ghost: Ghost, timed: Timed, racks: Racks, streak: Streak, golf: Golf, grid: Grid, race: Race, tally: Tally };
