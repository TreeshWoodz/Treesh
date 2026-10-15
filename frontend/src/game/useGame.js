import { useEffect, useRef, useState } from "react";
import * as E from "./engine";
import { sfx } from "./sound";

const MAKE_STAT = { x: "xs", cross: "crosses", bomb: "bombs", striped: "striped", nova: "novas" };
const WORDS = ["", "", "Smooth!", "Fire!", "Dope!", "Black Excellence!"];
const DIRS = ["down", "up", "left", "right", "dr", "dl", "ur", "ul"];
const ENV_LABEL = { swap: "Tile Swap!", quake: "Earthquake!", rotate: "Board Spin!", wind: "Wind Gust!", mutate: "Mutation!", crates: "Crate Drop!" };
const specialKey = (s) => (s === "row" || s === "col" ? "striped" : s);

export function useGame(cfg, opts) {
  useState(() => E.setSize(cfg.size || 8));
  const mid = () => (E.ROWS - 1) / 2;
  const mm = () => (cfg.diagonalOnly ? true : cfg.noDiagonal ? "ortho" : false);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const rng = useRef(cfg.seed != null ? E.mulberry32(cfg.seed) : Math.random).current;

  const [board, _setBoard] = useState(() => E.decorate(E.createBoard(cfg.types, rng), cfg, rng));
  const boardRef = useRef(board);
  const setBoard = (b) => { boardRef.current = b; _setBoard(b); };

  const [kente, _setKente] = useState(() => (cfg.kente ? E.makeKente(cfg.kente, cfg.kenteHp || 1) : null));
  const kenteRef = useRef(kente);

  const [hud, _setHud] = useState({ score: 0, moves: cfg.moves ?? null, time: cfg.time ?? null, collected: {}, records: 0, mult: 1, multLeft: 0, freeze: 0 });
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
  const staticHit = useRef(false);
  const loseReason = useRef(null);
  const [dir, _setDir] = useState(cfg.gravity === "random" ? "down" : cfg.gravity);
  const dirRef = useRef(dir);
  const swipes = useRef(0);
  const envTick = useRef({ t: 0, last: {} });
  const sess = useRef({ tiles: 0, maxCombo: 0, discos: 0, bombs: 0, striped: 0, xs: 0, crosses: 0, novas: 0, diagonals: 0, powerups: 0 });

  const slow = () => (1 / (cfg.speed || 1)) * (hudRef.current.freeze > 0 ? 2.2 : 1);
  const wait = (ms) => (skipRef.current ? Promise.resolve() : E.sleep(ms * slow()));
  const allowed = (k) => !cfg.allowed || cfg.allowed.includes(specialKey(k));
  const getPool = () => ((cfg.allowed || []).length ? cfg.allowed : null);
  const giftTile = (t) => {
    const pool = getPool();
    const k = pool[Math.floor(Math.random() * pool.length)];
    if (k === "disco") return E.newTile(E.DISCO, "disco");
    return { ...t, special: k === "striped" ? (Math.random() < 0.5 ? "row" : "col") : k };
  };

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
    const b = boardRef.current;
    if (cfg.crates && E.countWhere(b, (t) => t.type === E.CRATE)) return false;
    if (cfg.static && E.countWhere(b, (t) => t.type === E.STATIC)) return false;
    if (cfg.locks && E.countWhere(b, (t) => t.lock)) return false;
    if (cfg.records && h.records < cfg.records) return false;
    if (cfg.make && Object.entries(cfg.make).some(([k, v]) => (sess.current[MAKE_STAT[k]] || 0) < v)) return false;
    return E.countKente(kenteRef.current) === 0;
  };

  const runFinale = async () => {
    finaleRef.current = true;
    skipRef.current = false;
    setFinale(true);
    setBusy(true);
    const start = hudRef.current.score;
    addPopup("Blitz Finale!", mid(), mid(), true);
    await wait(900);
    while (hudRef.current.moves > 0) {
      const nb = boardRef.current.map((row) => row.slice());
      const spots = [];
      nb.forEach((row, r) => row.forEach((t, c) => t && t.type >= 0 && t.type !== E.DISCO && !t.special && spots.push([r, c])));
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
    if (!win && loseReason.current) addPopup(loseReason.current, mid(), mid(), true);
    setEnded({ win, bonus, score: hudRef.current.score, movesLeft });
    win ? sfx.win() : sfx.lose();
  };

  const checkEnd = () => {
    if (endedRef.current) return;
    const h = hudRef.current;
    if (cfg.mode === "classic") {
      if (goalsMet()) return finish(true);
      if (cfg.time != null ? h.time <= 0 : h.moves <= 0) return finish(false);
    } else if (cfg.moves != null && h.moves <= 0) finish(cfg.mode === "daily" ? goalsMet() : true);
    else if (cfg.time != null && h.time <= 0) finish(true);
  };

  const SPECIAL_STAT = { disco: "discos", bomb: "bombs", row: "striped", col: "striped", x: "xs", cross: "crosses", nova: "novas" };
  const SPECIAL_BONUS = { disco: 500, nova: 600, bomb: 300, cross: 350, x: 250, row: 200, col: 200 };

  const applyStep = (b, step, combo, cells, extras = {}) => {
    const nb = b.map((row) => row.slice());
    const collected = { ...hudRef.current.collected };
    const kNext = kenteRef.current ? kenteRef.current.map((row) => row.slice()) : null;
    const hit = new Set();
    let sr = 0, sc = 0, bonus = 0, n = 0;
    const damage = (r, c) => {
      const t = nb[r]?.[c];
      if (!E.isBlocker(t) || hit.has(E.key(r, c))) return;
      hit.add(E.key(r, c));
      if (t.type === E.STATIC) staticHit.current = true;
      nb[r][c] = t.hp > 1 ? { ...t, hp: t.hp - 1 } : null;
      bonus += 60;
    };
    cells.forEach((k) => {
      const [r, c] = E.parseKey(k);
      const t = nb[r][c];
      if (kNext) kNext[r][c] = Math.max(0, kNext[r][c] - 1);
      if (!t || t.type === E.RECORD) return;
      if (E.isBlocker(t)) return damage(r, c);
      if (t.lock) { nb[r][c] = { ...t, lock: 0 }; bonus += 60; return; }
      if (t.gold) { bonus += 500; addPopup("+500 Gold!", r, c); }
      if (t.type !== E.DISCO) collected[t.type] = (collected[t.type] || 0) + 1;
      nb[r][c] = null;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => damage(r + dr, c + dc));
      sr += r; sc += c; n += 1;
    });
    (extras.paint || []).forEach(({ type, cells: pc }) => pc.forEach(([y, x]) => {
      if (E.isColor(nb[y][x]) && !cells.has(E.key(y, x))) nb[y][x] = { ...nb[y][x], type };
    }));
    if (extras.gold) {
      const spots = [];
      nb.forEach((row, y) => row.forEach((t, x) => E.isColor(t) && !t.gold && spots.push([y, x])));
      spots.sort(() => Math.random() - 0.5).slice(0, 6 * extras.gold).forEach(([y, x]) => { nb[y][x] = { ...nb[y][x], gold: true }; });
      addPopup("Golden Rain!", mid(), mid(), true);
    }
    step.create.filter((s) => allowed(s.special)).forEach((s) => {
      nb[s.r][s.c] = E.newTile(s.type, s.special);
      if (!finaleRef.current) sess.current[SPECIAL_STAT[s.special]] += 1;
      bonus += SPECIAL_BONUS[s.special];
    });
    const m = hudRef.current.multLeft > 0 ? hudRef.current.mult : 1;
    const gained = (finaleRef.current ? cells.size * 30 : n * 30 * combo + bonus) * m;
    sess.current.tiles += n;
    patchHud((h) => ({ score: h.score + gained, collected }));
    if (extras.mult) {
      patchHud((h) => ({ mult: Math.min(5, (h.multLeft > 0 ? h.mult : 1) + extras.mult), multLeft: 10 }));
      addPopup(`Score x${hudRef.current.mult}!`, mid(), mid(), true);
    }
    if (extras.freeze) { patchHud(() => ({ freeze: 10 })); addPopup("Time Freeze!", mid(), mid(), true); }
    if (kNext) { kenteRef.current = kNext; _setKente(kNext); }
    if (n) addPopup(`+${gained}`, sr / n, sc / n);
    return nb;
  };

  const makeSpawn = (b) => {
    let recs = E.countWhere(b, (t) => t.type === E.RECORD);
    let cds = E.countWhere(b, (t) => t.countdown != null);
    return () => {
      if (cfg.records && hudRef.current.records + recs < cfg.records && rng() < 0.12) { recs += 1; return E.newTile(E.RECORD); }
      if (cfg.rainbow && rng() < 0.05) return E.newTile(E.WILD);
      const t = E.newTile(Math.floor(rng() * cfg.types));
      if (cfg.party && getPool() && rng() < 0.12) return giftTile(t);
      if (cfg.countdown && cds < cfg.countdown.n && rng() < 0.08) { cds += 1; t.countdown = cfg.countdown.start; }
      return t;
    };
  };

  const dropRecords = async (b) => {
    if (!cfg.records) return b;
    for (let loop = 0; loop < 4; loop++) {
      const nb = b.map((row) => row.slice());
      let got = 0;
      E.bottomCells(cfg.gravity).forEach(([r, c]) => { if (nb[r][c]?.type === E.RECORD) { nb[r][c] = null; got += 1; } });
      if (!got) return b;
      patchHud((h) => ({ records: h.records + got, score: h.score + got * 500 }));
      addPopup(`Gold Record! +${got * 500}`, mid(), mid(), true);
      sfx.coin();
      setBoard(nb);
      await wait(200);
      b = E.gravity(nb, rng, cfg.types, cfg.gravity, makeSpawn(nb));
      setBoard(b);
      await wait(300);
    }
    return b;
  };

  const afterMove = () => {
    const nb = boardRef.current.map((row) => row.slice());
    let changed = false, boom = false;
    if (cfg.countdown) nb.forEach((row, r) => row.forEach((t, c) => {
      if (t?.countdown == null) return;
      nb[r][c] = { ...t, countdown: t.countdown - 1 };
      changed = true;
      if (t.countdown - 1 <= 0) boom = true;
    }));
    if (cfg.static && !staticHit.current && E.countWhere(nb, (t) => t.type === E.STATIC)) {
      const spots = [];
      nb.forEach((row, r) => row.forEach((t, c) => {
        if (t?.type !== E.STATIC) return;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { const x = nb[r + dr]?.[c + dc]; if (x && x.type >= 0 && x.type !== E.DISCO) spots.push([r + dr, c + dc]); });
      }));
      if (spots.length) {
        const [r, c] = spots[Math.floor(Math.random() * spots.length)];
        nb[r][c] = { ...E.newTile(E.STATIC), hp: 1 };
        changed = true;
        addPopup("Static spreads!", r, c);
      }
    }
    staticHit.current = false;
    if (changed) setBoard(nb);
    if (boom) loseReason.current = "Countdown hit zero!";
    return boom;
  };

  const cascade = async (b, step) => {
    let combo = 0;
    const nd = cfg.gravity === "random" ? DIRS[Math.floor(Math.random() * DIRS.length)] : cfg.gravity;
    if (nd !== dirRef.current) { dirRef.current = nd; _setDir(nd); }
    while (step) {
      combo += 1;
      const { cells, effects: fx, extras } = E.expandClear(b, step.clear, step.pre, step.effects);
      setPopping(cells);
      pushEffects(fx);
      if (!skipRef.current) sfx.match(combo);
      await wait(fx.length ? 280 : 170);
      const nb = applyStep(b, step, combo, cells, extras);
      if (combo >= 2) addPopup(WORDS[Math.min(combo, 5)], mid(), mid(), true);
      setPopping(new Set());
      b = E.gravity(nb, rng, cfg.types, dirRef.current, makeSpawn(nb));
      setBoard(b);
      await wait(300);
      b = await dropRecords(b);
      const m = E.findMatches(b);
      step = m.runs.length || m.squares.length ? E.resolveMatches(m, []) : null;
    }
    sess.current.maxCombo = Math.max(sess.current.maxCombo, combo);
    if (!E.hasMoves(b, mm())) {
      addPopup("Remix!", mid(), mid(), true);
      setBoard(E.shuffleBoard(b, rng, mm()));
      await wait(350);
    }
  };

  const locked = () => busyRef.current || endedRef.current || finaleRef.current || (cfg.time != null && hudRef.current.time <= 0);

  const trySwap = async (a, d) => {
    if (locked()) return;
    const B = boardRef.current;
    const ta = B[a[0]][a[1]], td = B[d[0]][d[1]];
    if (!ta || !td) return;
    const dirBad = (cfg.diagonalOnly && !E.isDiagonal(a, d)) || (cfg.noDiagonal && E.isDiagonal(a, d));
    if (!E.movable(ta) || !E.movable(td) || dirBad) {
      sfx.bad(); setSelected(null);
      addPopup(dirBad && E.movable(ta) && E.movable(td) ? (cfg.noDiagonal ? "No diagonals!" : "Diagonal only!") : "Can't move that!", a[0], a[1]);
      return;
    }
    setBusy(true); setSelected(null); setHint(null);
    const combo = E.isCombo(ta, td);
    let nb = E.swapped(B, a, d);
    const focus = [a, d];
    if (cfg.mirror && !combo) {
      const ma = [a[0], E.COLS - 1 - a[1]], md = [d[0], E.COLS - 1 - d[1]];
      const hit = [a, d].some((p) => [ma, md].some((q) => p[0] === q[0] && p[1] === q[1]));
      if (!hit && E.movable(nb[ma[0]][ma[1]]) && E.movable(nb[md[0]][md[1]])) { nb = E.swapped(nb, ma, md); focus.push(ma, md); }
    }
    setBoard(nb); sfx.swap();
    await E.sleep(190);
    let step = null;
    if (combo) {
      const res = E.comboStep(nb, a, d);
      if (res.board.some((row, r) => row.some((t, c) => t !== nb[r][c]))) {
        nb = res.board;
        setBoard(nb);
        await E.sleep(320);
      }
      step = res.step;
      if (ta.special && td.special) addPopup("Mega Combo!", mid(), mid(), true);
    } else {
      const m = E.findMatches(nb);
      if (m.runs.length || m.squares.length) step = E.resolveMatches(m, focus);
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
    swipes.current += 1;
    if (cfg.giftEvery && getPool() && swipes.current % cfg.giftEvery === 0) await giftDrop();
    const boom = cfg.mode === "classic" && goalsMet() ? false : afterMove();
    setBusy(false);
    if (boom) return finish(false);
    checkEnd();
  };

  const giftDrop = async () => {
    const nb = boardRef.current.map((row) => row.slice());
    const spots = [];
    nb.forEach((row, r) => row.forEach((t, c) => E.isColor(t) && !t.special && !t.lock && spots.push([r, c])));
    const picks = spots.sort(() => Math.random() - 0.5).slice(0, cfg.giftCount || 1);
    if (!picks.length) return;
    picks.forEach(([r, c]) => { nb[r][c] = giftTile(nb[r][c]); });
    setBoard(nb); sfx.coin();
    addPopup("Gift!", picks[0][0], picks[0][1], true);
    await wait(250);
  };

  const runEnv = async (kind) => {
    setBusy(true); setSelected(null); setHint(null);
    const b = E.ENV[kind](boardRef.current, Math.random, cfg.types);
    addPopup(ENV_LABEL[kind], mid(), mid(), true);
    if (kind === "quake" || kind === "rotate") setShake((s) => s + 1);
    setBoard(b); sfx.swap();
    await wait(450);
    const m = E.findMatches(b);
    if (m.runs.length || m.squares.length) await cascade(b, E.resolveMatches(m, []));
    else if (!E.hasMoves(b, mm())) setBoard(E.shuffleBoard(b, rng, mm()));
    setBusy(false);
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
      setBoard(E.shuffleBoard(boardRef.current, Math.random, mm())); sfx.swap();
      await E.sleep(400);
      setBusy(false);
    },
    extra_moves: () => patchHud((h) => (cfg.time != null ? { time: h.time + 10 } : { moves: h.moves + 5 })),
    color_blast: () => {
      const nb = boardRef.current.map((row) => row.slice());
      const spots = [];
      nb.forEach((row, r) => row.forEach((t, c) => t && t.type >= 0 && t.type !== E.DISCO && !t.special && spots.push([r, c])));
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
    if (!cfg.custom) return undefined;
    const id = setInterval(() => {
      if (endedRef.current || cfg.paused) return;
      const h = hudRef.current;
      if (h.multLeft > 0 || h.freeze > 0) patchHud((x) => ({ multLeft: Math.max(0, x.multLeft - 1), freeze: Math.max(0, x.freeze - 1), mult: x.multLeft > 1 ? x.mult : 1 }));
      if (hudRef.current.freeze > 0) return;
      const T = envTick.current;
      T.t += 1;
      if (locked()) return;
      const due = Object.entries(cfg.env || {}).find(([k, v]) => v.on && T.t - (T.last[k] || 0) >= v.every);
      if (due) { T.last[due[0]] = T.t; runEnv(due[0]); }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moveMode = mm();
  useEffect(() => {
    if (busy || ended) return undefined;
    const id = setTimeout(() => setHint(E.findHint(boardRef.current, moveMode)), 6000);
    return () => clearTimeout(id);
  }, [board, busy, ended, moveMode]);

  useEffect(() => {
    const n = cfg.size || 8;
    if (!cfg.custom || busy || n === E.ROWS) return;
    E.setSize(n);
    setSelected(null); setHint(null);
    setBoard(E.createBoard(cfg.types, rng));
    addPopup("New Board!", mid(), mid(), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.size, busy]);

  return {
    board, kente, hud, dir, noDiagonal: !!cfg.noDiagonal, spring: cfg.strength ? { stiffness: 520 * cfg.strength, damping: 34 * Math.sqrt(cfg.strength) } : null, busy, ended, popping, popups, effects, shake, finale, selected, hint, armed, sess: sess.current,
    skipFinale: () => { skipRef.current = true; },
    tapCell, trySwap, activatePower, continueGame, cashOut: () => !busyRef.current && finish(true),
    giveUp: () => setEnded({ ...endedRef.current, gaveUp: true }),
    kenteLeft: E.countKente(kente),
    layerStyle: cfg.layerStyle || "kente",
    counts: { crates: E.countWhere(board, (t) => t.type === E.CRATE), statics: E.countWhere(board, (t) => t.type === E.STATIC), locks: E.countWhere(board, (t) => t.lock) },
  };
}
