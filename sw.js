// Service worker: app offline e aggiornamento automatico da GitHub Pages.
// Ad ogni pubblicazione cambia VERSION (v2, v3, ...) così il browser rileva il nuovo sw.js e riscarica tutto.
const VERSION = 'v13';
const CACHE = 'matematica2-' + VERSION;
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/utils.js', 'js/config.js', 'js/audio.js', 'js/models.js', 'js/stats.js', 'js/custom.js', 'js/render.js', 'js/statsui.js', 'js/app.js', 'js/pwa.js',
  'icon-192.png', 'favicon-32.png', 'icon-512.png', 'apple-touch-icon.png', 'img/fiaba.svg', 'data/db.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f =>
    fetch(new Request(f, { cache: 'reload' })).then(r => r.ok && c.put(f, r)).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('matematica2-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Prima la rete (file sempre aggiornati se sei online), altrimenti la copia salvata (offline)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // si richiede l'URL "pulito" (no cache HTTP, redirect seguiti): evita problemi con le richieste di navigazione
  e.respondWith(fetch(req.url, { cache: 'no-cache' }).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
