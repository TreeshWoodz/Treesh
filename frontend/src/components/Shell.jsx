import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, CalendarRange, Camera, Dumbbell, Gamepad2, MapPin, Menu, Ruler, Star, UserRound } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { HoopLogo } from "@/components/Logo";
import { KEYS, useStored } from "@/lib/storage";

export const NAV = [
  { to: "/courts", label: "Courts", icon: MapPin, id: "courts" },
  { to: "/drills", label: "Drills", icon: Dumbbell, id: "drills" },
  { to: "/plan", label: "Plan", icon: CalendarRange, id: "plan" },
  { to: "/dictionary", label: "Dictionary", icon: BookOpen, id: "dictionary" },
  { to: "/position", label: "Position", icon: Ruler, id: "position" },
  { to: "/games", label: "Games", icon: Gamepad2, id: "games" },
  { to: "/favorites", label: "Favorites", icon: Star, id: "favorites" },
  { to: "/form", label: "Form Check", icon: Camera, id: "form", badge: "New" },
];
const PRIMARY = NAV.slice(0, 4);
const MORE = [...NAV.slice(4), { to: "/profile", label: "Profile", icon: UserRound, id: "profile" }];

export function Avatar({ profile, size = 40, testid = "header-avatar" }) {
  const initial = ((profile && profile.nickname) || "H").charAt(0).toUpperCase();
  return (
    <span data-testid={testid} className="grid shrink-0 place-items-center overflow-hidden rounded-full border border-[#2c2f45] bg-[#171923]" style={{ width: size, height: size }}>
      {profile && profile.avatar ? (
        <img src={profile.avatar} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
      ) : (
        <span className="font-display text-[#FF3EA5]" style={{ fontSize: size * 0.42 }}>{initial}</span>
      )}
    </span>
  );
}

export default function Shell({ children }) {
  const [profile] = useStored(KEYS.profile, null);
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const inMore = MORE.some((m) => loc.pathname.startsWith(m.to));

  return (
    <div className="hoop-noise min-h-screen bg-[#0A0A0D] text-[#F5F6F8]">
      {/* desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-[#1b1c27] bg-[#0c0c10] px-4 py-6 lg:flex">
        <button onClick={() => nav("/courts")} className="mb-8 px-2 text-left" data-testid="rail-logo">
          <HoopLogo />
        </button>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <NavLink key={n.id} to={n.to} data-testid={`rail-nav-${n.id}`} className={({ isActive }) => `group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${isActive ? "bg-[#17131a] text-[#F5F6F8]" : "text-[#8B90A6] hover:bg-white/[.03] hover:text-[#E6E8EF]"}`}>
              {({ isActive }) => (
                <>
                  <span className={`h-5 w-[3px] rounded-full ${isActive ? "bg-[#FF3EA5]" : "bg-transparent"}`} />
                  <n.icon size={18} className={isActive ? "text-[#FF3EA5]" : ""} />
                  <span className="flex-1">{n.label}</span>
                  {n.badge && <span className="rounded-full bg-[#FF3EA5]/15 px-2 py-0.5 text-[10px] font-extrabold text-[#FF66BE]">{n.badge}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => nav("/profile")} data-testid="rail-profile-button" className="press flex items-center gap-3 rounded-2xl border border-[#1f2130] bg-[#121319] p-2.5 text-left hover:border-[#34374d]">
          <Avatar profile={profile} size={40} testid="rail-avatar" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{profile?.nickname || "Set up profile"}</span>
            <span className="block text-[11px] text-[#8B90A6]">{profile ? "Treesh profile" : "Not connected"}</span>
          </span>
        </button>
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#16171f] bg-[#0A0A0D]/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur lg:hidden">
        <button onClick={() => nav("/courts")} data-testid="header-logo">
          <HoopLogo />
        </button>
        <button onClick={() => nav("/profile")} className="press" aria-label="Profile" data-testid="header-profile-button">
          <Avatar profile={profile} size={40} />
        </button>
      </header>

      <main className="lg:pl-[248px]">
        <div className="mx-auto w-full max-w-[1120px] px-4 pb-32 pt-5 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">{children}</div>
      </main>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#1a1b25] bg-[#0b0b0f]/98 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" data-testid="bottom-nav">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {PRIMARY.map((n) => (
            <NavLink key={n.id} to={n.to} data-testid={`bottom-nav-${n.id}-tab`} className={({ isActive }) => `relative flex h-[66px] flex-col items-center justify-center gap-1 text-[10.5px] font-bold ${isActive ? "text-[#F5F6F8]" : "text-[#8B90A6]"}`}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-[#FF3EA5]" />}
                  <n.icon size={21} className={isActive ? "text-[#FF3EA5]" : ""} strokeWidth={isActive ? 2.4 : 2} />
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
          <button onClick={() => setOpen(true)} data-testid="more-sheet-open-button" className={`relative flex h-[66px] flex-col items-center justify-center gap-1 text-[10.5px] font-bold ${inMore ? "text-[#F5F6F8]" : "text-[#8B90A6]"}`}>
            {inMore && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-[#FF3EA5]" />}
            <Menu size={21} className={inMore ? "text-[#FF3EA5]" : ""} />
            More
          </button>
        </div>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-[26px] border-[#25273a] bg-[#0f1015] pb-[max(24px,env(safe-area-inset-bottom))]" data-testid="more-sheet">
          <SheetHeader>
            <SheetTitle className="font-display text-left text-xl text-[#F5F6F8]">More</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {MORE.map((m) => (
              <button key={m.id} data-testid={`more-sheet-${m.id}-link`} onClick={() => { setOpen(false); nav(m.to); }} className="press relative flex flex-col items-center gap-2 rounded-2xl border border-[#22243a] bg-[#14151d] px-2 py-4 text-[12px] font-bold text-[#E6E8EF]">
                {m.badge && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#FF3EA5]" />}
                <m.icon size={22} className="text-[#FF3EA5]" />
                {m.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
