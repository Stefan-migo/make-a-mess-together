# Feature Specification: DAW OSC Bridge — REAPER / Bitwig Integration

**Feature Branch**: `08-daw-osc-bridge`  
**Created**: 2026-05-27  
**Status**: Spec  
**Input**: User wants to route phone sensor data to a DAW (REAPER on Fedora) via OSC, replacing or augmenting Tone.js for professional sound generation

---

## Architecture Overview

```
┌─────────────────┐     WebSocket      ┌──────────────────────────────────┐
│ Phone A (Vercel) │ ──────────────────> │        Bridge Server            │
│ Sensor Reader   │     :8080           │  (:8080 — laptop)               │
└─────────────────┘                    │                                  │
┌─────────────────┐                    │  ┌────────────┐  ┌────────────┐  │
│ Phone B (Vercel) │ ──────────────────> │  Allocator  │  │  Relay     │  │
│ ... up to 30     │                    │  └────────────┘  └─────┬──────┘  │
└─────────────────┘                    │                          │        │
                                        │                    ┌─────┴─────┐ │
                                        │                    │ TWO PATHS │ │
                                        │                    └─────┬─────┘ │
                                        └──────────────────────────┼───────┘
                                                                   │
                                         ┌─────────────────────────┤
                                         ▼                         ▼
                               ┌──────────────────┐      ┌──────────────────┐
                               │  WebSocket (WS)  │      │  UDP OSC (NEW)   │
                               │  (existing)      │      │  port 9000       │
                               │                  │      │                  │
                               ▼                  ▼      ▼                  ▼
                        ┌──────────────┐   ┌───────────────────────────┐
                        │ p5 Sketch    │   │  DAW (REAPER / Bitwig)    │
                        │ (visuals +   │   │  (professional sound)     │
                        │  fallback    │   │                           │
                        │  audio via   │   │  /device/0/accel → track1 │
                        │  Tone.js)    │   │  /device/0/gyro  → FX     │
                        └──────────────┘   └───────────────────────────┘
```

**Key design decision**: Both paths coexist. The WebSocket relay to p5 (visuals + fallback Tone.js audio) stays unchanged. The new UDP OSC path is **opt-in** via `--daw` flag.

---

## User Stories

### User Story 1 — Bridge sends OSC to DAW (Priority: P1)

The user starts the bridge with `--daw` flag. The bridge opens UDP port 9000. Every incoming sensor message is forwarded as a binary OSC packet. The DAW receives the data and maps it to sound parameters.

**Why this priority**: This is the core value — sensor data reaching REAPER.

**Acceptance Scenarios**:
1. **Given** the bridge is running with `--daw 127.0.0.1:9000`, **When** a phone sends sensor data, **Then** the bridge sends a UDP OSC packet with address `/device/0/accel` and floats `[0.1, 0.2, 9.8]`
2. **Given** the bridge is running without `--daw`, **When** a phone connects, **Then** no UDP packets are sent (backward compatible)

### User Story 2 — REAPER receives and maps 30 devices (Priority: P1)

30 phones connect simultaneously. REAPER receives 30 independent OSC streams. Each phone maps to a separate track with its own VST instrument.

**Acceptance Scenarios**:
1. **Given** 30 phones are connected, **When** REAPER is configured with 30 tracks (each listening to `/device/0/*` through `/device/29/*`), **Then** each track responds only to its own phone's sensor data
2. **Given** a phone disconnects from slot 5, **When** the bridge sends `/system/disconnect` with slot 5, **Then** REAPER's track 5 can react

### User Story 3 — System lifecycle events reach DAW (Priority: P2)

When a phone connects or disconnects, the DAW knows about it and can react.

**Acceptance Scenarios**:
1. **Given** a phone connects and gets slot 3, **When** bridge sends `/system/assign {slot: 3}`, **Then** REAPER receives assign (can unmute track 3)
2. **Given** a phone disconnects from slot 3, **When** bridge sends `/system/disconnect {slot: 3}`, **Then** REAPER receives disconnect (can mute track 3)

---

## OSC Protocol Design

### Messages sent to DAW (UDP port 9000)

Every message is standard OSC binary:

| OSC Address | Args | Frequency | Purpose |
|-------------|------|-----------|---------|
| `/device/{slot}/accel` | 3 floats: x, y, z | 30fps | Accelerometer data |
| `/device/{slot}/gyro` | 3 floats: a, b, g | 30fps | Gyroscope data |
| `/device/{slot}/orientation` | 3 floats: a, b, g | 30fps | Orientation data |
| `/device/{slot}/accelMag` | 1 float | 30fps | Computed magnitude |
| `/device/{slot}/config` | string: JSON config | on change | Brush, color, penDown |
| `/system/assign` | 1 int: slot | on connect | New device assigned |
| `/system/disconnect` | 1 int: slot | on disconnect | Device removed |
| `/system/count` | 1 int: count | on change | Active device count |

### OSC Binary Format

Using core Node.js `dgram` module + manual OSC packing (zero extra deps):

```
/device/0/accel ,fff 0.1 0.2 9.8
```

