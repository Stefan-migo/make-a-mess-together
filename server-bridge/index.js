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
const ZOMBIE_TIMEOUT = 15000;     // 15s no-data = zombie
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

const httpServer = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      uptime: process.uptime(),
      devices: allocator.activeCount,
      players: players.size
    }));
    return;
  }

  // Serve static files from public/
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback to index.html for SPA-like routing
        fs.readFile(path.join(__dirname, 'public', 'index.html'), (err2, content2) => {
          if (err2) {
            res.writeHead(500);
            res.end('Internal Server Error');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content2);
        });
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

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
      handleSensorMessage(ws, connInfo, msg);
    } else if (connInfo.role === 'player') {
      // Players don't send messages (except ping, handled as no-op)
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

  // Relay each sensor type to all players
  broadcastToPlayers(relay.formatSensorMessage(slot, 'accel', msg.accel), ws);
  broadcastToPlayers(relay.formatSensorMessage(slot, 'gyro', msg.gyro), ws);
  broadcastToPlayers(relay.formatSensorMessage(slot, 'orientation', msg.orientation), ws);
}

// ---------------------------------------------------------------------------
// Heartbeat — Periodic ping + zombie detection
// ---------------------------------------------------------------------------

const heartbeatTimer = setInterval(() => {
  const now = Date.now();
  const deadConns = [];

  for (const [ws, info] of connections) {
    if (ws.readyState !== 1) { // WebSocket.OPEN
      deadConns.push(ws);
      continue;
    }

    // Check for zombies (no data in ZOMBIE_TIMEOUT)
    if (now - info.lastSeen > ZOMBIE_TIMEOUT) {
      console.log(`[zombie] Closing zombie connection #${info.id} (slot ${info.slot}, role: ${info.role})`);
      ws.close(4002, 'Zombie timeout');
      deadConns.push(ws);
      continue;
    }

    // Send ping
    try {
      ws.ping();
    } catch (e) {
      deadConns.push(ws);
    }
  }

  // Clean up dead connections (close event handler handles the rest)
  for (const dead of deadConns) {
    connections.delete(dead);
    players.delete(dead);
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
