import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useGame } from "../game/useGame";
import { useProfile } from "../game/store";
import { buildConfig, POWERUPS, THEMES, starsFor, rewardFor, todayStr } from "../game/config";
import { api } from "../game/api";
import { Board } from "../components/Board";
import { Hud, PowerBar } from "../components/Hud";
import { ResultModal, ContinueModal } from "../components/ResultModal";

const useCellSize = () => {
  const ref = useRef(null);
  const [cell, setCell] = useState(0);
  useEffect(() => {
    const el = ref.current;
    const measure = () => setCell(Math.max(26, Math.floor((Math.min(el.clientWidth, el.clientHeight, 600) - 30) / 8)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, cell];
};

function useFinalize(cfg, g) {
  const { profile, update, earn } = useProfile();
  const [result, setResult] = useState(null);
  const done = useRef(false);
  useEffect(() => {
    const e = g.ended;
    if (!e || done.current || (cfg.mode === "classic" && !e.win && !e.gaveUp)) return;
    done.current = true;
    const stars = starsFor(cfg, e.score, e.win);
    const reward = rewardFor(cfg, e, stars);
    const s = g.sess;
    const levelStars = cfg.mode === "classic" && e.win
      ? { ...profile.levelStars, [cfg.level]: Math.max(profile.levelStars[cfg.level] || 0, stars) } : profile.levelStars;
    const metric = cfg.mode === "classic" ? Object.values(levelStars).reduce((a, b) => a + b, 0) : e.score;
    const newBest = e.score > (profile.best[cfg.mode] || 0);
    earn(reward, `${cfg.title} complete`);
    update((p) => ({
      levelStars,
      best: { ...p.best, [cfg.mode]: Math.max(p.best[cfg.mode] || 0, e.score) },
      stats: {
        ...p.stats, games: p.stats.games + 1, tiles: p.stats.tiles + s.tiles, maxCombo: Math.max(p.stats.maxCombo, s.maxCombo),
        discos: p.stats.discos + s.discos, bombs: p.stats.bombs + s.bombs, striped: p.stats.striped + s.striped,
        powerups: p.stats.powerups + s.powerups, earned: p.stats.earned + reward,
        dailyDays: cfg.mode === "daily" ? [...new Set([...p.stats.dailyDays, todayStr()])] : p.stats.dailyDays,
      },
    }));
    if (metric > 0) api.submitScore({ player_id: profile.playerId, name: profile.name, mode: cfg.mode, score: metric }).catch(() => {});
    setResult({ ...e, stars, reward, newBest });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.ended]);
  return result;
}

function Game({ cfg, onReplay }) {
  const nav = useNavigate();
  const { profile, update, spend } = useProfile();
  const [areaRef, cell] = useCellSize();
  const theme = THEMES.find((t) => t.id === profile.theme) || THEMES[0];

  const payFor = (id) => {
    const pu = POWERUPS.find((p) => p.id === id);
    if ((profile.inventory[id] || 0) > 0) {
      update((p) => ({ inventory: { ...p.inventory, [id]: p.inventory[id] - 1 } }));
      return true;
    }
    if (spend(pu.cost, pu.name)) {
      toast.success(`${pu.name} activated`);
      return true;
    }
    toast.error(`Need ${pu.cost} Starlites for ${pu.name}`);
    return false;
  };

  const g = useGame(cfg, { onPowerUsed: payFor });
  const result = useFinalize(cfg, g);
  const showContinue = g.ended && cfg.mode === "classic" && !g.ended.win && !g.ended.gaveUp;

  return (
    <div className="play-screen bg-app" data-testid="play-screen">
      <div className="mx-auto flex h-full w-full max-w-[620px] flex-col px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-[max(env(safe-area-inset-top),0.75rem)]">
        <Hud cfg={cfg} g={g} onExit={() => nav(cfg.mode === "classic" ? "/levels" : "/")} />
        <div ref={areaRef} className="relative flex min-h-0 flex-1 items-center justify-center py-2">
          {cell > 0 && <Board g={g} cell={cell} theme={theme} />}
          <AnimatePresence>
            {g.armed === "hammer" && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} data-testid="hammer-armed-hint"
                className="pointer-events-none absolute bottom-0 left-0 right-0 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-amber-300">Tap any tile to smash it</motion.div>
            )}
          </AnimatePresence>
        </div>
        <PowerBar cfg={cfg} g={g} inventory={profile.inventory} />
      </div>
      {showContinue && (
        <ContinueModal cost={200} owned={profile.inventory.extra_moves || 0}
          onContinue={() => payFor("extra_moves") && g.continueGame()} onGiveUp={g.giveUp} />
      )}
      {result && (
        <ResultModal cfg={cfg} result={result} onReplay={onReplay} onHome={() => nav("/")} onRanks={() => nav(`/leaderboard?mode=${cfg.mode}`)}
          onNext={cfg.mode === "classic" && result.win && cfg.level < 30 ? () => nav(`/play/classic/${cfg.level + 1}`) : null} />
      )}
    </div>
  );
}

export default function Play() {
  const { mode, level } = useParams();
  const { profile } = useProfile();
  const [nonce, setNonce] = useState(0);
  const cfg = useMemo(() => buildConfig(mode, Number(level)), [mode, level]);
  if (!cfg) return <Navigate to="/" replace />;
  if (cfg.mode === "classic" && cfg.level > 1 && !profile.levelStars[cfg.level - 1]) return <Navigate to="/levels" replace />;
  return <Game key={`${mode}-${level}-${nonce}`} cfg={cfg} onReplay={() => setNonce((n) => n + 1)} />;
}
