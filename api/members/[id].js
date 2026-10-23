const db = require('../../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const id = parseInt(req.query.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid member id.' });
  try {
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      if (!db.STATUSES.includes(body.status)) {
        return res.status(400).json({ error: `Status must be one of: ${db.STATUSES.join(', ')}.` });
      }
      const member = await db.setStatus(id, body.status);
      if (!member) return res.status(404).json({ error: 'Member not found.' });
      return res.status(200).json({ member });
    }
    if (req.method === 'DELETE') {
      const ok = await db.remove(id);
      if (!ok) return res.status(404).json({ error: 'Member not found.' });
      return res.status(200).json({ deleted: id });
    }
    res.setHeader('Allow', 'PATCH, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error. Check the database connection.' });
  }
};
