/* Dibangun oleh skrip/bangun_situs.py; jangan diedit langsung.
 * Versi cache mengikuti versi di CITATION.cff. Aset inti disimpan saat pemasangan; halaman dan
 * aset lain disimpan saat pertama dibuka. Halaman: jaringan dulu, cadangan dari cache. Aset: cache dulu.
 */
const VERSI = "defsa-0.9.0";
const INTI = [
  "/",
  "/assets/gaya.css",
  "/assets/umum.js",
  "/assets/daftar-sw.js",
  "/assets/ikon.svg",
  "/manifest.webmanifest",
  "/assets/katex/katex.min.css",
  "/assets/katex/katex.min.js",
  "/assets/font/archivo-black-latin-400-normal.woff2",
  "/assets/font/source-sans-3-latin-400-normal.woff2",
  "/assets/font/source-sans-3-latin-600-normal.woff2",
  "/assets/font/source-sans-3-latin-700-normal.woff2"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSI).then((c) => c.addAll(INTI)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((kunci) => Promise.all(kunci.filter((k) => k !== VERSI).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const simpan = (res) => {
    if (res.ok) { const salinan = res.clone(); caches.open(VERSI).then((c) => c.put(req, salinan)); }
    return res;
  };
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(simpan).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req).then((r) => r || fetch(req).then(simpan)));
});
