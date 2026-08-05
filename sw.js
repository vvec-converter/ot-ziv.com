const CACHE_NAME = "casino-vodka-cache-v3";
const CORE_ASSETS = [
  "https://ot-ziv.com/#google"
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          CORE_ASSETS.map((asset) => cache.add(asset).catch(() => null))
        )
      )
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestURL = new URL(event.request.url);
  if (requestURL.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchRequest = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseClone))
                .catch(() => {});
            }
            return networkResponse;
          })
          .catch(() =>
            cachedResponse ||
            (event.request.mode === "navigate"
              ? caches.match("https://ot-ziv.com/#google")
              : Response.error())
          );
        return cachedResponse || fetchRequest;
      })
    );
  }
});