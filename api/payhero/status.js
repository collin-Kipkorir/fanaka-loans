export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const PAYHERO_BASE = process.env.PAYHERO_BASE_URL || 'https://backend.payhero.co.ke';
    const AUTH = process.env.PAYHERO_AUTH_TOKEN || '';
    const reference = req.query.reference || req.query.external_reference || '';

    if (!reference) {
      return res.status(400).json({ error: 'Missing reference query parameter' });
    }

    const url = `${PAYHERO_BASE}/api/v2/payments/${encodeURIComponent(reference)}`;
    console.log('[api/payhero/status] fetching:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': AUTH,
        'Accept': 'application/json',
      },
    });

    const text = await response.text();
    let data = {};
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { raw: text };
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error('[api/payhero/status] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}