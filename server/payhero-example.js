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
  try {
    // Accept incoming request body and normalize fields
    const body = req.body || {};
    const rawPhone = body.phone || body.phone_number || body.msisdn;
    const rawAmount = body.amount;
    const rawAccountRef = body.accountRef || body.account_reference || (body.metadata && body.metadata.account_reference);
    const rawCustomerName = body.customerName || body.customer_name || body.customer;

    console.log('[payhero] STK request received (raw body):', body);

    // Validation
    if (!rawPhone || !rawAmount) {
      console.warn('[payhero] Missing phone or amount - request body:', body);
      return res.status(400).json({ success: false, error: 'Missing phone or amount' });
    }

    // If the incoming body already matches PayHero v2 shape, use it directly (but ensure reference exists)
    let payload = null;
    if (body.phone_number && body.channel_id && body.reference) {
      payload = { ...body };
      // Ensure callback_url is present
      if (!payload.callback_url) payload.callback_url = PAYHERO_CALLBACK_URL;
    } else {
      // Normalize phone: convert local 07xxx to 254xxxx
      let normalizedPhone = String(rawPhone).replace(/^0/, '254');
      if (!normalizedPhone.startsWith('254')) normalizedPhone = '254' + normalizedPhone;

      // Build PayHero v2 payload
      const reference = `TX${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const customer_label = rawCustomerName || 'Fanaka Loans Customer';

      payload = {
        amount: Math.round(rawAmount),
        phone_number: normalizedPhone,
        channel_id: PAYHERO_CHANNEL_ID,
        provider: 'mpesa',
        reference: reference,
        customer_name: customer_label,
        callback_url: PAYHERO_CALLBACK_URL,
        metadata: {
          account_reference: rawAccountRef || 'FANAKA_COLLATERAL',
        },
      };

      console.log('[payhero] Normalized payload to send:', payload);
    }

    // Call PayHero API (v2 initiate endpoint)
    const payHeroUrl = `${PAYHERO_BASE_URL.replace(/\/$/, '')}/v2/payments/initiate`;
    console.log('[payhero] Calling PayHero at:', payHeroUrl);

    // Normalize Authorization header: allow tokens provided as raw token and prefix with Bearer if missing
    let authHeader = PAYHERO_AUTH_TOKEN || '';
    if (authHeader && !/^Bearer\s+/i.test(authHeader) && !/^Basic\s+/i.test(authHeader)) {
      authHeader = `Bearer ${authHeader}`;
    }

    const response = await fetch(payHeroUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(payload),
    });

    let responseBody = null;
    let rawText = null;
    try {
      responseBody = await response.json();
    } catch (parseErr) {
      console.warn('[payhero] Response not JSON or empty:', parseErr && parseErr.message ? parseErr.message : parseErr);
      try {
        rawText = await response.text();
        console.warn('[payhero] Raw response text:', rawText);
      } catch (e) {
        console.error('[payhero] Failed to read raw response text:', e);
      }
    }

    console.log('[payhero] API response status:', response.status);
    console.log('[payhero] API response body (parsed):', responseBody, 'raw:', rawText);

    // Handle PayHero response
    if (!response.ok || !responseBody?.success) {
      const errorMsg = (responseBody && (responseBody.message || responseBody.error)) || rawText || 'PayHero API error';
      console.warn('[payhero] API error:', errorMsg);
      return res.status(response.status || 400).json({
        success: false,
        error: errorMsg,
        apiResponse: responseBody || { raw: rawText },
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

