/* ---------- bulk import ---------- */
state.queue = [];
let qSeq = 0;
const EQ = '<span class="eq"><span></span><span></span><span></span><span></span></span>';
function splitTagArtist(str){ const fix = n => { const r = rosterByName(n); return r ? r.name : n; }; const names = splitNames(String(str || '').replace(/\s+(?:feat\.?|ft\.?|featuring|x)\s+/gi, ',')).map(fix); return { artist: names[0] || '', featured: names.slice(1) }; }
function qErrors(it){ const e = []; if (!it.title) e.push('title'); if (!it.artist) e.push('artist'); if (!it.genre) e.push('genre'); if (!isUrl(it.mp3)) e.push('audio link'); if (!isUrl(it.cover)) e.push('cover link'); return e; }
function qStatus(it){ if (it.busy) return ['busy', it.busy]; const e = qErrors(it); return e.length ? ['needs', 'Needs ' + e.join(', ')] : ['ready', 'Ready to upload']; }
async function queueFiles(files){
  const list = [...files].filter(f => /^audio\//.test(f.type) || /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(f.name));
  if (!list.length) return toast('No audio files in that drop.', 'bad');
  const items = list.map(file => ({ id: ++qSeq, file, name: file.name, localAudio: URL.createObjectURL(file), localCover: '', title:'', artist:'', featured:[], genre:'', album:'', date:'', mp3:'', cover:'', busy:'Reading tags…', progress:0, err:'' }));
  state.queue.push(...items); openBulk();
  toast(`${items.length} track${items.length > 1 ? 's' : ''} added to the queue.`, 'ok');
  for (const it of items) await processItem(it);
}
async function processItem(it){
  const tags = await readTags(it.file);
  const base = it.name.replace(/\.[^.]+$/, '').replace(/_+/g, ' ').trim(), dash = base.split(/\s+-\s+/);
  it.title = tags.title || (dash.length > 1 ? dash.slice(1).join(' - ') : base);
  Object.assign(it, splitTagArtist(tags.artist || (dash.length > 1 ? dash[0] : '')));
  it.album = tags.album || ''; it.genre = tags.genre ? String(tags.genre).replace(/^\(\d+\)/, '').trim() : '';
  it.date = tags.year && /^\d{4}$/.test(String(tags.year).trim()) ? String(tags.year).trim() : fmtDate(new Date().toISOString().slice(0, 10));
  let coverFile = null;
  if (tags.picture){ const type = tags.picture.format || 'image/jpeg'; coverFile = new File([new Uint8Array(tags.picture.data)], `${slug(it.title)}-cover.${type.split('/')[1] || 'jpg'}`, { type }); it.localCover = URL.createObjectURL(coverFile); }
  it.busy = '';
  if (!state.queue.includes(it)) return;
  renderQueue();
  if (!cloudReady()) return;
  try {
    it.busy = 'Uploading audio…'; updateItem(it);
    it.mp3 = await cloudUpload(it.file, 'audio', p => { it.progress = p; updateItem(it); });
    if (coverFile){ it.busy = 'Uploading cover…'; it.progress = 0; updateItem(it); it.cover = await cloudUpload(coverFile, 'image', p => { it.progress = p; updateItem(it); }); }
  } catch (e){ it.err = e.message + ' Paste links instead.'; }
  it.busy = ''; it.progress = 0; renderQueue();
}
function itemHtml(it, i){
  const [st, msg] = qStatus(it), cov = isUrl(it.cover) ? it.cover : it.localCover;
  const dup = it.title && state.catalog.songs.find(s => normKey(s.title) === normKey(it.title) && normKey(s.artist) === normKey(it.artist));
  const inp = (k, ph, extra = '') => `<input class="input sm" id="q-${it.id}-${k}" data-qid="${it.id}" data-qf="${k}" value="${esc(it[k])}" placeholder="${ph}" ${extra} data-testid="queue-input-${k}">`;
  return `<li class="q-item ${st}" data-qid="${it.id}" data-testid="queue-item">
    <div class="q-top"><div class="q-cv" style="${cov ? `background-image:url(&quot;${esc(cov)}&quot;)` : ''}">${cov ? '' : icon('music-4')}</div>
      <div class="q-meta"><b title="${esc(it.name)}">${String(i + 1).padStart(2, '0')} · ${esc(it.name)}</b><span class="q-st ${st}" data-testid="queue-item-status">${st === 'busy' ? EQ : icon(st === 'ready' ? 'check-circle-2' : 'alert-circle')}<span>${esc(msg)}</span></span>${dup ? `<span class="q-st needs" data-testid="queue-item-duplicate">${icon('copy')}Already in the catalog</span>` : ''}${it.err ? `<span class="q-st bad">${esc(it.err)}</span>` : ''}${it.featured.length ? `<span class="q-st">Featuring ${esc(joinNames(it.featured))}</span>` : ''}</div>
      <div class="q-acts"><button type="button" class="icon-btn" data-qact="play" title="Preview" data-testid="queue-play-btn">${icon(state.playing === 'q' + it.id && !player.paused ? 'pause' : 'play')}</button><button type="button" class="icon-btn" data-qact="compose" title="Edit in Compose" data-testid="queue-compose-btn">${icon('pencil')}</button><button type="button" class="icon-btn danger" data-qact="remove" title="Remove" data-testid="queue-remove-btn">${icon('x')}</button></div></div>
    <div class="progress" ${it.busy && it.progress ? '' : 'hidden'}><i style="width:${Math.round(it.progress * 100)}%"></i></div>
    <div class="q-fields">${inp('title', 'Title')}${inp('artist', 'Main artist', 'list="roster-list"')}${inp('genre', 'Genre', 'list="genre-list"')}${inp('mp3', 'https://… audio link')}${inp('cover', 'https://… cover link')}</div>
  </li>`;
}
function updateItem(it){
  const li = $(`.q-item[data-qid="${it.id}"]`); if (!li) return;
  const [st, msg] = qStatus(it), s = $('.q-st', li), pg = $('.progress', li);
  li.className = `q-item ${st}`; s.className = `q-st ${st}`;
  s.innerHTML = (st === 'busy' ? EQ : icon(st === 'ready' ? 'check-circle-2' : 'alert-circle')) + `<span>${esc(msg)}</span>`;
  pg.hidden = !(it.busy && it.progress); $('i', pg).style.width = `${Math.round(it.progress * 100)}%`;
  icons(); updateBulkFoot();
}
function renderQueue(){
  $('#open-bulk-count').textContent = state.queue.length ? ` · ${state.queue.length}` : '';
  const list = $('#q-list'); if (!list) return;
  const a = document.activeElement, fid = a && /^q-\d/.test(a.id) ? a.id : '', sel = fid ? [a.selectionStart, a.selectionEnd] : null;
  list.innerHTML = state.queue.length ? state.queue.map(itemHtml).join('') : `<div class="empty" data-testid="queue-empty">${icon('list-music')}<b>Queue is empty</b><span>Drop several tracks above to get started.</span></div>`;
  if (fid){ const el = $('#' + fid); if (el){ el.focus(); try { el.setSelectionRange(...sel); } catch {} } }
  icons(); updateBulkFoot();
}
function updateBulkFoot(){
  const b = $('#q-upload'); if (!b) return;
  const n = state.queue.length, r = state.queue.filter(it => qStatus(it)[0] === 'ready').length;
  $('#q-count').textContent = n;
  $('#q-summary').textContent = n ? `${r} ready · ${n - r} need attention` : 'Nothing queued yet';
  b.disabled = !r || state.busy;
  if (!state.busy) $('#q-upload-label').textContent = r ? `Upload ${r} song${r > 1 ? 's' : ''}` : 'Upload songs';
}
function removeItem(it, keepUrls){ if (!keepUrls) [it.localAudio, it.localCover].forEach(u => u && URL.revokeObjectURL(u)); state.queue = state.queue.filter(x => x !== it); if (state.playing === 'q' + it.id) stopAudio(); }
function sendToCompose(it, close){
  if (state.editing){ state.editing = null; setEditUI(); }
  stopAudio(); clearMedia();
  fillForm({ 'f-title': it.title, 'f-artist': it.artist, 'f-genre': it.genre, 'f-album': it.album, 'f-date': it.date, 'f-mp3': it.mp3, 'f-cover': it.cover, featured: it.featured });
  state.localAudio = it.localAudio; state.localCover = it.localCover;
  removeItem(it, true); close(); showErrors({}); refreshAll(); switchView('compose');
  toast(`“${it.title || it.name}” moved to Compose.`, 'ok');
}
function openBulk(){
  if ($('#q-list')) return renderQueue();
  const root = $('#drawer-root');
  root.innerHTML = ''; root.appendChild($('#tpl-bulk').content.cloneNode(true));
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); renderQueue(); };
  const onKey = e => { if (e.key === 'Escape' && !$('.modal-wrap')) close(); };
  document.addEventListener('keydown', onKey);
  $$('[data-close]', root).forEach(b => b.addEventListener('click', close));
  $('#q-cloud-hint').hidden = cloudReady();
  const d = $('#q-drop'), inp = $('#q-file');
  d.addEventListener('click', () => inp.click());
  d.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); inp.click(); } });
  inp.addEventListener('change', () => { queueFiles(inp.files); inp.value = ''; });
  ['dragenter','dragover'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.add('over'); }));
  ['dragleave','drop'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.remove('over'); }));
  d.addEventListener('drop', e => queueFiles(e.dataTransfer.files));
  $('#q-apply').addEventListener('click', () => {
    const sh = { artist: val('q-s-artist'), genre: val('q-s-genre'), album: val('q-s-album'), date: val('q-s-date') };
    if (!Object.values(sh).some(Boolean)) return toast('Fill in a shared field first.', 'info');
    if (!state.queue.length) return toast('Queue is empty.', 'info');
    state.queue.forEach(it => { Object.entries(sh).forEach(([k, v]) => { if (v) it[k] = v; }); if (sh.artist) it.featured = it.featured.filter(n => normKey(n) !== normKey(sh.artist)); });
    renderQueue(); toast('Applied to every song in the queue.', 'ok');
  });
  const list = $('#q-list');
  list.addEventListener('input', e => { const f = e.target.dataset.qf; if (!f) return; const it = state.queue.find(x => x.id === +e.target.dataset.qid); if (!it) return; it[f] = e.target.value.trim(); updateItem(it); });
  list.addEventListener('change', e => { if (e.target.dataset.qf === 'cover' || e.target.dataset.qf === 'title') renderQueue(); });
  list.addEventListener('click', e => {
    const b = e.target.closest('[data-qact]'); if (!b) return;
    const it = state.queue.find(x => x.id === +b.closest('.q-item').dataset.qid); if (!it) return;
    if (b.dataset.qact === 'play') playSrc(isUrl(it.mp3) ? it.mp3 : it.localAudio, 'q' + it.id);
    if (b.dataset.qact === 'compose') sendToCompose(it, close);
    if (b.dataset.qact === 'remove'){ removeItem(it); renderQueue(); }
  });
  $('#q-upload').addEventListener('click', bulkUpload);
  setMode(cfg.mode); renderQueue();
}
async function bulkUpload(){
  const ready = state.queue.filter(it => qStatus(it)[0] === 'ready');
  if (!ready.length || state.busy || !requireGitHub()) return;
  const btn = $('#q-upload'), lbl = $('#q-upload-label');
  state.busy = true; btn.disabled = true;
  const songs = ready.map(it => { const ids = []; [it.artist, ...it.featured].forEach(n => { const r = rosterByName(n); if (r && !ids.includes(r.id)) ids.push(r.id); }); return { title: it.title, artist: it.artist, featured: it.featured, ids, genre: it.genre, mood:'', date: it.date, album: it.album, writtenBy:'', producer:'', mixer:'', videographer:'', cover: it.cover, mp3: it.mp3, video:'', bio:'', label:'', release:'', explicit:false, exclusive:false, treeshchoice:false }; });
  const block = songs.map(f => buildBlock(f, null)).join('\n\n'), n = songs.length, cell = v => String(v).replace(/\|/g, '\\|');
  try {
    const r = await commitFile({ path: cfg.songsPath, message: `Add ${n} song${n > 1 ? 's' : ''}: ${songs.map(s => s.title).join(', ')}`.slice(0, 140), branchKey: `bulk-${n}`,
      body: `Adds ${n} songs to \`${cfg.songsPath}\`.\n\n| # | Track | Artist | Genre |\n|---|---|---|---|\n${songs.map((s, i) => `| ${i + 1} | ${cell(s.title)} | ${cell([s.artist, ...s.featured].join(' x '))} | ${cell(s.genre)} |`).join('\n')}\n\n_Submitted with Song Coder_`,
      apply: t => applyOp(t, { kind:'add', block }) }, s => { lbl.textContent = s; });
    ready.forEach(it => removeItem(it)); renderQueue(); done(r, 'bulk', `${n} song${n > 1 ? 's' : ''}`);
    if (r.mode === 'live') setTimeout(loadCatalog, 800);
  } catch (e){ failModal(e); }
  finally { state.busy = false; updateBulkFoot(); }
}

