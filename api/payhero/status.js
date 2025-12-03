// Vercel Serverless function: /api/payhero/status
// Attempts to query PayHero for a payment status by external reference or request id.

export default async function handler(req, res) {
  // GET endpoint to check PayHero payment status by reference
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[api/payhero/status] invoked');
    // Log whether key env vars are present (don't print secrets)
    console.log('[api/payhero/status] env: PAYHERO_BASE_URL=', !!process.env.PAYHERO_BASE_URL, 'PAYHERO_AUTH_TOKEN=', !!process.env.PAYHERO_AUTH_TOKEN);

    const PAYHERO_BASE = process.env.PAYHERO_BASE_URL || 'https://backend.payhero.co.ke';
    const AUTH = process.env.PAYHERO_AUTH_TOKEN || '';

    const reference = req.query.reference || req.query.external_reference || req.query.id;
    if (!reference) return res.status(400).json({ error: 'Missing reference query param' });
    console.log('[api/payhero/status] looking up reference:', reference);

    // Try a couple of likely lookup endpoints. If one fails, return the upstream response.
    // 1) GET /api/v2/payments/{reference}
    let upstreamUrl = `${PAYHERO_BASE}/api/v2/payments/${encodeURIComponent(reference)}`;
    console.log('[api/payhero/status] trying primary endpoint:', upstreamUrl);

    let fetchRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: { 'Authorization': AUTH, 'Accept': 'application/json' },
    });

    let text = await fetchRes.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.log('[api/payhero/status] non-JSON response from primary endpoint:', text);
      data = { raw: text };
    }

    if (fetchRes.status === 200) {
      console.log('[api/payhero/status] primary endpoint returned 200, data:', data);
      return res.status(200).json(data);
    }

    console.log('[api/payhero/status] primary endpoint returned', fetchRes.status, ', trying fallback endpoint');
    upstreamUrl = `${PAYHERO_BASE}/api/v2/payments?external_reference=${encodeURIComponent(reference)}`;
    console.log('[api/payhero/status] trying fallback endpoint:', upstreamUrl);
    fetchRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: { 'Authorization': AUTH, 'Accept': 'application/json' },
    });

    text = await fetchRes.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.log('[api/payhero/status] non-JSON response from fallback endpoint:', text);
      data = { raw: text };
    }

    console.log('[api/payhero/status] fallback endpoint returned', fetchRes.status, ', data:', data);

    return res.status(fetchRes.status).json(data);
  } catch (err) {
    console.error('[api/payhero/status] Error:', err && err.stack ? err.stack : err);
    const payload = { error: err && err.message ? err.message : String(err) };
    return res.status(500).json(payload);
  }
}