/* Minimal Service Worker for Push Notifications
   - Listens for 'push' events and displays notifications
   - Handles notificationclick to focus/open the app
   - This file lives in `public/` so it's served at the app root as `/service-worker.js`
   Notes:
   - For production use, sign and generate VAPID keys on the server and send pushes from a backend using web-push.
*/

self.addEventListener('install', (event) => {
  // Activate immediately so we can receive push messages during development
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    if (event.data) payload = event.data.json();
  } catch (e) {
    // fallback to text
    payload = { title: 'Fanaka Loans', body: event.data ? event.data.text() : 'You have a new message' };
  }

  const title = payload.title || 'Fanaka Loans';
  const body = payload.body || 'You have a new notification from Fanaka Loans';
  const icon = payload.icon || '/logo-192.png';
  const data = payload.data || { url: '/' };

  const options = {
    body,
    icon,
    badge: '/logo-192.png',
    data,
    // vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // If a matching window is already open, focus it
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window/tab to the URL
      if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
    })
  );
});

// Optional: listen for messages from the page (e.g., to skip waiting)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
