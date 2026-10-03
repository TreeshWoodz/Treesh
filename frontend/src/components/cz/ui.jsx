import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { House, Trophy, ShoppingBag, User, Settings, ChevronLeft, X, LayoutGrid, CircleHelp, Play as PlayIcon } from "lucide-react";
import { useGame } from "@/game/GameContext";
import { Icon } from "./Icon";
import { TIER_COLORS, levelFromXp, COSMETIC_BY_ID } from "@/game/data";

const DESK_Q = "(min-width: 1024px)";
export function useIsDesktop() {
  const [d, setD] = useState(() => typeof window !== "undefined" && window.matchMedia && window.matchMedia(DESK_Q).matches);
  useEffect(() => {
    const m = window.matchMedia(DESK_Q);
    const f = () => setD(m.matches);
    f();
    if (m.addEventListener) m.addEventListener("change", f); else m.addListener(f);
    return () => { if (m.removeEventListener) m.removeEventListener("change", f); else m.removeListener(f); };
  }, []);
  return d;
}

export const fmt = (n) => (n || 0).toLocaleString("en-US");
export const fmtK = (n) => { n = n || 0; return n >= 10000 ? (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k" : fmt(n); };

/* Starlite glyph: four-point sparkle in gold */
export const StarGlyph = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="czg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff4c9" />
        <stop offset=".55" stopColor="#ffd36b" />
        <stop offset="1" stopColor="#c3ab69" />
      </linearGradient>
    </defs>
    <path d="M12 1.5c.5 4.9 2.4 8.4 10.5 10.5-8.1 2.1-10 5.6-10.5 10.5-.5-4.9-2.4-8.4-10.5-10.5C9.6 9.9 11.5 6.4 12 1.5z" fill="url(#czg)" />
  </svg>
);

export const StarPill = ({ value, testid = "starlites-balance", size = "md", onClick }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testid}
    className={`cz-chip cz-press cz-focus inline-flex items-center gap-1.5 ${size === "lg" ? "px-4 py-2" : "px-3 py-1.5"}`}
    style={{ borderColor: "rgba(255,211,107,0.28)", boxShadow: "0 0 0 1px rgba(255,211,107,0.08), 0 6px 20px rgba(255,211,107,0.10)" }}
    aria-label={`${fmt(value)} Starlites`}
  >
    <StarGlyph size={size === "lg" ? 20 : 16} />
    <span className={`font-num cz-gold-text ${size === "lg" ? "text-xl" : "text-base"} leading-none`}>{fmtK(value)}</span>
  </button>
);

export const Btn = ({ variant = "primary", className = "", children, testid, ...rest }) => {
  const v = variant === "primary" ? "cz-btn-primary" : variant === "gold" ? "cz-btn-gold" : "cz-btn-ghost";
  return (
    <button type="button" data-testid={testid} className={`cz-press cz-focus ${v} inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold disabled:opacity-40 disabled:pointer-events-none ${className}`} {...rest}>
      {children}
    </button>
  );
};

export const IconBtn = ({ children, label, testid, className = "", ...rest }) => (
  <button type="button" aria-label={label} title={label} data-testid={testid} className={`cz-press cz-focus cz-btn-ghost grid h-11 w-11 place-items-center rounded-full ${className}`} {...rest}>
    {children}
  </button>
);

