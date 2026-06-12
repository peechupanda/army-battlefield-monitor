const { Pool } = require('pg');
require('dotenv').config();

// Railway automatically provides DATABASE_URL
// Locally use individual DB_* variables from .env
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },  // required for Railway/Render
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME     || 'army_bfms',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || '',
      }
);

pool.on('connect', () => console.log('[DB] PostgreSQL connected'));
pool.on('error',  (err) => console.error('[DB] Pool error:', err.message));

module.exports = pool;
