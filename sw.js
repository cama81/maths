// Service worker: l'app funziona offline e si aggiorna da sola quando ripubblichi su GitHub Pages.
// Ad ogni aggiornamento dei file basta cambiare VERSION: il browser rileva il nuovo sw.js e riscarica tutto.
const VERSION = 'v1';
const CACHE = 'matematica2-' + VERSION;
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/utils.js', 'js/generators.js', 'js/custom.js', 'js/render.js', 'js/app.js', 'js/pwa.js',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'data/esempio-esercizi.json'];

self.addEventListener('install', e => {
  // cache:'reload' salta la cache HTTP di GitHub Pages (circa 10 minuti) per avere file davvero nuovi
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f =>
    fetch(new Request(f, { cache: 'reload' })).then(r => r.ok && c.put(f, r))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('matematica2-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Prima la rete (file sempre aggiornati se sei online), altrimenti la copia salvata (offline)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(new Request(req, { cache: 'no-cache' })).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
