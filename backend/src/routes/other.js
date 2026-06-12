const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { ws }  = require('../websocket');

// ══════════════════════════════════════════
//  ENEMIES
// ══════════════════════════════════════════
const enemyRouter = express.Router();

enemyRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM enemies ORDER BY last_seen DESC');
    res.json(rows.map(enemyOut));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

enemyRouter.post('/', async (req, res) => {
  try {
    const { id, latitude, longitude, strength, type, confirmed } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO enemies (id, latitude, longitude, strength, type, confirmed)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET
         latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude,
         strength=EXCLUDED.strength, type=EXCLUDED.type,
         confirmed=EXCLUDED.confirmed, last_seen=NOW()
       RETURNING *`,
      [id, latitude, longitude, strength || 0, type, confirmed || false]
    );
    const enemy = enemyOut(rows[0]);
    ws.enemyUpdate(enemy);
    res.status(201).json(enemy);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

enemyRouter.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM enemies WHERE id = $1', [req.params.id]);
    res.json({ deleted: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function enemyOut(row) {
  return {
    id:        row.id,
    latitude:  parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    strength:  row.strength,
    type:      row.type,
    confirmed: row.confirmed,
    lastSeen:  row.last_seen,
  };
}

// ══════════════════════════════════════════
//  WAR SITUATION  (single row, always id=1)
// ══════════════════════════════════════════
const situationRouter = express.Router();

situationRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM war_situation ORDER BY id DESC LIMIT 1');
    if (!rows.length) return res.status(404).json({ error: 'No situation data' });
    res.json(sitOut(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

situationRouter.put('/', async (req, res) => {
  try {
    const { phase, territory_control_pct, kia_today, wia_today, missions_completed, missions_total, threat_level } = req.body;
    const { rows } = await pool.query(
      `UPDATE war_situation SET
         phase = COALESCE($1, phase),
         territory_control_pct = COALESCE($2, territory_control_pct),
         kia_today = COALESCE($3, kia_today),
         wia_today = COALESCE($4, wia_today),
         missions_completed = COALESCE($5, missions_completed),
         missions_total = COALESCE($6, missions_total),
         threat_level = COALESCE($7, threat_level),
         updated_at = NOW()
       WHERE id = (SELECT MIN(id) FROM war_situation)
       RETURNING *`,
      [phase, territory_control_pct, kia_today, wia_today, missions_completed, missions_total, threat_level]
    );
    const sit = sitOut(rows[0]);
    ws.situationUpdate(sit);
    res.json(sit);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function sitOut(row) {
  return {
    phase:               row.phase,
    territoryControlPct: row.territory_control_pct,
    kiaToday:            row.kia_today,
    wiaToday:            row.wia_today,
    missionsCompleted:   row.missions_completed,
    missionsTotal:       row.missions_total,
    threatLevel:         row.threat_level,
  };
}

// ══════════════════════════════════════════
//  MISSIONS
// ══════════════════════════════════════════
const missionsRouter = express.Router();

missionsRouter.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM missions';
    const vals = [];
    if (status) { query += ' WHERE status = $1'; vals.push(status); }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, vals);
    res.json(rows.map(missionOut));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

missionsRouter.post('/', async (req, res) => {
  try {
    const { name, sector, status, type, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO missions (name, sector, status, type, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, sector, status || 'pending', type, notes]
    );
    const m = missionOut(rows[0]);
    ws.missionUpdate(m);
    res.status(201).json(m);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

missionsRouter.patch('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const end_time = status === 'completed' || status === 'failed' ? new Date() : null;
    const { rows } = await pool.query(
      `UPDATE missions SET
         status = COALESCE($1, status),
         notes  = COALESCE($2, notes),
         end_time = COALESCE($3, end_time)
       WHERE id = $4 RETURNING *`,
      [status, notes, end_time, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Mission not found' });
    const m = missionOut(rows[0]);
    ws.missionUpdate(m);
    res.json(m);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function missionOut(row) {
  return {
    id:        row.id,
    name:      row.name,
    sector:    row.sector,
    status:    row.status,
    type:      row.type,
    startTime: row.start_time,
    endTime:   row.end_time,
    notes:     row.notes,
  };
}

// ══════════════════════════════════════════
//  COMMANDS
// ══════════════════════════════════════════
const commandsRouter = express.Router();

commandsRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM commands ORDER BY issued_at DESC LIMIT 100');
    res.json(rows.map(cmdOut));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

commandsRouter.post('/', async (req, res) => {
  try {
    const { type, sector, troop_type, count, issued_by, notes } = req.body;
    if (!type || !sector) return res.status(400).json({ error: 'type and sector required' });

    const { rows } = await pool.query(
      `INSERT INTO commands (type, sector, troop_type, count, issued_by, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,'acknowledged') RETURNING *`,
      [type, sector, troop_type, count, issued_by || 'CMD-1', notes]
    );
    const cmd = cmdOut(rows[0]);
    ws.commandUpdate(cmd);
    res.status(201).json(cmd);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function cmdOut(row) {
  return {
    id:        row.id,
    type:      row.type,
    sector:    row.sector,
    troopType: row.troop_type,
    count:     row.count,
    issuedBy:  row.issued_by,
    status:    row.status,
    notes:     row.notes,
    issuedAt:  row.issued_at,
  };
}

module.exports = { enemyRouter, situationRouter, missionsRouter, commandsRouter };
