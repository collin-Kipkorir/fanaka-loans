// Client-side service worker registration + Push subscription helpers
// - registerServiceWorker(): registers /service-worker.js when supported
// - subscribeToPush(vapidPublicKey): asks the browser to create a PushSubscription
//   and posts it to /api/save-subscription (server endpoint scaffold)

const SW_URL = '/service-worker.js';

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.debug('[SW] Service Worker not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL);
    console.debug('[SW] Registered service worker at', SW_URL, registration);
    return registration;
  } catch (err) {
    console.warn('[SW] Failed to register service worker', err);
    return null;
  }
}

// Convert Base64 URL-safe VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(vapidPublicKey: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[SW] Push not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      console.debug('[SW] Already subscribed to push');
      return existing;
    }

    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Send subscription to server for storing
    try {
      await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
      console.debug('[SW] Sent subscription to server');
    } catch (err) {
      console.warn('[SW] Failed to send subscription to server', err);
    }

    return sub;
  } catch (err) {
    console.warn('[SW] subscribeToPush failed', err);
    return null;
  }
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;
    const success = await subscription.unsubscribe();
    console.debug('[SW] Unsubscribed from push', success);
    return success;
  } catch (err) {
    console.warn('[SW] unsubscribeFromPush failed', err);
    return false;
  }
}
