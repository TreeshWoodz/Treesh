import { motion } from "framer-motion";
import { X, Pause } from "lucide-react";
import { useSandbox, SandboxPanels, Presets } from "../pages/CustomZen";

export const TweakPanel = ({ onClose }) => {
  const { s, set, applyPreset } = useSandbox();
  return (
    <motion.div className="fixed inset-0 z-[45]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} data-testid="tweak-panel-backdrop" />
      <motion.aside data-testid="tweak-panel" className="tweak-panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}>
        <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 flex items-center justify-between gap-3 border-b border-white/10 bg-[#120c18]/95 px-4 py-3 backdrop-blur">
          <div>
            <div className="font-display text-lg font-black text-white">Tweak Sandbox</div>
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ac-hi)]"><Pause size={10} /> Chaos paused - changes apply live</div>
          </div>
          <button data-testid="tweak-panel-close-btn" onClick={onClose} className="icon-btn"><X size={18} /></button>
        </div>
        <div className="mb-4"><Presets applyPreset={applyPreset} /></div>
        <SandboxPanels s={s} set={set} stacked />
        <button data-testid="tweak-panel-done-btn" onClick={onClose} className="btn-bronze mt-4 w-full">Back to the Board</button>
      </motion.aside>
    </motion.div>
  );
};
