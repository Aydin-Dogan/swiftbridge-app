/**
 * sw.js — SwiftBridge Service Worker
 * - Precaching van app assets (workbox)
 * - Web push notificaties
 * - Notificatie klik → app openen
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// ── Precaching (door Vite ingevoegd) ────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// SPA fallback: alle navigatie → index.html (React-app), BEHALVE de premium
// marketing-landing (/ , /particulier , /zakelijk). Die worden door de server
// als statische HTML geserveerd — de service-worker mag ze NIET onderscheppen,
// anders krijgt de bezoeker de gecachte React-app i.p.v. de premium landing.
const navigationRoute = new NavigationRoute(
  async () => {
    const cache = await caches.open('workbox-precache');
    const response = await cache.match('/index.html');
    return response || fetch('/index.html');
  },
  { denylist: [/^\/api/, /^\/sw\.js/, /^\/$/, /^\/particulier\/?$/, /^\/zakelijk\/?$/] }
);
registerRoute(navigationRoute);

// API caching (FX koersen)
// F81 fix (Cursor review Ronde 4): max 5 min stale cache. Voorheen kon SW
// uur-oude koers serveren zonder hint aan de UI — UI doet er berekeningen
// op die afwijken van werkelijke markt. Plus maxEntries om unbounded growth
// te voorkomen.
registerRoute(
  /^https:\/\/.*\.up\.railway\.app\/transactions\/koersen/,
  new NetworkFirst({
    cacheName: 'fx-koersen',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 5 * 60, // 5 minuten
        maxEntries: 50,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// ── Service worker lifecycle ────────────────────────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Push notificaties ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { titel: 'SwiftBridge', bericht: event.data?.text() || 'Nieuwe melding' };
  }

  const titel   = data.titel   || 'SwiftBridge';
  const bericht = data.bericht || 'Nieuwe melding';
  const opties = {
    body: bericht,
    icon: data.icon  || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag   || 'algemeen',
    data: { url: data.url || '/app' },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(titel, opties));
});

// ── Notificatie klik: open de app ───────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/app';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Als er al een tab open is, focus die
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Anders een nieuwe tab openen
        if (self.clients.openWindow) return self.clients.openWindow(url);
      })
  );
});

// ── Berichten van de app ────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
