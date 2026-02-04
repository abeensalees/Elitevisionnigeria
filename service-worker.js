// ========================================
// SERVICE WORKER - FIXED VERSION
// ========================================

const CACHE_NAME = 'elitevision-v1';
const urlsToCache = [
  './',
  './index.html',
  './index.css',
  './index.js'
];

// ========================================
// INSTALL - Cache files
// ========================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        
        // Cache files one by one to see which fails
        return Promise.all(
          urlsToCache.map((url) => {
            return cache.add(url).catch((err) => {
              console.error('[SW] Failed to cache:', url, err);
            });
          })
        );
      })
      .then(() => {
        console.log('[SW] Installation successful');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((err) => {
        console.error('[SW] Installation failed:', err);
      })
  );
});

// ========================================
// ACTIVATE - Clean old caches
// ========================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation successful');
        return self.clients.claim(); // Take control
      })
  );
});

// ========================================
// FETCH - Serve from cache or network
// ========================================
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip Firebase/API requests
  const url = event.request.url;
  if (url.includes('firebase') || 
      url.includes('googleapis') || 
      url.includes('cloudinary')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request)
          .catch((err) => {
            console.error('[SW] Fetch failed:', err);
            // Return cached index.html for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

console.log('[SW] Service Worker loaded');