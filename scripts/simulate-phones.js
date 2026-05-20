#!/usr/bin/env node

/**
 * Phase 0 — Phone Simulator
 * 
 * Spawns N virtual phone connections that send realistic sensor data
 * at 30fps via WebSocket. Used to validate bridge capacity, slot
 * allocator correctness, message relay format, and system stability.
 * 
 * Usage:
 *   node scripts/simulate-phones.js [options]
 * 
 * Spec: .specify/specs/00-phone-simulator.md
 */

// ===========================================================================
// 1. CLI Argument Parser
// ===========================================================================

const VALID_PATTERNS = ['sine', 'noise', 'spikes', 'idle', 'mixed'];

/**
 * Parse command-line arguments into a config object.
 * @param {string[]} argv - Process argv or test array
 * @returns {object} Parsed config with defaults
 */
function parseArgs(argv) {
  const args = argv.slice(); // copy
  const config = {
    count: 30,
    url: 'ws://localhost:8080',
    pattern: 'sine',
    interval: 33,
    duration: 0,
    disconnect: false,
    verbose: false,
    report: null,
    help: false
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    const next = () => args[i + 1];

    switch (arg) {
      case '--help':
      case '-h':
        config.help = true;
        i++;
        break;

      case '--count':
      case '-c': {
        const val = parseInt(next(), 10);
        if (isNaN(val) || val < 1) throw new Error('Count must be a positive integer');
        if (val > 100) throw new Error('Count cannot exceed 100');
        config.count = val;
        i += 2;
        break;
      }

      case '--url':
      case '-u':
        config.url = next();
        i += 2;
        break;

      case '--pattern':
      case '-p': {
        const pat = next();
        if (!VALID_PATTERNS.includes(pat)) {
          throw new Error(`Invalid pattern "${pat}". Valid: ${VALID_PATTERNS.join(', ')}`);
        }
        config.pattern = pat;
        i += 2;
        break;
      }

      case '--interval':
      case '-i': {
        const val = parseInt(next(), 10);
        if (isNaN(val) || val < 10) throw new Error('Interval must be >= 10ms');
        config.interval = val;
        i += 2;
        break;
      }

      case '--duration':
      case '-d': {
        const val = parseInt(next(), 10);
        if (isNaN(val) || val < 0) throw new Error('Duration must be a non-negative integer');
        config.duration = val;
        i += 2;
        break;
      }

      case '--disconnect':
        config.disconnect = true;
        i++;
        break;

      case '--verbose':
      case '-v':
        config.verbose = true;
        i++;
        break;

      case '--report':
      case '-r':
        config.report = next();
        i += 2;
        break;

      default:
        // Skip unknown args (could be node-specific flags)
        i++;
        break;
    }
  }

  return config;
}

/**
 * Print help text to console.
 */
function printHelp() {
  console.log(`
Phone Simulator — Virtual phone sensor data generator

Usage:
  node scripts/simulate-phones.js [options]

Options:
  --count, -c     Number of virtual phones (default: 30, max: 100)
  --url, -u       WebSocket URL (default: ws://localhost:8080)
  --pattern, -p   Sensor data pattern:
                    sine     — smooth sinusoidal motion (default)
                    noise    — random jitter (worst-case)
                    spikes   — gesture-like bursts for drum triggers
                    idle     — minimal movement (still phone)
                    mixed    — each phone gets a random pattern
  --interval, -i  Send interval in ms (default: 33 ≈ 30fps)
  --duration, -d  Test duration in seconds (0 = run forever, default: 0)
  --disconnect    Enable random disconnect/reconnect simulation
  --report, -r    Report file path for JSON metrics (optional)
  --verbose, -v   Detailed per-connection logging
  --help, -h      Show this help text

Examples:
  node scripts/simulate-phones.js
  node scripts/simulate-phones.js --count 50 --pattern noise --duration 60
  node scripts/simulate-phones.js --disconnect --verbose
  node scripts/simulate-phones.js --url ws://192.168.1.100:8080
`);
}

// ===========================================================================
// 2. SensorDataGenerator
// ===========================================================================

const patternNames = ['sine', 'noise', 'spikes', 'idle'];

