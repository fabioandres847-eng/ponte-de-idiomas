// Service worker: guarda la app y las lecciones para usarlas sin conexión.
// Sube CACHE cuando cambien archivos para que los móviles reciban la versión nueva.
const CACHE = "ponte-v1";
const CORE = [
  "./", "index.html", "css/styles.css", "js/config.js", "js/app.js", "js/community.js",
  "content/languages.json", "content/en.json", "content/pt.json",
  "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png",
];
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Datos de la comunidad: siempre de la red.
  if (url.hostname.endsWith("supabase.co")) return;
  // Lecciones y app: red primero (para recibir mejoras), copia guardada si no hay conexión.
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok && (url.origin === location.origin || url.hostname.includes("fonts.g"))) {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
