import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Infinity as InfinityIcon, SlidersHorizontal } from "lucide-react";
import { Layout, PageTitle } from "../components/Layout";

const OPTIONS = [
  { id: "classic", to: "/play/zen", name: "Classic Zen", tag: "Full Starlites", desc: "The original. No timer, no limits, just smooth cascades.", Icon: InfinityIcon, color: "#10B981" },
  { id: "custom", to: "/zen/custom", name: "Custom Zen", tag: "Sandbox - Half Starlites", desc: "Your board, your rules. Gravity, chaos events, exclusive specials and more.", Icon: SlidersHorizontal, color: "#A855F7" },
];

export default function ZenSelect() {
  const nav = useNavigate();
  return (
    <Layout art="harlem">
      <PageTitle eyebrow="Relax Mode" title="Endless Zen">
        <p className="max-w-md text-sm text-slate-200">Pick your vibe. Keep it classic or open the sandbox and bend the rules of the board.</p>
      </PageTitle>
      <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
        {OPTIONS.map((o, i) => (
          <motion.button key={o.id} data-testid={`zen-option-${o.id}`} onClick={() => nav(o.to)}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -6 }} whileTap={{ scale: 0.96 }}
            className="mode-tile !min-h-[220px] !gap-3 !p-6" style={{ "--accent": o.color }}>
            {o.id === "custom" && <span className="mode-new">New</span>}
            <span className="mode-gem"><o.Icon size={28} strokeWidth={2.4} /></span>
            <span className="font-display text-2xl font-black text-white">{o.name}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">{o.tag}</span>
            <span className="max-w-[240px] text-xs text-slate-300">{o.desc}</span>
          </motion.button>
        ))}
      </div>
    </Layout>
  );
}
