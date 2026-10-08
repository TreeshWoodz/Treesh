import { Link } from "react-router-dom";
import { GameHeader } from "@/components/game/GameHeader";
import { PlayingCard } from "@/components/game/PlayingCard";

const STEPS = [
  { n: "01", title: "Match the top card", body: "Every card you play must match the discard pile's top card by color OR number — just like Uno.", color: "#FF3B30" },
  { n: "02", title: "Place it on the grid", body: "Drop the card into the 6×6 cell where that number truly belongs (each row, column and 2×3 box holds 1–6 once).", color: "#007AFF" },
  { n: "03", title: "Match the tint", body: "Each cell is tinted red, blue, green or yellow. Same-color placement = double points.", color: "#34C759" },
  { n: "04", title: "Chain combos", body: "Consecutive plays build a combo multiplier up to ×5. Drawing or a wrong cell resets it.", color: "#FFCC00" },
  { n: "05", title: "Call SONOKO!", body: "Down to one card? Hit SONOKO! before playing it. Empty your hand to earn a big bonus and a fresh hand of 5.", color: "#F59E0B" },
  { n: "06", title: "Don't bust", body: "Wrong cell costs a heart and a penalty card. Lose 3 hearts or hold 12 cards and it's over.", color: "#8B5CF6" },
];

const SPECIALS = [
  [{ color: "wild", kind: "wild" }, "Wild", "Plays on anything. Tap any empty cell and it fills itself, then you pick the next color."],
  [{ color: "blue", kind: "reveal" }, "Reveal", "Match its color, tap it twice and it auto-fills 2 random cells."],
  [{ color: "green", kind: "num", value: 3 }, "Dead cards", "When all of a number is placed, those cards burn from your hand for +25 each."],
];

export default function HowToPlay() {
  return (
    <div className="min-h-[100dvh] bg-arcade pb-12" data-testid="how-to-play-page">
      <GameHeader title="How to play" accent="#34C759" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <p className="eyebrow">The Sonoko rulebook</p>
        <h2 className="font-display font-black uppercase italic text-5xl sm:text-6xl tracking-tight mt-1">Sudoku brain. Uno hands.</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {STEPS.map((s, i) => (
            <div key={s.n} className="glass rounded-3xl p-5 rise" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="font-mono text-4xl font-black" style={{ color: s.color }}>{s.n}</span>
              <p className="font-display text-2xl font-black uppercase mt-2">{s.title}</p>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="eyebrow mt-12 mb-4">Special cards</p>
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          {SPECIALS.map(([card, title, body]) => (
            <div key={title} className="glass rounded-3xl p-5 flex gap-4 items-center">
              <PlayingCard card={card} size="md" />
              <div>
                <p className="font-display text-2xl font-black uppercase">{title}</p>
                <p className="text-slate-400 text-sm">{body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 grid sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="glass rounded-3xl p-5">
            <p className="font-display text-2xl font-black uppercase text-[#007AFF]">Classic Sudoku</p>
            <p className="text-slate-400 text-sm mt-1">Standard 9×9. Use notes, erase and up to 3 hints. Three mistakes ends the run. Faster solves score more.</p>
          </div>
          <div className="glass rounded-3xl p-5">
            <p className="font-display text-2xl font-black uppercase text-[#FF3B30]">Classic Uno</p>
            <p className="text-slate-400 text-sm mt-1">Play vs 1–3 bots with Skip, Reverse, +2, Wild and Wild +4. Call UNO! before playing your second-to-last card or draw 2.</p>
          </div>
        </div>
        <Link
          to="/play/tutorial"
          data-testid="how-to-play-tutorial-button"
          className="mt-10 mr-3 inline-flex h-14 px-8 rounded-2xl glass font-display text-2xl font-black uppercase italic items-center transition-colors duration-150 hover:bg-[#1E2640]"
        >
          Interactive tutorial
        </Link>
        <Link
          to="/play/sonoko"
          data-testid="how-to-play-start-button"
          className="mt-10 inline-flex h-14 px-8 rounded-2xl bg-brand text-brand-ink font-display text-2xl font-black uppercase italic items-center transition-transform duration-150 hover:-translate-y-0.5"
        >
          Let's play →
        </Link>
      </main>
    </div>
  );
}
