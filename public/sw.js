/* Service Worker for Fanaka Loans PWA
   - Handles push events (server push) and periodic sync reminder fallback
   - Shows a notification reminding users to complete collateral payment
*/

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

async function showCollateralReminder(data = {}) {
  const title = data.title || 'Finish your collateral payment';
  const body = data.body || 'You installed Fanaka Loans — complete your collateral payment to unlock your loan.';
  const options = Object.assign({
    body,
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    tag: 'collateral-reminder',
    renotify: true,
    data: data,
  }, data.options || {});

  return self.registration.showNotification(title, options);
}

self.addEventListener('push', (event) => {
  // Server push payload should be JSON with title/body
  let payload = {};
  try {
    if (event.data) payload = event.data.json();
  } catch (e) {
    payload = { body: event.data ? event.data.text() : 'You have a new message' };
  }

  event.waitUntil(showCollateralReminder(payload));
});

self.addEventListener('periodicsync', (event) => {
  // Periodic background sync (Chrome-derived) — not widely supported but useful when available
  if (event.tag === 'collateral-reminder') {
    event.waitUntil(
      (async () => {
        await showCollateralReminder();
      })()
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
