// Vercel Serverless function: /api/payment-callback
// Receives webhook callbacks from PayHero for payment status updates

export default async function handler(req, res) {
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

  try {
    console.log('[api/payment-callback] Callback received:', req.body);
    
    // Process callback and update payment status
    // You can add your database update logic here
    
    // Return success to PayHero
    return res.status(200).json({ success: true, message: 'Callback received' });
  } catch (error) {
    console.error('[api/payment-callback] Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
