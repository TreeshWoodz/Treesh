import { AnimatePresence, motion, Reorder } from "framer-motion";
import { X, GripVertical, Play, Pause, Trash2, ListMusic } from "lucide-react";
import { CoverArt } from "@/components/CoverArt";
import { useAudioPlayer } from "@/context/AudioContext";
import { cn } from "@/lib/utils";

export function QueueDrawer({ open, onClose }) {
  const { queue, currentSong, currentIndex, isPlaying, playSong, togglePlay, reorderQueue, removeFromQueue } = useAudioPlayer();

  const upcoming = queue;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 z-[81] flex h-[100dvh] w-full max-w-md flex-col border-l border-white/12 bg-[#0c0c0e]/95 backdrop-blur-2xl"
            data-testid="queue-drawer"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <ListMusic size={18} className="text-[color:var(--treesh-purple)]" />
                <h3 className="text-lg font-bold">Up Next</h3>
                <span className="text-sm text-white/45">{queue.length}</span>
              </div>
              <button onClick={onClose} aria-label="Close queue" data-testid="queue-close-button" className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/5 hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto soft-scroll px-3 py-3">
              <Reorder.Group axis="y" values={upcoming} onReorder={reorderQueue} className="space-y-1">
                {upcoming.map((song) => {
                  const active = currentSong && currentSong.id === song.id;
                  return (
                    <Reorder.Item
                      key={song.id}
                      value={song}
                      className={cn(
                        "group flex items-center gap-2 rounded-xl border px-2 py-2 select-none",
                        active ? "border-white/20 bg-white/[0.08]" : "border-transparent bg-white/[0.02] hover:bg-white/5"
                      )}
                      data-testid={`queue-item-${song.id}`}
                      whileDrag={{ scale: 1.03, boxShadow: "var(--treesh-shadow)" }}
                    >
                      <GripVertical size={16} className="shrink-0 cursor-grab text-white/30 active:cursor-grabbing" />
                      <button
                        onClick={() => (active ? togglePlay() : playSong(song, queue))}
                        className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg"
                        aria-label={active && isPlaying ? "Pause" : "Play"}
                      >
                        <CoverArt src={song.coverArt} alt={song.title} className="h-full w-full object-cover" />
                        <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          {active && isPlaying ? <Pause size={15} fill="white" /> : <Play size={15} fill="white" />}
                        </span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn("clamp-1 text-sm font-semibold", active && "text-[color:var(--treesh-purple)]")}>{song.title}</p>
                        <p className="clamp-1 text-xs text-white/50">{song.artist}</p>
                      </div>
                      {active && <span className="eq mr-1 scale-75"><span></span><span></span><span></span><span></span></span>}
                      <button onClick={() => removeFromQueue(song.id)} aria-label="Remove from queue" data-testid={`queue-remove-${song.id}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-red-300 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
              {queue.length === 0 && <p className="py-16 text-center text-sm text-white/45">Queue is empty.</p>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
