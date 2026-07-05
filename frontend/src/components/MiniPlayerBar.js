import { Play, Pause, SkipForward, ChevronUp, Loader2 } from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { useAudioPlayer } from "@/context/AudioContext";
import { AnimatePresence, motion } from "framer-motion";

export function MiniPlayerBar() {
  const { currentSong, isPlaying, togglePlay, next, setNowPlayingOpen, duration, currentTime, loading } = useAudioPlayer();

  return (
    <AnimatePresence>
      {currentSong && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed bottom-[68px] left-0 right-0 z-40 px-3 lg:bottom-4 lg:pl-[264px] lg:pr-6"
          data-testid="mini-player"
        >
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/12 bg-white/[0.06] backdrop-blur-2xl shadow-[var(--treesh-shadow)]">
            <div className="flex items-center gap-3 p-2.5">
              <button
                onClick={() => setNowPlayingOpen(true)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                data-testid="mini-player-expand-button"
                aria-label="Open now playing"
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                  <CoverArt src={currentSong.coverArt} alt={currentSong.title} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="clamp-1 text-sm font-semibold">{currentSong.title}</p>
                  <p className="clamp-1 text-xs text-white/55">{currentSong.artist}</p>
                </div>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={togglePlay}
                  data-testid="mini-player-play-pause-button"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--treesh-purple)] text-white active:scale-95 transition-transform glow-purple"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-0.5" />}
                </button>
                <button
                  onClick={() => next(true)}
                  data-testid="mini-player-next-button"
                  aria-label="Next"
                  className="hidden sm:grid h-10 w-10 place-items-center rounded-full text-white/75 hover:bg-white/10 transition-colors"
                >
                  <SkipForward size={18} />
                </button>
                <button
                  onClick={() => setNowPlayingOpen(true)}
                  aria-label="Expand"
                  className="grid h-10 w-10 place-items-center rounded-full text-white/75 hover:bg-white/10 transition-colors"
                >
                  <ChevronUp size={20} />
                </button>
              </div>
            </div>
            {/* progress */}
            <div className="h-1 w-full bg-white/8" data-testid="mini-player-progress">
              <div
                className="h-full bg-[color:var(--treesh-purple)] transition-[width] duration-200"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
