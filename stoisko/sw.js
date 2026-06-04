const CACHE_NAME = "kgigw-stoisko-v20260604-17";
const APP_SHELL = [
  "/kgigw/stoisko/",
  "/kgigw/stoisko/index.html",
  "/kgigw/stoisko/manifest.json",
  "/kgigw/stoisko/icon-stoisko-192.png",
  "/kgigw/stoisko/icon-stoisko-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((error) => console.error("Nie udalo sie zapisac cache stoiska.", error))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith("kgigw-stoisko-") && key !== CACHE_NAME)
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
