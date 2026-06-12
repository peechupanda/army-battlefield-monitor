const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { ws }  = require('../websocket');

// ── GET all troops (with optional filters) ────────────
// GET /api/troops?status=active&sector=Alpha
router.get('/', async (req, res) => {
  try {
    const { status, sector } = req.query;
    let query  = 'SELECT * FROM troops';
    const vals = [];
    const where = [];

    if (status) { where.push(`status = $${vals.length + 1}`); vals.push(status); }
    if (sector) { where.push(`sector = $${vals.length + 1}`); vals.push(sector); }
    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY id ASC';

    const { rows } = await pool.query(query, vals);
    res.json(rows.map(troopOut));
  } catch (err) {
    console.error('[troops] GET /', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET single troop ──────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM troops WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Troop not found' });
    res.json(troopOut(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST create troop ─────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { id, name, rank, unit, status, sector, latitude, longitude, age, blood_group, contact, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO troops (id, name, rank, unit, status, sector, latitude, longitude, age, blood_group, contact, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [id, name, rank, unit, status || 'active', sector, latitude || 0, longitude || 0, age, blood_group, contact, notes]
    );
    const troop = troopOut(rows[0]);
    ws.troopUpdate(troop);
    res.status(201).json(troop);
  } catch (err) {
    console.error('[troops] POST /', err);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH update troop (status, position, etc.) ───────
router.patch('/:id', async (req, res) => {
  try {
    const fields   = ['status','sector','latitude','longitude','rank','unit','notes'];
    const updates  = [];
    const vals     = [];

    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        vals.push(req.body[f]);
        updates.push(`${f} = $${vals.length}`);
      }
    });

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    vals.push(new Date());
    updates.push(`last_updated = $${vals.length}`);
    vals.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE troops SET ${updates.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Troop not found' });
    const troop = troopOut(rows[0]);
    ws.troopUpdate(troop);   // push update to all Angular clients
    res.json(troop);
  } catch (err) {
    console.error('[troops] PATCH /:id', err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE troop ──────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM troops WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Troop not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET troop stats summary ───────────────────────────
router.get('/stats/summary', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                      AS total,
        COUNT(*) FILTER (WHERE status = 'active')    AS active,
        COUNT(*) FILTER (WHERE status = 'injured')   AS injured,
        COUNT(*) FILTER (WHERE status = 'reserve')   AS reserve,
        sector
      FROM troops
      GROUP BY sector
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// map snake_case DB columns → camelCase for Angular
function troopOut(row) {
  return {
    id:          row.id,
    name:        row.name,
    rank:        row.rank,
    unit:        row.unit,
    status:      row.status,
    sector:      row.sector,
    latitude:    parseFloat(row.latitude),
    longitude:   parseFloat(row.longitude),
    age:         row.age,
    bloodGroup:  row.blood_group,
    contact:     row.contact,
    notes:       row.notes,
    lastUpdated: row.last_updated,
  };
}

module.exports = router;
