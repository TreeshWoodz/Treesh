import { Link, NavLink } from "react-router-dom";
import { Home, Map, Trophy, ShoppingBag, BarChart3 } from "lucide-react";
import { useProfile } from "../game/store";
import { ACHIEVEMENTS } from "../game/config";
import { StarliteBadge } from "./Starlite";

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
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0A070D]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          <StarliteBadge value={starlites} />
          <Link to="/profile" data-testid="nav-profile-btn" className="avatar-btn" title={profile.name}>
            {treesh?.avatar ? <img data-testid="nav-profile-avatar" src={treesh.avatar} alt={profile.name} /> : profile.name.slice(0, 1).toUpperCase()}
          </Link>
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
            <span className="relative">
              <Icon size={20} />
              {id === "trophies" && claimable > 0 && <span data-testid="nav-trophies-badge" className="nav-dot">{claimable}</span>}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export const Layout = ({ children }) => (
  <div className="min-h-screen bg-app">
    <TopBar />
    <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 sm:pt-10">{children}</main>
    <BottomNav />
  </div>
);

export const PageTitle = ({ eyebrow, title, children }) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4 rise">
    <div>
      <div className="eyebrow">{eyebrow}</div>
      <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
    </div>
    {children}
  </div>
);
