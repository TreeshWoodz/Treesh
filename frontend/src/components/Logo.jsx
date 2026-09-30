export const HoopMark = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <rect x="9" y="3" width="30" height="3.2" rx="1.6" fill="#F5F6F8" opacity=".28" />
    <path d="M24 6v5" stroke="#F5F6F8" strokeOpacity=".28" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M12.5 18.5 L16.5 38 H31.5 L35.5 18.5" stroke="#F5F6F8" strokeWidth="2.2" strokeLinejoin="round" opacity=".92" />
    <path d="M15 21l14.5 16.5M33 21L18.5 37.5M19.4 22.5l9.2 10.6M28.6 22.5l-9.2 10.6" stroke="#F5F6F8" strokeWidth="1.5" opacity=".45" />
    <path d="M14.4 28h19.2" stroke="#F5F6F8" strokeWidth="1.4" opacity=".35" />
    <ellipse cx="24" cy="17.5" rx="13" ry="4" stroke="#FF3EA5" strokeWidth="3.4" />
  </svg>
);

export const HoopLogo = ({ compact = false }) => (
  <div className="flex items-center gap-2.5 select-none" data-testid="hoop-logo">
    <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[#25273a] bg-[#121319]">
      <HoopMark size={30} />
    </span>
    {!compact && (
      <span className="leading-none">
        <span className="font-display block text-[19px] tracking-tight text-[#F5F6F8]">hoop</span>
        <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#8B90A6]">by Treesh</span>
      </span>
    )}
  </div>
);
