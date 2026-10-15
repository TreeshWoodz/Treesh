export let ROWS = 8;
export let COLS = 8;
export const DISCO = 99;
export const WILD = 98;
export const CRATE = -2;
export const RECORD = -3;
export const STATIC = -4;
export const isBlocker = (t) => t && (t.type === CRATE || t.type === STATIC);
export const movable = (t) => t && !t.lock && !isBlocker(t);

let uid = 1;
export const newTile = (type, special = null, fromRow) => ({ id: uid++, type, special, fromRow });
export const key = (r, c) => `${r},${c}`;
export const parseKey = (k) => k.split(",").map(Number);
export const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const rand = (rng, n) => Math.floor(rng() * n);
const inside = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

export function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const buildLines = () => {
  const L = [];
  for (let r = 0; r < ROWS; r++) L.push({ dir: "h", cells: Array.from({ length: COLS }, (_, c) => [r, c]) });
  for (let c = 0; c < COLS; c++) L.push({ dir: "v", cells: Array.from({ length: ROWS }, (_, r) => [r, c]) });
  [[1, 1, "d1"], [1, -1, "d2"]].forEach(([dr, dc, dir]) => {
    for (let r0 = 0; r0 < ROWS; r0++)
      for (let c0 = 0; c0 < COLS; c0++) {
        if (inside(r0 - dr, c0 - dc)) continue;
        const cells = [];
        for (let r = r0, c = c0; inside(r, c); r += dr, c += dc) cells.push([r, c]);
        if (cells.length >= 3) L.push({ dir, cells });
      }
  });
  return L;
};
let LINES = buildLines();
const laneCache = {};

export function setSize(n) {
  ROWS = n;
  COLS = n;
  LINES = buildLines();
  Object.keys(laneCache).forEach((k) => delete laneCache[k]);
}

export function findRuns(b) {
  const runs = [];
  for (const line of LINES) {
    const n = line.cells.length;
    const at = (k) => b[line.cells[k][0]][line.cells[k][1]]?.type;
    let i = 0;
    while (i < n) {
      let t = null, e = i;
      while (e < n) {
        const x = at(e);
        if (x === WILD) { e++; continue; }
        if (x == null || x < 0 || x === DISCO || (t != null && x !== t)) break;
        t = x;
        e++;
      }
      if (t != null && e - i >= 3) runs.push({ dir: line.dir, type: t, cells: line.cells.slice(i, e) });
      let nx = e;
      while (nx > i + 1 && at(nx - 1) === WILD) nx--;
      i = nx > i ? nx : i + 1;
    }
  }
  return runs;
}

export function findSquares(b) {
  const sq = [];
  for (let r = 0; r < ROWS - 1; r++)
    for (let c = 0; c < COLS - 1; c++) {
      const t = b[r][c]?.type;
      if (t == null || t < 0 || t === DISCO || t === WILD) continue;
      if (b[r][c + 1]?.type === t && b[r + 1][c]?.type === t && b[r + 1][c + 1]?.type === t)
        sq.push({ type: t, cells: [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]] });
    }
  return sq;
}

export const findMatches = (b) => ({ runs: findRuns(b), squares: findSquares(b) });
export const hasMatch = (b) => {
  const m = findMatches(b);
  return m.runs.length + m.squares.length > 0;
};
export const isDiagonal = (a, d) => a[0] !== d[0] && a[1] !== d[1];

export function swapped(b, a, d) {
  const n = b.map((row) => row.slice());
  const t = n[a[0]][a[1]];
  n[a[0]][a[1]] = n[d[0]][d[1]];
  n[d[0]][d[1]] = t;
  return n;
}

const STD_SPECIALS = ["row", "col", "bomb", "x", "cross", "nova", "disco"];
export const isCombo = (x, y) => (x.type === DISCO && y.type >= 0) || (y.type === DISCO && x.type >= 0) || (STD_SPECIALS.includes(x.special) && STD_SPECIALS.includes(y.special));

export function findHint(b, diagOnly = false) {
  const dirs = diagOnly === true ? [[1, 1], [1, -1]] : diagOnly === "ortho" ? [[0, 1], [1, 0]] : [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of dirs) {
        const r2 = r + dr, c2 = c + dc;
        if (!inside(r2, c2)) continue;
        const x = b[r][c], y = b[r2][c2];
        if (!movable(x) || !movable(y)) continue;
        if (isCombo(x, y)) return [[r, c], [r2, c2]];
        if (hasMatch(swapped(b, [r, c], [r2, c2]))) return [[r, c], [r2, c2]];
      }
    }
  }
  return null;
}

