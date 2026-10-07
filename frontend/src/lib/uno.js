import { shuffle } from "./sudoku";

export const UNO_COLORS = ["red", "blue", "green", "yellow"];
export const BOT_NAMES = ["You", "Ivy", "Rex", "Moss"];

export function buildDeck() {
  let id = 0;
  const d = [];
  for (const color of UNO_COLORS) {
    d.push({ id: id++, color, value: 0 });
    for (let k = 0; k < 2; k++) {
      for (let v = 1; v <= 9; v++) d.push({ id: id++, color, value: v });
      for (const v of ["skip", "reverse", "draw2"]) d.push({ id: id++, color, value: v });
    }
  }
  for (let k = 0; k < 4; k++) {
    d.push({ id: id++, color: "wild", value: "wild" });
    d.push({ id: id++, color: "wild", value: "wild4" });
  }
  return shuffle(d);
}

export const canPlay = (card, top, color) => card.color === "wild" || card.color === color || card.value === top.value;

export const cardPoints = (c) => (typeof c.value === "number" ? c.value : c.color === "wild" ? 50 : 20);

export const nextIdx = (s, p, steps = 1) => {
  const n = s.hands.length;
  return (((p + s.dir * steps) % n) + n) % n;
};

export function drawInto(s, p, k) {
  for (let i = 0; i < k; i++) {
    if (!s.deck.length) {
      const top = s.discard.pop();
      s.deck = shuffle(s.discard.map((c) => c));
      s.discard = [top];
    }
    if (!s.deck.length) return;
    s.hands[p].push(s.deck.pop());
  }
}

export function newGame(opponents) {
  const s = { deck: buildDeck(), discard: [], hands: [], turn: 0, dir: 1, color: null, winner: null, drawnId: null, unoCalled: false, log: "Your turn — match color or number", played: 0 };
  for (let p = 0; p <= opponents; p++) s.hands.push(s.deck.splice(-7));
  let top = s.deck.pop();
  while (typeof top.value !== "number") {
    s.deck.unshift(top);
    top = s.deck.pop();
  }
  s.discard.push(top);
  s.color = top.color;
  return s;
}

const LABEL = { skip: "Skip", reverse: "Reverse", draw2: "+2", wild: "Wild", wild4: "Wild +4" };

export function applyPlay(s, p, cardId, chosen) {
  const hand = s.hands[p];
  const card = hand.splice(hand.findIndex((c) => c.id === cardId), 1)[0];
  s.discard.push(card);
  s.color = card.color === "wild" ? chosen : card.color;
  const n = s.hands.length;
  const who = BOT_NAMES[p];
  let skip = false;
  let log = `${who} played ${LABEL[card.value] || card.value}${card.color === "wild" ? ` → ${chosen}` : ""}`;
  if (card.value === "reverse") {
    s.dir *= -1;
    if (n === 2) skip = true;
  }
  if (card.value === "skip") {
    skip = true;
    log += ` — ${BOT_NAMES[nextIdx(s, p)]} skipped`;
  }
  if (card.value === "draw2" || card.value === "wild4") {
    const t = nextIdx(s, p);
    const k = card.value === "draw2" ? 2 : 4;
    drawInto(s, t, k);
    skip = true;
    log += ` — ${BOT_NAMES[t]} draws ${k}`;
  }
  if (hand.length === 0) s.winner = p;
  s.turn = nextIdx(s, p, skip ? 2 : 1);
  s.drawnId = null;
  s.log = log;
  return card;
}

export function aiChoose(s, p) {
  const top = s.discard[s.discard.length - 1];
  const hand = s.hands[p];
  const playable = hand.filter((c) => canPlay(c, top, s.color));
  if (!playable.length) return null;
  const threat = s.hands[nextIdx(s, p)].length <= 2;
  const prio = (c) => {
    if (c.value === "wild4") return threat ? 9 : 1;
    if (c.value === "wild") return 2;
    if (typeof c.value !== "number") return threat ? 8 : 5;
    return 4 + (c.color === s.color ? 1 : 0) + c.value / 20;
  };
  const card = playable.sort((x, y) => prio(y) - prio(x))[0];
  const counts = {};
  hand.forEach((c) => c.id !== card.id && c.color !== "wild" && (counts[c.color] = (counts[c.color] || 0) + 1));
  const chosen = Object.entries(counts).sort((x, y) => y[1] - x[1])[0]?.[0] || UNO_COLORS[Math.floor(Math.random() * 4)];
  return { card, chosen };
}
