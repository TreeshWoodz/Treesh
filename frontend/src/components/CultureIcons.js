const Svg = ({ size = 24, strokeWidth = 2, color = "currentColor", children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
);

export const AfroPick = (p) => (
  <Svg {...p}>
    <path d="M6 2v8M9 2v8M12 2v8M15 2v8M18 2v8" />
    <rect x="5" y="10" width="14" height="2.5" rx="1" />
    <rect x="8" y="12.5" width="8" height="8.5" rx="2.5" />
    <path d="M10.7 12.5v3M13.3 12.5v3M8 17.2h3" />
  </Svg>
);

export const Djembe = (p) => (
  <Svg {...p}>
    <ellipse cx="12" cy="4.5" rx="7" ry="2" />
    <path d="M5 4.5c0 4 4 5.5 4 8.5s-1 5-1 7.5h8c0-2.5-1-4.5-1-7.5s4-4.5 4-8.5" />
    <path d="M7 7l2 4M11 7.5l-1.5 3.5M13 7.5l1.5 3.5M17 7l-2 4" />
  </Svg>
);

export const Sneaker = (p) => (
  <Svg {...p}>
    <path d="M2 15V9.5C2 8.7 2.7 8 3.5 8H6l2 2.5 3-4h2c.5 2.5 3 4 6 4.5 1.7.3 3 1.6 3 3.3V15z" />
    <path d="M2 15v2.5c0 .8.7 1.5 1.5 1.5h17c.8 0 1.5-.7 1.5-1.5V15" />
    <path d="M10 9.5l1.5 1.5M12.3 8.4l1.5 1.5M14.6 9.6l1.3 1.3" />
  </Svg>
);

export const StarliteIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="slg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFF4B0" />
        <stop offset="0.5" stopColor="#FFC800" />
        <stop offset="1" stopColor="#C87D32" />
      </linearGradient>
    </defs>
    <path d="M12 1.5c.6 5.4 2.6 8.4 9.5 10.5-6.9 2.1-8.9 5.1-9.5 10.5-.6-5.4-2.6-8.4-9.5-10.5C9.4 9.9 11.4 6.9 12 1.5z" fill="url(#slg)" />
    <circle cx="19" cy="4.5" r="1.4" fill="#FFE27A" />
  </svg>
);
