export const Avatar = ({ profile, className = "w-9 h-9 text-sm" }) => (
  <span className={`relative grid place-items-center shrink-0 overflow-hidden rounded-full border border-[var(--eb-border)] bg-[var(--eb-surface2)] font-display text-[var(--eb-gold)] ${className}`}>
    {profile?.avatar
      ? <img src={profile.avatar} alt="" className="absolute inset-0 w-full h-full object-cover" />
      : (profile?.nickname || "?").trim().charAt(0).toUpperCase()}
  </span>
);