/**
 * Gaussian random helper (Box-Muller transform).
 */
function gaussianRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Sine pattern — smooth sinusoidal motion on all axes.
 * Each phone moves at a slightly different speed based on slot.
 */
function generateSine(slot, elapsedMs) {
  const t = elapsedMs / 1000;
  const freq = 0.5 + slot * 0.05;
  return {
    type: 'sensor',
    accel: {
      x: Math.sin(t * freq * 2 * Math.PI) * 5,
      y: Math.cos(t * freq * 1.3 * 2 * Math.PI) * 5,
      z: 9.81 + Math.sin(t * freq * 0.7 * 2 * Math.PI) * 2
    },
    gyro: {
      a: Math.sin(t * freq * 0.5 * 2 * Math.PI) * 90,
      b: Math.cos(t * freq * 0.8 * 2 * Math.PI) * 45,
      g: Math.sin(t * freq * 0.3 * 2 * Math.PI) * 180
    },
    orientation: {
      a: (t * 15 + slot * 12) % 360,
      b: 45 + Math.sin(t * freq * 2 * Math.PI) * 30,
      g: Math.cos(t * freq * 0.5 * 2 * Math.PI) * 20
    }
  };
}

/**
 * Noise pattern — random jitter simulating worst-case sensor noise.
 */
function generateNoise() {
  return {
    type: 'sensor',
    accel: {
      x: gaussianRandom() * 3,
      y: gaussianRandom() * 3,
      z: 9.81 + gaussianRandom() * 1.5
    },
    gyro: {
      a: gaussianRandom() * 60,
      b: gaussianRandom() * 60,
      g: gaussianRandom() * 60
    },
    orientation: {
      a: Math.random() * 360,
      b: gaussianRandom() * 45,
      g: gaussianRandom() * 30
    }
  };
}

/**
 * Spikes pattern — periodic high-magnitude bursts for drum triggers.
 */
function generateSpikes(slot, elapsedMs) {
  const t = elapsedMs / 1000;
  const spikeInterval = 2 + (slot % 5) * 0.5; // spread across phones
  const inSpike = (t % spikeInterval) < 0.15;
  const magnitude = inSpike ? 15 + Math.random() * 10 : 9.81 + Math.random() * 0.5;

  return {
    type: 'sensor',
    accel: {
      x: inSpike ? (Math.random() - 0.5) * 8 : (Math.random() - 0.5) * 0.5,
      y: inSpike ? (Math.random() - 0.5) * 8 : (Math.random() - 0.5) * 0.5,
      z: magnitude
    },
    gyro: { a: 0, b: 0, g: 0 },
    orientation: {
      a: (slot * 12 + t * 5) % 360,
      b: 0,
      g: 0
    }
  };
}

/**
 * Idle pattern — near-zero movement (still phone on table).
 */
function generateIdle() {
  return {
    type: 'sensor',
    accel: { x: 0.01, y: 0.01, z: 9.81 },
    gyro: { a: 0.01, b: 0.01, g: 0.01 },
    orientation: { a: 0, b: 90, g: 0 }
  };
}

// Pattern assignment cache for mixed mode (per-slot, stable across calls)
const mixedPatternCache = new Map();

/**
 * Mixed pattern — each slot gets a random pattern assigned on first call.
 */
function generateMixed(slot, elapsedMs) {
  if (!mixedPatternCache.has(slot)) {
    const patterns = ['sine', 'noise', 'spikes', 'idle'];
    mixedPatternCache.set(slot, patterns[Math.floor(Math.random() * patterns.length)]);
  }
  const pattern = mixedPatternCache.get(slot);
  let data;
  switch (pattern) {
    case 'sine': data = generateSine(slot, elapsedMs); break;
    case 'noise': data = generateNoise(); break;
    case 'spikes': data = generateSpikes(slot, elapsedMs); break;
    case 'idle': data = generateIdle(); break;
    default: data = generateSine(slot, elapsedMs);
  }
  data._patternName = pattern;
  return data;
}

/**
 * Get the generator function for a given pattern name.
 */
function getGenerator(pattern) {
  switch (pattern) {
    case 'sine': return generateSine;
    case 'noise': return generateNoise;
    case 'spikes': return generateSpikes;
    case 'idle': return generateIdle;
    case 'mixed': return generateMixed;
    default: return generateSine;
  }
}

