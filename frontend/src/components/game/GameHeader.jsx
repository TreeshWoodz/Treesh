import { Link } from "react-router-dom";
import { ChevronLeft, Volume2, VolumeX } from "lucide-react";
import { useProfile, updateProfile } from "@/lib/progress";

export const IconBtn = ({ children, testid, onClick, label }) => (
  <button
    type="button"
    aria-label={label}
    data-testid={testid}
    onClick={onClick}
    className="btn-3d h-10 w-10 grid place-items-center rounded-2xl bg-[#2A3458] border-2 border-white/10 text-white transition-colors duration-150 hover:bg-[#34406b]"
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
        className="btn-3d h-10 pl-2 pr-3.5 flex items-center gap-1 rounded-2xl bg-[#2A3458] border-2 border-white/10 text-white font-display text-base font-black uppercase tracking-wide transition-colors duration-150 hover:bg-[#34406b]"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={3} /> Menu
      </Link>
      <h1 className="game-title font-display font-black uppercase italic tracking-tight text-2xl sm:text-4xl truncate" style={{ color: accent }}>
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
