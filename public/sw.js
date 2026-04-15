var CACHE_NAME = 'parbaughs-v5-24-1';
var STATIC_ASSETS = [
  '/smoky-mountain-open/',
  '/smoky-mountain-open/watermark.jpg',
  '/smoky-mountain-open/Logo.jpg',
  '/smoky-mountain-open/apple-touch-icon.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
             .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Network-first for API and Firestore calls
  if (event.request.url.indexOf('googleapis.com') !== -1 ||
      event.request.url.indexOf('firebaseio.com') !== -1 ||
      event.request.url.indexOf('cloudfunctions.net') !== -1 ||
      event.request.url.indexOf('golfcourseapi.com') !== -1) {
    return;
  }

  // Cache-first for static assets (images, fonts)
  if (event.request.destination === 'image' || event.request.destination === 'font') {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
          return response;
        });
      })
    );
    return;
  }

  // Network-first for everything else (HTML, JS, CSS)
  event.respondWith(
    fetch(event.request).then(function(response) {
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});
