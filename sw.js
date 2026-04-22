const CACHE_NAME = 'routine-v5'; 
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];


const RAW_GITHUB_URL ="https://raw.githubusercontent.com/Stup702/Cipher21-BEC/main/routine.json"
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
  if (event.request.url.includes('routine.json')) {
    // Generate a unique timestamp right now
    const timeStamp = new Date().getTime(); 
    // Append it to the URL so GitHub's servers are forced to bypass their own cache
    const bustedUrl = `${RAW_GITHUB_URL}?t=${timeStamp}`;

    event.respondWith(
      fetch(bustedUrl, { cache: 'no-store' }) 
        .then(networkResponse => {
          if (!networkResponse.ok) throw new Error("GitHub fetch failed");
          
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            // Save it under the original clean name, not the messy timestamp name
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