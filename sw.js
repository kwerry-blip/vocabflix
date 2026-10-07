/* Service Worker: speichert die App auf dem Gerät, damit sie auch ohne Internet startet.
   Bei Änderungen an der App die Versionsnummer erhöhen. */
const VERSION = 'v13';
const CACHE = `vocabflix-${VERSION}`;
// Texterkennung (groß, ändert sich nie): eigener Cache, der Updates überlebt
const VENDOR_CACHE = 'vocabflix-vendor-tesseract-5.1.1';
const APP_FILES = [
  './',
  'index.html',
  'css/style.css',
  'js/answers.js',
  'js/beat.js',
  'js/vibes.js',
  'js/mascots.js',
  'js/goals.js',
  'js/app.js',
  'js/share.js',
  'js/social.js',
  'js/exam.js',
  'js/studio.js',
  'js/stable.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(k => (k.startsWith('vokabeltrainer-') || k.startsWith('vocabflix-')) && k !== CACHE && k !== VENDOR_CACHE)
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Texterkennung: einmal laden, danach immer aus dem Cache
  if (url.origin === location.origin && url.pathname.includes('/vendor/')) {
    event.respondWith(
      caches.open(VENDOR_CACHE).then(cache => cache.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      })))
    );
    return;
  }

  // Eigene Dateien: erst Netz (damit Updates ankommen), sonst Cache.
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
    );
    return;
  }

});
