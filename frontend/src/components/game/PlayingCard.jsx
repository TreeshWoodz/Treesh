import { Ban, Repeat, Sparkles, Eye } from "lucide-react";
import { useSkin } from "@/lib/cosmetics";

export const COLOR_HEX = { red: "#FF3B30", blue: "#007AFF", green: "#34C759", yellow: "#FFCC00" };

const SIZES = {
  xs: "w-7 h-10 text-xs border-2 rounded-md",
  sm: "w-10 h-14 text-lg border-2 rounded-lg",
  md: "w-14 h-20 sm:w-16 sm:h-24 text-2xl sm:text-3xl border-[3px] rounded-xl",
  pile: "w-16 h-24 sm:w-24 sm:h-36 text-3xl sm:text-5xl border-4 rounded-2xl",
  lg: "w-20 h-28 sm:w-24 sm:h-36 text-4xl sm:text-5xl border-4 rounded-2xl",
};

function face(card) {
  if (card.kind === "reveal") return { big: <Eye className="w-[1em] h-[1em]" />, small: "R" };
  if (card.value === "wild4") return { big: "+4", small: "+4" };
  if (card.kind === "wild" || card.value === "wild") return { big: <Sparkles className="w-[1em] h-[1em]" />, small: "W" };
  if (card.value === "skip") return { big: <Ban className="w-[1em] h-[1em]" />, small: "S" };
  if (card.value === "reverse") return { big: <Repeat className="w-[1em] h-[1em]" />, small: "R" };
  if (card.value === "draw2") return { big: "+2", small: "+2" };
  return { big: card.value, small: card.value };
}

const CardBack = ({ size, className = "", testid, onClick, style, skin }) => (
  <button
    type="button"
    data-testid={testid}
    onClick={onClick}
    style={style}
    className={`card-back skin-${skin} relative flex items-center justify-center shrink-0 border-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.45)] ${SIZES[size]} ${className}`}
  >
    <span className="card-oval absolute inset-[12%] rounded-[50%] bg-[#FF3B30] -rotate-[28deg]" />
    <span className="relative font-display font-black italic text-white tracking-tight text-[0.45em] sm:text-[0.5em]">SONOKO</span>
  </button>
);

export const PlayingCard = ({ card, size = "md", selected, dim, faceDown, onClick, testid, className = "", style, shake }) => {
  const skin = useSkin();
  if (faceDown) return <CardBack size={size} className={className} testid={testid} onClick={onClick} style={style} skin={skin} />;
  const isWildBg = card.color === "wild";
  const hex = COLOR_HEX[card.color];
  const { big, small } = face(card);
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      style={{ ...(isWildBg ? {} : { background: hex }), "--card": hex || "#ffffff", ...style }}
      className={`card-face skin-${skin} relative flex items-center justify-center shrink-0 border-white select-none shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition-[transform,opacity,box-shadow] duration-200 ${
        isWildBg ? "wild-bg" : ""
      } ${SIZES[size]} ${selected ? "-translate-y-5 ring-4 ring-white/70 shadow-[0_0_30px_rgba(255,255,255,0.45)]" : ""} ${
        dim ? "opacity-50 saturate-[0.6]" : ""
      } ${shake ? "animate-shake" : ""} ${className}`}
    >
      <span
        className={`card-oval absolute inset-[11%] rounded-[50%] -rotate-[28deg] ${card.kind === "wild" && !isWildBg ? "wild-bg" : "bg-[#0B0F19]"}`}
      />
      <span
        className="relative font-mono font-black leading-none flex items-center"
        style={{ color: isWildBg || card.kind === "wild" ? "#fff" : hex, textShadow: "0 2px 0 rgba(0,0,0,0.5)" }}
      >
        {big}
      </span>
      <span className="absolute top-0.5 left-1 text-[0.32em] font-mono font-black text-white drop-shadow">{small}</span>
      <span className="absolute bottom-0.5 right-1 text-[0.32em] font-mono font-black text-white drop-shadow rotate-180">{small}</span>
    </button>
  );
};
