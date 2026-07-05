import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { catalogApi } from "@/lib/api";
import { ArtistRingAvatar } from "@/components/ArtistRingAvatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Artists() {
  const navigate = useNavigate();
  const { data: artists = [], isLoading } = useQuery({ queryKey: ["artists"], queryFn: catalogApi.getArtists });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-display text-xs uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">The Collective</p>
        <h1 className="mt-1 text-3xl font-bold">The Icons</h1>
        <p className="mt-1 text-sm text-white/55">Meet the artists behind the sound.</p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-[116px] w-[116px] rounded-full bg-white/5" />
              <Skeleton className="h-3 w-16 bg-white/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {artists.map((a) => (
            <ArtistRingAvatar key={a.id} artist={a} onOpen={(art) => navigate(`/artists/${art.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
