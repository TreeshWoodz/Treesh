import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Home, Map, Trophy, ShoppingBag, BarChart3, Plus, Settings } from "lucide-react";
import { useProfile } from "../game/store";
import { ACHIEVEMENTS } from "../game/config";
import { StarliteBadge } from "./Starlite";
import { GameBackground } from "./GameBackground";

export const Logo = () => (
  <Link to="/" data-testid="nav-logo" className="flex items-center gap-3 group">
    <div className="logo-mark">BB</div>
    <div className="leading-none">
      <div className="font-display text-base sm:text-lg font-black tracking-tight text-gold">BRONZE BLITZ</div>
      <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.35em] text-[var(--ac-hi)]">Treesh Games</div>
    </div>
  </Link>
);

export const TopBar = () => {
  const { profile, starlites, treesh } = useProfile();
  const [avErr, setAvErr] = useState(false);
  useEffect(() => setAvErr(false), [treesh?.avatar]);
  const cleared = Object.values(profile.levelStars).filter((x) => x > 0).length;
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="hud-top mx-auto flex max-w-6xl items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link to="/" data-testid="nav-logo" className="logo-mark" title="Bronze Blitz">BB</Link>
          <Link to="/profile" data-testid="nav-profile-btn" className="flex min-w-0 items-center gap-2" title={profile.name}>
            <span className="avatar-btn">
              {treesh?.avatar && !avErr ? <img data-testid="nav-profile-avatar" src={treesh.avatar} alt={profile.name} onError={() => setAvErr(true)} /> : profile.name.slice(0, 1).toUpperCase()}
              <span className="avatar-level" data-testid="nav-player-level">{cleared + 1}</span>
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate font-display text-sm font-black text-white">{profile.name}</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--ac-hi)]">Treesh Games</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/shop" data-testid="nav-starlites-shop" className="flex items-center">
            <StarliteBadge value={starlites} />
            <span className="plus-btn"><Plus size={14} strokeWidth={3} /></span>
          </Link>
          <Link to="/profile" data-testid="nav-settings-btn" className="icon-btn !h-10 !w-10"><Settings size={18} /></Link>
        </div>
      </div>
    </header>
  );
};

const LINKS = [
  { to: "/", label: "Home", Icon: Home, id: "home" },
  { to: "/levels", label: "Levels", Icon: Map, id: "levels" },
  { to: "/trophies", label: "Trophies", Icon: Trophy, id: "trophies" },
  { to: "/shop", label: "Shop", Icon: ShoppingBag, id: "shop" },
  { to: "/leaderboard", label: "Ranks", Icon: BarChart3, id: "leaderboard" },
];

export const BottomNav = () => {
  const { profile } = useProfile();
  const claimable = ACHIEVEMENTS.filter((a) => !profile.claimed.includes(a.id) && a.val(profile) >= a.goal).length;
  return (
    <nav className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-3">
      <div className="bottom-nav">
        {LINKS.map(({ to, label, Icon, id }) => (
          <NavLink key={id} to={to} end data-testid={`nav-${id}`} className={({ isActive }) => `nav-item ${isActive ? "nav-active" : ""}`}>
            <span className="nav-icon relative">
              <Icon size={22} strokeWidth={2.4} />
              {id === "trophies" && claimable > 0 && <span data-testid="nav-trophies-badge" className="nav-dot">{claimable}</span>}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export const Layout = ({ children, art = "menu", wide = false }) => (
  <div className="min-h-screen bg-app">
    <GameBackground art={art} />
    <TopBar />
    <main className={`mx-auto px-4 pb-28 pt-5 sm:px-6 sm:pt-8 ${wide ? "max-w-6xl" : "max-w-5xl"}`}>{children}</main>
    <BottomNav />
  </div>
);

export const PageTitle = ({ eyebrow, title, children }) => (
  <div className="mb-8 flex flex-col items-center gap-3 text-center rise">
    <div className="eyebrow !mb-0">{eyebrow}</div>
    <div className="ribbon-wrap"><h1 className="ribbon font-display text-xl font-black sm:text-3xl">{title}</h1></div>
    {children}
  </div>
);
