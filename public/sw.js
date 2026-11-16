// Expense Tracker service worker.
//
// It does one thing: when a page cannot be loaded because there is no network, it
// shows /offline.html instead of the browser's error page.
//
// It deliberately caches nothing else. Pages here show a person's own money, so
// they are never stored by the worker: every page comes from the server, every
// time. Form submissions and other requests pass straight through untouched.

const CACHE = "offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
  // Take over as soon as it is installed.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  // Only page loads (links, the address bar), and only GET.
  if (request.mode !== "navigate" || request.method !== "GET") return;
  event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
});