export const hasMoves = (b, diagOnly = false) => !!findHint(b, diagOnly);

export function createBoard(n, rng, dropIn = true) {
  let b;
  for (let tries = 0; tries < 60; tries++) {
    b = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const bad = (t) => {
          const at = (y, x) => (y === r ? row[x] : b[y]?.[x])?.type === t;
          return (at(r, c - 1) && at(r, c - 2)) || (at(r - 1, c) && at(r - 2, c)) || (at(r - 1, c - 1) && at(r - 2, c - 2)) ||
            (at(r - 1, c + 1) && at(r - 2, c + 2)) || (at(r, c - 1) && at(r - 1, c) && at(r - 1, c - 1));
        };
        let t, guard = 0;
        do {
          t = rand(rng, n);
          guard++;
        } while (guard < 30 && bad(t));
        row.push(newTile(t, null, dropIn ? r - ROWS : undefined));
      }
      b.push(row);
    }
    if (!hasMatch(b) && hasMoves(b)) return b;
  }
  return b;
}

export const SPECIAL_KINDS = ["row", "col", "bomb", "x", "cross"];

export function resolveMatches({ runs, squares }, focus = []) {
  const clear = new Set();
  const create = [];
  const taken = new Set();
  const used = new Set();
  const fk = new Set(focus.map((p) => key(p[0], p[1])));
  const place = (cells, type, special, pref) => {
    const pick = cells.find((p) => fk.has(key(...p)) && !taken.has(key(...p))) || pref || cells[Math.floor(cells.length / 2)];
    const spot = taken.has(key(...pick)) ? cells.find((p) => !taken.has(key(...p))) : pick;
    if (!spot) return;
    taken.add(key(...spot));
    create.push({ r: spot[0], c: spot[1], type, special });
  };
  runs.forEach((run, i) => {
    if (run.cells.length >= 5) {
      used.add(i);
      place(run.cells, DISCO, "disco");
    }
  });
  runs.forEach((h, i) => {
    if (h.dir !== "h") return;
    runs.forEach((v, j) => {
      if (v.dir !== "v" || used.has(i) || used.has(j) || v.type !== h.type) return;
      const hi = h.cells.findIndex((p) => v.cells.some((q) => q[0] === p[0] && q[1] === p[1]));
      if (hi < 0) return;
      const p = h.cells[hi];
      const vi = v.cells.findIndex((q) => q[0] === p[0] && q[1] === p[1]);
      const plus = hi > 0 && hi < h.cells.length - 1 && vi > 0 && vi < v.cells.length - 1;
      used.add(i);
      used.add(j);
      place([...h.cells, ...v.cells], h.type, plus ? "cross" : "bomb", p);
    });
  });
  const groups = [];
  squares.forEach((sq) => {
    const g = groups.find((x) => x.type === sq.type && sq.cells.some((p) => x.keys.has(key(...p))));
    if (g) sq.cells.forEach((p) => g.keys.add(key(...p)));
    else groups.push({ type: sq.type, keys: new Set(sq.cells.map((p) => key(...p))) });
  });
  groups.forEach((g) => {
    const cells = [...g.keys].map(parseKey);
    cells.forEach((p) => clear.add(key(...p)));
    place(cells, g.type, cells.length >= 6 ? "nova" : "x");
  });
  runs.forEach((run, i) => {
    run.cells.forEach((p) => clear.add(key(p[0], p[1])));
    if (used.has(i) || run.cells.length !== 4) return;
    place(run.cells, run.type, run.dir === "h" ? "col" : run.dir === "v" ? "row" : "x");
  });
  return { clear, create };
}

const lineCells = (r, c, dr, dc) => {
  const out = [];
  for (let k = -ROWS; k <= ROWS; k++) if (inside(r + dr * k, c + dc * k)) out.push([r + dr * k, c + dc * k]);
  return out;
};
const areaCells = (r, c, rad) => {
  const out = [];
  for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) if (inside(r + dr, c + dc)) out.push([r + dr, c + dc]);
  return out;
};
const allCells = (b, pred) => {
  const out = [];
  b.forEach((row, r) => row.forEach((t, c) => t && pred(t) && out.push([r, c])));
  return out;
};

