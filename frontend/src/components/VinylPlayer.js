import { CoverArt } from "@/components/CoverArt";
import { cn } from "@/lib/utils";

export function VinylPlayer({ coverArt, playing, size = 300 }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className={cn("vinyl h-full w-full", playing ? "spin" : "spin spin-paused")}
        style={{ animationDuration: "6s" }}
        data-testid="now-playing-vinyl"
      >
        <div className="vinyl-label">
          <CoverArt src={coverArt} alt="Now playing cover" className="h-full w-full object-cover" />
        </div>
        <span className="vinyl-hole" />
      </div>
    </div>
  );
}
