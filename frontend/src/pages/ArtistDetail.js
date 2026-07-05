import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Shuffle } from "lucide-react";
import { catalogApi } from "@/lib/api";
import { CoverArt } from "@/components/CoverArt";
import { SongRow } from "@/components/SongRow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAudioPlayer } from "@/context/AudioContext";

export default function ArtistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSong, toggleShuffle, shuffle } = useAudioPlayer();
  const { data, isLoading } = useQuery({ queryKey: ["artist", id], queryFn: () => catalogApi.getArtist(id) });

  const artist = data?.artist;
  const songs = data?.songs || [];

  const playAll = () => { if (songs.length) playSong(songs[0], songs); };
  const shufflePlay = () => {
    if (!songs.length) return;
    if (!shuffle) toggleShuffle();
    playSong(songs[Math.floor(Math.random() * songs.length)], songs);
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors" data-testid="artist-back-button">
        <ArrowLeft size={16} /> Back
      </button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-3xl bg-white/5" />
          <Skeleton className="h-12 w-full rounded-xl bg-white/5" />
          <Skeleton className="h-12 w-full rounded-xl bg-white/5" />
        </div>
      ) : !artist ? (
        <p className="text-white/60">Artist not found.</p>
      ) : (
        <>
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative overflow-hidden rounded-3xl border border-white/10">
            <div className="absolute inset-0">
              <CoverArt src={artist.background || artist.image} alt="" className="h-full w-full object-cover opacity-40" style={{ objectPosition: artist.bgPos }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,11,0.96), rgba(10,10,11,0.5))" }} />
            </div>
            <div className="relative flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-end sm:p-8">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/15 shadow-xl sm:h-36 sm:w-36">
                <CoverArt src={artist.image} alt={artist.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--treesh-gold)]">{artist.role}</p>
                <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{artist.name}</h1>
                <p className="mt-1 text-sm text-white/60">{songs.length} track{songs.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </motion.section>

          {artist.bio && (
            <p className="max-w-2xl text-sm leading-relaxed text-white/70">{artist.bio}</p>
          )}

          {songs.length > 0 && (
            <div className="flex items-center gap-3">
              <Button onClick={playAll} data-testid="artist-play-all-button" className="gap-2 rounded-full bg-[color:var(--treesh-purple)] px-5 hover:bg-[color:var(--treesh-purple)]/90 glow-purple">
                <Play size={16} fill="white" /> Play
              </Button>
              <Button onClick={shufflePlay} variant="outline" className="gap-2 rounded-full border-white/15 bg-white/5 hover:bg-white/10">
                <Shuffle size={16} /> Shuffle
              </Button>
            </div>
          )}

          <div className="space-y-1">
            {songs.map((s, i) => <SongRow key={s.id} song={s} list={songs} index={i} />)}
          </div>
        </>
      )}
    </div>
  );
}
