import { useEffect, useRef } from "react";

// Lightweight canvas starfield. Single instance, imperative draw loop.
export function StarfieldCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    let stars = [];
    let shooting = null;
    let mouseX = 0, mouseY = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 700 ? 110 : 220;
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.2,
        a: Math.random() * 0.6 + 0.2,
        tw: Math.random() * 0.02 + 0.004,
        dir: Math.random() > 0.5 ? 1 : -1,
        purple: Math.random() > 0.86,
        depth: Math.random() * 0.6 + 0.2,
      }));
    }

    function maybeShoot() {
      if (reduced || shooting || Math.random() > 0.006) return;
      shooting = { x: Math.random() * w * 0.6, y: Math.random() * h * 0.3, len: 0, life: 0 };
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      // vignette
      const grad = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, Math.max(w, h) * 0.8);
      grad.addColorStop(0, "rgba(147,40,255,0.05)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const offX = (mouseX - w / 2) * 0.006;
      const offY = (mouseY - h / 2) * 0.006;
      for (const s of stars) {
        if (!reduced) {
          s.a += s.tw * s.dir;
          if (s.a > 0.85) s.dir = -1;
          if (s.a < 0.15) s.dir = 1;
        }
        const px = s.x + offX * s.depth * 12;
        const py = s.y + offY * s.depth * 12;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.purple
          ? `rgba(180,120,255,${s.a})`
          : `rgba(255,255,255,${s.a})`;
        ctx.fill();
      }

      maybeShoot();
      if (shooting) {
        shooting.life += 1;
        shooting.len = Math.min(shooting.len + 14, 160);
        const sx = shooting.x + shooting.life * 6;
        const sy = shooting.y + shooting.life * 3;
        const g2 = ctx.createLinearGradient(sx - shooting.len, sy - shooting.len * 0.5, sx, sy);
        g2.addColorStop(0, "rgba(255,255,255,0)");
        g2.addColorStop(1, "rgba(255,255,255,0.7)");
        ctx.strokeStyle = g2;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(sx - shooting.len, sy - shooting.len * 0.5);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        if (shooting.life > 40 || sx > w || sy > h) shooting = null;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    function onMove(e) { mouseX = e.clientX; mouseY = e.clientY; }
    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(rafRef.current);
      else rafRef.current = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 h-full w-full"
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}
