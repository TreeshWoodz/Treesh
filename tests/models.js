/* ---------- models ---------- */
state.models = []; state.modelsRaw = {}; state.modelsMissing = false;
const opt = a => a.map(x => [x, x]);
const MODEL_SECTIONS = [
  ['Identity', 'Who scouts are looking at', [
    ['name', 'Model name', 'text', { req: 1, ph: 'Professional name', span: 2 }],
    ['division', 'Division', 'select', { opts: opt(['Women', 'Men', 'Non-binary', 'Teens', 'Kids']) }],
    ['board', 'Board', 'select', { opts: opt(['Main', 'Development / New Faces', 'Commercial', 'Curve', 'Petite', 'Fitness', 'Mature / Classic', 'Parts']) }],
    ['age', 'Age', 'text', { ph: '22', mode: 'numeric' }],
    ['pronouns', 'Pronouns', 'text', { ph: 'she/her' }],
    ['location', 'Based in', 'text', { ph: 'Atlanta, GA' }],
    ['agency', 'Agency', 'text', { ph: 'Independent / mother agency' }],
    ['availability', 'Availability', 'select', { opts: opt(['Available', 'Limited', 'Booked', 'On hold']) }],
    ['travel', 'Travel', 'select', { opts: opt(['Will travel', 'Local only', 'With notice', 'Has passport']) }]
  ]],
  ['Sizes', 'Standard sizing for wardrobe & fittings', [
    ['shoe', 'Shoe (US)', 'text', { ph: '8.5' }], ['dress', 'Dress (US)', 'text', { ph: '4' }],
    ['suit', 'Suit / jacket', 'text', { ph: '40R' }], ['shirt', 'Shirt / top', 'text', { ph: 'M' }],
    ['pants', 'Pants (waist x length)', 'text', { ph: '30x32' }], ['bra', 'Bra', 'text', { ph: '34B' }]
  ]],
  ['Look', 'Features that get you cast', [
    ['hair-color', 'Hair color', 'select', { opts: opt(['Black', 'Dark brown', 'Brown', 'Light brown', 'Blonde', 'Red', 'Auburn', 'Gray', 'Colored', 'Bald / shaved']) }],
    ['hair-length', 'Hair length', 'select', { opts: opt(['Shaved', 'Short', 'Medium', 'Long', 'Extra long']) }],
    ['hair-texture', 'Hair texture', 'select', { opts: opt(['Straight', 'Wavy', 'Curly', 'Coily', 'Locs', 'Braids']) }],
    ['eye-color', 'Eye color', 'select', { opts: opt(['Brown', 'Dark brown', 'Hazel', 'Green', 'Blue', 'Gray', 'Amber']) }],
    ['skin-tone', 'Skin tone', 'text', { ph: 'Deep, medium, fair…' }],
    ['ethnicity', 'Ethnicity (optional)', 'text', { ph: 'As the model describes it' }],
    ['tattoos', 'Tattoos', 'select', { opts: opt(['None', 'Small / hidden', 'Visible', 'Many']) }],
    ['piercings', 'Piercings', 'text', { ph: 'Ears, nose…' }]
  ]],
  ['Work', 'Experience & what they book', [
    ['experience', 'Experience', 'select', { opts: opt(['New face', 'Developing', 'Experienced', 'Professional']) }],
    ['categories', 'Categories', 'chips', { span: 2, opts: ['Runway', 'Editorial', 'Commercial', 'Print', 'E-commerce', 'Beauty', 'Fitness', 'Swim', 'Lingerie', 'Hand / parts', 'Music video', 'Promo / events', 'Influencer', 'Acting'] }],
    ['skills', 'Special skills', 'text', { ph: 'Dance, acting, sports, instruments…', span: 2 }],
    ['languages', 'Languages', 'text', { ph: 'English, Spanish' }],
    ['credits', 'Notable credits', 'text', { ph: 'Brands, shows, campaigns' }]
  ]],
  ['Links & booking', 'Where scouts can see more', [
    ['instagram', 'Instagram', 'text', { ph: '@handle' }], ['tiktok', 'TikTok', 'text', { ph: '@handle' }],
    ['portfolio', 'Portfolio link', 'text', { ph: 'https://…' }], ['video', 'Walk / intro video', 'text', { ph: 'YouTube link or ID' }],
    ['email', 'Booking email', 'text', { ph: 'bookings@…', span: 2 }],
    ['bio', 'Bio', 'textarea', { span: 2, ph: 'Personality, background, what makes them stand out' }]
  ]]
];
const MEAS = [['height', 'Height'], ['bust', 'Bust / chest'], ['waist', 'Waist'], ['hips', 'Hips'], ['inseam', 'Inseam']];
const MODEL_KEYS = MODEL_SECTIONS.flatMap(s => s[2].map(f => f[0]));
const inToCm = v => Math.round(v * 2.54 * 10) / 10, cmToIn = v => Math.round(v / 2.54 * 10) / 10;
const ftIn = cm => { const t = Math.round(cm / 2.54); return `${Math.floor(t / 12)}'${t % 12}"`; };
function parseMeas(v, unit, isHeight){
  v = String(v || '').trim(); if (!v) return null;
  const m = v.match(/^(\d+)\s*(?:'|’|ft)\s*(\d+(?:\.\d+)?)?/i);
  if (unit === 'in' && isHeight && m) return inToCm(+m[1] * 12 + +(m[2] || 0));
  const n = parseFloat(v); if (isNaN(n)) return null;
  return unit === 'in' ? inToCm(n) : n;
}
const showMeas = (cm, unit, isHeight) => cm == null ? '' : unit === 'cm' ? String(cm) : isHeight ? ftIn(cm) : String(cmToIn(cm));
const measLine = m => [m.bust, m.waist, m.hips].every(x => x != null) ? [m.bust, m.waist, m.hips].map(x => Math.round(cmToIn(x))).join('-') : '';
function findArticleBlocks(text, cls, idAttr){
  const cr = commentRanges(text), out = [], re = /<article\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/article>/gi, cre = new RegExp(`class\\s*=\\s*["'][^"']*\\b${cls}\\b`, 'i'); let m;
  while ((m = re.exec(text))){
    if (inRanges(cr, m.index) || !cre.test(m[0].slice(0, m[0].indexOf('>')))) continue;
    const id = (m[0].match(new RegExp(`${idAttr}\\s*=\\s*"([^"]*)"`, 'i')) || [])[1];
    if (id) out.push({ id: id.trim(), raw: m[0] });
  }
  return out;
}
function parseModels(text){
  return findArticleBlocks(text, 'model', 'data-model-id').map(b => {
    const a = rawAttrs(b.raw), g = k => (a['data-' + k] || '').trim(), num = k => g(k) === '' || isNaN(+g(k)) ? null : +g(k);
    const photos = [...g('photos').split('|').filter(Boolean).map(url => ({ url, kind: 'portfolio' })), ...g('digitals').split('|').filter(Boolean).map(url => ({ url, kind: 'digital' }))];
    const o = { id: b.id, raw: b.raw, attrs: a, headshot: g('headshot'), photos, meas: {} };
    MODEL_KEYS.forEach(k => { o[k] = g(k); });
    MEAS.forEach(([k]) => { o.meas[k] = num(k + '-cm'); });
    return o;
  });
}
const MODEL_KNOWN = new Set(['class', 'data-model-id', 'data-headshot', 'data-photos', 'data-digitals', 'data-height-ft', ...MODEL_KEYS.map(k => 'data-' + k), ...MEAS.flatMap(([k]) => [`data-${k}-cm`, `data-${k}-in`])]);
function buildModelBlock(md, orig){
  const at = ['class="model"', `data-model-id="${esc(md.id)}"`, `data-name="${esc(md.name)}"`], add = (k, v) => { if (v !== '' && v != null) at.push(`data-${k}="${esc(v)}"`); };
  MODEL_KEYS.filter(k => k !== 'name').forEach(k => add(k, md[k]));
  MEAS.forEach(([k]) => { const cm = md.meas[k]; if (cm == null) return; add(k + '-cm', cm); add(k + '-in', cmToIn(cm)); });
  if (md.meas.height != null) add('height-ft', ftIn(md.meas.height));
  const port = md.photos.filter(p => p.kind === 'portfolio').map(p => p.url), dig = md.photos.filter(p => p.kind === 'digital').map(p => p.url);
  add('headshot', md.headshot); add('photos', port.join('|')); add('digitals', dig.join('|'));
  if (orig) Object.entries(orig).forEach(([k, v]) => { if (!MODEL_KNOWN.has(k)) at.push(`${k}="${esc(v)}"`); });
  const sub = [md.board, md.meas.height != null ? ftIn(md.meas.height) : '', measLine(md.meas)].filter(Boolean).join(' · ');
  return `<article ${at.join(' ')}>
                      <div class="model__thumbnail">
                        <img class="model__blur" src="${esc(md.headshot)}" alt="Model" />
                        <img class="model__image" src="${esc(md.headshot)}" alt="${esc(md.name)}" />
                        <div class="model__ring"></div>
                      </div>
                      <div class="model__label">
                        <p>${escText(md.name)}</p>
                        <p class="capital">${escText(sub || 'Model')}</p>
                      </div>
                      <div class="model__photos" hidden>
${md.photos.map((p, i) => `                        <img src="${esc(p.url)}" alt="${esc(md.name)} ${p.kind} ${i + 1}" data-kind="${p.kind}" loading="lazy" />`).join('\n')}
                      </div>
                    </article>`;
}
async function loadModels(){
  let text = ''; state.modelsMissing = false;
  try { text = (await loadText('models')).text; } catch { state.modelsMissing = true; }
  setModels(text);
}
function setModels(text){
  state.models = parseModels(text || ''); state.modelsRaw = {};
  state.models.forEach(m => { state.modelsRaw[m.id] = m.raw; });
  $('#mod-count').textContent = state.models.length || '··';
  if (state.view === 'models') renderModels();
}
function renderModels(){
  const q = normKey($('#mod-search').value);
  const list = state.models.filter(m => !q || normKey([m.name, m.location, m.board, m.categories, m.agency].join(' ')).includes(q));
  $('#mod-note').hidden = !state.modelsMissing;
  $('#mod-grid').innerHTML = list.length ? list.map((m, i) => `<article class="model-card" style="animation-delay:${Math.min(i, 12) * 30}ms" data-testid="model-card-${esc(m.id)}">
      <div class="mc-img" style="${m.headshot ? `background-image:url(&quot;${esc(m.headshot)}&quot;)` : ''}">${m.headshot ? '' : icon('user-round')}<span class="mc-av ${normKey(m.availability)}">${esc(m.availability || 'Available')}</span>
        <div class="a-acts"><button class="icon-btn" data-mact="edit" data-id="${esc(m.id)}" title="Edit" data-testid="model-edit-btn">${icon('pencil')}</button><button class="icon-btn danger" data-mact="delete" data-id="${esc(m.id)}" title="Remove" data-testid="model-delete-btn">${icon('trash-2')}</button></div></div>
      <div class="mc-inf"><h3 data-testid="model-card-name">${esc(m.name)}</h3><p>${esc([m.board, m.location].filter(Boolean).join(' · '))}</p>
        <div class="mc-stats"><span><small>Height</small><b>${m.meas.height != null ? ftIn(m.meas.height) : '—'}</b></span><span><small>B-W-H</small><b>${measLine(m.meas) || '—'}</b></span><span><small>Photos</small><b>${m.photos.length}</b></span></div></div>
    </article>`).join('')
    : `<div class="empty" data-testid="models-empty">${icon('camera')}<b>${state.models.length ? 'No matches' : 'No models yet'}</b><span>${state.models.length ? 'Try another search.' : 'Add the first model and Treesh M.A.D. will create content/models.html for you.'}</span></div>`;
  icons();
}
function modelFieldHtml([k, label, type, o = {}]){
  const id = 'm-' + k, sp = o.span ? ' span2' : '', req = o.req ? ' <span class="req">*</span>' : '';
  if (type === 'select') return `<div class="field${sp}"><label for="${id}">${label}</label><select class="select" id="${id}" data-mk="${k}" data-testid="model-${k}-input"><option value="">—</option>${o.opts.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></div>`;
  if (type === 'textarea') return `<div class="field${sp}"><label for="${id}">${label}</label><textarea class="textarea" id="${id}" data-mk="${k}" placeholder="${esc(o.ph || '')}" data-testid="model-${k}-input"></textarea></div>`;
  if (type === 'chips') return `<div class="field${sp}"><span class="lbl">${label}</span><div class="suggest" id="${id}" data-chips="${k}" data-testid="model-${k}-chips">${o.opts.map(c => `<button type="button" class="sug" data-chip="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>`;
  return `<div class="field${sp}" data-mf="${k}"><label for="${id}">${label}${req}</label><input class="input" id="${id}" data-mk="${k}" placeholder="${esc(o.ph || '')}" ${o.mode ? `inputmode="${o.mode}"` : ''} data-testid="model-${k}-input"><p class="err" data-testid="model-error-${k}"></p></div>`;
}
function openModelDrawer(ed){
  if (!requireGitHub()) return;
  const root = $('#drawer-root'), unitKey = 'treesh_mad_units';
  root.innerHTML = ''; root.appendChild($('#tpl-model').content.cloneNode(true));
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape' && !$('.modal-wrap')) close(); };
  document.addEventListener('keydown', onKey);
  $$('[data-close]', root).forEach(b => b.addEventListener('click', close));
  const nextId = String(state.models.reduce((m, x) => Math.max(m, parseInt(x.id, 10) || 0), 0) + 1);
  const M = { id: ed ? ed.id : nextId, unit: localStorage.getItem(unitKey) || 'in', meas: ed ? { ...ed.meas } : {}, photos: ed ? ed.photos.map(p => ({ ...p })) : [], headshot: ed ? ed.headshot : '' };
  if (ed) $('.drawer-head h2', root).textContent = 'Edit model';
  $('#m-id').textContent = '#' + M.id;
  $('#m-sections').innerHTML = MODEL_SECTIONS.map(([t, hint, fields], i) => `${i === 1 ? measHtml() : ''}<div class="set-sec m-sec"><h3>${icon(['id-card', 'shirt', 'scan-face', 'briefcase', 'link'][i])}${t}<small>${hint}</small></h3><div class="grid2">${fields.map(modelFieldHtml).join('')}</div></div>`).join('');
  function measHtml(){ return `<div class="set-sec m-sec"><h3>${icon('ruler')}Measurements<small>What every scout checks first</small></h3><div class="seg m-unit" data-mode="${M.unit === 'cm' ? 'live' : 'pr'}" data-testid="model-unit-toggle"><span class="ind"></span><button type="button" data-unit="in" class="${M.unit === 'in' ? 'on' : ''}" data-testid="model-unit-in-btn">ft / in</button><button type="button" data-unit="cm" class="${M.unit === 'cm' ? 'on' : ''}" data-testid="model-unit-cm-btn">cm</button></div><div class="grid3 m-meas">${MEAS.map(([k, l]) => `<div class="field" data-mf="${k}"><label for="mm-${k}">${l}${k === 'height' ? ' <span class="req">*</span>' : ''}</label><input class="input" id="mm-${k}" data-meas="${k}" inputmode="decimal" data-testid="model-${k}-input"><p class="hint" id="mmh-${k}"></p><p class="err" data-testid="model-error-${k}"></p></div>`).join('')}</div></div>`; }
  const fillMeas = () => MEAS.forEach(([k]) => { $('#mm-' + k).value = showMeas(M.meas[k], M.unit, k === 'height'); $('#mm-' + k).placeholder = M.unit === 'cm' ? (k === 'height' ? '178' : '86') : (k === 'height' ? `5'10"` : '34'); });
  if (ed) MODEL_KEYS.forEach(k => { const el = $(`[data-mk="${k}"]`, root); if (el) el.value = ed[k] || ''; });
  const chosen = new Set(ed ? splitNames(ed.categories) : []);
  const paintChips = () => $$('[data-chip]', root).forEach(b => b.classList.toggle('on', chosen.has(b.dataset.chip)));
  const read = () => { const o = { id: M.id, meas: M.meas, photos: M.photos.filter(p => isUrl(p.url)).map(({ url, kind }) => ({ url, kind })) }; MODEL_KEYS.forEach(k => { const el = $(`[data-mk="${k}"]`, root); o[k] = el ? el.value.trim() : ''; }); o.categories = [...chosen].join(', '); o.video = ytId(o.video); o.instagram = o.instagram.replace(/^@?/, o.instagram ? '@' : ''); o.headshot = isUrl(M.headshot) && o.photos.some(p => p.url === M.headshot) ? M.headshot : (o.photos[0] || {}).url || ''; return o; };
  const code = () => buildModelBlock(read(), ed ? rawAttrs(state.modelsRaw[ed.id]) : null);
  const preview = () => {
    const md = read();
    $('#m-pv').style.backgroundImage = md.headshot ? `url("${md.headshot}")` : ''; $('#m-pv-name').textContent = md.name || 'New model';
    $('#m-pv-sub').textContent = [md.meas.height != null ? ftIn(md.meas.height) : '', measLine(md.meas), md.location].filter(Boolean).join(' · ') || 'Measurements show here';
    MEAS.forEach(([k]) => { const cm = M.meas[k]; $('#mmh-' + k).textContent = cm == null ? '' : M.unit === 'cm' ? (k === 'height' ? ftIn(cm) : cmToIn(cm) + ' in') : cm + ' cm'; });
    if ($('#m-code-panel').classList.contains('open')) $('#m-code').innerHTML = highlight(code());
  };
  const paintPhotos = () => {
    $('#m-photos').innerHTML = M.photos.length ? M.photos.map((p, i) => `<div class="m-ph ${p.url === M.headshot || (!isUrl(M.headshot) && i === 0) ? 'hs' : ''} ${isUrl(p.url) ? '' : 'local'}" data-i="${i}" style="background-image:url(&quot;${esc(p.local || p.url)}&quot;)" data-testid="model-photo-tile">
        <button type="button" class="m-kind" data-pa="kind" title="Switch portfolio / digital" data-testid="model-photo-kind-btn">${p.kind === 'digital' ? 'Digital' : 'Portfolio'}</button>
        ${p.busy ? `<span class="m-busy">${EQ}${esc(p.busy)}</span>` : isUrl(p.url) ? '' : '<span class="m-busy warn">Needs a link</span>'}
        <div class="m-pa"><button type="button" class="icon-btn" data-pa="star" title="Use as headshot" data-testid="model-photo-headshot-btn">${icon('star')}</button><button type="button" class="icon-btn" data-pa="left" title="Move earlier" data-testid="model-photo-left-btn">${icon('chevron-left')}</button><button type="button" class="icon-btn danger" data-pa="remove" title="Remove" data-testid="model-photo-remove-btn">${icon('x')}</button></div></div>`).join('')
      : `<p class="hint" data-testid="model-photos-empty">No photos yet. Upload, paste links or import a batch. The first photo becomes the headshot.</p>`;
    $('#m-ph-count').textContent = `${M.photos.filter(p => isUrl(p.url)).length} photos`;
    icons(); preview();
  };
  const addUrls = (urls, kind) => { let n = 0; urls.forEach(u => { u = u.trim().replace(/[),.;]+$/, ''); if (isUrl(u) && !M.photos.some(p => p.url === u)){ M.photos.push({ url: u, kind }); n++; } }); paintPhotos(); return n; };
  const addFiles = files => {
    const imgs = [...files].filter(f => /^image\//.test(f.type)); if (!imgs.length) return toast('No images in that drop.', 'bad');
    const kind = $('#m-kind').value;
    imgs.forEach(async f => {
      const p = { url: '', local: URL.createObjectURL(f), kind, busy: cloudReady() ? 'Uploading…' : '' };
      M.photos.push(p); paintPhotos();
      if (!cloudReady()) return;
      try { p.url = await cloudUpload(f, 'image', pr => { p.busy = `Uploading ${Math.round(pr * 100)}%`; }); } catch (e){ toast(e.message, 'bad'); }
      p.busy = ''; paintPhotos();
    });
    if (!cloudReady()) toast('Cloudinary isn’t set up. Paste hosted links for these photos, or add a preset in Settings.', 'info', 4500);
  };
  const d = $('#m-drop'), inp = $('#m-file');
  d.addEventListener('click', () => inp.click());
  inp.addEventListener('change', () => { addFiles(inp.files); inp.value = ''; });
  ['dragenter', 'dragover'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.remove('over'); }));
  d.addEventListener('drop', e => addFiles(e.dataTransfer.files));
  $('#m-add-link').addEventListener('click', () => { const v = val('m-link'); if (!isUrl(v)) return toast('Paste a full https:// image link.', 'bad'); addUrls([v], $('#m-kind').value); $('#m-link').value = ''; });
  $('#m-link').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); $('#m-add-link').click(); } });
  $('#m-import').addEventListener('click', () => { const t = $('#m-import-text').value, urls = [...new Set((t.match(/https?:\/\/[^\s"'<>]+/g) || []))]; if (!urls.length) return toast('No links found. Paste URLs, a list, or HTML with <img> tags.', 'bad'); const n = addUrls(urls, $('#m-kind').value); $('#m-import-text').value = ''; toast(`Imported ${n} photo${n === 1 ? '' : 's'}.`, 'ok'); });
  $('#m-photos').addEventListener('click', e => {
    const b = e.target.closest('[data-pa]'); if (!b) return; const i = +b.closest('.m-ph').dataset.i, p = M.photos[i];
    if (b.dataset.pa === 'kind') p.kind = p.kind === 'digital' ? 'portfolio' : 'digital';
    if (b.dataset.pa === 'star'){ if (!isUrl(p.url)) return toast('Give this photo a hosted link first.', 'info'); M.headshot = p.url; }
    if (b.dataset.pa === 'left' && i > 0) M.photos.splice(i - 1, 0, M.photos.splice(i, 1)[0]);
    if (b.dataset.pa === 'remove'){ if (p.local) URL.revokeObjectURL(p.local); M.photos.splice(i, 1); }
    paintPhotos();
  });
  $('.m-unit', root).addEventListener('click', e => { const b = e.target.closest('[data-unit]'); if (!b) return; M.unit = b.dataset.unit; localStorage.setItem(unitKey, M.unit); $('.m-unit', root).dataset.mode = M.unit === 'cm' ? 'live' : 'pr'; $$('[data-unit]', root).forEach(x => x.classList.toggle('on', x === b)); fillMeas(); preview(); });
  root.addEventListener('input', e => {
    const k = e.target.dataset.meas; if (k){ M.meas[k] = parseMeas(e.target.value, M.unit, k === 'height'); }
    const fl = e.target.closest('.field'); if (fl) fl.classList.remove('invalid');
    if (k || e.target.dataset.mk) preview();
  });
  $('#m-sections').addEventListener('click', e => { const c = e.target.closest('[data-chip]'); if (!c) return; chosen.has(c.dataset.chip) ? chosen.delete(c.dataset.chip) : chosen.add(c.dataset.chip); paintChips(); preview(); });
  $('#m-code-toggle').addEventListener('click', e => { if (e.target.closest('#m-copy')) return copyText(code(), 'Model code copied.'); $('#m-code-panel').classList.toggle('open'); preview(); });
  $('#m-save').addEventListener('click', async () => {
    if (state.busy) return;
    const md = read(), err = {};
    if (!md.name) err.name = 'Every model needs a name.'; else if (state.models.some(x => normKey(x.name) === normKey(md.name) && (!ed || x.id !== ed.id))) err.name = `${md.name} is already on the board.`;
    if (md.meas.height == null) err.height = 'Height is the first thing scouts look for.';
    $$('.field[data-mf]', root).forEach(fl => { const k = fl.dataset.mf; fl.classList.toggle('invalid', !!err[k]); const p = $('.err', fl); if (p) p.textContent = err[k] || ''; });
    if (!md.photos.length) return toast('Add at least one photo with a hosted link.', 'bad');
    if (M.photos.some(p => p.busy)) return toast('Wait for uploads to finish.', 'info');
    if (Object.keys(err).length){ const f = $('.field.invalid', root); if (f) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); return toast('Fix the highlighted fields.', 'bad'); }
    const skipped = M.photos.filter(p => !isUrl(p.url)).length;
    const btn = $('#m-save'), lbl = $('#m-save-label'), raw = ed && state.modelsRaw[ed.id];
    state.busy = true; btn.disabled = true;
    try {
      const r = await commitFile({ path: cfg.modelsPath, create: true, message: `${ed ? 'Update' : 'Add'} model: ${md.name}`, branchKey: `model-${ed ? 'edit-' : ''}${slug(md.name).slice(0, 40)}`,
        body: `${ed ? 'Updates' : 'Adds'} model **${md.name}** (#${md.id}) in \`${cfg.modelsPath}\`.\n\n| Height | B-W-H (in) | Board | Based in | Photos |\n|---|---|---|---|---|\n| ${ftIn(md.meas.height)} | ${measLine(md.meas) || '—'} | ${md.board || '—'} | ${md.location || '—'} | ${md.photos.length} |\n\n<img src="${md.headshot}" width="160">\n\n_Submitted with Treesh M.A.D._`,
        apply: t => { if (ed) return replaceRaw(t, raw, buildModelBlock(md, rawAttrs(raw))); const blocks = findArticleBlocks(t, 'model', 'data-model-id'); md.id = String(Math.max(+M.id, ...blocks.map(b => (parseInt(b.id, 10) || 0) + 1))); const block = buildModelBlock(md, null), pos = blocks.length ? t.lastIndexOf('\n', t.indexOf(blocks[0].raw) - 1) + 1 : 0; return t.slice(0, pos) + block + '\n\n' + t.slice(pos); } }, s => { lbl.textContent = s; });
      close(); done(r, ed ? 'model-edit' : 'model', `${md.name} (#${md.id})`);
      if (skipped) toast(`${skipped} photo${skipped > 1 ? 's' : ''} without a hosted link ${skipped > 1 ? 'were' : 'was'} left out.`, 'info', 4500);
    } catch (e){ failModal(e); }
    finally { state.busy = false; if (document.body.contains(btn)){ btn.disabled = false; lbl.textContent = ed ? 'Save model' : 'Add to board'; } }
  });
  fillMeas(); paintChips(); paintPhotos(); setMode(cfg.mode); icons();
  $('#m-save-label').textContent = ed ? 'Save model' : 'Add to board';
  setTimeout(() => $('#m-name').focus(), 300);
}
async function deleteModel(m){
  if (!requireGitHub()) return;
  const raw = state.modelsRaw[m.id], live = cfg.mode === 'live';
  const ok = await confirmModal({ title: `Remove ${m.name}?`, ico: 'user-x', tone: 'danger', testid: 'model-delete-confirm-modal', body: `<p>Model #${esc(m.id)} comes off the Treesh board.</p><p>${live ? 'This goes <b>live immediately</b>.' : 'A <b>pull request</b> will be opened for review.'}</p>`, ok: live ? 'Remove now' : 'Open removal PR', okKind: 'btn-danger', okIcon: 'trash-2' });
  if (!ok) return;
  try { const r = await commitFile({ path: cfg.modelsPath, message: `Remove model: ${m.name}`, branchKey: `model-delete-${slug(m.name).slice(0, 40)}`, body: `Removes model #${m.id} (${m.name}) from \`${cfg.modelsPath}\`.\n\n_Submitted with Treesh M.A.D._`, apply: t => replaceRaw(t, raw, null) }); done(r, 'model-delete', m.name); }
  catch (e){ failModal(e); }
}
function wireModels(){
  $('#new-model').addEventListener('click', () => openModelDrawer());
  $('#mod-search').addEventListener('input', renderModels);
  $('#mod-grid').addEventListener('click', e => { const b = e.target.closest('[data-mact]'); if (!b) return; const m = state.models.find(x => x.id === b.dataset.id); if (!m) return; b.dataset.mact === 'edit' ? openModelDrawer(m) : deleteModel(m); });
}

