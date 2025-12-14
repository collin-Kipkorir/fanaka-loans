// Vercel Serverless function: /api/payhero/stk
// Proxies STK push requests to PayHero. Keep PayHero credentials in Vercel Environment Variables.

module.exports = async (req, res) => {
  // Wrap everything in try-catch to ensure we always return a response
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log('[api/payhero/stk] Function invoked');
    console.log('[api/payhero/stk] Method:', req.method);
    
    // Check if fetch is available (Node.js 18+)
    if (typeof fetch === 'undefined') {
      console.error('[api/payhero/stk] fetch is not available');
      return res.status(500).json({ 
        success: false,
        error: 'Server error: fetch API not available. Node.js 18+ required.' 
      });
    }

    // Parse request body
    let body = {};
    try {
      if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
      } else if (req.body && typeof req.body === 'object') {
        body = req.body;
      } else if (req.body) {
        body = JSON.parse(String(req.body));
      }
    } catch (e) {
      console.error('[api/payhero/stk] Error parsing body:', e.message);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid JSON in request body', 
        details: e.message 
      });
    }
    
    console.log('[api/payhero/stk] Parsed body:', JSON.stringify(body));

    // Get environment variables
    const PAYHERO_BASE = process.env.PAYHERO_BASE_URL || 'https://api.payhero.co.ke';
    const AUTH = process.env.PAYHERO_AUTH_TOKEN || '';
    const DEFAULT_CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID;
    const CALLBACK_URL = process.env.PAYHERO_CALLBACK_URL || '';

    console.log('[api/payhero/stk] Env check - BASE_URL:', !!PAYHERO_BASE, 'AUTH:', !!AUTH, 'CHANNEL_ID:', !!DEFAULT_CHANNEL_ID);

    if (!AUTH) {
      console.error('[api/payhero/stk] PAYHERO_AUTH_TOKEN is not set');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error: PAYHERO_AUTH_TOKEN not set' 
      });
    }

    if (!DEFAULT_CHANNEL_ID) {
      console.error('[api/payhero/stk] PAYHERO_CHANNEL_ID is not set');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error: PAYHERO_CHANNEL_ID not set' 
      });
    }

    // Extract and validate request parameters
    const amount = Number(body.amount || body.Amount);
    let phone = body.phone_number || body.phone || body.PhoneNumber || '';
    const channel_id = Number(body.channel_id || DEFAULT_CHANNEL_ID);
    
    if (isNaN(channel_id) || channel_id <= 0) {
      console.error('[api/payhero/stk] Invalid channel_id:', channel_id);
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error: Invalid PAYHERO_CHANNEL_ID' 
      });
    }

    const provider = (body.provider || 'm-pesa').toString().toLowerCase();
    const external_reference = body.external_reference || body.account_reference || body.reference || body.externalReference || `TX${Date.now()}`;
    const customer_name = body.customer_name || body.customerName || 'Customer';

    // Build callback URL
    const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host || '';
    const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
    const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : '';
    const callback_url = (body.callback_url && body.callback_url.trim()) || CALLBACK_URL || (origin ? `${origin}/api/payment-callback` : '');

    // Validate required fields
    if (!amount || amount <= 0 || isNaN(amount)) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing or invalid amount' 
      });
    }
    
    if (!phone || typeof phone !== 'string') {
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

    // Build PayHero payload
    const payload = {
      amount: Math.round(amount),
      phone_number: phone,
      channel_id: channel_id,
      provider: provider,
      external_reference: external_reference,
      customer_name: customer_name,
      callback_url: callback_url,
    };

    console.log('[api/payhero/stk] Payload:', JSON.stringify(payload));

    // Prepare authorization header
    let authHeader = AUTH;
    if (AUTH && !AUTH.startsWith('Basic ')) {
      authHeader = `Basic ${AUTH}`;
    }

    // Call PayHero API
    const payheroUrl = `${PAYHERO_BASE}/api/v2/payments`;
    console.log('[api/payhero/stk] Calling PayHero:', payheroUrl);
    
    let fetchRes;
    try {
      fetchRes = await fetch(payheroUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (fetchError) {
      console.error('[api/payhero/stk] Fetch error:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to connect to PayHero API',
        details: fetchError.message
      });
    }

    const text = await fetchRes.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.log('[api/payhero/stk] Non-JSON response from PayHero:', text);
      data = { raw: text };
    }

    console.log('[api/payhero/stk] PayHero response status:', fetchRes.status);
    console.log('[api/payhero/stk] PayHero response data:', JSON.stringify(data));

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
    // Top-level error handler
    console.error('[api/payhero/stk] Unexpected error:', err);
    console.error('[api/payhero/stk] Error stack:', err && err.stack ? err.stack : 'No stack trace');
    
    return res.status(500).json({
      success: false,
      error: err && err.message ? err.message : String(err),
      type: err && err.name ? err.name : 'UnknownError',
      stack: err && err.stack ? err.stack : undefined
    });
  }
};
