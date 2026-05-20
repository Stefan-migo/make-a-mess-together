# Phase 1 — Bridge Server

**Status**: Ready for implementation
**Priority**: P1 — Must be built after Phase 0 (phone simulator)
**Dependencies**: Node.js runtime, `ws` library

---

## Architecture

```
┌─────────────────┐     WebSocket      ┌──────────────────┐
│ Phone / Simulator│ ──────────────────> │  Bridge Server   │
│ Sensor Stream    │     :8080           │  (localhost)     │
└─────────────────┘                    │  Slot Allocator   │
                                        │  Message Relay    │
┌─────────────────┐     WebSocket      │  Heartbeat        │
│ p5 Sketch (local)│ <────────────────── │  Discovery Page   │
│ osc-js / Raw JSON│     :8080           └──────────────────┘
└─────────────────┘
```

**Key decisions** (from architecture analysis):
- **Single port :8080** for v1 (phones + p5 connect to same port)
- **Raw JSON WebSocket** for bridge→p5 (drop osc-js, add `--osc` flag later)
- **O(1) Set-based slot allocator** (not linear scan)
- **5s cooldown timer** on slot free to prevent thrashing
- **Heartbeat every 10s**, zombie detection at 15s no-data
- **Backpressure guard**: check `bufferedAmount` before sending
- **Protocol version field** `"v": 1` from day one
- **Per-device message relay**: forward raw sensor data to all connected p5 players

---

## What To Build

A **Node.js server** at `server-bridge/` that:

1. Serves HTTP on port 8080 (discovery page with QR + connection info)
2. Accepts WebSocket connections on the same port
3. Detects role from first message (`"sensor"` vs `"player"`)
4. Allocates slots (0–29) to sensor connections using O(1) allocator
5. Relays sensor data to all connected p5 players
6. Handles disconnects, frees slots, broadcasts lifecycle events
7. Heartbeat/ping to detect zombie connections

---

## Module Details

### server-bridge/package.json

```json
{
  "name": "phone-sensor-orchestra-bridge",
  "private": true,
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "ws": "^8.16.0",
    "qrcode": "^1.5.3"
  }
}
```

- `ws` for WebSocket server
- `qrcode` for generating QR code on discovery page (client-side CDN fallback)

### server-bridge/slot-allocator.js

**SlotAllocator class** — O(1) Set-based allocation:

```javascript
class SlotAllocator {
  constructor(maxSlots = 30)

  // O(1) allocate — pops from free set
  allocate() → slotNumber | -1

  // O(1) free — returns slot to free set
  free(slot) → boolean

  // O(1) check if slot is in use
  isAllocated(slot) → boolean

  // Get count of active slots
  get activeCount → number

  // Get list of allocated slots
  getAllocatedSlots() → number[]

  // Cooldown management
  startCooldown(slot) → void    // start 5s timer
  isOnCooldown(slot) → boolean
}
```

**Cooldown**: When a slot is freed, it enters a 5-second cooldown before being returned to the free pool. This prevents the same phone from reconnecting and getting a different slot during unstable connections.

### server-bridge/message-relay.js

**MessageRelay class** — Format, validate, relay messages:

```javascript
class MessageRelay {
  // Validate incoming sensor message format
  validateSensorMessage(msg) → { valid: boolean, error?: string }

  // Validate incoming player registration
  validatePlayerMessage(msg) → { valid: boolean, error?: string }

  // Detect role from first message
  detectRole(msg) → 'sensor' | 'player' | null

  // Format messages for broadcast
  formatAssignMessage(slot) → object
  formatDisconnectMessage(slot) → object
  formatCountMessage(count) → object
  formatSensorMessage(slot, type, data) → osc-like array
}
```

**Message Formats**:

Phone → Bridge:
```json
{ "type": "sensor", "v": 1, "accel": {"x":0,"y":0,"z":9.81}, "gyro": {"a":0,"b":0,"g":0}, "orientation": {"a":0,"b":90,"g":0} }
```

Bridge → Phone:
```json
{ "type": "assigned", "slot": 0, "bridgeIp": "192.168.1.100" }
```

