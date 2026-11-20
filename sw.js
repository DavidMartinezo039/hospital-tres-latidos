/* Generado por construir-app.cjs. Cache-first: tras la primera visita funciona sin conexión. */
const CACHE = 'caso-inima-30571b8ac1';
const ARCHIVOS = [
  "./",
  "./app.js",
  "./cripto.js",
  "./datos.js",
  "./estilos.css",
  "./fuentes/atkinson-hyperlegible-latin-400-normal.woff2",
  "./fuentes/atkinson-hyperlegible-latin-700-normal.woff2",
  "./fuentes/atkinson-hyperlegible-latin-ext-400-normal.woff2",
  "./fuentes/atkinson-hyperlegible-latin-ext-700-normal.woff2",
  "./fuentes/special-elite-latin-400-normal.woff2",
  "./fuentes/special-elite-latin-ext-400-normal.woff2",
  "./iconos/apple-touch-icon.png",
  "./iconos/icono-192.png",
  "./iconos/icono-512.png",
  "./iconos/icono-maskable-512.png",
  "./index.html",
  "./manifest.webmanifest",
  "./simbolos.js"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('caso-inima-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
