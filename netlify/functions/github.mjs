// Treesh M.A.D. secure GitHub proxy (Netlify Function). GITHUB_TOKEN never leaves the server.
// Netlify env vars: GITHUB_TOKEN (required), MAD_PASSCODE (required, 12+ chars), MAD_SESSION_SECRET (optional), MAD_REPO (optional, default TreeshWoodz/Treesh)
// ImageKit uploads (optional): IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY
// GitHub sign-in (optional): GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET, MAD_GITHUB_USERS (comma list, default TreeshWoodz). Callback: https://<site>/api/github/oauth/callback
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
function newSession(login){
  const exp = Date.now() + MAX_AGE * 1000, sid = randomBytes(9).toString('base64url');
  const data = Buffer.from(JSON.stringify({ exp, sid, ...(login ? { login } : {}) })).toString('base64url');
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
  if (method === 'GET'){ const s = readSession(req); return json(200, { signedIn: !!s, expires: s ? s.exp : null, login: (s && s.login) || null, repo: REPO, activity: !!blobs(), oauth: oauthReady() }); }
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
  const sess = readSession(req);
  if (!sess) return json(401, { message: 'Signed out. Sign in to M.A.D. in Settings.', code: 'session' });
  if (sub === '/activity' && method === 'GET') return activity(sess);
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
      body: method === 'GET' ? undefined : await req.text()
    });
  } catch {
    return json(502, { message: 'The M.A.D. server couldn’t reach GitHub. Try again.', code: 'upstream' });
  }
  if (res.status === 401) return json(502, { message: 'GitHub rejected the server token. Update GITHUB_TOKEN in Netlify and redeploy.', code: 'server-token' });
  return new Response(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
};
