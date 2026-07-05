import { motion } from "framer-motion";
import { Heart, Play, Music2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/context/FavoritesContext";
import { SongRow } from "@/components/SongRow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAudioPlayer } from "@/context/AudioContext";

export default function Favorites() {
  const { favSongs, loading } = useFavorites();
  const { playSong } = useAudioPlayer();
  const navigate = useNavigate();

  return (
    <div className="space-y-6" data-testid="favorites-page">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">Your collection</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold"><Heart className="fill-[color:var(--treesh-purple)] text-[color:var(--treesh-purple)]" size={26} /> Favorites</h1>
          <p className="mt-1 text-sm text-white/55">{favSongs.length} liked track{favSongs.length !== 1 ? "s" : ""}</p>
        </div>
        {favSongs.length > 0 && (
          <Button onClick={() => playSong(favSongs[0], favSongs)} className="gap-2 rounded-full bg-[color:var(--treesh-purple)] hover:bg-[color:var(--treesh-purple)]/90 glow-purple">
            <Play size={16} fill="white" /> Play
          </Button>
        )}
      </motion.div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl bg-white/5" />)}</div>
      ) : favSongs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] py-16 text-center" data-testid="favorites-empty-state">
          <div className="eq scale-150"><span></span><span></span><span></span><span></span></div>
          <p className="text-lg font-semibold">No favorites yet</p>
          <p className="max-w-xs text-sm text-white/50">Tap the heart on any track to save it here.</p>
          <Button onClick={() => navigate("/")} variant="outline" className="gap-2 rounded-full border-white/15 bg-white/5 hover:bg-white/10">
            <Music2 size={16} /> Browse Library
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          {favSongs.map((s, i) => <SongRow key={s.id} song={s} list={favSongs} index={i} />)}
        </div>
      )}
    </div>
  );
}
