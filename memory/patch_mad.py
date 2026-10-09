"""Builds /app/single_html/tools/mad.html = M.A.D. source (/app/memory/mad.src.html) + Icon mode.
Icon mode: verified Treesh Icons sign in with their Treesh account, see only their own catalog/profile/lyrics,
and every save opens a pull request through /api/icon (netlify/functions/icon.mjs) for admin approval."""
import sys, os
SRC = '/app/memory/mad.src.html'; OUT = '/app/single_html/tools/mad.html'
s = open(SRC, encoding='utf-8').read(); errs = []
def rep(old, new, cnt=1, tag=''):
    global s
    n = s.count(old)
    if n != cnt: errs.append(f'[{tag}] expected {cnt} got {n}: {old[:80]!r}'); return
    s = s.replace(old, new)

# ---- head: new Treesh favicon + Supabase client
rep('<link rel="icon" type="image/png" href="https://ik.imagekit.io/treesh/IMG_7235.png" />\n<link rel="apple-touch-icon" href="https://ik.imagekit.io/treesh/IMG_7235.png" />',
    '<link rel="icon" href="../favicon.ico?v=7255" sizes="48x48" />\n<link rel="icon" type="image/png" sizes="32x32" href="../icons/favicon-32.png?v=7255" />\n<link rel="apple-touch-icon" sizes="180x180" href="../icons/apple-touch-icon.png?v=7255" />', 1, 'favicon')
rep('<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>', 1, 'sbjs')
CSS = open('/app/memory/mad_icon.css', encoding='utf-8').read()
s = s.replace('</style>\n</head>', CSS + '\n</style>\n</head>', 1)  # first = real <head>; others are page templates

# ---- config + auth plumbing
rep("const API = '/api/github';", "let API = '/api/github';\nconst ICON_API = '/api/icon', SB_URL = 'https://oslzgpirzyrlwplejnqg.supabase.co', SB_KEY = 'sb_publishable_jsWxbY4Yv1sNO4jLQy8wVA_7KK-g5sQ', QS = new URLSearchParams(location.search);", 1, 'api')
rep("function saveCfg(){ const { owner, repo, ...keep } = cfg;", "function saveCfg(){ if (state.auth.icon) return; const { owner, repo, ...keep } = cfg;", 1, 'savecfg')
rep("headers: body ? { 'Content-Type':'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }); }",
    "headers: { ...(body ? { 'Content-Type':'application/json' } : {}), ...(await icoAuth()) }, body: body ? JSON.stringify(body) : undefined }); }", 1, 'authreq')
rep("headers:{ Accept:'application/vnd.github+json', ...(opts.body ? { 'Content-Type':'application/json' } : {}) } });",
    "headers:{ Accept:'application/vnd.github+json', ...(opts.body ? { 'Content-Type':'application/json' } : {}), ...(await icoAuth()) } });", 1, 'ghreq')
rep("async function checkSession(){ try { setAuth(await authReq('GET')); } catch (e){ state.auth = { signedIn:false, expires:null, error:e.message }; } }",
    "async function checkSession(){\n  if (QS.get('as') !== 'icon'){ try { setAuth(await authReq('GET')); } catch (e){ state.auth = { signedIn:false, expires:null, error:e.message }; } if (state.auth.signedIn) return; }\n  await icoCheck();\n}\n" + open('/app/memory/mad_icon.js', encoding='utf-8').read(), 1, 'checksession')

# ---- publishing: always a PR on the Icon's own branch, friendly result
rep("const branch = `songcoder/${branchKey}-${Date.now().toString(36)}`;", "const branch = `${state.auth.icon ? `icon/${state.auth.icon.id}` : 'songcoder'}/${branchKey}-${Date.now().toString(36)}`;", 1, 'branch')
rep("try { state.allPrs = (await gh.listPRs()).filter(p => p.head && /^songcoder\\//.test(p.head.ref)).slice(0, 50); }",
    "try { state.allPrs = (await gh.listPRs()).filter(p => p.head && (state.auth.icon ? /^icon\\// : /^songcoder\\//).test(p.head.ref)).slice(0, 50); }", 1, 'prfilter')
