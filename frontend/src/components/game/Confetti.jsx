import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#FF3B30", "#007AFF", "#FFCC00", "#34C759", "#F59E0B", "#ffffff"];

export const Confetti = ({ active }) => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        i,
        x: Math.random() * 100,
        dx: (Math.random() - 0.5) * 200,
        r: Math.random() * 720,
        d: 1.8 + Math.random() * 1.6,
        delay: Math.random() * 0.6,
        c: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 6,
      })),
    [active] // eslint-disable-line react-hooks/exhaustive-deps
  );
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" data-testid="confetti">
      {pieces.map((p) => (
        <motion.span
          key={p.i}
          className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: -24, width: p.w, height: p.w * 1.5, background: p.c }}
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: "110vh", x: p.dx, rotate: p.r, opacity: [1, 1, 0.8] }}
          transition={{ duration: p.d, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
};
