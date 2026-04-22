const CACHE_NAME = 'routine-v3'; // Bumped to v3 to clear out the stubborn v2 cache
const ASSETS = [
  './',
  './index.html',
  './routine.js',
  './manifest.json'
];

// 1. Install & Cache Initial Files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // Forces the waiting service worker to become the active one
});

// 2. Clean up old caches (like v1 and v2)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // Takes control of the page immediately
});

// 3. NETWORK FIRST STRATEGY (The Magic Fix)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If we are online and fetch succeeds, save a fresh copy to the cache!
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => {
        // If the fetch fails (we are offline), pull from the cache
        return caches.match(event.request);
      })
  );
});