function mostCommonType(b) {
  const counts = {};
  b.flat().forEach((t) => {
    if (t && t.type >= 0 && t.type !== DISCO && t.type !== WILD) counts[t.type] = (counts[t.type] || 0) + 1;
  });
  return Number(Object.entries(counts).sort((x, y) => y[1] - x[1])[0]?.[0] ?? 0);
}

export function comboStep(b, a, d) {
  const A = b[a[0]][a[1]], B = b[d[0]][d[1]];
  const board = b.map((row) => row.slice());
  const clear = new Set([key(...a), key(...d)]);
  const pre = new Set([key(...a), key(...d)]);
  const effects = [];
  const add = (cells) => cells.forEach((p) => clear.add(key(...p)));
  const [r, c] = d;
  const kinds = [A.special, B.special];
  const has = (k) => kinds.includes(k);
  const lines = ["row", "col", "cross"];
  if (A.type === DISCO && B.type === DISCO) {
    add(allCells(b, () => true));
    effects.push({ kind: "ring", r, c, size: 18, big: true });
  } else if (A.type === DISCO || B.type === DISCO) {
    const [dp, other] = A.type === DISCO ? [a, B] : [d, A];
    const targets = allCells(b, (t) => t.type === other.type);
    if (other.special) {
      targets.forEach(([y, x]) => { board[y][x] = { ...board[y][x], special: other.special }; });
      pre.clear();
      pre.add(key(...dp));
    }
    add(targets);
    effects.push({ kind: "bolt", r: dp[0], c: dp[1], targets });
  } else if (has("nova")) {
    add(areaCells(r, c, 3));
    effects.push({ kind: "ring", r, c, size: 7, big: true });
  } else if (A.special === "bomb" && B.special === "bomb") {
    add(areaCells(r, c, 2));
    effects.push({ kind: "ring", r, c, size: 5, big: true });
  } else if (has("x")) {
    [[1, 1], [1, -1], [0, 1], [1, 0]].forEach(([dr, dc]) => add(lineCells(r, c, dr, dc)));
    if (has("bomb")) add(areaCells(r, c, 1));
    if (A.special === "x" && B.special === "x") [[1, 1], [1, -1]].forEach(([dr, dc]) => add(lineCells(a[0], a[1], dr, dc)));
    effects.push({ kind: "x", r, c }, { kind: "row", r }, { kind: "col", c });
  } else if (has("bomb") && lines.some(has)) {
    for (let k = -1; k <= 1; k++) {
      if (inside(r + k, 0)) { add(lineCells(r + k, c, 0, 1)); effects.push({ kind: "row", r: r + k }); }
      if (inside(0, c + k)) { add(lineCells(r, c + k, 1, 0)); effects.push({ kind: "col", c: c + k }); }
    }
  } else {
    add(lineCells(r, c, 0, 1));
    add(lineCells(r, c, 1, 0));
    add(lineCells(a[0], a[1], 0, 1));
    add(lineCells(a[0], a[1], 1, 0));
    effects.push({ kind: "row", r }, { kind: "col", c }, { kind: "row", r: a[0] }, { kind: "col", c: a[1] });
  }
  return { board, step: { clear, create: [], pre, effects } };
}