rep("function done(r, kind, title, extra = {}){\n", "function done(r, kind, title, extra = {}){\n  if (r.mode === 'pr' && state.auth.icon) return icoDone(r, kind, title);\n", 1, 'done')
rep("function setMode(m){\n  cfg.mode = m; saveCfg();", "function setMode(m){\n  if (state.auth.icon) m = 'pr';\n  cfg.mode = m; saveCfg();", 1, 'setmode')
rep("$('#mode-note').textContent = m === 'pr' ? 'Opens a pull request so you can approve it first.'", "$('#mode-note').textContent = state.auth.icon ? 'Goes to Treesh admins for approval first. You’ll see it on Treesh once it’s approved.' : m === 'pr' ? 'Opens a pull request so you can approve it first.'", 1, 'modenote')
rep("function reloadAll(){ updateConn(); loadRoster(); loadCatalog(); loadLyrics(); loadModels(); loadPosts(); loadWN(); }",
    "function reloadAll(){ updateConn(); loadRoster(); loadCatalog(); loadLyrics(); if (state.auth.icon) return icoDeep(); loadModels(); loadPosts(); loadWN(); }", 1, 'reload')
rep("checkSession().then(() => { reloadAll(); checkActivityAlert(); signinNotice(); });", "checkSession().then(() => { reloadAll(); if (!state.auth.icon){ checkActivityAlert(); signinNotice(); } });", 1, 'boot')
rep("function openSettings(){\n", "function openSettings(){\n  if (state.auth.icon || QS.get('as') === 'icon') return icoAccount();\n", 1, 'settings')
rep("function requireGitHub(){\n", "function requireGitHub(){\n  if (QS.get('as') === 'icon' && !signedIn()){ icoSignin(); return false; }\n", 1, 'reqgh')
rep("t.textContent = st === 'github' ? `${cfg.owner}/${cfg.repo} · ${cfg.branch}`", "t.textContent = state.auth.icon && st === 'github' ? `${state.auth.icon.name} · Icon` : st === 'github' ? `${cfg.owner}/${cfg.repo} · ${cfg.branch}`", 1, 'conn')
rep("$('#cat-count').textContent = state.catalog.songs.length || '··';", "$('#cat-count').textContent = state.catalog.songs.filter(icoSees).length || '··';", 1, 'catcount')
rep("$('#prs-list').innerHTML = state.prs.map(p => `<a class=\"pr\" href=\"${esc(p.html_url)}\"", "$('#prs-list').innerHTML = state.prs.map(p => `<a class=\"pr\" ${state.auth.icon ? '' : `href=\"${esc(p.html_url)}\"`}", 1, 'prchips')
rep("list.length ? list.map(prRow).join('')", "list.length ? list.map(icoPrRow).join('')", 1, 'prrows')

# ---- catalog: only their songs; featured songs open their verses
rep("let list = c.songs.filter(s => (!fa ||", "let list = c.songs.filter(s => icoSees(s) && (!fa ||", 1, 'catfilter')
rep("""          <button class="icon-btn" data-act="pin" title="Pin to top" data-testid="catalog-pin-btn">${icon('pin')}</button>
          <button class="icon-btn" data-act="edit" title="Edit" data-testid="catalog-edit-btn">${icon('pencil')}</button>
          <button class="icon-btn danger" data-act="delete" title="Delete" data-testid="catalog-delete-btn">${icon('trash-2')}</button></div></div></div>""",
    """          ${state.auth.icon ? '' : `<button class="icon-btn" data-act="pin" title="Pin to top" data-testid="catalog-pin-btn">${icon('pin')}</button>`}
          ${state.auth.icon && !icoMine(s) ? `<button class="icon-btn" data-act="lyrics" title="Edit my verses" data-testid="catalog-verses-btn">${icon('mic-vocal')}</button>` : `<button class="icon-btn" data-act="edit" title="Edit" data-testid="catalog-edit-btn">${icon('pencil')}</button>`}
          ${state.auth.icon ? `<button class="icon-btn" data-act="lyrics" title="Lyrics" data-testid="catalog-lyrics-btn" ${icoMine(s) ? '' : 'hidden'}>${icon('mic-vocal')}</button>` : `<button class="icon-btn danger" data-act="delete" title="Delete" data-testid="catalog-delete-btn">${icon('trash-2')}</button>`}</div></div></div>""", 1, 'cardbtns')
