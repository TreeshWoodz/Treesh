import { generateSudoku, makeRng, seedFromString } from "./sudoku";
import { COLORS, nextId } from "./sonoko";

export function buildTutorial() {
  for (let k = 0; k < 300; k++) {
    const rng = makeRng(seedFromString(`sonoko-tutorial-${k}`));
    const { puzzle, solution } = generateSudoku(6, 10, rng);
    const empties = puzzle.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    let e0 = -1, e1 = -1;
    for (const a of empties) {
      const b = empties.find((x) => x > a && solution[x] === solution[a]);
      if (b !== undefined) {
        e0 = a;
        e1 = b;
        break;
      }
    }
    if (e0 < 0) continue;
    const d = solution[e0];
    const e3 = empties.find((i) => solution[i] !== d);
    const e4 = empties.find((i) => i !== e0 && i !== e1 && i !== e3);
    if (e3 === undefined || e4 === undefined) continue;
    const x = solution[e3];
    const t = [1, 2, 3, 4, 5, 6].find((v) => v !== d && v !== x);
    const cellColors = puzzle.map(() => COLORS[Math.floor(rng() * 4)]);
    cellColors[e0] = "blue";
    cellColors[e1] = "green";
    cellColors[e3] = "yellow";
    const hand = [
      { id: nextId(), kind: "num", color: "blue", value: d },
      { id: nextId(), kind: "num", color: "red", value: d },
      { id: nextId(), kind: "num", color: "yellow", value: x },
    ];
    return {
      rng, puzzle, solution, cellColors, hand, d, x, t,
      top: { id: nextId(), kind: "num", color: "blue", value: t },
      wild: { id: nextId(), kind: "wild", color: "wild" },
      cells: { e0, e1, e3, e4 },
    };
  }
  return null;
}

export const tutorialSteps = (T) => [
  { t: "next", title: "Welcome to Sonoko!", text: `The top card is BLUE ${T.t}. You can only play a card that matches its color or its number.` },
  { t: "card", id: T.hand[0].id, title: "Match by color", text: `Your blue ${T.d} matches the blue top card. Tap it.` },
  { t: "cell", i: T.cells.e0, title: "Place it", text: `Tap the glowing cell — that's where a ${T.d} belongs (each row, column and box holds 1–6 once).` },
  { t: "next", title: "Color match!", text: "Blue card on a blue-tinted cell = double points. Keep playing in a row to grow your combo multiplier." },
  { t: "card", id: T.hand[1].id, title: "Match by number", text: `The top card is now blue ${T.d}. Your red ${T.d} matches by NUMBER. Tap it.` },
  { t: "cell", i: T.cells.e1, title: "Place it", text: `Tap the glowing cell where this ${T.d} belongs.` },
  { t: "draw", title: "Stuck? Draw.", text: `Your yellow ${T.x} doesn't match the red ${T.d}. Tap the draw pile (drawing resets your combo).` },
  { t: "card", id: T.wild.id, title: "You drew a Wild!", text: "Wilds play on anything. Tap it." },
  { t: "cell", i: T.cells.e4, title: "Wilds fill themselves", text: "Tap the glowing cell — the Wild becomes the right number. Then pick YELLOW as the next color." },
  { t: "call", title: "One card left!", text: "Before you play your last card, tap SONOKO! Forget, and you miss the bonus." },
  { t: "card", id: T.hand[2].id, title: "Last card", text: `Your yellow ${T.x} matches the yellow Wild. Tap it…` },
  { t: "cell", i: T.cells.e3, title: "Clear your hand", text: "…and drop it in the glowing cell." },
  { t: "next", title: "SONOKO bonus!", text: "Hand cleared — bonus points and 5 fresh cards. Now finish the grid yourself! Wrong cells cost a heart; 12 cards = bust." },
];
