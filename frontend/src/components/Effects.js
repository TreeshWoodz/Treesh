import { motion } from "framer-motion";

const DOTS = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2);

const Beam = ({ style, axis, rotate = 0 }) => (
  <motion.div className="fx-beam" style={{ ...style, rotate }}
    initial={{ [axis]: 0, opacity: 1 }} animate={{ [axis]: [0, 1, 1], opacity: [1, 1, 0] }}
    transition={{ duration: 0.6, times: [0, 0.35, 1], ease: "easeOut" }} />
);

const Ring = ({ e, cell }) => {
  const cx = (e.c + 0.5) * cell, cy = (e.r + 0.5) * cell, d = e.size * cell;
  return (
    <>
      <motion.div className={`fx-ring ${e.big ? "fx-ring-big" : ""}`} style={{ left: cx - d / 2, top: cy - d / 2, width: d, height: d }}
        initial={{ scale: 0.1, opacity: 1 }} animate={{ scale: 1.15, opacity: 0 }} transition={{ duration: 0.65, ease: "easeOut" }} />
      <motion.div className="fx-flash" style={{ left: cx - d / 3, top: cy - d / 3, width: (d * 2) / 3, height: (d * 2) / 3 }}
        initial={{ scale: 0.3, opacity: 0.9 }} animate={{ scale: 1.3, opacity: 0 }} transition={{ duration: 0.45 }} />
      {DOTS.map((a, i) => (
        <motion.span key={i} className="fx-spark" style={{ left: cx - 4, top: cy - 4 }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: Math.cos(a) * d * 0.6, y: Math.sin(a) * d * 0.6, scale: 0.2, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }} />
      ))}
    </>
  );
};

const Bolt = ({ e, cell }) => {
  const W = cell * 8;
  const cx = (e.c + 0.5) * cell, cy = (e.r + 0.5) * cell;
  return (
    <svg className="absolute inset-0 overflow-visible" width={W} height={W}>
      {e.targets.slice(0, 30).map(([r, c], i) => {
        const tx = (c + 0.5) * cell, ty = (r + 0.5) * cell;
        const mx = (cx + tx) / 2 + (i % 2 ? 1 : -1) * cell * 0.4, my = (cy + ty) / 2 + (i % 3 ? -1 : 1) * cell * 0.3;
        return (
          <motion.path key={i} d={`M${cx},${cy} L${mx},${my} L${tx},${ty}`} className="fx-bolt"
            initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: [1, 1, 0] }}
            transition={{ duration: 0.55, delay: i * 0.012 }} />
        );
      })}
      <motion.circle cx={cx} cy={cy} r={cell} className="fx-bolt-core" initial={{ scale: 0.2, opacity: 1 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ duration: 0.6 }} />
    </svg>
  );
};

const Effect = ({ e, cell }) => {
  const W = cell * 8;
  const t = cell * 0.7;
  if (e.kind === "row") return <Beam axis="scaleX" style={{ left: 0, top: e.r * cell + (cell - t) / 2, width: W, height: t }} />;
  if (e.kind === "col") return <Beam axis="scaleY" style={{ top: 0, left: e.c * cell + (cell - t) / 2, width: t, height: W }} />;
  if (e.kind === "x") {
    const L = W * 1.5, cx = (e.c + 0.5) * cell, cy = (e.r + 0.5) * cell;
    const style = { left: cx - L / 2, top: cy - t / 2, width: L, height: t };
    return (<><Beam axis="scaleX" style={style} rotate={45} /><Beam axis="scaleX" style={style} rotate={-45} /></>);
  }
  if (e.kind === "ring") return <Ring e={e} cell={cell} />;
  if (e.kind === "bolt") return <Bolt e={e} cell={cell} />;
  return null;
};

export const Effects = ({ effects, cell }) => (
  <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-xl">
    {effects.map((e) => <Effect key={e.id} e={e} cell={cell} />)}
  </div>
);
