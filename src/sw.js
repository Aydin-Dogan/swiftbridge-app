/**
 * sw.js — SwiftBridge Service Worker
 * - Precaching van app assets (workbox)
 * - Web push notificaties
 * - Notificatie klik → app openen
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

// ── Precaching (door Vite ingevoegd) ────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// SPA fallback: alle navigatie → index.html
const navigationRoute = new NavigationRoute(
  async () => {
    const cache = await caches.open('workbox-precache');
    const response = await cache.match('/index.html');
    return response || fetch('/index.html');
  },
  { denylist: [/^\/api/, /^\/sw\.js/] }
);
registerRoute(navigationRoute);

// API caching (FX koersen)
registerRoute(
  /^https:\/\/.*\.up\.railway\.app\/transactions\/koersen/,
  new NetworkFirst({
    cacheName: 'fx-koersen',
    networkTimeoutSeconds: 5,
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
