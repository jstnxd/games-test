// Kellergrün: Service Worker
// Holt das Spiel immer frisch aus dem Netz, damit jedes Update sofort ankommt.
// Der Speicher (Cache) springt nur ein, wenn gerade kein Internet da ist.
// Fremde Server (z. B. der Mehrspieler-Dienst) werden nicht angefasst.
const CACHE = 'kellergruen-38';
const FILES = ['./kellergruen.html', './kg3d.js', './three.module.min.js', './kg3d_fig.js', './kg3d_deco.js', './kg3d_plants.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png']; // v90: 3D-Dateien fuer offline

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(new Request(url.href, { cache: 'no-store', credentials: 'same-origin' }))
      .then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(url.pathname, copy)).catch(() => {}); }
        return res;
      })
      .catch(() => caches.match(url.pathname).then(hit => hit || caches.match('./kellergruen.html')))
  );
});
