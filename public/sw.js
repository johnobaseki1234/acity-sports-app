// Acity Sports Center — service worker
// Strategy: network-first for navigations (always try fresh live data, fall
// back to an offline page), cache-first for static build assets.

const CACHE = "acity-sports-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = ["/offline.html", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never cache API calls or cross-origin requests (e.g. Supabase realtime).
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Navigations: network-first, offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((r) => r ?? Response.error()))
    );
    return;
  }

  // Static assets: cache-first, then network (and cache the result).
  if (url.pathname.startsWith("/_next/") || PRECACHE.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});

// Web-push scaffolding — fires once a VAPID-signed subscription is added.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Acity Sports", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Acity Sports Center", {
      body: data.body || "New live update",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;
  if (url) event.waitUntil(self.clients.openWindow(url));
});
