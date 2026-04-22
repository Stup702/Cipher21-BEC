const CACHE_NAME = 'routine-v5'; 
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Replace this with your actual raw GitHub link!
// Make sure it points to the 'main' or 'master' branch.
const RAW_GITHUB_URL = 'https://raw.githubusercontent.com/YOUR_GITHUB_NAME/YOUR_REPO_NAME/main/routine.js';

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
  // 1. If the app is asking for routine.js, hijack it!
  if (event.request.url.includes('routine.js')) {
    event.respondWith(
      fetch(RAW_GITHUB_URL, { cache: 'no-store' }) // Ask raw github, ignoring all browser caches
        .then(networkResponse => {
          if (!networkResponse.ok) throw new Error("GitHub fetch failed");
          
          // We got the fresh raw file! Save it into the offline cache under the local name.
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone); 
          });
          
          return networkResponse;
        })
        .catch(() => {
          // If offline (or GitHub is down), serve the last known good routine from cache
          console.log("Offline: Falling back to cached routine.");
          return caches.match(event.request);
        })
    );
  } 
  // 2. For everything else (index.html, manifest, icons), use standard Network-First
  else {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
  }
});