// Minimal offline support: cache the app shell on install, serve it on fetch
// failures (e.g. no network). Since all requirement data lives inline in the
// JS bundle rather than being fetched separately, caching the built assets is
// enough to make the whole app usable offline after the first visit.

const CACHE_NAME = 'ot-navigator-v1';
const APP_SHELL = [
  '/ot-spravochnik/',
  '/ot-spravochnik/index.html',
  '/ot-spravochnik/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle same-origin GET requests; let everything else pass through.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a copy of successful responses for offline fallback next time.
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/ot-spravochnik/index.html')))
  );
});
