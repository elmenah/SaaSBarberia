const CACHE_NAME = "mibarberia-v1";

// Archivos estáticos que cacheamos para carga rápida
const STATIC_ASSETS = ["/", "/login", "/favicon.svg"];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch — Network first, cache fallback ────────────────────────────────────
self.addEventListener("fetch", (event) => {
  // Solo interceptar peticiones GET al mismo origen
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Rutas de API, auth y dashboard: siempre network (nunca cachear)
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/setup")
  ) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardar copia en cache si es exitosa
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        // Sin red: servir desde cache
        caches.match(event.request)
      )
  );
});

// ── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Mibarberia", body: event.data.text() };
  }

  const options = {
    body: data.body ?? "",
    icon: "/api/pwa/icon?size=192",
    badge: "/api/pwa/icon?size=96",
    tag: data.tag ?? "mibarberia-notification",
    data: { url: data.url ?? "/dashboard" },
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction ?? false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ── Notification click → abrir la app en la URL correcta ─────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(targetUrl);
      } else {
        self.clients.openWindow(targetUrl);
      }
    })
  );
});
