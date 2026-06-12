const { WebSocketServer } = require('ws');

let wss = null;

/**
 * Attach WebSocket server to existing HTTP server.
 * All Angular clients connect here for live updates.
 */
function initWebSocket(httpServer) {
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws, req) => {
    console.log(`[WS] Client connected — total: ${wss.clients.size}`);

    // Keep connection alive
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        console.log('[WS] Message from client:', msg.type);
      } catch (e) {
        console.warn('[WS] Invalid message:', data);
      }
    });

    ws.on('close', () => {
      console.log(`[WS] Client disconnected — total: ${wss.clients.size}`);
    });

    ws.on('error', (err) => console.error('[WS] Socket error:', err.message));

    // Send a welcome ping so the client knows it's live
    safeSend(ws, { type: 'CONNECTED', payload: { message: 'BFMS live feed active' } });
  });

  // Heartbeat — drop dead connections every 30s
  const interval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, parseInt(process.env.WS_PING_INTERVAL) || 30000);

  wss.on('close', () => clearInterval(interval));

  console.log('[WS] WebSocket server ready');
  return wss;
}

/** Send a message to one client safely */
function safeSend(ws, data) {
  if (ws.readyState === 1) { // OPEN
    ws.send(JSON.stringify(data));
  }
}

/** Broadcast to ALL connected clients */
function broadcast(type, payload) {
  if (!wss) return;
  const msg = JSON.stringify({ type, payload });
  let sent = 0;
  wss.clients.forEach(ws => {
    if (ws.readyState === 1) {
      ws.send(msg);
      sent++;
    }
  });
  if (sent > 0) console.log(`[WS] Broadcast ${type} → ${sent} clients`);
}

/** Broadcast helpers used by route handlers */
const ws = {
  troopUpdate:     (troop)    => broadcast('TROOP_UPDATE',     troop),
  alert:           (alert)    => broadcast('ALERT',            alert),
  enemyUpdate:     (enemy)    => broadcast('ENEMY_UPDATE',     enemy),
  situationUpdate: (sit)      => broadcast('SITUATION_UPDATE', sit),
  commandUpdate:   (cmd)      => broadcast('COMMAND_UPDATE',   cmd),
  missionUpdate:   (mission)  => broadcast('MISSION_UPDATE',   mission),
};

module.exports = { initWebSocket, broadcast, ws };
