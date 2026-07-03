const CACHE_NAME = 'rsmp-chat-v3';
const STATIC_CACHE = 'rsmp-chat-static-v3';
const IMAGE_CACHE = 'rsmp-chat-images-v3';
const FONT_CACHE = 'rsmp-chat-fonts-v3';

const PRECACHE_URLS = [
    '/',
    '/manifest.json',
    '/icons/icon.svg',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/icon-512x512-maskable.png',
];

// ========== INSTALL ==========
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
            caches.open(STATIC_CACHE),
            caches.open(IMAGE_CACHE),
            caches.open(FONT_CACHE),
        ])
    );
    self.skipWaiting(); // Activate immediately
});

// ========== ACTIVATE ==========
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME &&
                        key !== STATIC_CACHE &&
                        key !== IMAGE_CACHE &&
                        key !== FONT_CACHE)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// ========== HELPERS ==========
function isAsset(url) {
    return /\.(js|css|wasm)$/i.test(url);
}

function isImage(url) {
    return /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url);
}

function isFont(url) {
    return /\.(woff2?|ttf|otf|eot)$/i.test(url);
}

function isNavigation(url) {
    return /^\/(chat(\/\d+)?|dashboard|profile|\/?)$/.test(new URL(url).pathname);
}

function isApi(url) {
    return /\/api\/|\/broadcasting\/|reverb|echo|soketi/i.test(url);
}

function isHotReload(url) {
    return /hot|@vite|hmr/i.test(url);
}

// ========== FETCH ==========
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = request.url;

    // Skip non-GET
    if (request.method !== 'GET') return;

    // Skip API, WebSocket, HMR
    if (isApi(url) || isHotReload(url)) return;

    // ---- Static assets (JS/CSS): Cache First ----
    if (isAsset(url)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // ---- Images: Cache First, background refresh ----
    if (isImage(url)) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
        return;
    }

    // ---- Fonts: Cache First ----
    if (isFont(url)) {
        event.respondWith(cacheFirst(request, FONT_CACHE));
        return;
    }

    // ---- Navigation (HTML pages): Network First with offline fallback ----
    if (isNavigation(url)) {
        event.respondWith(networkFirst(request));
        return;
    }

    // ---- Everything else: Stale-while-revalidate ----
    event.respondWith(staleWhileRevalidate(request));
});

// ========== STRATEGIES ==========
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response && response.ok) {
            const clone = response.clone();
            const cache = await caches.open(cacheName);
            cache.put(request, clone);
        }
        return response;
    } catch (err) {
        return new Response('', { status: 408, statusText: 'Offline' });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response && response.ok) {
            const clone = response.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, clone);
        }
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Offline page fallback
        const offline = await caches.match('/');
        if (offline) return offline;

        return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline - RSMP Chat</title><style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;text-align:center;padding:1rem}h1{font-size:2rem;margin-bottom:0.5rem}p{color:#94a3b8;max-width:400px}@media(prefers-color-scheme:light){body{background:#f8fafc;color:#1e293b}p{color:#64748b}}</style></head><body><h1>🔌 Tidak Ada Koneksi</h1><p>Kamu sedang offline. Periksa koneksi internetmu dan coba lagi.</p></body></html>`,
            {
                status: 503,
                statusText: 'Offline',
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
        );
    }
}

async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request).then((response) => {
        if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
    }).catch(() => cached);

    return cached || fetchPromise;
}

// ========== PUSH NOTIFICATIONS ==========
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = { title: 'RSMP Chat', body: event.data.text() };
    }

    const title = data.title || 'Pesan Baru';
    const options = {
        body: data.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'chat-message',
        renotify: true,
        requireInteraction: true,
        data: {
            url: data.url || '/chat',
            timestamp: Date.now(),
        },
        actions: [
            { action: 'open', title: 'Buka Chat' },
            { action: 'close', title: 'Tutup' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ========== MESSAGE HANDLER ==========
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ========== NOTIFICATION CLICK ==========
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/chat';

    if (event.action === 'close') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Focus existing window
            for (const client of windowClients) {
                if (client.url.includes('/chat') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});
