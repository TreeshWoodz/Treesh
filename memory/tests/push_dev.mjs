// Local harness: runs netlify/functions/push.mjs + deploy-succeeded.mjs on :8791 with a fake Supabase (https://sb.test, in memory)
// and a fake push service on https://localhost:8792 (self-signed) that decrypts what it receives for subscriptions made via /__fake_sub.
// Tokens: tok_ua1 (Alice, user), tok_ub1 (Bobby, user), tok_us1 (Staff, admin), tok_mod (moderator), tok_banned (admin, banned). Anything else = 401.
// Debug: GET /__state, POST /__reset, POST /__seed {table:[rows]}, GET /__fake_sub?id=x, POST /__version {v,title,notes}, POST /__deploy {context}, POST /__notify (signed hook call)
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { createECDH, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire('/app/single_html/package.json');
const ece = require('http_ece');
const V = JSON.parse(fs.readFileSync('/app/memory/tests/vapid_test_keys.json', 'utf8'));
const HOOK = fs.readFileSync('/app/memory/tests/push_hook_test_secret.txt', 'utf8').trim();
Object.assign(process.env, { VAPID_PUBLIC_KEY: V.publicKey, VAPID_PRIVATE_KEY: V.privateKey, SUPABASE_URL: 'https://sb.test', SUPABASE_SECRET_KEY: 'sb_secret_test', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_TEST', PUSH_HOOK_SECRET: HOOK, PUSH_EXTRA_HOSTS: 'localhost', URL: 'https://site.test', NODE_TLS_REJECT_UNAUTHORIZED: '0' });
const PORT = +(process.env.PUSH_DEV_PORT || 8791), PPORT = PORT + 1;
const USERS = { tok_ua1: 'ua1', tok_ub1: 'ub1', tok_us1: 'us1', tok_mod: 'um1', tok_banned: 'ux1' };
const STATUS = { tok_ua1: { role: 'user' }, tok_ub1: { role: 'user' }, tok_us1: { role: 'admin', uid: 'us1' }, tok_mod: { role: 'moderator' }, tok_banned: { role: 'admin', banned_until: '2999-01-01T00:00:00Z' } };
let S;
function reset(){ S = { t: { push_subscriptions: [], treesh_push_state: [], announcements: [], notifications: [] }, seq: 0, pushes: [], keys: {}, version: { v: 'v1', title: 'A new version of Treesh is ready', notes: 'Fresh features' }, sbLog: [] }; }
reset();

/* ---------- fake Supabase REST (just what push-lib uses) ---------- */
const J = (status, body, headers) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...(headers || {}) } });
const val = v => v === 'null' ? null : v === 'true' ? true : v === 'false' ? false : v;
function filt(rows, q){ let out = rows;
  for (const [k, v] of q){ if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(k)) continue; const m = /^(eq|neq|lt|gt)\.(.*)$/.exec(v); if (!m) continue; const x = val(m[2]);
    out = out.filter(r => m[1] === 'eq' ? String(r[k]) === String(x) && (x !== null || r[k] == null) : m[1] === 'neq' ? String(r[k]) !== String(x) : m[1] === 'lt' ? r[k] < x : r[k] > x); }
  return out; }
