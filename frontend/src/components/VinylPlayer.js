import { CoverArt } from "@/components/CoverArt";
import { cn } from "@/lib/utils";

// Spinning record-player look for the Now Playing view (optional toggle).
export function VinylPlayer({ coverArt, playing, glow = "rgba(147,40,255,0.5)" }) {
  return (
    <div className="relative aspect-square w-[min(78vw,340px)] sm:w-[min(60vw,400px)] lg:w-[420px]" data-testid="now-playing-vinyl">
      <div
        className={cn("vinyl h-full w-full", playing ? "spin" : "spin spin-paused")}
        style={{ animationDuration: "6s", boxShadow: `0 30px 90px ${glow}, inset 0 0 60px rgba(0,0,0,0.85)` }}
      >
        <div className="vinyl-label">
          <CoverArt src={coverArt} alt="Now playing cover" className="h-full w-full object-cover" />
        </div>
        <span className="vinyl-hole" />
      </div>
      {/* tonearm */}
      <div
        className={cn("absolute -right-2 top-2 hidden origin-top-right transition-transform duration-500 sm:block", playing ? "rotate-0" : "-rotate-[18deg]")}
        style={{ width: "42%" }}
      >
        <div className="ml-auto h-3 w-3 rounded-full bg-white/30 shadow" />
        <div className="ml-auto mt-[-6px] h-[3px] w-full rotate-[28deg] rounded-full bg-gradient-to-l from-white/50 to-white/20" />
      </div>
    </div>
  );
}