rep("<div class=\"inf\"><h3 title=\"${esc(s.title)}\" data-testid=\"catalog-song-title\">${esc(s.title)}</h3><p>${esc(s.h3 || s.artist)}</p>",
    "<div class=\"inf\"><h3 title=\"${esc(s.title)}\" data-testid=\"catalog-song-title\">${esc(s.title)}</h3><p>${esc(s.h3 || s.artist)}</p>${state.auth.icon ? `<span class=\"ico-role ${icoMine(s) ? 'main' : ''}\" data-testid=\"catalog-icon-role\">${icoMine(s) ? 'Your song' : 'You’re featured'}</span>` : ''}", 1, 'cardrole')
rep("    if (a.dataset.act === 'edit') startEdit(s);\n    if (a.dataset.act === 'pin') pinSong(s);",
    "    if (a.dataset.act === 'edit') startEdit(s);\n    if (a.dataset.act === 'lyrics'){ switchView('lyrics'); openLyrics(s); }\n    if (a.dataset.act === 'pin') pinSong(s);", 1, 'catclick')
rep("function startEdit(s){\n  if (!requireGitHub()) return;", "function startEdit(s){\n  if (!requireGitHub()) return;\n  if (state.auth.icon && !icoMine(s)){ switchView('lyrics'); return openLyrics(s); }", 1, 'startedit')
rep("  paintDraft(); switchView('compose'); window.scrollTo({ top:0, behavior:'smooth' });\n}", "  paintDraft(); icoForm(); switchView('compose'); window.scrollTo({ top:0, behavior:'smooth' });\n}", 1, 'startedit2')
rep("refreshAll(); paintDraft(); renderCatalog();\n}", "refreshAll(); paintDraft(); renderCatalog(); icoForm();\n}", 1, 'exitedit')
rep("  localStorage.removeItem(DRAFT_KEY); refreshAll();\n}", "  localStorage.removeItem(DRAFT_KEY); icoForm(); refreshAll();\n}", 1, 'resetform')
for fn, tag in [("async function deleteSong(s){\n", 'del'), ("async function pinSong(s){\n", 'pin'), ("function startReorder(){\n", 'reorder'), ("function openBulk(){\n", 'bulk'), ("async function fixBannerPositions(){\n", 'fixbn'), ("async function deleteArtist(a){\n", 'delart')]:
    rep(fn, fn + "  if (state.auth.icon) return toast('Ask a Treesh admin for that one.', 'info');\n", 1, tag)
rep("function readForm(){\n  return {", "function readForm(){\n  return icoRead({", 1, 'readform')
rep("label: $('#f-label').value, release: localToIso(val('f-release')), ...state.flags };\n}", "label: $('#f-label').value, release: localToIso(val('f-release')), ...state.flags });\n}", 1, 'readform2')
rep("const r = await commitChange({ kind, block: buildBlock(f, editing), target: editing,", "const r = await commitChange({ kind, block: icoFixBlock(buildBlock(f, editing), editing), target: editing,", 1, 'fixblock')
rep("  $('#roster').addEventListener('click', e => {\n    const b = e.target.closest('.ros'); if (!b) return;", "  $('#roster').addEventListener('click', e => {\n    const b = e.target.closest('.ros'); if (!b || (state.auth.icon && state.editing)) return;", 1, 'roster')
rep("$('#feat-box').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b){", "$('#feat-box').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (state.auth.icon && state.editing) return; if (b){", 1, 'featbox')

# ---- artists: only their own profile; name stays admin-only
rep("alist = state.roster.filter(a => !aq ||", "alist = state.roster.filter(a => (!state.auth.icon || a.id === String(state.auth.icon.id)) && (!aq ||", 1, 'artfilter')
rep("normKey(Object.values(a).join(' ')).includes(aq));", "normKey(Object.values(a).join(' ')).includes(aq)));", 1, 'artfilter2')
rep("function openArtistDrawer(ed){\n  if (!requireGitHub()) return;", "function openArtistDrawer(ed){\n  if (!requireGitHub()) return;\n  if (state.auth.icon && (!ed || ed.id !== String(state.auth.icon.id))) return toast('You can edit your own Icon profile only.', 'info');", 1, 'artdrawer')
rep("  setMode(cfg.mode); preview(); icons();\n  setTimeout(() => $('#a-name').focus(), 300);", "  setMode(cfg.mode); preview(); icons();\n  if (state.auth.icon){ $('#a-name').readOnly = true; $('.drawer', root).classList.add('ico-drawer'); }\n  setTimeout(() => $(state.auth.icon ? '#a-bio' : '#a-name').focus(), 300);", 1, 'artdrawer2')

