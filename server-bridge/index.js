#!/usr/bin/env node

/**
 * phone-sensor-orchestra — Bridge Server
 * 
 * HTTP + WebSocket server on port 8080.
 * Accepts phone sensor connections and p5 player connections.
 * Allocates slots (0-29), relays sensor data to players.
 * 
 * Usage:
 *   node server-bridge/index.js
 * 
 * Spec: .specify/specs/01-bridge-server.md
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');
const { SlotAllocator } = require('./slot-allocator');
const { MessageRelay } = require('./message-relay');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT, 10) || 8080;
const HEARTBEAT_INTERVAL = 10000;  // 10s ping interval
const ZOMBIE_TIMEOUT = 30000;     // 30s no-data = zombie
const COOLDOWN_MS = 5000;         // 5s slot cooldown

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const allocator = new SlotAllocator(30, COOLDOWN_MS);
const relay = new MessageRelay();

// Map of ws connection -> connection info
const connections = new Map();  // WebSocket -> { role, slot, type, lastSeen }

// Set of player WebSocket connections (p5 sketches)
const players = new Set();      // WebSocket (player role only)

// Counter for connection IDs
let connectionIdCounter = 0;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Get the LAN IP address of this machine.
 */
function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

/**
 * Broadcast a JSON message to all connected p5 players.
 * @param {object} msg - Message to broadcast (will be JSON.stringify'd)
 * @param {WebSocket} exclude - Optional WS to exclude (the sender)
 */
function broadcastToPlayers(msg, exclude = null) {
  const data = JSON.stringify(msg);
  const deadPlayers = [];

  for (const player of players) {
    if (player === exclude) continue;
    if (player.readyState !== 1) { // WebSocket.OPEN
      deadPlayers.push(player);
      continue;
    }
    // Backpressure guard: if buffer is full, skip
    if (player.bufferedAmount > 1024 * 64) { // 64KB buffer limit
      continue;
    }
    try {
      player.send(data);
    } catch (e) {
      deadPlayers.push(player);
    }
  }

  // Clean up dead player connections
  for (const dead of deadPlayers) {
    players.delete(dead);
    connections.delete(dead);
  }
}

/**
 * Send a message to all players with current state.
 */
function broadcastState() {
  const devices = [];
  for (const [ws, info] of connections) {
    if (info.role === 'sensor') {
      devices.push({
        slot: info.slot,
        label: `Phone ${info.slot}`,
        type: info.type || 'sensor'
      });
    }
  }

  broadcastToPlayers({
    type: 'system',
    event: 'state',
    deviceCount: allocator.activeCount,
    playerCount: players.size,
    devices
  });
}

/**
 * Get the connected sensor info for a slot.
 */
