/* ---------- projects ---------- */
state.project = null;
const SITE_URL = 'https://treesh.app';
const projUrl = p => `${SITE_URL}/${cfg.projectsDir.replace(/^\/+|\/+$/g, '')}/${p.slug}`;
const projPath = p => `${cfg.projectsDir.replace(/^\/+|\/+$/g, '')}/${p.slug}.html`;
function albums(){
  const m = new Map();
  state.catalog.songs.forEach(s => { if (!s.album) return; const k = normKey(s.album); if (!m.has(k)) m.set(k, { key: k, name: s.album, songs: [] }); m.get(k).songs.push(s); });
  return [...m.values()].sort((a, b) => b.songs.length - a.songs.length || a.name.localeCompare(b.name));
}
function projDefaults(al){
  const cnt = {}; al.songs.forEach(s => { cnt[s.artist] = (cnt[s.artist] || 0) + 1; });
  const artist = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || '';
  const dated = al.songs.map(s => ({ s, t: /\d{4}/.test(s.date) ? Date.parse(s.date) : NaN })).filter(x => !isNaN(x.t)).sort((a, b) => a.t - b.t);
  return { title: al.name, artist, cover: (al.songs.find(s => s.cover) || {}).cover || '', date: dated.length ? dated[0].s.date : (al.songs.find(s => s.date) || {}).date || '', desc: '', slug: slug(al.name) };
}
function renderProjects(){
  const grid = $('#proj-grid'), ed = $('#proj-editor');
  grid.hidden = !!state.project; ed.hidden = !state.project;
  if (state.project) return renderProjEditor();
  const list = albums();
  grid.innerHTML = list.length ? list.map((al, i) => { const d = projDefaults(al); return `<button class="song proj-card" data-key="${esc(al.key)}" style="animation-delay:${Math.min(i, 12) * 30}ms;text-align:left" data-testid="project-card"><div class="cv">${d.cover ? `<img src="${esc(d.cover)}" alt="" loading="lazy">` : ''}</div><div class="inf"><h3 data-testid="project-card-title">${esc(al.name)}</h3><p>${esc(d.artist)}</p><div class="row"><span class="g" data-testid="project-card-count">${al.songs.length} track${al.songs.length > 1 ? 's' : ''}</span>${d.date ? `<span class="g">${esc(d.date)}</span>` : ''}</div></div></button>`; }).join('')
    : `<div class="empty" data-testid="projects-empty">${icon('disc-album')}<b>No projects yet</b><span>Give songs the same “Album / project” in Compose and they’ll group here.</span></div>`;
  icons();
}
function openProject(key){
  const al = albums().find(a => a.key === key); if (!al) return;
  state.project = { ...projDefaults(al), tracks: [...al.songs], all: [...al.songs], status: '' };
  renderProjects(); window.scrollTo(0, 0); checkProject();
}
async function checkProject(){
  const p = state.project; if (!p) return;
  if (!hasToken()){ p.status = 'unknown'; return paintProjStatus(); }
  p.status = 'checking'; paintProjStatus();
  try { await gh.getFile(projPath(p), cfg.branch); p.status = 'published'; } catch (e){ p.status = e.status === 404 ? 'new' : 'unknown'; }
  paintProjStatus();
}
function paintProjStatus(){
  const el = $('#proj-status'), p = state.project; if (!el || !p) return;
  const m = { checking:['', 'Checking…'], published:['sync', 'Published'], new:['plain', 'Not published yet'], unknown:['', 'Status unknown'] }[p.status] || ['', ''];
  el.className = `lchip ${m[0]}`; el.textContent = m[1];
  const lbl = $('#proj-save-label'); if (lbl && !state.busy) lbl.textContent = `${p.status === 'published' ? 'Update' : 'Publish'} page${cfg.mode === 'pr' ? ' (PR)' : ''}`;
}
function buildProjectPage(p){
  const tracks = p.tracks.map(s => ({ t: s.title, a: s.h3 || s.artist, src: s.mp3, c: s.cover || p.cover, e: s.explicit, r: s.release || '' }));
  const data = JSON.stringify({ cover: p.cover, tracks }).replace(/</g, '\\u003c');
  const n = tracks.length, desc = p.desc || `${p.title} by ${p.artist} — ${n} track${n === 1 ? '' : 's'} on Treesh.`;
  const svg = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
  const PLAY = 'M8 5v14l11-7z', PREV = 'M6 6h2v12H6zm3.5 6 8.5 6V6z', NEXT = 'M16 6h2v12h-2zM6 18l8.5-6L6 6z';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escText(p.title)} · ${escText(p.artist)} · Treesh</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="music.album">
