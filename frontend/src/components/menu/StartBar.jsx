import { Play } from "lucide-react";
import { sfx } from "@/lib/sound";

export const StartBar = ({ onPlay, label, testid = "setup-play-button" }) => (
  <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
    <div className="h-10 bg-gradient-to-t from-[#0B0F19] to-transparent" />
    <div className="pointer-events-auto bg-[#0B0F19] px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
      <button
        type="button"
        data-testid={testid}
        onClick={() => {
          sfx.play();
          onPlay();
        }}
        className="btn-3d relative overflow-hidden -mt-4 mx-auto w-full max-w-xl h-16 rounded-[1.4rem] bg-brand text-brand-ink border-[3px] border-white/90 flex items-center justify-center gap-3"
      >
        <span className="play-shine absolute inset-0 pointer-events-none" />
        <Play className="w-7 h-7 fill-current" />
        <span className="font-display text-3xl font-black uppercase italic tracking-tight leading-none">Play</span>
        {label && <span className="font-display text-base font-black uppercase opacity-80 leading-none mt-1">· {label}</span>}
      </button>
    </div>
  </div>
);