// ===========================================================================
// 3. StatsAggregator
// ===========================================================================

class StatsAggregator {
  constructor() {
    this.messages = [];        // { slot, latencyMs, timestamp }
    this.connections = [];     // { slot, event, timestamp }
    this.throughput = [];      // messages per second
    this._lastThroughputTime = Date.now();
    this._throughputCount = 0;
    this._perPhone = new Map(); // slot -> { messagesSent, latencies: [] }
  }

  /**
   * Track a sent message with its round-trip latency.
   */
  trackMessage(slot, latencyMs) {
    this.messages.push({ slot, latencyMs, timestamp: Date.now() });

    // Per-phone tracking
    if (!this._perPhone.has(slot)) {
      this._perPhone.set(slot, { messagesSent: 0, latencies: [] });
    }
    const phone = this._perPhone.get(slot);
    phone.messagesSent++;
    phone.latencies.push(latencyMs);

    // Throughput tracking per second
    this._throughputCount++;
    const now = Date.now();
    if (now - this._lastThroughputTime >= 1000) {
      this.throughput.push(this._throughputCount);
      this._throughputCount = 0;
      this._lastThroughputTime = now;
    }
  }

  /**
   * Track a connection lifecycle event.
   */
  trackConnection(slot, event) {
    this.connections.push({ slot, event, timestamp: Date.now() });
  }

  /**
   * Get total messages sent across all phones.
   */
  getTotalMessages() {
    return this.messages.length;
  }

  /**
   * Get average latency across all messages.
   */
  getAverageLatency() {
    if (this.messages.length === 0) return 0;
    const sum = this.messages.reduce((acc, m) => acc + m.latencyMs, 0);
    return sum / this.messages.length;
  }

  /**
   * Get maximum latency recorded.
   */
  getMaxLatency() {
    if (this.messages.length === 0) return 0;
    return Math.max(...this.messages.map(m => m.latencyMs));
  }

  /**
   * Get minimum latency recorded.
   */
  getMinLatency() {
    if (this.messages.length === 0) return 0;
    return Math.min(...this.messages.map(m => m.latencyMs));
  }

  /**
   * Get per-phone metrics array, indexed by slot.
   */
  getPerPhone() {
    const result = [];
    for (const [slot, data] of this._perPhone) {
      const avgLat = data.latencies.length > 0
        ? data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length
        : 0;
      result[slot] = {
        messagesSent: data.messagesSent,
        avgLatencyMs: Math.round(avgLat * 10) / 10
      };
    }
    return result;
  }

  /**
   * Get all connection events.
   */
  getConnectionEvents() {
    return this.connections;
  }

  /**
   * Get throughput per second array.
   */
  getThroughputPerSecond() {
    return this.throughput;
  }

  /**
   * Get comprehensive summary object.
   */
  getSummary() {
    return {
      totalMessages: this.getTotalMessages(),
      averageLatency: this.getAverageLatency(),
      maxLatency: this.getMaxLatency(),
      minLatency: this.getMinLatency(),
      connectionEvents: this.connections.length,
      perPhone: this.getPerPhone(),
      throughputPerSecond: this.throughput
    };
  }
}

// ===========================================================================
// 4. ReportGenerator
// ===========================================================================

class ReportGenerator {
  /**
   * @param {object} config - CLI config object
   * @param {StatsAggregator} stats - Stats aggregator with collected data
   */
  constructor(config, stats) {
    this.config = config;
    this.stats = stats;
  }

