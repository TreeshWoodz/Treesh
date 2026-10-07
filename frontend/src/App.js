import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { GameProvider } from "@/lib/store";
import { BASE } from "@/data/game";
import { Shell } from "@/components/game/Shell";
import Lobby from "@/pages/Lobby";
import Modes from "@/pages/Modes";
import Play from "@/pages/Play";
import FlipIt from "@/pages/FlipIt";
import Lexicon from "@/pages/Lexicon";
import Shop from "@/pages/Shop";
import Trophies from "@/pages/Trophies";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";

function App() {
  return (
    <div className="App grain">
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path={BASE} element={<Shell />}>
              <Route index element={<Lobby />} />
              <Route path="modes" element={<Modes />} />
              <Route path="play/flip_it" element={<FlipIt />} />
              <Route path="play/:mode" element={<Play />} />
              <Route path="lexicon" element={<Lexicon />} />
              <Route path="shop" element={<Shop />} />
              <Route path="trophies" element={<Trophies />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to={BASE} replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster theme="dark" position="top-center" richColors />
      </GameProvider>
    </div>
  );
}

export default App;
