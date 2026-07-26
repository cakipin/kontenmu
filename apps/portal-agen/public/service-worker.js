const CACHE_PREFIX = 'kontenmu-shell-';

// The PWA must not delay live D1 data, R2 media, or route navigation.
// Clearing prior shell caches prevents older workers from serving stale assets.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});
