import { motion } from "framer-motion";

const COLORS = ["var(--eb-gold)", "var(--eb-a1)", "var(--eb-a2)", "#10B981", "#fff"];

export const Confetti = ({ count = 40 }) => (
  <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
    {Array.from({ length: count }).map((_, i) => (
      <motion.span key={i} className="absolute top-0 w-2 h-3 rounded-sm"
        style={{ left: `${(i * 37) % 100}%`, background: COLORS[i % COLORS.length] }}
        initial={{ y: -40, rotate: 0, opacity: 1 }}
        animate={{ y: "105vh", rotate: 540 + i * 20, opacity: [1, 1, 0] }}
        transition={{ duration: 2.2 + (i % 5) * 0.3, delay: (i % 10) * 0.06, ease: "easeIn" }} />
    ))}
  </div>
);
