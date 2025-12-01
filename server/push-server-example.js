/*
  Minimal example server showing how to accept push subscriptions and send a push via web-push.

  Usage:
    1) npm install web-push express body-parser
    2) Generate VAPID keys (see README_PUSH.md) and set VAPID_PUBLIC and VAPID_PRIVATE
    3) Run: node push-server-example.js

  This example stores subscriptions in memory (for demo only). In production persist them to DB.
*/

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const webpush = require('web-push');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// Replace with your VAPID keys (generate with web-push generate-vapid-keys)
const VAPID_PUBLIC = process.env.VAPID_PUBLIC || '<YOUR_VAPID_PUBLIC_KEY_HERE>';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || '<YOUR_VAPID_PRIVATE_KEY_HERE>';

if (VAPID_PUBLIC.startsWith('<')) {
  console.warn('Warning: VAPID keys not set. Set VAPID_PUBLIC and VAPID_PRIVATE environment variables. See README_PUSH.md');
}

webpush.setVapidDetails('mailto:you@example.com', VAPID_PUBLIC, VAPID_PRIVATE);

// In-memory store for demo purposes
const SUBSCRIPTIONS = [];

app.post('/api/save-subscription', (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
  SUBSCRIPTIONS.push(sub);
  console.log('Saved subscription, total:', SUBSCRIPTIONS.length);
  res.json({ success: true });
});

// Expose the public VAPID key so clients can fetch it at runtime
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

app.post('/api/send-push', async (req, res) => {
  const payload = req.body.payload || { title: 'Fanaka Loans', body: 'Test push from server', data: { url: '/' } };
  const results = [];
  for (const sub of SUBSCRIPTIONS) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      results.push({ endpoint: sub.endpoint, status: 'ok' });
    } catch (err) {
      console.warn('Push send failed for', sub.endpoint, err.message || err);
      results.push({ endpoint: sub.endpoint, status: 'error', error: err.message || String(err) });
    }
  }
  res.json({ results });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log('Push example server listening on', port);
  console.log('VAPID_PUBLIC:', VAPID_PUBLIC.slice(0, 10) + '...');
});
