import { MoreHorizontal, ListPlus, ListEnd, ListMusic, Share2, Heart } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAudioPlayer } from "@/context/AudioContext";
import { usePlaylists } from "@/context/PlaylistsContext";
import { useFavorites } from "@/context/FavoritesContext";
import { shareTrack } from "@/lib/share";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SongMenu({ song, className, size = 16 }) {
  const { addToQueue } = useAudioPlayer();
  const { setAddTarget } = usePlaylists();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(song.id);

  const playNext = (e) => {
    e?.stopPropagation?.();
    const ok = addToQueue(song, true);
    toast(ok === false ? "Already in queue" : "Playing next", { description: song.title });
  };
  const addQueue = (e) => {
    e?.stopPropagation?.();
    const ok = addToQueue(song, false);
    toast(ok === false ? "Already in queue" : "Added to queue", { description: song.title });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          aria-label="More options"
          data-testid={`song-menu-button-${song.id}`}
          className={cn("grid h-8 w-8 place-items-center rounded-full text-white/70 hover:bg-white/10 transition-colors outline-none", className)}
        >
          <MoreHorizontal size={size} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 glass-strong border-white/15 text-white" data-testid={`song-menu-${song.id}`}>
        <DropdownMenuItem onClick={playNext} data-testid={`song-menu-play-next-${song.id}`} className="gap-2 focus:bg-white/10">
          <ListEnd size={15} /> Play next
        </DropdownMenuItem>
        <DropdownMenuItem onClick={addQueue} data-testid={`song-menu-add-queue-${song.id}`} className="gap-2 focus:bg-white/10">
          <ListPlus size={15} /> Add to queue
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setAddTarget(song); }} data-testid={`song-menu-add-playlist-${song.id}`} className="gap-2 focus:bg-white/10">
          <ListMusic size={15} /> Add to playlist
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleFavorite(song); }} className="gap-2 focus:bg-white/10">
          <Heart size={15} className={cn(fav && "fill-[color:var(--treesh-purple)] text-[color:var(--treesh-purple)]")} /> {fav ? "Remove favorite" : "Add to favorites"}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); shareTrack(song); }} data-testid={`song-menu-share-${song.id}`} className="gap-2 focus:bg-white/10">
          <Share2 size={15} /> Share
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