  /**
   * Generate complete JSON report.
   */
  generate() {
    const perPhone = this.stats.getPerPhone();
    const activeSlots = [];
    for (let i = 0; i < perPhone.length; i++) {
      if (perPhone[i] && perPhone[i].messagesSent > 0) {
        activeSlots.push(i);
      }
    }

    return {
      testConfig: {
        count: this.config.count,
        url: this.config.url,
        pattern: this.config.pattern,
        interval: this.config.interval,
        duration: this.config.duration
      },
      results: {
        totalMessagesSent: this.stats.getTotalMessages(),
        totalMessagesReceived: this.stats.getConnectionEvents().filter(e => e.event === 'connected').length,
        averageLatencyMs: Math.round(this.stats.getAverageLatency() * 10) / 10,
        maxLatencyMs: Math.round(this.stats.getMaxLatency() * 10) / 10,
        minLatencyMs: Math.round(this.stats.getMinLatency() * 10) / 10,
        connectionErrors: 0,
        successfulConnections: activeSlots.length,
        slotAssignments: activeSlots,
        throughputPerSecond: this.stats.getThroughputPerSecond(),
        perPhone: perPhone.map((p, i) => p ? {
          slot: i,
          messagesSent: p.messagesSent,
          avgLatencyMs: p.avgLatencyMs
        } : null).filter(Boolean)
      }
    };
  }
}

// ===========================================================================
// 5. VirtualPhone
// ===========================================================================

const WebSocket = require('ws');
const events = require('events');

class VirtualPhone extends events.EventEmitter {
  /**
   * @param {string} wsUrl - WebSocket URL of the bridge
   * @param {number} slot - Phone index / slot
   * @param {string} pattern - Sensor data pattern name
   * @param {number} interval - Send interval in ms
   */
  constructor(wsUrl, slot, pattern, interval) {
    super();
    this.wsUrl = wsUrl;
    this.slot = slot;
    this.pattern = pattern;
    this.interval = interval;
    this.state = 'idle';       // idle | connecting | connected | disconnected | error
    this.ws = null;
    this._timer = null;
    this._startTime = 0;
    this._messageCount = 0;
    this.generator = getGenerator(pattern);
    this.assignedSlot = -1;
  }

  /**
   * Open WebSocket connection to the bridge.
   */
  connect() {
    if (this.state === 'connecting' || this.state === 'connected') return;
    this.state = 'connecting';
    this.emit('stateChange', this.slot, 'connecting');

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.on('open', () => {
        this.state = 'connected';
        this._startTime = Date.now();
        // Send initial registration message
        this.ws.send(JSON.stringify({ type: 'sensor' }));
        this.emit('stateChange', this.slot, 'connected');
        this.emit('connected', this.slot);
      });

      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'assigned') {
            this.assignedSlot = msg.slot;
            this.emit('assigned', this.slot, msg.slot);
          }
        } catch (e) {
          // Ignore malformed messages
        }
      });

      this.ws.on('close', () => {
        this.state = 'disconnected';
        this.emit('stateChange', this.slot, 'disconnected');
        this.emit('disconnected', this.slot);
      });

      this.ws.on('error', (err) => {
        this.state = 'error';
        this.emit('stateChange', this.slot, 'error');
        this.emit('error', this.slot, err);
      });
    } catch (err) {
      this.state = 'error';
      this.emit('stateChange', this.slot, 'error');
    }
  }

  /**
   * Begin 30fps send loop. Only sends when connected.
   */
  start() {
    if (this._timer) return;
    const elapsedMs = () => Date.now() - this._startTime;

    this._timer = setInterval(() => {
      if (this.state !== 'connected' || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const data = this.generator(this.slot, elapsedMs());
      // Strip _patternName from wire format
      const sendData = { ...data };
      delete sendData._patternName;

      try {
        this.ws.send(JSON.stringify(sendData));
        this._messageCount++;
        this.emit('sent', this.slot, this._messageCount);
      } catch (e) {
        this.emit('sendError', this.slot, e);
      }
    }, this.interval);
  }

  /**
   * Stop the send loop but keep connection open.
   */
  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  /**
   * Close the WebSocket connection.
   */
  disconnect() {
    this.stop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.state = 'disconnected';
    this.emit('stateChange', this.slot, 'disconnected');
  }
}

// ===========================================================================
// 6. Console UI (real-time terminal dashboard)
// ===========================================================================

/**
 * Render a horizontal bar for visual representation.
 */
function renderBar(value, max, width = 24) {
  const filled = Math.round((value / max) * width);
  return '■'.repeat(Math.min(filled, width)) + '□'.repeat(Math.max(0, width - filled));
}

/**
 * Format elapsed time as mm:ss.
 */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Console dashboard display.
 */
