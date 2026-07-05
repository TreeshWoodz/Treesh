import { useEffect, useMemo, useRef } from "react";
import { Loader2, Music4 } from "lucide-react";
import { cn } from "@/lib/utils";

// Apple-Music-style synced lyrics: highlights + auto-scrolls the active line.
export function LyricsView({ lyrics = [], currentTime = 0, onSeek, loading, isPlaying }) {
  const containerRef = useRef(null);
  const lineRefs = useRef([]);

  const activeIndex = useMemo(() => {
    if (!lyrics.length) return -1;
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].t <= currentTime + 0.15) idx = i; else break;
    }
    return idx;
  }, [lyrics, currentTime]);

  useEffect(() => {
    const container = containerRef.current;
    const el = lineRefs.current[activeIndex];
    if (container && el) {
      const target = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
      container.scrollTo({ top: Math.max(target, 0), behavior: "smooth" });
    }
  }, [activeIndex]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-white/50" data-testid="lyrics-loading">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!lyrics.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white/45" data-testid="lyrics-empty">
        <Music4 size={40} />
        <p className="text-sm">No lyrics available for this track.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto no-scrollbar px-1 py-[30%]"
      data-testid="lyrics-view"
    >
      {lyrics.map((line, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        return (
          <button
            key={i}
            ref={(el) => (lineRefs.current[i] = el)}
            onClick={() => onSeek && onSeek(line.t)}
            data-testid={`lyric-line-${i}`}
            className={cn(
              "block w-full text-left leading-snug transition-all duration-300 ease-out",
              "py-1.5 text-2xl font-bold tracking-tight sm:text-3xl",
              isActive
                ? "text-white scale-[1.02] origin-left"
                : isPast
                ? "text-white/35 hover:text-white/60"
                : "text-white/40 hover:text-white/70"
            )}
            style={isActive ? { textShadow: "0 2px 30px rgba(255,255,255,0.25)" } : undefined}
          >
            {line.text}
          </button>
        );
      })}
    </div>
  );
}
