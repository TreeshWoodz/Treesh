/* Treesh push notifications. This worker only shows notifications: no caching, Treesh always loads fresh. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  const opt = { body: String(d.body || ''), icon: d.icon || 'icons/icon-192.png', badge: 'icons/badge-96.png', data: { url: d.url || './', kind: d.kind || '' }, timestamp: +d.t || Date.now() };
  if (d.tag){ opt.tag = String(d.tag); opt.renotify = true; }
  const badge = d.badgeCount == null || !self.navigator.setAppBadge ? null : (d.badgeCount > 0 ? self.navigator.setAppBadge(d.badgeCount) : self.navigator.clearAppBadge()).catch(() => {});
  e.waitUntil(Promise.all([self.registration.showNotification(String(d.title || 'Treesh'), opt), badge]));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const c = list.find(x => x.url.indexOf(self.registration.scope) === 0) || list[0];
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
