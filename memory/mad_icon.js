/* ---------- Icon mode: verified Treesh Icons edit their own content, every save is a PR for admin approval ---------- */
const sbc = (() => { try { return window.supabase ? window.supabase.createClient(SB_URL, SB_KEY, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:false } }) : null; } catch { return null; } })();
async function icoToken(){ if (!sbc) return ''; try { const { data } = await sbc.auth.getSession(); return (data && data.session && data.session.access_token) || ''; } catch { return ''; } }
async function icoAuth(){ if (!state.auth.icon) return {}; const t = await icoToken(); return t ? { Authorization: 'Bearer ' + t } : {}; }
const icoName = n => normKey(n) === normKey(state.auth.icon.name);
const icoMine = s => !state.auth.icon || splitNames(s.artist).some(icoName);
const icoFeat = s => !!state.auth.icon && !icoMine(s) && (String(s.ids || '').split(',').map(x => x.trim()).includes(state.auth.icon.id) || splitNames(s.featuring).some(icoName));
const icoSees = s => !state.auth.icon || icoMine(s) || icoFeat(s);
async function icoCheck(force){
  const want = force || QS.get('as') === 'icon', tok = await icoToken();
  if (!tok){ if (want) setTimeout(icoSignin, 300); return false; }
  let r = null, d = null;
  try { r = await fetch(`${ICON_API}/session`, { headers:{ Authorization:'Bearer ' + tok }, cache:'no-store' }); d = await r.json(); } catch {}
  if (r && r.ok && d && d.kind === 'icon' && d.icon){ icoApply(d); return true; }
  if (want){
    const msg = (d && d.message) || (r && r.status === 404 ? 'Icon editing isn’t switched on here yet. Open M.A.D. on treesh.app.' : 'Couldn’t reach the M.A.D. server. Check your connection.');
    state.auth = { signedIn:false, expires:null, error:msg }; setTimeout(() => icoDenied(msg, d && d.code), 300);
  }
  return false;
}
function icoApply(d){
  state.auth = { signedIn:true, expires:null, login:d.icon.name, oauth:false, error:'', icon:{ id:String(d.icon.id), name:d.icon.name, image:d.icon.image || '' } };
  API = ICON_API;
  cfg = { ...DEFAULTS, mode:'pr', branch:d.branch || 'main', ...(d.files ? { songsPath:d.files.songs, lyricsPath:d.files.lyrics, iconsPath:d.files.icons } : {}), ...(d.cloud ? { cloudName:d.cloud.name, preset:d.cloud.preset, folder:d.cloud.folder } : { preset:'' }) };
  document.documentElement.classList.add('icon-mode');
  $('#compose-sub').textContent = 'Fill in your track and preview it live. Treesh admins approve it before it shows up on Treesh.';
  const st = $('#open-settings'); if (st){ st.title = 'Your Icon account'; st.setAttribute('aria-label', 'Your Icon account'); st.innerHTML = state.auth.icon.image ? `<img class="ico-av" src="${esc(state.auth.icon.image)}" alt="" data-testid="icon-account-avatar">` : icon('user-round'); }
  setMode('pr'); icoForm(); updateConn(); moveInd(); icons();
  if (!sessionStorage.getItem('mad_icon_hi')){ sessionStorage.setItem('mad_icon_hi', '1'); toast(`Signed in as ${d.icon.name}. Your edits go to Treesh admins for approval.`, 'ok', 4200); }
}
function icoSignin(){
  if ($('[data-testid="icon-signin-modal"]')) return;
  modal({ title:'Sign in as a Treesh Icon', ico:'badge-check', testid:'icon-signin-modal',
    body:`<p>Use the Treesh account with your verified Icon badge. Your changes go to Treesh admins for approval.</p><div class="ico-form"><input class="input" id="ico-email" type="email" placeholder="Email" autocomplete="email" data-testid="icon-signin-email"><input class="input" id="ico-pass" type="password" placeholder="Password" autocomplete="current-password" data-testid="icon-signin-password"><p class="ico-err" id="ico-err" hidden data-testid="icon-signin-error"></p></div>`,
    actions:[{ label:'Open Treesh', href:'../', testid:'icon-signin-open-treesh' }, { label:'Sign in', kind:'btn-primary', icon:'log-in', testid:'icon-signin-submit', onClick: async c => {
      const em = val('ico-email'), pw = $('#ico-pass').value, er = $('#ico-err'), b = $('[data-testid="icon-signin-submit"]'), say = m => { er.hidden = false; er.textContent = m; b.disabled = false; };
      if (!em || !pw) return say('Enter your email and password.');
      if (!sbc) return say('Treesh accounts can’t load right now. Check your connection.');
      b.disabled = true;
      const { error } = await sbc.auth.signInWithPassword({ email: em, password: pw });
      if (error) return say(/invalid/i.test(error.message) ? 'Wrong email or password.' : error.message);
      c(); if (await icoCheck(true)) reloadAll();
    } }] });
  setTimeout(() => { const e = $('#ico-email'); if (e) e.focus(); const p = $('#ico-pass'); if (p) p.addEventListener('keydown', e2 => { if (e2.key === 'Enter') $('[data-testid="icon-signin-submit"]').click(); }); }, 250);
}
function icoDenied(msg, code){
  modal({ title:'Icon editing is for verified Icons', ico:'shield-alert', tone:'danger', testid:'icon-denied-modal', body:`<p data-testid="icon-denied-message">${esc(msg)}</p>`, actions:[{ label:'Close', testid:'icon-denied-close' }, ...(code === 'session' ? [{ label:'Sign in', kind:'btn-primary', icon:'log-in', testid:'icon-denied-signin', onClick: c => { c(); icoSignin(); } }] : [])] });
}
function icoAccount(){
  const I = state.auth.icon; if (!I) return icoSignin();
  modal({ title:I.name, ico:'badge-check', testid:'icon-account-modal', body:`<p>Signed in with your Treesh Icon account (#${esc(I.id)}).</p><p>Edit your songs, your verses on features and your Icon profile. Every change goes to Treesh admins for approval first.</p>`,
    actions:[{ label:'Close', testid:'icon-account-close' }, { label:'My requests', kind:'btn-primary', icon:'git-pull-request', testid:'icon-account-requests', onClick: c => { c(); openPrPanel(); } }] });
}
function icoDone(r, kind, title){
  const what = { add:'Your new song', edit:'Your changes', lyrics:'Your lyrics', 'artist-edit':'Your profile changes' }[kind] || 'Your changes';
  modal({ title:'Sent for approval', ico:'send', tone:'success', testid:'publish-success-modal', body:`<p><b data-testid="icon-request-number">#${r.pr.number}</b> · ${esc(String(r.pr.title || '').replace(/^\[Icon\][^:]*:\s*/, ''))}</p><p>${what} for “${esc(title)}” show up on Treesh once a Treesh admin approves ${kind === 'add' ? 'the song' : 'them'}. Track it under My requests.</p>`,
    actions:[{ label:'Close', testid:'success-close-btn' }, { label:'My requests', kind:'btn-primary', icon:'git-pull-request', testid:'success-open-requests', onClick: c => { c(); openPrPanel(); } }] });
}
function icoForm(){
  const I = state.auth.icon; if (!I) return; const e = state.editing, fa = $('#f-artist');
  fa.readOnly = true; if (!e) fa.value = I.name;
  $('#f-title').readOnly = !!e; $('#f-label').disabled = true;
  $('#feat-box').classList.toggle('ico-locked', !!e); $('#roster').classList.toggle('ico-locked', !!e);
}
function icoRead(f){
  const I = state.auth.icon; if (!I) return f; const e = state.editing;
  if (e) return { ...f, title:e.title, artist:e.artist, featured:splitNames(e.featuring), ids:e.ids.split(',').map(x => x.trim()).filter(Boolean), label:e.label, exclusive:e.exclusive, treeshchoice:e.treeshchoice };
  return { ...f, artist:I.name, ids:[I.id, ...f.ids.filter(x => x !== I.id)], label:'', exclusive:false, treeshchoice:false };
}
/* locked catalog fields keep their exact original values so the server's scope check passes */
function icoFixBlock(block, orig){
  if (!state.auth.icon || !orig) return block;
  const i = block.indexOf('>'), t = document.createElement('template'); t.innerHTML = block.slice(0, i + 1) + '</ul>';
  const el = t.content.firstElementChild;
  ['data-track','data-artist','data-artist-id','data-featuring','data-label','data-treeshchoice','data-exclusive'].forEach(k => { if (k in orig.attrs) el.setAttribute(k, orig.attrs[k]); else el.removeAttribute(k); });
  return `<ul ${[...el.attributes].map(a => `${a.name}="${esc(a.value)}"`).join(' ')}>` + block.slice(i + 1);
}
const icoPrRow = p => { const h = prRow(p); return state.auth.icon ? h.replace(/^<a class="pr-row" href="[^"]*" target="_blank" rel="noopener"/, '<div class="pr-row"').replace(/<\/a>$/, '</div>').replace(/\[Icon\][^:<]*:\s*/, '') : h; };
/* features: only the sections labelled with the Icon's name ([Verse 2: Name]) can change */
const icoLyrFeat = () => !!(state.auth.icon && state.lyr && !icoMine(state.lyr.song));
function icoCredits(hdr){
  if (!state.auth.icon || !hdr) return false;
  const inner = String(hdr).replace(/\]\s*[\[(]\s*x\s*\d+\s*[\])]?\s*$/i, ']').replace(/^\[|\]$/g, ''), i = inner.indexOf(':');
  return i >= 0 && inner.slice(i + 1).replace(/\[[^\]]*\]|\([^)]*\)/g, '').split(/\s*[,&\/+\u00d7]\s*|\s+(?:feat\.?|ft\.?|featuring|with|and|vs\.?|x)\s+/i).some(icoName);
}
function icoLocked(i){ if (!icoLyrFeat()) return false; const L = state.lyr.lines; if (!L[i] || isHdr(L[i].text)) return true; for (let j = i - 1; j >= 0; j--) if (isHdr(L[j].text)) return !icoCredits(L[j].text); return true; }
function icoSections(lines){ const out = [{ hdr:null, hi:-1, idx:[] }]; lines.forEach((l, i) => { if (isHdr(l.text)) out.push({ hdr:l.text, hi:i, idx:[] }); else out[out.length - 1].idx.push(i); }); return out.filter((s, k) => k > 0 || s.idx.length); }
function icoSecHtml(){
  const L = state.lyr, secs = icoSections(L.lines);
  if (!secs.some(s => icoCredits(s.hdr))) return `<div class="empty" data-testid="lyrics-no-verses">${icon('lock')}<b>No verse is credited to you yet</b><span>Ask a Treesh admin to label your part, like [Verse 2: ${esc(state.auth.icon.name)}].</span></div>`;
  return `<div class="ico-secs" data-testid="lyrics-feature-sections">${secs.map((s, k) => icoCredits(s.hdr)
    ? `<div class="ico-sec mine" data-testid="lyrics-my-section"><p class="ico-sec-h">${esc(s.hdr)}<span>${icon('pencil-line')}Your part</span></p><textarea class="textarea lyr-text ico-sec-ta" data-sec="${k}" rows="${Math.max(3, s.idx.length + 1)}" data-testid="lyrics-my-section-text">${esc(s.idx.map(i => L.lines[i].text).join('\n'))}</textarea></div>`
    : `<div class="ico-sec" data-testid="lyrics-locked-section"><p class="ico-sec-h">${esc(s.hdr || 'Intro')}<span>${icon('lock')}Not your part</span></p><div class="ico-ro">${s.idx.map(i => esc(L.lines[i].text)).join('<br>') || '<i>No lines</i>'}</div></div>`).join('')}</div>`;
}
function icoSyncSecs(){
  const L = state.lyr, tas = $$('.ico-sec-ta'); if (!tas.length) return;
  const out = [];
  icoSections(L.lines).forEach((s, k) => {
    if (s.hi >= 0) out.push(L.lines[s.hi]);
    const ta = tas.find(x => +x.dataset.sec === k);
    if (!ta || !icoCredits(s.hdr)){ s.idx.forEach(i => out.push(L.lines[i])); return; }
    const old = s.idx.map(i => L.lines[i]), used = new Set();
    ta.value.split('\n').map(x => x.replace(/\s+/g, ' ').trim()).filter(x => x && !isHdr(x)).forEach((text, i) => {
      const j = old[i] && old[i].text === text && !used.has(i) ? i : old.findIndex((l, q) => l.text === text && !used.has(q));
      if (j >= 0) used.add(j);
      out.push({ text, t: j >= 0 ? old[j].t : null, explain: j >= 0 ? old[j].explain : '' });
    });
  });
  L.lines = out;
}
/* keep the original opening tag + metadata so credits never change; only the lines are rebuilt */
function icoLyricBlock(orig, ps){
  const raw = orig.raw, open = raw.indexOf('>') + 1, md = raw.slice(open).match(/^\s*<div\b[^>]*class\s*=\s*["'][^"']*\bmetadata\b[^>]*>/i);
  let end = open;
  if (md){ const tok = /<div\b|<\/div\s*>/gi; tok.lastIndex = open + md[0].length; let d = 1, t; while (d && (t = tok.exec(raw))) d += t[0][1] === '/' ? -1 : 1; if (!d) end = tok.lastIndex; }
  return `${raw.slice(0, end)}\n\n\t${ps.join('\n')}\n</div>`;
}
function icoLyrNote(){ if (icoLyrFeat()) toast(`You’re featured on “${state.lyr.song.title}”. Only your verses can change.`, 'info', 3600); }
/* deep links from the Treesh app: ?as=icon&song=<title>&artist=<artist>[&part=lyrics] or ?as=icon&edit=profile */
let icoDeepDone = false;
function icoDeep(tries = 0){
  if (icoDeepDone || !state.auth.icon) return;
  const p = QS.get('edit'), t = QS.get('song'); if (!p && !t){ icoDeepDone = true; return; }
  if (!(state.catalog.source === 'github' && state.roster.length && state.lyrics.source)){ if (tries < 40) setTimeout(() => icoDeep(tries + 1), 300); return; }
  icoDeepDone = true;
  if (p === 'profile'){ const me = state.roster.find(x => x.id === state.auth.icon.id); if (me){ switchView('artists'); openArtistDrawer(me); } return; }
  const a = QS.get('artist'), S = state.catalog.songs, s = S.find(x => normKey(x.title) === normKey(t) && (!a || normKey(x.artist) === normKey(a))) || S.find(x => normKey(x.title) === normKey(t));
  if (!s || !icoSees(s)) return toast('That song isn’t one of yours.', 'info');
  if (QS.get('part') === 'lyrics' || !icoMine(s)){ switchView('lyrics'); openLyrics(s); } else startEdit(s);
}