export const Avatar = ({ profile, name, size = 48, ring = true }) => {
  const nick = (profile && profile.nickname) || name || "Player";
  return (
    <div className="relative shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size, boxShadow: ring ? "0 0 0 2px var(--accent), 0 0 18px rgb(var(--accent-rgb) / .45)" : "none" }}>
      {profile && profile.avatar ? (
        <img src={profile.avatar} alt={nick} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center font-display text-white" style={{ background: "linear-gradient(135deg, var(--accent), #111)", fontSize: size * 0.42 }}>
          {nick.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export const Header = ({ title, sub, back = "home", right, testid }) => {
  const { go } = useGame();
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-3 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))] lg:-mx-10 lg:mb-6 lg:px-10 lg:pb-5" style={{ background: "linear-gradient(180deg, rgba(7,8,11,.96) 60%, rgba(7,8,11,0))" }}>
      {back ? (
        <button type="button" onClick={() => go(back)} data-testid={testid ? testid + "-back" : "header-back"} aria-label="Back" className={`cz-press cz-focus cz-btn-ghost grid h-10 w-10 place-items-center rounded-full ${back === "home" ? "lg:hidden" : ""}`}>
          <ChevronLeft size={20} />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="font-display truncate text-xl leading-tight lg:text-3xl">{title}</h1>
        {sub ? <p className="truncate text-xs text-white/55 lg:text-sm">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
};

const NAV = [
  { id: "home", label: "Home", Icon: House },
  { id: "trophies", label: "Trophies", Icon: Trophy },
  { id: "shop", label: "Shop", Icon: ShoppingBag },
  { id: "profile", label: "Profile", Icon: User },
  { id: "settings", label: "Settings", Icon: Settings },
];
export const BottomNav = () => {
  const { screen, go } = useGame();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[520px] px-4 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden" data-testid="bottom-nav">
      <div className="flex items-center justify-between rounded-[26px] border border-white/10 bg-[#0d0f16]/95 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,.6)] backdrop-blur-md">
        {NAV.map(({ id, label, Icon: I }) => {
          const on = screen === id;
          return (
            <button key={id} type="button" onClick={() => go(id)} data-testid={`nav-${id}`} aria-label={label} aria-current={on ? "page" : undefined}
              className="cz-press cz-focus relative flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px]">
              {on ? <motion.span layoutId="navpill" className="absolute inset-0 rounded-[20px]" style={{ background: "rgb(var(--accent-rgb) / .18)", boxShadow: "inset 0 0 0 1px rgb(var(--accent-rgb) / .35)" }} transition={{ type: "spring", stiffness: 500, damping: 38 }} /> : null}
              <I size={19} className={`relative ${on ? "cz-text-accent" : "text-white/55"}`} />
              <span className={`relative text-[10px] font-bold ${on ? "text-white" : "text-white/45"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const SIDE = [
  { id: "home", label: "Home", Icon: House },
  { id: "modes", label: "Modes", Icon: LayoutGrid },
  { id: "trophies", label: "Trophies", Icon: Trophy },
  { id: "shop", label: "Gift Shop", Icon: ShoppingBag },
  { id: "profile", label: "Profile", Icon: User },
  { id: "settings", label: "Settings", Icon: Settings },
  { id: "howto", label: "How to play", Icon: CircleHelp },
];
export const SideNav = () => {
  const { screen, go, points, profile, save, bankState } = useGame();
  const name = (profile && profile.nickname) || save.guestName || "Guest Player";
  const lv = levelFromXp(save.xp);
  const title = COSMETIC_BY_ID[save.equipped.title];
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-white/[.07] bg-[#090b10]/95 px-4 py-6 lg:flex" data-testid="side-nav">
      <button type="button" onClick={() => go("home")} className="cz-focus rounded-xl px-2" data-testid="side-nav-logo"><Wordmark size={38} /></button>
      <p className="mt-2 px-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white/35">Treesh Games</p>
      <button type="button" disabled={bankState !== "ready"} onClick={() => go("play", { mode: save.lastMode || "classic", difficulty: save.lastDifficulty || "normal", k: Date.now() })} data-testid="side-nav-play"
        className="cz-press cz-focus cz-btn-primary cz-shimmer mt-7 flex h-14 items-center justify-center gap-2 rounded-2xl text-base font-extrabold tracking-wide disabled:opacity-50">
        <PlayIcon size={18} className="fill-current" />PLAY
      </button>
      <nav className="mt-6 space-y-1">
        {SIDE.map(({ id, label, Icon: I }) => {
          const on = screen === id;
          return (
            <button key={id} type="button" onClick={() => go(id)} data-testid={`side-nav-${id}`} aria-current={on ? "page" : undefined}
              className="cz-press cz-focus relative flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold">
              {on ? <motion.span layoutId="sidepill" className="absolute inset-0 rounded-xl" style={{ background: "rgb(var(--accent-rgb) / .16)", boxShadow: "inset 0 0 0 1px rgb(var(--accent-rgb) / .35)" }} transition={{ type: "spring", stiffness: 500, damping: 40 }} /> : null}
              <I size={18} className={`relative ${on ? "cz-text-accent" : "text-white/50"}`} />
              <span className={`relative ${on ? "text-white" : "text-white/65"}`}>{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto">
        <button type="button" onClick={() => go("profile")} className="cz-card cz-press cz-focus flex w-full items-center gap-3 p-3 text-left" data-testid="side-nav-player">
          <Avatar profile={profile} name={name} size={42} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">{name}</p>
            <p className="truncate text-[11px] text-white/45">LV {lv.level} · {title ? title.name : "Rookie"}</p>
            <div className="mt-1.5"><Progress value={lv.pct} h={4} /></div>
          </div>
        </button>
        <div className="mt-2 flex justify-center"><StarPill value={points} testid="side-nav-starlites" onClick={() => go("shop")} /></div>
      </div>
    </aside>
  );
};

export const Toasts = () => {
  const { toasts, dismissToast } = useGame();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] mx-auto flex w-full max-w-[520px] flex-col items-center gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))] lg:left-auto lg:right-6 lg:mx-0 lg:w-[400px] lg:px-0 lg:pt-6">
      <AnimatePresence>
        {toasts.map((t) => {
          const c = t.kind === "trophy" ? TIER_COLORS[t.tier] || "#ffd36b" : t.kind === "star" ? "#ffd36b" : t.kind === "error" ? "#ff4d6d" : "var(--accent)";
          return (
            <motion.div key={t.id} layout initial={{ y: -30, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -20, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border bg-[#0f1219] px-3.5 py-3 shadow-[0_16px_40px_rgba(0,0,0,.55)]"
              style={{ borderColor: `color-mix(in oklab, ${c} 40%, transparent)` }} data-testid={`toast-${t.kind || "info"}`}>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${c} 18%, #0f1219)`, color: c }}>
                {t.kind === "star" ? <StarGlyph size={20} /> : <Icon name={t.icon || (t.kind === "trophy" ? "Trophy" : "Sparkles")} size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold">{t.title}</p>
                {t.sub ? <p className="truncate text-xs text-white/60">{t.sub}</p> : null}
              </div>
              <button type="button" aria-label="Dismiss" onClick={() => dismissToast(t.id)} className="grid h-7 w-7 place-items-center rounded-full text-white/50 hover:text-white"><X size={14} /></button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export const Progress = ({ value, color = "var(--accent)", h = 6, testid }) => (
  <div className="w-full overflow-hidden rounded-full bg-white/10" style={{ height: h }} data-testid={testid}>
    <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }} />
  </div>
);

export const Wordmark = ({ size = 34 }) => (
  <div className="flex items-center gap-2" aria-label="Chainz">
    <div className="relative grid place-items-center rounded-xl" style={{ width: size, height: size, background: "var(--accent)", boxShadow: "0 0 24px rgb(var(--accent-rgb) / .55)" }}>
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none" stroke="var(--accent-ink)" strokeWidth="2.6" strokeLinecap="round">
        <path d="M9.5 14.5l5-5" /><path d="M11 6.5l1.6-1.6a4 4 0 015.6 5.6L16.6 12" /><path d="M13 17.5l-1.6 1.6a4 4 0 01-5.6-5.6L7.4 12" />
      </svg>
    </div>
    <span className="font-display leading-none" style={{ fontSize: size * 0.72 }}>CHAINZ</span>
  </div>
);

export const Page = ({ children, nav = true, testid, width = 1140 }) => (
  <motion.main data-testid={testid} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
    className={`relative z-10 w-full ${nav ? "pb-32 lg:pb-14 lg:pl-[260px]" : "pb-8"}`}>
    <div className="cz-page mx-auto w-full max-w-[520px] px-4 lg:px-10" style={{ "--page-w": `${width}px` }}>{children}</div>
  </motion.main>
);

export const SectionTitle = ({ children, right }) => (
  <div className="mb-2.5 mt-6 flex items-center justify-between lg:mt-8">
    <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/50">{children}</h2>
    {right}
  </div>
);
