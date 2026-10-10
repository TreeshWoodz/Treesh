import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Layout, PageTitle } from "../components/Layout";
import { MiniTile } from "../components/TileFace";
import { COLORPOP_LEVELS } from "../game/config";
import { useProfile } from "../game/store";

const ACCENTS = ["#10B981", "#F59E0B", "#EF4444"];

export default function ColorPopSelect() {
  const nav = useNavigate();
  const { profile } = useProfile();
  return (
    <Layout art="mural">
      <PageTitle eyebrow="New Mode" title="Color Pop">
        <p className="max-w-md text-sm text-slate-200">Start from a random glowing tile. Pick a color to grow your patch into every touching tile of that color. Paint the whole board one color before your moves run out.</p>
      </PageTitle>
      <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
        {COLORPOP_LEVELS.map((d, i) => {
          const stars = profile.cpStars?.[d.level] || 0;
          return (
            <motion.button key={d.level} data-testid={`colorpop-difficulty-${d.name.toLowerCase()}`} onClick={() => nav(`/play/colorpop/${d.level}`)}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -6 }} whileTap={{ scale: 0.96 }}
              className="mode-tile !min-h-[220px] !gap-3 !p-5" style={{ "--accent": ACCENTS[i] }}>
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }, (_, k) => <MiniTile key={k} type={(k * (i + 2) + i) % d.colors} size={22} />)}
              </div>
              <span className="font-display text-2xl font-black text-white">{d.name}</span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{d.size}x{d.size} board, {d.colors} colors</span>
              <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white">{d.moves} moves</span>
              <span className="flex gap-1">
                {[1, 2, 3].map((s) => <Star key={s} size={16} className={s <= stars ? "fill-[#FFC800] text-[#FFC800]" : "text-white/20"} />)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </Layout>
  );
}
