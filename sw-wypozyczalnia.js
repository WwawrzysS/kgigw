const OLD_CACHE_PREFIXES = [
  "kgigw-wypozyczalnia-",
  "kgigw-wypozyczalnia-v"
];

self.addEventListener("install", (event) => {
  event.waitUntil(deleteOldRentalCaches());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    deleteOldRentalCaches().then(() => self.registration.unregister())
  );
});

function deleteOldRentalCaches() {
  return caches.keys().then((keys) => Promise.all(
    keys
      .filter((key) => OLD_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)))
      .map((key) => caches.delete(key))
  ));
}
