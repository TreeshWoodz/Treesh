import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Shell from "@/components/Shell";
import TimerOverlay from "@/components/TimerOverlay";
import { TimerProvider } from "@/context/TimerContext";
import Courts from "@/pages/Courts";
import Drills from "@/pages/Drills";
import Plan from "@/pages/Plan";
import Dictionary from "@/pages/Dictionary";
import Position from "@/pages/Position";
import Games from "@/pages/Games";
import GamePlay from "@/pages/GamePlay";
import Favorites from "@/pages/Favorites";
import FormCheck from "@/pages/FormCheck";
import Profile from "@/pages/Profile";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="App">
      <BrowserRouter basename="/hoop">
        <TimerProvider>
          <ScrollTop />
          <Shell>
            <Routes>
              <Route path="/" element={<Navigate to="/courts" replace />} />
              <Route path="/courts" element={<Courts />} />
              <Route path="/drills" element={<Drills />} />
              <Route path="/plan" element={<Plan />} />
              <Route path="/dictionary" element={<Dictionary />} />
              <Route path="/position" element={<Position />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/:id" element={<GamePlay />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/form" element={<FormCheck />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/courts" replace />} />
            </Routes>
          </Shell>
          <TimerOverlay />
          <Toaster position="top-center" theme="dark" toastOptions={{ style: { background: "#14151d", border: "1px solid #2a2c40", color: "#F5F6F8" } }} />
        </TimerProvider>
      </BrowserRouter>
    </div>
  );
}
