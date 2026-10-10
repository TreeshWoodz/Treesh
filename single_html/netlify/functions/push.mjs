// Treesh push notifications (Netlify Function). Devices subscribe here; Supabase calls /api/push/notify when a bell alert is created;
// admins send announcements; deploy-succeeded.mjs announces new app versions. Setup: see netlify/push-lib.mjs and supabase_push.sql.
import { env, ready, enc, json, fail, oops, sameSecret, db, allSubs, bearer, userId, myStatus, okEndpoint, sendTo, notifCopy, iconOf } from '../push-lib.mjs';

export const config = { path: ['/api/push', '/api/push/*'] };

const B64 = /^[A-Za-z0-9_-]+={0,2}$/;
async function body(req){ const t = await req.text(); if (t.length > 8000) throw oops(413, 'That\u2019s too much.'); try { return t ? JSON.parse(t) : {}; } catch { throw oops(400, 'Bad request.'); } }
async function subRow(ep){ const { data } = await db(`push_subscriptions?select=endpoint,p256dh,auth,prefs,user_id,last_sent_at&endpoint=eq.${enc(ep)}`); return (data && data[0]) || null; }

async function subscribe(req, b){
  const s = b.subscription || {}, ep = s.endpoint, k = s.keys || {};
  if (!okEndpoint(ep) || !B64.test(k.p256dh || '') || k.p256dh.length < 60 || k.p256dh.length > 120 || !B64.test(k.auth || '') || k.auth.length < 16 || k.auth.length > 48) throw oops(400, 'That doesn\u2019t look like a push subscription.', 'bad');
  const tok = bearer(req), uid = tok ? await userId(tok) : null;
  if (tok && !uid) throw oops(401, 'Your session ended. Sign in again.', 'auth');
  let carry = null;
  if (typeof b.old === 'string' && b.old !== ep && okEndpoint(b.old)){ carry = await subRow(b.old); await db(`push_subscriptions?endpoint=eq.${enc(b.old)}`, { method: 'DELETE' }); }
  const P = (b.prefs && typeof b.prefs === 'object') ? b.prefs : (carry && carry.prefs) || {}, owner = tok ? uid : (carry ? carry.user_id : null);
  const prefs = { friends: !!owner && P.friends !== false, staff: !!owner && P.staff !== false, updates: P.updates !== false, news: P.news !== false };
  const row = { endpoint: ep, p256dh: k.p256dh, auth: k.auth, user_id: owner, prefs, platform: String(b.platform || '').slice(0, 40), updated_at: new Date().toISOString() };
  await db('push_subscriptions?on_conflict=endpoint', { method: 'POST', body: row, prefer: 'resolution=merge-duplicates,return=minimal' });
  if (owner){ const { data } = await db(`push_subscriptions?select=endpoint&user_id=eq.${owner}&order=updated_at.desc&offset=15`); for (const x of data || []) await db(`push_subscriptions?endpoint=eq.${enc(x.endpoint)}`, { method: 'DELETE' }); }
  return json(200, { ok: true, linked: !!owner, prefs });
}
async function unsubscribe(b){ if (typeof b.endpoint === 'string' && b.endpoint) await db(`push_subscriptions?endpoint=eq.${enc(b.endpoint)}`, { method: 'DELETE' }); return json(200, { ok: true }); }
async function test(b){
  const row = typeof b.endpoint === 'string' && okEndpoint(b.endpoint) ? await subRow(b.endpoint) : null;
  if (!row) throw oops(404, 'Turn notifications on first.', 'none');
  if (row.last_sent_at && Date.now() - Date.parse(row.last_sent_at) < 15000) throw oops(429, 'One test at a time. Try again in a few seconds.', 'slow');
  await db(`push_subscriptions?endpoint=eq.${enc(row.endpoint)}`, { method: 'PATCH', body: { last_sent_at: new Date().toISOString() }, prefer: 'return=minimal' });
  const r = await sendTo([row], { title: 'Notifications are on', body: 'This is how Treesh reaches you on this device.', tag: 'treesh-test', url: './', kind: 'test', t: Date.now() }, { ttl: 600, urgency: 'high' });
  if (r.removed) throw oops(410, 'This device\u2019s notifications expired. Turn them off and on again.', 'gone');
  if (!r.sent) throw oops(502, 'The push service didn\u2019t take it. Try again.', 'push');
  return json(200, { ok: true });
}
async function notify(req, b){
  if (!sameSecret(req.headers.get('x-treesh-push'), env('PUSH_HOOK_SECRET'))) return fail(401, 'Nope.');
  const c = notifCopy(b); if (!c || !b.user_id) return json(200, { ok: true, skipped: true });
  const { data } = await db(`push_subscriptions?select=endpoint,p256dh,auth,prefs&user_id=eq.${enc(b.user_id)}`), rows = (data || []).filter(x => (x.prefs || {})[c.pref] !== false);
  if (!rows.length) return json(200, { ok: true, sent: 0 });
  let badge = null; try { const h = await db(`notifications?select=id&user_id=eq.${enc(b.user_id)}&read=eq.false`, { method: 'HEAD', prefer: 'count=exact' }); const m = /\/(\d+)$/.exec(h.headers.get('content-range') || ''); if (m) badge = +m[1]; } catch {}
  const d = b.data || {}, payload = { title: c.title, body: c.body, icon: iconOf(d), tag: `nt-${b.kind}-${b.actor || b.id}`, url: `./?nt=o${enc(b.id)}`, kind: b.kind, t: Date.parse(b.created_at) || Date.now(), ...(badge != null ? { badgeCount: badge } : {}) };
  return json(200, { ok: true, ...(await sendTo(rows, payload, { ttl: 2 * 86400, urgency: b.kind === 'friend_request' || b.kind === 'staff' ? 'high' : 'normal' })) });
}
async function announce(req, b){
  const tok = bearer(req), me = tok ? await myStatus(tok) : null;
  if (!me || me.role !== 'admin' || (me.banned_until && Date.parse(me.banned_until) > Date.now())) throw oops(403, 'Only Treesh admins can send announcements.', 'forbidden');
  const title = String(b.title || '').trim(), text = String(b.body || '').trim(), url = String(b.url || '').trim(), audience = b.audience === 'members' ? 'members' : 'all';
  if (!title || title.length > 80) throw oops(400, 'Give it a title (up to 80 characters).', 'title');
  if (text.length > 300) throw oops(400, 'Keep the message under 300 characters.', 'body');
  if (url && (url.length > 300 || !(/^https:\/\/[^\s"'<>]+$/i.test(url) || /^\/[^\s"'<>]*$/.test(url)))) throw oops(400, 'Links must start with https:// or / (a page in Treesh).', 'url');
  const ins = await db('announcements', { method: 'POST', body: { title, body: text, url: url || null, audience, kind: 'news', created_by: me.uid || null }, prefer: 'return=representation' }), id = ins.data && ins.data[0] && ins.data[0].id;
  const rows = (await allSubs()).filter(x => (x.prefs || {}).news !== false && (audience === 'all' || x.user_id));
  const r = await sendTo(rows, { title, body: text, url: url || `./?nt=n${id}`, tag: `news-${id}`, kind: 'news', t: Date.now() }, { ttl: 2 * 86400, urgency: 'normal' });
  if (id) await db(`announcements?id=eq.${id}`, { method: 'PATCH', body: { sent: r.sent }, prefer: 'return=minimal' }).catch(() => {});
  return json(200, { ok: true, id, devices: rows.length, ...r });
}

export default async (req) => {
  const sub = new URL(req.url).pathname.replace(/^\/api\/push\/?/, '').replace(/\/+$/, '');
  try {
    if (!ready()) return fail(503, 'Push notifications aren\u2019t switched on for this site yet.', 'setup');
    if (req.method === 'GET' && sub === 'key') return json(200, { key: env('VAPID_PUBLIC_KEY') }, 600);
    if (req.method !== 'POST') return fail(405, 'Method not allowed.');
    const b = await body(req);
    if (sub === 'subscribe') return await subscribe(req, b);
    if (sub === 'unsubscribe') return await unsubscribe(b);
    if (sub === 'test') return await test(b);
    if (sub === 'notify') return await notify(req, b);
    if (sub === 'announce') return await announce(req, b);
    return fail(404, 'Not found.');
  } catch (e) {
    if (!e.expose) console.error('treesh push', e);
    return fail(e.status || 500, e.expose ? e.message : e.code === 'setup' ? 'Push notifications aren\u2019t set up in Supabase yet (run supabase_push.sql).' : 'Something went wrong. Try again.', e.code || 'error');
  }
};
