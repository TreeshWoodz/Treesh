import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListMusic, Plus, Check } from "lucide-react";
import { usePlaylists } from "@/context/PlaylistsContext";
import { CoverArt } from "@/components/CoverArt";
import { toast } from "sonner";

export function AddToPlaylistDialog() {
  const { addTarget, setAddTarget, playlists, createPlaylist, addSong } = usePlaylists();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [added, setAdded] = useState({});

  const close = () => { setAddTarget(null); setCreating(false); setName(""); setAdded({}); };

  const handleAdd = async (pl) => {
    if (!addTarget) return;
    await addSong(pl.id, addTarget.id);
    setAdded((p) => ({ ...p, [pl.id]: true }));
    toast("Added to playlist", { description: `${addTarget.title} → ${pl.name}` });
  };

  const handleCreate = async () => {
    if (!name.trim() || !addTarget) return;
    const pl = await createPlaylist(name.trim(), [addTarget.id]);
    setCreating(false); setName("");
    setAdded((p) => ({ ...p, [pl.id]: true }));
  };

  return (
    <Dialog open={!!addTarget} onOpenChange={(o) => !o && close()}>
      <DialogContent className="glass-strong border-white/15 sm:max-w-md" data-testid="add-to-playlist-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ListMusic size={18} /> Add to playlist</DialogTitle>
        </DialogHeader>
        {addTarget && (
          <div className="mb-1 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2">
            <div className="h-10 w-10 overflow-hidden rounded-md"><CoverArt src={addTarget.coverArt} alt="" className="h-full w-full object-cover" /></div>
            <div className="min-w-0"><p className="clamp-1 text-sm font-semibold">{addTarget.title}</p><p className="clamp-1 text-xs text-white/55">{addTarget.artist}</p></div>
          </div>
        )}

        {creating ? (
          <div className="flex gap-2">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Playlist name" onKeyDown={(e) => e.key === "Enter" && handleCreate()} data-testid="create-playlist-name-input" className="bg-white/5 border-white/15" />
            <Button onClick={handleCreate} data-testid="confirm-create-playlist-button" className="bg-[color:var(--treesh-purple)] hover:bg-[color:var(--treesh-purple)]/90">Create</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setCreating(true)} data-testid="create-playlist-button" className="w-full justify-start gap-2 border-white/15 bg-white/5 hover:bg-white/10">
            <Plus size={16} /> New playlist
          </Button>
        )}

        <div className="mt-1 max-h-64 space-y-1 overflow-y-auto soft-scroll">
          {playlists.length === 0 && !creating && (
            <p className="py-6 text-center text-sm text-white/50">No playlists yet. Create one above.</p>
          )}
          {playlists.map((pl) => (
            <button key={pl.id} onClick={() => handleAdd(pl)} data-testid={`add-to-playlist-item-${pl.id}`} className="flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-left hover:bg-white/5 hover:border-white/10 transition-colors">
              <span className="flex items-center gap-2 text-sm"><ListMusic size={15} className="text-white/50" /> {pl.name}</span>
              {(added[pl.id] || (pl.songIds || []).includes(addTarget?.id)) ? <Check size={16} className="text-[color:var(--treesh-purple)]" /> : <Plus size={16} className="text-white/40" />}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
