require('dotenv').config();

const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const troopsRouter = require('./src/routes/troops');
const alertsRouter = require('./src/routes/alerts');
const { enemyRouter, situationRouter, missionsRouter, commandsRouter } = require('./src/routes/other');
const { initWebSocket } = require('./src/websocket');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 3000;

// ── CORS — allow GitHub Pages + localhost ──────────────
const allowedOrigins = [
  'http://localhost:4200',
  'https://peechupanda.github.io',
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health check ──────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ── API Routes ────────────────────────────────────────
app.use('/api/troops',    troopsRouter);
app.use('/api/alerts',    alertsRouter);
app.use('/api/enemies',   enemyRouter);
app.use('/api/situation', situationRouter);
app.use('/api/missions',  missionsRouter);
app.use('/api/commands',  commandsRouter);

// ── 404 ───────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Not found: ${req.method} ${req.path}` }));

// ── Error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('  ⚔  BFMS BACKEND — LIVE');
  console.log('  ──────────────────────────────────');
  console.log(`  REST API  →  http://localhost:${PORT}/api`);
  console.log(`  WebSocket →  ws://localhost:${PORT}`);
  console.log(`  Health    →  http://localhost:${PORT}/health`);
  console.log('  ──────────────────────────────────');
});

initWebSocket(server);
