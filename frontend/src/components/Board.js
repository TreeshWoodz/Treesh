import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TileFace } from "./TileFace";
import { ROWS, COLS, key } from "../game/engine";

const isAt = (p, r, c) => p && p[0] === r && p[1] === c;

const Popups = ({ popups, cell }) => (
  <AnimatePresence>
    {popups.map((p) => (
      <motion.div key={p.id} initial={{ opacity: 0, y: 0, scale: 0.6 }} animate={{ opacity: 1, y: -cell * 0.8, scale: 1 }}
        exit={{ opacity: 0 }} transition={{ duration: p.big ? 0.5 : 0.35 }}
        className={`pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display ${p.big ? "combo-word" : "score-pop"}`}
        style={{ left: (p.c + 0.5) * cell, top: (p.r + 0.5) * cell }}>
        {p.text}
      </motion.div>
    ))}
  </AnimatePresence>
);

export const Board = ({ g, cell, theme }) => {
  const ref = useRef(null);
  const drag = useRef(null);
  const { board, kente, popping, selected, hint, armed, popups } = g;

  const cellAt = (e) => {
    const rect = ref.current.getBoundingClientRect();
    return [Math.floor((e.clientY - rect.top) / cell), Math.floor((e.clientX - rect.left) / cell)];
  };
  const down = (e) => {
    const [r, c] = cellAt(e);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    ref.current.setPointerCapture?.(e.pointerId);
    drag.current = { r, c, x: e.clientX, y: e.clientY, moved: false };
  };
  const move = (e) => {
    const d = drag.current;
    if (!d || d.moved || armed) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < cell * 0.4) return;
    d.moved = true;
    const [tr, tc] = Math.abs(dx) > Math.abs(dy) ? [d.r, d.c + Math.sign(dx)] : [d.r + Math.sign(dy), d.c];
    if (tr >= 0 && tr < ROWS && tc >= 0 && tc < COLS) g.trySwap([d.r, d.c], [tr, tc]);
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) g.tapCell(d.r, d.c);
  };

  return (
    <div className="board-frame" style={{ "--frame": theme.board.frame, background: theme.board.bg }}>
      <div ref={ref} data-testid="game-board-grid" className={`relative touch-none select-none ${armed ? "cursor-crosshair" : "cursor-pointer"}`}
        style={{ width: cell * COLS, height: cell * ROWS }} onPointerDown={down} onPointerMove={move} onPointerUp={up}
        onPointerCancel={() => (drag.current = null)}>
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const r = Math.floor(i / COLS), c = i % COLS;
          return (
            <div key={i} data-testid={kente?.[r][c] ? `kente-cell-${r}-${c}` : undefined}
              className={`absolute rounded-md ${kente?.[r][c] ? "kente-cell" : ""}`}
              style={{ left: c * cell + 1, top: r * cell + 1, width: cell - 2, height: cell - 2,
                background: kente?.[r][c] ? undefined : (r + c) % 2 ? theme.board.cellA : theme.board.cellB }} />
          );
        })}
        <AnimatePresence>
          {board.flatMap((row, r) => row.map((t, c) => {
            if (!t) return null;
            const pop = popping.has(key(r, c));
            const sel = isAt(selected, r, c);
            const fresh = t.fromRow == null;
            return (
              <motion.div key={t.id} data-testid={`tile-${r}-${c}`} className="absolute left-0 top-0 p-[3px]"
                style={{ width: cell, height: cell, zIndex: sel ? 5 : 1 }}
                initial={{ x: c * cell, y: (fresh ? r : t.fromRow) * cell, scale: fresh ? 0.2 : 1, opacity: fresh ? 0 : 1 }}
                animate={{ x: c * cell, y: r * cell, scale: pop ? 1.25 : sel ? 1.12 : 1, opacity: pop ? 0.5 : 1 }}
                exit={{ scale: 0, opacity: 0, transition: { duration: 0.16 } }}
                transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.8 }}>
                <TileFace tile={t} size={cell} selected={sel} hint={hint && (isAt(hint[0], r, c) || isAt(hint[1], r, c))} />
              </motion.div>
            );
          }))}
        </AnimatePresence>
        <Popups popups={popups} cell={cell} />
      </div>
    </div>
  );
};
