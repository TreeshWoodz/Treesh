import { Sparkles, Package, Disc3, Zap, Link2, Rainbow, Paintbrush, Snowflake, CloudRain } from "lucide-react";
import { TILES } from "../game/config";
import { DISCO, CRATE, RECORD, STATIC, WILD } from "../game/engine";

const BADGE = { lightning: Zap, paint: Paintbrush, freeze: Snowflake, gold: CloudRain };

export const TileFace = ({ tile, size, selected, hint }) => {
  const cls = `tile-face ${selected ? "tile-selected" : ""} ${hint ? "tile-hint" : ""}`;
  if (tile.type === DISCO)
    return (
      <div className={`${cls} tile-disco`}>
        <Sparkles size={size * 0.5} color="#fff" strokeWidth={2.4} />
      </div>
    );
  if (tile.type === WILD)
    return <div data-kind="wild" className={`${cls} tile-wild`}><Rainbow size={size * 0.55} color="#fff" strokeWidth={2.4} /></div>;
  if (tile.type === CRATE)
    return <div data-kind="crate" className={`${cls} tile-crate ${tile.hp > 1 ? "crate-2" : ""}`}><Package size={size * 0.5} color="#fde68a" strokeWidth={2.2} /></div>;
  if (tile.type === RECORD)
    return <div data-kind="record" className={`${cls} tile-record`}><Disc3 size={size * 0.62} color="#3b2503" strokeWidth={2.2} /></div>;
  if (tile.type === STATIC)
    return <div data-kind="static" className={`${cls} tile-static`}><Zap size={size * 0.5} color="#e9d5ff" strokeWidth={2.4} /></div>;
  const t = TILES[tile.type];
  const Badge = BADGE[tile.special];
  return (
    <div className={cls} style={{ background: `radial-gradient(circle at 30% 22%, ${t.from}, ${t.to} 78%)`, "--glow": t.glow }}>
      <t.Icon size={size * 0.52} strokeWidth={2.1} color="#fff" className="tile-icon" />
      {tile.special === "row" && <span className="stripe stripe-row special-in" />}
      {tile.special === "col" && <span className="stripe stripe-col special-in" />}
      {tile.special === "bomb" && <span className="bomb-ring special-in" />}
      {tile.special === "x" && <span className="stripe stripe-x special-in" />}
      {tile.special === "cross" && <span className="cross-glow special-in" />}
      {tile.special === "nova" && <span className="nova-core special-in" />}
      {tile.special === "mult" && <span data-kind="mult" className="xs-badge special-in">x2</span>}
      {tile.special === "hole" && <span data-kind="hole" className="hole-core special-in" />}
      {Badge && <span data-kind={tile.special} className={`xs-icon xs-${tile.special} special-in`}><Badge size={size * 0.3} strokeWidth={2.8} /></span>}
      {tile.gold && <span data-kind="gold" className="gold-frame" />}
      {tile.lock > 0 && <span data-kind="lock" className="lock-overlay"><Link2 size={size * 0.42} strokeWidth={2.6} /></span>}
      {tile.countdown != null && <span data-kind="countdown" className={`cd-badge ${tile.countdown <= 3 ? "cd-low" : ""}`}>{tile.countdown}</span>}
    </div>
  );
};

export const MiniTile = ({ type, size = 28 }) => (
  <div style={{ width: size, height: size }} className="relative shrink-0">
    <TileFace tile={{ type, special: null }} size={size} />
  </div>
);
