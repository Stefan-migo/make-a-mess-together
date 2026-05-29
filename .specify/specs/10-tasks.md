# Tasks: New Mapping System (10-new-mapping-system)

**Spec ID**: `10-new-mapping-system`  
**Created**: 2026-05-29  
**Status**: Tasks  
**Total tasks**: 28

---

## Phase 1: Mode Selector in Phone Client (4 tasks)

### [x] T1.1 — Add mode selection UI before connection
**Files**: `phone-client/index.html`, `phone-client/style.css`, `phone-client/app.js`  
**Description**: Replace the current config overlay with a mode selection screen showing 3 buttons (ChordSpace, Drums, GestureCanvas) plus IP input. The mode is selected before the WebSocket connection is established.  
**Acceptance**: Phone shows 3 mode buttons. Tapping one selects it. Connect button starts WebSocket with `{type: "sensor", mode: "chordspace"}`.

### [x] T1.2 — Send mode in connection message
**Files**: `phone-client/app.js`  
**Description**: The initial WebSocket message includes the selected mode: `{type: "sensor", mode: "chordspace"}`. The bridge responds with pool assignment info.  
**Acceptance**: Bridge logs show incoming mode. Phone receives `{type: "assigned", slot: 0, mode: "chordspace", channel: 1}`.

### [x] T1.3 — Add persistent mode selector during session
**Files**: `phone-client/app.js`, `phone-client/index.html`  
**Description**: During the sensor session, show 3 small mode pills at the bottom of the UI. Tapping changes mode: `{type: "modeChange", mode: "drums"}`. Show current mode highlighted.  
**Acceptance**: Tapping mode pill sends modeChange message. Bridge responds with `{type: "modeChanged", mode: "drums", channel: 7}`.

### [x] T1.4 — Display pool info on phone
**Files**: `phone-client/app.js`, `phone-client/index.html`  
**Description**: Show pool capacity below mode buttons: "ChordSpace: 3/6". Update when bridge sends pool info.  
**Acceptance**: Phone displays "ChordSpace: 1/6" after connection. Updates when bridge broadcasts pool changes.

---

## Phase 2: Rewrite midi-mapper.js — 3 New Modes (10 tasks)

### [x] T2.1 — Remove 5 legacy mode implementations
**Files**: `server-bridge/midi-mapper.js`  
**Description**: Delete all code for chaos, scale, theremin, chord, arp modes. Remove SCALES, KEY_TO_ROOT constants if no longer needed (chords reuse scale logic). Remove CHORD_VOICINGS. Remove ARP_SUBDIVISIONS, ARP_PATTERNS.  
**Acceptance**: No references to 'chaos', 'scale', 'theremin', 'chord' (old mode), 'arp' in processSensor. Tests for these modes removed.

### [x] T2.2 — Implement ChordSpace mode
**Files**: `server-bridge/midi-mapper.js`  
**Description**: Implement ChordSpace class/method with:
- accel.x zone detection (5 zones with hysteresis: 250ms hold timer)
- accel.y progression degree detection (4 zones)
- Chord tone calculation: root + semitone offset (0, +4, dead, +10, +14)
- Progression root transposition: I=0, IV=+5, V=+7, vi=+9
- Orientation.α gate with 5° Schmitt trigger hysteresis
- Dead zone fade out (~200ms CC 11 ramp)
- Pitch bend from gyro.α
- CC mapping (mode-specific): CC 1=accel.z, CC 2=accel.y, CC 11=orientation.β (40-100), etc.
- Note On/Off on zone change or gate  
**Acceptance**: Moving accel.x through zones changes chord tone. Tilt accel.y changes progression. Rotating phone past 45° enables gate. All CCs map correctly. Dead zone fades smoothly.

### [x] T2.3 — Implement Drums mode
**Files**: `server-bridge/midi-mapper.js`  
**Description**: Implement Drums class/method with:
- Spike detection per axis (X/Y/Z) using derivative
- Threshold: 8 m/s² for kick/snare/crash
- Velocity mapping from spike magnitude
- Hit cooldowns: kick 100ms, snare 80ms, crash 200ms, toms 120ms
- GM drum mapping: kick=36, snare=38, crash=49, HH closed=42, HH open=46, tom low=47, tom mid=48, tom high=50, ride=51
- Hi-hat openness via gyro.α (CC 4: 0=closed, 127=open)
- Tom selection via gyro.β angle
- Rhythm pattern selector via orientation.α (4 zones → rock/latin/electronic/free)
- Pattern affects accent velocity of triggered hits only (no auto-generation)  
**Acceptance**: Shaking in X triggers kick. Shaking in Y triggers snare. Twist controls hi-hat. Orientation selects pattern. Note On only (no Note Off). Cooldowns prevent machine-gunning.

