const CACHE_NAME = 'casino-vodka-cache-v3';
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll([
                    'https://sites.google.com/view/ot-ziv/%D0%BD%D0%B0%D0%BF%D0%B8%D1%81%D0%B0%D1%82%D1%8C-%D0%BE%D1%82%D0%B7%D1%8B%D0%B2'
                ]);
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});
self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;   
    event.respondWith(
        fetch(event.request)
            .catch(function() {
                return caches.match(event.request) || caches.match('/index.html');
            })
    );
});