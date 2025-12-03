// Simple Vercel serverless health-check for PayHero env vars
// Returns boolean presence for each required env var (does NOT return secrets)

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const envPresence = {
      PAYHERO_BASE_URL: !!process.env.PAYHERO_BASE_URL,
      PAYHERO_AUTH_TOKEN: !!process.env.PAYHERO_AUTH_TOKEN,
      PAYHERO_CHANNEL_ID: !!process.env.PAYHERO_CHANNEL_ID,
      PAYHERO_CALLBACK_URL: !!process.env.PAYHERO_CALLBACK_URL,
    };

    // Helpful debug log (safe: shows booleans only)
    console.log('[api/payhero/health] env presence:', envPresence);

    return res.status(200).json({ ok: true, env: envPresence });
  } catch (err) {
    console.error('[api/payhero/health] error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}
