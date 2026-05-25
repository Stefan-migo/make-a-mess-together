# Phase 0 — Phone Simulator

**Status**: Ready for implementation
**Priority**: P0 — Must be built before any other phase
**Dependencies**: None (standalone Node.js tool)

---

## Why Build This First?

> *"The phone simulator is the most important tool you'll build. Without it, you're flying blind."* — Performance/QA Agent

The simulator validates:
- **Bridge capacity**: Can 30 simultaneous WebSocket connections be handled?
- **Slot allocator correctness**: No duplicate assignments, proper cleanup
- **Message relay format**: Correct OSC/JSON format to p5 sketch
- **Latency**: Is the 30fps budget met with 30 connections?
- **Stability**: What happens with bursts, disconnects, reconnects?

Without the simulator, we'd need 30 physical phones to test anything. With it, we can run 100s of test scenarios in seconds.

---

## What To Build

A **Node.js script** at `scripts/simulate-phones.js` that:

1. Spawns N virtual phone connections (configurable, default 30)
2. Each sends realistic sensor data at 30fps via WebSocket
3. Supports multiple sensor data patterns (sine, noise, spikes, idle)
4. Reports connection status, message throughput, latency
5. Simulates disconnects/reconnects for resilience testing

---

## Technical Specification

### CLI Interface

```bash
node scripts/simulate-phones.js [options]

Options:
  --count, -c     Number of virtual phones (default: 30, max: 100)
  --url, -u       WebSocket URL (default: ws://localhost:8080)
  --pattern, -p   Sensor data pattern to use:
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
  --help, -h      Show help
```

### Examples

```bash
# Basic: 30 phones, sine pattern, connect to local bridge
node scripts/simulate-phones.js

# Load test: 50 phones with noise pattern, 60 second test
node scripts/simulate-phones.js --count 50 --pattern noise --duration 60

# Resilience: 30 phones with random disconnects, verbose logging
node scripts/simulate-phones.js --disconnect --verbose

# Custom URL: different bridge
node scripts/simulate-phones.js --url ws://192.168.1.100:8080
```

### Architecture

```
scripts/simulate-phones.js
├── CLI argument parser (yargs or manual minimist-style)
├── SensorDataGenerator
│   ├── patternSine()    — smooth sinusoidal on all axes
│   ├── patternNoise()   — random gaussian jitter
│   ├── patternSpikes()  — periodic magnitude bursts (drum triggers)
│   ├── patternIdle()    — near-zero movement
│   └── patternMixed()   — random assignment per phone
├── VirtualPhone
│   ├── WebSocket connection
│   ├── 30fps send loop (setInterval)
│   ├── onmessage handler (slot assignment, pong)
│   ├── stats tracking (messages sent, latency, connection state)
│   └── disconnect/reconnect simulation
├── StatsAggregator
│   ├── total messages sent/received
│   ├── average/min/max latency
│   ├── slot allocation stats
│   ├── connection events (connect, disconnect, reconnect)
│   └── throughput per second
└── ReportGenerator
    ├── console table output (real-time)
    ├── JSON report file (post-run analysis)
    └── summary stats on exit
```

### Sensor Data Pattern Specifications

#### Sine Pattern (default)
```javascript
function generateSine(slot, elapsedMs) {
  const t = elapsedMs / 1000;
  const freq = 0.5 + slot * 0.05; // Each phone moves at slightly different speed
  return {
    type: "sensor",
    accel: {
      x: Math.sin(t * freq * 2 * Math.PI) * 5,    // -5..5
      y: Math.cos(t * freq * 1.3 * 2 * Math.PI) * 5,
      z: 9.81 + Math.sin(t * freq * 0.7 * 2 * Math.PI) * 2  // 7.81..11.81
    },
    gyro: {
      a: Math.sin(t * freq * 0.5 * 2 * Math.PI) * 90,  // -90..90 deg/s
      b: Math.cos(t * freq * 0.8 * 2 * Math.PI) * 45,
      g: Math.sin(t * freq * 0.3 * 2 * Math.PI) * 180
    },
    orientation: {
      a: (t * 15 + slot * 12) % 360,  // gradual rotation
      b: 45 + Math.sin(t * freq * 2 * Math.PI) * 30,
      g: Math.cos(t * freq * 0.5 * 2 * Math.PI) * 20
    }
  };
}
```

