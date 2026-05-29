#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { WebSocketServer } = require('ws');
const { SlotAllocator } = require('./slot-allocator');
const { MessageRelay } = require('./message-relay');
const { OscSender } = require('./osc-sender');
const { MidiSender } = require('./midi-sender');
const { MidiMapper } = require('./midi-mapper');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT, 10) || 8080;
const HEARTBEAT_INTERVAL = 10000;  // 10s ping interval
const ZOMBIE_TIMEOUT = 30000;     // 30s no-data = zombie
const COOLDOWN_MS = 5000;         // 5s slot cooldown

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

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

function parseDawArg() {
  const idx = process.argv.indexOf('--daw');
  if (idx === -1) return null;
  const val = process.argv[idx + 1];
  if (!val || val.startsWith('--')) return '127.0.0.1:9000';
  return val;
}

function parseMidiArg() {
  return process.argv.indexOf('--midi') !== -1;
}

function parseMidiOption(name, defaultValue) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return defaultValue;
  const val = process.argv[idx + 1];
  return val || defaultValue;
}

// ---------------------------------------------------------------------------
// Bridge Factory
// ---------------------------------------------------------------------------

function createBridge(options = {}) {
  const allocator = new SlotAllocator(30, COOLDOWN_MS);
  const relay = new MessageRelay();
  const connections = new Map();
  const players = new Set();
  let connectionIdCounter = 0;

  const POOL_CONFIGS = {
    chordspace: { channels: [1, 2, 3, 4, 5, 6], max: 6 },
    drums: { channels: [7, 8], max: 2 },
    gesturecanvas: { channels: [9, 10], max: 2 }
  };
  const VALID_MODES = Object.keys(POOL_CONFIGS);

  // -----------------------------------------------------------------------
  // OscSender (DAW integration)
  // -----------------------------------------------------------------------

  let oscSender = null;
  if (options.daw) {
    const [host, portStr] = String(options.daw).split(':');
    const port = parseInt(portStr, 10) || 9000;
    oscSender = new OscSender(host, port);
  }

  // -----------------------------------------------------------------------
  // MidiSender (MIDI integration)
  // -----------------------------------------------------------------------

  let midiSender = null;
  let midiMapper = null;
  if (options.midi) {
    midiSender = new MidiSender();
    midiMapper = new MidiMapper();

    if (options.midiKey) midiMapper.setGlobalConfig({ key: options.midiKey });
    if (options.midiOctave !== undefined) midiMapper.setGlobalConfig({ octave: options.midiOctave });

    _connectMidiToReaper();
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  function _connectMidiToReaper() {
    exec('which pw-link', (err) => {
      if (err) {
        console.log('[MIDI] pw-link not found — skip automatic connection');
        return;
      }
      const source = 'Midi-Bridge:RtMidi Output Clientphone-sensor-orchestra (capture)';
      const target = 'REAPER:MIDI Input 1';
      exec(`pw-link "${source}" "${target}"`, (linkErr) => {
        if (linkErr) {
          const msg = linkErr.message.split('\n')[0].trim();
          console.log(`[MIDI] pw-link: ${msg}`);
          return;
        }
        console.log('[MIDI] Connected to REAPER via pw-link');
      });
    });
  }

  function _assignChannel(slot, mode) {
    const pool = POOL_CONFIGS[mode];
    if (!pool) throw new Error(`Unknown mode: ${mode}`);
    let occupied = 0;
    for (const [, info] of connections) {
      if (info.role === 'sensor' && info.mode === mode && info.slot !== slot) {
        occupied++;
      }
    }
    const index = occupied % pool.channels.length;
    return pool.channels[index];
  }

  function _generateMusicalState(slot, mode, sensorData, events) {
    const base = { type: 'musicalState', slot, mode };

    if (mode === 'chordspace') {
      const noteOn = events.find(e => e.type === 'noteon');
      const noteOff = events.find(e => e.type === 'noteoff');
      const cc11 = events.find(e => e.type === 'cc' && e.cc === 11);
      const cc1 = events.find(e => e.type === 'cc' && e.cc === 1);
      return {
        ...base,
        noteNumber: noteOn?.note ?? noteOff?.note ?? 0,
        velocity: noteOn?.velocity ?? 0,
        gateOpen: !noteOff && !!noteOn,
        volume: cc11?.value ?? 64,
        filterCutoff: cc1?.value ?? 64
      };
    }

    if (mode === 'drums') {
      const noteOn = events.find(e => e.type === 'noteon');
      const cc4 = events.find(e => e.type === 'cc' && e.cc === 4);
      const lastHitNames = { 36: 'kick', 38: 'snare', 49: 'crash', 47: 'tom_low', 48: 'tom_mid', 50: 'tom_high' };
      const lastNote = noteOn?.note ?? 0;
      return {
        ...base,
        lastHit: lastHitNames[lastNote] || 'none',
        lastNote,
        velocity: noteOn?.velocity ?? 0,
        hiHatOpen: cc4?.value ?? 0
      };
    }

    if (mode === 'gesturecanvas') {
      const cc1 = events.find(e => e.type === 'cc' && e.cc === 1);
      const cc10 = events.find(e => e.type === 'cc' && e.cc === 10);
      const cc91 = events.find(e => e.type === 'cc' && e.cc === 91);
      const cc71 = events.find(e => e.type === 'cc' && e.cc === 71);
      const cc7 = events.find(e => e.type === 'cc' && e.cc === 7);
      return {
        ...base,
        speed: cc1?.value ?? 0,
        direction: cc10?.value ?? 64,
        size: cc91?.value ?? 0,
        complexity: cc71?.value ?? 0,
        scene: cc7 ? Math.floor(cc7.value / 42) : 0
      };
    }

    return base;
  }

  function _handleModeChange(ws, info, msg) {
    const mode = msg.mode;
    if (!VALID_MODES.includes(mode)) {
      try {
        ws.send(JSON.stringify({ type: 'error', message: `Unknown mode: ${mode}` }));
      } catch (_) {}
      return;
    }

    if (midiSender) {
      for (let ch = 0; ch < 16; ch++) {
        midiSender.allNotesOff(ch);
      }
    }

    info.mode = mode;

    if (midiMapper) {
      midiMapper.setSlotConfig(info.slot, { mode });
    }

    try {
      ws.send(JSON.stringify({ type: 'modeChanged', mode, channel: _assignChannel(info.slot, mode) }));
    } catch (_) {}

    broadcastState();
    console.log(`[modeChange] Slot ${info.slot} → ${mode}`);
  }

  function broadcastToPlayers(msg, exclude = null) {
    const data = JSON.stringify(msg);
    const deadPlayers = [];

    for (const player of players) {
      if (player === exclude) continue;
      if (player.readyState !== 1) {
        deadPlayers.push(player);
        continue;
      }
      if (player.bufferedAmount > 1024 * 64) {
        continue;
      }
      try {
        player.send(data);
      } catch (e) {
        deadPlayers.push(player);
      }
    }

    for (const dead of deadPlayers) {
      players.delete(dead);
      connections.delete(dead);
    }
  }

  function broadcastState() {
    const devices = [];
    for (const [ws, info] of connections) {
      if (info.role === 'sensor') {
        devices.push({
          slot: info.slot,
          label: `Phone ${info.slot}`,
          type: info.type || 'sensor',
          mode: info.mode || 'chordspace'
        });
      }
    }

    broadcastToPlayers({
      type: 'system',
      event: 'state',
      deviceCount: allocator.activeCount,
      playerCount: players.size,
      midiActive: midiSender !== null,
      devices
    });
  }

  function getSensorForSlot(slot) {
    for (const [ws, info] of connections) {
      if (info.role === 'sensor' && info.slot === slot) {
        return ws;
      }
    }
    return null;
  }

  // -----------------------------------------------------------------------
  // HTTP Request Handler
  // -----------------------------------------------------------------------

  const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  function handleRequest(req, res) {
    let pathname;
    try {
      pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad Request');
      return;
    }

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

    if (pathname === '/api/pools') {
      const pools = {};
      for (const [name, cfg] of Object.entries(POOL_CONFIGS)) {
        let active = 0;
        for (const [, info] of connections) {
          if (info.role === 'sensor' && info.mode === name) active++;
        }
        pools[name] = { active, max: cfg.max, channels: cfg.channels };
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(pools));
      return;
    }

    let filePath;
    if (pathname === '/dashboard') {
      filePath = path.join(__dirname, 'public', 'dashboard.html');
    } else if (pathname === '/phone-client') {
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

  // -----------------------------------------------------------------------
  // Servers
  // -----------------------------------------------------------------------

  const httpServer = http.createServer(handleRequest);
  const wss = new WebSocketServer({ server: httpServer });

  // -----------------------------------------------------------------------
  // Connection Handlers
  // -----------------------------------------------------------------------

  function handleSensorConnect(ws, info) {
    const slot = allocator.allocate();
    if (slot === -1) {
      ws.close(4001, 'All slots are full');
      console.log('[connect] All 30 slots full — rejected');
      return;
    }

    info.slot = slot;
    info.type = 'sensor';

    const assignMsg = {
      type: 'assigned',
      slot: slot,
      bridgeIp: getLanIp()
    };
    ws.send(JSON.stringify(assignMsg));

    broadcastToPlayers(relay.formatAssignMessage(slot));
    broadcastToPlayers(relay.formatCountMessage(allocator.activeCount));

    if (oscSender) {
      oscSender.sendAssign(slot);
      oscSender.sendCount(allocator.activeCount);
    }

    console.log(`[connect] Sensor #${info.id} assigned slot ${slot}`);
    broadcastState();
  }

  function handlePlayerConnect(ws, info) {
    info.type = 'player';
    players.add(ws);

    const devices = [];
    for (const [conn, connInfo] of connections) {
      if (connInfo.role === 'sensor') {
        devices.push({
          slot: connInfo.slot,
          label: `Phone ${connInfo.slot}`
        });
      }
    }

    ws.send(JSON.stringify({
      type: 'system',
      event: 'state',
      deviceCount: allocator.activeCount,
      playerCount: players.size,
      devices
    }));

    ws.send(JSON.stringify(relay.formatCountMessage(allocator.activeCount)));

    console.log(`[connect] Player #${info.id} connected (${players.size} total players)`);
  }

  function handleSensorMessage(ws, info, msg) {
    info.messageCount++;

    const validation = relay.validateSensorMessage(msg);
    if (!validation.valid) {
      return;
    }

    const slot = info.slot;

    broadcastToPlayers(
      relay.formatSensorBatchMessage(slot, msg.accel, msg.gyro, msg.orientation),
      ws
    );

    if (oscSender) {
      oscSender.sendAccel(slot, msg.accel.x, msg.accel.y, msg.accel.z);
      oscSender.sendGyro(slot, msg.gyro.a, msg.gyro.b, msg.gyro.g);
      oscSender.sendOrientation(slot, msg.orientation.a, msg.orientation.b, msg.orientation.g);
    }

    if (midiSender && midiMapper && msg.type === 'sensor') {
      const slotMode = info.mode || 'chordspace';
      const channel = _assignChannel(slot, slotMode);
      midiMapper.setSlotConfig(slot, { mode: slotMode, channel });
      const events = midiMapper.processSensor(slot, msg);
      for (const evt of events) {
        switch (evt.type) {
          case 'noteon':
            midiSender.sendNoteOn(evt.channel, evt.note, evt.velocity);
            break;
          case 'noteoff':
            midiSender.sendNoteOff(evt.channel, evt.note, evt.velocity);
            break;
          case 'cc':
            midiSender.sendCC(evt.channel, evt.cc, evt.value);
            break;
          case 'pitchbend':
            midiSender.sendPitchBend(evt.channel, evt.value);
            break;
        }
      }
      const musicalState = _generateMusicalState(slot, slotMode, msg, events);
      broadcastToPlayers(musicalState);
    }
  }

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

  function handleMidiConfigMessage(ws, info, msg) {
    // Enable MIDI on-the-fly from dashboard
    if (msg.enableMidi === true && !midiSender) {
      try {
        midiSender = new MidiSender();
        midiMapper = new MidiMapper();
        console.log('[midiConfig] MIDI activated on-the-fly via dashboard');
        _connectMidiToReaper();
      } catch (e) {
        console.error('[midiConfig] Failed to activate MIDI:', e.message);
        try { ws.send(JSON.stringify({ type: 'system', event: 'midiStatus', active: false, error: e.message })); } catch (_) {}
        return;
      }
    }

    if (!midiMapper) {
      try { ws.send(JSON.stringify({ type: 'system', event: 'midiStatus', active: false })); } catch (_) {}
      return;
    }

    const config = {};
    if (msg.mode && VALID_MODES.includes(msg.mode)) {
      config.mode = msg.mode;
    }
    if (msg.key && ['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'].includes(msg.key)) {
      config.key = msg.key;
    }
    if (msg.octave !== undefined) config.octave = Math.min(Math.max(Math.round(msg.octave), 1), 7);
    if (msg.bpm !== undefined) config.bpm = Math.min(Math.max(msg.bpm, 20), 300);
    if (msg.noteThreshold !== undefined) config.noteThreshold = Math.min(Math.max(Math.round(msg.noteThreshold), 1), 127);

    if (Object.keys(config).length > 0) {
      midiMapper.setGlobalConfig(config);
      const tag = msg.enableMidi ? 'Activated MIDI with config' : 'Updated';
      console.log('[midiConfig]', tag + ':', JSON.stringify(config));
    }

    // Notify dashboard that MIDI is active with current config
    try {
      ws.send(JSON.stringify({ type: 'system', event: 'midiStatus', active: true }));
    } catch (_) {}
  }

  function handleDisconnect(ws) {
    const info = connections.get(ws);
    if (!info) return;

    if (info.role === 'sensor' && info.slot >= 0) {
      allocator.free(info.slot);
      allocator.startCooldown(info.slot);

      broadcastToPlayers(relay.formatDisconnectMessage(info.slot));
      broadcastToPlayers(relay.formatCountMessage(allocator.activeCount));

      if (oscSender) {
        oscSender.sendDisconnect(info.slot);
        oscSender.sendCount(allocator.activeCount);
      }

      if (midiSender && info.slot >= 0) {
        midiSender.allNotesOff(info.slot & 0x0f);
      }

      console.log(`[disconnect] Slot ${info.slot} freed (device #${info.id})`);
    }

    if (info.role === 'player') {
      players.delete(ws);
      console.log(`[disconnect] Player #${info.id} disconnected`);
    }

    connections.delete(ws);
    broadcastState();
  }

  // -----------------------------------------------------------------------
  // WebSocket Connection Handler
  // -----------------------------------------------------------------------

  wss.on('connection', (ws) => {
    const connId = ++connectionIdCounter;
    const connInfo = {
      id: connId,
      role: null,
      slot: -1,
      type: 'pending',
      lastSeen: Date.now(),
      connectedAt: Date.now(),
      messageCount: 0
    };
    connections.set(ws, connInfo);

    ws.on('message', (data) => {
      connInfo.lastSeen = Date.now();

      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch (e) {
        return;
      }

      if (!connInfo.role) {
        const role = relay.detectRole(msg);
        if (!role) {
          ws.close(4000, 'Unknown connection role');
          return;
        }

        connInfo.role = role;

        if (role === 'sensor') {
          connInfo.mode = msg.mode || 'chordspace';
          handleSensorConnect(ws, connInfo);
        } else if (role === 'player') {
          handlePlayerConnect(ws, connInfo);
        }
        return;
      }

      if (connInfo.role === 'sensor') {
        if (msg.type === 'sensor') {
          handleSensorMessage(ws, connInfo, msg);
        } else if (msg.type === 'config') {
          handleConfigMessage(ws, connInfo, msg);
        } else if (msg.type === 'modeChange') {
          _handleModeChange(ws, connInfo, msg);
        }
      } else if (connInfo.role === 'player' && msg.type === 'midiConfig') {
        handleMidiConfigMessage(ws, connInfo, msg);
      } else if (connInfo.role === 'player' && msg.type === 'playerCommand') {
        if (msg.action === 'mute') {
          const value = !!msg.value;
          broadcastToPlayers({
            type: 'system',
            event: 'mute',
            value: value
          });
          console.log('[playerCommand] Mute ' + (value ? 'ON' : 'OFF') + ' (from dashboard)');
        }
      }
    });

    ws.on('close', () => handleDisconnect(ws));

    ws.on('error', () => {});

    ws.send(JSON.stringify({
      type: 'system',
      event: 'hello',
      version: 1,
      server: 'phone-sensor-orchestra-bridge'
    }));
  });

  // -----------------------------------------------------------------------
  // Heartbeat — Periodic ping + zombie detection
  // -----------------------------------------------------------------------

  const heartbeatTimer = setInterval(() => {
    const now = Date.now();

    for (const [ws, info] of connections) {
      if (ws.readyState !== 1) {
        if (typeof ws.terminate === 'function') ws.terminate();
        continue;
      }

      if (info.role === 'player') continue;

      if (now - info.lastSeen > ZOMBIE_TIMEOUT) {
        console.log(`[zombie] Closing zombie connection #${info.id} (slot ${info.slot}, role: ${info.role})`);
        ws.close(4002, 'Zombie timeout');
        continue;
      }

      try {
        ws.ping();
      } catch (e) {
        ws.terminate();
      }
    }
  }, HEARTBEAT_INTERVAL);

  heartbeatTimer.unref();

  // -----------------------------------------------------------------------
  // State broadcast timer
  // -----------------------------------------------------------------------

  const stateTimer = setInterval(() => {
    broadcastState();
  }, 5000);

  stateTimer.unref();

  // -----------------------------------------------------------------------
  // Return bridge internals
  // -----------------------------------------------------------------------

  return {
    httpServer,
    wss,
    oscSender,
    get midiSender() { return midiSender; },
    get midiMapper() { return midiMapper; },
    allocator,
    relay,
    connections,
    players,
    _handleRequest: handleRequest,
    _handleSensorConnect: handleSensorConnect,
    _handleSensorMessage: handleSensorMessage,
    _handleConfigMessage: handleConfigMessage,
    _handlePlayerConnect: handlePlayerConnect,
    _handleMidiConfigMessage: handleMidiConfigMessage,
    _handleDisconnect: handleDisconnect,
    _connectMidiToReaper,
    _assignChannel,
    _handleModeChange,
    _generateMusicalState
  };
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

if (require.main === module) {
  const dawArg = parseDawArg();
  const midi = parseMidiArg();
  const midiKey = parseMidiOption('--key', 'C');
  const midiOctave = parseInt(parseMidiOption('--octave', '3'), 10);

  const bridge = createBridge({
    daw: dawArg,
    midi,
    midiKey,
    midiOctave
  });

  bridge.httpServer.listen(PORT, () => {
    const ip = getLanIp();
    console.log();
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║         phone-sensor-orchestra Bridge               ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  WebSocket : ${String(PORT).padEnd(42)}║`);
    console.log(`║  LAN IP    : ${(ip + ':' + PORT).padEnd(42)}║`);
    const dashboardUrl = `http://${ip}:${PORT}`;
    console.log(`║  Dashboard : ${dashboardUrl.padEnd(42)}║`);
    if (bridge.oscSender) {
      console.log(`║  OSC DAW   : ${dawArg.padEnd(42)}║`);
    }
    if (bridge.midiSender) {
      console.log(`║  MIDI      : ACTIVE (per-phone modes)${' '.repeat(23)}║`);
    }
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

  function shutdown() {
    console.log('\nShutting down...');

    for (const [ws] of bridge.connections) {
      ws.close(4001, 'Server shutting down');
    }
    bridge.connections.clear();
    bridge.players.clear();

    if (bridge.midiSender) bridge.midiSender.close();

    bridge.allocator.destroy();

    bridge.wss.close();
    bridge.httpServer.close(() => {
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 3000);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { createBridge };
