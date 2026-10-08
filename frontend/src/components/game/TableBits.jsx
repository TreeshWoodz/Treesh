import { motion, AnimatePresence } from "framer-motion";
import { Megaphone } from "lucide-react";
import { PlayingCard } from "./PlayingCard";

export const DeckStack = ({ onClick, testid, className = "", label }) => (
  <div className="shrink-0 flex flex-col items-center gap-0.5 pb-3">
    <div className="relative">
      <span className="absolute inset-0 translate-x-[5px] -translate-y-[5px] pointer-events-none opacity-50" aria-hidden>
        <PlayingCard faceDown size="md" />
      </span>
      <span className="absolute inset-0 translate-x-[2.5px] -translate-y-[2.5px] pointer-events-none opacity-75" aria-hidden>
        <PlayingCard faceDown size="md" />
      </span>
      <PlayingCard faceDown size="md" testid={testid} onClick={onClick} className={`relative transition-transform duration-150 hover:-translate-y-1 active:scale-95 ${className}`} />
    </div>
    {label}
  </div>
);

export const TopCardSlot = ({ card, testid = "discard-pile-top-card" }) => (
  <div className="shrink-0 glass rounded-2xl px-1.5 py-1 flex flex-col items-center justify-center">
    <AnimatePresence mode="popLayout">
      <motion.div key={card.id} initial={{ scale: 1.5, rotate: -16, opacity: 0 }} animate={{ scale: 1, rotate: 3, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
        <PlayingCard card={card} size="hud" testid={testid} />
      </motion.div>
    </AnimatePresence>
    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 leading-none mt-0.5">Top</span>
  </div>
);

export const CallButton = ({ testid, onClick, called, ready }) => (
  <div className="shrink-0 pb-3">
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full font-display font-black italic uppercase text-[11px] sm:text-sm leading-none border-4 transition-[transform,background-color] duration-200 active:scale-90 ${
        called ? "bg-[#34C759] border-white text-[#0B0F19]" : ready ? "bg-[#FFCC00] border-white text-[#0B0F19] animate-glow scale-110" : "bg-white/5 border-white/15 text-slate-400"
      }`}
    >
      <Megaphone className="w-4 h-4 mx-auto mb-0.5" />
      {called ? "Called" : "Sonoko!"}
    </button>
  </div>
);
