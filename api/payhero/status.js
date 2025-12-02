// Vercel Serverless function: /api/payhero/status
// Attempts to query PayHero for a payment status by external reference or request id.

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const PAYHERO_BASE = process.env.PAYHERO_BASE_URL || 'https://backend.payhero.co.ke';
    const AUTH = process.env.PAYHERO_AUTH_TOKEN || '';

    const reference = req.query.reference || req.query.external_reference || req.query.id;
    if (!reference) return res.status(400).json({ error: 'Missing reference query param' });

    // Try a couple of likely lookup endpoints. If one fails, return the upstream response.
    // 1) GET /api/v2/payments/{reference}
    let upstreamUrl = `${PAYHERO_BASE}/api/v2/payments/${encodeURIComponent(reference)}`;

    let fetchRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: { 'Authorization': AUTH, 'Accept': 'application/json' },
    });

    let text = await fetchRes.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    if (fetchRes.status === 200) {
      return res.status(200).json(data);
    }

    // 2) fallback: query by external_reference
    upstreamUrl = `${PAYHERO_BASE}/api/v2/payments?external_reference=${encodeURIComponent(reference)}`;
    fetchRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: { 'Authorization': AUTH, 'Accept': 'application/json' },
    });

    text = await fetchRes.text();
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    return res.status(fetchRes.status).json(data);
  } catch (err) {
    console.error('[api/payhero/status] Error:', err);
    res.status(500).json({ error: err.message });
  }
};