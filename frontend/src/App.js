import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import SonokoGame from "@/pages/SonokoGame";
import SudokuGame from "@/pages/SudokuGame";
import UnoGame from "@/pages/UnoGame";
import Trophies from "@/pages/Trophies";
import Leaderboard from "@/pages/Leaderboard";
import HowToPlay from "@/pages/HowToPlay";
import VersusGame from "@/pages/VersusGame";
import Locker from "@/pages/Locker";
import { useEffect } from "react";
import { useProfile, mergeLegacyStarlites } from "@/lib/progress";
import { SkinContext } from "@/lib/cosmetics";
import { BASE } from "@/lib/base";
import { applyTreeshAccent } from "@/lib/treesh";
import Profile from "@/pages/Profile";

function App() {
  const profile = useProfile();
  useEffect(() => {
    mergeLegacyStarlites();
    applyTreeshAccent();
    const h = (e) => (!e.key || /^treesh_(accent|profile)$/.test(e.key)) && applyTreeshAccent();
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);
  useEffect(() => {
    document.body.dataset.theme = profile.theme || "arcade";
  }, [profile.theme]);
  return (
    <SkinContext.Provider value={profile.skin || "classic"}>
    <div className="App">
      <BrowserRouter basename={BASE}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play/sonoko" element={<SonokoGame key="sonoko" />} />
          <Route path="/play/daily" element={<SonokoGame key="daily" daily />} />
          <Route path="/play/sudoku" element={<SudokuGame />} />
          <Route path="/play/uno" element={<UnoGame />} />
          <Route path="/trophies" element={<Trophies />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
          <Route path="/play/tutorial" element={<SonokoGame key="tutorial" tutorial />} />
          <Route path="/play/versus" element={<VersusGame />} />
          <Route path="/locker" element={<Locker />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" theme="dark" richColors closeButton duration={2600} />
    </div>
    </SkinContext.Provider>
  );
}

export default App;
