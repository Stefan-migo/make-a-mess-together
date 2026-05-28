# Tasks: DAW OSC Bridge — REAPER / Bitwig Integration

**Prerequisites**: Spec at `.specify/specs/08-daw-osc-bridge.md`
**Tests**: Tests are MANDATORY per TDD constitution. Every feature requires a failing test before implementation.
**Branch**: `08-daw-osc-bridge`

---

## Phase 1: OSC Sender Core (Priority: P1)

**Goal**: A reusable `OscSender` class that packs and sends OSC binary messages via UDP.

**Files**: `server-bridge/osc-sender.js` (NEW), `tests/server-bridge/osc-sender.test.js` (NEW)

### Implementation

- [ ] T001 [UNIT] Write failing test: `OscSender.sendAccel(0, 1.0, 2.0, 3.0)` produces correct binary OSC packet
- [ ] T002 [UNIT] Write failing test: `OscSender.sendAssign(5)` produces `/system/assign` with int 5
- [ ] T003 [UNIT] Write failing test: OscSender handles NaN by clamping to 0
- [ ] T004 [GREEN] Implement `OscSender` class:
  - `constructor(host, port)` — creates dgram socket
  - `_packOsc(address, types, args)` — static method, returns `Buffer`
  - `sendAccel(slot, x, y, z)` — sends `/device/{slot}/accel`
  - `sendGyro(slot, a, b, g)` — sends `/device/{slot}/gyro`
  - `sendOrientation(slot, a, b, g)` — sends `/device/{slot}/orientation`
  - `sendAssign(slot)` — sends `/system/assign` with int32
  - `sendDisconnect(slot)` — sends `/system/disconnect` with int32
  - `sendCount(count)` — sends `/system/count` with int32
  - `close()` — closes UDP socket
  - NaN/Infinity clamping in all float methods
- [ ] T005 [REFACTOR] Verify all T001-T003 pass GREEN

### OSC Binary Packing Details

The `_packOsc` method must produce valid OSC byte streams:

```
Address:   /device/0/accel\0\0\0  (padded to 4-byte boundary)
Type tag:  ,fff\0\0\0\0\0        (comma + fff + null + padding)
Args:      [4 bytes float][4 bytes float][4 bytes float]  (big-endian)
```

Use Node.js `Buffer.alloc()` and `buf.write(address, 'ascii')`, `buf.write(typeTag, 'ascii')`, `buf.writeFloatBE(value, offset)`.

---

## Phase 2: Bridge Integration (Priority: P1)

**Goal**: Wire OscSender into the bridge with `--daw` CLI flag.

**Files**: `server-bridge/index.js`, `tests/server-bridge/daw-integration.test.js` (NEW)

### Implementation

- [ ] T006 [UNIT] Write failing test: Bridge with `--daw` flag creates OscSender
- [ ] T007 [UNIT] Write failing test: Bridge without `--daw` flag creates NO OscSender
- [ ] T008 [UNIT] Write failing test: sensor message triggers OscSender.sendAccel/Gyro/Orientation
- [ ] T009 [UNIT] Write failing test: connect triggers OscSender.sendAssign
- [ ] T010 [UNIT] Write failing test: disconnect triggers OscSender.sendDisconnect
- [ ] T011 [GREEN] Modify `server-bridge/index.js`:
  - Parse `--daw` argument: format `--daw [host:port]`
  - Default host: `127.0.0.1`, default port: `9000`
  - Initialize `oscSender = null`; if `--daw` present, create `new OscSender(host, port)`
  - In `handleSensorMessage()`: if `oscSender`, call `oscSender.sendAccel/Gyro/Orientation`
  - In `handleSensorConnect()`: if `oscSender`, call `oscSender.sendAssign(slot)`, `oscSender.sendCount(count)`
  - In disconnect handler (ws.on('close')): if `oscSender`, call `oscSender.sendDisconnect(slot)`, `oscSender.sendCount(count)`
  - Add `--daw` to startup banner output
- [ ] T012 [GREEN] Verify all T006-T010 pass GREEN

---

## Phase 3: Documentation (Priority: P2)

**Goal**: Users can set up REAPER in under 15 minutes.

**Files**: `docs/REAPER-SETUP.md` (NEW), `docs/DAW-INTEGRATION.md` (NEW)

- [ ] T013 [DOC] Create `docs/REAPER-SETUP.md`:
  - Download and install REAPER 7.x for Linux
  - OSC control surface configuration
  - Create project with 30 tracks
  - OSC Learn workflow per track
  - Troubleshooting: port conflicts, firewall (firewalld on Fedora), no data
  - Optional: OSC pattern file for batch mapping
- [ ] T014 [DOC] Create `docs/DAW-INTEGRATION.md`:
  - Architecture overview (same as spec)
  - OSC protocol reference (all addresses and args)
  - Bitwig Studio integration notes
  - Ardour integration notes
  - Performance: 2700 pkts/sec, bandwidth, CPU impact
- [ ] T015 [DOC] Update `README.md` with DAW integration section

---

## Phase 4: End-to-End Verification (Priority: P2)

**Goal**: Verify the entire pipeline works with real phones and REAPER.

- [ ] T016 [E2E] Start bridge with `--daw 127.0.0.1:9000`
- [ ] T017 [E2E] Use `socat - UDP-LISTEN:9000` or `tcpdump` to verify OSC packets arrive
- [ ] T018 [E2E] Open REAPER, configure OSC control surface on port 9000
- [ ] T019 [E2E] Load VST on track, OSC Learn on a parameter, move phone → parameter moves
- [ ] T020 [E2E] Repeat with 2+ phones on separate tracks, verify independence

---

## Execution Order

1. Phase 1: OscSender class (T001-T005)
2. Phase 2: Bridge integration (T006-T012)
3. Phase 3: Documentation (T013-T015)
4. Phase 4: E2E verification (T016-T020)
5. Run full test suite (all ~269+ tests must pass)
6. Commit in order: OscSender class → Bridge integration → Docs → E2E results
