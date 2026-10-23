const db = require('../../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      return res.status(200).json({ members: await db.list(), persistent: db.persistent });
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const name = String(body.name || '').trim().slice(0, 60);
      const role = String(body.role || '').trim().slice(0, 60);
      const timezone = String(body.timezone || 'UTC');
      if (!name) return res.status(400).json({ error: 'Name is required.' });
      if (!db.validTimezone(timezone)) return res.status(400).json({ error: 'Unknown timezone.' });
      return res.status(201).json({ member: await db.add(name, role, timezone) });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error. Check the database connection.' });
  }
};
