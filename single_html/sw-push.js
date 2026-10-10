/* Treesh push notifications. This worker only shows notifications: no caching, Treesh always loads fresh. */
const UA = self.navigator.userAgent || '';
// Chromium browsers don't force a notification while Treesh is on screen; Safari and Firefox always need one
const QUIET_OK = /Chrome\//.test(UA) && !/iPhone|iPad|iPod/.test(UA);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    if (d.badgeCount != null && self.navigator.setAppBadge){ try { await (d.badgeCount > 0 ? self.navigator.setAppBadge(d.badgeCount) : self.navigator.clearAppBadge()); } catch (_) {} }
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const vis = list.find(c => c.visibilityState === 'visible' && c.focused);
    if (vis && QUIET_OK && d.kind && d.kind !== 'test'){ vis.postMessage({ type: 'treesh-push', kind: d.kind, url: d.url || './' }); return; }
    const opt = { body: String(d.body || ''), icon: d.icon || 'icons/icon-192.png', badge: 'icons/badge-96.png', data: { url: d.url || './', kind: d.kind || '' }, timestamp: +d.t || Date.now() };
    if (d.tag){ opt.tag = String(d.tag); opt.renotify = true; }
    await self.registration.showNotification(String(d.title || 'Treesh'), opt);
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil((async () => {
    if (new URL(url).origin !== self.location.origin) return self.clients.openWindow(url);
    const list = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).filter(x => x.url.indexOf(self.registration.scope) === 0);
    const c = list.find(x => x.focused) || list.find(x => x.visibilityState === 'visible') || list[0];
    if (c){ try { await c.focus(); } catch (_) {} c.postMessage({ type: 'treesh-push-open', url }); return; }
    await self.clients.openWindow(url);
  })());
});

/* the browser rotated this device's subscription: keep it (and its owner + choices) on the server */
self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil((async () => {
    try {
      const k = await (await fetch('api/push/key')).json();
      const sub = e.newSubscription || await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: k.key });
      await fetch('api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON(), old: e.oldSubscription && e.oldSubscription.endpoint, platform: 'renewed' }) });
    } catch (_) {}
  })());
});
