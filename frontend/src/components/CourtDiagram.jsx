import { useId } from "react";

/* Data-driven half-court illustration. Hoop at top. viewBox 0 0 100 94 (1 unit = 0.5 ft).
   ops: ['o',x,y,label] offense | ['x',x,y] defender | ['b',x,y] ball
        ['cut'|'pass'|'drib',x1,y1,x2,y2,cx?,cy?] arrows | ['screen',x1,y1,x2,y2]
        ['shot',x,y] made shot arc | ['miss',x,y] short arc | ['zone',name] | ['ring',x,y,r]
        ['t',x,y,text] | ['foot',x,y,rot,side] | ['area',x,y,w,h] | ['clock',text] | ['whistle'] */
const PINK = "#FF3EA5";
const WHITE = "#F5F6F8";
const BALL = "#FF9A3C";
const HOOP = [50, 10.5];
const Z = "rgba(255,62,165,.22)";
const ZS = "rgba(255,62,165,.7)";

const threePath = "M6 0 V28 A47.5 47.5 0 0 0 94 28 V0";

function zone(name, k) {
  const common = { fill: Z, stroke: ZS, strokeWidth: 0.8, key: k };
  switch (name) {
    case "paint":
      return <rect x="34" y="0" width="32" height="38" {...common} />;
    case "three":
      return <path d={`M0 0 H6 ${threePath.slice(4)} H100 V94 H0 Z`} fillRule="evenodd" {...common} />;
    case "mid":
      return <path d={`${threePath} Z M34 0 V38 H66 V0 Z`} fillRule="evenodd" {...common} />;
    case "inside":
      return <path d={`${threePath} Z`} {...common} />;
    case "corner":
      return (
        <g key={k}>
          <rect x="0" y="0" width="6" height="28" {...common} key="a" />
          <rect x="94" y="0" width="6" height="28" {...common} key="b" />
        </g>
      );
    case "rim":
      return <path d="M42 4 V10.5 A8 8 0 0 0 58 10.5 V4 Z" {...common} />;
    case "elbow":
      return (
        <g key={k}>
          <circle cx="34" cy="38" r="5" {...common} key="a" />
          <circle cx="66" cy="38" r="5" {...common} key="b" />
        </g>
      );
    case "block":
      return (
        <g key={k}>
          <rect x="30" y="13" width="4" height="4" {...common} key="a" />
          <rect x="66" y="13" width="4" height="4" {...common} key="b" />
        </g>
      );
    case "ftline":
      return <rect x="34" y="36.8" width="32" height="2.4" {...common} />;
    case "highpost":
      return <circle cx="50" cy="38" r="7" {...common} />;
    case "lowpost":
      return <rect x="26" y="8" width="12" height="16" rx="2" {...common} />;
    case "baseline":
      return <rect x="0" y="0" width="100" height="2.4" {...common} />;
    case "sideline":
      return <rect x="97.6" y="0" width="2.4" height="94" {...common} />;
    case "halfcourt":
      return <rect x="0" y="91.6" width="100" height="2.4" {...common} />;
    case "wing":
      return (
        <g key={k}>
          <circle cx="14" cy="46" r="8" {...common} key="a" />
          <circle cx="86" cy="46" r="8" {...common} key="b" />
        </g>
      );
    case "top":
      return <circle cx="50" cy="64" r="8" {...common} />;
    case "strong":
      return <rect x="50" y="0" width="50" height="94" {...common} />;
    case "weak":
      return <rect x="0" y="0" width="50" height="94" {...common} />;
    case "backcourt":
      return <rect x="0" y="86" width="100" height="8" {...common} />;
    default:
      return null;
  }
}

function head(x1, y1, x2, y2, color, k) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const L = 3.4, W = 2.1;
  const p1 = [x2 - L * Math.cos(a) + W * Math.sin(a), y2 - L * Math.sin(a) - W * Math.cos(a)];
  const p2 = [x2 - L * Math.cos(a) - W * Math.sin(a), y2 - L * Math.sin(a) + W * Math.cos(a)];
  return <polygon key={k} points={`${x2},${y2} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`} fill={color} />;
}

function zigzag(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const n = Math.max(3, Math.floor(len / 3.2));
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  let d = `M${x1} ${y1}`;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const s = i % 2 ? 1.6 : -1.6;
    d += ` L${x1 + dx * t + px * s} ${y1 + dy * t + py * s}`;
  }
  d += ` L${x2 - ux * 2} ${y2 - uy * 2}`;
  return d;
}

