import { motion, AnimatePresence } from "framer-motion";
import { COLOR_HEX } from "./PlayingCard";
import { TINT } from "@/lib/sonoko";

export const SonokoBoard = ({ g, floaters = [], errCell, selCell, armed, glowCell, onTap, testid = "sonoko-board", cellPrefix = "sonoko-cell" }) => (
  <div data-testid={testid} className="board-surface grid grid-cols-6 aspect-square w-full rounded-2xl overflow-hidden border-2 border-white/25 bg-[#0F1424] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
    {g.board.map((v, i) => {
      const r = Math.floor(i / 6), c = i % 6;
      const color = g.cellColors[i];
      const owner = g.placedBy?.[i];
      return (
        <button
          key={i}
          type="button"
          data-testid={`${cellPrefix}-${r}-${c}`}
          onClick={() => onTap(i)}
          style={{ background: TINT[color] }}
          className={`relative flex items-center justify-center border-white/[0.07] ${c < 5 ? "border-r" : ""} ${r < 5 ? "border-b" : ""} ${
            c === 2 ? "!border-r-2 !border-r-white/30" : ""
          } ${r === 1 || r === 3 ? "!border-b-2 !border-b-white/30" : ""} ${errCell === i ? "animate-shake !bg-[#FF3B30]/50" : ""} ${
            selCell === i ? "ring-4 ring-inset ring-white" : ""
          } ${glowCell === i ? "ring-4 ring-inset ring-brand !bg-brand/30 animate-pulse" : ""} ${!v && armed ? "hover:bg-white/20" : ""} transition-colors duration-150`}
        >
          {v ? (
            <motion.span
              initial={g.given[i] ? false : { scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-mono font-extrabold text-2xl sm:text-4xl"
              style={{
                color: g.given[i] ? "#CBD5E1" : COLOR_HEX[g.placedColor[i]],
                textShadow: g.given[i] ? "none" : `0 0 18px ${COLOR_HEX[g.placedColor[i]]}99`,
              }}
            >
              {v}
            </motion.span>
          ) : (
            <span
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${armed ? "animate-pulse scale-150" : "opacity-70"} transition-transform duration-200`}
              style={{ background: COLOR_HEX[color] }}
            />
          )}
          {owner && (
            <span
              data-testid={`${cellPrefix}-${r}-${c}-owner-${owner}`}
              className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-l-[12px] border-l-transparent"
              style={{ borderTopColor: owner === "bot" ? "#FF3B30" : "var(--brand)" }}
            />
          )}
          <AnimatePresence>
            {floaters
              .filter((f) => f.i === i)
              .map((f) => (
                <motion.span
                  key={f.id}
                  initial={{ y: 0, opacity: 1 }}
                  animate={{ y: -34, opacity: 0 }}
                  transition={{ duration: 0.9 }}
                  className="absolute z-10 font-mono font-black text-sm sm:text-base pointer-events-none whitespace-nowrap"
                  style={{ color: f.color, textShadow: "0 2px 6px #000" }}
                >
                  {f.text}
                </motion.span>
              ))}
          </AnimatePresence>
        </button>
      );
    })}
  </div>
);
