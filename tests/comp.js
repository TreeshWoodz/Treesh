/* ---------- model blocks, filters & comp cards ---------- */
function findDivBlocks(text, cls, idAttr){
  const cr = commentRanges(text), out = [], re = /<div\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi, cre = new RegExp(`(^|\\s)${cls}(\\s|$)`, 'i'); let m;
  while ((m = re.exec(text))){
    if (inRanges(cr, m.index)) continue;
    const cm = m[0].match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (!cm || !cre.test(cm[1] ?? cm[2])) continue;
    const tok = /<div\b|<\/div\s*>/gi; tok.lastIndex = re.lastIndex; let depth = 1, t;
    while (depth && (t = tok.exec(text))) depth += t[0][1] === '/' ? -1 : 1;
    if (depth) break;
    const id = (m[0].match(new RegExp(`${idAttr}\\s*=\\s*"([^"]*)"`, 'i')) || [])[1];
    if (id) out.push({ id: id.trim(), raw: text.slice(m.index, tok.lastIndex), start: m.index });
    re.lastIndex = tok.lastIndex;
  }
  return out;
}
const findModelBlocks = t => [...findDivBlocks(t, 'model', 'data-model-id'), ...findArticleBlocks(t, 'model', 'data-model-id')];
const HEIGHTS = Array.from({ length: 23 }, (_, i) => 58 + i);
function initModelFilters(){
  const hOpts = HEIGHTS.map(n => `<option value="${inToCm(n)}">${Math.floor(n / 12)}'${n % 12}" · ${Math.round(inToCm(n))} cm</option>`).join('');
  $('#mf-min').innerHTML = `<option value="">Min height</option>${hOpts}`; $('#mf-max').innerHTML = `<option value="">Max height</option>${hOpts}`;
  const f = (k) => MODEL_SECTIONS.flatMap(s => s[2]).find(x => x[0] === k)[3].opts;
  $('#mf-board').innerHTML = '<option value="">All boards</option>' + f('board').map(([v]) => `<option>${esc(v)}</option>`).join('');
  $('#mf-avail').innerHTML = '<option value="">Any availability</option>' + f('availability').map(([v]) => `<option>${esc(v)}</option>`).join('');
  $('#mf-cat').innerHTML = '<option value="">Any category</option>' + f('categories').map(v => `<option>${esc(v)}</option>`).join('');
}
function modelFilter(){
  const sel = $('#mf-city'), cities = [...new Set(state.models.map(m => m.location).filter(Boolean))].sort(), cv = sel.value;
  sel.innerHTML = '<option value="">All cities</option>' + cities.map(c => `<option>${esc(c)}</option>`).join(''); sel.value = cities.includes(cv) ? cv : '';
  const min = parseFloat($('#mf-min').value), max = parseFloat($('#mf-max').value), b = $('#mf-board').value, c = sel.value, a = $('#mf-avail').value, cat = $('#mf-cat').value;
  const active = [min, max].some(x => !isNaN(x)) || b || c || a || cat;
  $('#mf-clear').hidden = !active;
  return m => { const h = m.meas.height;
    if (!isNaN(min) && !(h != null && h >= min - 0.5)) return false;
    if (!isNaN(max) && !(h != null && h <= max + 0.5)) return false;
    return (!b || m.board === b) && (!c || m.location === c) && (!a || (m.availability || 'Available') === a) && (!cat || splitNames(m.categories).includes(cat)); };
}
const compDir = () => cfg.compDir.replace(/^\/+|\/+$/g, '');
const compUrl = m => `${SITE_URL}/${compDir()}/${slug(m.name)}`;
function buildCompPage(m){
  const M = m.meas, h = M.height != null ? ftIn(M.height) : '', inch = k => M[k] != null ? `${Math.round(cmToIn(M[k]))}"` : '', both = k => M[k] != null ? `${cmToIn(M[k])}" / ${M[k]} cm` : '';
  const stat = (l, v) => v ? `<div><small>${l}</small><b>${escText(v)}</b></div>` : '', line = (l, v) => v ? `<p><span>${l}</span>${escText(v)}</p>` : '';
  const extra = m.photos.map(p => p.url).filter(u => u && u !== m.headshot).slice(0, 4), url = compUrl(m), sub = [m.board, m.location].filter(Boolean).join(' · ');
  const bg = u => `background-image:url('${esc(u).replace(/'/g, '%27')}')`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escText(m.name)} · Comp Card · Treesh M.A.D.</title>
