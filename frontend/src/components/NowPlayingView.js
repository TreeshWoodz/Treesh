import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Heart, Volume2, VolumeX, Loader2, AlertCircle, Quote, ListMusic, Share2, ListPlus, Disc3,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { CoverArt } from "@/components/CoverArt";
import { LyricsView } from "@/components/LyricsView";
import { VinylPlayer } from "@/components/VinylPlayer";
import { QueueDrawer } from "@/components/QueueDrawer";
import { useAudioPlayer } from "@/context/AudioContext";
import { useFavorites } from "@/context/FavoritesContext";
import { usePlaylists } from "@/context/PlaylistsContext";
import { formatTime } from "@/lib/zodiac";
import { cn } from "@/lib/utils";
import { catalogApi } from "@/lib/api";
import { extractPalette, rgbStr } from "@/lib/colorExtract";
import { shareTrack } from "@/lib/share";

export function NowPlayingView() {
  const {
    currentSong, isPlaying, togglePlay, next, prev, seek, duration, currentTime,
    volume, setVolume, shuffle, toggleShuffle, repeat, cycleRepeat,
    nowPlayingOpen, setNowPlayingOpen, loading, errorSongId, retry,
  } = useAudioPlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { setAddTarget } = usePlaylists();

  const [showLyrics, setShowLyrics] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [vinylMode, setVinylMode] = useState(() => localStorage.getItem("treesh_np_vinyl") === "1");
  const [palette, setPalette] = useState(null);
  const [lyrics, setLyrics] = useState([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);

  const toggleVinyl = () => setVinylMode((v) => { localStorage.setItem("treesh_np_vinyl", v ? "0" : "1"); return !v; });

  const song = currentSong;
  const fav = song && isFavorite(song.id);
  const hasError = song && errorSongId === song.id;

  // Escape to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setQueueOpen(false); setNowPlayingOpen(false); } };
    if (nowPlayingOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nowPlayingOpen, setNowPlayingOpen]);

  // Extract ambient palette from cover art
  useEffect(() => {
    if (!song || !nowPlayingOpen) return;
    let active = true;
    extractPalette(song.coverArt).then((p) => { if (active) setPalette(p); });
    return () => { active = false; };
  }, [song && song.coverArt, nowPlayingOpen]);

  // Fetch lyrics
  useEffect(() => {
    if (!song || !nowPlayingOpen) return;
    let active = true;
    setLyricsLoading(true);
    setLyrics([]);
    catalogApi.getLyrics(song.id)
      .then((d) => { if (active) setLyrics(d.lyrics || []); })
      .catch(() => { if (active) setLyrics([]); })
      .finally(() => { if (active) setLyricsLoading(false); });
    return () => { active = false; };
  }, [song && song.id, nowPlayingOpen]);

  const c0 = palette && palette[0];
  const c1 = palette && (palette[1] || palette[0]);
  const c2 = palette && (palette[2] || palette[1] || palette[0]);

  const controls = song && (
    <>
      {hasError && (
        <div className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          <AlertCircle size={16} /> Couldn&rsquo;t load this track.
          <button onClick={retry} className="font-semibold underline">Retry</button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="font-doto w-10 text-right text-xs text-white/70">{formatTime(currentTime)}</span>
        <Slider
          data-testid="now-playing-seek-slider"
          value={[duration ? (currentTime / duration) * 100 : 0]}
          onValueChange={(v) => seek((v[0] / 100) * duration)}
          max={100} step={0.1} className="flex-1"
        />
        <span className="font-doto w-10 text-xs text-white/70">{formatTime(duration)}</span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 sm:gap-6">
        <button onClick={toggleShuffle} data-testid="now-playing-shuffle-button" aria-label="Shuffle" className={cn("grid h-11 w-11 place-items-center rounded-full transition-colors", shuffle ? "text-white bg-white/15" : "text-white/60 hover:bg-white/10")}>
          <Shuffle size={18} />
        </button>
        <button onClick={prev} data-testid="now-playing-prev-button" aria-label="Previous" className="grid h-12 w-12 place-items-center rounded-full text-white hover:bg-white/10 transition-colors">
          <SkipBack size={24} fill="currentColor" />
        </button>
        <button onClick={togglePlay} data-testid="now-playing-play-pause-button" aria-label={isPlaying ? "Pause" : "Play"} className="grid h-[68px] w-[68px] place-items-center rounded-full bg-white text-black active:scale-95 transition-transform shadow-[0_10px_40px_rgba(255,255,255,0.25)]">
          {loading ? <Loader2 size={26} className="animate-spin" /> : isPlaying ? <Pause size={30} fill="black" /> : <Play size={30} fill="black" className="ml-1" />}
        </button>
        <button onClick={() => next(true)} data-testid="now-playing-next-button" aria-label="Next" className="grid h-12 w-12 place-items-center rounded-full text-white hover:bg-white/10 transition-colors">
          <SkipForward size={24} fill="currentColor" />
        </button>
        <button onClick={cycleRepeat} data-testid="now-playing-repeat-button" aria-label="Repeat" className={cn("grid h-11 w-11 place-items-center rounded-full transition-colors", repeat !== "off" ? "text-white bg-white/15" : "text-white/60 hover:bg-white/10")}>
          {repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
        </button>
      </div>

      {/* action bar */}
      <div className="mt-5 flex items-center justify-center gap-2 sm:gap-3">
        <ActionBtn active={fav} onClick={() => toggleFavorite(song)} label="Like" testid="now-playing-like-button">
          <Heart size={18} className={cn(fav && "fill-current")} />
        </ActionBtn>
        <ActionBtn active={showLyrics} onClick={() => setShowLyrics((s) => !s)} label="Lyrics" testid="now-playing-lyrics-toggle">
          <Quote size={18} />
        </ActionBtn>
        <ActionBtn active={vinylMode} onClick={toggleVinyl} label="Vinyl mode" testid="now-playing-vinyl-toggle">
          <Disc3 size={18} />
        </ActionBtn>
        <ActionBtn onClick={() => setQueueOpen(true)} label="Queue" testid="now-playing-queue-button">
          <ListMusic size={18} />
        </ActionBtn>
        <ActionBtn onClick={() => setAddTarget(song)} label="Add to playlist" testid="now-playing-add-button">
          <ListPlus size={18} />
        </ActionBtn>
        <ActionBtn onClick={() => shareTrack(song)} label="Share" testid="now-playing-share-button">
          <Share2 size={18} />
        </ActionBtn>
      </div>

      <div className="mt-4 hidden items-center gap-2 sm:flex">
        <button onClick={() => setVolume(volume > 0 ? 0 : 1)} aria-label="Mute" className="text-white/60 hover:text-white transition-colors">
          {volume > 0 ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <Slider data-testid="now-playing-volume-slider" value={[volume * 100]} onValueChange={(v) => setVolume(v[0] / 100)} max={100} step={1} className="max-w-[180px] flex-1" />
      </div>
    </>
  );

  return (
    <>
      <AnimatePresence>
        {nowPlayingOpen && song && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] overflow-hidden bg-[#08080a]"
            data-testid="now-playing"
          >
            {/* Ambient background */}
            <div className="absolute inset-0 overflow-hidden">
              <CoverArt src={song.coverArt} alt="" className="absolute inset-0 h-full w-full scale-150 object-cover opacity-40 blur-[80px] saturate-150" />
              {palette && (
                <>
                  <motion.div
                    className="absolute -left-1/4 top-[-10%] h-[70vh] w-[70vh] rounded-full blur-[90px]"
                    style={{ background: rgbStr(c0, 0.55) }}
                    animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
                    transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute right-[-15%] top-[20%] h-[60vh] w-[60vh] rounded-full blur-[90px]"
                    style={{ background: rgbStr(c1, 0.5) }}
                    animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute bottom-[-20%] left-[20%] h-[60vh] w-[60vh] rounded-full blur-[100px]"
                    style={{ background: rgbStr(c2, 0.45) }}
                    animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
                    transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                  />
                </>
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.8))" }} />
            </div>

            <motion.div
              initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="relative z-10 mx-auto flex h-[100dvh] w-full max-w-3xl flex-col px-5 pb-6 pt-4 sm:px-8"
            >
              {/* top bar */}
              <div className="flex items-center justify-between">
                <button onClick={() => setNowPlayingOpen(false)} data-testid="now-playing-close-button" aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/5 text-white/85 hover:bg-white/10 transition-colors">
                  <ChevronDown size={22} />
                </button>
                <p className="font-display text-xs uppercase tracking-[0.25em] text-white/70">Now Playing</p>
                <button onClick={() => shareTrack(song)} aria-label="Share" className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/5 text-white/85 hover:bg-white/10 transition-colors">
                  <Share2 size={18} />
                </button>
              </div>

              {/* main */}
              <div className="flex min-h-0 flex-1 flex-col justify-center py-4">
                <AnimatePresence mode="wait">
                  {showLyrics ? (
                    <motion.div
                      key="lyrics"
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex min-h-0 flex-1 flex-col"
                    >
                      <button onClick={() => setShowLyrics(false)} className="mb-3 flex items-center gap-3 text-left">
                        <div className="h-12 w-12 overflow-hidden rounded-lg shadow-lg">
                          <CoverArt src={song.coverArt} alt={song.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="clamp-1 text-base font-bold">{song.title}</p>
                          <p className="clamp-1 text-sm text-white/60">{song.artist}</p>
                        </div>
                      </button>
                      <div className="relative min-h-0 flex-1">
                        <LyricsView lyrics={lyrics} currentTime={currentTime} onSeek={seek} loading={lyricsLoading} isPlaying={isPlaying} />
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#08080a]/60 to-transparent" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#08080a]/60 to-transparent" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="art"
                      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center"
                    >
                      {vinylMode ? (
                        <VinylPlayer coverArt={song.coverArt} playing={isPlaying} glow={rgbStr(c0, 0.5)} />
                      ) : (
                        <motion.div
                          animate={{ scale: isPlaying ? 1 : 0.9 }}
                          transition={{ type: "spring", stiffness: 200, damping: 22 }}
                          className="aspect-square w-[min(78vw,340px)] overflow-hidden rounded-3xl sm:w-[min(60vw,400px)] lg:w-[420px]"
                          style={{ boxShadow: `0 30px 80px ${rgbStr(c0, 0.5)}, 0 10px 30px rgba(0,0,0,0.5)` }}
                          data-testid="now-playing-artwork"
                        >
                          <CoverArt src={song.coverArt} alt={song.title} className="h-full w-full object-cover" />
                        </motion.div>
                      )}

                      <div className="mt-7 w-full max-w-[440px] text-center">
                        <div className="flex items-center justify-center gap-2">
                          <h1 className="clamp-2 text-2xl font-bold leading-tight sm:text-[28px]">{song.title}</h1>
                          {song.explicit && <span className="grid h-4 w-4 shrink-0 place-items-center rounded-[4px] bg-white/20 text-[9px] font-bold text-white/80">E</span>}
                        </div>
                        <p className="mt-1 text-lg text-white/70">{song.artist}</p>
                        {song.featuring && <p className="text-sm text-white/45">feat. {song.featuring}</p>}
                        {(song.producer || song.creationDate) && (
                          <p className="mt-2 text-xs text-white/40">
                            {song.producer ? `Prod. ${song.producer}` : ""}
                            {song.producer && song.creationDate ? " \u00b7 " : ""}
                            {song.creationDate || ""}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* controls (always visible) */}
              <div className="w-full">{controls}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <QueueDrawer open={queueOpen} onClose={() => setQueueOpen(false)} />
    </>
  );
}

function ActionBtn({ children, onClick, active, label, testid }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      data-testid={testid}
      className={cn(
        "grid h-11 w-11 place-items-center rounded-full border transition-colors",
        active ? "border-white/25 bg-white/15 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}
