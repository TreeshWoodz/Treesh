import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X } from "lucide-react";
import { VoiceControl } from "@/components/VoiceControl";
import { useProfile } from "@/context/ProfileContext";
import { CoverArt } from "@/components/CoverArt";

export function TopHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, setNeedsOnboarding } = useProfile();
  const params = new URLSearchParams(location.search);
  const [value, setValue] = useState(params.get("q") || "");

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setValue(p.get("q") || "");
  }, [location.search]);

  const onChange = (v) => {
    setValue(v);
    const q = v.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/", { replace: location.pathname === "/" });
  };

  return (
    <header className="sticky top-0 z-30 px-4 pt-3 sm:px-6 lg:px-8" data-testid="top-header">
      <div className="mx-auto flex max-w-6xl items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 backdrop-blur-2xl">
        <span className="font-display text-lg uppercase tracking-[0.12em] text-white lg:hidden">Treesh</span>

        <div className="relative ml-auto flex flex-1 items-center lg:ml-0">
          <Search size={16} className="pointer-events-none absolute left-3 text-white/40" />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search songs, artists…"
            data-testid="global-search-input"
            className="h-11 w-full rounded-full border border-white/12 bg-white/5 pl-9 pr-9 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25 focus:ring-2 focus:ring-[color:var(--treesh-purple)]/40 transition-colors"
          />
          {value && (
            <button onClick={() => onChange("")} aria-label="Clear" className="absolute right-3 text-white/40 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>

        <VoiceControl />

        <button onClick={() => setNeedsOnboarding(true)} aria-label="Profile" data-testid="header-profile-button" className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5">
          {profile.avatar ? <CoverArt src={profile.avatar} alt="profile" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-sm font-semibold text-white/70">{(profile.nickname || "T").charAt(0).toUpperCase()}</span>}
        </button>
      </div>
    </header>
  );
}
