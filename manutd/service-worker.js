var CACHE_NAME = 'manutd-fixtures-v-2';
var cacheUrls = [
  '/',
  'script.min.js',
  'style.css',
  'assets/fonts/Roboto-Light.ttf',
  'assets/fonts/Roboto-Medium.ttf',
  'assets/fonts/Roboto-Regular.ttf',
  'assets/crests/',
  'assets/crests/arsenal.svg',
  'assets/crests/bournemouth.svg',
  'assets/crests/burnley.svg',
  'assets/crests/chelsea.svg',
  'assets/crests/crystal_palace.svg',
  'assets/crests/default_badge.gif',
  'assets/crests/everton.svg',
  'assets/crests/hull_city.svg',
  'assets/crests/leicester.svg',
  'assets/crests/liverpool.svg',
  'assets/crests/manchester_city.svg',
  'assets/crests/manchester_united.svg',
  'assets/crests/middlesbrough.svg',
  'assets/crests/southampton.svg',
  'assets/crests/stoke_city.svg',
  'assets/crests/sunderland.svg',
  'assets/crests/swansea.svg',
  'assets/crests/tottenham.svg',
  'assets/crests/watford.svg',
  'assets/crests/west_ham_united.svg',
  'assets/crests/wba.svg'
];


self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(cacheUrls);
      }).then(function() {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function(event) {
	return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.search(".js") >= 0) {
    console.log(event.request.url);
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          console.log('Cache hit: ' + event.request.url);
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
