// Debug function to list all files in the api/payhero directory
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[api/payhero/list] invoked - this function exists');
    return res.status(200).json({ ok: true, message: 'List function works' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
