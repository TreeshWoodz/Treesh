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
  const [selected, setSelected] = useState(null);
  const [hint, setHint] = useState(null);
  const [armed, setArmed] = useState(null);
  const sess = useRef({ tiles: 0, maxCombo: 0, discos: 0, bombs: 0, striped: 0, powerups: 0 });

  const addPopup = (text, r, c, big = false) => {
    const id = Math.random();
    setPopups((p) => [...p, { id, text, r, c, big }]);
    setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), big ? 1100 : 800);
  };

  const goalsMet = () => {
    const h = hudRef.current;
    if (h.score < (cfg.target || 0)) return false;
    if ((cfg.collect || []).some((g) => (h.collected[g.type] || 0) < g.count)) return false;
    return E.countKente(kenteRef.current) === 0;
  };

  const finish = (win) => {
    const h = hudRef.current;
    let bonus = 0;
    if (win && cfg.mode === "classic" && h.moves > 0) {
      bonus = h.moves * 250;
      patchHud((x) => ({ score: x.score + bonus }));
    }
    setEnded({ win, bonus, score: hudRef.current.score, movesLeft: h.moves });
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

  const applyStep = (b, step, combo) => {
    const cells = E.expandClear(b, step.clear, step.pre);
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
      const kind = s.special === "disco" ? "discos" : s.special === "bomb" ? "bombs" : "striped";
      sess.current[kind] += 1;
      bonus += s.special === "disco" ? 500 : s.special === "bomb" ? 300 : 200;
    });
    const gained = cells.size * 30 * combo + bonus;
    sess.current.tiles += cells.size;
    patchHud((h) => ({ score: h.score + gained, collected }));
    if (kNext) { kenteRef.current = kNext; _setKente(kNext); }
    addPopup(`+${gained}`, sr / cells.size, sc / cells.size);
    return { nb, cells };
  };

  const cascade = async (b, step) => {
    let combo = 0;
    while (step) {
      combo += 1;
      setPopping(E.expandClear(b, step.clear, step.pre));
      sfx.match(combo);
      await E.sleep(170);
      const { nb } = applyStep(b, step, combo);
      if (combo >= 2) addPopup(WORDS[Math.min(combo, 5)], 3.5, 3.5, true);
      setPopping(new Set());
      b = E.gravity(nb, rng, cfg.types);
      setBoard(b);
      await E.sleep(300);
      const runs = E.findRuns(b);
      step = runs.length ? E.resolveRuns(runs, []) : null;
    }
    sess.current.maxCombo = Math.max(sess.current.maxCombo, combo);
    if (!E.hasMoves(b)) {
      addPopup("Remix!", 3.5, 3.5, true);
      setBoard(E.shuffleBoard(b, rng));
      await E.sleep(350);
    }
  };

  const locked = () => busyRef.current || endedRef.current || (cfg.time != null && hudRef.current.time <= 0);

  const trySwap = async (a, d) => {
    if (locked()) return;
    const B = boardRef.current;
    const ta = B[a[0]][a[1]], td = B[d[0]][d[1]];
    if (!ta || !td) return;
    setBusy(true); setSelected(null); setHint(null);
    const nb = E.swapped(B, a, d);
    setBoard(nb); sfx.swap();
    await E.sleep(190);
    let step = null;
    if (ta.type === E.DISCO || td.type === E.DISCO) step = E.discoStep(nb, a, d);
    else if (ta.special && td.special) step = { clear: new Set([E.key(...a), E.key(...d)]), create: [] };
    else {
      const runs = E.findRuns(nb);
      if (runs.length) step = E.resolveRuns(runs, [a, d]);
    }
    if (!step) {
      setBoard(B); sfx.bad();
      await E.sleep(190);
      setBusy(false);
      return;
    }
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
    if (Math.abs(sr - r) + Math.abs(sc - c) === 1) return trySwap(selected, [r, c]);
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
    board, kente, hud, busy, ended, popping, popups, selected, hint, armed, sess: sess.current,
    tapCell, trySwap, activatePower, continueGame, cashOut: () => !busyRef.current && finish(true),
    giveUp: () => setEnded({ ...endedRef.current, gaveUp: true }),
    kenteLeft: E.countKente(kente),
  };
}
