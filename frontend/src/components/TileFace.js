import { Sparkles } from "lucide-react";
import { TILES } from "../game/config";
import { DISCO } from "../game/engine";

export const TileFace = ({ tile, size, selected, hint }) => {
  const cls = `tile-face ${selected ? "tile-selected" : ""} ${hint ? "tile-hint" : ""}`;
  if (tile.type === DISCO)
    return (
      <div className={`${cls} tile-disco`}>
        <Sparkles size={size * 0.5} color="#fff" strokeWidth={2.4} />
      </div>
    );
  const t = TILES[tile.type];
  return (
    <div className={cls} style={{ background: `radial-gradient(circle at 30% 22%, ${t.from}, ${t.to} 78%)`, "--glow": t.glow }}>
      <t.Icon size={size * 0.52} strokeWidth={2.1} color="#fff" className="tile-icon" />
      {tile.special === "row" && <span className="stripe stripe-row special-in" />}
      {tile.special === "col" && <span className="stripe stripe-col special-in" />}
      {tile.special === "bomb" && <span className="bomb-ring special-in" />}
      {tile.special === "x" && <span className="stripe stripe-x special-in" />}
      {tile.special === "cross" && <span className="cross-glow special-in" />}
      {tile.special === "nova" && <span className="nova-core special-in" />}
    </div>
  );
};

export const MiniTile = ({ type, size = 28 }) => (
  <div style={{ width: size, height: size }} className="relative shrink-0">
    <TileFace tile={{ type, special: null }} size={size} />
  </div>
);
