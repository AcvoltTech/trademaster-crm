const CACHE_NAME = 'trademaster-v1';
const urlsToCache = [
  '/trademaster-crm/',
  '/trademaster-crm/index.html',
  '/trademaster-crm/styles.css',
  '/trademaster-crm/script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
