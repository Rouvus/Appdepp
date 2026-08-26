/* Service Worker der Lern-App.
   ---------------------------------------------------------------
   Aufgabe: Die App soll nach dem ersten Besuch komplett ohne Netz
   starten. Weil die ganze App in einer einzigen HTML-Datei steckt
   (Schrift, Bilder und Logik inklusive), ist das erfreulich einfach:
   wir legen eine Handvoll Dateien ab und liefern sie danach aus dem
   Gerät aus.

   Strategie:
   - App-Dateien: erst aus dem Speicher (schneller Start), im
     Hintergrund wird geprüft, ob es eine neue Fassung gibt.
   - Navigationsanfragen: immer index.html aus dem Speicher, damit
     ein Start ohne Netz nie auf einer Fehlerseite landet.

   VERSION wird beim Bauen (build-pwa.sh) automatisch gesetzt. Ändert
   sich die App, ändert sich die Version, und der alte Speicher wird
   verworfen. */
const VERSION = '3d05a8dcdcd7';
const CACHE = 'koreanisch-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Jeder Seitenaufruf bekommt die App-Datei — auch offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((hit) => hit || fetch(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const fromNet = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || fromNet;
    })
  );
});
