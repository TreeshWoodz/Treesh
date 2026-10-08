import { Link } from "react-router-dom";
import { ChevronLeft, Volume2, VolumeX } from "lucide-react";
import { useProfile, updateProfile } from "@/lib/progress";

export const IconBtn = ({ children, testid, onClick, label }) => (
  <button
    type="button"
    aria-label={label}
    data-testid={testid}
    onClick={onClick}
    className="h-10 w-10 grid place-items-center rounded-xl bg-white/5 border border-white/10 text-slate-200 transition-colors duration-150 hover:bg-white/15 hover:text-white active:scale-95"
  >
    {children}
  </button>
);

export const GameHeader = ({ title, accent = "var(--brand)", right }) => {
  const profile = useProfile();
  return (
    <header className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3 px-3 sm:px-6 pt-3 pb-2">
      <Link
        to="/"
        data-testid="back-home-button"
        className="h-10 pl-2 pr-3 flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm font-semibold transition-colors duration-150 hover:bg-white/15 hover:text-white"
      >
        <ChevronLeft className="w-4 h-4" /> Menu
      </Link>
      <h1 className="font-display font-black uppercase italic tracking-tight text-2xl sm:text-3xl" style={{ color: accent }}>
        {title}
      </h1>
      <div className="flex items-center gap-2">
        {right}
        <IconBtn testid="sound-toggle-button" label="Toggle sound" onClick={() => updateProfile((p) => (p.sound = !p.sound))}>
          {profile.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </IconBtn>
      </div>
    </header>
  );
};
