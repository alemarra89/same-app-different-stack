// Bump VERSION whenever a cached file changes. Installation is all-or-nothing.
const VERSION = 'v1';
const BASE = new URL('./', self.location.href);
const PREFIX = `event-check-in:${BASE.pathname}:`;
const CACHE = `${PREFIX}${VERSION}`;
const ASSETS = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './src/app.js', './src/data.js', './src/check-in.js', './src/controller.js',
  './src/storage.js', './src/scanner.js', './src/ui.js', './src/pwa.js',
  './vendor/jsQR.js', './icons/icon.svg', './icons/icon-192.png',
  './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png',
].map((path) => new URL(path, BASE).href);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Query strings on the app entry point should still launch offline.
    if (event.request.mode === 'navigate' && (url.pathname === BASE.pathname || url.pathname === `${BASE.pathname}index.html`)) {
      return (await cache.match(new URL('./index.html', BASE).href)) || fetch(event.request);
    }
    return (await cache.match(event.request)) || fetch(event.request);
  })());
});
