/**
 * Run once to set up all tables:
 *   node src/db/init.js
 */
const fs   = require('fs');
const path = require('path');
const pool = require('./index');

async function init() {
  console.log('[DB] Running schema...');
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('[DB] ✓ All tables created successfully');
  } catch (err) {
    console.error('[DB] Schema error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

init();
