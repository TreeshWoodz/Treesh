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

function scanLine(get, len, dir, fixed, runs) {
  let i = 0;
  while (i < len) {
    const t = get(i)?.type;
    let e = i + 1;
    if (t != null && t !== DISCO) {
      while (e < len && get(e)?.type === t) e++;
      if (e - i >= 3) {
        const cells = [];
        for (let k = i; k < e; k++) cells.push(dir === "h" ? [fixed, k] : [k, fixed]);
        runs.push({ dir, type: t, cells });
      }
    }
    i = e;
  }
}

export function findRuns(b) {
  const runs = [];
  for (let r = 0; r < ROWS; r++) scanLine((i) => b[r][i], COLS, "h", r, runs);
  for (let c = 0; c < COLS; c++) scanLine((i) => b[i][c], ROWS, "v", c, runs);
  return runs;
}

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
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc;
        if (!inside(r2, c2)) continue;
        const x = b[r][c], y = b[r2][c2];
        if (!x || !y) continue;
        if (x.type === DISCO || y.type === DISCO || (x.special && y.special)) return [[r, c], [r2, c2]];
        if (findRuns(swapped(b, [r, c], [r2, c2])).length) return [[r, c], [r2, c2]];
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
        let t, guard = 0;
        do {
          t = rand(rng, n);
          guard++;
        } while (
          guard < 30 &&
          ((c >= 2 && row[c - 1].type === t && row[c - 2].type === t) ||
            (r >= 2 && b[r - 1][c].type === t && b[r - 2][c].type === t))
        );
        row.push(newTile(t, null, dropIn ? r - ROWS : undefined));
      }
      b.push(row);
    }
    if (!findRuns(b).length && hasMoves(b)) return b;
  }
  return b;
}

export function resolveRuns(runs, focus = []) {
  const clear = new Set();
  const create = [];
  const used = new Set();
  const focusKeys = new Set(focus.map((p) => key(p[0], p[1])));
  runs.forEach((h, i) => {
    if (h.dir !== "h") return;
    const hk = new Set(h.cells.map((p) => key(p[0], p[1])));
    runs.forEach((v, j) => {
      if (v.dir !== "v" || used.has(i) || used.has(j) || v.type !== h.type) return;
      const inter = v.cells.find((p) => hk.has(key(p[0], p[1])));
      if (!inter) return;
      used.add(i);
      used.add(j);
      create.push({ r: inter[0], c: inter[1], type: h.type, special: "bomb" });
    });
  });
  runs.forEach((run, i) => {
    run.cells.forEach((p) => clear.add(key(p[0], p[1])));
    const len = run.cells.length;
    if (used.has(i) || len < 4) return;
    const pos = run.cells.find((p) => focusKeys.has(key(p[0], p[1]))) || run.cells[Math.floor(len / 2)];
    create.push(
      len >= 5
        ? { r: pos[0], c: pos[1], type: DISCO, special: "disco" }
        : { r: pos[0], c: pos[1], type: run.type, special: run.dir === "h" ? "col" : "row" }
    );
  });
  return { clear, create };
}

export function discoStep(b, pa, pb) {
  const A = b[pa[0]][pa[1]], B = b[pb[0]][pb[1]];
  const clear = new Set([key(...pa), key(...pb)]);
  const pre = new Set();
  if (A.type === DISCO && B.type === DISCO) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) clear.add(key(r, c));
    pre.add(key(...pa));
    pre.add(key(...pb));
  } else {
    const [d, other] = A.type === DISCO ? [pa, B] : [pb, A];
    pre.add(key(...d));
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) if (b[r][c]?.type === other.type) clear.add(key(r, c));
  }
  return { clear, create: [], pre };
}

function mostCommonType(b) {
  const counts = {};
  b.flat().forEach((t) => {
    if (t && t.type !== DISCO) counts[t.type] = (counts[t.type] || 0) + 1;
  });
  return Number(Object.entries(counts).sort((x, y) => y[1] - x[1])[0]?.[0] ?? 0);
}

export function expandClear(b, clear, pre = new Set()) {
  const result = new Set(clear);
  const queue = [...clear];
  const triggered = new Set(pre);
  while (queue.length) {
    const k = queue.pop();
    const [r, c] = parseKey(k);
    const t = b[r][c];
    if (!t || !t.special || triggered.has(k)) continue;
    triggered.add(k);
    const cells = [];
    if (t.special === "row") for (let x = 0; x < COLS; x++) cells.push([r, x]);
    if (t.special === "col") for (let y = 0; y < ROWS; y++) cells.push([y, c]);
    if (t.special === "bomb")
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (inside(r + dr, c + dc)) cells.push([r + dr, c + dc]);
    if (t.special === "disco") {
      const type = mostCommonType(b);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (b[y][x]?.type === type) cells.push([y, x]);
    }
    cells.forEach(([y, x]) => {
      const kk = key(y, x);
      if (!result.has(kk)) {
        result.add(kk);
        queue.push(kk);
      }
    });
  }
  return result;
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
    if (!findRuns(nb).length && hasMoves(nb)) return nb;
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
