import React from "react";
import { AnimatePresence } from "framer-motion";
import "@/App.css";
import { GameProvider, useGame } from "@/game/GameContext";
import { Arena } from "@/components/cz/Arena";
import { BottomNav, SideNav, Toasts } from "@/components/cz/ui";
import { LS } from "@/game/storage";
import Home from "@/screens/Home";
import Modes from "@/screens/Modes";
import Play from "@/screens/Play";
import Results from "@/screens/Results";
import Trophies from "@/screens/Trophies";
import Shop from "@/screens/Shop";
import Profile from "@/screens/Profile";
import Settings from "@/screens/Settings";
import HowTo from "@/screens/HowTo";

const SCREENS = { home: Home, modes: Modes, play: Play, results: Results, trophies: Trophies, shop: Shop, profile: Profile, settings: Settings, howto: HowTo };
const NAV_SCREENS = new Set(["home", "trophies", "shop", "profile", "settings", "modes"]);

function Shell() {
  const { screen, params, save } = useGame();
  const Screen = SCREENS[screen] || Home;
  return (
    <div className="cz-noise relative min-h-[100dvh] overflow-x-hidden" data-testid="app-shell">
      <Arena id={save.equipped.arena} dim={screen !== "play"} />
      <AnimatePresence mode="wait">
        <Screen key={screen + (params.k || "")} />
      </AnimatePresence>
      {NAV_SCREENS.has(screen) ? <BottomNav /> : null}
      {NAV_SCREENS.has(screen) || (screen === "howto" && LS.get("chainz_seen_howto", false)) ? <SideNav /> : null}
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