<meta property="og:title" content="${esc(m.name)} · Comp Card">
<meta property="og:description" content="${esc([h, measLine(M), m.location].filter(Boolean).join(' · '))}">
<meta property="og:image" content="${esc(m.headshot)}">
<meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="https://ik.imagekit.io/treesh/IMG_5825.png">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&family=Special+Gothic+Expanded+One&display=swap" rel="stylesheet">
<style>
@page{size:5.5in 8.5in;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;padding:28px;display:flex;flex-wrap:wrap;justify-content:center;gap:28px;background:#0a0a0b;color:#111;font-family:Manrope,sans-serif}
.side{position:relative;display:flex;flex-direction:column;width:5.5in;height:8.5in;overflow:hidden;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.hs{flex:1;background:#e5e5e5 center top/cover no-repeat}
.band{padding:18px 22px 22px}
.nm{font-family:'Special Gothic Expanded One',sans-serif;font-size:30px;line-height:1;letter-spacing:.03em;text-transform:uppercase}
.sub{margin-top:7px;font-size:10px;font-weight:800;letter-spacing:.24em;text-transform:uppercase;color:#9328ff}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px 12px;margin-top:14px}
.stats small,.info span{display:block;font-size:7.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#8a8a8a}
.stats b{font-size:13px}
.grid{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:6px;height:60%;padding:6px}
.grid div{background:#e5e5e5 center top/cover no-repeat}
.grid.one{grid-template-columns:1fr}
.info{display:grid;grid-template-columns:1.1fr 1fr;gap:16px;padding:14px 22px;font-size:11px}
.info h4{margin:0 0 8px;font-size:8px;letter-spacing:.22em;text-transform:uppercase;color:#9328ff}
.info p{margin:0 0 6px;font-weight:700;word-break:break-word}
.ft{position:absolute;left:22px;right:22px;bottom:12px;display:flex;justify-content:space-between;gap:10px;font-size:7.5px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#aaa}
@media print{body{display:block;padding:0;background:none}.side{box-shadow:none;break-after:page;page-break-after:always}}
@media (max-width:640px){body{padding:14px;gap:14px}.side{width:100%;height:auto;aspect-ratio:5.5/8.5}.nm{font-size:24px}}
</style>
</head>
<body>
<section class="side">
<div class="hs" style="${bg(m.headshot)}"></div>
<div class="band">
<div class="nm">${escText(m.name)}</div>
${sub ? `<div class="sub">${escText(sub)}</div>` : ''}
<div class="stats">${stat('Height', h)}${stat('Bust', inch('bust'))}${stat('Waist', inch('waist'))}${stat('Hips', inch('hips'))}${stat('Shoe', m.shoe)}${stat('Dress', m.dress)}${stat('Hair', m['hair-color'])}${stat('Eyes', m['eye-color'])}</div>
</div>
</section>
<section class="side">
<div class="grid ${extra.length < 2 ? 'one' : ''}">${(extra.length ? extra : [m.headshot]).map(u => `<div style="${bg(u)}"></div>`).join('')}</div>
<div class="info">
<div><h4>Measurements</h4>${line('Height', h && `${h} / ${M.height} cm`)}${line('Bust / chest', both('bust'))}${line('Waist', both('waist'))}${line('Hips', both('hips'))}${line('Inseam', both('inseam'))}${line('Shoe', m.shoe)}${line('Dress / suit', [m.dress, m.suit].filter(Boolean).join(' / '))}</div>
<div><h4>Booking</h4>${line('Agency', m.agency)}${line('Email', m.email)}${line('Instagram', m.instagram)}${line('Portfolio', m.portfolio)}${line('Based in', m.location)}${line('Availability', m.availability)}</div>
</div>
<div class="ft"><span>Treesh M.A.D.</span><span>${escText(url.replace(/^https?:\/\//, ''))}</span></div>
</section>
</body>
</html>
`;
}
function openComp(m){
  const wrap = document.createElement('div'), html = buildCompPage(m), url = compUrl(m);
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal comp-modal" data-testid="comp-card-modal"><div class="comp-head"><div><h2>${esc(m.name)}</h2><p class="hint">Comp card · prints on 5.5 × 8.5 in, front and back</p></div><button class="icon-btn" data-c="close" title="Close" data-testid="comp-close-btn">${icon('x')}</button></div>
    <iframe class="comp-frame" title="Comp card preview" data-testid="comp-card-frame"></iframe>
    <p class="hint" data-testid="comp-share-url">Share link after publishing: <b>${esc(url)}</b></p>
    <div class="m-acts"><button class="btn" data-c="code" data-testid="comp-copy-code-btn">${icon('code-xml')}Copy code</button><button class="btn" data-c="link" data-testid="comp-copy-link-btn">${icon('link')}Copy link</button><button class="btn" data-c="publish" data-testid="comp-publish-btn">${icon('globe')}<span>${cfg.mode === 'live' ? 'Publish share page' : 'Open PR for page'}</span></button><button class="btn btn-primary" data-c="print" data-testid="comp-print-btn">${icon('printer')}Print / Save PDF</button></div></div>`;
  const fr = $('.comp-frame', wrap); fr.srcdoc = html;
  const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape' && $('.modal-wrap:last-child') === wrap) close(); };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('click', async e => {
    if (e.target === wrap) return close();
    const b = e.target.closest('[data-c]'); if (!b || b.disabled) return;
    const c = b.dataset.c;
    if (c === 'close') close();
    if (c === 'print'){ try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch { toast('Couldn’t open the print dialog. Copy the code and print it instead.', 'bad'); } }
    if (c === 'code') copyText(html, 'Comp card code copied.');
    if (c === 'link') copyText(url, 'Share link copied. Publish the page so it opens.');
    if (c === 'publish'){
      if (!requireGitHub() || state.busy) return;
      state.busy = true; b.disabled = true; const sp = $('span', b), orig = sp.textContent;
      try { const r = await commitFile({ path: `${compDir()}/${slug(m.name)}.html`, create: true, apply: () => html, message: `Publish comp card: ${m.name}`, branchKey: `comp-${slug(m.name).slice(0, 40)}`, body: `Publishes the comp card for **${m.name}** (#${m.id}) at ${url}.\n\n<img src="${m.headshot}" width="160">\n\n_Submitted with Treesh M.A.D._` }, s => { sp.textContent = s; }); done(r, 'comp', `${m.name} comp card`, { href: url }); }
      catch (err){ failModal(err); }
      finally { state.busy = false; b.disabled = false; sp.textContent = orig; }
    }
  });
  $('#modal-root').appendChild(wrap); icons();
}

