export const ROWS = 8;
export const COLS = 8;
export const DISCO = 99;

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

const LINES = (() => {
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
})();

export function findRuns(b) {
  const runs = [];
  for (const line of LINES) {
    const n = line.cells.length;
    let i = 0;
    while (i < n) {
      const [r, c] = line.cells[i];
      const t = b[r][c]?.type;
      let e = i + 1;
      if (t != null && t !== DISCO) {
        while (e < n && b[line.cells[e][0]][line.cells[e][1]]?.type === t) e++;
        if (e - i >= 3) runs.push({ dir: line.dir, type: t, cells: line.cells.slice(i, e) });
      }
      i = e;
    }
  }
  return runs;
}

export function findSquares(b) {
  const sq = [];
  for (let r = 0; r < ROWS - 1; r++)
    for (let c = 0; c < COLS - 1; c++) {
      const t = b[r][c]?.type;
      if (t == null || t === DISCO) continue;
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

export function findHint(b) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
        const r2 = r + dr, c2 = c + dc;
        if (!inside(r2, c2)) continue;
        const x = b[r][c], y = b[r2][c2];
        if (!x || !y) continue;
        if (x.type === DISCO || y.type === DISCO || (x.special && y.special)) return [[r, c], [r2, c2]];
        if (hasMatch(swapped(b, [r, c], [r2, c2]))) return [[r, c], [r2, c2]];
      }
    }
  }
  return null;
}

export const hasMoves = (b) => !!findHint(b);

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
  for (let k = -7; k <= 7; k++) if (inside(r + dr * k, c + dc * k)) out.push([r + dr * k, c + dc * k]);
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
    if (t && t.type !== DISCO) counts[t.type] = (counts[t.type] || 0) + 1;
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
    cells.forEach(([y, x]) => {
      const kk = key(y, x);
      if (!result.has(kk)) {
        result.add(kk);
        queue.push(kk);
      }
    });
  }
  return { cells: result, effects };
}

export function gravity(board, rng, n) {
  const nb = board.map((row) => row.slice());
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (nb[r][c]) {
        const t = nb[r][c];
        nb[r][c] = null;
        nb[write][c] = t;
        write--;
      }
    }
    const missing = write + 1;
    for (let r = write; r >= 0; r--) nb[r][c] = newTile(rand(rng, n), null, r - missing);
  }
  return nb;
}

export function shuffleBoard(b, rng) {
  const tiles = b.flat().filter(Boolean);
  let nb = b;
  for (let i = 0; i < 200; i++) {
    for (let j = tiles.length - 1; j > 0; j--) {
      const k = Math.floor(rng() * (j + 1));
      [tiles[j], tiles[k]] = [tiles[k], tiles[j]];
    }
    nb = [];
    for (let r = 0; r < ROWS; r++) nb.push(tiles.slice(r * COLS, r * COLS + COLS));
    if (!hasMatch(nb) && hasMoves(nb)) return nb;
  }
  return nb;
}

export const KENTE_PATTERNS = {
  center: (r, c) => r >= 2 && r <= 5 && c >= 2 && c <= 5,
  bottom: (r) => r >= 5,
  cross: (r, c) => r === 3 || r === 4 || c === 3 || c === 4,
  diamond: (r, c) => Math.abs(r - 3.5) + Math.abs(c - 3.5) <= 3,
  border: (r, c) => r === 0 || r === 7 || c === 0 || c === 7,
  checker: (r, c) => (r + c) % 2 === 0 && r > 1 && r < 6,
};

export const makeKente = (name) =>
  Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => KENTE_PATTERNS[name](r, c)));

export const countKente = (k) => (k ? k.flat().filter(Boolean).length : 0);
