// sw.js
const CACHE_NAME = 'muslim-quran-editor-v1.0.0'; // Version your cache
const APP_SHELL_FILES = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    // CRITICAL JS - only app.js and core modules, others loaded dynamically
    './js/app.js',
    './js/core/dom-loader.js',
    './js/core/state-manager.js',
    './js/config/constants.js',
    // Icons
    './icons/icon-72x72.png',
    './icons/icon-96x96.png',
    './icons/icon-128x128.png',
    './icons/icon-144x144.png',
    './icons/icon-152x152.png',
    './icons/icon-192x192.png',
    './icons/icon-384x384.png',
    './icons/icon-512x512.png',
    // Fonts from Google are typically best left to browser cache, but you could add them if self-hosting
];
const CDN_URLS = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/',
    'https://cdnjs.cloudflare.com/ajax/libs/tinycolor/',
    'https://cdn.jsdelivr.net/npm/axios/',
    'https://cdn.jsdelivr.net/npm/ccapture.js@'
];


// Install event: cache app shell
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(APP_SHELL_FILES);
            })
            .catch(error => console.error('[Service Worker] Failed to cache app shell:', error))
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate');
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
        })
    );
    return self.clients.claim(); // Take control of currently open clients
});

// Fetch event: serve from cache or network
self.addEventListener('fetch', (event) => {
    // For CDN URLs, try network first, then cache (Stale-While-Revalidate might be better for CDNs)
    const isCdnUrl = CDN_URLS.some(cdnUrl => event.request.url.startsWith(cdnUrl));

    if (isCdnUrl) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse.ok) { // Check for ok status
                       cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (error) {
                    // Network failed, try to serve from cache
                    const cachedResponse = await cache.match(event.request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If not in cache and network failed, it will result in a network error
                    console.warn('[Service Worker] CDN fetch failed, not in cache:', event.request.url, error);
                    return new Response("Network error for CDN resource", { status: 408, headers: { 'Content-Type': 'text/plain' } });
                }
            })
        );
    } else {
        // For app shell files, serve from cache first, then network (Cache First)
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(event.request).then((networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse; // Don't cache non-basic or error responses
                        }
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        return networkResponse;
                    });
                })
                .catch(error => {
                    console.error('[Service Worker] Fetch error:', error);
                    // You could return a generic offline page here if needed
                    // return caches.match('./offline.html');
                })
        );
    }
});
