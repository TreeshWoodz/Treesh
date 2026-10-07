import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { Gamepad2, Flame, BookOpen, ShoppingBag, Trophy, BarChart3, Volume2, VolumeX } from "lucide-react";
import { useGame } from "@/lib/store";
import { BASE } from "@/data/game";
import { Starlite } from "@/components/game/Starlite";

const NAV = [
  { to: "", label: "Lobby", icon: Gamepad2, id: "lobby" },
  { to: "modes", label: "Modes", icon: Flame, id: "modes" },
  { to: "lexicon", label: "Lexicon", icon: BookOpen, id: "lexicon" },
  { to: "shop", label: "Shop", icon: ShoppingBag, id: "shop" },
  { to: "trophies", label: "Trophies", icon: Trophy, id: "trophies" },
  { to: "leaderboard", label: "Ranks", icon: BarChart3, id: "leaderboard" },
];

const Header = () => {
  const { state, set } = useGame();
  return (
    <header data-testid="game-header" className="glass sticky top-0 z-40 border-x-0 border-t-0">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
        <Link to={BASE} data-testid="brand-home-link" className="flex items-baseline gap-2">
          <span className="font-display text-3xl text-gold-grad leading-none">EBONICS</span>
          <span className="hidden sm:inline text-[10px] tracking-[0.3em] uppercase text-slate-400">by Treesh Games</span>
        </Link>
        <span data-testid="route-pill" className="hidden md:inline font-mono text-[11px] px-2 py-1 rounded-md border border-[var(--eb-border)] text-slate-400">treesh.app/games/ebonics</span>
        <div className="ml-auto flex items-center gap-2">
          <div data-testid="daily-streak-badge" className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--eb-border)] font-mono text-sm">
            <Flame className="w-4 h-4 text-orange-400" />{state.streak.count}
          </div>
          <Link to={`${BASE}/shop`} data-testid="starlites-balance" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full gold-glow border border-[var(--eb-gold)] font-mono text-sm text-[var(--eb-gold)]">
            <Starlite className="w-4 h-4" />{state.starlites.toLocaleString()}
          </Link>
          <button data-testid="sound-toggle-btn" aria-label="Toggle sound" onClick={() => set({ sound: !state.sound })} className="p-2 rounded-full hover:bg-white/5 text-slate-300">
            {state.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

const BottomNav = () => (
  <nav className="glass fixed bottom-3 left-1/2 -translate-x-1/2 z-40 rounded-2xl px-2 py-1.5 flex gap-1 w-[calc(100%-1.5rem)] max-w-xl justify-between">
    {NAV.map(({ to, label, icon: Icon, id }) => (
      <NavLink key={id} end={to === ""} to={`${BASE}${to ? "/" + to : ""}`} data-testid={`nav-${id}-btn`}
        className={({ isActive }) => `flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-colors duration-200 ${isActive ? "bg-[var(--eb-gold)] text-[#0B0914]" : "text-slate-400 hover:text-white"}`}>
        <Icon className="w-5 h-5" />{label}
      </NavLink>
    ))}
  </nav>
);

export const Shell = () => {
  const { pathname } = useLocation();
  const playing = pathname.includes("/play/");
  return (
    <div className="relative z-10 min-h-screen pb-28">
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-6"><Outlet /></main>
      {!playing && <BottomNav />}
    </div>
  );
};
