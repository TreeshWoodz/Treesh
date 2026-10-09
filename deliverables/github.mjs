// Treesh M.A.D. secure GitHub proxy (Netlify Function). GITHUB_TOKEN never leaves the server.
// Netlify env vars: GITHUB_TOKEN (required), MAD_PASSCODE (required, 12+ chars), MAD_SESSION_SECRET (optional), MAD_REPO (optional, default TreeshWoodz/Treesh)
// ImageKit uploads (optional): IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY
// GitHub sign-in (optional): GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET, MAD_GITHUB_USERS (comma list, default TreeshWoodz). Callback: https://<site>/api/github/oauth/callback
// Email alerts (optional): RESEND_API_KEY, MAD_ALERT_EMAIL (MAD_ALERT_KEY also accepted), MAD_ALERT_FROM (default "Treesh M.A.D. <mad@treesh.app>", falls back to onboarding@resend.dev until treesh.app is verified in Resend), MAD_URL (default https://treesh.app/tools/mad)
// Icon accounts (optional): SUPABASE_URL, SUPABASE_ANON_KEY, MAD_ICON_TABLE (default profiles), MAD_ICON_VERIFIED_COL (default verified), MAD_ICON_ARTIST_COL (default verified_icon)
// Needs "@netlify/blobs" in the repo's package.json dependencies (sign-in activity + reliable lockout).
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';

export const config = { path: ['/api/github', '/api/github/*'] };

const REPO = process.env.MAD_REPO || 'TreeshWoodz/Treesh';
const COOKIE = 'mad_session';
const MAX_AGE = 60 * 60 * 24 * 30;
const MIN_PASSCODE = 12;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const MAX_LOG = 100;
const OAUTH_COOKIE = 'mad_oauth';
const APP_PATH = '/tools/mad';
const memFails = new Map();

