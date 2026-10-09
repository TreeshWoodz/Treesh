// Local harness: runs netlify/functions/icon.mjs on :8790 with an in-memory GitHub repo + fake Supabase my_status.
// Tokens: tok_icon_chelly (#11 Chelly Banqz), tok_icon_sav (#3 SAVIONCE), tok_icon_pbq (#6 PrettyBoyQuen), tok_admin / tok_us1 (admin), tok_mod (moderator), tok_user (not an Icon), tok_unlinked (verified, no Icon)
import http from 'node:http';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
process.env.GITHUB_TOKEN = 'gh_test'; process.env.SUPABASE_URL = 'https://sb.test'; process.env.SUPABASE_PUBLISHABLE_KEY = 'pk_test';
process.env.ICON_CLOUD_NAME = process.env.ICON_CLOUD_NAME || ''; 
const SRC = { 'content/songs.html': '/tmp/live_songs.dot.html', 'content/lyrics.html': '/tmp/live_lyrics.dot.html', 'content/icons.html': '/tmp/live_icons.dot.html' };
const STATUS = {
  tok_icon_chelly: { role: 'user', verified: true, verified_icon: '11' }, tok_icon_sav: { role: 'user', verified: true, verified_icon: '3' }, tok_icon_pbq: { role: 'user', verified: true, verified_icon: '6' },
  tok_admin: { role: 'admin', verified: false, verified_icon: null }, tok_us1: { role: 'admin', verified: false, verified_icon: null }, tok_mod: { role: 'moderator', verified: false, verified_icon: null },
  tok_user: { role: 'user', verified: false, verified_icon: null }, tok_ua1: { role: 'user', verified: true, verified_icon: '11' }, tok_unlinked: { role: 'user', verified: true, verified_icon: null }, tok_banned: { role: 'user', verified: true, verified_icon: '11', banned_until: '2999-01-01T00:00:00Z' }
};
let S;
const sha = t => createHash('sha1').update(t).digest('hex');
function reset(){ const files = {}; Object.entries(SRC).forEach(([k, v]) => { files[k] = fs.readFileSync(v, 'utf8'); }); const c0 = 'c' + Date.now(); S = { branches: { main: { files, commit: c0 } }, commits: { [c0]: { ...files } }, pulls: [], comments: [], seq: 100, log: [] }; }
const snap = br => { S.commits[br.commit] = { ...br.files }; };
const changed = (a, b) => Object.keys(b).filter(k => a[k] !== b[k]);
reset();
const J = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
function fakeGitHub(url, init){
  const u = new URL(url), method = (init.method || 'GET').toUpperCase(), p = decodeURIComponent(u.pathname.replace(/^\/repos\/TreeshWoodz\/Treesh/, '')), raw = /raw/.test((init.headers || {}).Accept || '');
  const body = init.body ? JSON.parse(init.body) : null; S.log.push(`${method} ${p}${u.search}`);
  let m;
  if (p === '' ) return J(200, { full_name: 'TreeshWoodz/Treesh', private: true, permissions: { push: true } });
  if ((m = p.match(/^\/contents\/(.+)$/))){
    const path = m[1];
    if (method === 'GET'){ const ref = u.searchParams.get('ref') || 'main', br = S.branches[ref] || (S.commits[ref] && { files: S.commits[ref] }); if (!br || br.files[path] == null) return J(404, { message: 'Not Found' }); const t = br.files[path]; return raw ? new Response(t, { status: 200 }) : J(200, { content: Buffer.from(t).toString('base64'), sha: sha(t), encoding: 'base64' }); }
    if (method === 'PUT'){ const br = S.branches[body.branch]; if (!br) return J(404, { message: 'Branch not found' }); const cur = br.files[path]; if (cur != null && body.sha !== sha(cur)) return J(409, { message: 'sha mismatch' }); br.files[path] = Buffer.from(body.content, 'base64').toString('utf8'); br.commit = 'c' + (++S.seq); br.msg = body.message; snap(br); return J(200, { content: { path }, commit: { sha: br.commit } }); }
  }
  if ((m = p.match(/^\/git\/ref\/heads\/(.+)$/))){ const br = S.branches[m[1]]; return br ? J(200, { ref: 'refs/heads/' + m[1], object: { sha: br.commit } }) : J(404, { message: 'Not Found' }); }
  if (p === '/git/refs' && method === 'POST'){ const name = body.ref.replace('refs/heads/', ''); if (S.branches[name]) return J(422, { message: 'Reference already exists' }); const from = S.commits[body.sha] ? { files: S.commits[body.sha], commit: body.sha } : null; if (!from) return J(422, { message: 'bad sha' }); S.branches[name] = { files: { ...from.files }, commit: from.commit, base: from.commit }; return J(201, { ref: body.ref }); }
  if ((m = p.match(/^\/git\/refs\/heads\/(.+)$/)) && method === 'DELETE'){ delete S.branches[m[1]]; return new Response(null, { status: 204 }); }
  if ((m = p.match(/^\/compare\/([^.]+)\.\.\.(.+)$/))){ const a = S.branches[m[1]], b = S.branches[m[2]] || Object.values(S.branches).find(x => x.commit === m[2]); if (!a || !b) return J(404, { message: 'Not Found' }); const mb = b.base || a.commit; return J(200, { merge_base_commit: { sha: mb }, files: changed(S.commits[mb] || a.files, b.files).map(filename => ({ filename })) }); }
  if (p === '/pulls' && method === 'GET'){ const st = u.searchParams.get('state') || 'open'; return J(200, S.pulls.filter(x => st === 'all' || x.state === st).slice().reverse()); }
  if (p === '/pulls' && method === 'POST'){ const br = S.branches[body.head]; if (!br) return J(422, { message: 'head missing' }); const n = ++S.seq; const pr = { number: n, title: body.title, body: body.body, state: 'open', merged_at: null, closed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), html_url: `https://github.com/TreeshWoodz/Treesh/pull/${n}`, head: { ref: body.head, sha: br.commit }, base: { ref: body.base }, mergeable: true }; S.pulls.push(pr); return J(201, pr); }
  if ((m = p.match(/^\/pulls\/(\d+)$/))){ const pr = S.pulls.find(x => x.number === +m[1]); if (!pr) return J(404, { message: 'Not Found' }); if (method === 'PATCH'){ Object.assign(pr, { state: body.state, closed_at: new Date().toISOString() }); } const br = S.branches[pr.head.ref]; if (br) pr.head.sha = br.commit; return J(200, pr); }
  if ((m = p.match(/^\/pulls\/(\d+)\/files$/))){ const pr = S.pulls.find(x => x.number === +m[1]); if (!pr) return J(404, { message: 'Not Found' }); const br = S.branches[pr.head.ref] || pr._frozen; if (!br) return J(200, []); return J(200, changed(S.commits[br.base] || S.branches.main.files, br.files).map(filename => ({ filename, additions: 3, deletions: 1, status: 'modified' }))); }
  if ((m = p.match(/^\/pulls\/(\d+)\/merge$/)) && method === 'PUT'){ const pr = S.pulls.find(x => x.number === +m[1]); const br = S.branches[pr.head.ref], base = S.commits[br.base] || {}, mainF = S.branches.main.files, ks = changed(base, br.files); if (ks.some(k => mainF[k] !== base[k])) return J(409, { message: 'Merge conflict' }); ks.forEach(k => { mainF[k] = br.files[k]; }); S.branches.main.commit = 'c' + (++S.seq); snap(S.branches.main); Object.assign(pr, { state: 'closed', merged_at: new Date().toISOString(), closed_at: new Date().toISOString(), _frozen: br }); return J(200, { merged: true }); }
  if ((m = p.match(/^\/issues\/(\d+)\/comments$/)) && method === 'POST'){ S.comments.push({ n: +m[1], body: body.body }); return J(201, { id: S.seq++ }); }
  return J(404, { message: 'fake: unhandled ' + method + ' ' + p });
}
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  if (url.startsWith('https://api.github.com/repos/TreeshWoodz/Treesh')) return fakeGitHub(url, init);
  if (url.startsWith('https://sb.test/rest/v1/rpc/my_status')){ const tok = ((init.headers || {}).Authorization || '').replace('Bearer ', ''), st = STATUS[tok]; return st ? J(200, { ...st, mod_rev: 0, profile: {} }) : J(401, { message: 'JWT invalid' }); }
  return realFetch(url, init);
};
const { default: handler, scopeCheck } = await import('/app/single_html/netlify/functions/icon.mjs');
export { scopeCheck };
if (process.argv[2] !== 'lib'){
  http.createServer(async (req, res) => {
    if (req.url === '/__state'){ res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ pulls: S.pulls.map(p => ({ number: p.number, title: p.title, state: p.state, merged: !!p.merged_at, head: p.head.ref })), branches: Object.keys(S.branches), comments: S.comments, log: S.log.slice(-40) })); }
    if (req.url === '/__reset'){ reset(); res.writeHead(200); return res.end('ok'); }
    if (req.url.startsWith('/__main/')){ res.writeHead(200); return res.end(S.branches.main.files['content/' + req.url.slice(8)] || ''); }
    const chunks = []; for await (const c of req) chunks.push(c);
    const r = await handler(new Request('http://localhost:8790' + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }), {});
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
  }).listen(8790, () => console.log('icon dev server :8790'));
}
