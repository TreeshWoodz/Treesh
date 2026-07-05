import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shuffle, Search as SearchIcon } from "lucide-react";
import { catalogApi } from "@/lib/api";
import { GenreChips } from "@/components/GenreChips";
import { SongCard } from "@/components/SongCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/context/AudioContext";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.03] p-2.5">
          <Skeleton className="aspect-square w-full rounded-xl bg-white/5" />
          <Skeleton className="mt-2.5 h-4 w-3/4 bg-white/5" />
          <Skeleton className="mt-1.5 h-3 w-1/2 bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function Grid({ songs }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {songs.map((s) => <SongCard key={s.id} song={s} list={songs} />)}
    </div>
  );
}

function SectionTitle({ children, accent }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
      {accent && <span className="h-4 w-1 rounded-full" style={{ background: "var(--treesh-gold)" }} />}
      {children}
    </h2>
  );
}

export default function Library() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [genre, setGenre] = useState("all");
  const { playSong } = useAudioPlayer();

  const { data: genresData } = useQuery({ queryKey: ["genres"], queryFn: catalogApi.getGenres });
  const { data: songs = [], isLoading } = useQuery({
    queryKey: ["songs", genre, q],
    queryFn: () => catalogApi.getSongs({ genre: genre === "all" ? undefined : genre, q: q || undefined }),
  });

  const genres = genresData?.genres || [];
  const isBrowse = !q;
  const picks = isBrowse && genre === "all" ? songs.filter((s) => s.treeshChoice) : [];

  const shuffleAll = () => {
    if (!songs.length) return;
    const rand = songs[Math.floor(Math.random() * songs.length)];
    playSong(rand, songs);
  };

  return (
    <div className="space-y-7">
      {/* Hero */}
      {isBrowse && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
        >
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full" style={{ background: "radial-gradient(circle, var(--treesh-purple-soft), transparent 70%)" }} />
          <div className="relative">
            <p className="font-display text-xs uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">Treesh 3.0</p>
            <h1 className="mt-2 max-w-lg text-3xl font-bold leading-tight sm:text-4xl">Music to <span className="shimmer">Live For</span></h1>
            <p className="mt-2 max-w-md text-sm text-white/60">Stream the underground. {songs.length} tracks from the Icons, ready to play.</p>
            <Button onClick={shuffleAll} data-testid="shuffle-all-button" className="mt-4 gap-2 rounded-full bg-[color:var(--treesh-purple)] px-5 hover:bg-[color:var(--treesh-purple)]/90 glow-purple">
              <Shuffle size={16} /> Shuffle all
            </Button>
          </div>
        </motion.section>
      )}

      {/* Genre chips */}
      {isBrowse && <GenreChips genres={genres} active={genre} onChange={setGenre} />}

      {q && (
        <div className="flex items-center gap-2 text-sm text-white/60">
          <SearchIcon size={16} /> Results for <span className="font-semibold text-white">“{q}”</span>
        </div>
      )}

      {isLoading ? (
        <SkeletonGrid />
      ) : songs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] py-16 text-center" data-testid="library-empty-state">
          <SearchIcon size={40} className="text-white/30" />
          <p className="text-lg font-semibold">No matches found</p>
          <p className="text-sm text-white/50">Try a different search or genre.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {picks.length > 0 && (
            <section>
              <SectionTitle accent>Treesh’s Picks</SectionTitle>
              <Grid songs={picks} />
            </section>
          )}
          <section>
            {isBrowse && genre === "all" && <SectionTitle>All Music</SectionTitle>}
            <Grid songs={songs} />
          </section>
        </div>
      )}
    </div>
  );
}