#### Noise Pattern
```javascript
function generateNoise() {
  return {
    type: "sensor",
    accel: {
      x: gaussianRandom() * 3,    // ±3 m/s² noise
      y: gaussianRandom() * 3,
      z: 9.81 + gaussianRandom() * 1.5
    },
    gyro: {
      a: gaussianRandom() * 60,   // ±60 deg/s noise
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
```

#### Spikes Pattern (for drum triggers)
```javascript
function generateSpikes(slot, elapsedMs) {
  const t = elapsedMs / 1000;
  const spikeInterval = 2 + Math.random() * 3; // spike every 2-5 seconds
  const inSpike = (t % spikeInterval) < 0.15;  // 150ms spike duration
  const magnitude = inSpike ? 15 + Math.random() * 10 : 9.81 + Math.random() * 0.5;
  
  return {
    type: "sensor",
    accel: {
      x: inSpike ? (Math.random() - 0.5) * 8 : (Math.random() - 0.5) * 0.5,
      y: inSpike ? (Math.random() - 0.5) * 8 : (Math.random() - 0.5) * 0.5,
      z: magnitude
    },
    gyro: { a: 0, b: 0, g: 0 },
    orientation: {
      a: (slot * 12 + t * 5) % 360,
      b: 0, g: 0
    }
  };
}
```

#### Idle Pattern
```javascript
function generateIdle() {
  return {
    type: "sensor",
    accel: { x: 0.01, y: 0.01, z: 9.81 },
    gyro:  { a: 0.01, b: 0.01, g: 0.01 },
    orientation: { a: 0, b: 90, g: 0 }
  };
}
```

### Output Metrics (Console)

The simulator should show a **real-time terminal dashboard**:

```
┌─────────────────────────────────────────────────────────────┐
│  Phone Simulator — 30 phones → ws://localhost:8080           │
│  Pattern: sine   |  30fps   |  12s elapsed                   │
├─────────────────────────────────────────────────────────────┤
│  Connections: 30/30  │  Msg sent: 10,800  │  900 msg/s       │
│  Avg latency: 2.3ms  │  Max latency: 8.1ms │  Errors: 0       │
│                                                             │
│  Slot Usage: [■■■■■■■■■■■■■■■■■■■■■■■■□□□□□□□□] 22/30       │
│                                                             │
│  ┌──────┬────────┬────────┬────────┬──────────────────────┐ │
│  │ Slot │ Status │  Msgs  │ Latency│ Connection           │ │
│  ├──────┼────────┼────────┼────────┼──────────────────────┤ │
│  │  0   │  ✓     │   360  │  2.1ms │ ws-virtual-0         │ │
│  │  1   │  ✓     │   360  │  2.3ms │ ws-virtual-1         │ │
│  │  2   │  ✓     │   358  │  1.9ms │ ws-virtual-2         │ │
│  │ ...  │        │        │        │                      │ │
│  │ 29   │  ✓     │   360  │  2.5ms │ ws-virtual-29        │ │
│  └──────┴────────┴────────┴────────┴──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### JSON Report Output (with --report flag)

```json
{
  "testConfig": {
    "count": 30,
    "url": "ws://localhost:8080",
    "pattern": "sine",
    "interval": 33,
    "duration": 60
  },
  "results": {
    "totalMessagesSent": 54000,
    "totalMessagesReceived": 30,
    "averageLatencyMs": 2.3,
    "maxLatencyMs": 8.1,
    "minLatencyMs": 0.5,
    "connectionErrors": 0,
    "successfulConnections": 30,
    "slotAssignments": [0, 1, 2, ..., 29],
    "throughputPerSecond": [901, 899, 903, ...],
    "perPhone": [
      { "slot": 0, "messagesSent": 1800, "avgLatencyMs": 2.1 },
      ...
    ]
  }
}
```

---

## TDD Requirements

Per the project constitution (Section VI — TDD), every function must have a test before implementation.

### Test File: `tests/scripts/simulate-phones.test.js`

Create the test file FIRST, verify it FAILS, then implement.

```javascript
// Minimum tests required:
describe('SimulatePhones', () => {
  // Sensor data generators
  test('generateSine produces valid sensor data format');
  test('generateNoise produces data within expected ranges');
  test('generateSpikes produces high magnitude on spike intervals');
  test('generateIdle produces minimal movement data');
  test('generateMixed returns different patterns for different slots');
  
  // Virtual phone
  test('VirtualPhone connects via WebSocket');
  test('VirtualPhone sends sensor message at configured interval');
  test('VirtualPhone handles slot assignment response');
  test('VirtualPhone disconnects and emits event');
  test('VirtualPhone reconnects on disconnect if enabled');
  
  // CLI argument parsing
  test('parses --count flag correctly');
  test('defaults to 30 phones if no count specified');
  test('defaults to sine pattern if no pattern specified');
  test('parses --duration 60 correctly');
  
  // Stats aggregation
  test('StatsAggregator tracks total messages sent');
  test('StatsAggregator calculates average latency correctly');
  test('StatsAggregator reports max/min latency');
  test('StatsAggregator tracks per-phone metrics');
});
```

---

## Implementation Order

```
Step 1: CLI argument parser
  → Parse --count, --url, --pattern, --interval, --duration
  → Default values when not specified
  → Help text

