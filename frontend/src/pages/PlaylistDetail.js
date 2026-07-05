import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Play, ListMusic, Share2 } from "lucide-react";
import { playlistsApi } from "@/lib/api";
import { usePlaylists } from "@/context/PlaylistsContext";
import { sharePlaylist } from "@/lib/share";
import { SongRow } from "@/components/SongRow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAudioPlayer } from "@/context/AudioContext";

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSong } = useAudioPlayer();
  const { removeSong } = usePlaylists();
  const { data, isLoading, refetch } = useQuery({ queryKey: ["playlist", id], queryFn: () => playlistsApi.detail(id) });

  const songs = data?.songs || [];

  const onRemove = async (songId) => { await removeSong(id, songId); refetch(); };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"><ArrowLeft size={16} /> Back</button>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-3xl bg-white/5" />
      ) : !data ? (
        <p className="text-white/60">Playlist not found.</p>
      ) : (
        <>
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-white/10 bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)]"><ListMusic size={40} /></div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">Playlist</p>
              <h1 className="mt-1 clamp-2 text-3xl font-bold">{data.name}</h1>
              <p className="mt-1 text-sm text-white/55">{songs.length} track{songs.length !== 1 ? "s" : ""}</p>
            </div>
          </motion.section>

          {songs.length > 0 ? (
            <>
              <div className="flex items-center gap-3">
                <Button onClick={() => playSong(songs[0], songs)} className="gap-2 rounded-full bg-[color:var(--treesh-purple)] hover:bg-[color:var(--treesh-purple)]/90 glow-purple"><Play size={16} fill="white" /> Play</Button>
                <Button onClick={() => sharePlaylist(data)} variant="outline" data-testid="share-playlist-detail-button" className="gap-2 rounded-full border-white/15 bg-white/5 hover:bg-white/10"><Share2 size={16} /> Share</Button>
              </div>
              <div className="space-y-1">
                {songs.map((s, i) => <SongRow key={s.id} song={s} list={songs} index={i} onRemove={() => onRemove(s.id)} />)}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] py-14 text-center">
              <ListMusic size={36} className="text-white/30" />
              <p className="font-semibold">This playlist is empty</p>
              <p className="text-sm text-white/50">Add songs using the + on any track.</p>
              <Button onClick={() => navigate("/")} variant="outline" className="rounded-full border-white/15 bg-white/5 hover:bg-white/10">Browse Library</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
