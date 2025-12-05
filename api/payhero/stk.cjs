// Vercel Serverless function: /api/payhero/stk
// Proxies STK push requests to PayHero. Keep PayHero credentials in Vercel Environment Variables.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[api/payhero/stk] invoked');
    console.log('[api/payhero/stk] method:', req.method);
    // Log whether key env vars are present (don't print secrets)
    console.log('[api/payhero/stk] env: PAYHERO_BASE_URL=', !!process.env.PAYHERO_BASE_URL, 'PAYHERO_AUTH_TOKEN=', !!process.env.PAYHERO_AUTH_TOKEN, 'PAYHERO_CHANNEL_ID=', !!process.env.PAYHERO_CHANNEL_ID);

    // Normalize / inspect incoming body safely for debugging
    let incomingBody = req.body;
    try {
      if (typeof incomingBody === 'string') incomingBody = JSON.parse(incomingBody);
    } catch (e) {
      console.log('[api/payhero/stk] failed to parse string body, leaving raw');
    }
    console.log('[api/payhero/stk] incoming body:', incomingBody);

    // Reconstruct full request origin (Vercel supplies x-forwarded-host and x-forwarded-proto)
    const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host || '';
    const forwardedProto = req.headers['x-forwarded-proto'] || (req.headers.referer && req.headers.referer.startsWith('https') ? 'https' : 'https');
    const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : '';
    const fullUrl = origin ? `${origin}${req.url || ''}` : (req.url || '');
    console.log('[api/payhero/stk] full incoming URL:', fullUrl);

    const PAYHERO_BASE = process.env.PAYHERO_BASE_URL || 'https://api.payhero.co.ke';
    const AUTH = process.env.PAYHERO_AUTH_TOKEN || '';
    const DEFAULT_CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID;
    const CALLBACK_URL = process.env.PAYHERO_CALLBACK_URL || '';

    const body = req.body || {};
    const amount = Number(body.amount || body.Amount);
    let phone = body.phone_number || body.phone || body.PhoneNumber || '';
    const channel_id = Number(body.channel_id || DEFAULT_CHANNEL_ID);
    const provider = (body.provider || 'm-pesa').toString().toLowerCase();
    const external_reference = body.external_reference || body.reference || body.externalReference || `TX${Date.now()}`;
    const customer_name = body.customer_name || body.customerName || '';
    // Prefer explicit body callback, then env var, otherwise fall back to the detected origin + standard path
    const callback_url = (body.callback_url && body.callback_url.trim()) || CALLBACK_URL || (origin ? `${origin}/api/payment-callback` : '');

    if (!amount || !phone) {
      return res.status(400).json({ error: 'Missing required fields: amount and phone_number' });
    }

    // If phone is in international format (starts with 254), convert to local 07... format as PayHero docs show
    if (phone.startsWith('254')) {
      phone = '0' + phone.slice(3);
    }

    const payload = {
      amount: Math.round(amount),
      phone_number: phone,
      channel_id: channel_id,
      provider: provider,
      external_reference: external_reference,
      customer_name: customer_name,
      callback_url: callback_url,
    };

    // Perform outbound call to PayHero
    console.log('[api/payhero/stk] forwarding to:', `${PAYHERO_BASE}/api/v2/payments`, 'payload:', payload);
    const fetchRes = await fetch(`${PAYHERO_BASE}/api/v2/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH,
      },
      body: JSON.stringify(payload),
    });
    const text = await fetchRes.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.log('[api/payhero/stk] non-JSON response from PayHero:', text);
      data = { raw: text };
    }

    console.log('[api/payhero/stk] PayHero status:', fetchRes.status, 'response:', data);

    // Mirror status and body back to the caller
    return res.status(fetchRes.status).json(data);
  } catch (err) {
    // Log full error and return stack to help debug server errors in Vercel logs
    console.error('[api/payhero/stk] Error:', err && err.stack ? err.stack : err);
    const payload = { error: err && err.message ? err.message : String(err) };
    if (process.env.NODE_ENV !== 'production') payload.stack = err && err.stack;
    // Also include stack in the body for immediate debugging (remove later)
    return res.status(500).json(payload);
  }
}
