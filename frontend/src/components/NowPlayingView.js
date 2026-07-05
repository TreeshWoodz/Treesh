import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Heart, Volume2, VolumeX, Loader2, AlertCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CoverArt } from "@/components/CoverArt";
import { VinylPlayer } from "@/components/VinylPlayer";
import { useAudioPlayer } from "@/context/AudioContext";
import { useFavorites } from "@/context/FavoritesContext";
import { formatTime } from "@/lib/zodiac";
import { cn } from "@/lib/utils";

export function NowPlayingView() {
  const {
    currentSong, isPlaying, togglePlay, next, prev, seek, duration, currentTime,
    volume, setVolume, shuffle, toggleShuffle, repeat, cycleRepeat,
    nowPlayingOpen, setNowPlayingOpen, queue, currentIndex, playSong, loading, errorSongId, retry,
  } = useAudioPlayer();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setNowPlayingOpen(false); };
    if (nowPlayingOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nowPlayingOpen, setNowPlayingOpen]);

  const song = currentSong;
  const fav = song && isFavorite(song.id);
  const upNext = queue.slice(currentIndex + 1, currentIndex + 12);
  const hasError = song && errorSongId === song.id;

  return (
    <AnimatePresence>
      {nowPlayingOpen && song && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] overflow-hidden"
          data-testid="now-playing"
        >
          {/* blurred cover backdrop */}
          <div className="absolute inset-0">
            <CoverArt src={song.coverArt} alt="" className="h-full w-full scale-125 object-cover opacity-30 blur-3xl" />
            <div className="absolute inset-0 bg-[var(--treesh-bg-0)]/85" style={{ backgroundColor: "rgba(10,10,11,0.86)" }} />
          </div>

          <motion.div
            initial={{ y: 40, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-4 py-4 sm:px-8"
          >
            {/* header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">Now Playing</p>
                <p className="font-display text-sm uppercase tracking-wide text-[color:var(--treesh-gold)]">Treesh</p>
              </div>
              <button
                onClick={() => setNowPlayingOpen(false)}
                data-testid="now-playing-close-button"
                aria-label="Close"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 items-center gap-6 overflow-hidden py-4 lg:grid-cols-2">
              {/* left: vinyl */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <VinylPlayer coverArt={song.coverArt} playing={isPlaying} size={typeof window !== "undefined" && window.innerWidth < 640 ? 260 : 320} />
                </div>
                <div className="mt-6 text-center">
                  <h1 className="clamp-2 max-w-md text-2xl font-bold leading-tight sm:text-3xl">{song.title}</h1>
                  <p className="mt-1 text-white/60">{song.artist}</p>
                  {song.featuring && <p className="mt-0.5 text-xs text-white/40">feat. {song.featuring}</p>}
                </div>
              </div>

              {/* right: info tabs */}
              <div className="hidden h-full min-h-0 lg:block">
                <Tabs defaultValue="about" className="flex h-full flex-col">
                  <TabsList className="w-full justify-start gap-1 rounded-2xl border border-white/12 bg-white/5 p-1">
                    <TabsTrigger value="about" data-testid="now-playing-about-tab" className="rounded-xl data-[state=active]:bg-white/10">About</TabsTrigger>
                    <TabsTrigger value="credits" data-testid="now-playing-lyrics-tab" className="rounded-xl data-[state=active]:bg-white/10">Credits</TabsTrigger>
                    <TabsTrigger value="queue" className="rounded-xl data-[state=active]:bg-white/10">Up Next</TabsTrigger>
                  </TabsList>
                  <div className="mt-3 min-h-0 flex-1 overflow-y-auto soft-scroll rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <TabsContent value="about" className="mt-0">
                      <p className="whitespace-pre-line text-sm leading-relaxed text-white/75">{song.bio || "No description available for this track yet. Vibe out and enjoy the sound."}</p>
                    </TabsContent>
                    <TabsContent value="credits" className="mt-0 space-y-3">
                      <Credit label="Written by" value={song.writtenBy} />
                      <Credit label="Producer" value={song.producer} />
                      <Credit label="Mixer" value={song.mixer} />
                      <Credit label="Genre" value={song.genre} />
                      <Credit label="Released" value={song.creationDate} />
                    </TabsContent>
                    <TabsContent value="queue" className="mt-0 space-y-1">
                      {upNext.length === 0 && <p className="text-sm text-white/50">End of queue.</p>}
                      {upNext.map((s) => (
                        <button key={s.id} onClick={() => playSong(s, queue)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-white/5 transition-colors">
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md"><CoverArt src={s.coverArt} alt="" className="h-full w-full object-cover" /></div>
                          <div className="min-w-0"><p className="clamp-1 text-sm">{s.title}</p><p className="clamp-1 text-xs text-white/50">{s.artist}</p></div>
                        </button>
                      ))}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>

            {/* controls */}
            <div className="mx-auto w-full max-w-2xl pb-2">
              {hasError && (
                <div className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  <AlertCircle size={16} /> Couldn’t load this track.
                  <button onClick={retry} className="font-semibold underline">Retry</button>
                </div>
              )}
              {/* seek */}
              <div className="flex items-center gap-3">
                <span className="font-doto w-10 text-right text-xs text-white/60">{formatTime(currentTime)}</span>
                <Slider
                  data-testid="now-playing-seek-slider"
                  value={[duration ? (currentTime / duration) * 100 : 0]}
                  onValueChange={(v) => seek((v[0] / 100) * duration)}
                  max={100}
                  step={0.1}
                  className="flex-1"
                />
                <span className="font-doto w-10 text-xs text-white/60">{formatTime(duration)}</span>
              </div>

              {/* buttons */}
              <div className="mt-4 flex items-center justify-center gap-3 sm:gap-5">
                <button onClick={toggleShuffle} data-testid="now-playing-shuffle-button" aria-label="Shuffle" className={cn("grid h-11 w-11 place-items-center rounded-full transition-colors", shuffle ? "text-[color:var(--treesh-purple)] bg-white/10" : "text-white/60 hover:bg-white/10")}>
                  <Shuffle size={18} />
                </button>
                <button onClick={prev} data-testid="now-playing-prev-button" aria-label="Previous" className="grid h-12 w-12 place-items-center rounded-full text-white hover:bg-white/10 transition-colors">
                  <SkipBack size={22} fill="currentColor" />
                </button>
                <button onClick={togglePlay} data-testid="now-playing-play-pause-button" aria-label={isPlaying ? "Pause" : "Play"} className="grid h-16 w-16 place-items-center rounded-full bg-[color:var(--treesh-purple)] text-white active:scale-95 transition-transform glow-purple">
                  {loading ? <Loader2 size={26} className="animate-spin" /> : isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" className="ml-1" />}
                </button>
                <button onClick={() => next(true)} data-testid="now-playing-next-button" aria-label="Next" className="grid h-12 w-12 place-items-center rounded-full text-white hover:bg-white/10 transition-colors">
                  <SkipForward size={22} fill="currentColor" />
                </button>
                <button onClick={cycleRepeat} data-testid="now-playing-repeat-button" aria-label="Repeat" className={cn("grid h-11 w-11 place-items-center rounded-full transition-colors", repeat !== "off" ? "text-[color:var(--treesh-purple)] bg-white/10" : "text-white/60 hover:bg-white/10")}>
                  {repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
                </button>
              </div>

              {/* secondary row: like + volume */}
              <div className="mt-4 flex items-center justify-between gap-4">
                <button onClick={() => toggleFavorite(song)} aria-label="Like" className="grid h-10 w-10 place-items-center rounded-full text-white/70 hover:bg-white/10 transition-colors">
                  <Heart size={20} className={cn(fav && "fill-[color:var(--treesh-purple)] text-[color:var(--treesh-purple)]")} />
                </button>
                <div className="flex flex-1 items-center gap-2">
                  <button onClick={() => setVolume(volume > 0 ? 0 : 1)} aria-label="Mute" className="text-white/60 hover:text-white transition-colors">
                    {volume > 0 ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </button>
                  <Slider data-testid="now-playing-volume-slider" value={[volume * 100]} onValueChange={(v) => setVolume(v[0] / 100)} max={100} step={1} className="max-w-[160px] flex-1" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Credit({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between border-b border-white/8 pb-2">
      <span className="text-xs uppercase tracking-wide text-white/45">{label}</span>
      <span className="text-sm text-white/85 text-right">{value}</span>
    </div>
  );
}
