// Extract a small vibrant palette from an image URL using a canvas.
// Returns Promise<Array<{r,g,b}>> (2-3 colors) or null on failure.
const cache = new Map();

export function extractPalette(url) {
  if (!url) return Promise.resolve(null);
  if (cache.has(url)) return Promise.resolve(cache.get(url));
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let done = false;
    const finish = (val) => { if (!done) { done = true; cache.set(url, val); resolve(val); } };
    const timer = setTimeout(() => finish(null), 6000);
    img.onload = () => {
      clearTimeout(timer);
      try {
        const size = 40;
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        const buckets = {};
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 125) continue;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          // skip near-white and near-black to favor vibrant tones
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const light = (max + min) / 2;
          const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255) + 1e-6);
          const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
          if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, n: 0, satSum: 0, lightSum: 0 };
          const bk = buckets[key];
          bk.r += r; bk.g += g; bk.b += b; bk.n += 1; bk.satSum += sat; bk.lightSum += light;
        }
        const arr = Object.values(buckets).map((bk) => ({
          r: Math.round(bk.r / bk.n),
          g: Math.round(bk.g / bk.n),
          b: Math.round(bk.b / bk.n),
          n: bk.n,
          sat: bk.satSum / bk.n,
          light: bk.lightSum / bk.n,
        }));
        if (!arr.length) return finish(null);
        // score: prefer frequent + saturated + mid-light colors
        arr.forEach((c) => {
          const lightPenalty = c.light > 230 || c.light < 22 ? 0.25 : 1;
          c.score = c.n * (0.35 + c.sat) * lightPenalty;
        });
        arr.sort((a, b) => b.score - a.score);
        // pick top distinct colors
        const picked = [];
        for (const c of arr) {
          if (picked.every((p) => Math.abs(p.r - c.r) + Math.abs(p.g - c.g) + Math.abs(p.b - c.b) > 60)) {
            picked.push(c);
          }
          if (picked.length >= 3) break;
        }
        while (picked.length < 2 && arr.length) picked.push(arr[picked.length] || arr[0]);
        finish(picked.map((c) => ({ r: c.r, g: c.g, b: c.b })));
      } catch (e) {
        finish(null);
      }
    };
    img.onerror = () => { clearTimeout(timer); finish(null); };
    img.src = url;
  });
}

export function rgbStr(c, a = 1) {
  if (!c) return `rgba(147,40,255,${a})`;
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
}
