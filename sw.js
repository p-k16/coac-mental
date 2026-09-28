// Service worker : cache-first sur l'app shell. Changer VERSION à chaque livraison
// (identique à js/version.js) pour que l'iPhone télécharge la nouvelle version.
const VERSION = '0.1.0';
const CACHE = 'coachbad-' + VERSION;
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/boot.js',
  'js/main.js',
  'js/version.js',
  'js/ui.js',
  'js/router.js',
  'js/state.js',
  'js/sw-client.js',
  'js/core/countdown.js',
  'js/core/wakelock.js',
  'js/core/sound.js',
  'js/core/routine.js',
  'js/core/metrics.js',
  'js/db/store.js',
  'js/db/migrations.js',
  'js/db/defaults.js',
  'js/screens/home.js',
  'js/screens/match.js',
  'js/screens/routine.js',
  'js/screens/settings.js',
  'js/screens/diag.js',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('coachbad-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // appels LLM : jamais interceptés
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('index.html').then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
