import { ART } from "../game/config";

export const GameBackground = ({ art = "menu", variant = "page" }) => (
  <div className={`game-bg game-bg-${variant}`} aria-hidden data-testid="game-background">
    <img src={ART[art] || ART.menu} alt="" draggable={false} />
  </div>
);