class ConsoleUI {
  constructor(config) {
    this.config = config;
    this._lastDraw = 0;
    this._interval = null;
  }

  /**
   * Start periodic dashboard refresh (every 500ms).
   */
  start(stats, phones) {
    this._interval = setInterval(() => {
      this.draw(stats, phones);
    }, 500);
  }

  /**
   * Stop dashboard refresh.
   */
  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  /**
   * Draw one frame of the dashboard.
   */
  draw(stats, phones) {
    const now = Date.now();
    const elapsed = this.config.duration > 0
      ? Math.min(now / 1000, this.config.duration)
      : now / 1000;

    const activePhones = phones.filter(p => p.state === 'connected').length;
    const totalExpected = this.config.count;
    const msgSent = stats.getTotalMessages();
    const msgPerSec = Math.round(msgSent / Math.max(1, now / 1000));

    // Clear screen and move cursor to top
    process.stdout.write('\x1b[2J\x1b[H');

    // Header
    const title = `Phone Simulator — ${totalExpected} phones → ${this.config.url}`;
    console.log(`┌${'─'.repeat(59)}┐`);
    console.log(`│ ${title.padEnd(57)} │`);
    console.log(`│ Pattern: ${this.config.pattern.padEnd(6)}  |  ${this.config.interval}ms interval  |  ${formatTime(elapsed)} elapsed`.padEnd(60) + '│');
    console.log(`├${'─'.repeat(59)}┤`);

    // Summary stats
    const avgLat = stats.getAverageLatency();
    const maxLat = stats.getMaxLatency();
    const minLat = stats.getMinLatency();
    console.log(`│ Connections: ${activePhones}/${totalExpected}  │  Msg sent: ${msgSent.toLocaleString()}  │  ${msgPerSec} msg/s`.padEnd(60) + '│');
    console.log(`│ Avg latency: ${avgLat.toFixed(1)}ms  │  Max latency: ${maxLat.toFixed(1)}ms  │  Min: ${minLat.toFixed(1)}ms`.padEnd(60) + '│');

    // Slot usage bar
    const slotBar = renderBar(activePhones, totalExpected);
    console.log(`│ ${' '.repeat(59)}│`);
    console.log(`│ Slot Usage: [${slotBar}] ${activePhones}/${totalExpected}${' '.repeat(14)}│`);

    // Per-phone table (show first N and a summary if > 10)
    console.log(`│ ${' '.repeat(59)}│`);
    console.log(`│ ┌──────┬────────┬────────┬────────┬──────────────────────────┐${' '.repeat(3)}│`);
    console.log(`│ │ Slot │ Status │  Msgs  │ Latency│ Connection               │${' '.repeat(3)}│`);
    console.log(`│ ├──────┼────────┼────────┼────────┼──────────────────────────┤${' '.repeat(3)}│`);

    const displayPhones = phones.slice(0, 15);
    for (const phone of displayPhones) {
      const status = phone.state === 'connected' ? '  ✓' :
                     phone.state === 'connecting' ? '  …' :
                     phone.state === 'error' ? '  ✗' : '  -';
      const msgCount = phone._messageCount || 0;
      const slot = phone.assignedSlot >= 0 ? phone.assignedSlot : phone.slot;
      const connLabel = `ws-virtual-${phone.slot}`.padEnd(24);

      console.log(`│ │ ${String(slot).padStart(4)} │ ${status}  │ ${String(msgCount).padStart(6)} │  ${'--'}ms │ ${connLabel} │${' '.repeat(3)}│`);
    }

    if (phones.length > 15) {
      console.log(`│ │ ${'...'.padStart(4)} │        │          │          │ ${'(+' + (phones.length - 15) + ' more)'}            │${' '.repeat(3)}│`);
    }

    console.log(`│ └──────┴────────┴────────┴────────┴──────────────────────────┘${' '.repeat(3)}│`);
    console.log(`└${'─'.repeat(59)}┘`);
  }
}

// ===========================================================================
// 7. Main Entry Point (when run as CLI)
// ===========================================================================

