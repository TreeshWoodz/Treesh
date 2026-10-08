import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Star } from "lucide-react";
import { Layout, PageTitle } from "../components/Layout";
import { CHAPTERS, LEVELS } from "../game/config";
import { useProfile } from "../game/store";

const Node = ({ lvl, stars, unlocked, current, onClick }) => {
  const offset = Math.sin(lvl.n * 0.85);
  return (
    <div className="flex justify-center" style={{ transform: `translateX(calc(${offset.toFixed(3)} * min(24vw, 120px)))` }}>
      <motion.button data-testid={`level-node-${lvl.n}`} disabled={!unlocked} onClick={onClick}
        initial={{ scale: 0.6, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
        whileHover={unlocked ? { scale: 1.08 } : {}} whileTap={unlocked ? { scale: 0.95 } : {}}
        className={`level-node ${stars ? "level-done" : ""} ${current ? "level-current" : ""} ${unlocked ? "" : "level-locked"}`}>
        {unlocked ? <span className="font-display text-xl font-black">{lvl.n}</span> : <Lock size={18} />}
        <div className="absolute -bottom-5 flex gap-0.5">
          {[1, 2, 3].map((i) => (
            <Star key={i} size={13} className={i <= stars ? "fill-[#FFC800] text-[#FFC800]" : "fill-white/5 text-white/15"} />
          ))}
        </div>
        {(lvl.kente || lvl.collect) && unlocked && <span className="level-badge">{lvl.kente ? "Kente" : "Collect"}</span>}
      </motion.button>
    </div>
  );
};

export default function LevelMap() {
  const nav = useNavigate();
  const { profile } = useProfile();
  const total = Object.values(profile.levelStars).reduce((a, b) => a + b, 0);
  const unlocked = (n) => n === 1 || (profile.levelStars[n - 1] || 0) > 0;
  const current = LEVELS.find((l) => unlocked(l.n) && !profile.levelStars[l.n])?.n;

  return (
    <Layout>
      <PageTitle eyebrow="Classic Levels" title="The Level Map">
        <div className="starlite-pill" data-testid="map-total-stars"><Star size={16} className="fill-[#FFC800] text-[#FFC800]" /> <span className="font-display font-bold">{total}/90</span></div>
      </PageTitle>
      <div className="mx-auto max-w-md overflow-x-clip" data-testid="level-map-container">
        {CHAPTERS.map((ch) => (
          <section key={ch.name} className="relative mb-12">
            <div className="chapter-banner">
              <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-200/60">{ch.sub}</div>
              <div className="font-display text-xl font-black text-gold">{ch.name}</div>
            </div>
            <div className="map-trail relative mt-8 flex flex-col gap-10 py-4">
              {LEVELS.slice(ch.from - 1, ch.to).map((lvl) => (
                <Node key={lvl.n} lvl={lvl} stars={profile.levelStars[lvl.n] || 0} unlocked={unlocked(lvl.n)}
                  current={current === lvl.n} onClick={() => nav(`/play/classic/${lvl.n}`)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Layout>
  );
}
