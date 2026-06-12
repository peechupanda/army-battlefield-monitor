const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { ws }  = require('../websocket');

// GET /api/alerts?level=critical&acknowledged=false&limit=50
router.get('/', async (req, res) => {
  try {
    const { level, acknowledged, sector, limit = 50 } = req.query;
    let query = 'SELECT * FROM alerts';
    const vals = [], where = [];

    if (level)        { where.push(`level = $${vals.length+1}`);        vals.push(level); }
    if (sector)       { where.push(`sector = $${vals.length+1}`);       vals.push(sector); }
    if (acknowledged !== undefined) {
      where.push(`acknowledged = $${vals.length+1}`);
      vals.push(acknowledged === 'true');
    }
    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ` ORDER BY timestamp DESC LIMIT $${vals.length+1}`;
    vals.push(parseInt(limit));

    const { rows } = await pool.query(query, vals);
    res.json(rows.map(alertOut));
  } catch (err) {
    console.error('[alerts] GET /', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts — create new alert
router.post('/', async (req, res) => {
  try {
    const { level, message, sector, source } = req.body;
    if (!level || !message) return res.status(400).json({ error: 'level and message required' });

    const { rows } = await pool.query(
      `INSERT INTO alerts (level, message, sector, source)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [level, message, sector || null, source || 'SYSTEM']
    );
    const alert = alertOut(rows[0]);
    ws.alert(alert);   // push to all connected Angular clients
    res.status(201).json(alert);
  } catch (err) {
    console.error('[alerts] POST /', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id/acknowledge
router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE alerts SET acknowledged = TRUE WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Alert not found' });
    res.json(alertOut(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM alerts WHERE id = $1', [req.params.id]);
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function alertOut(row) {
  return {
    id:           row.id,
    level:        row.level,
    message:      row.message,
    sector:       row.sector,
    source:       row.source,
    acknowledged: row.acknowledged,
    timestamp:    row.timestamp,
  };
}

module.exports = router;
