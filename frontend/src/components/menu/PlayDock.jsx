import { Link, useLocation, useNavigate } from "react-router-dom";
import { Play, Trophy, BarChart3, Shirt, User, BookOpen } from "lucide-react";
import { useProfile } from "@/lib/progress";
import { modeById } from "@/lib/modes";
import { sfx } from "@/lib/sound";

const NAV = [
  { to: "/trophies", label: "Trophies", icon: Trophy, testid: "home-trophies-link" },
  { to: "/leaderboard", label: "Ranks", icon: BarChart3, testid: "home-leaderboard-link" },
  { to: "/locker", label: "Locker", icon: Shirt, testid: "home-locker-link" },
  { to: "/profile", label: "Profile", icon: User, testid: "nav-profile-link" },
  { to: "/how-to-play", label: "Rules", icon: BookOpen, testid: "home-how-to-play-button" },
];

export const DOCK_SPACE = "pb-[calc(10.5rem+env(safe-area-inset-bottom))]";

export const PlayDock = () => {
  const profile = useProfile();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mode = modeById(profile.lastMode);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none" data-testid="play-dock">
      <div className="h-10 bg-gradient-to-t from-[#0B0F19] to-transparent" />
      <div className="pointer-events-auto bg-[#0B0F19] pb-[max(env(safe-area-inset-bottom),8px)]">
        <div className="max-w-xl mx-auto px-4">
          <button
            type="button"
            data-testid="home-play-now-button"
            onClick={() => {
              sfx.play();
              navigate(mode.to);
            }}
            className="btn-3d relative overflow-hidden -mt-6 w-full h-16 rounded-[1.4rem] bg-brand text-brand-ink border-[3px] border-white/90 flex items-center justify-center gap-3"
          >
            <span className="play-shine absolute inset-0 pointer-events-none" />
            <Play className="w-7 h-7 fill-current" />
            <span className="font-display text-3xl font-black uppercase italic tracking-tight leading-none">Play</span>
            <span data-testid="play-dock-mode" className="font-display text-base font-black uppercase opacity-80 leading-none mt-1">
              · {mode.name}
            </span>
          </button>
          <nav className="grid grid-cols-5 gap-1 pt-3">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  data-testid={n.testid}
                  className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors duration-150 ${active ? "bg-white/10 text-brand" : "text-slate-400 hover:text-white"}`}
                >
                  <n.icon className="w-5 h-5" strokeWidth={2.5} />
                  <span className="text-[10px] font-black uppercase tracking-wider">{n.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};
