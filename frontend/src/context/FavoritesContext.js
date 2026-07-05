import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { favoritesApi } from "@/lib/api";
import { useProfile } from "@/context/ProfileContext";
import { toast } from "sonner";

const FavoritesCtx = createContext(null);
export const useFavorites = () => useContext(FavoritesCtx);

export function FavoritesProvider({ children }) {
  const { profileId } = useProfile();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favSongs, setFavSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!profileId) return;
    try {
      const data = await favoritesApi.list(profileId);
      setFavoriteIds(new Set(data.songIds || []));
      setFavSongs(data.songs || []);
    } catch (e) { /* noop */ }
    finally { setLoading(false); }
  }, [profileId]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleFavorite = useCallback(async (song) => {
    const id = song.id;
    const wasFav = favoriteIds.has(id);
    // optimistic
    setFavoriteIds((prev) => {
      const nextSet = new Set(prev);
      if (wasFav) nextSet.delete(id); else nextSet.add(id);
      return nextSet;
    });
    setFavSongs((prev) => (wasFav ? prev.filter((s) => s.id !== id) : [song, ...prev]));
    try {
      await favoritesApi.toggle(profileId, id);
      toast(wasFav ? "Removed from Favorites" : "Added to Favorites", {
        description: song.title,
      });
    } catch (e) {
      refresh();
      toast.error("Could not update favorites");
    }
  }, [favoriteIds, profileId, refresh]);

  const isFavorite = useCallback((id) => favoriteIds.has(id), [favoriteIds]);

  return (
    <FavoritesCtx.Provider value={{ favoriteIds, favSongs, isFavorite, toggleFavorite, refresh, loading }}>
      {children}
    </FavoritesCtx.Provider>
  );
}