Structure:
- **Address string**: null-terminated, padded to 4-byte boundary
- **Type tag string**: comma + type chars (f=float32, i=int32, s=string), null-terminated, 4-byte padded
- **Arguments**: 32-bit big-endian values

---

## Files to Modify

### server-bridge/osc-sender.js (NEW)
- `OscSender` class wrapping `dgram` UDP socket
- Methods: `sendAccel(slot, x, y, z)`, `sendGyro(slot, a, b, g)`, `sendOrientation(slot, a, b, g)`
- Methods: `sendAssign(slot)`, `sendDisconnect(slot)`, `sendCount(count)`
- Manual OSC binary packing using `Buffer` (no npm dependency)
- Auto-clamps NaN/Infinity to 0

### server-bridge/index.js
- Parse `--daw [host:port]` from CLI args (default: unset = disabled)
- Initialize `OscSender` on startup if flag present
- In `handleSensorMessage()`: call oscSender.sendAccel/Gyro/Orientation alongside existing broadcastToPlayers
- In `handleSensorConnect()`: call oscSender.sendAssign(slot)
- In disconnect handler: call oscSender.sendDisconnect(slot) + sendCount(count)

### server-bridge/package.json
- No changes needed if using raw `dgram` (it's a built-in Node.js module)

### docs/REAPER-SETUP.md (NEW)
- Step-by-step: download, install, enable OSC, create project with 30 tracks, OSC learn
- Troubleshooting: no packets received, wrong port, firewall

### tests/
- `tests/server-bridge/osc-sender.test.js` — Unit tests for OSC binary packing
- `tests/server-bridge/daw-integration.test.js` — Integration tests with `--daw` flag

---

## Edge Cases

- **DAW not running**: UDP packets silently dropped — bridge doesn't crash
- **Network partitioned**: Same as above, UDP is fire-and-forget
- **Slot > 9**: Address format uses decimal (e.g., `/device/15/accel`), no zero-padding
- **NaN/Infinity in sensor data**: Clamp to 0 before packing
- **Multiple DAWs**: Future: `--daw` accepts comma-separated list of `host:port`
- **Bridge restart**: DAW sees data gap, tracks go silent until reconnect
- **30 phones × 30fps × 3 OSC = 2700 pkts/sec**: ~43KB/sec total bandwidth (trivial)

---

## Requirements

### Functional Requirements

- **FR-001**: Bridge MUST send OSC via UDP when `--daw` flag is provided
- **FR-002**: OSC messages MUST include all 9 sensor axes per device
- **FR-003**: OSC messages MUST include lifecycle events (assign, disconnect, count)
- **FR-004**: Bridge MUST continue sending WebSocket to p5 players when `--daw` is active (both coexist)
- **FR-005**: Bridge MUST NOT crash if UDP destination is unreachable
- **FR-006**: Bridge MUST NOT send OSC when `--daw` flag is absent
- **FR-007**: OSC address format MUST be `/device/{slot}/{sensorType}`

### Technical Requirements

- **TR-001**: Use Node.js built-in `dgram` module (zero extra dependencies)
- **TR-002**: OSC binary: address + type tag + 32-bit big-endian floats/ints
- **TR-003**: Default UDP port: 9000, default host: 127.0.0.1
- **TR-004**: CLI format: `--daw [host:port]` (e.g., `--daw 127.0.0.1:9000`)
- **TR-005**: Each sensor message → 3 OSC messages per device per frame (accel, gyro, orientation)
- **TR-006**: At 30 devices × 30fps × 3 = 2700 OSC pkts/sec max
- **TR-007**: Each OSC packet < 64 bytes (fits in single UDP datagram)

---

## Success Criteria

- **SC-001**: Bridge with `--daw 127.0.0.1:9000` sends UDP packets — verified via `tcpdump` or `socat`
- **SC-002**: REAPER maps `/device/0/accel` to a VST parameter — sound changes with phone movement
- **SC-003**: All existing tests pass (no WebSocket relay regression)
- **SC-004**: 30 phones at 30fps via UDP — no packet loss, no bridge degradation
- **SC-005**: REAPER setup documentation lets a user be running in under 15 min

---

## REAPER Setup Guide (quick reference)

1. Download REAPER from https://www.reaper.fm/download.php → Linux x86_64
2. Extract: `tar -xzf reaper-7xx-linux-x86_64.tar.gz`
3. Install: `cd reaper-7xx && ./install.sh`
4. Launch REAPER
5. Preferences → Control Surfaces → Add → OSC (Open Sound Control)
6. Mode: "Configure device's OSC patterns manually"
7. Local listen port: 9000
8. Create 30 tracks, load a VST synth on each
9. Right-click param → Learn → OSC Learn
10. Move phone → address captured → done

---

## Assumptions

- DAW runs on same machine as bridge (localhost, lowest latency)
- REAPER's built-in OSC handles routing without plugins
- No auth/encryption needed on OSC (LAN-local)
- 2700 pkts/sec is trivial for modern hardware
- p5 visuals + DAW audio run simultaneously (hybrid mode)
- User has REAPER installed or will install it
