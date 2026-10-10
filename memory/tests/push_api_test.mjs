// API tests for netlify/functions/push.mjs + deploy-succeeded.mjs. Start the harness first: node /app/memory/tests/push_dev.mjs
const B = process.env.PUSH_DEV || 'http://localhost:8791';
const V = JSON.parse((await import('node:fs')).readFileSync('/app/memory/tests/vapid_test_keys.json', 'utf8'));
let pass = 0, fail = 0; const bad = [];
const ok = (c, m) => { if (c){ pass++; } else { fail++; bad.push(m); console.log('FAIL', m); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function call(path, { method = 'POST', body, tok, headers } = {}){ const h = { ...(headers || {}) }; if (body !== undefined) h['content-type'] = 'application/json'; if (tok) h.authorization = 'Bearer ' + tok;
  const r = await fetch(B + path, { method, headers: h, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) }); const t = await r.text(); let d = null; try { d = JSON.parse(t); } catch {} return { s: r.status, d, h: r.headers }; }
const state = async () => (await call('/__state', { method: 'GET' })).d;
const sub = async id => (await call('/__fake_sub?id=' + id, { method: 'GET' })).d;
const pushesFor = async id => (await state()).pushes.filter(p => p.id === id);
await call('/__reset');

// --- key + routing
let r = await call('/api/push/key', { method: 'GET' });
ok(r.s === 200 && r.d.key === V.publicKey, 'key returns VAPID public key');
ok(/max-age=600/.test(r.h.get('cache-control') || ''), 'key is cacheable');
ok((await call('/api/push/nope', { body: {} })).s === 404, 'unknown route 404');
ok((await call('/api/push/subscribe', { method: 'GET' })).s === 405, 'GET subscribe 405');
ok((await call('/api/push/subscribe', { body: '{bad' })).s === 400, 'bad json 400');
ok((await call('/api/push/subscribe', { body: 'x'.repeat(9000) })).s === 413, 'huge body 413');

// --- subscribe validation
const A = await sub('anonA');
r = await call('/api/push/subscribe', { body: { subscription: { ...A, endpoint: 'https://evil.example.com/push/1' } } }); ok(r.s === 400 && r.d.code === 'bad', 'non push-service endpoint rejected');
r = await call('/api/push/subscribe', { body: { subscription: { ...A, keys: { p256dh: 'short', auth: A.keys.auth } } } }); ok(r.s === 400, 'bad p256dh rejected');
r = await call('/api/push/subscribe', { body: { subscription: { ...A, keys: { p256dh: A.keys.p256dh, auth: 'a+b/c' } } } }); ok(r.s === 400, 'bad auth rejected');
r = await call('/api/push/subscribe', { body: { subscription: A }, tok: 'tok_nobody' }); ok(r.s === 401 && r.d.code === 'auth', 'expired session 401');

// --- anon device
r = await call('/api/push/subscribe', { body: { subscription: A, platform: 'Windows', prefs: { friends: true, staff: true, updates: true, news: false } } });
ok(r.s === 200 && r.d.linked === false, 'anon subscribe ok, not linked');
ok(r.d.prefs && r.d.prefs.friends === false && r.d.prefs.staff === false && r.d.prefs.updates === true && r.d.prefs.news === false, 'anon prefs: friend/staff forced off, choices kept');
let st = await state(), rowA = st.tables.push_subscriptions.find(x => x.endpoint === A.endpoint);
ok(rowA && rowA.user_id === null && rowA.platform === 'Windows' && rowA.p256dh === A.keys.p256dh, 'anon row stored');

// --- signed in device
const Bs = await sub('aliceB');
r = await call('/api/push/subscribe', { body: { subscription: Bs, prefs: { updates: false } }, tok: 'tok_ua1' });
ok(r.s === 200 && r.d.linked === true && r.d.prefs.friends === true && r.d.prefs.staff === true && r.d.prefs.updates === false && r.d.prefs.news === true, 'linked subscribe + prefs');
r = await call('/api/push/subscribe', { body: { subscription: Bs, prefs: { updates: false } } });
st = await state(); ok(r.d.linked === false && st.tables.push_subscriptions.find(x => x.endpoint === Bs.endpoint).user_id === null, 'subscribe without token unlinks (sign out)');
await call('/api/push/subscribe', { body: { subscription: Bs, prefs: { updates: false } }, tok: 'tok_ua1' });
ok((await state()).tables.push_subscriptions.filter(x => x.endpoint === Bs.endpoint).length === 1, 'upsert keeps one row per endpoint');

// --- rotation (pushsubscriptionchange): new endpoint carries owner + prefs from old
const C = await sub('aliceC');
r = await call('/api/push/subscribe', { body: { subscription: C, old: Bs.endpoint, platform: 'renewed' } });
st = await state();
ok(r.d.linked === true && !st.tables.push_subscriptions.find(x => x.endpoint === Bs.endpoint), 'rotation removes old row');
const rowC = st.tables.push_subscriptions.find(x => x.endpoint === C.endpoint);
ok(rowC && rowC.user_id === 'ua1' && rowC.prefs.updates === false, 'rotation keeps owner and prefs');

// --- 15 devices per person
for (let i = 0; i < 17; i++){ await call('/api/push/subscribe', { body: { subscription: await sub('bob' + i) }, tok: 'tok_ub1' }); await sleep(3); }
st = await state(); const bobs = st.tables.push_subscriptions.filter(x => x.user_id === 'ub1');
ok(bobs.length === 15, 'keeps newest 15 devices per person (got ' + bobs.length + ')');
ok(!bobs.find(x => /bob0$|bob1$/.test(x.endpoint)) && bobs.find(x => /bob16$/.test(x.endpoint)), 'oldest devices dropped');

// --- test push
r = await call('/api/push/test', { body: { endpoint: 'https://localhost:8792/push/unknown' } }); ok(r.s === 404 && r.d.code === 'none', 'test: unknown device 404');
r = await call('/api/push/test', { body: { endpoint: 'https://evil.example.com/x' } }); ok(r.s === 404, 'test: bad endpoint 404');
r = await call('/api/push/test', { body: { endpoint: C.endpoint } }); ok(r.s === 200 && r.d.ok, 'test: sent');
await sleep(150); let P = await pushesFor('aliceC');
ok(P.length === 1 && P[0].payload && P[0].payload.title === 'Notifications are on' && P[0].payload.kind === 'test', 'test: payload decrypts on the device');
ok(P[0].vapid && P[0].encoding === 'aes128gcm' && P[0].urgency === 'high' && P[0].ttl === '600', 'test: VAPID auth, aes128gcm, urgency high, TTL 600');
r = await call('/api/push/test', { body: { endpoint: C.endpoint } }); ok(r.s === 429 && r.d.code === 'slow', 'test: rate limited');
const G = await sub('goneG'); await call('/api/push/subscribe', { body: { subscription: G }, tok: 'tok_ua1' });
r = await call('/api/push/test', { body: { endpoint: G.endpoint } }); st = await state();
ok(r.s === 410 && r.d.code === 'gone' && !st.tables.push_subscriptions.find(x => x.endpoint === G.endpoint), 'test: expired device removed (410)');

// --- unsubscribe
const U = await sub('unsubU'); await call('/api/push/subscribe', { body: { subscription: U } });
r = await call('/api/push/unsubscribe', { body: { endpoint: U.endpoint } }); st = await state();
ok(r.s === 200 && !st.tables.push_subscriptions.find(x => x.endpoint === U.endpoint), 'unsubscribe removes the row');

// --- notify (Supabase trigger)
const n1 = { id: 501, user_id: 'ua1', kind: 'friend_request', actor: 'ub1', data: { username: 'bobby', display_name: 'Bobby B', avatar_url: 'https://cdn.example.com/b.png' }, created_at: new Date().toISOString() };
r = await call('/api/push/notify', { body: n1 }); ok(r.s === 401, 'notify: no secret 401');
r = await call('/api/push/notify', { body: n1, headers: { 'x-treesh-push': 'wrong-secret-wrong-secret-wrong!' } }); ok(r.s === 401, 'notify: wrong secret 401');
const D2 = await sub('aliceD'); await call('/api/push/subscribe', { body: { subscription: D2, prefs: { friends: false } }, tok: 'tok_ua1' });
await call('/__seed', { body: { notifications: [{ id: 499, user_id: 'ua1', read: false }, { id: 500, user_id: 'ua1', read: true }, { id: 501, user_id: 'ua1', read: false }, { id: 9, user_id: 'ub1', read: false }] } });
r = await call('/__notify', { body: n1 }); await sleep(150);
ok(r.s === 200 && r.d.sent === 1, 'notify: friend request reaches devices that want friend alerts (sent ' + (r.d && r.d.sent) + ')');
P = await pushesFor('aliceC'); const fr = P[P.length - 1].payload;
ok(fr.title === 'Bobby B sent you a friend request' && fr.body === '@bobby wants to be friends on Treesh', 'notify: friend request words');
ok(fr.url === './?nt=o501' && fr.tag === 'nt-friend_request-ub1' && fr.icon === 'https://cdn.example.com/b.png' && fr.badgeCount === 2, 'notify: url, tag, avatar icon, badge count');
ok(P[P.length - 1].urgency === 'high', 'notify: friend request is urgent');
ok((await pushesFor('aliceD')).length === 0, 'notify: device with friend alerts off skipped');
r = await call('/__notify', { body: { ...n1, id: 502, kind: 'request_cancelled' } }); ok(r.s === 200 && r.d.skipped, 'notify: cancelled requests stay in the bell');
r = await call('/__notify', { body: { id: 503, user_id: 'ua1', kind: 'staff', actor: null, data: { action: 'ban', detail: { reason: 'Spam links' } }, created_at: new Date().toISOString() } }); await sleep(150);
let last = (await pushesFor('aliceD')).pop();
ok(r.d.sent === 2 && last && last.payload.title === 'Your account was suspended' && last.payload.body === 'Reason: Spam links' && last.payload.icon === 'icons/icon-192.png', 'notify: staff action to both devices');
r = await call('/__notify', { body: { id: 504, user_id: 'ua1', kind: 'staff', actor: null, data: { action: 'verify' }, created_at: new Date().toISOString() } }); await sleep(100);
last = (await pushesFor('aliceD')).pop(); ok(last.payload.title === 'You\u2019re verified' && last.payload.body === 'Your page shows the verified badge now', 'notify: verify words');
r = await call('/__notify', { body: { ...n1, id: 505, user_id: 'nobody' } }); ok(r.s === 200 && r.d.sent === 0, 'notify: person without devices');
const G2 = await sub('goneH'); await call('/api/push/subscribe', { body: { subscription: G2 }, tok: 'tok_ub1' });
r = await call('/__notify', { body: { id: 506, user_id: 'ub1', kind: 'friend_accepted', actor: 'ua1', data: { username: 'alice', display_name: 'Alice A' }, created_at: new Date().toISOString() } });
st = await state(); ok(r.d.removed === 1 && !st.tables.push_subscriptions.find(x => x.endpoint === G2.endpoint), 'notify: expired device cleaned up');
ok(r.d.sent === 14, 'notify: Bobby\u2019s other live devices got it (' + r.d.sent + ', the 16th device pushed out the oldest)');

// --- announce (admins)
await call('/api/push/subscribe', { body: { subscription: await sub('anonE') } });
const ann = { title: 'New songs just dropped', body: 'Three new tracks from the Woodz', url: '/?u=bobby', audience: 'all' };
ok((await call('/api/push/announce', { body: ann })).s === 403, 'announce: signed out 403');
ok((await call('/api/push/announce', { body: ann, tok: 'tok_ua1' })).s === 403, 'announce: user 403');
ok((await call('/api/push/announce', { body: ann, tok: 'tok_mod' })).s === 403, 'announce: moderator 403');
ok((await call('/api/push/announce', { body: ann, tok: 'tok_banned' })).s === 403, 'announce: banned admin 403');
r = await call('/api/push/announce', { body: { ...ann, title: ' ' }, tok: 'tok_us1' }); ok(r.s === 400 && r.d.code === 'title', 'announce: needs a title');
r = await call('/api/push/announce', { body: { ...ann, title: 'x'.repeat(81) }, tok: 'tok_us1' }); ok(r.s === 400 && r.d.code === 'title', 'announce: title max 80');
r = await call('/api/push/announce', { body: { ...ann, body: 'x'.repeat(301) }, tok: 'tok_us1' }); ok(r.s === 400 && r.d.code === 'body', 'announce: body max 300');
r = await call('/api/push/announce', { body: { ...ann, url: 'javascript:alert(1)' }, tok: 'tok_us1' }); ok(r.s === 400 && r.d.code === 'url', 'announce: unsafe link rejected');
r = await call('/api/push/announce', { body: { ...ann, url: 'http://insecure.example.com' }, tok: 'tok_us1' }); ok(r.s === 400, 'announce: http link rejected');
st = await state(); const wantAll = st.tables.push_subscriptions.filter(x => x.prefs.news !== false).length;
r = await call('/api/push/announce', { body: ann, tok: 'tok_us1' }); await sleep(200); st = await state();
ok(r.s === 200 && r.d.ok && r.d.devices === wantAll && r.d.sent === wantAll, 'announce: everyone with news on (' + (r.d && r.d.sent) + '/' + wantAll + ')');
const a1 = st.tables.announcements.find(x => x.id === r.d.id);
ok(a1 && a1.kind === 'news' && a1.audience === 'all' && a1.sent === r.d.sent && a1.created_by === 'us1' && a1.url === '/?u=bobby', 'announce: stored with sent count');
const ap = st.pushes.filter(p => p.payload && p.payload.tag === 'news-' + r.d.id);
ok(ap.length === wantAll && ap[0].payload.url === '/?u=bobby' && ap[0].payload.kind === 'news', 'announce: payload has the link');
ok(!st.pushes.find(p => p.id === 'anonA' && p.payload && p.payload.kind === 'news'), 'announce: device with news off skipped');
r = await call('/api/push/announce', { body: { title: 'Members only', audience: 'members' }, tok: 'tok_us1' }); st = await state();
const wantMem = st.tables.push_subscriptions.filter(x => x.prefs.news !== false && x.user_id).length;
ok(r.s === 200 && r.d.devices === wantMem && wantMem < wantAll, 'announce: members audience only linked devices');
ok(st.pushes.filter(p => p.payload && p.payload.tag === 'news-' + r.d.id)[0].payload.url === './?nt=n' + r.d.id, 'announce: no link opens the news item');

// --- new version (deploy-succeeded)
r = await call('/__deploy', { body: { context: 'deploy-preview' } }); ok(r.d.body === 'skipped (deploy-preview)', 'deploy: previews skipped');
r = await call('/__deploy', { body: {} }); ok(r.d.statusCode === 200 && r.d.state.find(x => x.k === 'app_version').v === 'v1' && !r.d.announcements.find(x => x.kind === 'update'), 'deploy: first version only recorded');
const before = (await state()).pushes.length;
r = await call('/__deploy', { body: {} }); ok((await state()).pushes.length === before, 'deploy: same version, no push');
await call('/__version', { body: { v: 'v2', title: 'A new version of Treesh is ready', notes: 'Push notifications are here' } });
r = await call('/__deploy', { body: {} }); await sleep(200); st = await state();
const up = st.tables.announcements.find(x => x.kind === 'update'), wantUp = st.tables.push_subscriptions.filter(x => x.prefs.updates !== false).length;
const upP = st.pushes.filter(p => p.payload && p.payload.kind === 'update');
ok(up && up.title === 'A new version of Treesh is ready' && up.body === 'Push notifications are here' && up.sent === wantUp, 'deploy: new version announced (sent ' + (up && up.sent) + '/' + wantUp + ')');
ok(upP.length === wantUp && upP[0].payload.url === './?v=v2' && upP[0].payload.tag === 'treesh-update' && upP[0].topic === 'treesh-update' && upP[0].urgency === 'low' && upP[0].ttl === '259200', 'deploy: update push url/topic/urgency/ttl');
ok(!upP.find(p => p.id === 'aliceC'), 'deploy: device with updates off skipped');
ok(st.tables.treesh_push_state.find(x => x.k === 'app_version').v === 'v2', 'deploy: version saved');
await call('/__version', { body: null }); r = await call('/__deploy', { body: {} }); ok(r.d.statusCode === 200, 'deploy: missing version.json is harmless');

console.log(`\n${pass} passed, ${fail} failed`); if (fail) { console.log(bad.join('\n')); process.exit(1); }
