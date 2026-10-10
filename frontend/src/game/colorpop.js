const k = (r, c) => r * 100 + c;

export function makeGrid(size, colors, rng = Math.random) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => Math.floor(rng() * colors)));
}

export function region(grid, origin = [0, 0]) {
  const n = grid.length, color = grid[origin[0]][origin[1]];
  const dist = new Map([[k(origin[0], origin[1]), 0]]);
  const q = [origin];
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

export function applyColor(grid, color, origin = [0, 0]) {
  const old = region(grid, origin);
  const next = grid.map((row) => row.slice());
  old.forEach((_, key) => { next[Math.floor(key / 100)][key % 100] = color; });
  const now = region(next, origin);
  const delays = new Map();
  now.forEach((d, key) => delays.set(key, d));
  return { grid: next, gained: now.size - old.size, owned: now, delays };
}

export const gainFor = (grid, color, origin = [0, 0]) => (grid[origin[0]][origin[1]] === color ? 0 : applyColor(grid, color, origin).gained);
export const cellKey = k;
