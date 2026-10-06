// Minimal service worker so browsers treat Vocotap as an installable app. Network-first, no caching.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