function fakeSb(url, init){
  const u = new URL(url), method = (init.method || 'GET').toUpperCase(), h = init.headers || {}, q = [...u.searchParams.entries()];
  S.sbLog.push(`${method} ${u.pathname}${u.search}`);
  if (u.pathname === '/auth/v1/user'){ const tok = (h.Authorization || '').replace('Bearer ', ''); if (h.apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) return J(401, { message: 'bad apikey' }); return USERS[tok] ? J(200, { id: USERS[tok] }) : J(401, { message: 'invalid JWT' }); }
  if (u.pathname === '/rest/v1/rpc/my_status'){ const tok = (h.Authorization || '').replace('Bearer ', ''); return STATUS[tok] ? J(200, { ...STATUS[tok], verified: false }) : J(401, { message: 'invalid JWT' }); }
  const tm = /^\/rest\/v1\/([a-z_]+)$/.exec(u.pathname); if (!tm) return J(404, { message: 'fake sb: ' + u.pathname });
  if (h.apikey !== process.env.SUPABASE_SECRET_KEY) return J(401, { message: 'secret key required' });
  if (h.Authorization) return J(401, { message: 'sb_secret keys must not be sent as Bearer' });
  const T = S.t[tm[1]]; if (!T) return J(404, { code: '42P01', message: `relation "public.${tm[1]}" does not exist` });
  const prefer = h.Prefer || '', body = init.body ? JSON.parse(init.body) : null;
  if (method === 'GET' || method === 'HEAD'){ let rows = filt(T, q); const ord = u.searchParams.get('order');
    if (ord){ const [c, d] = ord.split('.'); rows = rows.slice().sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (d === 'desc' ? -1 : 1)); }
    const off = +(u.searchParams.get('offset') || 0), lim = u.searchParams.get('limit'); const page = rows.slice(off, lim ? off + +lim : undefined);
    const sel = (u.searchParams.get('select') || '*').split(','), pick = r => sel[0] === '*' ? r : Object.fromEntries(sel.map(c => [c, r[c] === undefined ? null : r[c]]));
    if (method === 'HEAD') return new Response(null, { status: 200, headers: { 'content-range': `*/${rows.length}` } });
    return J(200, page.map(pick)); }
  if (method === 'POST'){ const list = Array.isArray(body) ? body : [body], oc = u.searchParams.get('on_conflict'), out = [];
    for (const r of list){ const row = { ...r }; if (tm[1] === 'announcements'){ row.id = ++S.seq; row.created_at = new Date().toISOString(); row.sent = row.sent || 0; }
      if (tm[1] === 'push_subscriptions' && !row.created_at) row.created_at = new Date(Date.now() + S.seq++).toISOString();
      const i = oc ? T.findIndex(x => x[oc] === row[oc]) : -1;
      if (i >= 0){ if (!/merge-duplicates/.test(prefer)) return J(409, { code: '23505', message: 'duplicate' }); T[i] = { ...T[i], ...row, created_at: T[i].created_at }; out.push(T[i]); }
      else { T.push(row); out.push(row); } }
    return /return=representation/.test(prefer) ? J(201, out) : new Response(null, { status: 201 }); }
  if (method === 'PATCH'){ const rows = filt(T, q); rows.forEach(r => Object.assign(r, body)); return /return=representation/.test(prefer) ? J(200, rows) : new Response(null, { status: 204 }); }
  if (method === 'DELETE'){ const rows = new Set(filt(T, q)); S.t[tm[1]] = T.filter(r => !rows.has(r)); return new Response(null, { status: 204 }); }
  return J(405, { message: 'fake sb: method' });
}
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => { url = String(url);
  if (url.startsWith('https://sb.test/')) return fakeSb(url, init);
  if (url.startsWith('https://site.test/version.json') || /^https:\/\/[a-z0-9-]+--site\.test\/version\.json/.test(url)) return S.version ? J(200, S.version) : J(404, { message: 'no' });
  return realFetch(url, init); };

/* ---------- fake push service ---------- */
const TLS = '/tmp/push_dev_tls'; fs.mkdirSync(TLS, { recursive: true });
if (!fs.existsSync(TLS + '/key.pem')) execSync(`openssl req -x509 -newkey rsa:2048 -nodes -keyout ${TLS}/key.pem -out ${TLS}/cert.pem -days 365 -subj "/CN=localhost" 2>/dev/null`);
function fakeSub(id){ const ecdh = createECDH('prime256v1'); ecdh.generateKeys(); const auth = randomBytes(16);
  S.keys[id] = { priv: ecdh.getPrivateKey('base64'), auth: auth.toString('base64') };
  return { endpoint: `https://localhost:${PPORT}/push/${id}`, expirationTime: null, keys: { p256dh: ecdh.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } }; }
