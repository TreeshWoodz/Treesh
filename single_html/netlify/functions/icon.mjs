// Treesh Icon edits (Netlify Function). Verified Treesh Icons send edits to their own content as pull requests;
// Treesh admins approve (merge) or reject (close) them from the Moderation dashboard. GITHUB_TOKEN never leaves the server.
// Netlify env vars: GITHUB_TOKEN (required, same as M.A.D.), SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY (required, the public values treesh.app uses),
// MAD_REPO (optional, default TreeshWoodz/Treesh), MAD_BRANCH (optional, default main),
// ICON_CLOUD_NAME + ICON_CLOUD_PRESET (+ ICON_CLOUD_FOLDER) (optional: unsigned Cloudinary preset so Icons can upload audio/art).
import { createHash } from 'node:crypto';

export const config = { path: ['/api/icon', '/api/icon/*'] };

const REPO = process.env.MAD_REPO || 'TreeshWoodz/Treesh';
const BASE = process.env.MAD_BRANCH || 'main';
const FILES = { songs: 'content/songs.html', lyrics: 'content/lyrics.html', icons: 'content/icons.html' };
const KIND_OF = Object.fromEntries(Object.entries(FILES).map(([k, v]) => [v, k]));
const PREFIX = 'icon/';

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
const fail = (status, message, code) => json(status, { message, code });

/* ---------- GitHub ---------- */
async function gh(path, opts = {}){
  const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    method: opts.method || 'GET',
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: opts.raw ? 'application/vnd.github.raw' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'treesh-icon-edits', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const text = await r.text();
  let data = null; if (!opts.raw){ try { data = JSON.parse(text); } catch {} }
  return { status: r.status, ok: r.ok, data, text };
}
const encPath = p => p.split('/').map(encodeURIComponent).join('/');
async function ghText(path, ref){ const r = await gh(`/contents/${encPath(path)}?ref=${encodeURIComponent(ref)}`, { raw: true }); if (r.status === 404) return ''; if (!r.ok) throw Object.assign(new Error(`GitHub ${r.status} reading ${path}`), { status: 502 }); return r.text; }
const passthrough = r => new Response(r.text, { status: r.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });

/* ---------- who is calling (Treesh account via Supabase) ---------- */
const whoCache = new Map();
const bearer = req => ((req.headers.get('authorization') || '').match(/^Bearer\s+(\S{6,4096})$/i) || [])[1] || '';
function jwtSub(tok){ try { return JSON.parse(Buffer.from(tok.split('.')[1], 'base64url').toString()).sub || ''; } catch { return ''; } }
async function who(req){
  const tok = bearer(req); if (!tok) return null;
  const key = createHash('sha256').update(tok).digest('hex'), hit = whoCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.v;
  let v = null;
  try {
    const r = await fetch(`${process.env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/rpc/my_status`, { method: 'POST', headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: '{}' });
    if (r.ok){ const d = await r.json(); if (d && typeof d === 'object') v = { ...d, uid: jwtSub(tok) }; }
  } catch {}
  if (whoCache.size > 500) whoCache.clear();
  whoCache.set(key, { v, exp: Date.now() + 60000 });
  return v;
}
const banned = me => !!(me && me.banned_until && Date.parse(me.banned_until) > Date.now());

/* ---------- roster (who each Icon id is) ---------- */
let roster = null;
async function rosterMap(){
  if (roster && roster.exp > Date.now()) return roster.map;
  const map = {}; artistBlocks(await ghText(FILES.icons, BASE)).forEach(b => { map[b.id] = { id: b.id, name: b.attrs['data-name'] || '', image: innerImg(b.raw) }; });
  roster = { map, exp: Date.now() + 300000 };
  return map;
}
async function iconOf(me){ if (!me || !me.verified || !me.verified_icon) return null; const a = (await rosterMap())[String(me.verified_icon)]; return a && a.name ? a : null; }

