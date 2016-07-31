importScripts('./serviceworker-cache-polyfill.js');

var VERSION = 'v2';
var STATIC_CACHE_NAME = 'manutd-static-' + VERSION;

self.addEventListener('install', function(event) {
  console.log("SW installed");
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(function(cache) {
      return cache.addAll([
        '/simple-test/',
        '/simple-test/script.js',
        '/simple-test/style.css'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log("SW activated");
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      } else {
        return fetch(event.request);
      }
    }
  ));
});
