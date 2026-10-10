// Treesh Web Push, shared by netlify/functions/push.mjs and netlify/functions/deploy-succeeded.mjs.
// Netlify env vars: VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY (one key pair, never change it), SUPABASE_SECRET_KEY (server only),
// PUSH_HOOK_SECRET (same value as in supabase_push.sql), plus the existing SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY. Optional: VAPID_SUBJECT.
import webpush from 'web-push';
import { timingSafeEqual } from 'node:crypto';

export const env = k => String(process.env[k] || '').trim();
export const ready = () => !!(env('VAPID_PUBLIC_KEY') && env('VAPID_PRIVATE_KEY') && env('SUPABASE_URL') && env('SUPABASE_SECRET_KEY'));
const SB = () => env('SUPABASE_URL').replace(/\/+$/, '');
export const enc = encodeURIComponent;
export const json = (status, body, cache) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': cache ? `public, max-age=${cache}` : 'no-store', 'X-Content-Type-Options': 'nosniff' } });
export const fail = (status, message, code) => json(status, { message, code });
export const oops = (status, message, code) => Object.assign(new Error(message), { status, code, expose: true });
export function sameSecret(a, b){ const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || '')); return x.length > 0 && x.length === y.length && timingSafeEqual(x, y); }

/* Supabase REST with the secret key (the push tables have no public access). New sb_secret_ keys go in apikey only. */
export async function db(path, { method = 'GET', body, prefer } = {}){
  const key = env('SUPABASE_SECRET_KEY'), h = { apikey: key, 'Content-Type': 'application/json' };
  if (/^eyJ/.test(key)) h.Authorization = `Bearer ${key}`;
  if (prefer) h.Prefer = prefer;
  const r = await fetch(`${SB()}/rest/v1/${path}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = method === 'HEAD' ? '' : await r.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch {}
  if (!r.ok) throw Object.assign(new Error((data && data.message) || `Supabase ${r.status}`), { status: 502, code: data && data.code === '42P01' ? 'setup' : 'db' });
  return { data, headers: r.headers };
}
export async function allSubs(){ const out = [];
  for (let off = 0; ; off += 1000){ const { data } = await db(`push_subscriptions?select=endpoint,p256dh,auth,prefs,user_id&order=created_at.asc&limit=1000&offset=${off}`); out.push(...(data || [])); if (!data || data.length < 1000) break; }
  return out; }

/* who is calling (Supabase session token) */
export const bearer = req => ((req.headers.get('authorization') || '').match(/^Bearer\s+(\S{6,4096})$/i) || [])[1] || '';
export async function userId(tok){
  try { const r = await fetch(`${SB()}/auth/v1/user`, { headers: { apikey: env('SUPABASE_PUBLISHABLE_KEY'), Authorization: `Bearer ${tok}` } }); if (!r.ok) return null; const u = await r.json(); return (u && u.id) || null; } catch { return null; } }
export async function myStatus(tok){
  try { const r = await fetch(`${SB()}/rest/v1/rpc/my_status`, { method: 'POST', headers: { apikey: env('SUPABASE_PUBLISHABLE_KEY'), Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: '{}' }); if (!r.ok) return null; return await r.json(); } catch { return null; } }

/* only real push services (plus PUSH_EXTRA_HOSTS for local tests) */
const HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
export function okEndpoint(u){ if (typeof u !== 'string' || u.length > 1000) return false;
  try { const x = new URL(u), extra = env('PUSH_EXTRA_HOSTS').split(',').map(s => s.trim()).filter(Boolean);
    if (extra.includes(x.hostname)) return x.protocol === 'http:' || x.protocol === 'https:';
    return x.protocol === 'https:' && HOSTS.some(re => re.test(x.hostname)); } catch { return false; } }

let vapidOn = false;
export async function sendTo(rows, payload, { ttl = 86400, urgency = 'normal', topic } = {}){
  if (!vapidOn){ webpush.setVapidDetails(env('VAPID_SUBJECT') || 'https://treesh.app', env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY')); vapidOn = true; }
  const body = JSON.stringify(payload), gone = []; let sent = 0, failed = 0;
  const one = async row => { try { await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, body, { TTL: ttl, urgency, ...(topic ? { topic } : {}), timeout: 8000 }); sent++; }
    catch (e) { const s = e && e.statusCode; if (s === 404 || s === 410) gone.push(row.endpoint); else { failed++; console.warn('treesh push failed', s || (e && e.message)); } } };
  for (let i = 0; i < rows.length; i += 25) await Promise.all(rows.slice(i, i + 25).map(one));
  for (const ep of gone) await db(`push_subscriptions?endpoint=eq.${enc(ep)}`, { method: 'DELETE' }).catch(() => {});
  return { sent, removed: gone.length, failed }; }

/* words for the bell's alerts (request_cancelled stays in the bell only) */
const STAFF = { ban: 'Your account was suspended', unban: ['Your suspension was lifted', 'Welcome back to Treesh'], mute: 'Your profile changes are on hold', unmute: ['Your profile is live again', 'Everyone sees your latest changes'],
  edit: 'Treesh staff updated your profile', verify: ['You\u2019re verified', 'Your page shows the verified badge now'], unverify: 'Your verified badge was removed', make_mod: ['You\u2019re a Treesh moderator now', 'Staff tools are on your profile'],
  make_admin: ['You\u2019re a Treesh admin now', 'Every staff tool is unlocked'], remove_mod: 'You\u2019re no longer a moderator', remove_admin: 'You\u2019re no longer an admin' };
export function notifCopy(n){ const d = (n && n.data) || {}, nm = d.display_name || (d.username ? '@' + d.username : 'Someone');
  switch (n && n.kind){
    case 'friend_request': return { pref: 'friends', title: `${nm} sent you a friend request`, body: d.username ? `@${d.username} wants to be friends on Treesh` : 'Tap to answer' };
    case 'friend_accepted': return { pref: 'friends', title: `${nm} accepted your friend request`, body: 'You\u2019re friends now. Say hi on their page' };
    case 'friend_declined': return { pref: 'friends', title: `${nm} declined your friend request`, body: 'You can send another one later' };
    case 'friend_removed': return { pref: 'friends', title: `${nm} removed you as a friend`, body: 'Their friends-only sections are hidden from you now' };
    case 'staff': { const x = (d.detail && typeof d.detail === 'object') ? d.detail : {}, m = STAFF[d.action] || 'Your account was updated', t = Array.isArray(m) ? m[0] : m;
      return { pref: 'staff', title: t, body: Array.isArray(m) ? m[1] : (x.reason ? 'Reason: ' + String(x.reason).slice(0, 140) : 'Open Treesh for the details') }; }
    default: return null; } }
export const iconOf = d => (d && /^https:\/\/[^\s"'<>]+$/i.test(d.avatar_url || '') ? d.avatar_url : 'icons/icon-192.png');

/* a new version of the app went live (only when index.html changed, see version.json) */
export async function versionBroadcast(site){
  if (!ready()) return { skipped: 'setup' };
  const base = String(site || env('URL') || 'https://treesh.app').replace(/\/+$/, '');
  const r = await fetch(`${base}/version.json?t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } }); if (!r.ok) return { skipped: 'no version.json' };
  const v = await r.json().catch(() => null); if (!v || !v.v) return { skipped: 'bad version.json' };
  const st = await db('treesh_push_state?select=v&k=eq.app_version'), prev = st.data && st.data[0] && st.data[0].v;
  if (prev === v.v) return { skipped: 'same version', v: v.v };
  await db('treesh_push_state?on_conflict=k', { method: 'POST', body: { k: 'app_version', v: v.v, at: new Date().toISOString() }, prefer: 'resolution=merge-duplicates,return=minimal' });
  if (!prev) return { skipped: 'first version recorded', v: v.v };
  const title = String(v.title || 'A new version of Treesh is ready').slice(0, 80), body = String(v.notes || 'Open Treesh to get the newest features.').slice(0, 200);
  const ins = await db('announcements', { method: 'POST', body: { title, body, kind: 'update', audience: 'all' }, prefer: 'return=representation' }), id = ins.data && ins.data[0] && ins.data[0].id;
  const rows = (await allSubs()).filter(x => (x.prefs || {}).updates !== false);
  const res = await sendTo(rows, { title, body, url: `./?v=${enc(v.v)}`, tag: 'treesh-update', kind: 'update', t: Date.now() }, { ttl: 3 * 86400, urgency: 'low', topic: 'treesh-update' });
  if (id) await db(`announcements?id=eq.${id}`, { method: 'PATCH', body: { sent: res.sent }, prefer: 'return=minimal' }).catch(() => {});
  return { v: v.v, id, ...res }; }
