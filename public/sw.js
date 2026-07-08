// Bump this on every deploy that changes caching behavior — it's the only
// way the browser detects this file changed and installs the new worker.
const CACHE_NAME = "vanguard-v2";

const OFFLINE_FILES = [
  "/offline.html",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_FILES))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  // HTML pages — network-only. Never cache a full page: every deploy ships
  // a fresh build with newly hashed /_next/static/<buildId>/ asset paths, and
  // a cached page from a previous deploy would reference paths Vercel has
  // since garbage-collected once the next deployment is promoted (this is
  // what caused "Deployment not found" on installs that hit this fallback).
  // The only offline fallback is the static offline.html shell, which links
  // to no build-specific assets.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(
        () => caches.match("/offline.html")
      )
    );

    return;
  }

  // Static assets
  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      const network = fetch(event.request)
        .then((response) => {
          const clone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });

          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});