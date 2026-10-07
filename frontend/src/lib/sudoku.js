export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const boxDims = (n) => (n === 6 ? [2, 3] : [3, 3]);

function candidates(g, n, i) {
  const [br, bc] = boxDims(n);
  const r = Math.floor(i / n), c = i % n;
  const used = new Array(n + 1).fill(false);
  for (let k = 0; k < n; k++) {
    used[g[r * n + k]] = true;
    used[g[k * n + c]] = true;
  }
  const r0 = r - (r % br), c0 = c - (c % bc);
  for (let y = r0; y < r0 + br; y++) for (let x = c0; x < c0 + bc; x++) used[g[y * n + x]] = true;
  const out = [];
  for (let v = 1; v <= n; v++) if (!used[v]) out.push(v);
  return out;
}

function fill(g, n, rng) {
  const i = g.indexOf(0);
  if (i === -1) return true;
  for (const v of shuffle(candidates(g, n, i), rng)) {
    g[i] = v;
    if (fill(g, n, rng)) return true;
  }
  g[i] = 0;
  return false;
}

function countSolutions(g, n, limit) {
  let best = -1, bestC = null;
  for (let i = 0; i < g.length; i++) {
    if (g[i] !== 0) continue;
    const c = candidates(g, n, i);
    if (c.length === 0) return 0;
    if (!bestC || c.length < bestC.length) {
      best = i;
      bestC = c;
      if (c.length === 1) break;
    }
  }
  if (best === -1) return 1;
  let count = 0;
  for (const v of bestC) {
    g[best] = v;
    count += countSolutions(g, n, limit - count);
    if (count >= limit) break;
  }
  g[best] = 0;
  return count;
}

export function generateSudoku(n, holes, rng = Math.random) {
  const solution = new Array(n * n).fill(0);
  fill(solution, n, rng);
  const puzzle = solution.slice();
  let removed = 0;
  for (const i of shuffle([...Array(n * n).keys()], rng)) {
    if (removed >= holes) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle.slice(), n, 2) !== 1) puzzle[i] = keep;
    else removed++;
  }
  return { puzzle, solution };
}
