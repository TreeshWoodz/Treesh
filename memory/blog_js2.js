/* ---------- blog ---------- */
const POST_DRAFT = 'treesh_mad_post_draft:';
const BLOG_CATS = ["What's New", 'Release Notes', 'Artist Spotlight', 'Culture', 'Tech', 'Editorial'];
const BLOG_SHELL = '<!-- Treesh blog posts · managed by Treesh M.A.D. · read by treesh.app/blog -->\n<section class="posts">\n</section>\n';
const POST30 = { id:'treesh-3-0', title:'Treesh 3.0', subtitle:'Music to Live For — now with more of everything', author:'Treesh', date:'2026-07-27T11:30:00-04:00', category:'Release Notes', tags:['3.0'], hero:'', md: __POST30__ };
state.posts = []; state.postsMissing = false;
function findPostBlocks(text){
  const out = [], re = /<article\b[^>]*\bclass\s*=\s*["'][^"']*\bpost\b[^"']*["'][^>]*>/gi; let m;
  while ((m = re.exec(text))){ const end = text.indexOf('</article>', re.lastIndex); if (end < 0) break; out.push(text.slice(m.index, end + 10)); re.lastIndex = end + 10; }
  return out;
}
const unesc = s => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; };
function parsePosts(text){
  return findPostBlocks(text).map(raw => {
    const a = rawAttrs(raw), g = k => (a['data-' + k] || '').trim(), md = raw.match(/<template class="post-md">([\s\S]*?)<\/template>/);
    return { raw, id: g('post-id'), title: g('title'), subtitle: g('subtitle'), author: g('author'), date: g('date'), category: g('category'), tags: g('tags').split('|').filter(Boolean), hero: g('hero'), md: md ? unesc(md[1]) : '' };
  }).sort((x, y) => (Date.parse(y.date) || 0) - (Date.parse(x.date) || 0));
}
function buildPostBlock(p){
  const at = ['class="post"', `data-post-id="${esc(p.id)}"`, ...['title', 'subtitle', 'author', 'date', 'category', 'hero'].filter(k => p[k]).map(k => `data-${k}="${esc(p[k])}"`), ...(p.tags.length ? [`data-tags="${esc(p.tags.join('|'))}"`] : [])];
  return `<article ${at.join(' ')}>\n<template class="post-md">${escText(p.md)}</template>\n<div class="post-body">\n${renderPostBody(p.md)}\n</div>\n</article>`;
}
function insertPost(text, block){
  const t = text.trim() ? text : BLOG_SHELL, m = t.match(/<section\b[^>]*class\s*=\s*["']posts["'][^>]*>/i);
  if (!m) return block + '\n\n' + t;
  const at = m.index + m[0].length; return t.slice(0, at) + '\n' + block + '\n' + t.slice(at);
}
async function loadPosts(){
  let text = ''; state.postsMissing = false;
  try { text = (await loadText('blog')).text; } catch { state.postsMissing = true; }
  setPosts(text);
}
function setPosts(text){ state.posts = parsePosts(text || ''); if (state.view === 'blog') renderBlog(); if (state.shelfPaint) state.shelfPaint(); }
const postWhen = d => { const x = new Date(d); return d && !isNaN(x) ? x.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'No date'; };
function renderBlog(){
  const q = normKey($('#blog-search').value), cat = $('#blog-cat').value, cats = [...new Set([...BLOG_CATS, ...state.posts.map(p => p.category).filter(Boolean)])];
  $('#blog-cat').innerHTML = `<option value="">All categories</option>${cats.map(c => `<option ${c === cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}`;
  $('#blog-note').hidden = !state.postsMissing; $('#import-30').hidden = state.posts.some(p => p.id === POST30.id);
  const list = state.posts.filter(p => (!cat || p.category === cat) && (!q || normKey([p.title, p.subtitle, p.author, p.category, p.tags.join(' '), p.md].join(' ')).includes(q)));
  $('#blog-count').textContent = state.posts.length ? `Showing ${list.length} of ${state.posts.length} post${state.posts.length === 1 ? '' : 's'}` : '';
  $('#blog-grid').innerHTML = list.length ? list.map((p, i) => `<article class="model-card post-card" style="animation-delay:${Math.min(i, 12) * 30}ms" data-testid="post-card">
    <div class="mc-img" style="${isUrl(p.hero) ? `background-image:url(&quot;${esc(p.hero)}&quot;)` : ''}">${isUrl(p.hero) ? '' : icon('newspaper')}<span class="mc-av">${esc(p.category || 'Blog')}</span>${hasDraft(POST_DRAFT + p.id) ? `<span class="mc-draft" data-testid="post-draft-badge">${icon('pencil-line')}Draft</span>` : ''}
      <div class="a-acts"><button class="icon-btn" data-pact="copy" data-id="${esc(p.id)}" title="Copy code" data-testid="post-copy-btn">${icon('copy')}</button><button class="icon-btn" data-pact="edit" data-id="${esc(p.id)}" title="Edit" data-testid="post-edit-btn">${icon('pencil')}</button><button class="icon-btn danger" data-pact="delete" data-id="${esc(p.id)}" title="Delete" data-testid="post-delete-btn">${icon('trash-2')}</button></div></div>
    <div class="mc-inf"><h3 data-testid="post-card-title">${esc(p.title)}</h3><p>${esc(p.subtitle || '')}</p><p class="pc-meta">${postWhen(p.date)} · ${readMins(p.md)} min read${p.tags.length ? ' · ' + p.tags.map(t => '#' + esc(t)).join(' ') : ''}</p></div></article>`).join('')
    : `<div class="empty" data-testid="blog-empty">${icon('newspaper')}<b>${state.posts.length ? 'No matches' : 'No posts yet'}</b><span>${state.posts.length ? 'Try another search.' : 'Write the first post, or bring in “Treesh 3.0”.'}</span></div>`;
  icons();
}
async function copyText(text, msg){ try { await navigator.clipboard.writeText(text); } catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); } toast(msg, 'ok'); }
async function deletePost(p){
  if (!requireGitHub()) return;
  const live = cfg.mode === 'live';
  if (!(await confirmModal({ title:`Delete “${p.title}”?`, ico:'trash-2', tone:'danger', testid:'post-delete-confirm-modal', body:`<p>The post comes off treesh.app/blog.</p><p>${live ? 'This goes <b>live immediately</b>.' : 'A <b>pull request</b> will be opened for review.'}</p>`, ok: live ? 'Delete now' : 'Open removal PR', okKind:'btn-danger', okIcon:'trash-2' }))) return;
  try { const r = await commitFile({ path: cfg.blogPath, message:`Remove blog post: ${p.title}`, branchKey:`post-delete-${slug(p.title).slice(0, 40)}`, body:`Removes “${p.title}” from \`${cfg.blogPath}\`.\n\n_Submitted with Treesh M.A.D._`, apply: t => replaceRaw(t, p.raw, null) }); done(r, 'post-delete', p.title); }
  catch (e){ failModal(e); }
}
const P_FIELDS = ['title', 'subtitle', 'author', 'category', 'date', 'tags', 'hero', 'md'];
function openPostDrawer(ed, seed){
  const root = $('#drawer-root');
  root.innerHTML = ''; root.appendChild($('#tpl-post').content.cloneNode(true));
  const f = k => $('#p-' + k), dKey = POST_DRAFT + (ed ? ed.id : 'new'), src = seed || ed;
  $('#p-head').textContent = ed ? 'Edit post' : 'New post';
  $('#p-cats').innerHTML = BLOG_CATS.map(c => `<option value="${esc(c)}">`).join('');
  const fill = o => { P_FIELDS.forEach(k => { f(k).value = k === 'tags' ? (o.tags || []).join(', ') : k === 'date' ? isoToLocal(o.date) : (o[k] || ''); }); };
  if (src) fill(src); else { f('author').value = 'Treesh'; f('category').value = "What's New"; f('date').value = isoToLocal(new Date().toISOString()); }
  const read = () => ({ title: f('title').value.trim(), subtitle: f('subtitle').value.trim(), author: f('author').value.trim(), category: f('category').value.trim(), date: localToIso(f('date').value), tags: f('tags').value.split(',').map(x => x.trim().replace(/^#/, '')).filter(Boolean), hero: f('hero').value.trim(), md: f('md').value });
  const raw = () => Object.fromEntries(P_FIELDS.map(k => [k, f(k).value]));
  const base = JSON.stringify(raw());
  const dr = safeJSON(localStorage.getItem(dKey));
  if (dr.savedAt){ P_FIELDS.forEach(k => { if (k in dr) f(k).value = dr[k]; }); setTimeout(() => toast(`Restored your ${ed ? 'unsaved edits' : 'draft'} from ${when(dr.savedAt)}.`, 'info', 4000), 50); }
  else if (seed) setTimeout(() => toast('Imported. Review it, then publish.', 'info'), 50);
  let closed = false;
  const postId = () => ed ? ed.id : (() => { let id = slug(f('title').value).slice(0, 60) || 'post', n = 2, b = id; while (state.posts.some(p => p.id === id)) id = `${b}-${n++}`; return id; })();
  const paintM = () => { const d = safeJSON(localStorage.getItem(dKey)); $('#p-draft').hidden = !d.savedAt; if (d.savedAt) $('#p-draft-text').textContent = `Draft autosaved · ${when(d.savedAt)}`; paintDraftCount(); };
  const writeP = () => { if (closed) return; const s = raw(); storeDraft(dKey, s, JSON.stringify(s) === base); paintM(); };
  const saveP = debounce(writeP, 400);
  const code = () => buildPostBlock({ ...read(), id: postId() });
  const preview = debounce(() => { if (closed) return; const p = read(), words = (p.md.match(/\S+/g) || []).length; $('#p-frame').srcdoc = postPreviewDoc(p); $('#p-stats').textContent = `${words} words · ${readMins(p.md)} min read · ${(p.md.match(/^##\s/gm) || []).length} sections`; $('#p-id').textContent = postId(); if ($('#p-code-panel').classList.contains('open')) $('#p-code').textContent = code(); }, 250);
  const close = (keep = true) => { if (closed) return; if (keep) writeP(); closed = true; window.removeEventListener('beforeunload', writeP); root.innerHTML = ''; document.removeEventListener('keydown', onKey); if (state.view === 'blog') renderBlog(); if (keep && hasDraft(dKey)) toast('Draft kept. Pick up where you left off any time.', 'info'); };
  const onKey = e => { if (e.key === 'Escape' && !$('.modal-wrap')) close(); };
  document.addEventListener('keydown', onKey); window.addEventListener('beforeunload', writeP);
  $$('[data-close]', root).forEach(b => b.addEventListener('click', () => close()));
  const ta = f('md'), upload = cb => { if (!cfg.preset) return toast('Add a Cloudinary upload preset in Settings, or use “Image by link”.', 'info'); const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async () => { const file = i.files[0]; if (!file) return; toast('Uploading image…', 'info'); try { cb(await cloudUpload(file, 'image', () => {})); toast('Image uploaded.', 'ok'); } catch (e){ toast(e.message, 'bad'); } }; i.click(); };
  $('#p-bar').innerHTML = toolbar(MD_TOOLS, 'post'); icons();
  $('#p-bar').addEventListener('click', e => { const b = e.target.closest('[data-tool]'); if (b) mdTool(ta, b.dataset.tool, upload); });
  ta.addEventListener('keydown', e => mdKeys(e, ta, k => mdTool(ta, k, upload)));
  $('#p-hero-up').addEventListener('click', () => upload(url => { f('hero').value = url; preview(); saveP(); }));
  root.addEventListener('input', () => { preview(); saveP(); });
  $$('#p-view button').forEach(b => b.addEventListener('click', () => { $('#p-view').dataset.v = b.dataset.v; $$('#p-view button').forEach(x => x.classList.toggle('on', x === b)); $('#p-split').dataset.v = b.dataset.v; }));
  $('#p-code-panel .panel-head').addEventListener('click', () => { $('#p-code-panel').classList.toggle('open'); $('#p-code').textContent = code(); });
  const copy = () => copyText(code(), 'Post code copied.');
  $('#p-copy').addEventListener('click', copy); $('#p-copy2').addEventListener('click', e => { e.stopPropagation(); copy(); });
  $('#p-draft-discard').addEventListener('click', () => { localStorage.removeItem(dKey); close(false); openPostDrawer(ed); toast('Draft discarded.', 'info'); });
  $('#p-save-label').textContent = ed ? 'Save changes' : 'Publish post';
  $('#p-save').addEventListener('click', async () => {
    const p = read();
    if (!p.title || !p.md.trim()){ toast(!p.title ? 'Give the post a title.' : 'Write something first.', 'bad'); return (!p.title ? f('title') : ta).focus(); }
    if (!requireGitHub()) return;
    const post = { ...p, id: postId() }, block = buildPostBlock(post), btn = $('#p-save'); btn.disabled = true;
    try {
      const r = await commitFile({ path: cfg.blogPath, create: true, message: `${ed ? 'Update' : 'New'} blog post: ${post.title}`, branchKey: `post-${slug(post.title).slice(0, 40)}`, body: `${ed ? 'Updates' : 'Adds'} “${post.title}” in \`${cfg.blogPath}\` (treesh.app/blog?post=${post.id}).\n\n_Submitted with Treesh M.A.D._`, apply: t => ed ? replaceRaw(t, ed.raw, block) : insertPost(t, block) }, m => { $('#p-save-label').textContent = m; });
      localStorage.removeItem(dKey); close(false); done(r, ed ? 'post-edit' : 'post', post.title);
    } catch (e){ failModal(e); if ($('#p-save')){ btn.disabled = false; $('#p-save-label').textContent = ed ? 'Save changes' : 'Publish post'; } }
  });
  preview(); paintM(); setTimeout(() => f('title').focus(), 300);
}
function wireBlog(){
  $('#new-post').addEventListener('click', () => openPostDrawer());
  $('#import-30').addEventListener('click', () => openPostDrawer(null, POST30));
  $('#blog-search').addEventListener('input', renderBlog); $('#blog-cat').addEventListener('change', renderBlog);
  $('#blog-grid').addEventListener('click', e => { const b = e.target.closest('[data-pact]'); if (!b) return; const p = state.posts.find(x => x.id === b.dataset.id); if (!p) return; ({ copy: () => copyText(p.raw, 'Post code copied.'), edit: () => openPostDrawer(p), delete: () => deletePost(p) })[b.dataset.pact](); });
}

/* ---------- lyrics markup bar ---------- */
function paintLyrBar(){
  const ta = $('#lyr-text'); if (!ta || $('#lyr-bar')) return;
  ta.insertAdjacentHTML('beforebegin', `<div id="lyr-bar">${toolbar(LYR_TOOLS, 'lyrics')}</div>`);
  ta.insertAdjacentHTML('afterend', '<div class="md-stats" id="lyr-stats" data-testid="lyrics-stats"></div>');
  const stat = () => { if ($('#lyr-stats')) $('#lyr-stats').textContent = lyrStats(ta.value); };
  $('#lyr-bar').addEventListener('click', e => { const b = e.target.closest('[data-tool]'); if (b) lyrTool(ta, b.dataset.tool); stat(); });
  ta.addEventListener('input', stat); stat(); icons();
}

/* ---------- global search ---------- */
function searchAll(q){
  const k = normKey(q); if (!k) return [];
  const hit = (...xs) => normKey(xs.join(' ')).includes(k), out = [];
  const add = (group, ic, items) => items.slice(0, 6).forEach(x => out.push({ group, ic, ...x }));
  add('Songs', 'disc-3', state.catalog.songs.filter(s => hit(s.title, s.artist, s.h3, s.genre, s.album)).map(s => ({ t: s.title, sub: s.artist, img: s.cover, go: () => { switchView('catalog'); $('#cat-search').value = s.title; renderCatalog(); } })));
  add('Artists', 'users-round', state.roster.filter(a => hit(...Object.values(a))).map(a => ({ t: a.name, sub: a.role || '#' + a.id, go: () => { switchView('artists'); openArtistDrawer(a); } })));
  add('Models', 'camera', state.models.filter(m => hit(m.name, m.location, m.board, m.categories, m.agency)).map(m => ({ t: m.name, sub: [m.board, m.location].filter(Boolean).join(' · '), img: m.headshot, go: () => { switchView('models'); openModelDrawer(m); } })));
  add('Lyrics', 'mic-vocal', state.catalog.songs.filter(s => hit(s.title, s.artist)).map(s => ({ t: s.title, sub: 'Open in lyrics editor', go: () => { switchView('lyrics'); openLyrics(s); } })));
  add('Projects', 'disc-album', albums().filter(al => hit(JSON.stringify(al))).map(al => ({ t: al.name || al.key, sub: 'Project page', go: () => { switchView('projects'); openProject(al.key); } })));
  add('Blog posts', 'newspaper', state.posts.filter(p => hit(p.title, p.subtitle, p.tags.join(' '), p.category, p.md)).map(p => ({ t: p.title, sub: postWhen(p.date), img: p.hero, go: () => { switchView('blog'); openPostDrawer(p); } })));
  add('Drafts', 'notebook-pen', listDrafts().filter(x => hit(x.title, x.sub, DTYPES[x.type][0])).map(x => ({ t: x.title || 'Untitled', sub: DTYPES[x.type][0], go: () => resumeDraft(x, () => {}) })));
  return out;
}
function openSearch(){
  if ($('#gs-wrap')) return;
  const wrap = document.createElement('div'); wrap.className = 'modal-wrap gs-wrap'; wrap.id = 'gs-wrap';
  wrap.innerHTML = `<div class="modal gs" data-testid="global-search-modal"><label class="search"><i data-lucide="search"></i><input class="input" id="gs-q" placeholder="Search songs, artists, models, lyrics, projects, posts, drafts…" autocomplete="off" data-testid="global-search-input"></label><div class="gs-list soft-scroll" id="gs-list" data-testid="global-search-results"></div><p class="hint gs-foot"><span class="kbd">↑</span><span class="kbd">↓</span> move · <span class="kbd">Enter</span> open · <span class="kbd">Esc</span> close</p></div>`;
  $('#modal-root').appendChild(wrap); icons();
  let res = [], cur = 0;
  const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey, true); };
  const pick = i => { const r = res[i]; if (!r) return; close(); r.go(); };
  const paint = () => {
    const q = $('#gs-q').value; res = searchAll(q); cur = Math.min(cur, Math.max(0, res.length - 1));
    let g = '';
    $('#gs-list').innerHTML = !q.trim() ? '<p class="hint" style="padding:14px">Type to search everything in M.A.D.</p>' : res.length ? res.map((r, i) => `${r.group !== g ? `<div class="gs-g">${(g = r.group, esc(r.group))}</div>` : ''}<button class="gs-item ${i === cur ? 'on' : ''}" data-i="${i}" data-testid="global-search-result"><span class="gs-ic">${isUrl(r.img) ? `<img src="${esc(r.img)}" alt="">` : icon(r.ic)}</span><span class="gs-t"><b>${esc(r.t)}</b><small>${esc(r.sub || '')}</small></span></button>`).join('') : '<p class="hint" style="padding:14px" data-testid="global-search-empty">No matches.</p>';
    icons(); const on = $('.gs-item.on', wrap); if (on) on.scrollIntoView({ block:'nearest' });
  };
  const onKey = e => {
    if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); return close(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); cur = (cur + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % Math.max(1, res.length); paint(); }
    if (e.key === 'Enter'){ e.preventDefault(); pick(cur); }
  };
  document.addEventListener('keydown', onKey, true);
  wrap.addEventListener('click', e => { if (e.target === wrap) return close(); const b = e.target.closest('.gs-item'); if (b) pick(+b.dataset.i); });
  $('#gs-q').addEventListener('input', () => { cur = 0; paint(); });
  paint(); setTimeout(() => $('#gs-q').focus(), 30);
}

