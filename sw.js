const CACHE_NAME = 'routine-v4'; // Bumped to v4 to never over store cache
const ASSETS = [
  './',
  './index.html',
  './routine.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); 
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // only want to cache-bust our specific files, not external stuff (like Twemoji)
  let requestToFetch = event.request;
  
  // Force the browser to ignore its temporary HTTP cache for our app files
  if (requestToFetch.url.includes(self.location.origin)) {
    requestToFetch = new Request(event.request.url, { cache: 'no-store' });
  }

  event.respondWith(
    fetch(requestToFetch)
      .then(networkResponse => {
        // We got fresh data from the absolute source! Save a copy to our offline cache.
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone); // Save it under the original request name
        });
        return networkResponse;
      })
      .catch(() => {
        // If they are offline, fall back to the safe offline cache
        return caches.match(event.request);
      })
  );
});