<meta property="og:title" content="${esc(p.title)} by ${esc(p.artist)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(p.cover)}">
<meta property="og:url" content="${esc(projUrl(p))}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a0a0b">
<link rel="icon" href="https://ik.imagekit.io/treesh/IMG_5825.png">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&family=Special+Gothic+Expanded+One&family=Doto:wght@700..900&display=swap" rel="stylesheet">
<style>
:root{--p:#9328ff;--p2:#b779ff;--bg:#0a0a0b;--t:#f5f5f7;--m:rgba(245,245,247,.6);--s:rgba(255,255,255,.08)}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--t);font-family:Manrope,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.bg{position:fixed;inset:-10%;z-index:0;background:url("${esc(p.cover)}") center/cover;filter:blur(90px) saturate(1.4);opacity:.35;pointer-events:none}
main{position:relative;z-index:1;max-width:1000px;margin:0 auto;padding:32px 20px 150px}
.top{display:inline-flex;align-items:center;gap:10px;margin-bottom:44px;color:var(--t);text-decoration:none;font-family:'Special Gothic Expanded One',sans-serif;font-size:13px;letter-spacing:.2em}
.top img{width:32px;height:32px;border-radius:10px}
.hero{display:grid;grid-template-columns:minmax(0,320px) 1fr;gap:40px;align-items:end}
.cv{display:block;width:100%;aspect-ratio:1;border-radius:28px;object-fit:cover;background:#18181c;box-shadow:0 40px 90px rgba(0,0,0,.6)}
.ey{font-size:11px;font-weight:800;letter-spacing:.3em;text-transform:uppercase;color:var(--p2)}
h1{margin:10px 0 10px;font-family:'Special Gothic Expanded One',sans-serif;font-weight:400;font-size:clamp(30px,5.2vw,56px);line-height:1.04;word-break:break-word}
.by{font-size:18px;font-weight:700}
.meta{margin-top:8px;color:var(--m);font-size:14px}.meta b{font-family:Doto,monospace;font-weight:900;color:var(--t)}
.desc{margin:18px 0 0;max-width:560px;color:var(--m);line-height:1.6;white-space:pre-line}
.all{display:inline-flex;align-items:center;gap:10px;margin-top:24px;padding:14px 26px;border:0;border-radius:999px;background:var(--p);color:#fff;font:700 15px Manrope,sans-serif;cursor:pointer;box-shadow:0 0 34px rgba(147,40,255,.45);transition:transform .15s}
.all:active{transform:scale(.96)}
ol{list-style:none;margin:48px 0 0;padding:0}
li{display:grid;grid-template-columns:40px 50px minmax(0,1fr) auto;gap:14px;align-items:center;padding:10px;border-radius:16px;cursor:pointer;transition:background-color .2s}
li:hover{background:rgba(255,255,255,.05)}li.on{background:rgba(147,40,255,.18)}
li .n{font-family:Doto,monospace;font-weight:900;text-align:center;color:var(--p2)}
li img{width:50px;height:50px;border-radius:12px;object-fit:cover;background:#18181c}
li b,li small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}li b{font-size:15px}li small{margin-top:2px;color:var(--m);font-size:13px}
.e{display:inline-block;margin-left:6px;padding:0 5px;border-radius:4px;background:#fff;color:#000;font-size:10px;font-weight:800;vertical-align:2px}
.d{font-family:Doto,monospace;font-weight:800;font-size:14px;color:var(--m)}
li.lock{cursor:not-allowed;opacity:.55}li.lock .d{color:#ffb37d;font-family:Manrope,sans-serif;font-size:12px;font-weight:700}
.bar{position:fixed;left:12px;right:12px;bottom:12px;z-index:5;max-width:1000px;margin:0 auto;display:none;align-items:center;gap:12px;padding:10px 14px 14px 10px;border-radius:26px;background:rgba(18,18,20,.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--s);box-shadow:0 20px 60px rgba(0,0,0,.6)}
.bar.on{display:flex}.bar img{width:46px;height:46px;border-radius:14px;object-fit:cover}
.bar .i{flex:1;min-width:0}.bar .i b,.bar .i small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bar .i small{color:var(--m);font-size:12px}
.bar button{display:grid;place-items:center;width:42px;height:42px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;cursor:pointer}
.bar .pp{background:var(--p)}
.pg{position:absolute;left:20px;right:20px;bottom:6px;height:3px;border-radius:3px;background:var(--s);overflow:hidden}.pg i{display:block;height:100%;width:0;background:var(--p)}
.foot{margin-top:40px;color:var(--m);font-size:13px}.foot a{color:var(--p2)}
@media (max-width:720px){.hero{grid-template-columns:1fr;gap:24px}.cv{max-width:320px}li{grid-template-columns:28px 44px minmax(0,1fr) auto;gap:10px;padding:8px}li img{width:44px;height:44px}}
</style>
</head>
<body>
<div class="bg"></div>
<main>
<a class="top" href="${SITE_URL}"><img src="https://ik.imagekit.io/treesh/IMG_5825.png" alt="">TREESH</a>
<section class="hero">
<img class="cv" src="${esc(p.cover)}" alt="${esc(p.title)} cover">
<div>
<div class="ey">${n > 1 ? 'Project' : 'Single'}</div>
<h1>${escText(p.title)}</h1>
<div class="by">${escText(p.artist)}</div>
<div class="meta">${p.date ? escText(p.date) + ' · ' : ''}<b>${n}</b> track${n === 1 ? '' : 's'}</div>
${p.desc ? `<p class="desc">${escText(p.desc)}</p>` : ''}
<button class="all" id="all">${svg(PLAY)}Play all</button>
</div>
</section>
<ol id="list">
${tracks.map((t, i) => `<li data-i="${i}"><span class="n">${i + 1}</span><img src="${esc(t.c)}" alt="" loading="lazy"><span><b>${escText(t.t)}${t.e ? '<span class="e">E</span>' : ''}</b><small>${escText(t.a)}</small></span><span class="d"></span></li>`).join('\n')}
</ol>
<p class="foot">Listen to more on <a href="${SITE_URL}">treesh.app</a></p>
</main>
<div class="bar" id="bar"><img id="bc" alt=""><div class="i"><b id="bt"></b><small id="ba"></small></div><button id="bp" aria-label="Previous">${svg(PREV)}</button><button class="pp" id="bpp" aria-label="Play or pause">${svg(PLAY)}</button><button id="bn" aria-label="Next">${svg(NEXT)}</button><div class="pg"><i id="bpg"></i></div></div>
<script>
var D = ${data}, A = new Audio(), cur = -1, rows = [].slice.call(document.querySelectorAll('#list li'));
var PLAY = '${PLAY}', PAUSE = 'M6 5h4v14H6zm8 0h4v14h-4z';
function g(id){ return document.getElementById(id); }
function fmt(s){ return isFinite(s) ? Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2) : ''; }
function locked(t){ return t.r && new Date(t.r) > Date.now(); }
function icon(d){ g('bpp').querySelector('path').setAttribute('d', d); }
function play(i){
  if (i < 0 || i >= D.tracks.length) return;
  var t = D.tracks[i]; if (locked(t)) return;
  if (i === cur){ A.paused ? A.play() : A.pause(); return; }
  cur = i; A.src = t.src; A.play();
  g('bc').src = t.c || D.cover; g('bt').textContent = t.t; g('ba').textContent = t.a; g('bar').classList.add('on');
  rows.forEach(function(r, k){ r.classList.toggle('on', k === i); });
}
function step(dir){ for (var i = cur + dir; i >= 0 && i < D.tracks.length; i += dir){ if (!locked(D.tracks[i])) return play(i); } }
rows.forEach(function(r, i){
  var t = D.tracks[i], d = r.querySelector('.d');
  r.onclick = function(){ play(i); };
  if (locked(t)){ r.classList.add('lock'); d.textContent = 'Drops ' + new Date(t.r).toLocaleDateString('en-US', { month:'short', day:'numeric' }); return; }
  var m = new Audio(); m.preload = 'metadata'; m.src = t.src; m.onloadedmetadata = function(){ d.textContent = fmt(m.duration); };
});
g('all').onclick = function(){ for (var i = 0; i < D.tracks.length; i++){ if (!locked(D.tracks[i])) return play(i); } };
g('bpp').onclick = function(){ cur < 0 ? g('all').onclick() : (A.paused ? A.play() : A.pause()); };
g('bp').onclick = function(){ step(-1); }; g('bn').onclick = function(){ step(1); };
A.onplay = function(){ icon(PAUSE); }; A.onpause = function(){ icon(PLAY); }; A.onended = function(){ step(1); };
A.ontimeupdate = function(){ g('bpg').style.width = (A.duration ? A.currentTime / A.duration * 100 : 0) + '%'; };
<\/script>
</body>
</html>
`;
}
function renderProjEditor(){
  const p = state.project, ed = $('#proj-editor');
  const f = (id, k, label, ph, tid, extra = '') => `<div class="field"><label for="${id}">${label}</label><input class="input" id="${id}" data-pk="${k}" value="${esc(p[k])}" placeholder="${ph}" ${extra} data-testid="${tid}"></div>`;
  ed.innerHTML = `<div class="proj-head"><button class="btn btn-sm" data-pact="back" data-testid="project-back-btn">${icon('arrow-left')}All projects</button><span class="lchip" id="proj-status" data-testid="project-status"></span></div>
  <div class="proj-layout">
    <div class="proj-form">
      <div class="card"><div class="card-head"><span class="num">01</span><h2>Project page</h2><p>Defaults come from the tracks</p></div>
        <div class="grid2">
          <div class="span2">${f('p-title', 'title', 'Project title', 'Album name', 'project-title-input')}</div>
          ${f('p-artist', 'artist', 'Artist', 'Main artist', 'project-artist-input', 'list="roster-list"')}
          ${f('p-date', 'date', 'Release date', 'May 10, 2025', 'project-date-input')}
          <div class="span2">${f('p-cover', 'cover', 'Cover link', 'https://…', 'project-cover-input')}</div>
          <div class="span2">${f('p-slug', 'slug', 'Page address', 'love-the-experience', 'project-slug-input')}<p class="hint" id="p-url" data-testid="project-url"></p></div>
          <div class="field span2"><label for="p-desc">Description</label><textarea class="textarea" id="p-desc" data-pk="desc" placeholder="What’s this project about?" data-testid="project-desc-input">${esc(p.desc)}</textarea></div>
        </div>
      </div>
      <div class="card"><div class="card-head"><span class="num">02</span><h2>Tracklist</h2><p><button type="button" class="lbl-action" data-pact="resettracks" data-testid="project-reset-tracks-btn">Reset</button></p></div>
        <ol class="cat-list" id="p-tracks" data-testid="project-tracklist"></ol>
      </div>
    </div>
    <div class="proj-prev"><div class="lbl-row">${icon('eye')}Live preview</div><iframe id="p-frame" sandbox="allow-scripts" title="Project page preview" data-testid="project-preview-frame"></iframe></div>
  </div>
  <div class="lyr-foot proj-foot"><div class="seg mode-seg" data-mode="${cfg.mode}" data-testid="project-mode-toggle"><span class="ind"></span><button type="button" data-mode="pr" class="${cfg.mode === 'pr' ? 'on' : ''}" data-testid="project-mode-pr-btn">${icon('git-pull-request')}<span class="t">Review</span></button><button type="button" data-mode="live" class="${cfg.mode === 'live' ? 'on' : ''}" data-testid="project-mode-live-btn">${icon('zap')}<span class="t">Go live</span></button></div><button class="btn" data-pact="copy" data-testid="project-copy-code-btn">${icon('copy')}Copy code</button><button class="btn btn-primary" data-pact="publish" id="proj-save" data-testid="project-publish-btn">${icon('globe')}<span id="proj-save-label">Publish page</span></button></div>`;
  renderProjTracks(); refreshProjPreview(); paintProjStatus(); icons();
}
function renderProjTracks(){
  const p = state.project;
  $('#p-tracks').innerHTML = p.tracks.length ? p.tracks.map((s, i) => `<li class="ro-row" data-n="${i}" data-testid="project-track-row"><span class="pos">${String(i + 1).padStart(2, '0')}</span><img ${s.cover ? `src="${esc(s.cover)}"` : ''} alt=""><div class="t"><b>${esc(s.title)}</b><small>${esc(s.h3 || s.artist)}</small></div><div class="mv"><button type="button" class="icon-btn" data-pact="up" title="Move up" data-testid="project-track-up-btn">${icon('chevron-up')}</button><button type="button" class="icon-btn" data-pact="down" title="Move down" data-testid="project-track-down-btn">${icon('chevron-down')}</button><button type="button" class="icon-btn danger" data-pact="drop" title="Leave off this page" data-testid="project-track-remove-btn">${icon('x')}</button></div></li>`).join('') : '<p class="hint">No tracks. Press Reset to bring them back.</p>';
  icons();
}
const refreshProjPreview = debounce(() => {
  const p = state.project, fr = $('#p-frame'); if (!p || !fr) return;
  fr.srcdoc = buildProjectPage(p);
  $('#p-url').textContent = `Lives at ${projUrl(p)}`;
}, 300);
async function projAction(btn){
  const p = state.project, a = btn.dataset.pact, row = btn.closest('.ro-row'), n = row ? +row.dataset.n : -1;
  if (a === 'back'){ state.project = null; return renderProjects(); }
  if (a === 'copy') return copyText(buildProjectPage(p), 'Page code copied.');
  if (a === 'publish') return publishProject();
  if (a === 'resettracks') p.tracks = [...p.all];
  if (a === 'up' && n > 0) p.tracks.splice(n - 1, 0, p.tracks.splice(n, 1)[0]);
  if (a === 'down' && n < p.tracks.length - 1) p.tracks.splice(n + 1, 0, p.tracks.splice(n, 1)[0]);
  if (a === 'drop') p.tracks.splice(n, 1);
  renderProjTracks(); refreshProjPreview();
}
async function publishProject(){
  const p = state.project; if (state.busy) return;
  const errs = [!p.title && 'a title', !p.artist && 'an artist', !isUrl(p.cover) && 'a cover link', !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) && 'a page address (lowercase letters, numbers and dashes)', !p.tracks.length && 'at least one track'].filter(Boolean);
  if (errs.length) return toast(`Add ${errs.join(', ')}.`, 'bad', 4000);
  if (!requireGitHub()) return;
  const btn = $('#proj-save'), lbl = $('#proj-save-label'), upd = p.status === 'published';
  state.busy = true; btn.disabled = true;
  try {
    const r = await commitFile({ path: projPath(p), create: true, apply: () => buildProjectPage(p), message: `${upd ? 'Update' : 'Publish'} project page: ${p.title} — ${p.artist}`, branchKey: `project-${p.slug.slice(0, 40)}`,
      body: `${upd ? 'Updates' : 'Publishes'} the project page for **${p.title}** by ${p.artist} at \`${projPath(p)}\` (${projUrl(p)}).\n\n${p.tracks.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}\n\n<img src="${p.cover}" width="160">\n\n_Submitted with Song Coder_` }, s => { lbl.textContent = s; });
    if (r.mode === 'live') p.status = 'published';
    done(r, 'project', p.title, { href: projUrl(p) });
  } catch (e){ failModal(e); }
  finally { state.busy = false; btn.disabled = false; paintProjStatus(); }
}
function wireProjects(){
  $('#proj-grid').addEventListener('click', e => { const c = e.target.closest('.proj-card'); if (c) openProject(c.dataset.key); });
  const ed = $('#proj-editor');
  ed.addEventListener('click', e => { const b = e.target.closest('[data-pact]'); if (b && !b.disabled) projAction(b); });
  ed.addEventListener('input', e => { const k = e.target.dataset.pk; if (!k || !state.project) return; state.project[k] = k === 'desc' ? e.target.value.trim() : e.target.value.trim(); refreshProjPreview(); });
  ed.addEventListener('change', e => { if (e.target.id === 'p-slug'){ const v = slug(e.target.value); e.target.value = state.project.slug = v; refreshProjPreview(); checkProject(); } });
}

