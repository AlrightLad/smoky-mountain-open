// TODO: Update CACHE_NAME on every version bump per CLAUDE.md checklist.
// Value tied to APP_VERSION ensures activate-handler cache cleanup (line 32+)
// invalidates stale caches on each deploy. Static CACHE_NAME means cleanup
// is a no-op (the bug v8.12.0 hotfix targets — was stuck at 'parbaughs-v6-4-0'
// for ~30 ships). Future ship may automate via Vite build-time injection.
//
// v8.16.2 hotfix — STATIC_ASSETS no longer contains 8 deleted /textures/*.jpg
// entries from the retired pre-Clubhouse theme system. Those entries 404'd in
// production, causing cache.addAll() to fail-fast on every SW install since
// the textures were deleted from the repo (~v8.0 → v8.1 era). Every CACHE_NAME
// bump from v8.13.x through v8.16.1 produced an empty cache (0 entries) and
// the new SW never activated — browsers fell back to network on every request.
// Install handler now uses Promise.all + per-asset cache.add().catch() (P22)
// so future asset-list drift logs warnings instead of nuking the install.
var CACHE_NAME = 'parbaughs-v8.16.2';
var STATIC_ASSETS = [
  '/smoky-mountain-open/',
  '/smoky-mountain-open/watermark.jpg',
  '/smoky-mountain-open/Logo.jpg',
  '/smoky-mountain-open/apple-touch-icon.png',
  '/smoky-mountain-open/stock_profile_gold.jpg',
  '/smoky-mountain-open/stock_profile_green.jpg',
  '/smoky-mountain-open/stock_profile_navy.jpg',
  '/smoky-mountain-open/stock_profile_charcoal.jpg',
  '/smoky-mountain-open/stock_profile_red.jpg',
  '/smoky-mountain-open/stock_profile_teal.jpg'
];

self.addEventListener('install', function(event) {
  // v8.16.2 — Resilient per-asset install (P22). Replaces cache.addAll() which
  // is fail-fast: one 404 in STATIC_ASSETS rejects the whole promise and the
  // install never completes. Per-asset cache.add().catch() lets each asset
  // succeed/fail independently — survivors get cached, failures log a warning,
  // SW still activates. Future asset-list drift won't silently break SW install.
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.all(
        STATIC_ASSETS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Failed to cache asset (continuing):', url, err && err.message);
          });
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
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
  // v8.12.0 — Skip non-http(s) requests. Browser extensions (chrome-extension://,
  // moz-extension://, safari-web-extension://) trigger fetch events through the
  // page's SW and would throw on cache.put. Filtering at the handler entry point
  // is a single-point fix covering both cache.put call sites below (lines 60 + 72).
  // Also covers file:, blob:, data: schemes as a side effect — none of those
  // belong in the SW cache anyway.
  if (!event.request.url.startsWith('http')) return;

  // Network-first for API and Firestore calls
  if (event.request.url.indexOf('googleapis.com') !== -1 ||
      event.request.url.indexOf('firebaseio.com') !== -1 ||
      event.request.url.indexOf('cloudfunctions.net') !== -1 ||
      event.request.url.indexOf('golfcourseapi.com') !== -1) {
    return;
  }

  // Cache-first for static assets (images, fonts, stock profiles)
  if (event.request.destination === 'image' || event.request.destination === 'font' ||
      event.request.url.indexOf('stock_profile') !== -1) {
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
