const CACHE_NAME = 'mi-app-cache';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/icon-192x192.png',
    '/icon-512x512.png',
    // Agrega más recursos que quieras cachear
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return fetch(event.request);
    }

    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) {
            return response;
            }
            return fetch(event.request);
        })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
        return Promise.all(
            cacheNames.map(cacheName => {
            if (!cacheWhitelist.includes(cacheName)) {
                return caches.delete(cacheName);
            }
            })
        );
        })
    );
});

self.addEventListener('fetch', event => {
    if (!navigator.onLine && event.request.method !== 'GET') {
        return new Response('Modo offline: solo se permiten peticiones GET.', { status: 503 });
    }

    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) {
            return response;
            }
            return fetch(event.request);
        })
    );
});