export function expandClear(b, clear, pre = new Set(), baseEffects = []) {
  const result = new Set(clear);
  const queue = [...clear];
  const triggered = new Set(pre);
  const effects = [...baseEffects];
  const extras = { paint: [], mult: 0, gold: 0, freeze: 0 };
  while (queue.length) {
    const k = queue.pop();
    const [r, c] = parseKey(k);
    const t = b[r][c];
    if (!t || !t.special || triggered.has(k)) continue;
    triggered.add(k);
    const s = t.special;
    let cells = [];
    if (s === "row" || s === "cross") { cells.push(...lineCells(r, c, 0, 1)); effects.push({ kind: "row", r }); }
    if (s === "col" || s === "cross") { cells.push(...lineCells(r, c, 1, 0)); effects.push({ kind: "col", c }); }
    if (s === "x") { cells.push(...lineCells(r, c, 1, 1), ...lineCells(r, c, 1, -1)); effects.push({ kind: "x", r, c }); }
    if (s === "bomb") { cells = areaCells(r, c, 1); effects.push({ kind: "ring", r, c, size: 3 }); }
    if (s === "nova") { cells = areaCells(r, c, 2); effects.push({ kind: "ring", r, c, size: 5, big: true }); }
    if (s === "disco") {
      const type = mostCommonType(b);
      cells = allCells(b, (x) => x.type === type);
      effects.push({ kind: "bolt", r, c, targets: cells });
    }
    if (s === "lightning") {
      const types = [...new Set(allCells(b, isColor).map(([y, x]) => b[y][x].type))].sort(() => Math.random() - 0.5).slice(0, 2);
      cells = allCells(b, (x) => types.includes(x.type));
      effects.push({ kind: "bolt", r, c, targets: cells });
    }
    if (s === "hole") { cells = areaCells(r, c, 2); effects.push({ kind: "hole", r, c, size: 5 }); }
    if (s === "paint") { extras.paint.push({ type: t.type, cells: areaCells(r, c, 1) }); effects.push({ kind: "ring", r, c, size: 3 }); }
    if (s === "mult" || s === "gold" || s === "freeze") { extras[s] += 1; effects.push({ kind: "ring", r, c, size: 2 }); }
    cells.forEach(([y, x]) => {
      const kk = key(y, x);
      if (!result.has(kk)) {
        result.add(kk);
        queue.push(kk);
      }
    });
  }
  return { cells: result, effects, extras };
}

const STEP = { down: [1, 0], up: [-1, 0], right: [0, 1], left: [0, -1], dr: [1, 1], dl: [1, -1], ur: [-1, 1], ul: [-1, -1] };

function lanes(dir) {
  if (laneCache[dir]) return laneCache[dir];
  const [dr, dc] = STEP[dir] || STEP.down;
  const out = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (inside(r - dr, c - dc)) continue;
      const lane = [];
      for (let y = r, x = c; inside(y, x); y += dr, x += dc) lane.push([y, x]);
      out.push(lane);
    }
  laneCache[dir] = out;
  return out;
}

export const bottomCells = (dir = "down") => lanes(dir).map((l) => l[l.length - 1]);

export function gravity(board, rng, n, dir = "down", spawn) {
  const nb = board.map((row) => row.slice());
  const make = () => (spawn ? spawn() : newTile(rand(rng, n)));
  if (dir === "none") {
    nb.forEach((row, r) => row.forEach((t, c) => { if (!t) { const x = make(); x.fromRow = undefined; nb[r][c] = x; } }));
    return nb;
  }
  const [dr, dc] = STEP[dir] || STEP.down;
  lanes(dir).forEach((lane) => {
    const tiles = lane.map(([y, x]) => nb[y][x]).filter(Boolean);
    const m = lane.length - tiles.length;
    lane.forEach(([y, x], i) => {
      if (i >= m) { nb[y][x] = tiles[i - m]; return; }
      const t = make();
      t.fromRow = lane[0][0] - (m - i) * dr;
      t.fromCol = lane[0][1] - (m - i) * dc;
      nb[y][x] = t;
    });
  });
  return nb;
}

export function shuffleBoard(b, rng, diagOnly = false) {
  const spots = [];
  b.forEach((row, r) => row.forEach((t, c) => t && t.type >= 0 && !t.lock && spots.push([r, c])));
  const tiles = spots.map(([r, c]) => b[r][c]);
  let nb = b;
  for (let i = 0; i < 200; i++) {
    for (let j = tiles.length - 1; j > 0; j--) {
      const k = Math.floor(rng() * (j + 1));
      [tiles[j], tiles[k]] = [tiles[k], tiles[j]];
    }
    nb = b.map((row) => row.slice());
    spots.forEach(([r, c], k) => { nb[r][c] = tiles[k]; });
    if (!hasMatch(nb) && hasMoves(nb, diagOnly)) return nb;
  }
  return nb;
}

