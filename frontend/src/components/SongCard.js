import { memo } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Heart } from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { SongMenu } from "@/components/SongMenu";
import { useAudioPlayer } from "@/context/AudioContext";
import { useFavorites } from "@/context/FavoritesContext";
import { cn } from "@/lib/utils";

function SongCardBase({ song, list }) {
  const { playSong, currentSong, isPlaying, togglePlay } = useAudioPlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = currentSong && currentSong.id === song.id;
  const fav = isFavorite(song.id);

  const onPlay = (e) => {
    e.stopPropagation();
    if (active) togglePlay();
    else playSong(song, list || [song]);
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={cn(
        "group relative rounded-2xl border bg-white/5 backdrop-blur-xl p-2.5",
        "transition-[box-shadow,border-color,background-color]",
        active ? "border-white/25 glow-purple" : "border-white/10 hover:border-white/25"
      )}
      data-testid={`song-card-${song.id}`}
    >
      <div className="relative overflow-hidden rounded-xl">
        <div className="aspect-square w-full">
          <CoverArt src={song.coverArt} alt={song.title} className="h-full w-full object-cover" />
        </div>

        {/* badges */}
        <div className="absolute left-1.5 top-1.5 flex gap-1">
          {song.treeshChoice && (
            <span className="rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[color:var(--treesh-gold)] backdrop-blur glow-gold">
              Treesh’s Pick
            </span>
          )}
        </div>
        <div className="absolute right-1.5 top-1.5 flex gap-1">
          {song.explicit && (
            <span className="grid h-4 w-4 place-items-center rounded-[4px] bg-white/15 text-[9px] font-bold text-white/80">E</span>
          )}
        </div>

        {/* play button */}
        <button
          onClick={onPlay}
          aria-label={active && isPlaying ? "Pause" : "Play"}
          data-testid={`song-card-play-button-${song.id}`}
          className="absolute bottom-2 right-2 grid h-11 w-11 place-items-center rounded-full bg-[color:var(--treesh-purple)] text-white shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity active:scale-95 glow-purple"
        >
          {active && isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-0.5" />}
        </button>

        {active && (
          <div className="absolute bottom-2 left-2">
            <span className="eq"><span></span><span></span><span></span><span></span></span>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("clamp-1 text-sm font-semibold leading-tight", active && "text-[color:var(--treesh-purple)]")}>{song.title}</p>
          <p className="clamp-1 text-xs text-white/60">{song.artist}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(song); }}
          aria-label="Like"
          data-testid={`song-card-like-button-${song.id}`}
          className="grid h-8 w-8 place-items-center rounded-full text-white/70 hover:bg-white/10 transition-colors"
        >
          <Heart size={16} className={cn(fav && "fill-[color:var(--treesh-purple)] text-[color:var(--treesh-purple)]")} />
        </button>
        <SongMenu song={song} />
        {song.genre && (
          <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">{song.genre}</span>
        )}
      </div>
    </motion.div>
  );
}

export const SongCard = memo(SongCardBase);
