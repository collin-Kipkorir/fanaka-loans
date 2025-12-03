// Vercel Serverless function: /api/payhero/status
// Queries PayHero for payment status by reference

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const PAYHERO_BASE = process.env.PAYHERO_BASE_URL || 'https://api.payhero.co.ke';
    const AUTH = process.env.PAYHERO_AUTH_TOKEN || '';
    const reference = req.query.reference || '';

    if (!reference) {
      return res.status(400).json({ error: 'Missing reference' });
    }

    const url = `${PAYHERO_BASE}/api/v2/payments/${encodeURIComponent(reference)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': AUTH, 'Accept': 'application/json' },
    });

    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw: text }; }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[api/payhero/status] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};