/* ---------- What's New manager (content/whatsnew.json, read by the loader in treesh.app's index.html) ---------- */
const WN_BUILTIN = __WN_SNAPSHOT__;
const WN_PAGES = { library:'Home', artists:'Icons', studios:'Studios', game:'Games & Things', settings:'Settings', player:'Music Player', lyricstudio:'Lyric Studio', instrum:'Instrum Studio', blog:'Blog' };
const WN_ACTIONS = [['wn','What’s Next game'], ['tot','This or That'], ['image','Image Studio'], ['instrum','Instrum Studio'], ['acct','Account / sign up'], ['game:','Game info card'], ['page:','Open a page'], ['url:','Open a link']];
const WN_GAMES = ['bronze-blitz', 'sonoku', 'ebonics', 'whatsnext', 'tot', 'chainz', 'frea', 'hoop', 'nects', 'vocotap', 'dgc'];
const WN_ART = ['bronze-blitz_main', 'sonoku_main', 'ebonics_main', 'whatsnext_main', 'image_main', 'instrum_main', 'tot_main', 'lyric_main', 'music_main', 'vocotap_main', 'bronze_main', 'nects_main', 'chainz_main', 'frea_main', 'hoop_main', 'dgc_main'];
const WN_ACCESS = { code:['Code','file-code-2','index.html is in charge. M.A.D. only shows it.'], managed:['Managed','pencil-line','M.A.D. controls it. Edit freely.'], locked:['Locked','lock','Live as is. Unlock to edit.'], hidden:['Hidden','eye-off','Turned off on treesh.app.'] };
const WN_DRAFT = 'treesh_mad_wn_draft';
const wnCopy = o => JSON.parse(JSON.stringify(o));
const wnBlank = () => ({ version:1, updated:'', settings:{ autoPopups:true }, popups:{}, slides:{ mode:'code', list:[] } });
const wnNorm = d => { const o = { ...wnBlank(), ...(d && typeof d === 'object' ? d : {}) }; o.settings = { autoPopups:true, ...(o.settings || {}) }; if (!o.popups || typeof o.popups !== 'object') o.popups = {}; o.slides = { mode:'code', list:[], ...(o.slides || {}) }; if (!Array.isArray(o.slides.list)) o.slides.list = []; return o; };
const wnClean = d => JSON.stringify(d, (k, v) => k[0] === '_' ? undefined : v, 2) + '\n';
const wnDirty = () => wnClean(state.wn.data) !== state.wn.base;
const wnPage = id => WN_PAGES[id] || id;
const wnToday = () => new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });
const wnIdOf = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const wnWhen = x => x.from || x.until ? `${x.from ? 'from ' + x.from : ''}${x.from && x.until ? ' ' : ''}${x.until ? 'until ' + x.until : ''}` : '';
state.wn = { data: wnBlank(), base: wnClean(wnBlank()), missing:false, loaded:false };
let wnSiteP;
const wnSiteIndex = () => wnSiteP || (wnSiteP = location.hostname.endsWith('treesh.app') ? fetch('/', { cache:'no-store' }).then(r => r.text()).catch(() => null) : Promise.resolve(null));

