import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { playlistsApi } from "@/lib/api";
import { useProfile } from "@/context/ProfileContext";
import { toast } from "sonner";

const PlaylistsCtx = createContext(null);
export const usePlaylists = () => useContext(PlaylistsCtx);

export function PlaylistsProvider({ children }) {
  const { profileId } = useProfile();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addTarget, setAddTarget] = useState(null); // song pending add-to-playlist

  const refresh = useCallback(async () => {
    if (!profileId) return;
    try {
      const data = await playlistsApi.list(profileId);
      setPlaylists(data.playlists || []);
    } catch (e) { /* noop */ }
    finally { setLoading(false); }
  }, [profileId]);

  useEffect(() => { refresh(); }, [refresh]);

  const createPlaylist = useCallback(async (name, songIds = []) => {
    const pl = await playlistsApi.create(profileId, name, songIds);
    setPlaylists((prev) => [pl, ...prev]);
    toast("Playlist created", { description: name });
    return pl;
  }, [profileId]);

  const renamePlaylist = useCallback(async (id, name) => {
    const updated = await playlistsApi.update(id, { name });
    setPlaylists((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, []);

  const deletePlaylist = useCallback(async (id) => {
    await playlistsApi.remove(id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    toast("Playlist deleted");
  }, []);

  const addSong = useCallback(async (id, songId) => {
    const updated = await playlistsApi.update(id, { addSongId: songId });
    setPlaylists((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  const removeSong = useCallback(async (id, songId) => {
    const updated = await playlistsApi.update(id, { removeSongId: songId });
    setPlaylists((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  return (
    <PlaylistsCtx.Provider value={{
      playlists, loading, refresh, createPlaylist, renamePlaylist, deletePlaylist,
      addSong, removeSong, addTarget, setAddTarget,
    }}>
      {children}
    </PlaylistsCtx.Provider>
  );
}
