// Treesh M.A.D. secure GitHub proxy (Netlify Function). GITHUB_TOKEN never leaves the server.
// Netlify env vars: GITHUB_TOKEN (required), MAD_PASSCODE (required, 12+ chars), MAD_SESSION_SECRET (optional), MAD_REPO (optional, default TreeshWoodz/Treesh)
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const config = { path: ['/api/github', '/api/github/*'] };

const REPO = process.env.MAD_REPO || 'TreeshWoodz/Treesh';
const COOKIE = 'mad_session';
const MAX_AGE = 60 * 60 * 24 * 30;
const MIN_PASSCODE = 12;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const fails = new Map();

// Only the GitHub calls M.A.D. actually makes, relative to /repos/<REPO>
const ALLOW = [
  ['GET', /^$/],
  ['GET', /^\/contents\/[^?#]+$/],
  ['PUT', /^\/contents\/[^?#]+$/],
  ['GET', /^\/git\/ref\/heads\/[^?#]+$/],
  ['POST', /^\/git\/refs$/],
  ['GET', /^\/pulls$/],
  ['POST', /^\/pulls$/]
];

const json = (status, body, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }
});
const digest = s => createHash('sha256').update(String(s)).digest();
const same = (a, b) => timingSafeEqual(digest(a), digest(b));
const secret = () => process.env.MAD_SESSION_SECRET || createHash('sha256').update(`${process.env.MAD_PASSCODE}|${process.env.GITHUB_TOKEN}`).digest('hex');
const sign = data => createHmac('sha256', secret()).update(data).digest('base64url');
const cookie = (value, maxAge) => `${COOKIE}=${value}; Path=/api/github; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;

function newSession(){
  const exp = Date.now() + MAX_AGE * 1000, data = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return { value: `${data}.${sign(data)}`, exp };
}
function readSession(req){
  const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)mad_session=([^;]+)/);
  if (!m) return null;
  const [data, sig] = m[1].split('.');
  if (!data || !sig || !same(sig, sign(data))) return null;
  try { const p = JSON.parse(Buffer.from(data, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch { return null; }
}
function sameOrigin(req){
  const origin = req.headers.get('origin');
  if (!origin) return req.headers.get('sec-fetch-site') !== 'cross-site';
  try { return new URL(origin).host === new URL(req.url).host; } catch { return false; }
}
function lockedFor(ip){ const f = fails.get(ip); return f && f.until > Date.now() ? f.until - Date.now() : 0; }
function addFail(ip){
  const f = fails.get(ip) || { n: 0, until: 0 };
  f.n += 1;
  if (f.n >= MAX_FAILS){ f.n = 0; f.until = Date.now() + LOCK_MS; }
  fails.set(ip, f);
}

async function session(req, context, method){
  if (method === 'GET'){ const s = readSession(req); return json(200, { signedIn: !!s, expires: s ? s.exp : null, repo: REPO }); }
  if (method === 'DELETE') return json(200, { signedIn: false, repo: REPO }, { 'Set-Cookie': cookie('', 0) });
  if (method !== 'POST') return json(405, { message: 'Method not allowed.' });
  const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
  const wait = lockedFor(ip);
  if (wait) return json(429, { message: `Too many wrong tries. Wait ${Math.ceil(wait / 60000)} min and try again.`, code: 'locked' });
  let body = {};
  try { body = await req.json(); } catch {}
  if (typeof body.passcode !== 'string' || !same(body.passcode, process.env.MAD_PASSCODE)){
    addFail(ip);
    await new Promise(r => setTimeout(r, 800));
    return json(401, { message: 'Wrong passcode.', code: 'passcode' });
  }
  fails.delete(ip);
  const s = newSession();
  return json(200, { signedIn: true, expires: s.exp, repo: REPO }, { 'Set-Cookie': cookie(s.value, MAX_AGE) });
}

export default async (req, context) => {
  const token = process.env.GITHUB_TOKEN, pass = process.env.MAD_PASSCODE || '';
  if (!token || pass.length < MIN_PASSCODE) return json(500, { message: `Server not set up: add GITHUB_TOKEN and MAD_PASSCODE (${MIN_PASSCODE}+ characters) in Netlify, then redeploy.`, code: 'setup' });

  const url = new URL(req.url), method = req.method.toUpperCase();
  const sub = url.pathname.replace(/^\/api\/github/, '').replace(/\/+$/, '');
  if (method !== 'GET' && !sameOrigin(req)) return json(403, { message: 'Blocked: request did not come from this site.', code: 'origin' });

  if (sub === '/session') return session(req, context, method);
  if (!readSession(req)) return json(401, { message: 'Signed out. Sign in to M.A.D. in Settings.', code: 'session' });

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
