const express = require('express');
const app = express();
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

const PAYHERO_CONFIG = {
  BASE_URL: process.env.PAYHERO_BASE_URL || 'https://api.payhero.co.ke',
  ACCOUNT_ID: process.env.PAYHERO_ACCOUNT_ID || '3278',
  CHANNEL_ID: process.env.PAYHERO_CHANNEL_ID || '3838',
  AUTH_TOKEN: process.env.PAYHERO_AUTH_TOKEN || '',
  CALLBACK_URL: process.env.PAYHERO_CALLBACK_URL || 'http://localhost:5000/api/payment-callback',
};

// Log configuration on startup
console.log('[payhero] Configuration loaded:');
console.log('  BASE_URL:', PAYHERO_CONFIG.BASE_URL);
console.log('  ACCOUNT_ID:', PAYHERO_CONFIG.ACCOUNT_ID);
console.log('  CHANNEL_ID:', PAYHERO_CONFIG.CHANNEL_ID);
console.log('  CALLBACK_URL:', PAYHERO_CONFIG.CALLBACK_URL);
console.log('  AUTH_TOKEN set:', !!PAYHERO_CONFIG.AUTH_TOKEN);
console.log('  AUTH_TOKEN:', PAYHERO_CONFIG.AUTH_TOKEN);

// STK Push endpoint
app.post('/api/payhero/stk', async (req, res) => {
  try {
    const { phone, amount, customer_name, account_reference, phone_number, channel_id, reference, customer_name: customerName, metadata } = req.body;

    console.log('[payhero] STK request received:', req.body);

    // Normalize phone number from either v2 or legacy format
    let normalizedPhone = phone || phone_number;
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Missing phone or phone_number' });
    }

    // Convert local format to international
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '254' + normalizedPhone.slice(1);
    }
    if (!normalizedPhone.startsWith('254')) {
      normalizedPhone = '254' + normalizedPhone;
    }

    // Build PayHero v2 payload - include several field name variants to match API expectations
    const normalizedReference = account_reference || reference || `TX${Date.now()}`;
    const channelIdNum = parseInt(channel_id || PAYHERO_CONFIG.CHANNEL_ID);

    // PayHero expects specific keys & formats per their docs:
    // amount (Integer), phone_number (local format starting with 0), channel_id (Integer), provider ('m-pesa'), external_reference, customer_name, callback_url
    // Convert international 2547... to local 07... format because the docs example uses local phone format
    let phoneForApi = normalizedPhone;
    if (phoneForApi.startsWith('254')) {
      // 2547XXXXXXXX -> 07XXXXXXXX
      phoneForApi = '0' + phoneForApi.slice(3);
    }

    const payload = {
      amount: amount,
      phone_number: phoneForApi,
      channel_id: channelIdNum,
      provider: 'm-pesa',
      external_reference: normalizedReference,
      customer_name: customer_name || customerName || 'Customer',
      callback_url: PAYHERO_CONFIG.CALLBACK_URL,
    };

    console.log('[payhero] Normalized payload:', payload);
    console.log('[payhero] JSON body to send:', JSON.stringify(payload));

    // Call PayHero API - use canonical payments endpoint
    const response = await fetch(`${PAYHERO_CONFIG.BASE_URL}/api/v2/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': PAYHERO_CONFIG.AUTH_TOKEN.startsWith('Basic ') 
          ? PAYHERO_CONFIG.AUTH_TOKEN 
          : `Basic ${PAYHERO_CONFIG.AUTH_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.log('[payhero] Non-JSON response:', text);
      data = { raw: text };
    }

    console.log('[payhero] Response status:', response.status);
    console.log('[payhero] Response text:', text);
    console.log('[payhero] Response data:', data);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.error || data.message || `PayHero API error: ${response.status}`,
        status: response.status,
      });
    }

    res.json({
      success: true,
      checkout_request_id: data.request_id || data.checkout_request_id,
      request_id: data.request_id,
      ...data,
    });
  } catch (error) {
    console.error('[payhero] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Status check endpoint
app.get('/api/payhero/status', async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({ error: 'Missing reference parameter' });
    }

    console.log('[payhero] Status check for:', reference);

    // For now, return a stub response
    // In production, this would query a database or call PayHero's status API
    res.json({
      success: false,
      status: 'pending',
      paid: false,
    });
  } catch (error) {
    console.error('[payhero] Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Callback webhook endpoint
app.post('/api/payment-callback', (req, res) => {
  try {
    console.log('[payhero] Callback received:', req.body);
    // Process callback and update payment status
    res.json({ success: true });
  } catch (error) {
    console.error('[payhero] Callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4100;
app.listen(PORT, () => {
  console.log(`[payhero] Server running on port ${PORT}`);
});
