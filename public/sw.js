// cache name
const CACHE_NAME = 'charitylens-v1';


// files to cache
const urlsToCache = [

  '/',

  '/manifest.json',

  '/styles.css',

  '/offline.html'

];


// ----------------------
// install event
// ----------------------

self.addEventListener('install', event => {

  event.waitUntil(

    caches.open(CACHE_NAME)

      .then(cache => {

        console.log('Cache opened');

        return cache.addAll(urlsToCache);

      })

  );

});


// ----------------------
// fetch event
// ----------------------

self.addEventListener('fetch', event => {

  event.respondWith(

    caches.match(event.request)

      .then(response => {

        // return cached version if exists
        if (response) {

          return response;

        }

        // otherwise fetch from network
        return fetch(event.request);

      })

      .catch(() => {

        // fallback page if offline
        return caches.match('/offline.html');

      })

  );

});