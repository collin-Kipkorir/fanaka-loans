// Vercel Serverless function: /api/payhero/stk
// Proxies STK push requests to PayHero. Keep PayHero credentials in Vercel Environment Variables.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const PAYHERO_BASE = process.env.PAYHERO_BASE_URL || 'https://backend.payhero.co.ke';
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
    const callback_url = body.callback_url || CALLBACK_URL;

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
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    // Mirror status and body back to the caller
    res.status(fetchRes.status).json(data);
  } catch (err) {
    console.error('[api/payhero/stk] Error:', err);
    res.status(500).json({ error: err.message });
  }
};