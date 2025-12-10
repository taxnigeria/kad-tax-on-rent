const CACHE_NAME = "kadirs-enumerator-v1"
const OFFLINE_URL = "/enumerator-dashboard/offline"

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/enumerator-dashboard",
  "/enumerator-dashboard/enumerate",
  "/enumerator-dashboard/leaderboard",
  "/enumerator-dashboard/profile",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

// Install event - cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching assets")
      return cache.addAll(PRECACHE_ASSETS)
    }),
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    }),
  )
  self.clients.claim()
})

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return

  // Skip API requests - always fetch from network
  if (event.request.url.includes("/api/")) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseClone = response.clone()

        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }

        return response
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // If it's a navigation request, show offline page
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL)
          }

          return new Response("Offline", { status: 503 })
        })
      }),
  )
})

// Listen for messages from the app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