async function loadWN(){
  let text = '', missing = false;
  try { text = signedIn() ? (await gh.getFile(cfg.wnPath, cfg.branch)).text : await fetchSite(SITE.wn, /^\s*\{/); } catch { missing = true; }
  let d = wnBlank();
  if (text) try { d = wnNorm(JSON.parse(text)); } catch { toast(`${cfg.wnPath} isn’t valid JSON, so M.A.D. started from scratch.`, 'bad', 6000); }
  state.wn = { data: d, base: text ? wnClean(d) : wnClean(wnBlank()), missing, loaded:true };
  const dr = safeJSON(localStorage.getItem(WN_DRAFT));
  if (dr && dr.data){ state.wn.data = wnNorm(dr.data); state.wn.restored = true; state.wn.stale = dr.base !== state.wn.base; }
  renderWN();
}
function wnChanged(){ try { if (wnDirty()) localStorage.setItem(WN_DRAFT, JSON.stringify({ base: state.wn.base, data: state.wn.data, t: Date.now() })); else localStorage.removeItem(WN_DRAFT); } catch {} renderWN(); }
function wnChangeCount(){
  const a = wnNorm(safeJSON(state.wn.base)), b = state.wn.data, same = (x, y) => JSON.stringify(x || null, (k, v) => k[0] === '_' ? undefined : v) === JSON.stringify(y || null, (k, v) => k[0] === '_' ? undefined : v);
  let n = [...new Set([...Object.keys(a.popups), ...Object.keys(b.popups)])].filter(k => !same(a.popups[k], b.popups[k]) || b.popups[k]?._bump).length;
  if (!same(a.slides, b.slides)) n++; if (!same(a.settings, b.settings)) n++;
  return n;
}
function wnRows(){
  const d = state.wn.data;
  return [...new Set([...Object.keys(WN_BUILTIN.popups), ...Object.keys(d.popups)])].map(id => {
    const b = WN_BUILTIN.popups[id], p = d.popups[id], own = p && p.mode !== 'code';
    return { id, b, p, src: own ? p : b, custom: !b, access: !own ? 'code' : p.enabled === false ? 'hidden' : p.mode === 'locked' ? 'locked' : 'managed' };
  }).filter(r => r.src);
}
function wnSetAccess(id, to){
  const d = state.wn.data, b = WN_BUILTIN.popups[id], cur = d.popups[id];
  if (to === 'code'){ if (!b) return toast('This popup only exists in M.A.D. Delete it instead.', 'bad'); delete d.popups[id]; }
  else { const p = cur && cur.mode !== 'code' ? cur : { ...wnCopy(b), mode:'managed', enabled:true }; p.mode = to === 'locked' ? 'locked' : 'managed'; p.enabled = to !== 'hidden'; d.popups[id] = p; }
  wnChanged();
}
function wnSetSlideAccess(to){
  const S = state.wn.data.slides;
  if (to !== 'code' && !S.list.length) S.list = WN_BUILTIN.slides.map(s => ({ ...wnCopy(s), enabled:true }));
  S.mode = to; wnChanged();
}
const wnLint = (texts) => {
  const out = [], all = texts.join(' ');
  if (/[\u2013\u2014]/.test(all)) out.push(['dash', 'Treesh copy rule: no em or en dashes. Use a comma or a period.']);
  texts.forEach((t, i) => { if (i % 2 === 0 && t && t.length > 48) out.push(['', `“${t.slice(0, 30)}…” is long for a title (${t.length}/48).`]); if (i % 2 === 1 && t && t.length > 170) out.push(['', `A description is ${t.length} characters. Keep it under 170 so it fits on phones.`]); });
  return out;
};
const wnFixDashes = s => String(s || '').replace(/\s*[\u2013\u2014]\s*/g, ', ');

function wnAccessPill(a){ const [l, ic] = WN_ACCESS[a]; return `<span class="wn-acc ${a}">${icon(ic)}${l}</span>`; }
function wnPopupCard(r, i){
  const s = r.src, locked = r.access === 'locked', code = r.access === 'code', items = s.items || [];
  return `<article class="wn-card${r.access === 'hidden' ? ' off' : ''}" style="animation-delay:${Math.min(i, 10) * 35}ms" data-testid="wn-popup-card-${esc(r.id)}">
    <div class="wn-card-top"><span class="wn-ic">${icon((items[0] && items[0].icon) || 'sparkles')}</span><div class="t"><b data-testid="wn-popup-title-${esc(r.id)}">${esc(s.title || r.id)}</b><small>${esc(wnPage(r.id))} · #${esc(r.id)}${r.custom ? ' · new page' : ''}</small></div><span data-testid="wn-popup-access-${esc(r.id)}">${wnAccessPill(r.access)}</span></div>
    ${s.sub ? `<p class="wn-sub">${esc(s.sub)}</p>` : ''}
    <div class="wn-meta"><span>v${esc(s.v || 1)}${r.p && r.p._bump ? ' → re-shows' : ''}</span><span>${items.length} item${items.length === 1 ? '' : 's'}</span>${s.date ? `<span>${esc(s.date)}</span>` : ''}${wnWhen(s) ? `<span>${icon('calendar-clock')}${esc(wnWhen(s))}</span>` : ''}</div>
    <div class="wn-acts">
      ${code ? `<button class="btn btn-sm" data-wa="take" data-id="${esc(r.id)}" data-testid="wn-popup-take-btn-${esc(r.id)}">${icon('hand')}Manage in M.A.D.</button>` : `<button class="btn btn-sm btn-primary" data-wa="edit" data-id="${esc(r.id)}" ${locked ? 'disabled title="Unlock to edit"' : ''} data-testid="wn-popup-edit-btn-${esc(r.id)}">${icon(locked ? 'lock' : 'pencil-line')}Edit</button>`}
      <button class="icon-btn" data-wa="preview" data-id="${esc(r.id)}" title="Preview" data-testid="wn-popup-preview-btn-${esc(r.id)}">${icon('eye')}</button>
      <a class="icon-btn" href="${SITE_URL}/?wn-preview=${encodeURIComponent(r.id)}" target="_blank" rel="noopener" title="Open on treesh.app (published version)" data-testid="wn-popup-site-link-${esc(r.id)}">${icon('external-link')}</a>
      ${code ? '' : `<button class="icon-btn" data-wa="lock" data-id="${esc(r.id)}" title="${locked ? 'Unlock' : 'Lock'}" data-testid="wn-popup-lock-btn-${esc(r.id)}">${icon(locked ? 'lock-open' : 'lock')}</button>
      <button class="icon-btn" data-wa="hide" data-id="${esc(r.id)}" ${locked ? 'disabled' : ''} title="${r.access === 'hidden' ? 'Show on treesh.app' : 'Hide on treesh.app'}" data-testid="wn-popup-hide-btn-${esc(r.id)}">${icon(r.access === 'hidden' ? 'eye' : 'eye-off')}</button>
      <button class="icon-btn danger" data-wa="${r.custom ? 'delete' : 'reset'}" data-id="${esc(r.id)}" ${locked ? 'disabled' : ''} title="${r.custom ? 'Delete popup' : 'Give back to index.html'}" data-testid="wn-popup-${r.custom ? 'delete' : 'reset'}-btn-${esc(r.id)}">${icon(r.custom ? 'trash-2' : 'undo-2')}</button>`}
    </div></article>`;
}
function wnSlideThumb(s){ return `<span class="wn-thumb" style="--a:${esc(s.a || '#9328ff')};--b:${esc(s.b || '#ff3d9a')}">${/^https:/.test(s.art || '') ? `<img src="${esc(s.art)}" alt="">` : icon(s.ic || 'sparkles')}</span>`; }
function wnSlidesHtml(){
  const S = state.wn.data.slides, own = S.mode !== 'code', locked = S.mode === 'locked', list = own ? S.list : WN_BUILTIN.slides;
  const rows = list.map((s, i) => `<div class="wn-slide${own && s.enabled === false ? ' off' : ''}" data-testid="wn-slide-row-${esc(s.id)}">${wnSlideThumb(s)}
    <div class="t"><small>${esc(s.k || '')}</small><b>${esc(s.t || 'Untitled slide')}</b><span>${esc((WN_ACTIONS.find(a => a[0] && (s.go || '').startsWith(a[0])) || ['', s.go || 'no action'])[1])}${(s.go || '').includes(':') ? ' · ' + esc(s.go.split(':').slice(1).join(':')) : ''}${wnWhen(s) ? ' · ' + esc(wnWhen(s)) : ''}</span></div>
    ${own ? `<div class="wn-slide-a"><button class="icon-btn" data-sa="up" data-i="${i}" ${locked || !i ? 'disabled' : ''} title="Move up" data-testid="wn-slide-up-btn-${i}">${icon('arrow-up')}</button><button class="icon-btn" data-sa="down" data-i="${i}" ${locked || i === list.length - 1 ? 'disabled' : ''} title="Move down" data-testid="wn-slide-down-btn-${i}">${icon('arrow-down')}</button><button class="icon-btn" data-sa="toggle" data-i="${i}" ${locked ? 'disabled' : ''} title="${s.enabled === false ? 'Show' : 'Hide'}" data-testid="wn-slide-toggle-btn-${i}">${icon(s.enabled === false ? 'eye' : 'eye-off')}</button><button class="icon-btn" data-sa="dup" data-i="${i}" ${locked ? 'disabled' : ''} title="Duplicate" data-testid="wn-slide-dup-btn-${i}">${icon('copy')}</button><button class="icon-btn" data-sa="edit" data-i="${i}" ${locked ? 'disabled' : ''} title="Edit" data-testid="wn-slide-edit-btn-${i}">${icon('pencil-line')}</button><button class="icon-btn danger" data-sa="del" data-i="${i}" ${locked ? 'disabled' : ''} title="Delete" data-testid="wn-slide-delete-btn-${i}">${icon('trash-2')}</button></div>` : ''}</div>`).join('');
  return `<div class="wn-sec-head"><h2>${icon('gallery-horizontal')}Home carousel slides</h2>${wnSeg('wn-slide-mode', S.mode, ['code', 'managed', 'locked'])}${own && !locked ? `<button class="btn btn-sm" data-wa="new-slide" data-testid="wn-new-slide-btn">${icon('plus')}New slide</button>` : ''}</div>
    <p class="hint">${own ? (locked ? 'Locked: these slides stay live exactly as they are. Switch to Managed to edit.' : 'M.A.D. controls the carousel. Order here is the order on Home. Song and artist slides are still added automatically.') : 'index.html controls these slides. Switch to Managed to edit, reorder, schedule or add your own.'}</p>
    <div class="wn-slides" data-testid="wn-slides-list">${rows || '<div class="empty">No slides. Add one.</div>'}</div>`;
}
function wnSeg(id, cur, opts){ return `<div class="view-seg wn-seg" id="${id}" data-testid="${id}">${opts.map(o => `<button type="button" data-v="${o}" class="${o === cur ? 'on' : ''}" data-testid="${id}-${o}">${icon(WN_ACCESS[o][1])}${WN_ACCESS[o][0]}</button>`).join('')}</div>`; }
function renderWN(){
  if (state.view !== 'whatsnew') return;
  const w = state.wn, d = w.data, rows = wnRows(), n = wnChangeCount();
  $('#wn-body').innerHTML = !w.loaded ? '<div class="skel" style="aspect-ratio:auto;height:220px"></div>' : `
    ${w.restored ? `<div class="notice" data-testid="wn-draft-notice">${icon('notebook-pen')}<span>Restored your unpublished What’s New changes from this device.${w.stale ? ' <b>Heads up:</b> the file changed on GitHub since then. Publishing will replace it.' : ''}</span><button class="btn btn-sm" data-wa="discard" data-testid="wn-discard-draft-btn">Discard</button></div>` : ''}
    ${w.missing ? `<div class="notice" data-testid="wn-file-missing">${icon('file-plus')}<span>${esc(cfg.wnPath)} doesn’t exist yet. It’s created the first time you publish.</span></div>` : ''}
    <div class="notice" id="wn-loader-warn" hidden data-testid="wn-loader-warning">${icon('triangle-alert')}<span>treesh.app’s index.html doesn’t have the What’s New loader, so changes here won’t show on the site yet.</span><button class="btn btn-sm" data-wa="check" data-testid="wn-loader-check-btn">Site check</button></div>
    <div class="wn-top">
      <button type="button" class="tog${d.settings.autoPopups !== false ? ' on' : ''}" data-wa="auto" data-testid="wn-auto-popups-toggle"><span class="tico">${icon('bell-ring')}</span><span><b>Auto-open popups</b><small>${d.settings.autoPopups !== false ? 'Popups open the first time someone visits a page with news.' : 'Off: nobody gets popups automatically. Badges still show.'}</small></span></button>
      <div class="wn-stats"><span><b>${rows.filter(r => r.access !== 'code').length}</b>managed</span><span><b>${rows.filter(r => r.access === 'locked').length}</b>locked</span><span><b>${rows.filter(r => r.access === 'hidden').length}</b>hidden</span><span><b>${d.slides.mode === 'code' ? WN_BUILTIN.slides.length : d.slides.list.filter(s => s.enabled !== false).length}</b>slides</span></div>
    </div>
    <div class="wn-sec-head"><h2>${icon('message-square-text')}Page popups</h2><button class="btn btn-sm" data-wa="new-popup" data-testid="wn-new-popup-btn">${icon('plus')}New popup</button></div>
    <div class="wn-grid" data-testid="wn-popups-grid">${rows.map(wnPopupCard).join('')}</div>
    ${wnSlidesHtml()}
    <div class="wn-sec-head"><h2>${icon('shield-check')}Access</h2></div>
    <p class="hint">Choose what M.A.D. is allowed to change. Code leaves it to index.html, Managed lets you edit, Locked keeps it live but frozen, Hidden turns it off on treesh.app.</p>
    <div class="wn-access" data-testid="wn-access-table">${rows.map(r => `<label class="wn-acc-row"><span class="t"><b>${esc(r.src.title || r.id)}</b><small>${esc(wnPage(r.id))} popup</small></span><select class="select" data-acc="${esc(r.id)}" data-testid="wn-access-select-${esc(r.id)}">${['code', 'managed', 'locked', 'hidden'].filter(o => !(o === 'code' && r.custom)).map(o => `<option value="${o}" ${o === r.access ? 'selected' : ''}>${WN_ACCESS[o][0]} · ${WN_ACCESS[o][2]}</option>`).join('')}</select></label>`).join('')}
      <label class="wn-acc-row"><span class="t"><b>Home carousel</b><small>All update slides</small></span><select class="select" data-acc="__slides" data-testid="wn-access-select-slides">${['code', 'managed', 'locked'].map(o => `<option value="${o}" ${o === d.slides.mode ? 'selected' : ''}>${WN_ACCESS[o][0]} · ${WN_ACCESS[o][2]}</option>`).join('')}</select></label></div>
    <div class="reorder-bar wn-bar" ${n ? '' : 'hidden'} data-testid="wn-publish-bar"><span class="cnt"><b data-testid="wn-change-count">${n}</b> unpublished change${n === 1 ? '' : 's'}</span><button class="btn btn-sm" data-wa="discard" data-testid="wn-discard-btn">Discard</button><button class="btn btn-primary" id="wn-publish" data-wa="publish" data-testid="wn-publish-btn">${icon(cfg.mode === 'live' ? 'zap' : 'git-pull-request')}<span>${cfg.mode === 'live' ? 'Publish live' : 'Open PR'}</span></button></div>`;
  icons();
  wnSiteIndex().then(t => { const el = $('#wn-loader-warn'); if (el) el.hidden = t == null || /__treeshWN/.test(t); });
}
async function wnSiteCheck(){
  const t = await wnSiteIndex();
  if (t == null) return modal({ title:'Site check', ico:'stethoscope', testid:'wn-site-check-modal', body:'<p>Open M.A.D. at <b>treesh.app/tools/mad</b> to check the live site.</p>', actions:[{ label:'Close', testid:'wn-site-check-close-btn' }] });
  const file = await fetch('/content/whatsnew.json', { cache:'no-store' }).then(r => r.ok).catch(() => false);
  const rows = [['What’s New loader', /__treeshWN/.test(t)], ['Banner fix (phone and desktop positions)', /bnPosFit/.test(t)], ['Storage safety (keeps data on iPhone)', /persistStorage/.test(t)], [`${cfg.wnPath} published`, file]];
  modal({ title:'Site check', ico:'stethoscope', testid:'wn-site-check-modal', body:`<div class="checks">${rows.map(([l, ok], i) => statusHtml(ok ? 'ok' : 'bad', ok ? 'circle-check' : 'circle-x', l, 'wn-site-check-' + i)).join('')}</div>${rows.some(r => !r[1]) ? '<p style="margin-top:12px">When you upload your own index.html, start from the newest version on main so these fixes stay in.</p>' : ''}`, actions:[{ label:'Close', testid:'wn-site-check-close-btn' }] });
}
function wnPopupPreview(p){
  return `<div class="wnp" data-testid="wn-popup-preview"><div class="wnp-hero"><span class="wnp-ic">${icon('sparkles')}</span><p class="wnp-eye">What’s new${p.date ? ` · ${esc(p.date)}` : ''}</p><h3>${esc(p.title || 'Untitled')}</h3>${p.sub ? `<p class="wnp-sub">${esc(p.sub)}</p>` : ''}</div>
    <div class="wnp-rows">${(p.items || []).map(it => `<div class="wnp-row"><span class="wnp-ric">${icon(it.icon || 'sparkles')}</span><div><b>${esc(it.title)}</b><p>${esc(it.desc)}</p></div></div>`).join('') || '<p class="hint">Add an item to see it here.</p>'}</div>
    <span class="wnp-btn">Got it</span><span class="wnp-off">Turn off update notes</span></div>`;
}
function wnSlidePreview(s){
  const art = /^https:/.test(s.art || '') ? `<img src="${esc(s.art)}" alt="">` : `<span class="wnu-glyph">${icon(s.ic || 'sparkles')}</span>`;
  return `<div class="wnu-pv" style="--a:${esc(s.a || '#9328ff')};--b:${esc(s.b || '#ff3d9a')}" data-testid="wn-slide-preview"><span class="g a"></span><span class="g b"></span><span class="grid"></span><div class="art">${art}</div>
    <div class="copy"><span class="k">${icon(s.ic || 'sparkles')}${esc(s.k || 'Kicker')}<em>New</em></span><h3>${esc(s.t || 'Slide title')}</h3><p>${esc(s.d || '')}</p><div class="chips">${(s.chips || []).slice(0, 4).map(c => `<span>${esc(c)}</span>`).join('')}</div><span class="cta">${esc(s.cta || 'Open')}${icon('arrow-right')}</span></div></div>`;
}
function wnIconPick(cur){
  return new Promise(res => {
    const all = Object.keys((window.lucide && window.lucide.icons) || {}).map(k => k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([a-zA-Z])(\d)/g, '$1-$2').toLowerCase());
    const wrap = document.createElement('div'); wrap.className = 'modal-wrap gs-wrap';
    wrap.innerHTML = `<div class="modal gs" data-testid="wn-icon-picker"><label class="search">${icon('search')}<input class="input" placeholder="Search ${all.length} icons… (heart, game, mic)" data-testid="wn-icon-search-input" value=""></label><div class="wn-icons soft-scroll"></div><div class="gs-foot"><span class="hint">Current: <b>${esc(cur || 'none')}</b></span><button class="btn btn-sm" style="margin-left:auto" data-x data-testid="wn-icon-cancel-btn">Cancel</button></div></div>`;
    const grid = $('.wn-icons', wrap), inp = $('input', wrap), close = v => { wrap.remove(); res(v); };
    const paint = () => { const q = inp.value.trim().toLowerCase(); grid.innerHTML = all.filter(n => !q || n.includes(q)).slice(0, 140).map(n => `<button type="button" data-ic="${n}" title="${n}" class="${n === cur ? 'on' : ''}" data-testid="wn-icon-option-${n}">${icon(n)}<small>${n}</small></button>`).join('') || '<p class="hint">No icons match.</p>'; icons(); };
    inp.addEventListener('input', paint);
    wrap.addEventListener('click', e => { const b = e.target.closest('[data-ic]'); if (b) close(b.dataset.ic); else if (e.target === wrap || e.target.closest('[data-x]')) close(null); });
    $('#modal-root').appendChild(wrap); paint(); setTimeout(() => inp.focus(), 50);
  });
}
function wnDrawer(title, testid, formHtml, onMount){
  const root = $('#drawer-root');
  root.innerHTML = `<div class="scrim" data-close></div><aside class="drawer wide" data-testid="${testid}"><div class="drawer-head"><h2>${esc(title)}</h2><button class="icon-btn" data-close data-testid="wn-drawer-close-btn">${icon('x')}</button></div>
    <div class="drawer-body"><div class="wn-ed"><div class="wn-form">${formHtml}<div class="wn-lint" data-testid="wn-lint"></div></div><div class="wn-pv-col"><div class="view-seg" data-testid="wn-preview-device"><button type="button" data-dev="phone" class="on" data-testid="wn-preview-phone-btn">${icon('smartphone')} Phone</button><button type="button" data-dev="desktop" data-testid="wn-preview-desktop-btn">${icon('monitor')} Desktop</button></div><div class="wn-stage phone" data-testid="wn-preview-stage"></div></div></div></div>
    <div class="drawer-foot"><button class="btn" data-close data-testid="wn-drawer-cancel-btn">Cancel</button><button class="btn btn-primary" id="wn-apply" data-testid="wn-apply-btn">${icon('check')}Save to changes</button></div></aside>`;
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape' && !$('#modal-root .modal-wrap')) close(); };
  document.addEventListener('keydown', onKey);
  $$('[data-close]', root).forEach(b => b.addEventListener('click', close));
  $$('[data-dev]', root).forEach(b => b.addEventListener('click', () => { $$('[data-dev]', root).forEach(x => x.classList.toggle('on', x === b)); $('.wn-stage', root).className = 'wn-stage ' + b.dataset.dev; }));
  onMount(root, close); icons();
}
const wnDateIn = (id, v, label) => `<div class="field"><label for="${id}">${label}</label><input class="input" type="date" id="${id}" value="${esc(v || '')}" data-testid="${id}-input"></div>`;
function wnLintPaint(root, texts, fix){
  const l = wnLint(texts);
  $('.wn-lint', root).innerHTML = l.map(([k, m]) => `<div class="dup">${icon('triangle-alert')}<span>${esc(m)}</span>${k === 'dash' ? '<button type="button" class="lbl-action" data-fixdash data-testid="wn-fix-dashes-btn">Fix</button>' : ''}</div>`).join('');
  const b = $('[data-fixdash]', root); if (b) b.addEventListener('click', fix); icons();
}