function decrypt(id, buf){ const k = S.keys[id]; if (!k) return null; try { const ecdh = createECDH('prime256v1'); ecdh.setPrivateKey(Buffer.from(k.priv, 'base64')); return JSON.parse(ece.decrypt(buf, { version: 'aes128gcm', privateKey: ecdh, authSecret: Buffer.from(k.auth, 'base64') }).toString('utf8')); } catch (e) { return { _decryptError: e.message }; } }
https.createServer({ key: fs.readFileSync(TLS + '/key.pem'), cert: fs.readFileSync(TLS + '/cert.pem') }, (req, res) => {
  const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => {
    const id = decodeURIComponent((req.url.match(/^\/push\/([^/?]+)/) || [])[1] || ''), buf = Buffer.concat(chunks);
    const rec = { id, at: Date.now(), ttl: req.headers.ttl, urgency: req.headers.urgency || null, topic: req.headers.topic || null, encoding: req.headers['content-encoding'], vapid: /^vapid t=.+, k=.+$/.test(req.headers.authorization || ''), bytes: buf.length, payload: decrypt(id, buf) };
    const code = /^gone/.test(id) ? 410 : /^fail/.test(id) ? 500 : 201; rec.status = code; S.pushes.push(rec);
    res.writeHead(code); res.end(); }); }).listen(PPORT, () => console.log('fake push service on https://localhost:' + PPORT));

/* ---------- the functions ---------- */
const { default: push } = await import('/app/single_html/netlify/functions/push.mjs');
const { handler: deployed } = await import('/app/single_html/netlify/functions/deploy-succeeded.mjs');
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
const send = (res, status, body, type) => { res.writeHead(status, { 'content-type': type || 'application/json', ...CORS }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c); const raw = Buffer.concat(chunks).toString('utf8'), u = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (req.method === 'OPTIONS') return send(res, 204, '');
    if (u.pathname === '/__state') return send(res, 200, { tables: S.t, pushes: S.pushes, version: S.version, sbLog: S.sbLog.slice(-60) });
    if (u.pathname === '/__reset'){ reset(); return send(res, 200, { ok: true }); }
    if (u.pathname === '/__seed'){ const b = JSON.parse(raw || '{}'); for (const [k, rows] of Object.entries(b)) S.t[k] = (S.t[k] || []).concat(rows); return send(res, 200, { ok: true }); }
    if (u.pathname === '/__fake_sub') return send(res, 200, fakeSub(u.searchParams.get('id') || ('dev' + Date.now())));
    if (u.pathname === '/__version'){ S.version = raw ? JSON.parse(raw) : null; return send(res, 200, { ok: true }); }
    if (u.pathname === '/__deploy'){ const b = raw ? JSON.parse(raw) : {}; const r = await deployed({ body: JSON.stringify({ payload: { context: b.context || 'production', deploy_ssl_url: b.url || 'https://abc123--site.test', ssl_url: 'https://site.test' } }) }); return send(res, 200, { ...r, state: S.t.treesh_push_state, announcements: S.t.announcements }); }
    if (u.pathname === '/__notify'){ const r = await push(new Request(`http://localhost:${PORT}/api/push/notify`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-treesh-push': HOOK }, body: raw })); return send(res, r.status, await r.text()); }
    if (u.pathname === '/api/push' || u.pathname.startsWith('/api/push/')){
      const h = {}; for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') h[k] = v;
      const r = await push(new Request(`http://localhost:${PORT}${req.url}`, { method: req.method, headers: h, body: ['GET', 'HEAD'].includes(req.method) ? undefined : raw }));
      res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'application/json', 'cache-control': r.headers.get('cache-control') || '', ...CORS }); return res.end(await r.text()); }
    send(res, 404, { message: 'push_dev: not found' });
  } catch (e) { console.error(e); send(res, 500, { message: String(e && e.message || e) }); }
}).listen(PORT, () => console.log('push dev on http://localhost:' + PORT));
