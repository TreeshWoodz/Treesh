import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LibraryBig, Sparkles, Heart, ListMusic, Settings } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { StarfieldCanvas } from "@/components/StarfieldCanvas";
import { TopHeader } from "@/components/TopHeader";
import { MiniPlayerBar } from "@/components/MiniPlayerBar";
import { NowPlayingView } from "@/components/NowPlayingView";
import { AddToPlaylistDialog } from "@/components/AddToPlaylistDialog";
import { ProfileOnboarding } from "@/components/ProfileOnboarding";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Library", icon: LibraryBig, end: true },
  { to: "/artists", label: "Icons", icon: Sparkles },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/playlists", label: "Playlists", icon: ListMusic },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const location = useLocation();
  const topLevel = "/" + (location.pathname.split("/")[1] || "");
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[var(--treesh-bg-0)] text-white">
      <StarfieldCanvas />

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-[100dvh] w-[240px] flex-col border-r border-white/10 bg-black/40 backdrop-blur-2xl lg:flex">
        <div className="px-6 py-6">
          <p className="font-display text-2xl uppercase tracking-[0.1em] text-white">Treesh</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[color:var(--treesh-gold)]">Music to Live For</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                isActive ? "bg-white/10 text-white glow-purple" : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={18} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-5 text-[10px] text-white/30">© 2025 Treesh Woodz</div>
      </aside>

      {/* Main */}
      <div className="relative z-10 lg:ml-[240px]">
        <TopHeader />
        <main className="mx-auto max-w-6xl px-4 pb-44 pt-5 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={topLevel}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/70 backdrop-blur-2xl lg:hidden">
        <div className="flex items-center justify-around px-2 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              className={({ isActive }) => cn(
                "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors",
                isActive ? "text-[color:var(--treesh-purple)]" : "text-white/55"
              )}
            >
              <item.icon size={20} /> {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <MiniPlayerBar />
      <NowPlayingView />
      <AddToPlaylistDialog />
      <ProfileOnboarding />
    </div>
  );
}
