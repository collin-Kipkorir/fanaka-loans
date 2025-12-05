// Simple Vercel test function to confirm API routing
module.exports = (req, res) => {
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host || '';
  const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : '';
  console.log('[api/ok] origin=', origin, 'req.url=', req.url, 'host=', req.headers.host);
  res.status(200).json({ ok: true, origin, url: req.url });
};