const CACHE_NAME = "kgigw-wypozyczalnia-folder-v20260601-33";
const APP_SHELL = [
  "/kgigw/wypozyczalnia/",
  "/kgigw/wypozyczalnia/index.html",
  "/kgigw/supabase-config.js",
  "/kgigw/wypozyczalnia/manifest.json",
  "/kgigw/wypozyczalnia/icon-wypozyczalnia-192.png",
  "/kgigw/wypozyczalnia/icon-wypozyczalnia-512.png",
  "/kgigw/wypozyczalnia/icon-wypozyczalnia-192.png",
  "/kgigw/wypozyczalnia/icon-wypozyczalnia-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((error) => console.error("Nie udalo sie zapisac cache wypozyczalni.", error))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith("kgigw-wypozyczalnia-folder-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
