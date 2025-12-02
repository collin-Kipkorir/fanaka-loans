/*
  PayHero STK Push integration server.

  This server forwards STK push requests to PayHero API with proper credentials.
  The PayHero API will send the STK prompt to the user's phone.

  Environment variables (from .env.local or process.env):
    PAYHERO_BASE_URL - API endpoint (https://backend.payhero.co.ke)
    PAYHERO_ACCOUNT_ID - Account ID
    PAYHERO_CHANNEL_ID - Channel ID
    PAYHERO_AUTH_TOKEN - Basic auth token
    PAYHERO_CALLBACK_URL - Webhook callback for payment notifications

  Endpoints:
    POST /api/payhero/stk - Initiate STK push
    POST /api/payhero/callback - Webhook receiver for payment status
*/

// Load .env.local if it exists
try {
  require('dotenv').config({ path: '../.env.local' });
} catch (err) {
  console.warn('[payhero] dotenv not installed or .env.local not found');
}

const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

const PORT = process.env.PORT || 4100;

// Load PayHero config from environment
const PAYHERO_BASE_URL = process.env.PAYHERO_BASE_URL || process.env.VITE_PAYHERO_BASE_URL || 'https://backend.payhero.co.ke';
const PAYHERO_ACCOUNT_ID = process.env.PAYHERO_ACCOUNT_ID || process.env.VITE_PAYHERO_ACCOUNT_ID;
const PAYHERO_CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID || process.env.VITE_PAYHERO_CHANNEL_ID;
const PAYHERO_AUTH_TOKEN = process.env.PAYHERO_AUTH_TOKEN || process.env.VITE_PAYHERO_AUTH_TOKEN;
const PAYHERO_CALLBACK_URL = process.env.PAYHERO_CALLBACK_URL || process.env.VITE_PAYHERO_CALLBACK_URL || 'http://localhost:8080/api/payment-callback';

console.log('[payhero] Server starting...');
console.log('[payhero] PAYHERO_BASE_URL:', PAYHERO_BASE_URL);
console.log('[payhero] PAYHERO_ACCOUNT_ID:', PAYHERO_ACCOUNT_ID);
console.log('[payhero] PAYHERO_CHANNEL_ID:', PAYHERO_CHANNEL_ID);
console.log('[payhero] PAYHERO_AUTH_TOKEN:', PAYHERO_AUTH_TOKEN ? '***set***' : '***NOT SET***');
console.log('[payhero] PAYHERO_CALLBACK_URL:', PAYHERO_CALLBACK_URL);

app.post('/api/payhero/stk', async (req, res) => {
  const { phone, amount, accountRef } = req.body || {};
  
  console.log('[payhero] STK request received:', { phone, amount, accountRef });
  
  // Validation
  if (!phone || !amount) {
    console.warn('[payhero] Missing phone or amount');
    return res.status(400).json({ success: false, error: 'Missing phone or amount' });
  }

  // Normalize phone: ensure it starts with 254
  let normalizedPhone = phone.replace(/^0/, '254');
  if (!normalizedPhone.startsWith('254')) {
    normalizedPhone = '254' + normalizedPhone;
  }

  try {
    // Build PayHero STK push request
    const payload = {
      merchant_id: PAYHERO_ACCOUNT_ID,
      merchant_channel_id: PAYHERO_CHANNEL_ID,
      msisdn: normalizedPhone,
      amount: Math.round(amount), // Ensure integer
      account_reference: accountRef || 'FANAKA_COLLATERAL',
      transaction_desc: 'Fanaka Loans - Processing Fee',
      callback_url: PAYHERO_CALLBACK_URL,
    };

    console.log('[payhero] Payload to send:', payload);

    // Call PayHero API
    const payHeroUrl = `${PAYHERO_BASE_URL}/api/v2/express-payment`;
    console.log('[payhero] Calling PayHero at:', payHeroUrl);

    const response = await fetch(payHeroUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': PAYHERO_AUTH_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    let responseBody;
    try {
      responseBody = await response.json();
    } catch (parseErr) {
      console.error('[payhero] Failed to parse response JSON:', parseErr);
      // Try to get raw text
      const responseText = await response.text();
      console.error('[payhero] Raw response:', responseText);
      responseBody = { error: 'Invalid response from PayHero', raw: responseText };
    }

    console.log('[payhero] API response status:', response.status);
    console.log('[payhero] API response body:', responseBody);

    // Handle PayHero response
    if (!response.ok || !responseBody.success) {
      const errorMsg = responseBody.message || responseBody.error || 'PayHero API error';
      console.warn('[payhero] API error:', errorMsg);
      return res.status(response.status || 400).json({
        success: false,
        error: errorMsg,
        apiResponse: responseBody,
      });
    }

    // Success: return transaction ID
    return res.json({
      success: true,
      message: 'STK prompt sent successfully',
      transactionId: responseBody.request_id || responseBody.transaction_id || null,
      requestId: responseBody.request_id || null,
    });
  } catch (err) {
    console.error('[payhero] Request failed:', err.message || err);
    return res.status(500).json({
      success: false,
      error: String(err.message || err),
    });
  }
});

// Webhook receiver for payment callbacks from PayHero
app.post('/api/payhero/callback', (req, res) => {
  const { request_id, status, amount, phone, message } = req.body || {};
  console.log('[payhero] Payment callback received:', { request_id, status, amount, phone, message });

  // In production:
  // 1. Validate signature (PayHero will provide a signature verification method)
  // 2. Update database with payment status
  // 3. Trigger notification to client via WebSocket or poll endpoint
  // 4. Mark loan as paid and proceed with disbursement

  res.json({ received: true, request_id });
});

app.listen(PORT, () => {
  console.log('[payhero] Server listening on port', PORT);
  console.log('[payhero] PayHero base URL:', PAYHERO_BASE_URL);
});

