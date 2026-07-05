import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import { ProfileProvider } from "@/context/ProfileContext";
import { AudioProvider } from "@/context/AudioContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { PlaylistsProvider } from "@/context/PlaylistsContext";

import { AppShell } from "@/components/AppShell";
import Library from "@/pages/Library";
import Artists from "@/pages/Artists";
import ArtistDetail from "@/pages/ArtistDetail";
import Favorites from "@/pages/Favorites";
import Playlists from "@/pages/Playlists";
import PlaylistDetail from "@/pages/PlaylistDetail";
import Settings from "@/pages/Settings";

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ProfileProvider>
      <AudioProvider>
        <FavoritesProvider>
          <PlaylistsProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<Library />} />
                  <Route path="artists" element={<Artists />} />
                  <Route path="artists/:id" element={<ArtistDetail />} />
                  <Route path="favorites" element={<Favorites />} />
                  <Route path="playlists" element={<Playlists />} />
                  <Route path="playlists/:id" element={<PlaylistDetail />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <Toaster position="top-center" theme="dark" />
          </PlaylistsProvider>
        </FavoritesProvider>
      </AudioProvider>
    </ProfileProvider>
  );
}

export default App;