function getSensorForSlot(slot) {
  for (const [ws, info] of connections) {
    if (info.role === 'sensor' && info.slot === slot) {
      return ws;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// HTTP Server
// ---------------------------------------------------------------------------

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function handleRequest(req, res) {
  // Bug #3: Wrap URL parsing in try-catch to prevent crash on malformed headers
  let pathname;
  try {
    pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }

  // Health check endpoint
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      uptime: process.uptime(),
      devices: allocator.activeCount,
      players: players.size
    }));
    return;
  }

  // Serve static files
  let filePath;
  // Bug #2: Redirect /phone-client to /phone-client/ so relative URLs (CSS/JS) resolve correctly
  if (pathname === '/phone-client') {
    res.writeHead(302, { 'Location': '/phone-client/' });
    res.end();
    return;
  } else if (pathname.startsWith('/phone-client/')) {
    const relative = pathname.replace('/phone-client/', '');
    filePath = path.join(__dirname, '..', 'phone-client', relative || 'index.html');
  } else {
    filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  }
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Bug #1: Return proper 404 instead of silently serving dashboard
        // Bug #4: Log routing failures for debugging
        console.log('[http]', req.method, pathname, '→ 404 (not found:', filePath, ')');
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Not Found</title><style>body{background:#0a0a0a;color:#e5e7eb;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}div{text-align:center}h1{font-size:3rem;margin:0;color:#dc2626}p{color:#6b7280}</style></head><body><div><h1>404</h1><p>Not Found</p></div></body></html>');
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const httpServer = http.createServer(handleRequest);

// ---------------------------------------------------------------------------
// WebSocket Server
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  const connId = ++connectionIdCounter;
  const connInfo = {
    id: connId,
    role: null,        // 'sensor' | 'player' | null
    slot: -1,          // assigned slot (for sensors)
    type: 'pending',   // connection type label
    lastSeen: Date.now(),
    connectedAt: Date.now(),
    messageCount: 0
  };
  connections.set(ws, connInfo);

  // -----------------------------------------------------------------------
  // Message handler — first message determines role
  // -----------------------------------------------------------------------
  ws.on('message', (data) => {
    connInfo.lastSeen = Date.now();

    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      // Invalid JSON — ignore
      return;
    }

    // If role not yet determined, use first message to detect
    if (!connInfo.role) {
      const role = relay.detectRole(msg);
      if (!role) {
        // Unknown role — close connection
        ws.close(4000, 'Unknown connection role');
        return;
      }

      connInfo.role = role;

      if (role === 'sensor') {
        handleSensorConnect(ws, connInfo);
      } else if (role === 'player') {
        handlePlayerConnect(ws, connInfo);
      }
      return;
    }

    // Role already determined — handle based on role
    if (connInfo.role === 'sensor') {
      if (msg.type === 'sensor') {
        handleSensorMessage(ws, connInfo, msg);
      } else if (msg.type === 'config') {
        handleConfigMessage(ws, connInfo, msg);
      }
    } else if (connInfo.role === 'player') {
      // Players don't send messages
    }
  });

  // -----------------------------------------------------------------------
  // Disconnect handler
  // -----------------------------------------------------------------------
  ws.on('close', () => {
    const info = connections.get(ws);
    if (!info) return;

    if (info.role === 'sensor' && info.slot >= 0) {
      // Free the slot with cooldown
      allocator.free(info.slot);
      allocator.startCooldown(info.slot);

      // Broadcast disconnect to players
      broadcastToPlayers(relay.formatDisconnectMessage(info.slot));
      broadcastToPlayers(relay.formatCountMessage(allocator.activeCount));

      console.log(`[disconnect] Slot ${info.slot} freed (device #${info.id})`);
    }

    if (info.role === 'player') {
      players.delete(ws);
      console.log(`[disconnect] Player #${info.id} disconnected`);
    }

    connections.delete(ws);
    broadcastState();
  });

  // -----------------------------------------------------------------------
  // Error handler
  // -----------------------------------------------------------------------
  ws.on('error', () => {
    // Error already triggers close
  });

  // -----------------------------------------------------------------------
  // Send initial message to identify as bridge
  // -----------------------------------------------------------------------
  ws.send(JSON.stringify({
    type: 'system',
    event: 'hello',
    version: 1,
    server: 'phone-sensor-orchestra-bridge'
  }));
});

// ---------------------------------------------------------------------------
// Sensor Connection Handling
// ---------------------------------------------------------------------------

function handleSensorConnect(ws, info) {
  const slot = allocator.allocate();
  if (slot === -1) {
    ws.close(4001, 'All slots are full');
    console.log('[connect] All 30 slots full — rejected');
    return;
  }

  info.slot = slot;
  info.type = 'sensor';

  // Send assigned message back to phone
  const assignMsg = {
    type: 'assigned',
    slot: slot,
    bridgeIp: getLanIp()
  };
  ws.send(JSON.stringify(assignMsg));

  // Broadcast to all players
  broadcastToPlayers(relay.formatAssignMessage(slot));
  broadcastToPlayers(relay.formatCountMessage(allocator.activeCount));

  console.log(`[connect] Sensor #${info.id} assigned slot ${slot}`);

  // Broadcast updated state
  broadcastState();
}

// ---------------------------------------------------------------------------
// Player Connection Handling
// ---------------------------------------------------------------------------

function handlePlayerConnect(ws, info) {
  info.type = 'player';
  players.add(ws);

  // Send current state to the new player
  const devices = [];
  for (const [conn, connInfo] of connections) {
    if (connInfo.role === 'sensor') {
      devices.push({
        slot: connInfo.slot,
        label: `Phone ${connInfo.slot}`
      });
    }
  }

  // Send initial state
  ws.send(JSON.stringify({
    type: 'system',
    event: 'state',
    deviceCount: allocator.activeCount,
    playerCount: players.size,
    devices
  }));

  // Also send current count
  ws.send(JSON.stringify(relay.formatCountMessage(allocator.activeCount)));

  console.log(`[connect] Player #${info.id} connected (${players.size} total players)`);
}