function openWNPopup(id){
  const isNew = id == null, d = state.wn.data, b = id && WN_BUILTIN.popups[id];
  const src = isNew ? { title:'', sub:'', date: wnToday(), items:[{ icon:'sparkles', title:'', desc:'' }], v:0 } : wnCopy(d.popups[id] && d.popups[id].mode !== 'code' ? d.popups[id] : b);
  const p = { title:'', sub:'', date:'', from:'', until:'', items:[], ...src };
  let bump = isNew || !!(d.popups[id] && d.popups[id]._bump);
  const pages = Object.keys(WN_PAGES).filter(k => isNew ? !wnRows().some(r => r.id === k) : true);
  const form = `${isNew ? `<div class="field"><label for="wn-page">Page</label><select class="select" id="wn-page" data-testid="wn-popup-page-select">${pages.map(k => `<option value="${k}">${esc(WN_PAGES[k])} (#${k})</option>`).join('')}<option value="__custom">Another page (type its id)…</option></select><input class="input" id="wn-page-custom" hidden placeholder="Page id from the treesh.app link, e.g. studios" data-testid="wn-popup-page-custom-input"><p class="hint">The popup opens the first time someone visits this page on treesh.app.</p></div>` : `<div class="edit-banner"><div class="t"><small>${esc(wnPage(id))} popup</small><b>#${esc(id)} · v${esc(p.v || 1)}</b></div></div>`}
    <div class="field"><label for="wn-title">Title <span class="req">*</span></label><input class="input" id="wn-title" maxlength="80" data-testid="wn-popup-title-input"></div>
    <div class="field"><label for="wn-sub">Subtitle</label><input class="input" id="wn-sub" maxlength="140" data-testid="wn-popup-sub-input"></div>
    <div class="grid2"><div class="field"><label for="wn-date">Date shown <button type="button" class="lbl-action" id="wn-today" data-testid="wn-popup-today-btn">Today</button></label><input class="input" id="wn-date" placeholder="October 9, 2026" data-testid="wn-popup-date-input"></div><div></div>${wnDateIn('wn-from', p.from, 'Show from')}${wnDateIn('wn-until', p.until, 'Show until')}</div>
    <button type="button" class="tog${bump ? ' on' : ''}" id="wn-bump" data-testid="wn-popup-bump-toggle"><span class="tico">${icon('bell-plus')}</span><span><b>Show again to everyone</b><small>On: everyone sees this popup again once. Off: quiet fix, nobody gets it again.</small></span></button>
    <div class="wn-sec-head sm"><h3>${icon('list')}Items</h3><button type="button" class="btn btn-sm" id="wn-add-item" data-testid="wn-popup-add-item-btn">${icon('plus')}Add item</button></div>
    <div class="wn-items" id="wn-items" data-testid="wn-popup-items"></div>`;
  wnDrawer(isNew ? 'New popup' : 'Edit popup', 'wn-popup-drawer', form, (root, close) => {
    const f = k => $('#wn-' + k, root);
    f('title').value = p.title || ''; f('sub').value = p.sub || ''; f('date').value = p.date || '';
    const texts = () => p.items.flatMap(it => [it.title, it.desc]).concat([p.title, p.sub]);
    const paint = () => { $('.wn-stage', root).innerHTML = wnPopupPreview(p); icons(); wnLintPaint(root, texts(), () => { p.title = wnFixDashes(p.title); p.sub = wnFixDashes(p.sub); p.items.forEach(it => { it.title = wnFixDashes(it.title); it.desc = wnFixDashes(it.desc); }); f('title').value = p.title; f('sub').value = p.sub; items(); }); };
    const items = () => {
      f('items').innerHTML = p.items.map((it, i) => `<div class="wn-item" data-i="${i}"><button type="button" class="icon-btn" data-ia="icon" title="Pick icon: ${esc(it.icon)}" data-testid="wn-item-icon-btn-${i}">${icon(it.icon || 'sparkles')}</button><div class="wn-item-f"><input class="input sm" data-if="title" maxlength="80" placeholder="Item title" value="${esc(it.title)}" data-testid="wn-item-title-input-${i}"><textarea class="textarea sm" data-if="desc" rows="2" placeholder="What changed, in one or two friendly sentences" data-testid="wn-item-desc-input-${i}">${escText(it.desc)}</textarea></div><div class="wn-item-a"><button type="button" class="icon-btn" data-ia="up" ${i ? '' : 'disabled'} title="Move up" data-testid="wn-item-up-btn-${i}">${icon('arrow-up')}</button><button type="button" class="icon-btn" data-ia="down" ${i < p.items.length - 1 ? '' : 'disabled'} title="Move down" data-testid="wn-item-down-btn-${i}">${icon('arrow-down')}</button><button type="button" class="icon-btn" data-ia="dup" title="Duplicate" data-testid="wn-item-dup-btn-${i}">${icon('copy')}</button><button type="button" class="icon-btn danger" data-ia="del" title="Remove" data-testid="wn-item-remove-btn-${i}">${icon('trash-2')}</button></div></div>`).join('') || '<p class="hint">No items yet.</p>';
      paint();
    };
    f('items').addEventListener('input', e => { const row = e.target.closest('[data-i]'); if (!row || !e.target.dataset.if) return; p.items[+row.dataset.i][e.target.dataset.if] = e.target.value; paint(); });
    f('items').addEventListener('click', async e => { const btn = e.target.closest('[data-ia]'), row = e.target.closest('[data-i]'); if (!btn || !row) return; const i = +row.dataset.i, a = btn.dataset.ia, L = p.items;
      if (a === 'icon'){ const n = await wnIconPick(L[i].icon); if (n) L[i].icon = n; }
      if (a === 'up' && i) [L[i - 1], L[i]] = [L[i], L[i - 1]]; if (a === 'down' && i < L.length - 1) [L[i + 1], L[i]] = [L[i], L[i + 1]];
      if (a === 'dup') L.splice(i + 1, 0, { ...L[i] }); if (a === 'del') L.splice(i, 1); items(); });
    f('add-item').addEventListener('click', () => { p.items.push({ icon:'sparkles', title:'', desc:'' }); items(); const t = $$('[data-if=title]', root).pop(); if (t) t.focus(); });
    ['title', 'sub', 'date', 'from', 'until'].forEach(k => f(k).addEventListener('input', () => { p[k] = f(k).value; paint(); }));
    f('today').addEventListener('click', () => { p.date = f('date').value = wnToday(); paint(); });
    f('bump').addEventListener('click', () => { bump = !bump; f('bump').classList.toggle('on', bump); });
    if (isNew) f('page').addEventListener('change', () => { f('page-custom').hidden = f('page').value !== '__custom'; });
    f('apply').addEventListener('click', () => {
      const pid = isNew ? (f('page').value === '__custom' ? wnIdOf(f('page-custom').value) : f('page').value) : id;
      if (!pid) return toast('Pick a page for this popup.', 'bad');
      if (isNew && wnRows().some(r => r.id === pid)) return toast(`${wnPage(pid)} already has a popup. Edit that one instead.`, 'bad');
      if (!p.title.trim()) return toast('Every popup needs a title.', 'bad');
      const its = p.items.filter(it => it.title.trim() || it.desc.trim()); if (!its.length) return toast('Add at least one item.', 'bad');
      const prev = d.popups[pid], out = { mode: prev && prev.mode === 'locked' ? 'locked' : 'managed', enabled: prev ? prev.enabled !== false : true, v: Math.max(1, +p.v || (b ? b.v : 0) || 1), date: p.date.trim(), title: p.title.trim(), sub: p.sub.trim(), items: its.map(it => ({ icon: it.icon || 'sparkles', title: it.title.trim(), desc: it.desc.trim() })) };
      if (p.from) out.from = p.from; if (p.until) out.until = p.until; if (bump) out._bump = true;
      d.popups[pid] = out; close(); wnChanged(); toast(`${out.title} saved to your changes. Publish when you’re ready.`, 'ok');
    });
    items();
  });
}

function openWNSlide(i){
  const S = state.wn.data.slides, isNew = i == null;
  const s = { id:'', k:'New', t:'', d:'', chips:[], cta:'Open', go:'page:library', ic:'sparkles', a:'#9328ff', b:'#ff3d9a', art:'', enabled:true, from:'', until:'', ...(isNew ? {} : wnCopy(S.list[i])) };
  const kind = (WN_ACTIONS.find(a => a[0].endsWith(':') && s.go.startsWith(a[0])) || WN_ACTIONS.find(a => a[0] === s.go) || ['page:'])[0];
  const target = kind.endsWith(':') ? s.go.slice(kind.length) : '';
  const form = `<div class="grid2"><div class="field"><label for="wn-k">Kicker</label><input class="input" id="wn-k" maxlength="30" placeholder="New game" data-testid="wn-slide-kicker-input"></div><div class="field"><label for="wn-t">Title <span class="req">*</span></label><input class="input" id="wn-t" maxlength="40" data-testid="wn-slide-title-input"></div></div>
    <div class="field"><label for="wn-d">Description</label><textarea class="textarea sm" id="wn-d" rows="2" maxlength="160" data-testid="wn-slide-desc-input"></textarea></div>
    <div class="field"><label for="wn-chips">Chips <small class="hint">up to 4, comma separated</small></label><input class="input" id="wn-chips" placeholder="Match-3, 30 levels, All ages" data-testid="wn-slide-chips-input"></div>
    <div class="grid2"><div class="field"><label for="wn-cta">Button label</label><input class="input" id="wn-cta" maxlength="24" data-testid="wn-slide-cta-input"></div>
      <div class="field"><label for="wn-go">Button action</label><select class="select" id="wn-go" data-testid="wn-slide-action-select">${WN_ACTIONS.map(([v, l]) => `<option value="${v}" ${v === kind ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
      <div class="field span2" id="wn-target-f"><label for="wn-target" id="wn-target-l">Target</label><input class="input" id="wn-target" list="wn-target-list" data-testid="wn-slide-target-input"><datalist id="wn-target-list"></datalist></div></div>
    <div class="grid2"><div class="field"><label>Icon</label><button type="button" class="btn" id="wn-ic" data-testid="wn-slide-icon-btn"></button></div><div class="field"><label>Colors</label><div class="wn-colors"><input type="color" id="wn-a" data-testid="wn-slide-color-a-input"><input type="color" id="wn-b" data-testid="wn-slide-color-b-input"><button type="button" class="lbl-action" id="wn-swap" data-testid="wn-slide-swap-colors-btn">Swap</button></div></div></div>
    <div class="field"><label for="wn-art">Artwork <small class="hint">a built-in Treesh image, or an https link</small></label><input class="input" id="wn-art" list="wn-art-list" placeholder="bronze-blitz_main or https://res.cloudinary.com/…" data-testid="wn-slide-art-input"><datalist id="wn-art-list">${WN_ART.map(a => `<option value="${a}">`).join('')}</datalist>${cloudReady() ? `<button type="button" class="btn btn-sm" id="wn-art-up" style="margin-top:8px;align-self:flex-start" data-testid="wn-slide-art-upload-btn">${icon('upload')}Upload image</button>` : '<p class="hint">Set up Cloudinary in Settings to upload images here.</p>'}<p class="hint">Built-in art keys only show on treesh.app. The preview shows the icon instead.</p></div>
    <div class="grid2">${wnDateIn('wn-from', s.from, 'Show from')}${wnDateIn('wn-until', s.until, 'Show until')}</div>
    <button type="button" class="tog${s.enabled !== false ? ' on' : ''}" id="wn-on" data-testid="wn-slide-enabled-toggle"><span class="tico">${icon('eye')}</span><span><b>Show on Home</b><small>Turn off to keep the slide here without showing it.</small></span></button>`;
  wnDrawer(isNew ? 'New slide' : 'Edit slide', 'wn-slide-drawer', form, (root, close) => {
    const f = k => $('#wn-' + k, root);
    f('k').value = s.k; f('t').value = s.t; f('d').value = s.d; f('chips').value = (s.chips || []).join(', '); f('cta').value = s.cta; f('target').value = target; f('a').value = /^#[0-9a-f]{6}$/i.test(s.a) ? s.a : '#9328ff'; f('b').value = /^#[0-9a-f]{6}$/i.test(s.b) ? s.b : '#ff3d9a'; f('art').value = s.art;
    const goOf = () => { const k = f('go').value; return k.endsWith(':') ? k + f('target').value.trim() : k; };
    const tgt = () => { const k = f('go').value; f('target-f').hidden = !k.endsWith(':'); f('target-l').textContent = { 'game:':'Game', 'page:':'Page id', 'url:':'Link (https://)' }[k] || 'Target'; $('#wn-target-list', root).innerHTML = (k === 'game:' ? WN_GAMES : k === 'page:' ? Object.keys(WN_PAGES) : []).map(v => `<option value="${v}">`).join(''); };
    const paint = () => { s.k = f('k').value; s.t = f('t').value; s.d = f('d').value; s.chips = f('chips').value.split(',').map(x => x.trim()).filter(Boolean).slice(0, 4); s.cta = f('cta').value; s.go = goOf(); s.a = f('a').value; s.b = f('b').value; s.art = f('art').value.trim(); s.from = f('from').value; s.until = f('until').value;
      f('ic').innerHTML = `${icon(s.ic)}${esc(s.ic)}`; $('.wn-stage', root).innerHTML = wnSlidePreview(s); icons();
      wnLintPaint(root, [s.t, s.d], () => { f('t').value = wnFixDashes(f('t').value); f('d').value = wnFixDashes(f('d').value); paint(); }); };
    root.addEventListener('input', e => { if (e.target.closest('.wn-form')) paint(); });
    f('go').addEventListener('change', () => { tgt(); paint(); });
    f('ic').addEventListener('click', async () => { const n = await wnIconPick(s.ic); if (n){ s.ic = n; paint(); } });
    f('swap').addEventListener('click', () => { const a = f('a').value; f('a').value = f('b').value; f('b').value = a; paint(); });
    f('on').addEventListener('click', () => { s.enabled = s.enabled === false; f('on').classList.toggle('on', s.enabled); });
    const up = f('art-up'); if (up) up.addEventListener('click', () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = async () => { const file = inp.files[0]; if (!file) return; up.disabled = true; up.textContent = 'Uploading…'; try { f('art').value = await cloudUpload(file, 'image', () => {}); paint(); toast('Artwork uploaded.', 'ok'); } catch (e){ toast(e.message, 'bad'); } finally { up.disabled = false; up.innerHTML = `${icon('upload')}Upload image`; icons(); } }; inp.click(); });
    f('apply').addEventListener('click', () => {
      paint();
      if (!s.t.trim()) return toast('Every slide needs a title.', 'bad');
      if (s.go.startsWith('url:') && !/^url:https:\/\/\S+$/.test(s.go)) return toast('Links need to start with https://', 'bad');
      if (/:(\s*)$/.test(s.go)) return toast('Pick a target for the button action.', 'bad');
      if (s.art && !/^https:\/\//.test(s.art) && !WN_ART.includes(s.art)) return toast('Artwork must be a built-in art key or an https link.', 'bad');
      const out = { id: s.id || wnIdOf(s.t) || 'slide', k: s.k.trim(), t: s.t.trim(), d: s.d.trim(), chips: s.chips, cta: s.cta.trim() || 'Open', go: s.go, ic: s.ic, a: s.a, b: s.b, art: s.art, enabled: s.enabled !== false };
      if (s.from) out.from = s.from; if (s.until) out.until = s.until;
      const clash = S.list.some((x, j) => x.id === out.id && j !== i); if (clash) out.id += '-' + Date.now().toString(36).slice(-3);
      if (isNew) S.list.unshift(out); else S.list[i] = out;
      close(); wnChanged(); toast(`${out.t} saved to your changes.`, 'ok');
    });
    tgt(); paint();
  });
}
function wnPreviewModal(id){
  const r = wnRows().find(x => x.id === id); if (!r) return;
  modal({ title:`${wnPage(id)} popup`, ico:'eye', testid:'wn-preview-modal', body: wnPopupPreview(r.src), actions:[{ label:'Close', testid:'wn-preview-close-btn' }] });
}
function wnSummary(){
  const d = state.wn.data, rows = wnRows().filter(r => r.access !== 'code');
  return `Updates \`${cfg.wnPath}\` (What’s New popups and Home carousel).\n\n| Popup | Access | Version | Items |\n|---|---|---|---|\n${rows.map(r => `| ${r.src.title} (#${r.id}) | ${WN_ACCESS[r.access][0]} | v${r.src.v || 1} | ${(r.src.items || []).length} |`).join('\n') || '| none | | | |'}\n\nCarousel: **${WN_ACCESS[d.slides.mode][0]}**${d.slides.mode !== 'code' ? ` · ${d.slides.list.filter(s => s.enabled !== false).length} visible slides` : ''} · Auto-open popups: **${d.settings.autoPopups !== false ? 'on' : 'off'}**\n\n_Submitted with Treesh M.A.D._`;
}
async function wnPublish(){
  if (state.busy || !requireGitHub()) return;
  const d = state.wn.data;
  Object.entries(d.popups).forEach(([id, p]) => { if (p._bump){ const b = WN_BUILTIN.popups[id]; p.v = Math.max(+p.v || 0, b ? b.v : 0) + 1; delete p._bump; } });
  d.updated = new Date().toISOString();
  const next = wnClean(d), btn = $('#wn-publish');
  state.busy = true; if (btn) btn.disabled = true;
  try {
    const r = await commitFile({ path: cfg.wnPath, create:true, message:'Update What’s New popups and slides', branchKey:'whatsnew', body: wnSummary(), apply: () => next }, st => { const s = btn && $('span', btn); if (s) s.textContent = st; });
    state.wn.base = next; state.wn.missing = false; state.wn.restored = false; localStorage.removeItem(WN_DRAFT);
    done(r, 'whatsnew', 'What’s New');
  } catch (e){ failModal(e); }
  finally { state.busy = false; renderWN(); }
}
function wnBind(){
  $('#view-whatsnew').addEventListener('click', async e => {
    const t = e.target.closest('[data-wa],[data-sa],.wn-seg [data-v]'); if (!t || t.disabled) return;
    const d = state.wn.data, S = d.slides, id = t.dataset.id;
    if (t.matches('.wn-seg [data-v]')) return wnSetSlideAccess(t.dataset.v);
    if (t.dataset.sa){ const i = +t.dataset.i, L = S.list, a = t.dataset.sa;
      if (a === 'edit') return openWNSlide(i);
      if (a === 'up' && i) [L[i - 1], L[i]] = [L[i], L[i - 1]]; if (a === 'down' && i < L.length - 1) [L[i + 1], L[i]] = [L[i], L[i + 1]];
      if (a === 'toggle') L[i].enabled = L[i].enabled === false; if (a === 'dup') L.splice(i + 1, 0, { ...wnCopy(L[i]), id: L[i].id + '-copy', enabled:false });
      if (a === 'del'){ if (!(await confirmModal({ title:`Delete “${L[i].t}”?`, ico:'trash-2', tone:'danger', testid:'wn-slide-delete-confirm-modal', body:'<p>The slide is removed from your changes. It leaves the site when you publish.</p>', ok:'Delete', okKind:'btn-danger', okIcon:'trash-2' }))) return; L.splice(i, 1); }
      return wnChanged(); }
    const a = t.dataset.wa;
    if (a === 'auto'){ d.settings.autoPopups = d.settings.autoPopups === false; return wnChanged(); }
    if (a === 'new-popup') return openWNPopup(null);
    if (a === 'new-slide') return openWNSlide(null);
    if (a === 'edit') return openWNPopup(id);
    if (a === 'take'){ wnSetAccess(id, 'managed'); return openWNPopup(id); }
    if (a === 'preview') return wnPreviewModal(id);
    if (a === 'lock') return wnSetAccess(id, wnRows().find(r => r.id === id).access === 'locked' ? 'managed' : 'locked');
    if (a === 'hide') return wnSetAccess(id, wnRows().find(r => r.id === id).access === 'hidden' ? 'managed' : 'hidden');
    if (a === 'reset'){ if (await confirmModal({ title:'Give it back to index.html?', ico:'undo-2', testid:'wn-reset-confirm-modal', body:'<p>Your M.A.D. edits to this popup are dropped and the version written in index.html shows again.</p>', ok:'Give back', okIcon:'undo-2' })) wnSetAccess(id, 'code'); return; }
    if (a === 'delete'){ if (await confirmModal({ title:'Delete this popup?', ico:'trash-2', tone:'danger', testid:'wn-delete-confirm-modal', body:`<p>The ${esc(wnPage(id))} popup is removed when you publish.</p>`, ok:'Delete', okKind:'btn-danger', okIcon:'trash-2' })){ delete d.popups[id]; wnChanged(); } return; }
    if (a === 'discard'){ if (await confirmModal({ title:'Discard unpublished changes?', ico:'undo-2', tone:'danger', testid:'wn-discard-confirm-modal', body:'<p>Everything goes back to what’s published.</p>', ok:'Discard', okKind:'btn-danger', okIcon:'undo-2' })){ localStorage.removeItem(WN_DRAFT); state.wn.data = wnNorm(safeJSON(state.wn.base)); state.wn.restored = false; renderWN(); } return; }
    if (a === 'check') return wnSiteCheck();
    if (a === 'publish') return wnPublish();
  });
  $('#view-whatsnew').addEventListener('change', e => { const s = e.target.closest('[data-acc]'); if (!s) return; if (s.dataset.acc === '__slides') wnSetSlideAccess(s.value); else wnSetAccess(s.dataset.acc, s.value); });
  $('#wn-check').addEventListener('click', wnSiteCheck);
}
