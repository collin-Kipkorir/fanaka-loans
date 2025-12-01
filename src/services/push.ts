// High-level client push helper that uses serviceWorkerRegistration utilities.
// Export a safe subscribeToPush helper that uses an environment-provided VAPID public key.

import { subscribeToPush as swSubscribeToPush } from '@/serviceWorkerRegistration';

// Fetch the VAPID public key from the server at runtime, then subscribe.
export async function subscribeToPush() {
  try {
    const resp = await fetch('/api/vapid-public-key');
    if (!resp.ok) {
      console.warn('[push] Failed to fetch VAPID public key', resp.status);
      return null;
    }
    const body = await resp.json();
    const vapidKey = body?.publicKey;
    if (!vapidKey) {
      console.warn('[push] No VAPID public key returned by server');
      return null;
    }

    return await swSubscribeToPush(vapidKey);
  } catch (err) {
    console.warn('[push] subscribeToPush error', err);
    return null;
  }
}

export default {
  subscribeToPush,
};