/* ---------- HTML helpers (no DOM on the server) ---------- */
const decode = s => String(s ?? '').replace(/&(#\d+|#x[0-9a-f]+|amp|lt|gt|quot|apos|nbsp);/gi, (m, e) => { e = e.toLowerCase(); if (e[0] === '#'){ const n = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; } return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }[e]; });
const normKey = s => String(s ?? '').toLowerCase().replace(/[\u2018\u2019\u201c\u201d]/g, "'").replace(/[^a-z0-9]+/g, '');
const NAME_SPLIT = /\s*[,&\/+\u00d7]\s*|\s+(?:feat\.?|ft\.?|featuring|with|and|vs\.?|x)\s+/i;
const names = s => decode(s).split(NAME_SPLIT).map(x => x.trim()).filter(Boolean);
const isName = (n, icon) => normKey(n) === normKey(icon.name);
const strip = s => decode(String(s ?? '').replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
const squash = s => s.replace(/\s+/g, '');
function commentRanges(t){ const r = [], re = /<!--[\s\S]*?-->/g; let m; while ((m = re.exec(t))) r.push([m.index, m.index + m[0].length]); return r; }
const inRanges = (rs, i) => rs.some(([a, b]) => i >= a && i < b);
function attrsOf(tag){
  const o = {}, body = tag.replace(/^<[a-z0-9]+/i, '').replace(/\/?>$/, ''), re = /([^\s"'=<>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g; let m;
  while ((m = re.exec(body))) o[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return o;
}
const openTag = raw => raw.slice(0, raw.indexOf('>') + 1);
const innerImg = raw => decode(((raw.match(/<img\b[^>]*class\s*=\s*["'][^"']*artist__image[^>]*>/i) || [''])[0].match(/\ssrc\s*=\s*"([^"]*)"/i) || [])[1] || '');
const innerRole = raw => strip((raw.match(/<p\b[^>]*class\s*=\s*["'][^"']*capital[^"']*["'][^>]*>([\s\S]*?)<\/p>/i) || [])[1] || '');

function songBlocks(text){
  const lower = text.toLowerCase(), cr = commentRanges(text), out = [], re = /<ul\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi; let m;
  while ((m = re.exec(text))){
    if (inRanges(cr, m.index)) continue;
    const at = attrsOf(m[0]); if (!/(^|\s)song(\s|$)/i.test(at.class || '')) continue;
    const close = lower.indexOf('</ul>', re.lastIndex); if (close < 0) break;
    out.push({ start: m.index, end: close + 5, raw: text.slice(m.index, close + 5), attrs: at });
    re.lastIndex = close + 5;
  }
  return out;
}
function divEnd(text, from){ const tok = /<div\b|<\/div\s*>/gi; tok.lastIndex = from; let depth = 1, t; while (depth && (t = tok.exec(text))) depth += t[0][1] === '/' ? -1 : 1; return depth ? -1 : tok.lastIndex; }
function lyricBlocks(text){
  const cr = commentRanges(text), out = [], re = /<div\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi; let m;
  while ((m = re.exec(text))){
    if (inRanges(cr, m.index)) continue;
    const at = attrsOf(m[0]); if (!/(^|\s)lyric(\s|$)/i.test(at.class || '')) continue;
    const end = divEnd(text, re.lastIndex); if (end < 0) break;
    out.push({ start: m.index, end, raw: text.slice(m.index, end), attrs: at });
    re.lastIndex = end;
  }
  return out;
}
function artistBlocks(text){
  const cr = commentRanges(text), out = [], re = /<article\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/article>/gi; let m;
  while ((m = re.exec(text))){
    if (inRanges(cr, m.index)) continue;
    const at = attrsOf(openTag(m[0])); if (!/(^|\s)artist(\s|$)/i.test(at.class || '') || !at['data-artist-id']) continue;
    out.push({ start: m.index, end: m.index + m[0].length, raw: m[0], attrs: at, id: at['data-artist-id'].trim() });
  }
  return out;
}
const FINDERS = { songs: songBlocks, lyrics: lyricBlocks, icons: artistBlocks };

/* lyric lines: metadata skipped, each <p> -> {text, t, ex, hdr} */
const parseTc = v => { v = String(v || '').trim(); if (!v) return null; const p = v.split(':').map(Number); if (p.some(isNaN)) return null; const s = p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : p[0]; return Math.round(s * 100) / 100; };
function lyricParts(raw){
  let body = raw.slice(openTag(raw).length), meta = '';
  const mm = body.match(/<div\b[^>]*class\s*=\s*["'][^"']*\bmetadata\b[^>]*>/i);
  if (mm){ const s = mm.index, e = divEnd(body, s + mm[0].length); if (e > 0){ meta = strip(body.slice(s, e)); body = body.slice(0, s) + body.slice(e); } }
  const lines = [], re = /<p\b([^>]*)>([\s\S]*?)<\/p\s*>/gi; let m;
  while ((m = re.exec(body))){ const a = attrsOf('<p' + m[1] + '>'), text = strip(m[2]); if (!text) continue; lines.push({ text, t: parseTc(a['data-minutes']) ?? parseTc(a['data-seconds']), ex: (a['data-explain'] || '').trim(), hdr: /^\[.+\]$/.test(text) }); }
  return { meta, lines };
}
function sections(lines){ const out = [{ hdr: null, lines: [] }]; lines.forEach(l => { if (l.hdr) out.push({ hdr: l.text, lines: [] }); else out[out.length - 1].lines.push(l); }); return out; }
function credits(hdr, icon){ if (!hdr) return false; const inner = hdr.replace(/\]\s*[\[(]\s*x\s*\d+\s*[\])]?\s*$/i, ']').replace(/^\[|\]$/g, ''), i = inner.indexOf(':'); return i >= 0 && names(inner.slice(i + 1).replace(/\[[^\]]*\]|\([^)]*\)/g, '')).some(n => isName(n, icon)); }
const lineKey = l => `${l.text}\u0001${l.t ?? ''}\u0001${l.ex}`;

/* ---------- scope checks: an Icon PR may only touch that Icon's entries ---------- */
const UNSAFE_RE = /<\s*\/?\s*(script|iframe|object|embed|style|link|meta|form|base|svg|math|textarea|title|xmp|plaintext|noscript|template|noembed|noframes)\b|\son[a-z]+\s*=|javascript:|data:text\/html/i;
const UNSAFE = { test: raw => UNSAFE_RE.test(raw) || (raw.match(/<!--/g) || []).length !== (raw.match(/-->/g) || []).length };
const HTTPS_ATTRS = ['data-coverart', 'data-mp3', 'data-bg'];
const SONG_LOCK = ['class', 'data-track', 'data-artist', 'data-artist-id', 'data-featuring', 'data-treeshchoice', 'data-exclusive', 'data-label'];
const LYRIC_LOCK = ['class', 'data-track', 'data-artist', 'data-artist-id'];
const ICON_LOCK = ['class', 'data-artist-id', 'data-name'];
const same = (a, b, keys) => keys.every(k => (k in a) === (k in b) && (a[k] ?? '') === (b[k] ?? ''));
const urlsOk = at => HTTPS_ATTRS.every(k => !at[k] || /^https:\/\/[^\s"'<>]+$/i.test(at[k]));
const label = (kind, b) => kind === 'icons' ? (b.attrs['data-name'] || `#${b.id}`) : `“${b.attrs['data-track'] || 'Untitled'}”`;
function ownsSong(at, icon){ return names(at['data-artist']).some(n => isName(n, icon)); }
function ownsLyric(at, icon){ const n = names(at['data-artist'])[0]; return !!n && isName(n, icon); }

function align(base, next){
  if (next.length < base.length) return { err: 'Icons can’t remove songs, lyrics or profiles. Ask a Treesh admin.' };
  if (next.length > base.length + 1) return { err: 'Only one new entry can be added per request.' };
  if (next.length === base.length) return { add: -1 };
  let k = next.findIndex((b, i) => !base[i] || base[i].raw !== b.raw); if (k < 0) k = next.length - 1;
  for (let i = k + 1; i < next.length; i++) if (next[i].raw !== base[i - 1].raw) return { err: 'Adding an entry can’t change other entries in the same request.' };
  return { add: k };
}
function skeleton(text, blocks, skip){ let out = '', last = 0; blocks.forEach((b, i) => { out += text.slice(last, b.start) + (i === skip ? '' : '\u0000'); last = b.end; }); return squash(out + text.slice(last)); }

function editOk(kind, o, n, icon){
  const L = label(kind, o);
  if (UNSAFE.test(n.raw)) return `${L}: that content isn’t allowed (scripts, frames, open comments or event handlers).`;
  if (!urlsOk(n.attrs)) return `${L}: links must be public https:// URLs.`;
  if (kind === 'songs'){
    if (!ownsSong(o.attrs, icon)) return `${L} isn’t your song, so its details can’t be changed.`;
    if (!same(o.attrs, n.attrs, SONG_LOCK)) return `${L}: title, artist names, IDs, Treesh Choice, Exclusive and shelf label stay admin-only.`;
    return '';
  }
  if (kind === 'icons'){
    if (o.id !== String(icon.id)) return `Only your own Icon profile can be changed, not ${L}.`;
    if (!same(o.attrs, n.attrs, ICON_LOCK)) return 'Your Icon name and ID stay admin-only.';
    return '';
  }
  if (!same(o.attrs, n.attrs, LYRIC_LOCK)) return `${L}: the song title and artist credits on lyrics stay admin-only.`;
  if (ownsLyric(o.attrs, icon)) return '';
  const a = lyricParts(o.raw), b = lyricParts(n.raw);
  if (JSON.stringify(o.attrs) !== JSON.stringify(n.attrs) || squash(a.meta) !== squash(b.meta)) return `${L}: only your own verses can change on a feature.`;
  const sa = sections(a.lines), sb = sections(b.lines);
  if (sa.length !== sb.length || sa.some((s, i) => s.hdr !== sb[i].hdr)) return `${L}: section labels like [Verse 2: Name] stay as they are on a feature.`;
  if (!sa.some(s => credits(s.hdr, icon))) return `${L}: no section is credited to ${icon.name}, so nothing here is yours to edit.`;
  const bad = sa.find((s, i) => !credits(s.hdr, icon) && s.lines.map(lineKey).join('\n') !== sb[i].lines.map(lineKey).join('\n'));
  return bad ? `${L}: ${bad.hdr || 'the intro'} isn’t your part, so it can’t change.` : '';
}
function addOk(kind, b, icon){
  const L = label(kind, b);
  if (kind === 'icons') return 'New Icon profiles are added by Treesh admins.';
  if (UNSAFE.test(b.raw)) return `${L}: that content isn’t allowed (scripts, frames, open comments or event handlers).`;
  if (!urlsOk(b.attrs)) return `${L}: links must be public https:// URLs.`;
  if (kind === 'songs'){
    const main = names(b.attrs['data-artist']);
    if (main.length !== 1 || !isName(main[0], icon)) return `New songs must list ${icon.name} as the main artist.`;
    if (!String(b.attrs['data-artist-id'] || '').split(',').map(x => x.trim()).includes(String(icon.id))) return `New songs must be linked to your Icon ID (#${icon.id}).`;
    if ('data-treeshchoice' in b.attrs || 'data-exclusive' in b.attrs || b.attrs['data-label']) return 'Treesh Choice, Exclusive and shelf labels are set by Treesh admins.';
    return '';
  }
  return ownsLyric(b.attrs, icon) ? '' : `Only lyrics for your own songs can be added. On features, edit your verses instead.`;
}
export function scopeCheck(kind, baseText, nextText, icon){
  const find = FINDERS[kind]; if (!find) return 'That file can’t be edited by Icons.';
  const base = find(baseText), next = find(nextText), al = align(base, next);
  if (al.err) return al.err;
  if (skeleton(baseText, base, -1) !== skeleton(nextText, next, al.add)) return 'Only song, lyric and profile entries can change, not the rest of the file.';
  if (al.add >= 0){ const e = addOk(kind, next[al.add], icon); if (e) return e; }
  const rest = al.add >= 0 ? next.filter((_, i) => i !== al.add) : next;
  for (let i = 0; i < base.length; i++){ if (base[i].raw === rest[i].raw) continue; const e = editOk(kind, base[i], rest[i], icon); if (e) return e; }
  if (al.add < 0 && base.every((b, i) => b.raw === rest[i].raw)) return 'Nothing changed.';
  return '';
}

/* ---------- review summary for admins ---------- */
const FIELD = { 'data-coverart': 'Cover', 'data-mp3': 'Audio', 'data-video': 'Video', 'data-bio': 'Bio', 'data-genre': 'Genre', 'data-mood': 'Mood', 'data-written-by': 'Written by', 'data-producer': 'Produced by', 'data-mixer': 'Mixed by', 'data-videographer': 'Video by', 'data-creation-date': 'Date', 'data-album': 'Album', 'data-release': 'Drops', 'data-explicit': 'Explicit', 'data-track': 'Title', 'data-artist': 'Artist', 'data-featuring': 'Featuring', 'data-artist-id': 'Artist IDs', 'data-label': 'Shelf label', 'data-exclusive': 'Exclusive', 'data-treeshchoice': 'Treesh Choice', 'data-bg': 'Banner', 'data-bg-pos': 'Banner position', 'data-bg-pos-mobile': 'Banner position (phone)', 'data-location': 'Location', 'data-cashapp': 'Cash App', 'data-name': 'Name', photo: 'Photo', role: 'Role' };
function fieldDiff(a, b){ const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => k !== 'class' && k !== 'data-artist-sort'); return keys.filter(k => (k in a) !== (k in b) || (a[k] ?? '') !== (b[k] ?? '')).map(k => ({ key: k, label: FIELD[k] || k.replace(/^data-/, ''), old: k in a ? (a[k] || (k === 'data-explicit' ? 'yes' : '')) : '', new: k in b ? (b[k] || (k === 'data-explicit' ? 'yes' : '')) : '' })); }
const withInner = (kind, b) => kind === 'icons' ? { ...b.attrs, photo: innerImg(b.raw), role: innerRole(b.raw) } : b.attrs;
function summarize(kind, baseText, nextText){
  const find = FINDERS[kind]; if (!find) return [];
  const base = find(baseText), next = find(nextText), bset = new Set(base.map(b => b.raw)), nset = new Set(next.map(b => b.raw));
  const key = b => kind === 'icons' ? b.id : normKey(b.attrs['data-track']) + '|' + normKey(names(b.attrs['data-artist'])[0]);
  const gone = base.filter(b => !nset.has(b.raw)), out = [];
  next.filter(b => !bset.has(b.raw)).forEach(b => {
    const o = gone.find(x => key(x) === key(b)) || (kind !== 'icons' && gone.find(x => normKey(x.attrs['data-track']) === normKey(b.attrs['data-track'])));
    if (o) gone.splice(gone.indexOf(o), 1);
    const row = { change: o ? 'edit' : 'add', title: kind === 'icons' ? b.attrs['data-name'] : b.attrs['data-track'], artist: b.attrs['data-artist'] || '', cover: kind === 'icons' ? innerImg(b.raw) : (b.attrs['data-coverart'] || '') };
    if (kind === 'lyrics'){
      const A = o ? lyricParts(o.raw).lines : [], B = lyricParts(b.raw).lines, cnt = new Map();
      A.forEach(l => cnt.set(lineKey(l), (cnt.get(lineKey(l)) || 0) + 1));
      const added = B.filter(l => { const n = cnt.get(lineKey(l)) || 0; if (n){ cnt.set(lineKey(l), n - 1); return false; } return true; });
      const left = new Map(); B.forEach(l => left.set(lineKey(l), (left.get(lineKey(l)) || 0) + 1));
      const removed = A.filter(l => { const n = left.get(lineKey(l)) || 0; if (n){ left.set(lineKey(l), n - 1); return false; } return true; });
      const fmt = l => (l.t != null ? `[${Math.floor(l.t / 60)}:${(l.t % 60).toFixed(2).padStart(5, '0')}] ` : '') + l.text;
      Object.assign(row, { lines: B.length, added: added.slice(0, 80).map(fmt), removed: removed.slice(0, 80).map(fmt) });
    } else row.fields = fieldDiff(o ? withInner(kind, o) : {}, withInner(kind, b));
    out.push(row);
  });
  gone.forEach(b => out.push({ change: 'remove', title: kind === 'icons' ? b.attrs['data-name'] : b.attrs['data-track'], artist: b.attrs['data-artist'] || '' }));
  return out;
}

/* ---------- Icon proxy (only what M.A.D. needs, only on the Icon's own branches) ---------- */
const branchOk = (b, icon) => typeof b === 'string' && b.startsWith(`${PREFIX}${icon.id}/`) && /^[A-Za-z0-9._\/-]{1,140}$/.test(b) && !/\.\.|\/\/|\.lock$|\/$/.test(b);
async function readBody(req){ try { return await req.json(); } catch { return null; } }
function fromB64(b64){ return Buffer.from(String(b64 || '').replace(/\s/g, ''), 'base64').toString('utf8'); }

async function iconProxy(req, icon, me, rest, method, search){
  let path = rest; try { path = decodeURIComponent(rest); } catch { return fail(400, 'Bad path.', 'path'); }
  if (/(^|\/)\.\.?(\/|$)/.test(path) || /[\\\0]/.test(path)) return fail(400, 'Bad path.', 'path');
  const file = (path.match(/^\/contents\/(.+)$/) || [])[1];
  if (method === 'GET' && path === '') return passthrough(await gh(''));
  if (method === 'GET' && file){ if (!KIND_OF[file]) return fail(403, 'Icons can only open the songs, lyrics and Icon profile files.', 'blocked'); return passthrough(await gh(`/contents/${encPath(file)}${search}`)); }
  const ref = (path.match(/^\/git\/ref\/heads\/(.+)$/) || [])[1];
  if (method === 'GET' && ref){ if (ref !== BASE && !branchOk(ref, icon)) return fail(403, 'That branch isn’t yours.', 'blocked'); return passthrough(await gh(`/git/ref/heads/${encPath(ref)}`)); }
  if (method === 'GET' && path === '/pulls'){
    const r = await gh('/pulls?state=all&per_page=100'); if (!r.ok) return passthrough(r);
    return json(200, (r.data || []).filter(p => p.head && String(p.head.ref).startsWith(`${PREFIX}${icon.id}/`)));
  }
  const body = await readBody(req); if (!body || typeof body !== 'object') return fail(400, 'Missing request body.', 'body');
  if (method === 'POST' && path === '/git/refs'){
    const b = String(body.ref || '').replace(/^refs\/heads\//, '');
    if (!branchOk(b, icon)) return fail(403, 'Review branches must start with your Icon prefix.', 'blocked');
    const head = await gh(`/git/ref/heads/${encPath(BASE)}`); if (!head.ok) return passthrough(head);
    return passthrough(await gh('/git/refs', { method: 'POST', body: { ref: `refs/heads/${b}`, sha: head.data.object.sha } }));
  }
  if (method === 'PUT' && file){
    const kind = KIND_OF[file]; if (!kind) return fail(403, 'Icons can only change the songs, lyrics and Icon profile files.', 'blocked');
    if (!branchOk(body.branch, icon)) return fail(403, 'Icon edits always go to a review branch, never straight to Treesh.', 'blocked');
    if (typeof body.content !== 'string' || body.content.length > 8e6) return fail(400, 'Missing file content.', 'body');
    const next = fromB64(body.content), msg = scopeCheck(kind, await ghText(file, BASE), next, icon);
    if (msg) return fail(403, msg, 'scope');
    return passthrough(await gh(`/contents/${encPath(file)}`, { method: 'PUT', body: { message: `[Icon] ${String(body.message || 'Update').slice(0, 200)}`, content: body.content, sha: body.sha, branch: body.branch } }));
  }
  if (method === 'POST' && path === '/pulls'){
    if (!branchOk(body.head, icon) || (body.base || BASE) !== BASE) return fail(403, 'Icon requests can only target Treesh from your own review branch.', 'blocked');
    const cmp = await gh(`/compare/${encodeURIComponent(BASE)}...${encodeURIComponent(body.head)}`);
    if (!cmp.ok) return passthrough(cmp);
    const stray = (cmp.data.files || []).find(f => !KIND_OF[f.filename]);
    if (stray) return fail(403, `${stray.filename} can’t be part of an Icon request.`, 'scope');
    const note = `\n\n---\nSent by Treesh Icon **${icon.name}** (#${icon.id})${me.uid ? ` · account \`${me.uid}\`` : ''}. Waiting for a Treesh admin to approve it in Moderation → Icon edits.`;
    return passthrough(await gh('/pulls', { method: 'POST', body: { title: `[Icon] ${icon.name}: ${String(body.title || 'Update').slice(0, 180)}`, head: body.head, base: BASE, body: String(body.body || '').slice(0, 20000) + note, maintainer_can_modify: true } }));
  }
  return fail(403, 'That action isn’t available to Icons.', 'blocked');
}

/* ---------- admin review queue ---------- */
const prIconId = pr => (String(pr.head && pr.head.ref || '').match(/^icon\/([^/]+)\//) || [])[1] || '';
async function prRow(pr, map, withFiles){
  const id = prIconId(pr), a = map[id] || null;
  const row = { number: pr.number, title: String(pr.title || '').replace(/^\[Icon\]\s*/, ''), body: pr.body || '', state: pr.merged_at ? 'merged' : pr.state, created_at: pr.created_at, updated_at: pr.updated_at, closed_at: pr.closed_at, merged_at: pr.merged_at, url: pr.html_url, branch: pr.head.ref, icon: a ? { id: a.id, name: a.name, image: a.image } : { id, name: `Icon #${id}`, image: '' } };
  if (withFiles){ const f = await gh(`/pulls/${pr.number}/files?per_page=50`); row.files = f.ok ? (f.data || []).map(x => ({ file: x.filename, kind: KIND_OF[x.filename] || null, additions: x.additions, deletions: x.deletions })) : []; }
  return row;
}
async function review(n, map){
  const p = await gh(`/pulls/${n}`); if (!p.ok) return { err: p };
  const pr = p.data; if (!String(pr.head && pr.head.ref || '').startsWith(PREFIX)) return { bad: 'That pull request isn’t an Icon edit.' };
  const row = await prRow(pr, map, false), icon = map[prIconId(pr)] || null;
  const [f, cmp] = await Promise.all([gh(`/pulls/${n}/files?per_page=50`), gh(`/compare/${encodeURIComponent(BASE)}...${encodeURIComponent(pr.head.sha)}`)]), files = f.ok ? f.data || [] : [];
  const from = (cmp.ok && cmp.data && cmp.data.merge_base_commit && cmp.data.merge_base_commit.sha) || BASE; // what the Icon started from, so later merges don't look like reverts
  row.files = await Promise.all(files.map(async x => {
    const kind = KIND_OF[x.filename] || null, out = { file: x.filename, kind, additions: x.additions, deletions: x.deletions, status: x.status };
    if (!kind){ out.ok = false; out.message = 'Not a Treesh content file.'; return out; }
    const [baseText, headText] = await Promise.all([ghText(x.filename, from), ghText(x.filename, pr.head.sha)]);
    out.changes = summarize(kind, baseText, headText);
    out.message = icon ? scopeCheck(kind, baseText, headText, icon) : 'This Icon isn’t on the roster anymore.';
    out.ok = !out.message;
    return out;
  }));
  row.ok = row.files.length > 0 && row.files.every(x => x.ok);
  row.mergeable = pr.mergeable; row.head_sha = pr.head.sha;
  return { row };
}
async function deleteBranch(ref){ if (String(ref).startsWith(PREFIX)) await gh(`/git/refs/heads/${encPath(ref)}`, { method: 'DELETE' }); }

async function edits(req, me, rest, method, url){
  const map = await rosterMap(), m = rest.match(/^\/(\d+)(?:\/(merge|close))?$/);
  if (method === 'GET' && rest === ''){
    const st = url.searchParams.get('state') === 'closed' ? 'closed' : 'open';
    const r = await gh(`/pulls?state=${st}&per_page=100&sort=updated&direction=desc`); if (!r.ok) return passthrough(r);
    const list = (r.data || []).filter(p => String(p.head && p.head.ref || '').startsWith(PREFIX)).slice(0, st === 'open' ? 60 : 30);
    return json(200, { state: st, items: await Promise.all(list.map(p => prRow(p, map, st === 'open'))) });
  }
  if (!m) return fail(404, 'Unknown Icon edits route.', 'route');
  const n = m[1];
  if (method === 'GET' && !m[2]){ const r = await review(n, map); if (r.err) return passthrough(r.err); if (r.bad) return fail(403, r.bad, 'blocked'); return json(200, r.row); }
  if (method !== 'POST' || !m[2]) return fail(405, 'Method not allowed.', 'method');
  const body = (await readBody(req)) || {};
  const r = await review(n, map); if (r.err) return passthrough(r.err); if (r.bad) return fail(403, r.bad, 'blocked');
  const row = r.row; if (row.state !== 'open') return fail(409, `This request is already ${row.state}.`, 'state');
  const by = me.uid ? ` (admin account \`${me.uid}\`)` : '';
  if (m[2] === 'merge'){
    if (!row.ok && !body.force) return fail(409, (row.files.find(x => !x.ok) || {}).message || 'This request didn’t pass the Icon scope check.', 'scope');
    const mg = await gh(`/pulls/${n}/merge`, { method: 'PUT', body: { merge_method: 'squash', sha: row.head_sha, commit_title: `${row.title} (#${n})`, commit_message: `Approved in Treesh Moderation → Icon edits${by}.` } });
    if (!mg.ok) return fail(mg.status === 405 || mg.status === 409 ? 409 : 502, mg.status === 405 || mg.status === 409 ? 'GitHub can’t merge this one automatically (the files changed since). Reject it and ask the Icon to send it again.' : `GitHub error ${mg.status}.`, 'merge');
    await deleteBranch(row.branch);
    return json(200, { number: +n, state: 'merged' });
  }
  const reason = String(body.reason || '').trim().slice(0, 1000);
  await gh(`/issues/${n}/comments`, { method: 'POST', body: { body: `Not approved in Treesh Moderation${by}.${reason ? `\n\n> ${reason.replace(/\n/g, '\n> ')}` : ''}` } });
  const cl = await gh(`/pulls/${n}`, { method: 'PATCH', body: { state: 'closed' } }); if (!cl.ok) return passthrough(cl);
  await deleteBranch(row.branch);
  return json(200, { number: +n, state: 'closed' });
}

/* ---------- entry ---------- */
export default async (req) => {
  if (!process.env.GITHUB_TOKEN || !process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) return fail(500, 'Icon edits aren’t set up: add GITHUB_TOKEN, SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Netlify, then redeploy.', 'setup');
  const url = new URL(req.url), method = req.method.toUpperCase();
  const sub = url.pathname.replace(/^\/api\/icon/, '').replace(/\/+$/, '');
  try {
    const me = await who(req);
    if (!me) return fail(401, 'Sign in to your Treesh account first.', 'session');
    if (banned(me)) return fail(403, 'This Treesh account is suspended.', 'banned');
    const icon = await iconOf(me), admin = me.role === 'admin';
    if (sub === '/session' && method === 'GET'){
      if (!icon && !admin) return fail(403, me.verified ? 'Your verified badge isn’t linked to an Icon page yet. Ask a Treesh admin to link it.' : 'Only verified Treesh Icons can edit here.', 'not-icon');
      const cloud = process.env.ICON_CLOUD_NAME && process.env.ICON_CLOUD_PRESET ? { name: process.env.ICON_CLOUD_NAME, preset: process.env.ICON_CLOUD_PRESET, folder: process.env.ICON_CLOUD_FOLDER || 'treesh/icon-uploads' } : null;
      return json(200, { signedIn: true, kind: icon ? 'icon' : 'admin', icon, role: me.role || 'user', repo: REPO, branch: BASE, files: FILES, cloud });
    }
    if (sub === '/edits' || sub.startsWith('/edits/')){
      if (!admin) return fail(403, 'Only Treesh admins can review Icon edits.', 'not-admin');
      return await edits(req, me, sub.slice('/edits'.length), method, url);
    }
    if (sub === '/repo' || sub.startsWith('/repo/')){
      if (!icon) return fail(403, 'Only verified Treesh Icons can edit here.', 'not-icon');
      return await iconProxy(req, icon, me, sub.slice('/repo'.length), method, url.search);
    }
    return fail(404, 'Unknown Icon route.', 'route');
  } catch (e){
    return fail(e.status || 502, 'The Icon edits server couldn’t reach GitHub. Try again.', 'upstream');
  }
};
