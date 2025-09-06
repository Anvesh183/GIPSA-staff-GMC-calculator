const cacheName = 'gipsa-calc-cache-v1';
const assetsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/data.js',
  '/manifest.json',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => {
        console.log('Service Worker: Caching all assets');
        return cache.addAll(assetsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the cached response
        if (response) {
          return response;
        }
        // No cache hit - fetch from network
        return fetch(event.request);
      })
  );
});

// This script caches your essential files on the first visit so the app can load instantly and work offline on subsequent visits.