# ---- lyrics: their songs; on features only their own verses
rep("songs = state.catalog.songs.filter(s => !q ||", "songs = state.catalog.songs.filter(s => icoSees(s) && (!q ||", 1, 'lyrlist')
rep("normKey(s.title + s.artist + s.h3).includes(q));", "normKey(s.title + s.artist + s.h3).includes(q)));", 1, 'lyrlist2')
rep("const firstUnsynced = () => { const i = state.lyr.lines.findIndex(l => !isHdr(l.text) && l.t == null);", "const firstUnsynced = () => { const i = state.lyr.lines.findIndex((l, k) => !isHdr(l.text) && l.t == null && !icoLocked(k));", 1, 'firstuns')
rep("  if (L.mode === 'write'){ b.innerHTML = `<textarea", "  if (L.mode === 'write' && icoLyrFeat()){ b.innerHTML = icoSecHtml(); icons(); return refreshLyrCode(); }\n  if (L.mode === 'write'){ b.innerHTML = `<textarea", 1, 'lyrwrite')
rep("return `<li class=\"lr ${h ? 'hdr' : ''} ${i === L.cur ? 'cur' : ''}\"", "return `<li class=\"lr ${h ? 'hdr' : ''} ${i === L.cur ? 'cur' : ''} ${icoLocked(i) ? 'ico-lock' : ''}\"", 1, 'lrlock')
rep("aria-label=\"Time for line ${i + 1}\" data-testid=\"lyrics-line-time\">", "aria-label=\"Time for line ${i + 1}\"${icoLocked(i) ? ' disabled' : ''} data-testid=\"lyrics-line-time\">", 1, 'lrlock2')
rep("function syncFromText(){\n  const L = state.lyr, ta = $('#lyr-text'); if (!ta) return;", "function syncFromText(){\n  if (icoLyrFeat()) return icoSyncSecs();\n  const L = state.lyr, ta = $('#lyr-text'); if (!ta) return;", 1, 'syncfrom')
rep("let i = L.cur; while (i < L.lines.length && isHdr(L.lines[i].text)) i++;", "let i = L.cur; while (i < L.lines.length && (isHdr(L.lines[i].text) || icoLocked(i))) i++;", 1, 'stamp')
rep("L.lines.forEach(l => { l.t = null; }); L.undo = [];", "L.lines.forEach((l, k) => { if (!icoLocked(k)) l.t = null; }); L.undo = [];", 1, 'clearall')
rep("  if (a === 'explain'){ L.open.has(n)", "  if ((a === 'explain' || a === 'clear') && icoLocked(n)) return;\n  if (a === 'explain'){ L.open.has(n)", 1, 'explain')
rep("    if (e.target.id === 'lyr-text'){ L.dirty = true; refreshLyrCodeSoon(); }", "    if (e.target.id === 'lyr-text' || e.target.classList.contains('ico-sec-ta')){ L.dirty = true; refreshLyrCodeSoon(); }", 1, 'lyrinput')
rep("  const ps = lines.map(l => { const ex = l.explain ? ` data-explain=\"${esc(l.explain)}\"` : ''; return isHdr(l.text) ? `<p${ex}>${escText(l.text)}</p>` : l.t != null ? `<p data-minutes=\"${fmtTc(l.t)}\"${ex}>${escText(l.text)}</p>` : `<p data-seconds=\"\"${ex}>${escText(l.text)}</p>`; });\n",
    "  const ps = lines.map(l => { const ex = l.explain ? ` data-explain=\"${esc(l.explain)}\"` : ''; return isHdr(l.text) ? `<p${ex}>${escText(l.text)}</p>` : l.t != null ? `<p data-minutes=\"${fmtTc(l.t)}\"${ex}>${escText(l.text)}</p>` : `<p data-seconds=\"\"${ex}>${escText(l.text)}</p>`; });\n  if (state.auth.icon && orig) return icoLyricBlock(orig, ps);\n", 1, 'lyrblock')
rep("async function openLyrics(s){\n", "async function openLyrics(s){\n  if (state.auth.icon && !icoSees(s)) return toast('That song isn’t one of yours.', 'info');\n", 1, 'openlyr')
rep("  state.lyr.cur = firstUnsynced();\n  renderLyrics();", "  state.lyr.cur = firstUnsynced();\n  renderLyrics(); icoLyrNote();", 1, 'openlyr2')

if errs: print('\n'.join(errs)); sys.exit(1)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(s); print('ok', OUT, len(s))
