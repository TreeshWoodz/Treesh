import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

/* Lightweight canvas particle bursts. Styles map to shop "Effects". */
export const Bursts = forwardRef(function Bursts({ enabled = true }, ref) {
  const cv = useRef(null);
  const parts = useRef([]);
  const raf = useRef(0);

  const loop = useCallback(() => {
    const c = cv.current; if (!c) return;
    const g = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    const P = parts.current;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.life -= 1; p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.vx *= 0.985; p.rot += p.vr;
      const a = Math.max(0, p.life / p.max);
      g.globalAlpha = a; g.fillStyle = p.color; g.strokeStyle = p.color;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
      const s = p.size;
      if (p.shape === "rect") g.fillRect(-s / 2, -s / 4, s, s / 2);
      else if (p.shape === "square") g.fillRect(-s / 2, -s / 2, s, s);
      else if (p.shape === "heart") { g.beginPath(); g.moveTo(0, s * 0.3); g.bezierCurveTo(-s, -s * 0.4, -s * 0.4, -s, 0, -s * 0.35); g.bezierCurveTo(s * 0.4, -s, s, -s * 0.4, 0, s * 0.3); g.fill(); }
      else if (p.shape === "star") { g.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? s * 0.35 : s; const an = (k * Math.PI) / 4; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.closePath(); g.fill(); }
      else if (p.shape === "bolt") { g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(s * 0.5, s * 0.8); g.lineTo(-s * 0.2, s * 1.2); g.lineTo(s * 0.4, s * 2.2); g.stroke(); }
      else { g.lineWidth = 2.2; g.lineCap = "round"; g.beginPath(); g.moveTo(0, 0); g.lineTo(-p.vx * 3, -p.vy * 3); g.stroke(); }
      g.restore();
      if (p.life <= 0) P.splice(i, 1);
    }
    g.globalAlpha = 1;
    if (P.length) raf.current = requestAnimationFrame(loop); else raf.current = 0;
  }, []);

  useEffect(() => {
    const resize = () => {
      const c = cv.current; if (!c) return;
      const dpr = window.devicePixelRatio || 1;
      c.width = window.innerWidth * dpr; c.height = window.innerHeight * dpr;
      c.style.width = window.innerWidth + "px"; c.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf.current); };
  }, []);

  useImperativeHandle(ref, () => ({
    burst(x, y, { effect = "fx_sparks", colors, count = 26, power = 1 } = {}) {
      if (!enabled) return;
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#9328ff";
      const cols = colors && colors.length ? colors : [accent, "#ffffff", accent];
      const shape = { fx_sparks: "line", fx_confetti: "rect", fx_hearts: "heart", fx_pixels: "square", fx_stars: "star", fx_lightning: "bolt" }[effect] || "line";
      for (let i = 0; i < count; i++) {
        const an = Math.random() * Math.PI * 2;
        const sp = (2 + Math.random() * 5.5) * power;
        parts.current.push({
          x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - (shape === "rect" ? 2 : 0), grav: shape === "line" || shape === "bolt" ? 0.05 : 0.14,
          size: shape === "line" ? 2 : shape === "heart" ? 7 + Math.random() * 5 : shape === "star" ? 5 + Math.random() * 5 : 6 + Math.random() * 5,
          color: cols[i % cols.length], life: 40 + Math.random() * 30, max: 70, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, shape,
        });
      }
      if (!raf.current) raf.current = requestAnimationFrame(loop);
    },
  }), [enabled, loop]);

  return <canvas ref={cv} className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true" />;
});