// ---------------------------------------------------------------------------
// Sensor Message Handling
// ---------------------------------------------------------------------------

function handleSensorMessage(ws, info, msg) {
  info.messageCount++;

  // Validate the sensor message
  const validation = relay.validateSensorMessage(msg);
  if (!validation.valid) {
    // Silently ignore invalid messages (phone might send malformed data)
    return;
  }

  const slot = info.slot;

  // Send ONE combined message instead of 3 separate messages
  // Reduces message count from 2700/sec (30 phones × 30fps × 3) to 900/sec
  broadcastToPlayers(
    relay.formatSensorBatchMessage(slot, msg.accel, msg.gyro, msg.orientation),
    ws
  );
}

// ---------------------------------------------------------------------------
// Config Message Handling
// ---------------------------------------------------------------------------

function handleConfigMessage(ws, info, msg) {
  const config = {};
  if (msg.brush) config.brush = msg.brush;
  if (msg.color) config.color = { ...msg.color };
  if (msg.pressureCurve) config.pressureCurve = msg.pressureCurve;
  if (msg.penDown !== undefined) config.penDown = msg.penDown;
  if (Object.keys(config).length === 0) return;
  broadcastToPlayers(relay.formatConfigMessage(info.slot, config));
  console.log(`[config] Slot ${info.slot}:`, JSON.stringify(config));
}

// ---------------------------------------------------------------------------
// Heartbeat — Periodic ping + zombie detection
// ---------------------------------------------------------------------------

const heartbeatTimer = setInterval(() => {
  const now = Date.now();

  for (const [ws, info] of connections) {
    // Non-open connections: force-close so the close event handler
    // runs proper cleanup (slot free, disconnect broadcast).
    if (ws.readyState !== 1) {
      ws.terminate();
      continue;
    }

    // Skip zombie check for players — they're receive-only after initial message
    if (info.role === 'player') continue;

    // Check for zombies (no data in ZOMBIE_TIMEOUT)
    if (now - info.lastSeen > ZOMBIE_TIMEOUT) {
      console.log(`[zombie] Closing zombie connection #${info.id} (slot ${info.slot}, role: ${info.role})`);
      ws.close(4002, 'Zombie timeout');
      continue;
    }

    // Send ping — failure means the socket is gone
    try {
      ws.ping();
    } catch (e) {
      ws.terminate();
    }
  }
}, HEARTBEAT_INTERVAL);

// Allow process to exit even if heartbeat timer is running
heartbeatTimer.unref();

// ---------------------------------------------------------------------------
// State broadcast timer — periodically notify players of device list
// ---------------------------------------------------------------------------

const stateTimer = setInterval(() => {
  broadcastState();
}, 5000); // Every 5 seconds
stateTimer.unref();

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

if (require.main === module) {
  httpServer.listen(PORT, () => {
    const ip = getLanIp();
    console.log();
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║         phone-sensor-orchestra Bridge               ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  WebSocket : ${String(PORT).padEnd(42)}║`);
    console.log(`║  LAN IP    : ${(ip + ':' + PORT).padEnd(42)}║`);
    const dashboardUrl = `http://${ip}:${PORT}`;
    console.log(`║  Dashboard : ${dashboardUrl.padEnd(42)}║`);
    console.log('║                                                    ║');
    console.log(`║  Max slots : ${String(30).padEnd(42)}║`);
    console.log(`║  Heartbeat : ${String(HEARTBEAT_INTERVAL / 1000) + 's interval'.padEnd(35)}║`);
    console.log(`║  Zombie    : ${String(ZOMBIE_TIMEOUT / 1000) + 's timeout'.padEnd(35)}║`);
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log();
    console.log(`Bridge at ws://${ip}:${PORT}`);
    console.log(`Discovery page at http://${ip}:${PORT}`);
    console.log();
  });
}

module.exports = { handleRequest, httpServer };

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

function shutdown() {
  console.log('\nShutting down...');

  // Close all WebSocket connections
  for (const [ws] of connections) {
    ws.close(4001, 'Server shutting down');
  }
  connections.clear();
  players.clear();

  // Clean up allocator
  allocator.destroy();

  // Close server
  wss.close();
  httpServer.close(() => {
    process.exit(0);
  });

  // Force exit after 3 seconds
  setTimeout(() => process.exit(1), 3000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