### [x] T2.4 — Implement GestureCanvas mode
**Files**: `server-bridge/midi-mapper.js`  
**Description**: Implement GestureCanvas class/method with:
- Gesture speed: sqrt(gyro.α² + gyro.β² + gyro.γ²) → CC 1 + CC 74
- Gesture direction: atan2(gyro.β, gyro.α) → CC 10
- Gesture size: sqrt(accel.x² + accel.y² + accel.z²) - 9.8 → CC 91 + CC 93
- Motion complexity: derivative of direction over time → CC 71 + CC 16
- Circularity: rolling 500ms buffer, correlation of (gyro.α, gyro.β) → CC 17
- Scene selector: orientation.α 4 zones → CC 7 (0=pad, 1=pluck, 2=swell, 3=noise)
- NO Note On/Off messages
- All CCs at 30fps
- Edge case: if gyro buffer not full, return 0 for circularity  
**Acceptance**: Moving phone changes CC values. No Note On/Off sent. Circularity returns 0 until buffer fills. Stationary phone sends all zeros (VST silent).

### [x] T2.5 — Refactor processSensor() to dispatch by mode
**Files**: `server-bridge/midi-mapper.js`  
**Description**: The main `processSensor(slot, sensorData)` method checks per-slot mode and dispatches to the correct mode handler. Maintain backward compatibility by defaulting to ChordSpace for unknown modes.  
**Acceptance**: processSensor handles all 3 modes correctly. Unknown mode defaults to ChordSpace.

### [x] T2.6 — Write ChordSpace unit tests (10+)
**Files**: `tests/server-bridge/midi-mapper.test.js`  
**Description**:  
- T-CHORD-001: accel.x zone 0 maps to root note
- T-CHORD-002: accel.x zone 1 maps to 3rd
- T-CHORD-003: accel.x zone 2 (dead zone) sends fade CC
- T-CHORD-004: accel.x zone 3 maps to 7th
- T-CHORD-005: accel.x zone 4 maps to tension (9th)
- T-CHORD-006: accel.y zone 0 = I, zone 1 = IV, zone 2 = V, zone 3 = vi
- T-CHORD-007: Progression root transposition (+0, +5, +7, +9)
- T-CHORD-008: Gate opens at 45° (with 5° hysteresis)
- T-CHORD-009: Gate closes at 40° (hysteresis)
- T-CHORD-010: Volume CC 11 bounded 40-100
- T-CHORD-011: Zone change hysteresis 250ms
- T-CHORD-012: Pitch bend from gyro.α

### [x] T2.7 — Write Drums unit tests (10+)
**Files**: `tests/server-bridge/midi-mapper.test.js`  
**Description**:  
- T-DRUM-001: X spike triggers kick (note 36)
- T-DRUM-002: Y spike triggers snare (note 38)
- T-DRUM-003: Z spike triggers crash (note 49)
- T-DRUM-004: Velocity proportional to spike magnitude
- T-DRUM-005: Cooldown prevents repeated hits
- T-DRUM-006: gyro.α maps to CC 4 (hi-hat openness)
- T-DRUM-007: gyro.β selects correct tom (47/48/50)
- T-DRUM-008: orientation.α 4 zones select 4 patterns
- T-DRUM-009: No Note Off sent
- T-DRUM-010: Spike below threshold does NOT trigger

### [x] T2.8 — Write GestureCanvas unit tests (10+)
**Files**: `tests/server-bridge/midi-mapper.test.js`  
**Description**:  
- T-GEST-001: Speed maps to CC 1 + CC 74
- T-GEST-002: Direction maps to CC 10
- T-GEST-003: Size maps to CC 91 + CC 93
- T-GEST-004: Complexity maps to CC 71 + CC 16
- T-GEST-005: Circularity maps to CC 17
- T-GEST-006: orientation.α maps to CC 7 (scene)
- T-GEST-007: No Note On/Off events
- T-GEST-008: Zero gyro → all CCs at 0
- T-GEST-009: Circularity = 0 until buffer full
- T-GEST-010: Buffer resets on mode change

