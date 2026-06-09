const CACHE_NAME = 'meditrack-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg',
  '/logo192.png',
  '/logo512.png'
];

// Install Event: pre-cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline shell');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: intercept requests and apply caching strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass service worker caching for API calls and authentication requests.
  // These are handled dynamically by our client-side API sync/cache layer in api.js.
  if (requestUrl.pathname.startsWith('/api/') || requestUrl.pathname.startsWith('/auth/') || requestUrl.port === '8080') {
    return; // Let the browser make the request directly (handled in client JS)
  }

  // Handle SPA routing: for page navigations, if offline, fallback to index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.log('[Service Worker] Navigation failed, serving index.html fallback:', err);
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  // Apply Stale-While-Revalidate strategy for static frontend assets
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Cache successful responses for our own origin
          if (networkResponse.status === 200 && requestUrl.origin === self.location.origin) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
          console.log('[Service Worker] Fetch failed, serving cached fallback if available:', err);
        });

        // Return cached response immediately if we have it, otherwise wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});
