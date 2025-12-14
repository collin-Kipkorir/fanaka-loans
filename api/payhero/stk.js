// Vercel Serverless function: /api/payhero/stk
// Proxies STK push requests to PayHero. Keep PayHero credentials in Vercel Environment Variables.

export default async function handler(req, res) {
  // Set CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    
    // Get environment variables
    const PAYHERO_BASE = process.env.PAYHERO_BASE_URL || 'https://api.payhero.co.ke';
    const AUTH = process.env.PAYHERO_AUTH_TOKEN || '';
    const DEFAULT_CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID;

    // Validate environment variables
    if (!AUTH) {
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error: PAYHERO_AUTH_TOKEN not set' 
      });
    }

    if (!DEFAULT_CHANNEL_ID) {
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error: PAYHERO_CHANNEL_ID not set' 
      });
    }

    // Extract request parameters
    const amount = Number(body.amount);
    let phone = body.phone_number || body.phone || '';
    const channel_id = Number(body.channel_id || DEFAULT_CHANNEL_ID);
    const external_reference = body.external_reference || body.account_reference || body.reference || `TX${Date.now()}`;
    const customer_name = body.customer_name || body.customerName || 'Customer';

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing or invalid amount' 
      });
    }
    
    if (!phone) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required field: phone or phone_number' 
      });
    }

    // Normalize phone number
    phone = String(phone).trim();
    if (phone.startsWith('254')) {
      phone = '0' + phone.slice(3);
    } else if (!phone.startsWith('0')) {
      phone = '0' + phone;
    }

    // Build callback URL
    const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host || '';
    const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
    const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : '';
    const CALLBACK_URL = process.env.PAYHERO_CALLBACK_URL || '';
    const callback_url = CALLBACK_URL || (origin ? `${origin}/api/payment-callback` : '');

    // Build PayHero payload
    const payload = {
      amount: Math.round(amount),
      phone_number: phone,
      channel_id: channel_id,
      provider: 'm-pesa',
      external_reference: external_reference,
      customer_name: customer_name,
      callback_url: callback_url,
    };

    // Prepare authorization header
    const authHeader = AUTH.startsWith('Basic ') ? AUTH : `Basic ${AUTH}`;

    // Call PayHero API
    const payheroUrl = `${PAYHERO_BASE}/api/v2/payments`;
    const fetchRes = await fetch(payheroUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await fetchRes.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { raw: text };
    }

    // Return response
    if (fetchRes.ok) {
      return res.status(200).json({
        success: true,
        checkout_request_id: data.request_id || data.checkout_request_id,
        request_id: data.request_id,
        ...data,
      });
    } else {
      return res.status(fetchRes.status).json({
        success: false,
        error: data.error || data.message || data.error_message || `PayHero API error: ${fetchRes.status}`,
        status: fetchRes.status,
        ...data,
      });
    }
  } catch (err) {
    // Error handler
    return res.status(500).json({
      success: false,
      error: err && err.message ? err.message : String(err),
      type: err && err.name ? err.name : 'UnknownError'
    });
  }
}