// Only the GitHub calls M.A.D. actually makes, relative to /repos/<REPO>
const ALLOW = [
  ['GET', /^$/],
  ['GET', /^\/contents\/[^?#]+$/],
  ['PUT', /^\/contents\/[^?#]+$/],
  ['GET', /^\/git\/ref\/heads\/[^?#]+$/],
  ['POST', /^\/git\/refs$/],
  ['GET', /^\/pulls$/],
  ['GET', /^\/commits$/],
  ['GET', /^\/pulls\/\d+\/files$/],
  ['PUT', /^\/pulls\/\d+\/merge$/],
  ['PATCH', /^\/pulls\/\d+$/],
  ['POST', /^\/issues\/\d+\/comments$/],
  ['POST', /^\/pulls$/]
];

const json = (status, body, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }
});
const digest = s => createHash('sha256').update(String(s)).digest();
const same = (a, b) => timingSafeEqual(digest(a), digest(b));
const secret = () => process.env.MAD_SESSION_SECRET || createHash('sha256').update(`${passcode()}|${process.env.GITHUB_TOKEN}`).digest('hex');
const sign = data => createHmac('sha256', secret()).update(data).digest('base64url');
const cookie = (value, maxAge) => `${COOKIE}=${value}; Path=/api/github; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
const passcode = () => (process.env.MAD_PASSCODE || '').trim();

/* ---------- storage (Netlify Blobs, memory fallback) ---------- */
let store = null;
function blobs(){
  if (store === null){ try { store = getStore({ name: 'mad-security', consistency: 'strong' }); } catch { store = false; } }
  return store || null;
}
async function readKey(key, fallback){
  const s = blobs();
  if (!s) return key.startsWith('fail:') ? memFails.get(key) || fallback : fallback;
  try { return (await s.get(key, { type: 'json' })) ?? fallback; } catch { return fallback; }
}
async function writeKey(key, value){
  const s = blobs();
  if (!s){ if (key.startsWith('fail:')) value ? memFails.set(key, value) : memFails.delete(key); return; }
  try { value ? await s.setJSON(key, value) : await s.delete(key); } catch {}
}

/* ---------- activity ---------- */
function maskIp(ip){
  if (!ip || ip === 'unknown') return 'Unknown';
  if (ip.includes('.')) return ip.split('.').slice(0, 2).join('.') + '.•••.•••';
  return ip.split(':').filter(Boolean).slice(0, 2).join(':') + ':••••';
}
function device(ua = ''){
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Macintosh|Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /CrOS/.test(ua) ? 'Chromebook' : /Linux/.test(ua) ? 'Linux' : 'Unknown device';
  const br = /EdgiOS|Edg\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : /curl|python|node|axios|wget/i.test(ua) ? 'Script / bot' : 'Unknown browser';
  return `${os} · ${br}`;
}
async function logEvent(req, context, result, sid, extra = {}){
  const geo = context.geo || {};
  const entry = {
    t: Date.now(), result,
    city: geo.city || '', country: (geo.country && geo.country.name) || '',
    device: device(req.headers.get('user-agent') || ''),
    ip: maskIp(clientIp(req, context)),
    ...extra,
    ...(sid ? { sid } : {})
  };
  const log = await readKey('activity', []);
  await writeKey('activity', [entry, ...(Array.isArray(log) ? log : [])].slice(0, MAX_LOG));
}
const clientIp = (req, context) => context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
const failKey = ip => 'fail:' + createHash('sha256').update(ip).digest('hex').slice(0, 32);

/* ---------- sessions ---------- */
function newSession(login, extra = {}){
  const exp = Date.now() + MAX_AGE * 1000, sid = randomBytes(9).toString('base64url');
  const data = Buffer.from(JSON.stringify({ exp, sid, ...(login ? { login } : {}), ...extra })).toString('base64url');
  return { value: `${data}.${sign(data)}`, exp, sid };
}
function readSession(req){
  const m = readCookie(req, COOKIE);
  if (!m) return null;
  const [data, sig] = m.split('.');
  if (!data || !sig || !same(sig, sign(data))) return null;
  try { const p = JSON.parse(Buffer.from(data, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch { return null; }
}
function sameOrigin(req){
  const origin = req.headers.get('origin');
  if (!origin) return req.headers.get('sec-fetch-site') !== 'cross-site';
  try { return new URL(origin).host === new URL(req.url).host; } catch { return false; }
}

async function session(req, context, method){
  if (method === 'GET'){ const s0 = readSession(req), s = s0 && s0.role === 'icon' && await iconRevoked(s0) ? null : s0; return json(200, { signedIn: !!s, expires: s ? s.exp : null, login: (s && s.login) || null, role: (s && s.role) || (s ? 'admin' : null), artistId: (s && s.artistId) || null, repo: REPO, activity: !!blobs(), oauth: oauthReady(), email: s && s.role !== 'icon' && emailReady() ? maskEmail(alertTo()) : null, version: MAD_VERSION, features: { email: emailReady(), imagekit: !!((process.env.IMAGEKIT_PUBLIC_KEY || '').trim() && (process.env.IMAGEKIT_PRIVATE_KEY || '').trim()), icons: !!((process.env.SUPABASE_URL || '').trim() && (process.env.SUPABASE_ANON_KEY || '').trim()), oauth: oauthReady() } }); }
  if (method === 'DELETE') return json(200, { signedIn: false, repo: REPO }, { 'Set-Cookie': cookie('', 0) });
  if (method !== 'POST') return json(405, { message: 'Method not allowed.' });
  const key = failKey(clientIp(req, context));
  const f = await readKey(key, { n: 0, until: 0 });
  if (f.until > Date.now()){
    await logEvent(req, context, 'locked');
    return json(429, { message: `Too many wrong tries. Wait ${Math.ceil((f.until - Date.now()) / 60000)} min and try again.`, code: 'locked' });
  }
  let body = {};
  try { body = await req.json(); } catch {}
  if (typeof body.passcode !== 'string' || !same(body.passcode.trim(), passcode())){
    const n = f.n + 1, locked = n >= MAX_FAILS;
    await writeKey(key, locked ? { n: 0, until: Date.now() + LOCK_MS } : { n, until: 0 });
    await logEvent(req, context, locked ? 'locked' : 'wrong');
    await new Promise(r => setTimeout(r, 800));
    return locked
      ? json(429, { message: 'Too many wrong tries. Sign-in is locked for 15 min.', code: 'locked' })
      : json(401, { message: `Wrong passcode. ${MAX_FAILS - n} ${MAX_FAILS - n === 1 ? 'try' : 'tries'} left before a 15 min lock.`, code: 'passcode' });
  }
  await writeKey(key, null);
  const s = newSession();
  await logEvent(req, context, 'signin', s.sid);
  return json(200, { signedIn: true, expires: s.exp, repo: REPO }, { 'Set-Cookie': cookie(s.value, MAX_AGE) });
}

/* ---------- GitHub sign-in (OAuth App web flow; the OAuth token is used once and dropped) ---------- */
const oauthReady = () => !!(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET);
const allowedUsers = () => (process.env.MAD_GITHUB_USERS || 'TreeshWoodz').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const safeReturn = r => (typeof r === 'string' && /^\/(?![\/\\])[\w\-./]*$/.test(r) ? r : APP_PATH);
function readCookie(req, name){
  const m = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? m[1] : null;
}
function redirect(to, cookies = []){
  const h = new Headers({ Location: to, 'Cache-Control': 'no-store' });
  cookies.forEach(c => h.append('Set-Cookie', c));
  return new Response(null, { status: 302, headers: h });
}
const oauthCookie = (value, maxAge) => `${OAUTH_COOKIE}=${value}; Path=/api/github/oauth; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
function oauthStart(url){
  const ret = safeReturn(url.searchParams.get('return'));
  if (!oauthReady()) return redirect(`${ret}?signin=setup`);
  const state = signState(ret);
  const auth = new URL('https://github.com/login/oauth/authorize');
  auth.search = new URLSearchParams({ client_id: process.env.GITHUB_OAUTH_CLIENT_ID.trim(), redirect_uri: `${url.origin}/api/github/oauth/callback`, state, allow_signup: 'false' });
  return redirect(auth.toString(), [oauthCookie(state, 600)]);
}
// Signed state (nonce + return path + expiry) so sign-in still works if Safari drops the state cookie on the way back from github.com
function signState(ret){
  const data = Buffer.from(JSON.stringify({ n: randomBytes(12).toString('base64url'), r: ret, e: Date.now() + 600000 })).toString('base64url');
  return `${data}.${createHmac('sha256', secret()).update(`oauth.${data}`).digest('base64url')}`;
}
function readState(state){
  const [data, sig] = String(state || '').split('.');
  if (!data || !sig || !same(sig, createHmac('sha256', secret()).update(`oauth.${data}`).digest('base64url'))) return null;
  try { const o = JSON.parse(Buffer.from(data, 'base64url').toString()); return o.e > Date.now() ? o : null; } catch { return null; }
}
async function oauthCallback(req, context, url){
  const state = url.searchParams.get('state'), code = url.searchParams.get('code'), st = readState(state), saved = readCookie(req, OAUTH_COOKIE);
  const ret = safeReturn(st && st.r);
  // Same-site hop (not a 302) so the session cookie is sent on the very next request
  const done = (result, extraCookies = [], why = '') => {
    const to = JSON.stringify(`${ret}?signin=${result}${why ? `&why=${encodeURIComponent(why)}` : ''}`), h = new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
    [oauthCookie('', 0), ...extraCookies].forEach(c => h.append('Set-Cookie', c));
    return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>M.A.D.</title><body style="background:#0b0a10;color:#aaa;font:15px system-ui;display:grid;place-items:center;height:100vh;margin:0">Signing you in…<script>location.replace(${to})</script>`, { status: 200, headers: h });
  };
  const fail = async why => { await logEvent(req, context, 'gh_error', null, { via: 'github', why }); return done('error', [], why); };
  const ghErr = url.searchParams.get('error');
  if (ghErr) return ghErr === 'access_denied' ? done('cancelled') : fail(ghErr);
  if (!oauthReady()) return done('setup');
  if (!code || !st) return fail(state ? 'state_expired' : 'state_missing');
  if (saved && !same(saved, state)) return fail('state_mismatch');
  let login = '';
  try {
    const t = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'treesh-mad' },
      body: new URLSearchParams({ client_id: process.env.GITHUB_OAUTH_CLIENT_ID.trim(), client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET.trim(), code, redirect_uri: `${url.origin}/api/github/oauth/callback` })
    });
    const tj = await t.json().catch(() => ({}));
    if (!tj.access_token) return fail(tj.error || `token_http_${t.status}`);
    const u = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${tj.access_token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'treesh-mad' } });
    if (!u.ok) return fail(`user_http_${u.status}`);
    login = String((await u.json()).login || '');
  } catch { return fail('network'); }
  if (!login) return fail('no_login');
  if (!allowedUsers().includes(login.toLowerCase())){
    await logEvent(req, context, 'denied', null, { via: 'github', login });
    return done('denied', [], login);
  }
  const s = newSession(login);
  await logEvent(req, context, 'signin', s.sid, { via: 'github', login });
  return done('github', [cookie(s.value, MAX_AGE)]);
}

/* ---------- Icon accounts: verified Treesh (Supabase) users edit only their own content, always through admin review ---------- */
const ICON_FILES = ['content/songs.html', 'content/icons.html', 'content/lyrics.html'];
const iconStore = () => blobs();
async function iconList(key){ const s = iconStore(); if (!s) return {}; try { return (await s.get(key, { type: 'json' })) || {}; } catch { return {}; } }
async function iconSave(key, v){ const s = iconStore(); if (s) try { await s.setJSON(key, v); } catch {} }
async function supaUser(token){
  const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, ''), anon = process.env.SUPABASE_ANON_KEY || '';
  if (!base || !anon || !token) return null;
  const h = { apikey: anon, Authorization: `Bearer ${token}` };
  const u = await fetch(`${base}/auth/v1/user`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null);
  if (!u || !u.id) return null;
  const t = process.env.MAD_ICON_TABLE || 'profiles', vc = process.env.MAD_ICON_VERIFIED_COL || 'verified', ac = process.env.MAD_ICON_ARTIST_COL || 'verified_icon';
  const rows = await fetch(`${base}/rest/v1/${encodeURIComponent(t)}?id=eq.${encodeURIComponent(u.id)}&select=*`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []);
  const p = (Array.isArray(rows) && rows[0]) || {};
  return { uid: u.id, email: u.email || '', name: p.display_name || p.username || p.name || (u.email || '').split('@')[0], verified: p[vc] === true, artistId: p[ac] != null ? String(p[ac]) : '' };
}
async function iconSession(req, context){
  let body = {}; try { body = await req.json(); } catch {}
  const u = await supaUser(body.access_token);
  if (!u) return json(401, { message: 'Your Treesh sign-in has expired. Open treesh.app so it refreshes, then try again.', code: 'icon_signin' });
  const approved = (await iconList('icon-approved'))[u.uid];
  const artistId = (approved && approved.artistId) || (u.verified ? u.artistId : '');
  if (!artistId) return json(403, { message: 'Your Treesh account isn’t verified for M.A.D. yet.', code: 'icon_unverified', name: u.name, requested: !!(await iconList('icon-requests'))[u.uid] });
  const s = newSession(u.name, { role: 'icon', artistId, uid: u.uid });
  await logEvent(req, context, 'signin', s.sid, { via: 'treesh', login: u.name });
  return json(200, { signedIn: true, role: 'icon', artistId, login: u.name, expires: s.exp, repo: REPO }, { 'Set-Cookie': cookie(s.value, MAX_AGE) });
}
async function iconRequest(req){
  let body = {}; try { body = await req.json(); } catch {}
  const u = await supaUser(body.access_token);
  if (!u) return json(401, { message: 'Your Treesh sign-in has expired. Open treesh.app so it refreshes, then try again.', code: 'icon_signin' });
  const all = await iconList('icon-requests'), fresh = !all[u.uid];
  all[u.uid] = { uid: u.uid, name: u.name, email: u.email, artistId: String(body.artistId || u.artistId || '').replace(/[^\w-]/g, ''), note: String(body.note || '').slice(0, 300), t: Date.now() };
  await iconSave('icon-requests', all);
  if (fresh){ const r = all[u.uid]; await sendAlert('icon-access', `${u.name} asked for Icon access`, `${u.name} asked for Icon access in M.A.D.`, [['Name', u.name], ['Email', u.email], ['Says they are', r.artistId ? `Icon #${r.artistId}` : ''], ['Note', r.note]]); }
  return json(200, { ok: true });
}
async function iconAdmin(req, method){
  const reqs = await iconList('icon-requests'), ok = await iconList('icon-approved');
  if (method === 'GET') return json(200, { requests: Object.values(reqs).sort((a, b) => b.t - a.t), approved: Object.values(ok) });
  let body = {}; try { body = await req.json(); } catch {}
  const uid = String(body.uid || ''), r = reqs[uid] || ok[uid];
  if (!r) return json(404, { message: 'Request not found.', code: 'icon_req' });
  if (body.action === 'approve'){ ok[uid] = { ...r, artistId: String(body.artistId || r.artistId || '').replace(/[^\w-]/g, ''), approvedAt: Date.now() }; if (!ok[uid].artistId) return json(400, { message: 'Pick which icon this account belongs to.', code: 'icon_req' }); }
  if (body.action === 'revoke'){ delete ok[uid]; const rv = await iconList('icon-revoked'); rv[uid] = Date.now(); await iconSave('icon-revoked', rv); }
  delete reqs[uid];
  await iconSave('icon-requests', reqs); await iconSave('icon-approved', ok);
  return json(200, { ok: true });
}
// Review results for a signed-in Treesh Icon (treesh.app shows these as notifications). No M.A.D. session needed.
const REJECT_RE = /\*\*Not approved:\*\* ([\s\S]*?)\n<!-- mad-reject -->/;
async function iconUpdates(req, token){
  let body = {}; try { body = await req.json(); } catch {}
  const u = await supaUser(body.access_token);
  if (!u) return json(401, { message: 'Sign in to Treesh first.', code: 'icon_signin' });
  const ok = (await iconList('icon-approved'))[u.uid], artistId = (ok && ok.artistId) || (u.verified ? u.artistId : '');
  if (!artistId) return json(200, { updates: [] });
  const since = Math.max(0, +body.since || 0);
  const r = await fetch(`https://api.github.com/repos/${REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=50`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'treesh-mad' } }).catch(() => null);
  const list = r && r.ok ? await r.json() : [];
  const updates = (Array.isArray(list) ? list : []).filter(p => p.head && String(p.head.ref).startsWith(`icon/${artistId}/`) && Date.parse(p.closed_at) > since)
    .map(p => ({ number: p.number, title: String(p.title || '').replace(/^[^:]+:\s*/, ''), result: p.merged_at ? 'approved' : 'rejected', note: p.merged_at ? '' : ((String(p.body || '').match(REJECT_RE) || [])[1] || ''), at: Date.parse(p.closed_at) }));
  return json(200, { updates, name: u.name });
}
// Email alerts to the admin through Resend (optional): RESEND_API_KEY, MAD_ALERT_EMAIL, MAD_ALERT_FROM, MAD_URL.
const escH = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const MAD_VERSION = '2026-10-09';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const alertTo = () => [process.env.MAD_ALERT_EMAIL, process.env.MAD_ALERT_KEY].map(v => (v || '').trim()).find(v => EMAIL_RE.test(v)) || '';
const BRAND_FROM = 'Treesh M.A.D. <mad@treesh.app>', TEST_FROM = 'Treesh M.A.D. <onboarding@resend.dev>';
const emailReady = () => !!((process.env.RESEND_API_KEY || '').trim() && alertTo());
const maskEmail = e => e.replace(/^(.)[^@]*(@.*)$/, '$1•••$2');
const madUrl = () => { const u = (process.env.MAD_URL || '').trim(); return /^https:\/\/[^\s"'<>]+$/.test(u) ? u : 'https://treesh.app/tools/mad'; };
function alertHtml(head, lines){
  const rows = lines.filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:6px 0;color:#8a8794;font-size:13px;width:110px;vertical-align:top">${escH(k)}</td><td style="padding:6px 0;color:#f5f5f7;font-size:14px">${escH(v)}</td></tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:28px 12px;font-family:Arial,Helvetica,sans-serif"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#141219;border:1px solid #2a2433;border-radius:18px"><tr><td style="padding:26px 28px 8px"><div style="font-size:11px;letter-spacing:3px;color:#b779ff;font-weight:bold">TREESH M.A.D.</div><h1 style="margin:10px 0 0;font-size:20px;line-height:1.35;color:#ffffff">${escH(head)}</h1></td></tr><tr><td style="padding:12px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr><tr><td style="padding:10px 28px 28px"><a href="${escH(madUrl())}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#9328ff;color:#ffffff;font-weight:bold;font-size:14px;text-decoration:none">Open Icon review</a></td></tr></table><p style="max-width:520px;margin:14px auto 0;font-size:11px;line-height:1.5;color:#6d6a75">Sent by Treesh M.A.D. to the admin alert address. To stop these, remove MAD_ALERT_EMAIL in Netlify.</p></td></tr></table>`;
}
// Sends from mad@treesh.app (or MAD_ALERT_FROM); until the domain is verified in Resend it falls back to Resend's test sender.
async function sendAlert(kind, subject, head, lines){
  if (!emailReady()) return { ok: false, message: `Email alerts aren’t set up. In Netlify add ${(process.env.RESEND_API_KEY || '').trim() ? '' : 'RESEND_API_KEY'}${!(process.env.RESEND_API_KEY || '').trim() && !alertTo() ? ' and ' : ''}${alertTo() ? '' : 'MAD_ALERT_EMAIL (your email address)'}, then redeploy.` };
  const payload = from => JSON.stringify({ from, to: [alertTo()], subject, html: alertHtml(head, lines), text: [head, '', ...lines.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`), '', `Open Icon review: ${madUrl()}`].join('\n'), tags: [{ name: 'kind', value: kind }] });
  const post = from => fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(6000), headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`, 'Content-Type': 'application/json' }, body: payload(from) });
  try {
    const first = (process.env.MAD_ALERT_FROM || '').trim() || BRAND_FROM;
    let from = first, r = await post(from), d = r.ok ? {} : await r.json().catch(() => ({}));
    if (!r.ok && from !== TEST_FROM && /domain/i.test(d.message || '') && /verif/i.test(d.message || '')){ from = TEST_FROM; r = await post(from); d = r.ok ? {} : await r.json().catch(() => ({})); }
    const sender = from.replace(/^.*<([^>]+)>.*$/, '$1');
    if (r.ok) return { ok: true, to: maskEmail(alertTo()), from: sender, fallback: from !== first };
    return { ok: false, message: `Resend: ${d.message || `error ${r.status}`}` };
  } catch { return { ok: false, message: 'Couldn’t reach Resend. Try again.' }; }
}
// A revoked icon's older sessions stop working.
async function iconRevoked(sess){ const at = (await iconList('icon-revoked'))[sess.uid]; return !!at && at > sess.exp - MAX_AGE * 1000; }
// Top-level content blocks (artists, songs, lyrics, models) with balanced nesting; comments and everything else is "rest".
function blocksOf(text){
  const out = [], re = /<!--[\s\S]*?-->|<(article|div|ul)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi; let m, last = 0, rest = '';
  while ((m = re.exec(text))){
    if (!m[1]) continue;
    const cm = m[2].match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (!cm || !(cm[1] ?? cm[2]).split(/\s+/).some(c => /^(artist|song|lyric|model)$/i.test(c))) continue;
    const tok = new RegExp(`<${m[1]}\\b|<\\/${m[1]}\\s*>`, 'gi'); tok.lastIndex = re.lastIndex; let depth = 1, t;
    while (depth && (t = tok.exec(text))) depth += t[0][1] === '/' ? -1 : 1;
    if (depth) break;
    rest += text.slice(last, m.index); out.push(text.slice(m.index, tok.lastIndex)); last = re.lastIndex = tok.lastIndex;
  }
  return { blocks: out, rest: rest + text.slice(last) };
}
const attrOf = (b, n) => { const m = b.slice(0, b.indexOf('>') + 1).match(new RegExp(`\\s${n}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i')); return m ? (m[1] ?? m[2]) : ''; };
const idsOf = b => attrOf(b, 'data-artist-id').split(/[\s,]+/).filter(Boolean);
const titleKey = s => String(s).toLowerCase().replace(/&amp;/g, '&').replace(/[^a-z0-9]+/g, '');
const ownerOf = (id, titles) => b => { const cls = attrOf(b, 'class'); if (/\bmodel\b/i.test(cls)) return false; const ids = idsOf(b); return ids.includes(id) || (/\blyric\b/i.test(cls) && !ids.length && titles.has(titleKey(attrOf(b, 'data-track')))); };
// Icons may add, change, move or remove only their own blocks; everyone else's blocks must stay identical and in the same order.
function scopeOk(base, next, own){
  const a = blocksOf(base), b = blocksOf(next);
  if (a.rest.replace(/\s+/g, '') !== b.rest.replace(/\s+/g, '')) return false;
  const others = l => l.filter(x => !own(x)).join('\n');
  return others(a.blocks) === others(b.blocks);
}
async function iconGuard(sess, method, rest, text, token){
  const deny = m => json(403, { message: m, code: 'icon_scope' }), pre = `icon/${sess.artistId}/`;
  if (method === 'GET') return null;
  let body = {}; try { body = JSON.parse(text || '{}'); } catch { return deny('Bad request.'); }
  if (method === 'POST' && rest === '/git/refs') return String(body.ref || '').startsWith('refs/heads/' + pre) && /^refs\/heads\/[\w./-]+$/.test(body.ref) ? null : deny('Icons can only create review branches.');
  if (method === 'POST' && rest === '/pulls') return String(body.head || '').startsWith(pre) && body.base === 'main' ? null : deny('Icons can only open review requests.');
  if (method === 'PUT' && rest.startsWith('/contents/')){
    const path = decodeURIComponent(rest.slice('/contents/'.length));
    if (!ICON_FILES.includes(path)) return deny('Icons can’t edit that file.');
    if (!String(body.branch || '').startsWith(pre)) return deny('Icon changes always go to admin review.');
    const get = async (p, ref) => { const g = await fetch(`https://api.github.com/repos/${REPO}/contents/${p.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref)}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'treesh-mad' } }); return g.ok ? Buffer.from((await g.json()).content || '', 'base64').toString('utf8') : ''; };
    const titles = new Set();
    if (path === 'content/lyrics.html') for (const ref of ['main', body.branch]) blocksOf(await get('content/songs.html', ref)).blocks.filter(x => idsOf(x).includes(sess.artistId)).forEach(x => titles.add(titleKey(attrOf(x, 'data-track'))));
    const next = Buffer.from(body.content || '', 'base64').toString('utf8');
    return scopeOk(await get(path, 'main'), next, ownerOf(sess.artistId, titles)) ? null : deny('That change touches content that isn’t yours. Only your own profile, songs and lyrics can be edited.');
  }
  return deny('That action isn’t available to icon accounts.');
}

async function activity(sess){
  const log = await readKey('activity', []), list = Array.isArray(log) ? log : [];
  const day = Date.now() - 864e5;
  return json(200, {
    stored: !!blobs(),
    failed24h: list.filter(e => e.t > day && e.result !== 'signin').length,
    entries: list.map(({ sid, ...e }) => ({ ...e, current: !!sid && sid === sess.sid }))
  });
}

export default async (req, context) => {
  const token = process.env.GITHUB_TOKEN, pass = passcode();
  if (!token || pass.length < MIN_PASSCODE) return json(500, { message: `Server not set up: add GITHUB_TOKEN and MAD_PASSCODE (${MIN_PASSCODE}+ characters) in Netlify, then redeploy.`, code: 'setup' });

  const url = new URL(req.url), method = req.method.toUpperCase();
  const sub = url.pathname.replace(/^\/api\/github/, '').replace(/\/+$/, '');
  if (method !== 'GET' && !sameOrigin(req)) return json(403, { message: 'Blocked: request did not come from this site.', code: 'origin' });

  if (sub === '/session') return session(req, context, method);
  if (sub === '/oauth/start' && method === 'GET') return oauthStart(url);
  if (sub === '/oauth/callback' && method === 'GET') return oauthCallback(req, context, url);
  if (sub === '/icon-session' && method === 'POST') return iconSession(req, context);
  if (sub === '/icon-request' && method === 'POST') return iconRequest(req);
  if (sub === '/icon-updates' && method === 'POST') return iconUpdates(req, token);
  const sess = readSession(req);
  if (sess && sess.role === 'icon' && await iconRevoked(sess)) return json(401, { message: 'Your M.A.D. access was turned off. Ask Treesh admin if this is a mistake.', code: 'session' });
  if (!sess) return json(401, { message: 'Signed out. Sign in to M.A.D. in Settings.', code: 'session' });
  if (sess.role === 'icon' && (sub === '/activity' || sub === '/icon-admin')) return json(403, { message: 'Admins only.', code: 'admin' });
  if (sub === '/activity' && method === 'GET') return activity(sess);
  if (sub === '/icon-admin') return iconAdmin(req, method);
  if (sub === '/alert-test' && method === 'POST'){ const r = await sendAlert('test', 'M.A.D. email alerts are working', 'Email alerts are working', [['Sent to', alertTo()], ['You’ll get', 'New icon changes and Icon access requests']]); return json(r.ok ? 200 : 502, r.ok ? r : { message: r.message, code: 'email' }); }
  if (sub === '/imagekit-auth' && method === 'GET'){
    const pk = (process.env.IMAGEKIT_PRIVATE_KEY || '').trim(), pub = (process.env.IMAGEKIT_PUBLIC_KEY || '').trim();
    if (!pk || !pub) return json(503, { message: 'ImageKit isn’t set up yet. Add IMAGEKIT_PUBLIC_KEY and IMAGEKIT_PRIVATE_KEY in Netlify, then redeploy.', code: 'imagekit' });
    const token = randomBytes(16).toString('hex'), expire = Math.floor(Date.now() / 1000) + 600;
    return json(200, { token, expire, signature: createHmac('sha1', pk).update(token + String(expire)).digest('hex'), publicKey: pub, folder: '/mad' });
  }

  if (sub !== '/repo' && !sub.startsWith('/repo/')) return json(404, { message: 'Unknown M.A.D. route.', code: 'route' });
  const rest = sub.slice('/repo'.length);
  let decoded = rest;
  try { decoded = decodeURIComponent(rest); } catch { return json(400, { message: 'Bad path.', code: 'path' }); }
  if (/(^|\/)\.\.?(\/|$)/.test(decoded) || /[\\\0]/.test(decoded) || !ALLOW.some(([m, re]) => m === method && re.test(rest))){
    return json(403, { message: 'That GitHub action isn’t allowed through M.A.D.', code: 'blocked' });
  }
  const target = new URL(`https://api.github.com/repos/${REPO}${rest}${url.search}`);
  if (target.pathname !== `/repos/${REPO}` && !target.pathname.startsWith(`/repos/${REPO}/`)) return json(403, { message: 'Blocked path.', code: 'blocked' });

  const text = method === 'GET' ? undefined : await req.text();
  if (sess.role === 'icon'){ const no = await iconGuard(sess, method, rest, text, token); if (no) return no; }
  let res;
  try {
    res = await fetch(target, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'treesh-mad',
        ...(method === 'GET' ? {} : { 'Content-Type': 'application/json' })
      },
      body: method === 'GET' ? undefined : text
    });
  } catch {
    return json(502, { message: 'The M.A.D. server couldn’t reach GitHub. Try again.', code: 'upstream' });
  }
  if (res.status === 401) return json(502, { message: 'GitHub rejected the server token. Update GITHUB_TOKEN in Netlify and redeploy.', code: 'server-token' });
  let out = await res.text();
  if (sess.role === 'icon' && method === 'POST' && rest === '/pulls' && res.status === 201){ try { const pr = JSON.parse(out); await sendAlert('icon-change', `${sess.login || 'An Icon'} sent a change for review`, `${sess.login || 'An Icon'} sent a change for review`, [['Icon', `${sess.login || ''} (#${sess.artistId})`], ['Change', String(pr.title || '').replace(/^[^:]+:\s*/, '')], ['Request', `#${pr.number}`]]); } catch {} }
  if (sess.role === 'icon' && method === 'GET' && rest === '/pulls' && res.ok){ try { out = JSON.stringify(JSON.parse(out).filter(p => p.head && String(p.head.ref).startsWith(`icon/${sess.artistId}/`))); } catch { out = '[]'; } }
  return new Response(out, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
};
