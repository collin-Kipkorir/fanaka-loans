// High-level client push helper that uses serviceWorkerRegistration utilities.
// Export a safe subscribeToPush helper that uses an environment-provided VAPID public key.

import { subscribeToPush as swSubscribeToPush } from '@/serviceWorkerRegistration';

// NOTE: Replace this placeholder with your real VAPID public key generated on the server.
// You can keep it in environment variables or fetch from an endpoint like /api/vapid-public-key
const VAPID_PUBLIC_KEY_PLACEHOLDER = '<YOUR_VAPID_PUBLIC_KEY_HERE>'; // <-- replace me

export async function subscribeToPush() {
  if (!VAPID_PUBLIC_KEY_PLACEHOLDER || VAPID_PUBLIC_KEY_PLACEHOLDER.startsWith('<')) {
    console.warn('[push] VAPID public key not set. Skipping push subscription.');
    return null;
  }

  try {
    return await swSubscribeToPush(VAPID_PUBLIC_KEY_PLACEHOLDER);
  } catch (err) {
    console.warn('[push] subscribeToPush error', err);
    return null;
  }
}

export default {
  subscribeToPush,
};