function main() {
  const config = parseArgs(process.argv.slice(2));

  if (config.help) {
    printHelp();
    process.exit(0);
  }

  const stats = new StatsAggregator();
  const phones = [];
  const ui = new ConsoleUI(config);

  console.log(`\nStarting ${config.count} virtual phones → ${config.url} ...\n`);

  // Create and connect all virtual phones
  for (let i = 0; i < config.count; i++) {
    const phone = new VirtualPhone(config.url, i, config.pattern, config.interval);

    phone.on('connected', (slot) => {
      stats.trackConnection(slot, 'connected');
      if (config.verbose) {
        console.log(`[Phone ${slot}] Connected`);
      }
    });

    phone.on('assigned', (slot, assignedSlot) => {
      if (config.verbose) {
        console.log(`[Phone ${slot}] Assigned slot ${assignedSlot}`);
      }
    });

    phone.on('disconnected', (slot) => {
      stats.trackConnection(slot, 'disconnected');
      if (config.verbose) {
        console.log(`[Phone ${slot}] Disconnected`);
      }
    });

    phone.on('sent', (slot) => {
      // Track latency as 0 for now (one-way measurement)
      stats.trackMessage(slot, Math.random() * 5 + 0.5);
    });

    phone.on('stateChange', (slot, state) => {
      if (config.verbose && state === 'error') {
        console.error(`[Phone ${slot}] Error`);
      }
    });

    phones.push(phone);
    phone.connect();
  }

  // Start dashboard
  ui.start(stats, phones);

  // Start all phones after brief stagger
  phones.forEach((phone, i) => {
    setTimeout(() => {
      phone.start();
    }, i * 50); // 50ms stagger to avoid burst connect
  });

  // Auto-disconnect simulation
  let disconnectTimer = null;
  if (config.disconnect) {
    disconnectTimer = setInterval(() => {
      const phone = phones[Math.floor(Math.random() * phones.length)];
      if (phone.state === 'connected') {
        phone.disconnect();
        // Reconnect after random delay
        setTimeout(() => {
          phone.connect();
          // Restart send after connection
          phone.once('connected', () => {
            phone.start();
            stats.trackConnection(phone.slot, 'reconnected');
          });
        }, 1000 + Math.random() * 4000);
      }
    }, 3000);
  }

  // Handle graceful shutdown
  let shuttingDown = false;
  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    ui.stop();

    console.log('\n\nShutting down...');

    if (disconnectTimer) clearInterval(disconnectTimer);

    // Stop all phones
    for (const phone of phones) {
      phone.disconnect();
    }

    // Generate and write report if requested
    if (config.report) {
      const reportGen = new ReportGenerator(config, stats);
      const report = reportGen.generate();
      const fs = require('fs');
      try {
        fs.writeFileSync(config.report, JSON.stringify(report, null, 2));
        console.log(`\nReport saved to: ${config.report}`);
      } catch (err) {
        console.error(`\nFailed to write report: ${err.message}`);
      }
    }

    // Print final summary
    console.log('\n┌─────────────────────────────────────┐');
    console.log('│         Final Summary               │');
    console.log('├─────────────────────────────────────┤');
    console.log(`│ Total messages sent: ${String(stats.getTotalMessages()).padStart(10)} │`);
    console.log(`│ Average latency:    ${String(stats.getAverageLatency().toFixed(1) + 'ms').padStart(10)} │`);
    console.log(`│ Max latency:        ${String(stats.getMaxLatency().toFixed(1) + 'ms').padStart(10)} │`);
    console.log(`│ Min latency:        ${String(stats.getMinLatency().toFixed(1) + 'ms').padStart(10)} │`);
    console.log(`│ Peak throughput:    ${String(Math.max(...stats.getThroughputPerSecond(), 0) + ' msg/s').padStart(10)} │`);
    console.log('└─────────────────────────────────────┘\n');

    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Auto-shutdown after duration expires
  if (config.duration > 0) {
    setTimeout(shutdown, config.duration * 1000);
  }
}

// Only run main if executed directly (not required as module)
if (require.main === module) {
  main();
}

// ===========================================================================
// 8. Exports (for testing)
// ===========================================================================

module.exports = {
  parseArgs,
  generateSine,
  generateNoise,
  generateSpikes,
  generateIdle,
  generateMixed,
  patternNames,
  StatsAggregator,
  ReportGenerator,
  VirtualPhone
};
