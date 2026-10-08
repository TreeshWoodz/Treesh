import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Gift, ArrowRight, Trophy, Flame } from "lucide-react";
import { Layout } from "../components/Layout";
import { TileFace } from "../components/TileFace";
import { StarliteAmount } from "../components/Starlite";
import { MODES, ACHIEVEMENTS, todayStr } from "../game/config";
import { useProfile } from "../game/store";
import { sfx } from "../game/sound";

const FLOAT = [[0, 5], [3, 0], [5, 1], [1, 3], [99, 2], [4, 4], [2, 6], [6, 5]];

const HeroArt = () => (
  <div className="relative mx-auto grid w-full max-w-[340px] grid-cols-4 gap-3 sm:max-w-[380px]" aria-hidden>
    {FLOAT.map(([type, d], i) => (
      <motion.div key={i} className="relative aspect-square" initial={{ opacity: 0, y: 30, rotate: -10 }}
        animate={{ opacity: 1, y: [0, -8, 0], rotate: 0 }}
        transition={{ opacity: { delay: i * 0.08 }, rotate: { delay: i * 0.08 }, y: { repeat: Infinity, duration: 3 + d * 0.3, delay: d * 0.2 } }}>
        <TileFace tile={{ type, special: i === 3 ? "row" : i === 6 ? "bomb" : null }} size={80} />
      </motion.div>
    ))}
  </div>
);

const ModeCard = ({ m, i, onClick, big }) => (
  <motion.button data-testid={`mode-select-${m.id}`} onClick={onClick} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 + i * 0.07 }} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
    className={`mode-card group ${big ? "md:col-span-2 md:row-span-2 md:min-h-[300px]" : ""}`} style={{ "--accent": m.color }}>
    <div className="flex items-start justify-between">
      <div className="mode-icon"><m.Icon size={big ? 30 : 22} /></div>
      <span className="mode-tag">{m.tag}</span>
    </div>
    <div className="mt-auto pt-8 text-left">
      <h3 className={`font-display font-black tracking-tight text-white ${big ? "text-3xl sm:text-4xl" : "text-xl"}`}>{m.name}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-400">{m.desc}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
        Play <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  </motion.button>
);

export default function Hub() {
  const nav = useNavigate();
  const { profile, update, earn } = useProfile();
  const [claiming, setClaiming] = useState(false);
  const bonusReady = profile.lastBonus !== todayStr();
  const done = Object.keys(profile.levelStars).length;
  const next = Math.min(30, done + 1);
  const trophies = profile.claimed.length;

  const claimBonus = () => {
    setClaiming(true);
    earn(100, "Daily drop");
    update((p) => ({ lastBonus: todayStr(), stats: { ...p.stats, earned: p.stats.earned + 100 } }));
    sfx.coin();
    toast.success("+100 Starlites! Come back tomorrow for more.");
  };

  return (
    <Layout>
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="rise">
          <div className="eyebrow">Welcome back, {profile.name}</div>
          <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-gold">Bronze</span><br /><span className="text-white">Blitz.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-slate-300">Match the culture. Swap vinyl, crowns, kicks and djembes, set off Blitz Bombs, and stack Starlites all the way to Afrofuture.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button data-testid="hero-play-btn" onClick={() => nav(`/play/classic/${next}`)} className="btn-bronze text-base">
              Play Level {next} <ArrowRight size={18} />
            </button>
            <Link to="/levels" data-testid="hero-map-btn" className="btn-ghost">View Level Map</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <div><div className="hud-label">Levels cleared</div><div data-testid="hub-levels-cleared" className="font-display text-2xl font-black text-white">{done}/30</div></div>
            <div><div className="hud-label">Trophies</div><div className="font-display text-2xl font-black text-white">{trophies}/{ACHIEVEMENTS.length}</div></div>
            <div><div className="hud-label">Best combo</div><div className="font-display text-2xl font-black text-white">x{profile.stats.maxCombo}</div></div>
          </div>
        </div>
        <HeroArt />
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className={`bonus-card ${bonusReady ? "" : "opacity-70"}`} data-testid="daily-bonus-card">
          <div className="mode-icon" style={{ "--accent": "#FFC800" }}><Gift size={22} /></div>
          <div className="flex-1">
            <div className="font-display text-lg font-bold text-white">Daily Starlite Drop</div>
            <div className="text-sm text-slate-400">{bonusReady ? "Your free daily bag is ready." : "Claimed. Fresh drop tomorrow."}</div>
          </div>
          <button data-testid="daily-bonus-claim-btn" disabled={!bonusReady || claiming} onClick={claimBonus} className="btn-bronze !px-4 !py-2 text-sm">
            {bonusReady ? <>Claim <StarliteAmount value={100} className="text-[#2a1405]" /></> : "Claimed"}
          </button>
        </div>
        <Link to="/trophies" data-testid="hub-trophies-link" className="bonus-card hover:border-[#C87D32]/60">
          <div className="mode-icon" style={{ "--accent": "#C87D32" }}><Trophy size={22} /></div>
          <div className="flex-1">
            <div className="font-display text-lg font-bold text-white">Trophy Room</div>
            <div className="text-sm text-slate-400">Unlock achievements and claim Starlite rewards.</div>
          </div>
          <Flame size={20} className="text-amber-400" />
        </Link>
      </section>

      <section className="mt-14">
        <div className="eyebrow">Game Modes</div>
        <h2 className="font-display text-2xl font-black text-white sm:text-3xl">Pick your vibe</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {MODES.map((m, i) => (
            <ModeCard key={m.id} m={m} i={i} big={i === 0} onClick={() => nav(m.id === "classic" ? "/levels" : `/play/${m.id}`)} />
          ))}
        </div>
      </section>
    </Layout>
  );
}