Bridge → p5 Player (JSON over WebSocket):
```json
{ "type": "system", "event": "assign", "slot": 0 }
{ "type": "system", "event": "disconnect", "slot": 0 }
{ "type": "system", "event": "count", "count": 3 }
{ "type": "sensor", "slot": 0, "sensor": "accel", "data": {"x":0,"y":0,"z":9.81} }
{ "type": "sensor", "slot": 0, "sensor": "gyro", "data": {"a":0,"b":0,"g":0} }
{ "type": "sensor", "slot": 0, "sensor": "orientation", "data": {"a":0,"b":90,"g":0} }
```

### server-bridge/index.js

**Main server** — HTTP + WebSocket on port 8080:

```
index.js
├── HTTP server
│   ├── GET / → serves public/index.html
│   └── GET /health → health check endpoint
├── WebSocket server (same port)
│   ├── Connection handler
│   │   ├── Wait for first message to detect role
│   │   ├── Sensor → allocate slot, send assigned, start heartbeat
│   │   ├── Player → add to player set, send current state
│   │   └── Unknown → close connection
│   ├── Message handler
│   │   ├── Sensor data → relay to all players
│   │   └── Player ping → respond with pong
│   ├── Disconnect handler
│   │   ├── Free slot (with cooldown)
│   │   ├── Broadcast /system/disconnect to players
│   │   └── Broadcast /system/count
│   └── Heartbeat
│       ├── Ping every 10s
│       └── Zombie detection: close if no message in 15s
└── Startup
    ├── Get LAN IP address
    ├── Start HTTP+WS server
    └── Print connection info + QR URL
```

### server-bridge/public/index.html

**Discovery page** — displayed when opening `http://<bridge-ip>:8080` in browser:

- Bridge IP + port displayed prominently
- QR code (using qrcode CDN) encoding `ws://<ip>:8080`
- "Open p5 sketch" link for local laptop
- Active device list (live-updating)
- Simple dark theme matching design-system

---

## TDD Requirements

### Test Files (already scaffolded as `.todo`)

**tests/bridge/slot-allocator.test.js** — 10 tests:
- assign slot 0 when all free
- assign sequential 0, 1, 2
- reuse freed slot
- return -1 when full
- free and make available
- don't free unassigned slot
- cooldown on free (5s)
- prevent reuse during cooldown
- allow reuse after cooldown
- track active count

**tests/bridge/message-protocol.test.js** — 9 tests:
- parse valid sensor message
- reject missing required fields
- reject unknown version
- detect "sensor" role
- detect "player" role
- reject no type field
- format assign message
- format disconnect message
- format count message

---

## Implementation Order

```
Step 1: server-bridge/package.json
Step 2: server-bridge/slot-allocator.js (pure logic, no I/O)
Step 3: tests/bridge/slot-allocator.test.js — convert .todo to real tests
Step 4: server-bridge/message-relay.js (pure logic, no I/O)
Step 5: tests/bridge/message-protocol.test.js — convert .todo to real tests
Step 6: server-bridge/public/index.html (static page)
Step 7: server-bridge/index.js (main server, wires everything)
Step 8: Integration test — start bridge, connect simulator, verify relay
```

---

## Integration Test Plan

After implementing all modules:

```bash
# Terminal 1: Start bridge
cd server-bridge && node index.js
# → "Bridge listening on ws://192.168.1.100:8080"

# Terminal 2: Connect 3 simulated phones
node scripts/simulate-phones.js --count 3 --duration 10 --verbose
# → Should show 3 assigned slots, messages flowing

# Terminal 3 (optional): Manual WebSocket test
node -e "
  const WebSocket = require('ws');
  const ws = new WebSocket('ws://localhost:8080');
  ws.on('open', () => {
    ws.send(JSON.stringify({type:'player'}));
    ws.on('message', d => console.log(JSON.parse(d.toString())));
  });
"
```

---

## Key Behaviors to Verify

- [ ] 3 simulated phones each get unique slot 0, 1, 2
- [ ] If phone 0 disconnects, slot 0 is freed and new phone gets slot 0
- [ ] Bridge can handle burst connect (30 phones in <2 seconds)
- [ ] Message throughput stays consistent (±5%) for 5+ minutes
- [ ] Player connections receive all sensor data from all phones
- [ ] No memory leak after 10,000+ messages per phone
- [ ] Health endpoint returns 200
- [ ] Discovery page loads and shows QR code
