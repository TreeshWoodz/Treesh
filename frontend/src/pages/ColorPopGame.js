import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye } from "lucide-react";
import { StarliteAmount } from "../components/Starlite";
import { TILES } from "../game/config";
import { makeGrid, applyColor, region, gainFor, cellKey } from "../game/colorpop";
import { sfx } from "../game/sound";

const ZERO = { tiles: 0, maxCombo: 0, discos: 0, bombs: 0, striped: 0, xs: 0, crosses: 0, novas: 0, diagonals: 0, powerups: 0 };

export function useColorPop(cfg) {
  const [grid, setGrid] = useState(() => makeGrid(cfg.size, cfg.colors));
  const [origin] = useState(() => [Math.floor(Math.random() * cfg.size), Math.floor(Math.random() * cfg.size)]);
  const [showStart, setShowStart] = useState(true);
  const [moves, setMoves] = useState(cfg.moves);
  const [owned, setOwned] = useState(() => region(grid, origin));
  useEffect(() => {
    const id = setTimeout(() => setShowStart(false), 5000);
    return () => clearTimeout(id);
  }, []);
  const [delays, setDelays] = useState(() => new Map());
  const [ended, setEnded] = useState(null);
  const sess = useRef({ ...ZERO });
  const total = cfg.size * cfg.size;

  const pick = (color) => {
    if (ended || color === grid[origin[0]][origin[1]]) return;
    const res = applyColor(grid, color, origin);
    const left = moves - 1;
    setGrid(res.grid);
    setOwned(res.owned);
    setDelays(res.delays);
    setMoves(left);
    sess.current.tiles += res.gained;
    sfx.match(Math.min(8, 1 + Math.floor(res.gained / 4)));
    const won = res.owned.size === total;
    if (won || left <= 0) {
      const pct = Math.round((res.owned.size / total) * 100);
      const score = won ? cfg.level * 1500 + left * 400 : pct * 10;
      setTimeout(() => { setEnded({ win: won, score, movesLeft: left, bonus: 0, pct }); won ? sfx.win() : sfx.lose(); }, 700);
    }
  };

  return { grid, origin, showStart, moves, owned, delays, ended, pick, sess: sess.current, total, giveUp: () => {} };
}

const useCell = (size) => {
  const ref = useRef(null);
  const [cell, setCell] = useState(0);
  useEffect(() => {
    const el = ref.current;
    const m = () => setCell(Math.max(14, Math.floor((Math.min(el.clientWidth, el.clientHeight, 640) - 30) / size)));
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, [size]);
  return [ref, cell];
};

const Cell = ({ color, r, c, cell, delay, owned, highlight }) => {
  const t = TILES[color];
  return (
    <motion.div key={`${r}-${c}-${color}`} data-testid={`cp-cell-${r}-${c}`} className={`cp-cell ${owned && highlight ? "cp-owned" : ""}`}
      style={{ left: c * cell, top: r * cell, width: cell, height: cell, "--cp": t.from, "--cp2": t.to }}
      initial={delay != null ? { scale: 0.4, opacity: 0.4 } : false} animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: (delay || 0) * 0.035, type: "spring", stiffness: 420, damping: 18 }}>
      {cell >= 22 && <t.Icon size={cell * 0.5} color="#fff" strokeWidth={2.2} className="opacity-80" />}
    </motion.div>
  );
};

