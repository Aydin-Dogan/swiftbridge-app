/**
 * pushNotificatie.js — Frontend service voor web push registratie
 */

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Convert base64 VAPID key naar Uint8Array (web push standaard)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

// Check of push notificaties beschikbaar zijn in deze browser
export function pushBeschikbaar() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Huidige permissie status
export function permissieStatus() {
  if (!('Notification' in window)) return 'niet_ondersteund';
  return Notification.permission; // 'default', 'granted', 'denied'
}

// Vraag permissie + registreer
export async function pushInschakelen(token) {
  if (!pushBeschikbaar()) throw new Error('Push notificaties worden niet ondersteund in deze browser.');

  // 1. Vraag toestemming
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Toestemming voor notificaties geweigerd.');
  }

  // 2. Haal de VAPID public key op van de server
  const vapidRes = await fetch(`${API}/push/vapid-public-key`, { credentials: 'include' });
  if (!vapidRes.ok) throw new Error('Server niet bereikbaar.');
  const { publicKey } = await vapidRes.json();

  // 3. Wacht op service worker
  const registration = await navigator.serviceWorker.ready;

  // 4. Maak push subscription
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  // 5. Stuur subscription naar server
  const subscribeRes = await fetch(`${API}/push/subscribe`, {
        credentials: 'include',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!subscribeRes.ok) throw new Error('Kon subscription niet opslaan.');

  return subscription;
}

// Push uitschakelen
export async function pushUitschakelen(token) {
  if (!pushBeschikbaar()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  // Verwijder van server
  await fetch(`${API}/push/unsubscribe`, {
        credentials: 'include',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => {});

  // Verwijder lokaal
  await subscription.unsubscribe();
}

// Test notificatie sturen
export async function stuurTestNotificatie(token) {
  const res = await fetch(`${API}/push/test`, {
        credentials: 'include',
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Test mislukt.');
  return res.json();
}

// Check of de huidige browser al een actieve subscription heeft
export async function isIngeschakeld() {
  if (!pushBeschikbaar()) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}
