import { ArrowLeft, Star, Grid3x3 } from "lucide-react";
import { MiniTile } from "./TileFace";
import { POWERUPS } from "../game/config";
import { StarliteAmount } from "./Starlite";

const Progress = ({ score, target }) => {
  const max = target * 2;
  const pct = Math.min(100, (score / max) * 100);
  return (
    <div className="relative mt-2 h-3 w-full rounded-full bg-white/5" data-testid="hud-progress">
      <div className="h-full rounded-full bg-gradient-to-r from-[var(--ac)] via-[var(--ac-hi)] to-white transition-[width] duration-500" style={{ width: `${pct}%` }} />
      {[0.5, 0.75, 1].map((f) => (
        <Star key={f} size={14} className={`absolute -top-[1px] -translate-x-1/2 ${pct >= f * 100 ? "fill-[#FFC800] text-[#FFC800]" : "fill-[#2E2338] text-[#4b3a5c]"}`} style={{ left: `${f * 100 - (f === 1 ? 3 : 0)}%` }} />
      ))}
    </div>
  );
};

const Goals = ({ cfg, g }) => (
  <div className="flex flex-wrap gap-2" data-testid="hud-goals">
    {(cfg.collect || []).map((goal) => {
      const left = Math.max(0, goal.count - (g.hud.collected[goal.type] || 0));
      return (
        <div key={goal.type} data-testid={`goal-collect-${goal.type}`} className={`goal-chip ${left === 0 ? "goal-done" : ""}`}>
          <MiniTile type={goal.type} size={24} /> <span className="tabular-nums">{left}</span>
        </div>
      );
    })}
    {cfg.kente && (
      <div data-testid="goal-kente" className={`goal-chip ${g.kenteLeft === 0 ? "goal-done" : ""}`}>
        <span className="kente-swatch" /> <span className="tabular-nums">{g.kenteLeft}</span>
      </div>
    )}
  </div>
);

export const Hud = ({ cfg, g, onExit }) => {
  const { hud } = g;
  const low = hud.time != null ? hud.time <= 10 : hud.moves != null && hud.moves <= 3;
  return (
    <div className="hud-card">
      <div className="flex items-center justify-between gap-3">
        <button data-testid="play-exit-btn" onClick={onExit} className="icon-btn"><ArrowLeft size={18} /></button>
        <div className="min-w-0 flex-1">
          <div className="hud-label">{cfg.title}</div>
          <div data-testid="hud-score-display" className="font-display text-2xl font-black tabular-nums text-white sm:text-3xl">{hud.score.toLocaleString()}</div>
        </div>
        {hud.moves != null && (
          <div className={`counter ${low ? "counter-low" : ""}`}><div className="hud-label">Moves</div><div data-testid="hud-moves-display" className="font-display text-2xl font-black tabular-nums">{hud.moves}</div></div>
        )}
        {hud.time != null && (
          <div className={`counter ${low ? "counter-low" : ""}`}><div className="hud-label">Time</div><div data-testid="hud-timer-display" className="font-display text-2xl font-black tabular-nums">{hud.time}s</div></div>
        )}
        {cfg.mode === "zen" && <button data-testid="zen-cashout-btn" onClick={g.cashOut} className="btn-bronze !px-4 !py-2 text-sm">Cash Out</button>}
      </div>
      {cfg.target && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Target {cfg.target.toLocaleString()}</span>
            {(cfg.collect || cfg.kente) && <span className="flex items-center gap-1"><Grid3x3 size={12} /> Goals</span>}
          </div>
          <Progress score={hud.score} target={cfg.target} />
        </div>
      )}
      {(cfg.collect || cfg.kente) && <div className="mt-3"><Goals cfg={cfg} g={g} /></div>}
    </div>
  );
};

export const PowerBar = ({ cfg, g, inventory }) => (
  <div className="mt-2 grid shrink-0 grid-cols-4 gap-2 sm:gap-3">
    {POWERUPS.map(({ id, name, cost, Icon }) => {
      const disabled = id === "extra_moves" && cfg.mode === "zen";
      const owned = inventory[id] || 0;
      return (
        <button key={id} data-testid={`powerup-btn-${id}`} disabled={disabled} onClick={() => g.activatePower(id)} title={name}
          className={`power-btn ${g.armed === id ? "power-armed" : ""}`}>
          <Icon size={22} />
          <span className="hidden text-[10px] font-bold uppercase tracking-wider sm:block">{name.split(" ").slice(-1)}</span>
          <span className="power-count">{owned > 0 ? `x${owned}` : <StarliteAmount value={cost} size={10} className="text-[10px]" />}</span>
        </button>
      );
    })}
  </div>
);
