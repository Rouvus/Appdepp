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
const VERSION = '10edf0e63d68';
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
      /* cache:'reload' ist wichtig: Ohne das darf der Browser die Dateien
         aus seinem EIGENEN Zwischenspeicher nehmen — und legt dann eine
         alte Fassung als "neu" ab. Manche Webspeicher (u. a. GitHub
         Pages) erlauben ihm das für einige Minuten. */
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
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
      .then(() => precacheAudio())
  );
});

/* Die Sprachaufnahmen im Hintergrund nachladen.
   Sie werden zwar ohnehin beim ersten Abspielen abgelegt (s. fetch weiter
   unten) — aber genau darauf darf man sich nicht verlassen: Wer die App
   installiert und dann im Zug ohne Netz lernt, hätte sonst Aufnahmen nur
   für die Wörter, die er zufällig schon einmal angehört hat.
   Bewusst in kleinen Gruppen und mit allSettled: eine einzelne fehlende
   Datei darf den ganzen Vorgang nicht abbrechen. Fehlt der Ordner ganz
   (noch keine Aufnahmen erzeugt), endet das hier still nach dem 404. */
async function precacheAudio() {
  try {
    const res = await fetch('./audio/index.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !Array.isArray(data.items)) return;
    const cache = await caches.open(CACHE);
    const files = data.items.map((it) => './audio/' + it.file).concat(['./audio/index.json']);
    for (let i = 0; i < files.length; i += 20) {
      await Promise.allSettled(files.slice(i, i + 20).map((f) => cache.add(f)));
    }
  } catch (err) {
    /* keine Aufnahmen vorhanden oder kein Netz — beides unkritisch */
  }
}

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
