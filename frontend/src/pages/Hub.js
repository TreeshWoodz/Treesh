import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Gift, Trophy, Play, HelpCircle, X } from "lucide-react";
import { Layout } from "../components/Layout";
import { FormationGuide } from "../components/FormationGuide";
import { StarliteAmount } from "../components/Starlite";
import { MODES, ACHIEVEMENTS, todayStr } from "../game/config";
import { useProfile } from "../game/store";
import { sfx } from "../game/sound";

const ModeTile = ({ m, i, onClick }) => (
  <motion.button data-testid={`mode-select-${m.id}`} onClick={onClick} initial={{ opacity: 0, y: 24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: 0.35 + i * 0.06, type: "spring", stiffness: 260, damping: 20 }} whileHover={{ y: -5 }} whileTap={{ scale: 0.94 }}
    className="mode-tile group" style={{ "--accent": m.color }}>
    {m.tag === "New" && <span className="mode-new">New</span>}
    <span className="mode-gem"><m.Icon size={24} strokeWidth={2.4} /></span>
    <span className="font-display text-[12px] font-black leading-tight text-white sm:text-sm">{m.name}</span>
    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{m.tag === "New" ? "Flood" : m.tag}</span>
  </motion.button>
);

const HowToModal = ({ onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid="how-to-modal"
    className="fixed inset-0 z-[55] overflow-y-auto bg-black/75 p-4 backdrop-blur-md" onClick={onClose}>
    <motion.div initial={{ y: 30, scale: 0.95 }} animate={{ y: 0, scale: 1 }} className="modal-card mx-auto my-6 max-w-4xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-end"><button data-testid="how-to-close-btn" onClick={onClose} className="icon-btn"><X size={18} /></button></div>
      <div className="-mt-10"><FormationGuide /></div>
    </motion.div>
  </motion.div>
);

export default function Hub() {
  const nav = useNavigate();
  const { profile, update, earn } = useProfile();
  const [howTo, setHowTo] = useState(false);
  const bonusReady = profile.lastBonus !== todayStr();
  const done = Object.keys(profile.levelStars).length;
  const next = Math.min(30, done + 1);

  const claimBonus = () => {
    earn(100, "Daily drop");
    update((p) => ({ lastBonus: todayStr(), stats: { ...p.stats, earned: p.stats.earned + 100 } }));
    sfx.coin();
    toast.success("+100 Starlites! Come back tomorrow for more.");
  };

  return (
    <Layout art="menu">
      <section className="title-screen" data-testid="title-screen">
        <motion.div className="text-center lg:text-left" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="eyebrow !mb-1">Welcome back, {profile.name}</div>
          <h1 className="title-logo font-display" data-testid="title-logo">
            <span className="block">BRONZE</span><span className="block">BLITZ</span>
          </h1>
          <div className="mt-2 inline-block rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--ac-hi)]">A Treesh Games Original</div>
        </motion.div>

        <motion.button data-testid="hero-play-btn" onClick={() => nav(`/play/classic/${next}`)} className="btn-play mx-auto lg:mx-0"
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 240 }} whileTap={{ scale: 0.95 }}>
          <Play size={30} fill="currentColor" />
          <span className="flex flex-col items-start leading-none">
            <span className="font-display text-2xl font-black sm:text-3xl">PLAY</span>
            <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">Level {next}</span>
          </span>
        </motion.button>

        <div className="grid w-full max-w-xl grid-cols-3 gap-2 sm:gap-3 lg:max-w-lg">
          {MODES.map((m, i) => (
            <ModeTile key={m.id} m={m} i={i} onClick={() => nav(m.id === "classic" ? "/levels" : m.id === "colorpop" ? "/colorpop" : `/play/${m.id}`)} />
          ))}
        </div>

        <div className="flex w-full max-w-xl flex-wrap items-center justify-center gap-2 lg:max-w-lg lg:justify-start">
          <button data-testid="daily-bonus-claim-btn" disabled={!bonusReady} onClick={claimBonus} className={`chest-btn ${bonusReady ? "chest-ready" : ""}`}>
            <Gift size={20} /> {bonusReady ? <>Daily Drop <StarliteAmount value={100} size={12} /></> : "Claimed"}
          </button>
          <button data-testid="how-to-play-btn" onClick={() => setHowTo(true)} className="chest-btn"><HelpCircle size={20} /> How to Play</button>
          <Link to="/trophies" data-testid="hub-trophies-link" className="chest-btn"><Trophy size={20} /> {profile.claimed.length}/{ACHIEVEMENTS.length}</Link>
        </div>
        <div data-testid="hub-levels-cleared" className="sr-only">{done}/30</div>
      </section>
      <AnimatePresence>{howTo && <HowToModal onClose={() => setHowTo(false)} />}</AnimatePresence>
    </Layout>
  );
}
