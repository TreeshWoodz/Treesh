// Light-theme contrast scanner. scanLight(rootSel) -> {issues:[...], dark:[...]}
// Text: composite the element's colour over the stacked backgrounds of its ancestors (colours + gradient averages, opacity) and measure WCAG contrast.
// Dark surfaces: big boxes whose own background ends up dark while the light theme is on.
window.scanLight = function(rootSel){
  const P = c => { const m = c && /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const G = img => { if (!img || img === 'none' || /url\(/.test(img)) return null; const cs = [...img.matchAll(/rgba?\([^)]+\)/g)].map(m => P(m[0])).filter(Boolean); if (!cs.length) return null; const n = cs.length, s = k => cs.reduce((t, c) => t + c[k], 0) / n; return { r: s('r'), g: s('g'), b: s('b'), a: s('a') }; };
  const over = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
  const L = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const R = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const PAGE = { r: 254, g: 254, b: 254, a: 1 };
  const path = el => { const out = []; let e = el; for (let i = 0; e && e.nodeType === 1 && i < 4; i++, e = e.parentElement){ let s = e.tagName.toLowerCase(); if (e.id) s += '#' + e.id; else if (e.classList.length) s += '.' + [...e.classList].filter(c => !/^(press|min-w-0|flex|flex-1|items-center|gap-\d|truncate)$/.test(c)).slice(0, 3).join('.'); const t = e.getAttribute && e.getAttribute('data-testid'); if (t) s += `[${t}]`; out.unshift(s); if (e.id) break; } return out.join(' > '); };
  const imgBehind = el => { for (let e = el; e && e.nodeType === 1; e = e.parentElement){ const cs = getComputedStyle(e); if (/url\(/.test(cs.backgroundImage)) return true; const b = P(cs.backgroundColor); if (b && b.a > .95) return false; } return false; };
  function bgOf(el){ const layers = []; let op = 1;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement){ const cs = getComputedStyle(e); op *= parseFloat(cs.opacity); const g = G(cs.backgroundImage), b = P(cs.backgroundColor);
      if (g && g.a > 0) layers.push(g); if (b && b.a > 0) layers.push(b); if ((b && b.a > .97) || (g && g.a > .97)) break; }
    let bg = PAGE; for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg); return { bg, op }; }
  const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement){ const s = getComputedStyle(e); if (s.display === 'none' || parseFloat(s.opacity) < .05) return false; } return true; };
  let root = rootSel ? document.querySelector(rootSel) : null;
  if (!root){ const c = document.elementFromPoint(innerWidth / 2, innerHeight / 2); let top = null; for (let e = c; e && e !== document.body; e = e.parentElement){ if (getComputedStyle(e).position === 'fixed') top = e; } root = top || document.querySelector('#view') || document.body; }
  const issues = [], dark = [], seen = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()){
    const txt = n.nodeValue.replace(/\s+/g, ' ').trim(); if (txt.length < 2) continue; const el = n.parentElement; if (!el || seen.has(el) || /^(SCRIPT|STYLE|NOSCRIPT|TITLE|OPTION)$/.test(el.tagName)) continue; seen.add(el);
    if (!vis(el)) continue; const cs = getComputedStyle(el);
    if (cs.webkitTextFillColor && /rgba?\([^)]*,\s*0\)/.test(cs.webkitTextFillColor)) continue; if (/text/.test(cs.backgroundClip || cs.webkitBackgroundClip || '')) continue;
    const { bg, op } = bgOf(el); const c0 = P(cs.color); if (!c0) continue; const fg = over({ ...c0, a: c0.a * op }, bg); const ratio = R(fg, bg);
    const size = parseFloat(cs.fontSize), big = size >= 18 || (size >= 14 && parseInt(cs.fontWeight) >= 700);
    if (ratio < (big ? 2.6 : 3.2)) issues.push({ ratio: +ratio.toFixed(2), fg: hex(fg), bg: hex(bg), size, txt: txt.slice(0, 50), path: path(el), overImage: imgBehind(el) });
  }
  root.querySelectorAll('input, textarea').forEach(el => { if (!vis(el)) return; const cs = getComputedStyle(el), { bg, op } = bgOf(el), c0 = P(cs.color); if (!c0) return; const fg = over({ ...c0, a: c0.a * op }, bg), ratio = R(fg, bg);
    if (L(bg) < .2) dark.push({ kind: 'dark field', lum: +L(bg).toFixed(3), bg: hex(bg), path: path(el) });
    if (ratio < 3.2) issues.push({ ratio: +ratio.toFixed(2), fg: hex(fg), bg: hex(bg), size: parseFloat(cs.fontSize), txt: '[field] ' + (el.value || el.placeholder || '').slice(0, 40), path: path(el) }); });
  const vw = innerWidth * innerHeight;
  root.querySelectorAll('*').forEach(el => { if (/^(IMG|VIDEO|CANVAS|SVG|PATH|IFRAME)$/i.test(el.tagName)) return; const cs = getComputedStyle(el); const b = P(cs.backgroundColor), g = G(cs.backgroundImage); if (!((b && b.a > .5) || (g && g.a > .5))) return;
    const r = el.getBoundingClientRect(); if (r.width * r.height < vw * .04 || !vis(el)) return; const { bg } = bgOf(el); if (L(bg) < .12 && !imgBehind(el)) dark.push({ kind: 'dark surface', lum: +L(bg).toFixed(3), bg: hex(bg), area: Math.round(100 * r.width * r.height / vw) + '%', path: path(el) }); });
  const rootDesc = path(root);
  return { root: rootDesc, issues: issues.sort((a, b) => a.ratio - b.ratio), dark: dark.filter((d, i, a) => a.findIndex(x => x.path === d.path) === i).slice(0, 12) };
};