export function decorate(b, cfg, rng) {
  const nb = b.map((row) => row.slice());
  const pickN = (n) => {
    const s = [];
    nb.forEach((row, r) => row.forEach((t, c) => t && t.type >= 0 && t.type !== DISCO && !t.lock && !t.special && t.countdown == null && s.push([r, c])));
    return s.sort(() => rng() - 0.5).slice(0, n);
  };
  const fill = (pattern, type, hp) => nb.forEach((row, r) => row.forEach((t, c) => {
    if (KENTE_PATTERNS[pattern](r, c)) nb[r][c] = { ...newTile(type), hp, fromRow: t.fromRow };
  }));
  if (cfg.crates) fill(cfg.crates.pattern, CRATE, cfg.crates.hp);
  if (cfg.static) fill(cfg.static.pattern, STATIC, 1);
  if (cfg.locks) pickN(cfg.locks).forEach(([r, c]) => { nb[r][c] = { ...nb[r][c], lock: 1 }; });
  if (cfg.records) pickN(Math.min(2, cfg.records)).forEach(([r, c]) => { nb[r][c] = { ...newTile(RECORD), fromRow: nb[r][c].fromRow }; });
  if (cfg.countdown) pickN(cfg.countdown.n).forEach(([r, c]) => { nb[r][c] = { ...nb[r][c], countdown: cfg.countdown.start }; });
  if (cfg.surge) pickN(cfg.surge).forEach(([r, c]) => { nb[r][c] = { ...nb[r][c], special: SPECIAL_KINDS[Math.floor(rng() * SPECIAL_KINDS.length)] }; });
  return hasMoves(nb, cfg.diagonalOnly) ? nb : shuffleBoard(nb, rng, cfg.diagonalOnly);
}

export const countWhere = (b, pred) => b.flat().filter((t) => t && pred(t)).length;

export const KENTE_PATTERNS = {
  center: (r, c) => r >= 2 && r <= 5 && c >= 2 && c <= 5,
  bottom: (r) => r >= 5,
  cross: (r, c) => r === 3 || r === 4 || c === 3 || c === 4,
  diamond: (r, c) => Math.abs(r - 3.5) + Math.abs(c - 3.5) <= 3,
  border: (r, c) => r === 0 || r === 7 || c === 0 || c === 7,
  checker: (r, c) => (r + c) % 2 === 0 && r > 1 && r < 6,
  base: (r) => r === 7,
  mid: (r, c) => r === 4 && c >= 1 && c <= 6,
  pillars: (r, c) => (c === 1 || c === 6) && r >= 4,
  corners: (r, c) => r >= 6 && (c <= 1 || c >= 6),
  ring: (r, c) => Math.abs(r - 3.5) + Math.abs(c - 3.5) === 3,
  dots: (r, c) => r % 3 === 2 && c % 3 === 1,
};

export const makeKente = (name, hp = 1) =>
  Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => (KENTE_PATTERNS[name](r, c) ? hp : 0)));

export const countKente = (k) => (k ? k.flat().reduce((a, v) => a + v, 0) : 0);

export const isColor = (t) => t && t.type >= 0 && t.type !== DISCO && t.type !== WILD;
const pickCells = (b, pred, n, rng) => allCells(b, pred).sort(() => rng() - 0.5).slice(0, n);

export const ENV = {
  swap: (b, rng) => {
    let nb = b;
    for (let k = 0; k < 3; k++) {
      const [p, q] = pickCells(nb, movable, 2, rng);
      if (q) nb = swapped(nb, p, q);
    }
    return nb;
  },
  quake: (b, rng) => shuffleBoard(b, rng),
  rotate: (b) => b.map((row, r) => row.map((_, c) => b[ROWS - 1 - c][r])),
  wind: (b, rng) => {
    const nb = b.map((row) => row.slice());
    const dir = rng() < 0.5 ? 1 : -1;
    [...Array(ROWS).keys()].sort(() => rng() - 0.5).slice(0, 2).forEach((r) => {
      nb[r] = nb[r].map((_, c) => b[r][(c - dir + COLS) % COLS]);
    });
    return nb;
  },
  mutate: (b, rng, n) => {
    const nb = b.map((row) => row.slice());
    pickCells(nb, (t) => isColor(t) && !t.special, 4, rng).forEach(([r, c]) => { nb[r][c] = { ...nb[r][c], type: (nb[r][c].type + 1 + rand(rng, n - 1)) % n }; });
    return nb;
  },
  crates: (b, rng) => {
    const nb = b.map((row) => row.slice());
    pickCells(nb, (t) => isColor(t) && !t.special, 2, rng).forEach(([r, c]) => { nb[r][c] = { ...newTile(CRATE), hp: 1, fromRow: undefined }; });
    return nb;
  },
};
