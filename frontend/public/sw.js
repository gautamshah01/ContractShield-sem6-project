// ContractShield Service Worker — v3
// Strategy:
//   • Static shell  → Cache-First  (HTML, icons, manifest)
//   • API calls     → Network-Only (always fresh data)
//   • Everything else → Stale-While-Revalidate (JS/CSS bundles)

const CACHE_VERSION = 'contractshield-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/apple-touch-icon.png',
];

// ── Install: pre-cache the app shell ──────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// ── Activate: clean up old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => k !== CACHE_VERSION)
                    .map((k) => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// ── Fetch: tiered caching strategy ────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. Ignore non-GET and non-http requests (chrome-extension:// etc.)
    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // 2. API calls → Network-Only (never serve stale legal/contract data)
    if (url.pathname.startsWith('/api/') || url.hostname.includes('railway.app')) {
        return; // let browser handle natively
    }

    // 3. Static shell assets → Cache-First
    if (STATIC_ASSETS.includes(url.pathname) || url.pathname === '/') {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_VERSION).then((c) => c.put(request, clone));
                    }
                    return response;
                }).catch(() => caches.match('/index.html')); // offline fallback
            })
        );
        return;
    }

    // 4. JS/CSS/font assets (Vite hashed bundles) → Stale-While-Revalidate
    if (
        url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/) ||
        url.pathname.startsWith('/assets/')
    ) {
        event.respondWith(
            caches.open(CACHE_VERSION).then(async (cache) => {
                const cached = await cache.match(request);
                const fetchPromise = fetch(request).then((response) => {
                    if (response.ok) cache.put(request, response.clone());
                    return response;
                });
                return cached || fetchPromise;
            })
        );
        return;
    }

    // 5. Navigation requests (SPA routes) → Network with offline HTML fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match('/index.html'))
        );
        return;
    }

    // 6. Everything else → Network
});

// ── Background sync placeholder (future: queue contract uploads) ─────────────
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-contracts') {
        // TODO: retry failed contract uploads when back online
        console.log('[SW] Background sync triggered:', event.tag);
    }
});

// ── Push notifications placeholder (future: appointment status alerts) ────────
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    const title = data.title || 'ContractShield';
    const options = {
        body: data.body || 'You have a new update.',
        icon: '/icon-192.png',
        badge: '/favicon-32.png',
        data: { url: data.url || '/' },
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/')
    );
});
