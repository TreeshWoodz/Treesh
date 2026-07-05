import { memo } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Heart, Plus, X } from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { useAudioPlayer } from "@/context/AudioContext";
import { useFavorites } from "@/context/FavoritesContext";
import { usePlaylists } from "@/context/PlaylistsContext";
import { cn } from "@/lib/utils";

function SongRowBase({ song, list, index, onRemove }) {
  const { playSong, currentSong, isPlaying, togglePlay } = useAudioPlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { setAddTarget } = usePlaylists();
  const active = currentSong && currentSong.id === song.id;
  const fav = isFavorite(song.id);

  const onPlay = () => {
    if (active) togglePlay();
    else playSong(song, list || [song]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min((index || 0) * 0.02, 0.3) }}
      className={cn(
        "group flex items-center gap-3 rounded-xl border px-2.5 py-2 transition-[background-color,border-color]",
        active ? "border-white/20 bg-white/[0.07]" : "border-transparent hover:bg-white/5"
      )}
      data-testid={`song-row-${song.id}`}
    >
      <button
        onClick={onPlay}
        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg"
        aria-label={active && isPlaying ? "Pause" : "Play"}
        data-testid={`song-row-play-button-${song.id}`}
      >
        <CoverArt src={song.coverArt} alt={song.title} className="h-full w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          {active && isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
        </span>
      </button>

      <div className="min-w-0 flex-1 cursor-pointer" onClick={onPlay}>
        <div className="flex items-center gap-2">
          <p className={cn("clamp-1 text-sm font-semibold", active && "text-[color:var(--treesh-purple)]")}>{song.title}</p>
          {song.explicit && <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[3px] bg-white/15 text-[8px] font-bold text-white/70">E</span>}
          {active && <span className="eq scale-75"><span></span><span></span><span></span><span></span></span>}
        </div>
        <p className="clamp-1 text-xs text-white/55">{song.artist}</p>
      </div>

      {song.genre && <span className="hidden md:inline rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/45">{song.genre}</span>}

      <button
        onClick={() => toggleFavorite(song)}
        aria-label="Like"
        data-testid={`favorite-toggle-button-${song.id}`}
        className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 transition-colors"
      >
        <Heart size={16} className={cn(fav && "fill-[color:var(--treesh-purple)] text-[color:var(--treesh-purple)]")} />
      </button>
      {onRemove ? (
        <button onClick={onRemove} aria-label="Remove" data-testid={`song-row-remove-button-${song.id}`} className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 transition-colors">
          <X size={16} />
        </button>
      ) : (
        <button onClick={() => setAddTarget(song)} aria-label="Add to playlist" data-testid={`song-row-add-button-${song.id}`} className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 transition-colors">
          <Plus size={16} />
        </button>
      )}
    </motion.div>
  );
}

export const SongRow = memo(SongRowBase);
