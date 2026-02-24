// ContractShield PWA Service Worker
// IMPORTANT: Only caches static assets; never caches JS/CSS modules (Vite handles those).
// Skips chrome-extension:// URLs to avoid cache errors.

const CACHE_NAME = 'contractshield-v2';  // bump version to force old cache purge

// Only cache the minimal shell - NOT JS/CSS (Vite bundles change on every build)
const STATIC_ASSETS = ['/manifest.json'];

// ── Install ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// ── Activate: delete ALL old caches ──────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.map((key) => caches.delete(key)))  // delete ALL, including old versions
        )
    );
    self.clients.claim();
});

// ── Fetch: network-only for everything ──────────────────
// In development we NEVER serve from cache — let Vite handle HMR properly.
// In production a proper caching strategy would go here.
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Skip non-http/https requests (chrome-extension://, etc.)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return;
    }

    // Skip API calls — always go to network
    if (url.includes('/api/')) {
        return;
    }

    // For everything else: network-only (no caching in dev)
    // Uncomment below for production caching:
    // event.respondWith(fetch(event.request));
});
