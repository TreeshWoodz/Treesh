// Vocotap offline service worker (production builds only).
// - App shell (index.html), JS bundles, fonts, images and bundled songs are cached as they load,
//   so the installed app opens and plays saved songs with no internet connection.
// - Audio range requests are answered from the cached file (206 partial content) once it's cached.
// - Cross-origin requests (online catalog / streams) are never touched.
const VERSION = "vocotap-v2";
const SHELL = ["./", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

const put = (key, res) => caches.open(VERSION).then((c) => c.put(key, res)).catch(() => {});

async function rangeResponse(req) {
  const hit = await caches.match(req.url);
  if (!hit) {
    // Fetch the whole file once in the background so the next (offline) play can be served from cache.
    fetch(req.url).then((r) => { if (r.ok && r.type === "basic") put(req.url, r); }).catch(() => {});
    return fetch(req);
  }
  const buf = await hit.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
  const start = m && m[1] ? Number(m[1]) : 0;
  const end = m && m[2] ? Math.min(Number(m[2]), buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": hit.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${buf.byteLength}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.headers.has("range")) { event.respondWith(rangeResponse(req)); return; }

  // Pages: network first (fresh deploys), fall back to the cached shell for any in-app route.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then((res) => { if (res.ok) put("./", res.clone()); return res; })
        .catch(() => caches.match("./").then((r) => r || caches.match(req)))
    );
    return;
  }

  // Everything else: cache first, refresh in the background.
  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res.ok && res.type === "basic") put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })
  );
});
