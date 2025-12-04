// ...existing code from health.js...
// Health check endpoint for PayHero API proxy
module.exports = async (req, res) => {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		return res.status(405).json({ error: 'Method not allowed' });
	}
	return res.status(200).json({ ok: true, message: 'PayHero API proxy is healthy' });
};
