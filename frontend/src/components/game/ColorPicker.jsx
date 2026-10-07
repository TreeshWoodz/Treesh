import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { COLOR_HEX } from "./PlayingCard";

export const ColorPicker = ({ open, onPick, testPrefix = "color-picker", only }) => (
  <Dialog open={open}>
    <DialogContent
      data-testid={`${testPrefix}-dialog`}
      className="bg-[#161C2E] border-white/10 text-white max-w-xs rounded-3xl [&>button]:hidden"
      onInteractOutside={(e) => e.preventDefault()}
    >
      <DialogTitle className="font-display text-3xl uppercase tracking-tight">Pick a color</DialogTitle>
      <DialogDescription className="text-slate-400">The next card must match this color.</DialogDescription>
      <div className="grid grid-cols-2 gap-3 pt-2">
        {Object.entries(COLOR_HEX).map(([name, hex]) => (
          <button
            key={name}
            type="button"
            data-testid={`${testPrefix}-${name}`}
            disabled={only && !only.includes(name)}
            onClick={() => onPick(name)}
            style={{ background: hex }}
            className="h-20 rounded-2xl border-4 border-white/90 font-display text-xl font-black uppercase text-[#0B0F19] shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-20 disabled:hover:scale-100"
          >
            {name}
          </button>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);
