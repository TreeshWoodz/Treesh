export const COLORS = ["red", "blue", "green", "yellow"];
export const BUST = 12;
export const TINT = {
  red: "rgba(255,59,48,0.15)",
  blue: "rgba(0,122,255,0.17)",
  green: "rgba(52,199,89,0.15)",
  yellow: "rgba(255,204,0,0.13)",
};

let uid = 0;
export const nextId = () => ++uid;

export const needed = (board, sol) => {
  const c = Array(7).fill(0);
  board.forEach((v, i) => !v && c[sol[i]]++);
  return c;
};

export const multFor = (combo) => Math.min(5, 1 + Math.floor(combo / 2));

export function makeCard(rng, board, sol, versus = false) {
  const need = needed(board, sol);
  const total = need.reduce((x, y) => x + y, 0);
  const color = COLORS[Math.floor(rng() * 4)];
  const r = rng();
  if (r < 0.07 || total === 0) return { id: nextId(), kind: "wild", color: "wild" };
  if (r < 0.12) return { id: nextId(), kind: "reveal", color };
  if (versus && r < 0.17) return { id: nextId(), kind: "skip", value: "skip", color };
  if (versus && r < 0.22) return { id: nextId(), kind: "draw2", value: "draw2", color };
  let pick = rng() * total;
  let v = 1;
  for (; v < 6; v++) {
    pick -= need[v];
    if (pick < 0) break;
  }
  return { id: nextId(), kind: "num", color, value: v };
}

export const matches = (card, top) =>
  card.kind === "wild" ||
  card.color === top.color ||
  (card.kind === "num" ? top.kind === "num" && card.value === top.value : card.kind === top.kind);