### [x] T2.9 — Write legacy removal tests (3+)
**Files**: `tests/server-bridge/midi-mapper.test.js`  
**Description**:  
- T-LEGACY-001: Mode 'chaos' not recognized (defaults to ChordSpace)
- T-LEGACY-002: Mode 'scale' not recognized
- T-LEGACY-003: Mode 'theremin' not recognized

---

## Phase 3: Pool Routing in Bridge (5 tasks)

### [x] T3.1 — Add pool assignment logic
**Files**: `server-bridge/index.js`  
**Description**: Add `assignChannel(slot, mode)` function that:
- Maintains `POOL_MAP = { chordspace: [1,2,3,4,5,6], drums: [7,8], gesturecanvas: [9,10] }`
- Tracks which channels are occupied per pool
- Wraps to first channel when pool is full
- Returns channel number  
**Acceptance**: First ChordSpace phone gets CH 1. Sixth gets CH 6. Seventh gets CH 1 (wrap).

### [x] T3.2 — Handle modeChange messages from phone
**Files**: `server-bridge/index.js`  
**Description**: Add handler for `{type: "modeChange", mode: "drums"}`:
1. Validate mode is valid
2. Send Note Off for any held notes on old channel
3. Call `assignChannel(slot, newMode)`
4. Update per-slot state with new mode + channel
5. Broadcast `/system/assign` to p5 players
6. Send `{type: "modeChanged", mode: "drums", channel: 7}` back to phone
7. Rate-limit: 500ms minimum between mode changes  
**Acceptance**: Changing mode on phone triggers channel re-assignment. Note Off sent for old notes. Bridge logs show mode change.

### [x] T3.3 — Add GET /api/pools endpoint
**Files**: `server-bridge/index.js`  
**Description**: Add HTTP endpoint returning:
```json
{
  "pools": {
    "chordspace": { "active": 3, "max": 6, "channels": [1,2,3,4,5,6] },
    "drums": { "active": 1, "max": 2, "channels": [7,8] },
    "gesturecanvas": { "active": 0, "max": 2, "channels": [9,10] }
  }
}
```
**Acceptance**: `curl http://localhost:8080/api/pools` returns correct JSON with pool stats.

### [x] T3.4 — Remove --mode CLI flag
**Files**: `server-bridge/index.js`  
**Description**: Remove the `--mode` CLI argument parser. If passed, ignore with a warning. Modes are now per-phone only. Remove all references to `options.midiMode`.  
**Acceptance**: `node index.js --mode scale` starts without error (warning logged). No global mode stored.

### [x] T3.5 — Write pool routing tests (5+)
**Files**: `tests/server-bridge/midi-integration.test.js`  
**Description**:  
- T-POOL-001: First phone gets CH 1 in ChordSpace
- T-POOL-002: 7th phone wraps to CH 1
- T-POOL-003: Drums phone gets CH 7
- T-POOL-004: Mode change re-assigns channel
- T-POOL-005: Note Off sent on mode change
- T-POOL-006: /api/pools returns correct counts

---

## Phase 4: Musical State → p5 Visuals (4 tasks)

