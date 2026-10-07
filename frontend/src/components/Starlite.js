import { motion } from "framer-motion";
import { StarliteIcon } from "./CultureIcons";

export const StarliteBadge = ({ value, testId = "starlites-balance-display" }) => (
  <div data-testid={testId} className="starlite-pill">
    <StarliteIcon size={18} />
    <motion.span key={value} initial={{ scale: 1.35, color: "#FFF4B0" }} animate={{ scale: 1, color: "#FFC800" }}
      className="font-display font-bold tabular-nums">
      {value.toLocaleString()}
    </motion.span>
  </div>
);

export const StarliteAmount = ({ value, size = 14, className = "" }) => (
  <span className={`inline-flex items-center gap-1 font-bold tabular-nums text-[#FFC800] ${className}`}>
    <StarliteIcon size={size} />
    {value.toLocaleString()}
  </span>
);
