import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { ProfileProvider } from "./game/store";
import { applyTreeshAccent } from "./game/wallet";
import { WelcomeModal } from "./components/WelcomeModal";
import Hub from "./pages/Hub";
import LevelMap from "./pages/LevelMap";
import Play from "./pages/Play";
import Trophies from "./pages/Trophies";
import Shop from "./pages/Shop";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import ColorPopSelect from "./pages/ColorPopSelect";

const BASE = "/games/bronze-blitz";
applyTreeshAccent();
if (!window.location.pathname.startsWith(BASE)) {
  window.history.replaceState(null, "", BASE + window.location.pathname.replace(/^\/$/, "/") + window.location.search);
}

function App() {
  return (
    <ProfileProvider>
      <BrowserRouter basename={BASE}>
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/levels" element={<LevelMap />} />
          <Route path="/colorpop" element={<ColorPopSelect />} />
          <Route path="/play/:mode" element={<Play />} />
          <Route path="/play/:mode/:level" element={<Play />} />
          <Route path="/trophies" element={<Trophies />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <WelcomeModal />
      </BrowserRouter>
      <Toaster position="top-center" theme="dark" richColors />
    </ProfileProvider>
  );
}

export default App;