### [x] T4.1 — Add musical state generator in bridge
**Files**: `server-bridge/index.js`  
**Description**: After processing sensor data, generate a musical state object per slot and broadcast to all p5 players:
```javascript
function generateMusicalState(slot, mode, midiEvents) {
  switch (mode) {
    case 'chordspace':
      return { type: 'musicalState', slot, mode, chordDegree, chordTone, noteName, noteNumber, velocity, gateOpen, volume };
    case 'drums':
      return { type: 'musicalState', slot, mode, lastHit, lastNote, velocity, pattern };
    case 'gesturecanvas':
      return { type: 'musicalState', slot, mode, speed, direction, size, complexity, scene };
  }
}
```
Broadcast at ~10fps (not 30fps — visuals don't need full rate).  
**Acceptance**: Bridge sends musicalState messages to p5 players. Rate is throttled to 10fps.

### [x] T4.2 — Add musicalState handler in p5 sketch
**Files**: `p5-sketch/sketch.js`  
**Description**: Add handler for `musicalState` messages in the OSC/WebSocket message loop. Store per-slot musical state object alongside sensor data.  
**Acceptance**: p5 sketch receives and stores musical state without errors.

### [x] T4.3 — Update visuals.js to use musical state for brush modulation
**Files**: `p5-sketch/visuals.js`  
**Description**: 
- Remove radial layout constraint (no more angular wedges). Canvas is free: X=accel.x, Y=accel.y mapped to 0-width, 0-height.
- Modulate brush color from musical state: `hue = (noteNumber * 3) % 360` for ChordSpace, or mode-specific color mapping
- Modulate brush size from velocity/speed
- Add effects: gateOpen → brush opacity, drum hit → flash pulse, gesture complexity → jitter/noise
- Keep existing brush types (classic, neon, pixel, etc.) but color/size/effects are now driven by musical state
- The 30 visual types in config become brush style presets  
**Acceptance**: Brush color follows musical note. Accel controls position. Gate affects opacity. Drum hits produce visual pulses. All 30 slots draw independently.

### [x] T4.4 — Write visual tests (5+)
**Files**: `tests/p5-sketch/visuals.test.js`  
**Description**:  
- T-VIS-001: Musical state sets brush color correctly
- T-VIS-002: Sensor data controls position
- T-VIS-003: Gate open/closed affects opacity
- T-VIS-004: Drum hit produces visual pulse
- T-VIS-005: All 30 slots render independently

---

## Phase 5: Tone.js Removal (3 tasks)

### [x] T5.1 — Delete sound-engine.js
**Files**: `p5-sketch/sound-engine.js`  
**Description**: Delete the file. Remove all `require` or `import` references to it from other files.  
**Acceptance**: File no longer exists. No dangling imports.

### [x] T5.2 — Remove Tone.js from index.html and sketch.js
**Files**: `p5-sketch/index.html`, `p5-sketch/sketch.js`  
**Description**: 
- index.html: remove `<script src="...tone.js...">` line
- sketch.js: remove `Tone.start()`, remove `started` boolean flag, remove `mousePressed` handler for audio context, simplify `setup()`  
**Acceptance**: p5 sketch loads without Tone.js. No JS console errors. Visual rendering works.

### [x] T5.3 — Simplify device-manager.js to visual-only
**Files**: `p5-sketch/device-manager.js`  
**Description**: Remove `SoundEngine` constructor parameter. Remove all `engine.createVoice()`, `engine.updateVoice()`, `engine.disposeVoice()` calls. `assign()` only creates visual state. `update()` only updates sensor data + musical state + visual. `disconnect()` only disposes visual.  
**Acceptance**: DeviceManager works without SoundEngine. All slot lifecycle methods are visual-only.

---

## Phase 6: Test Suite Cleanup + Documentation (2 tasks)

### [x] T6.1 — Clean up old mode tests
**Files**: `tests/server-bridge/midi-mapper.test.js`, `tests/server-bridge/midi-integration.test.js`  
**Description**: Remove all test cases that reference old modes (chaos, scale, theremin, chord, arp). Replace with new mode tests. Ensure total test count: ~50+ new tests.  
**Acceptance**: No old mode tests remain. All tests pass: `npm test` → 0 failures.

### [x] T6.2 — Update documentation
**Files**: `docs/REAPER-3POOL-TEMPLATE.md`, `docs/MIDI-SETUP.md`, `docs/DAW-INTEGRATION.md`  
**Description**: 
- REAPER template: add per-mode CC mapping tables (ChordSpace, Drums, GestureCanvas each have their own table)
- MIDI-SETUP: replace old mode reference with new 3 modes, remove `--mode` CLI flag docs
- DAW-INTEGRATION: update mode descriptions
- README: add musical state section, update architecture diagram  
**Acceptance**: All docs reflect the new 3-mode system. No references to old modes.

---

## Summary

| Phase | Tasks | Files Changed | Tests Added |
|-------|-------|---------------|-------------|
| 1. Phone Mode Selector | 4 | app.js, index.html, style.css | 3 |
| 2. MidiMapper Rewrite | 9 | midi-mapper.js, test file | 33+ |
| 3. Pool Routing | 5 | index.js, test file | 6 |
| 4. Musical State → Visuals | 4 | index.js, visuals.js, device-manager.js, sketch.js | 5 |
| 5. Tone.js Removal | 3 | sound-engine.js (DEL), index.html, sketch.js, device-manager.js | 3 |
| 6. Cleanup + Docs | 2 | test files, docs | — |
| **Total** | **28** | ~15 files | ~50+ |
