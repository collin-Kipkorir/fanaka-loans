// Lightweight test function to verify serverless invocation in production
module.exports = async (req, res) => {
  try {
    return res.status(200).json({ ok: true, time: new Date().toISOString() });
  } catch (err) {
    console.error('[api/payhero/ping] error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
