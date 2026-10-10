const k = (r, c) => r * 100 + c;

export function makeGrid(size, colors, rng = Math.random) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => Math.floor(rng() * colors)));
}

export function region(grid) {
  const n = grid.length, color = grid[0][0];
  const dist = new Map([[k(0, 0), 0]]);
  const q = [[0, 0]];
  while (q.length) {
    const [r, c] = q.shift();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const y = r + dr, x = c + dc;
      if (y < 0 || x < 0 || y >= n || x >= n || dist.has(k(y, x)) || grid[y][x] !== color) continue;
      dist.set(k(y, x), dist.get(k(r, c)) + 1);
      q.push([y, x]);
    }
  }
  return dist;
}

export function applyColor(grid, color) {
  const old = region(grid);
  const next = grid.map((row) => row.slice());
  old.forEach((_, key) => { next[Math.floor(key / 100)][key % 100] = color; });
  const now = region(next);
  const delays = new Map();
  now.forEach((d, key) => delays.set(key, d));
  return { grid: next, gained: now.size - old.size, owned: now, delays };
}

export const gainFor = (grid, color) => (grid[0][0] === color ? 0 : applyColor(grid, color).gained);
export const cellKey = k;
