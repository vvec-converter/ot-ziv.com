const CACHE_NAME = "casino-vodka-cache-v3";
const CORE_ASSETS = [
  "https://sites.google.com/view/ot-ziv/%D0%BD%D0%B0%D0%BF%D0%B8%D1%81%D0%B0%D1%82%D1%8C-%D0%BE%D1%82%D0%B7%D1%8B%D0%B2"
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache
          .addAll(CORE_ASSETS)
          .then(() =>
            Promise.allSettled(
              EXTENDED_ASSETS.map((asset) =>
                cache.add(asset).catch(() => null)
              )
            )
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
              ? caches.match("/index.html")
              : Response.error())
          );
        return cachedResponse || fetchRequest;
      })
    );
  }
});