function renderOp(op, i) {
  const [t, ...a] = op;
  switch (t) {
    case "zone":
      return zone(a[0], i);
    case "area":
      return <rect key={i} x={a[0]} y={a[1]} width={a[2]} height={a[3]} rx="2" fill={Z} stroke={ZS} strokeWidth="0.8" />;
    case "ring":
      return <circle key={i} cx={a[0]} cy={a[1]} r={a[2] || 6} fill="none" stroke={PINK} strokeWidth="1.1" strokeDasharray="2 1.6" />;
    case "o":
      return (
        <g key={i}>
          <circle cx={a[0]} cy={a[1]} r="4" fill={PINK} />
          {a[2] && (
            <text x={a[0]} y={a[1] + 1.55} textAnchor="middle" fontSize="4.3" fontWeight="800" fill="#0A0A0D" fontFamily="Manrope">
              {a[2]}
            </text>
          )}
        </g>
      );
    case "x":
      return (
        <g key={i} stroke={WHITE} strokeWidth="1.5" strokeLinecap="round">
          <line x1={a[0] - 2.7} y1={a[1] - 2.7} x2={a[0] + 2.7} y2={a[1] + 2.7} />
          <line x1={a[0] + 2.7} y1={a[1] - 2.7} x2={a[0] - 2.7} y2={a[1] + 2.7} />
        </g>
      );
    case "b":
      return (
        <g key={i}>
          <circle cx={a[0]} cy={a[1]} r="2.3" fill={BALL} />
          <path d={`M${a[0] - 2.3} ${a[1]} H${a[0] + 2.3} M${a[0]} ${a[1] - 2.3} V${a[1] + 2.3}`} stroke="#0A0A0D" strokeWidth=".45" />
        </g>
      );
    case "cut":
    case "pass":
    case "drib": {
      const [x1, y1, x2, y2, cx, cy] = a;
      const color = t === "pass" ? BALL : WHITE;
      const d = t === "drib" ? zigzag(x1, y1, x2, y2) : cx != null ? `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}` : `M${x1} ${y1} L${x2} ${y2}`;
      const fx = cx != null ? cx : x1, fy = cy != null ? cy : y1;
      return (
        <g key={i}>
          <path d={d} fill="none" stroke={color} strokeWidth="1.25" strokeDasharray={t === "pass" ? "2.4 1.8" : undefined} strokeLinecap="round" strokeLinejoin="round" opacity=".95" />
          {head(fx, fy, x2, y2, color)}
        </g>
      );
    }
    case "screen": {
      const [x1, y1, x2, y2] = a;
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const px = -Math.sin(ang) * 3.4, py = Math.cos(ang) * 3.4;
      return (
        <g key={i} stroke={WHITE} strokeWidth="1.35" strokeLinecap="round">
          <line x1={x1} y1={y1} x2={x2} y2={y2} />
          <line x1={x2 - px} y1={y2 - py} x2={x2 + px} y2={y2 + py} strokeWidth="2" />
        </g>
      );
    }
    case "shot":
    case "miss": {
      const [x, y] = a;
      const tx = t === "shot" ? HOOP[0] : HOOP[0] + (x - HOOP[0]) * 0.22;
      const ty = t === "shot" ? HOOP[1] : HOOP[1] + (y - HOOP[1]) * 0.22 + 2;
      const cx = (x + tx) / 2 + (y - ty) * 0.35, cy = (y + ty) / 2 - Math.abs(x - tx) * 0.25 - 4;
      return (
        <g key={i}>
          <path d={`M${x} ${y} Q${cx} ${cy} ${tx} ${ty}`} fill="none" stroke={BALL} strokeWidth="1.2" strokeDasharray="0.1 2.4" strokeLinecap="round" />
          <circle cx={tx} cy={ty} r="2.1" fill={BALL} opacity={t === "miss" ? 0.9 : 0} />
          {t === "miss" && <path d={`M${tx - 1.5} ${ty + 3.5} l3 3 m0 -3 l-3 3`} stroke="#FF5A5A" strokeWidth="0.9" />}
        </g>
      );
    }
    case "t":
      return (
        <text key={i} x={a[0]} y={a[1]} textAnchor="middle" fontSize={a[3] || 4.2} fontWeight="800" fill={a[4] || "#E6E8EF"} fontFamily="Manrope" letterSpacing=".2">
          {a[2]}
        </text>
      );
    case "foot": {
      const [x, y, rot = 0, side = "l"] = a;
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <ellipse cx="0" cy="0" rx="1.9" ry="3.3" fill={side === "r" ? PINK : WHITE} opacity=".9" />
          <circle cx="0" cy="-4.4" r="0.9" fill={side === "r" ? PINK : WHITE} opacity=".9" />
        </g>
      );
    }
    case "clock":
      return (
        <g key={i}>
          <rect x="72" y="76" width="24" height="13" rx="2.5" fill="#0A0A0D" stroke={PINK} strokeWidth=".8" />
          <text x="84" y="85.6" textAnchor="middle" fontSize="7.2" fontWeight="900" fill={PINK} fontFamily="Doto, monospace">
            {a[0]}
          </text>
        </g>
      );
    case "whistle":
      return (
        <g key={i} transform="translate(8 80)">
          <rect width="18" height="10" rx="5" fill="#0A0A0D" stroke={WHITE} strokeWidth=".8" />
          <text x="9" y="6.8" textAnchor="middle" fontSize="5" fontWeight="900" fill={WHITE} fontFamily="Manrope">
            {a[0] || "FOUL"}
          </text>
        </g>
      );
    default:
      return null;
  }
}

export default function CourtDiagram({ ops = [], className = "", minimal = false }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 94" className={className} role="img" aria-label="court diagram" data-testid="court-diagram">
      <defs>
        <linearGradient id={`fl${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#16171f" />
          <stop offset="1" stopColor="#101117" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="94" fill={`url(#fl${id})`} />
      <g fill="none" stroke="#3a3d52" strokeWidth="0.7">
        <rect x="0.35" y="0.35" width="99.3" height="93.3" />
        <rect x="34" y="0" width="32" height="38" />
        <rect x="38" y="0" width="24" height="38" opacity=".5" />
        <path d="M38 38 A12 12 0 0 0 62 38" />
        <path d="M38 38 A12 12 0 0 1 62 38" strokeDasharray="2 2" />
        <path d={threePath} />
        <path d="M42 4 V10.5 A8 8 0 0 0 58 10.5 V4" opacity=".7" />
        <path d="M38 94 A12 12 0 0 1 62 94" />
        {!minimal && <path d="M30 14h-2M30 20h-2M70 14h2M70 20h2M30 26h-2M70 26h2" opacity=".8" />}
      </g>
      <line x1="44" y1="4" x2="56" y2="4" stroke="#E6E8EF" strokeWidth="1.1" />
      <circle cx={HOOP[0]} cy={HOOP[1]} r="1.9" fill="none" stroke={PINK} strokeWidth="1" />
      {ops.map(renderOp)}
    </svg>
  );
}
