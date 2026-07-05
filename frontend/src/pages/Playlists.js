import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ListMusic, Plus, Pencil, Trash2 } from "lucide-react";
import { usePlaylists } from "@/context/PlaylistsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Playlists() {
  const navigate = useNavigate();
  const { playlists, loading, createPlaylist, renamePlaylist, deletePlaylist } = usePlaylists();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const doCreate = async () => { if (!name.trim()) return; await createPlaylist(name.trim()); setName(""); setCreateOpen(false); };
  const doRename = async () => { if (!renameVal.trim() || !renameTarget) return; await renamePlaylist(renameTarget.id, renameVal.trim()); setRenameTarget(null); };
  const doDelete = async () => { if (!deleteTarget) return; await deletePlaylist(deleteTarget.id); setDeleteTarget(null); };

  return (
    <div className="space-y-6" data-testid="playlists-page">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">Curated by you</p>
          <h1 className="mt-1 text-3xl font-bold">Playlists</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="create-playlist-button" className="gap-2 rounded-full bg-[color:var(--treesh-purple)] hover:bg-[color:var(--treesh-purple)]/90 glow-purple">
          <Plus size={16} /> New
        </Button>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/5" />)}</div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] py-16 text-center" data-testid="playlists-empty-state">
          <ListMusic size={40} className="text-white/30" />
          <p className="text-lg font-semibold">No playlists yet</p>
          <p className="max-w-xs text-sm text-white/50">Create your first playlist and start adding tracks.</p>
          <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-full bg-[color:var(--treesh-purple)] hover:bg-[color:var(--treesh-purple)]/90"><Plus size={16} /> Create playlist</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((pl) => (
            <motion.div key={pl.id} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-[border-color] hover:border-white/25" data-testid={`playlist-card-${pl.id}`}>
              <button onClick={() => navigate(`/playlists/${pl.id}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-white/10 bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)]"><ListMusic size={22} /></div>
                <div className="min-w-0">
                  <p className="clamp-1 font-semibold">{pl.name}</p>
                  <p className="text-xs text-white/50">{(pl.songIds || []).length} track{(pl.songIds || []).length !== 1 ? "s" : ""}</p>
                </div>
              </button>
              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setRenameTarget(pl); setRenameVal(pl.name); }} data-testid={`rename-playlist-button-${pl.id}`} aria-label="Rename" className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10"><Pencil size={15} /></button>
                <button onClick={() => setDeleteTarget(pl)} data-testid={`delete-playlist-button-${pl.id}`} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-red-300"><Trash2 size={15} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-strong border-white/15 sm:max-w-sm">
          <DialogHeader><DialogTitle>New playlist</DialogTitle></DialogHeader>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Playlist name" onKeyDown={(e) => e.key === "Enter" && doCreate()} data-testid="create-playlist-name-input" className="bg-white/5 border-white/15" />
          <DialogFooter><Button onClick={doCreate} data-testid="confirm-create-playlist-button" className="bg-[color:var(--treesh-purple)] hover:bg-[color:var(--treesh-purple)]/90">Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent className="glass-strong border-white/15 sm:max-w-sm">
          <DialogHeader><DialogTitle>Rename playlist</DialogTitle></DialogHeader>
          <Input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doRename()} data-testid="rename-playlist-input" className="bg-white/5 border-white/15" />
          <DialogFooter><Button onClick={doRename} className="bg-[color:var(--treesh-purple)] hover:bg-[color:var(--treesh-purple)]/90">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="glass-strong border-white/15">
          <AlertDialogHeader><AlertDialogTitle>Delete playlist?</AlertDialogTitle><AlertDialogDescription>“{deleteTarget?.name}” will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} data-testid="confirm-delete-playlist-button" className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
