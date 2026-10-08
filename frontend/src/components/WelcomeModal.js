import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "../game/store";
import { StarliteAmount } from "./Starlite";

export const WelcomeModal = () => {
  const { profile, update } = useProfile();
  const [name, setName] = useState(profile.name);
  const go = () => update(() => ({ onboarded: true, name: name.trim().length >= 2 ? name.trim().slice(0, 20) : profile.name }));
  return (
    <AnimatePresence>
      {!profile.onboarded && (
        <motion.div data-testid="welcome-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <motion.div initial={{ y: 40, scale: 0.92 }} animate={{ y: 0, scale: 1 }} className="modal-card w-full max-w-md">
            <div className="eyebrow">Treesh Games presents</div>
            <h2 className="font-display text-4xl font-black text-gold">Bronze Blitz</h2>
            <p className="mt-3 text-sm text-slate-300">Match the culture, set off combos, and collect Starlites. Here's <StarliteAmount value={200} /> to get you started.</p>
            <label className="hud-label mt-6 block">Choose your player tag</label>
            <input data-testid="welcome-name-input" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} className="field mt-2 w-full" />
            <button data-testid="welcome-start-btn" onClick={go} className="btn-bronze mt-6 w-full">Let's Blitz</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
