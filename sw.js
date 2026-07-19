// オフライン対応 Service Worker(アプリ本体をキャッシュ)
const CACHE = "mc-command-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/templates.js",
  "./js/commands.js",
  "./js/zip.js",
  "./js/news.js",
  "./js/app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // ニュースAPIはネット優先、アプリ本体はキャッシュ優先
  if (e.request.url.includes("launchercontent.mojang.com")) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
