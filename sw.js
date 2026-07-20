// オフライン対応 Service Worker(アプリ本体をキャッシュ)
const CACHE = "mc-command-v4";
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
  // GET以外(翻訳のPOSTなど)は一切横取りしない
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // 外部サイト(ニュース・翻訳など)はネット優先。オフライン時のみキャッシュを返す
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // アプリ本体はキャッシュ優先
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
