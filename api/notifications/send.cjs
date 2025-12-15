const webpush = require('web-push');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscription, payload } = req.body || {};

    const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
    const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return res.status(500).json({ error: 'VAPID keys not configured on server' });
    }

    if (!subscription) {
      return res.status(400).json({ error: 'Missing subscription in body' });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

    const payloadStr = JSON.stringify(payload || { title: 'Reminder', body: 'Complete your collateral payment' });

    await webpush.sendNotification(subscription, payloadStr);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send notification error', err);
    return res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
};