Step 2: SensorDataGenerator
  → 4 pattern functions (sine, noise, spikes, idle)
  → Pattern selector (mixed assigns random per phone)
  → All return valid { type: "sensor", accel, gyro, orientation }

Step 3: VirtualPhone class
  → Constructor(wsUrl, slot, pattern, interval)
  → connect() — open WebSocket
  → start() — begin 30fps send loop
  → send() — format and send sensor data
  → onMessage — handle slot assignment, pong
  → disconnect() / reconnect()
  → Stats tracking per phone

Step 4: StatsAggregator
  → trackMessage(slot, latencyMs)
  → trackConnection(slot, status)
  → getSummary() — total, avg, min, max

Step 5: Console UI
  → Real-time terminal dashboard
  → Table with per-phone status
  → Summary statistics

Step 6: ReportGenerator (optional)
  → JSON report output
  → Only if --report flag provided

Step 7: Integration test
  → Run against a lightweight test server
  → Verify 30 connections, slot assignment, message relay
```

---

## Dependencies

The script should have **zero npm dependencies** — use only:
- `ws` (already in server-bridge package.json)
- Node.js built-ins: `events`, `process`, `readline`, `fs`, `path`

Using pure Node.js means no build step, no npm install for the tool itself.

---

## Bridge Compatibility

The simulator connects to the bridge using the same protocol as a real phone:

1. **Connect**: WebSocket to `ws://<bridge>:8080`
2. **Register**: Send `{ "type": "sensor" }` as first message
3. **Receive**: `{ "type": "assigned", "slot": N }` from bridge
4. **Stream**: Send sensor messages at 30fps
5. **Heartbeat**: Respond to bridge pings with pongs
6. **Disconnect**: Close WebSocket (bridge frees slot)

This means the simulator can test the actual bridge from day one — no mock needed.

---

## Key Behaviors to Verify During Testing

- [ ] All 30 phones receive unique slot assignments (0-29)
- [ ] All phones receive slot 0..29 with no duplicates
- [ ] If phone 0 disconnects, its slot is freed and a new phone gets slot 0
- [ ] Bridge can handle burst connect (30 phones in <2 seconds)
- [ ] Bridge handles burst disconnect (all 30 drop simultaneously)
- [ ] Message throughput stays consistent (±5%) for 5+ minutes
- [ ] No memory leak after 10,000+ messages per phone
- [ ] Latency stays under 10ms for all 30 phones
