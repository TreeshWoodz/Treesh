import { useEffect, useRef, useState } from "react";
import * as E from "./engine";
import { sfx } from "./sound";

const WORDS = ["", "", "Smooth!", "Fire!", "Dope!", "Black Excellence!"];

export function useGame(cfg, opts) {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const rng = useRef(cfg.seed != null ? E.mulberry32(cfg.seed) : Math.random).current;

  const [board, _setBoard] = useState(() => E.createBoard(cfg.types, rng));
  const boardRef = useRef(board);
  const setBoard = (b) => { boardRef.current = b; _setBoard(b); };

  const [kente, _setKente] = useState(() => (cfg.kente ? E.makeKente(cfg.kente) : null));
  const kenteRef = useRef(kente);

  const [hud, _setHud] = useState({ score: 0, moves: cfg.moves ?? null, time: cfg.time ?? null, collected: {} });
  const hudRef = useRef(hud);
  const patchHud = (fn) => { hudRef.current = { ...hudRef.current, ...fn(hudRef.current) }; _setHud(hudRef.current); };

  const [busy, _setBusy] = useState(false);
  const busyRef = useRef(false);
  const setBusy = (v) => { busyRef.current = v; _setBusy(v); };

  const [ended, _setEnded] = useState(null);
  const endedRef = useRef(null);
  const setEnded = (v) => { endedRef.current = v; _setEnded(v); };

  const [popping, setPopping] = useState(() => new Set());
  const [popups, setPopups] = useState([]);
  const [effects, setEffects] = useState([]);
  const [shake, setShake] = useState(0);
  const [finale, setFinale] = useState(false);
  const finaleRef = useRef(false);
  const skipRef = useRef(false);
  const [selected, setSelected] = useState(null);
  const [hint, setHint] = useState(null);
  const [armed, setArmed] = useState(null);
  const sess = useRef({ tiles: 0, maxCombo: 0, discos: 0, bombs: 0, striped: 0, xs: 0, crosses: 0, novas: 0, diagonals: 0, powerups: 0 });

  const wait = (ms) => (skipRef.current ? Promise.resolve() : E.sleep(ms));

  const addPopup = (text, r, c, big = false) => {
    if (skipRef.current) return;
    const id = Math.random();
    setPopups((p) => [...p, { id, text, r, c, big }]);
    setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), big ? 1100 : 800);
  };

  const pushEffects = (list) => {
    if (skipRef.current || !list.length) return;
    const fx = list.slice(0, 24).map((e) => ({ ...e, id: Math.random() }));
    const ids = new Set(fx.map((e) => e.id));
    setEffects((x) => [...x, ...fx]);
    setTimeout(() => setEffects((x) => x.filter((e) => !ids.has(e.id))), 800);
    if (fx.some((e) => e.big || e.kind === "bolt" || e.kind === "ring" || e.kind === "x")) setShake((s) => s + 1);
  };

  const goalsMet = () => {
    const h = hudRef.current;
    if (h.score < (cfg.target || 0)) return false;
    if ((cfg.collect || []).some((g) => (h.collected[g.type] || 0) < g.count)) return false;
    return E.countKente(kenteRef.current) === 0;
  };

  const runFinale = async () => {
    finaleRef.current = true;
    skipRef.current = false;
    setFinale(true);
    setBusy(true);
    const start = hudRef.current.score;
    addPopup("Blitz Finale!", 3.5, 3.5, true);
    await wait(900);
    while (hudRef.current.moves > 0) {
      const nb = boardRef.current.map((row) => row.slice());
      const spots = [];
      nb.forEach((row, r) => row.forEach((t, c) => t && !t.special && spots.push([r, c])));
      if (!spots.length) {
        patchHud((h) => ({ score: h.score + h.moves * 300, moves: 0 }));
        break;
      }
      const [r, c] = spots[Math.floor(Math.random() * spots.length)];
      nb[r][c] = { ...nb[r][c], special: E.SPECIAL_KINDS[Math.floor(Math.random() * E.SPECIAL_KINDS.length)] };
      setBoard(nb);
      patchHud((h) => ({ moves: h.moves - 1 }));
      if (!skipRef.current) sfx.coin();
      await wait(150);
    }
    await wait(450);
    for (let round = 0; round < 3; round++) {
      const b = boardRef.current;
      const clear = new Set();
      b.forEach((row, r) => row.forEach((t, c) => t?.special && clear.add(E.key(r, c))));
      if (!clear.size) break;
      await cascade(b, { clear, create: [] });
    }
    finaleRef.current = false;
    skipRef.current = false;
    setFinale(false);
    return hudRef.current.score - start;
  };

  const finish = async (win) => {
    if (endedRef.current || finaleRef.current) return;
    const movesLeft = hudRef.current.moves;
    const bonus = win && cfg.mode === "classic" && movesLeft > 0 ? await runFinale() : 0;
    setEnded({ win, bonus, score: hudRef.current.score, movesLeft });
    win ? sfx.win() : sfx.lose();
  };

  const checkEnd = () => {
    if (endedRef.current) return;
    const h = hudRef.current;
    if (cfg.mode === "classic") {
      if (goalsMet()) return finish(true);
      if (h.moves <= 0) return finish(false);
    } else if (cfg.moves != null && h.moves <= 0) finish(cfg.mode === "daily" ? goalsMet() : true);
    else if (cfg.time != null && h.time <= 0) finish(true);
  };

  const SPECIAL_STAT = { disco: "discos", bomb: "bombs", row: "striped", col: "striped", x: "xs", cross: "crosses", nova: "novas" };
  const SPECIAL_BONUS = { disco: 500, nova: 600, bomb: 300, cross: 350, x: 250, row: 200, col: 200 };

  const applyStep = (b, step, combo, cells) => {
    const nb = b.map((row) => row.slice());
    const collected = { ...hudRef.current.collected };
    const kNext = kenteRef.current ? kenteRef.current.map((row) => row.slice()) : null;
    let sr = 0, sc = 0, bonus = 0;
    cells.forEach((k) => {
      const [r, c] = E.parseKey(k);
      const t = nb[r][c];
      if (t && t.type !== E.DISCO) collected[t.type] = (collected[t.type] || 0) + 1;
      nb[r][c] = null;
      if (kNext) kNext[r][c] = false;
      sr += r; sc += c;
    });
    step.create.forEach((s) => {
      nb[s.r][s.c] = E.newTile(s.type, s.special);
      if (!finaleRef.current) sess.current[SPECIAL_STAT[s.special]] += 1;
      bonus += SPECIAL_BONUS[s.special];
    });
    const gained = finaleRef.current ? cells.size * 30 : cells.size * 30 * combo + bonus;
    sess.current.tiles += cells.size;
    patchHud((h) => ({ score: h.score + gained, collected }));
    if (kNext) { kenteRef.current = kNext; _setKente(kNext); }
    addPopup(`+${gained}`, sr / cells.size, sc / cells.size);
    return nb;
  };

  const cascade = async (b, step) => {
    let combo = 0;
    while (step) {
      combo += 1;
      const { cells, effects: fx } = E.expandClear(b, step.clear, step.pre, step.effects);
      setPopping(cells);
      pushEffects(fx);
      if (!skipRef.current) sfx.match(combo);
      await wait(fx.length ? 280 : 170);
      const nb = applyStep(b, step, combo, cells);
      if (combo >= 2) addPopup(WORDS[Math.min(combo, 5)], 3.5, 3.5, true);
      setPopping(new Set());
      b = E.gravity(nb, rng, cfg.types);
      setBoard(b);
      await wait(300);
      const m = E.findMatches(b);
      step = m.runs.length || m.squares.length ? E.resolveMatches(m, []) : null;
    }
    sess.current.maxCombo = Math.max(sess.current.maxCombo, combo);
    if (!E.hasMoves(b)) {
      addPopup("Remix!", 3.5, 3.5, true);
      setBoard(E.shuffleBoard(b, rng));
      await wait(350);
    }
  };

  const locked = () => busyRef.current || endedRef.current || finaleRef.current || (cfg.time != null && hudRef.current.time <= 0);

  const trySwap = async (a, d) => {
    if (locked()) return;
    const B = boardRef.current;
    const ta = B[a[0]][a[1]], td = B[d[0]][d[1]];
    if (!ta || !td) return;
    setBusy(true); setSelected(null); setHint(null);
    let nb = E.swapped(B, a, d);
    setBoard(nb); sfx.swap();
    await E.sleep(190);
    let step = null;
    if (ta.type === E.DISCO || td.type === E.DISCO || (ta.special && td.special)) {
      const res = E.comboStep(nb, a, d);
      if (res.board.some((row, r) => row.some((t, c) => t !== nb[r][c]))) {
        nb = res.board;
        setBoard(nb);
        await E.sleep(320);
      }
      step = res.step;
      if (ta.special && td.special) addPopup("Mega Combo!", 3.5, 3.5, true);
    } else {
      const m = E.findMatches(nb);
      if (m.runs.length || m.squares.length) step = E.resolveMatches(m, [a, d]);
    }
    if (!step) {
      setBoard(B); sfx.bad();
      await E.sleep(190);
      setBusy(false);
      return;
    }
    if (E.isDiagonal(a, d)) sess.current.diagonals += 1;
    if (hudRef.current.moves != null) patchHud((h) => ({ moves: h.moves - 1 }));
    await cascade(nb, step);
    setBusy(false);
    checkEnd();
  };

  const smash = async (r, c) => {
    setArmed(null);
    if (!optsRef.current.onPowerUsed("hammer")) return;
    setBusy(true); sess.current.powerups += 1;
    await cascade(boardRef.current, { clear: new Set([E.key(r, c)]), create: [] });
    setBusy(false);
    checkEnd();
  };

  const tapCell = (r, c) => {
    if (locked()) return;
    if (armed === "hammer") return smash(r, c);
    if (!selected) return setSelected([r, c]);
    const [sr, sc] = selected;
    if (sr === r && sc === c) return setSelected(null);
    if (Math.max(Math.abs(sr - r), Math.abs(sc - c)) === 1) return trySwap(selected, [r, c]);
    setSelected([r, c]);
  };

  const powers = {
    shuffle: async () => {
      setBusy(true);
      setBoard(E.shuffleBoard(boardRef.current, Math.random)); sfx.swap();
      await E.sleep(400);
      setBusy(false);
    },
    extra_moves: () => patchHud((h) => (cfg.time != null ? { time: h.time + 10 } : { moves: h.moves + 5 })),
    color_blast: () => {
      const nb = boardRef.current.map((row) => row.slice());
      const spots = [];
      nb.forEach((row, r) => row.forEach((t, c) => t && !t.special && spots.push([r, c])));
      spots.sort(() => Math.random() - 0.5).slice(0, 3).forEach(([r, c]) => { nb[r][c] = { ...nb[r][c], special: "bomb" }; });
      setBoard(nb); sfx.coin();
    },
  };

  const activatePower = (id) => {
    if (locked()) return;
    if (id === "hammer") return setArmed((a) => (a ? null : "hammer"));
    if (!optsRef.current.onPowerUsed(id)) return;
    sess.current.powerups += 1;
    powers[id]();
  };

  const continueGame = () => { setEnded(null); patchHud((h) => ({ moves: h.moves + 5 })); };

  useEffect(() => {
    if (cfg.time == null) return undefined;
    const id = setInterval(() => {
      if (endedRef.current) return;
      if (hudRef.current.time > 0) patchHud((h) => ({ time: h.time - 1 }));
      if (hudRef.current.time <= 0 && !busyRef.current) checkEnd();
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (busy || ended) return undefined;
    const id = setTimeout(() => setHint(E.findHint(boardRef.current)), 6000);
    return () => clearTimeout(id);
  }, [board, busy, ended]);

  return {
    board, kente, hud, busy, ended, popping, popups, effects, shake, finale, selected, hint, armed, sess: sess.current,
    skipFinale: () => { skipRef.current = true; },
    tapCell, trySwap, activatePower, continueGame, cashOut: () => !busyRef.current && finish(true),
    giveUp: () => setEnded({ ...endedRef.current, gaveUp: true }),
    kenteLeft: E.countKente(kente),
  };
}