export function ColorPopBoard({ g, cfg, theme }) {
  const [ref, cell] = useCell(cfg.size);
  return (
    <div ref={ref} className="relative flex min-h-0 flex-1 items-center justify-center py-2">
      {cell > 0 && (
        <div className="board-frame" style={{ "--frame": theme.board.frame, background: theme.board.bg }}>
          <div data-testid="colorpop-grid" className="relative" style={{ width: cell * cfg.size, height: cell * cfg.size }}>
            {g.grid.map((row, r) => row.map((color, c) => (
              <Cell key={`${r}-${c}-${color}-${g.owned.has(cellKey(r, c)) ? 1 : 0}`} color={color} r={r} c={c} cell={cell}
                delay={g.delays.get(cellKey(r, c))} owned={g.owned.has(cellKey(r, c))} highlight={g.showStart} />
            )))}
            <AnimatePresence>
              {g.showStart && (
                <motion.div data-testid="colorpop-start-indicator" className="cp-start" initial={{ opacity: 0, scale: 2.5 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}
                  style={{ left: g.origin[1] * cell - cell * 0.35, top: g.origin[0] * cell - cell * 0.35, width: cell * 1.7, height: cell * 1.7 }}>
                  <span className="cp-start-label" style={{ top: g.origin[0] < 2 ? "112%" : "-48%" }}>YOU</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

export function ColorPicker({ g, cfg, showGains }) {
  const current = g.grid[g.origin[0]][g.origin[1]];
  const gains = useMemo(() => TILES.slice(0, cfg.colors).map((_, i) => gainFor(g.grid, i, g.origin)), [g.grid, cfg.colors, g.origin]);
  return (
    <div className="mt-2 flex shrink-0 justify-center gap-2 sm:gap-3" data-testid="colorpop-picker">
      {TILES.slice(0, cfg.colors).map((t, i) => (
        <motion.button key={t.id} data-testid={`colorpop-color-${i}`} whileTap={{ scale: 0.88 }} disabled={i === current || !!g.ended}
          onClick={() => g.pick(i)} className={`cp-pick ${i === current ? "cp-pick-active" : ""}`}
          style={{ background: `radial-gradient(circle at 30% 22%, ${t.from}, ${t.to} 78%)`, "--glow": t.glow }} title={t.name}>
          <t.Icon size={22} color="#fff" strokeWidth={2.2} />
          {showGains && i !== current && gains[i] > 0 && <span data-testid={`colorpop-gain-${i}`} className="cp-gain">+{gains[i]}</span>}
        </motion.button>
      ))}
    </div>
  );
}

export const HINT_COST = 150;
export const HINT_SECONDS = 20;

export function useTimedHint(spend) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return undefined;
    const id = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  const buy = () => {
    if (left > 0) return true;
    if (!spend(HINT_COST, "Color Sense hint")) return false;
    setLeft(HINT_SECONDS);
    sfx.coin();
    return true;
  };
  return { left, active: left > 0, buy };
}

export function ColorPopHud({ g, cfg, onExit, hint, onHint }) {
  const pct = Math.round((g.owned.size / g.total) * 100);
  return (
    <div className="hud-card shrink-0">
      <div className="flex items-center justify-between gap-3">
        <button data-testid="play-exit-btn" onClick={onExit} className="icon-btn"><ArrowLeft size={18} /></button>
        <div className="min-w-0 flex-1">
          <div className="hud-label">{cfg.title}</div>
          <div data-testid="colorpop-filled" className="font-display text-2xl font-black tabular-nums text-white sm:text-3xl">{pct}%</div>
        </div>
        <div className={`counter ${g.moves <= 3 ? "counter-low" : ""}`}>
          <div className="hud-label">Moves</div>
          <div data-testid="hud-moves-display" className="font-display text-2xl font-black tabular-nums">{g.moves}</div>
        </div>
      </div>
      <div className="mt-3 h-3 w-full rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-[var(--ac)] via-[var(--ac-hi)] to-white transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Grow from your glowing start tile. Fill the board with one color.</div>
        <button data-testid="colorpop-hint-btn" onClick={onHint} disabled={!!g.ended} className={`chest-btn shrink-0 !px-3 !py-1.5 !text-[11px] ${hint.active ? "chest-ready" : ""}`}>
          <Eye size={14} />
          {hint.active ? <span data-testid="colorpop-hint-timer" className="tabular-nums">{hint.left}s</span> : <>Color Sense <StarliteAmount value={HINT_COST} size={11} /></>}
        </button>
      </div>
    </div>
  );
}
