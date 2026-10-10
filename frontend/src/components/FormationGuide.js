import { motion } from "framer-motion";
import { MoveDiagonal } from "lucide-react";
import { TileFace } from "./TileFace";
import { DISCO } from "../game/engine";

const SHAPES = [
  { name: "Striped", how: "Line of 4", grid: ["XXXX"], special: "col" },
  { name: "X-Blaster", how: "2x2 square or diagonal 4", grid: ["XX", "XX"], special: "x" },
  { name: "Crown Cross", how: "Plus shape", grid: [".X.", "XXX", ".X."], special: "cross" },
  { name: "Blitz Bomb", how: "L or T shape", grid: ["X..", "X..", "XXX"], special: "bomb" },
  { name: "Supernova", how: "2x3 block", grid: ["XXX", "XXX"], special: "nova" },
  { name: "Starlite Disco", how: "Line of 5, any direction", grid: ["XXXXX"], special: "disco" },
];

const Shape = ({ grid }) => (
  <div className="flex flex-col items-center gap-[3px]">
    {grid.map((row, r) => (
      <div key={r} className="flex gap-[3px]">
        {row.split("").map((ch, c) => <span key={c} className={`h-2.5 w-2.5 rounded-[3px] ${ch === "X" ? "bg-[var(--ac)]" : "bg-white/5"}`} />)}
      </div>
    ))}
  </div>
);

export const FormationGuide = () => (
  <section className="mt-14" data-testid="formation-guide">
    <div className="eyebrow">Unique Moves</div>
    <h2 className="font-display text-2xl font-black text-white sm:text-3xl">Formations and power-ups</h2>
    <p className="mt-2 max-w-xl text-sm text-slate-400">
      <MoveDiagonal size={14} className="mr-1 inline text-[var(--ac-hi)]" />
      Swap in any of 8 directions, diagonals included. Diagonal lines of 3 match too. Swap two power-ups into each other for a mega combo.
    </p>
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {SHAPES.map((s, i) => (
        <motion.div key={s.name} data-testid={`formation-${s.special}`} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="trophy-card flex flex-col items-center gap-3 text-center">
          <Shape grid={s.grid} />
          <div className="relative h-12 w-12"><TileFace tile={{ type: s.special === "disco" ? DISCO : i % 6, special: s.special }} size={48} /></div>
          <div>
            <div className="font-display text-sm font-bold text-white">{s.name}</div>
            <div className="text-[11px] text-slate-400">{s.how}</div>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);
