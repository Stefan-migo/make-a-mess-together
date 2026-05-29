# Technical Plan: New Mapping System (10-new-mapping-system)

## Overview

Replace 5 legacy MIDI modes with 3 richer modes (ChordSpace, Drums, GestureCanvas), dynamic pool routing, musical state feedback to p5, and Tone.js removal.

---

## Phase 1: Mode Selector in Phone Client

### What
Add mode selection before WebSocket connection. Phone shows 3 buttons (ChordSpace/Drums/GestureCanvas). Selected mode is included in the initial WebSocket message.

### Files
- `phone-client/app.js` — mode selector UI + mode in connection message
- `phone-client/index.html` — mode selector HTML

### Key Changes
- Before connect screen shows:
```
┌────────────────────┐
│ Elige tu modo:     │
│                    │
│ [ChordSpace]       │
│ [Drums]            │
│ [GestureCanvas]    │
│                    │
│ Bridge IP: [___]   │
│ [Connect]          │
└────────────────────┘
```
- Connection message becomes: `{type: "sensor", mode: "chordspace"}`
- During session: mode buttons persist at bottom of UI
- Mode change: `{type: "modeChange", mode: "drums"}`
- Mode buttons show pool capacity: "ChordSpace (3/6)"

### Tests
- T-MODE-001: Init sends mode in connection message
- T-MODE-002: Mode change sends correct message type
- T-MODE-003: UI shows correct pool capacity from bridge response

---

## Phase 2: Rewrite midi-mapper.js (3 New Modes)

### What
Complete rewrite of `midi-mapper.js`. Remove 5 legacy modes (chaos, scale, theremin, chord, arp). Add 3 new modes: ChordSpace, Drums, GestureCanvas.

### ChordSpace Implementation

```javascript
class MidiMapperChordSpace {
  processSensor(sensorData, config) {
    // 1. Calculate chord progression root from accel.y zones
    const progressionRoot = getProgressionRoot(config.key, accelYZone(accel.y));
    
    // 2. Calculate chord tone from accel.x zones
    const chordTone = getChordTone(accel.x, progressionRoot); // returns MIDI note
    
    // 3. Check compass gate (orientation.alpha with 5° hysteresis)
    const gateOpen = isGateOpen(orientation.a, previousOrientationA);
    
    // 4. Build note events (with fade for dead zone)
    const noteEvents = buildNoteEvents(chordTone, gateOpen, previousState);
    
    // 5. Map CCs (mode-specific)
    const ccEvents = [
      {cc: 1, value: mapAccelZ(accel.z)},      // filter cutoff
      {cc: 2, value: mapAccelY(accel.y)},       // modulation
      {cc: 11, value: mapVolume(orientation.b)}, // expression (bounded 40-100)
      // ... etc
    ];
    
    return [...noteEvents, ...ccEvents, pitchBendEvent];
  }
}
```

### Drums Implementation

```javascript
class MidiMapperDrums {
  processSensor(sensorData, config, previousSensorData) {
    // 1. Spike detection on each axis (derivative)
    const kickSpike = detectSpike(accel.x, previousAccel.x, THRESHOLD);
    const snareSpike = detectSpike(accel.y, previousAccel.y, THRESHOLD);
    const crashSpike = detectSpike(accel.z, previousAccel.z, THRESHOLD);
    
    // 2. Apply cooldowns per hit type
    // 3. Map to GM drum notes + velocity
    // 4. Continuous controls: hi-hat (gyro.a), toms (gyro.b), pattern (orientation.a)
    // 5. Pattern selector affects accent velocity mapping only
  }
}
```

### GestureCanvas Implementation

```javascript
class MidiMapperGestureCanvas {
  constructor() {
    this.gyroBuffer = []; // rolling 500ms buffer for circularity
  }
  
  processSensor(sensorData) {
    // 1. Speed: sqrt(gyro.a² + gyro.b² + gyro.g²) → CC 1 + CC 74
    // 2. Direction: atan2(gyro.b, gyro.a) → CC 10
    // 3. Size: sqrt(accel.x² + accel.y² + accel.z²) - 9.8 → CC 91 + CC 93
    // 4. Complexity: d/dt of direction → CC 71 + CC 16
    // 5. Circularity: correlation over 500ms buffer → CC 17
    // 6. NO Note On/Off events
  }
}
```

### Files
- `server-bridge/midi-mapper.js` — complete rewrite

### Tests
- T-CHORD-001 to T-CHORD-015: ChordSpace zone detection, chord tones, gate, hysteresis, fade
- T-DRUM-001 to T-DRUM-015: Spike detection, cooldown, GM note mapping, rhythm patterns
- T-GEST-001 to T-GEST-015: Speed/direction/size/complexity/circularity, CC mapping, no-note guarantee
- T-LEGACY-001: Old mode constants removed

---

## Phase 3: Pool Routing in Bridge

### What
Add dynamic pool routing to server-bridge/index.js. Handles mode-based channel assignment, mode changes with held note cleanup, and pool capacity tracking.

### Files
- `server-bridge/index.js`

### Key Changes
- `assignChannel(slot, mode)`: returns MIDI channel from pool, wraps when full
- `handleSensorMessage`: dispatches to midiMapper based on per-slot mode
- `handleModeChange`: validates mode, sends Note Off for held notes, re-assigns channel
- MusicalStateGenerator: sends musical state to p5 sketch
- Remove `--mode` CLI flag
- `GET /api/pools` endpoint

### Tests
- T-POOL-001 to T-POOL-008: Assignment, wrapping, mode change, note cleanup

---

## Phase 4: Musical State → p5 Visuals

### What
Bridge generates a "musical state" message per slot and sends it to p5 sketch via WebSocket. p5 sketch uses this data to control brush color, size, and effects.

### Bridge Side
New message type sent to p5 players:
```json
{
  "type": "musicalState",
  "slot": 3,
  "mode": "chordspace",
  "chordDegree": "I",
  "chordTone": "root",
  "noteName": "C4",
  "noteNumber": 60,
  "velocity": 100,
  "gateOpen": true,
  "volume": 75
}
```

Drums mode:
```json
{
  "type": "musicalState",
  "slot": 7,
  "mode": "drums",
  "lastHit": "kick",
  "lastNote": 36,
  "velocity": 87,
  "pattern": "rock"
}
```

GestureCanvas mode:
```json
{
  "type": "musicalState",
  "slot": 9,
  "mode": "gesturecanvas",
  "speed": 65,
  "direction": 45,
  "size": 80,
  "complexity": 30,
  "scene": 2
}
```

### p5 Sketch Side (visuals.js updates)
- Remove radial layout constraint → free canvas coordinates
- Sensor data controls brush position (X, Y)
- Musical state controls: color (hue from note/degree), size (from velocity/speed), effects (from complexity/gate)
- Brush types remain the same (classic, neon, pixel, etc.)
- The 30 visual types become brush style modifiers

### Files
- `server-bridge/index.js` — add musicalState message broadcast
- `p5-sketch/visuals.js` — add musical state inputs, free canvas, brush modulation
- `p5-sketch/device-manager.js` — handle musical state alongside sensor data
- `p5-sketch/sketch.js` — add message handler for musicalState

### Tests
- T-VIS-001 to T-VIS-005: Musical state affects brush color, size, effects
- T-VIS-006: Radial layout removed — canvas coordinates are free
- T-VIS-007: Sensor data still controls position

---

## Phase 5: Tone.js Removal

### What
Remove all audio-related code from p5-sketch. Delete sound-engine.js, remove Tone.js dependency, simplify device-manager.js.

### Files
- DELETE: `p5-sketch/sound-engine.js`
- MODIFY: `p5-sketch/index.html` — remove Tone.js CDN
- MODIFY: `p5-sketch/sketch.js` — remove Tone.start(), mousePressed handler, SoundEngine refs
- MODIFY: `p5-sketch/device-manager.js` — remove SoundEngine, visual-only lifecycle

### Tests
- T-TONE-001: p5 sketch loads without Tone.js — no errors
- T-TONE-002: DeviceManager works without SoundEngine
- T-TONE-003: Visual rendering independent of audio

---

## Phase 6: Test Suite Cleanup + Documentation

### What
Remove tests for old 5 modes. Ensure all 407+ original tests (non-mode-related) still pass. Update docs.

### Files
- Remove/modify: `tests/server-bridge/midi-mapper.test.js`
- Remove/modify: `tests/server-bridge/midi-integration.test.js`
- UPDATE: `docs/REAPER-3POOL-TEMPLATE.md` — add per-mode CC tables
- UPDATE: `docs/MIDI-SETUP.md` — reflect new mode system
- UPDATE: `docs/DAW-INTEGRATION.md` — update mode descriptions

### Tests
- T-REGRESS-001: All non-mode tests pass
- T-REGRESS-002: Bridge starts without --midi flag
- T-REGRESS-003: Old phone client connects (defaults to ChordSpace)

---

## Edge Cases

| Edge Case | Phase | Handling |
|-----------|-------|----------|
| Phone connects without mode field | P1, P3 | Default to 'chordspace' |
| 7th phone in ChordSpace | P3 | Wrap to CH 1, send musical state with wrapped=true |
| Mode change while note is held | P3 | Send Note Off, flush arp state, then re-assign |
| Rapid mode switching (anti-flutter) | P3 | 500ms minimum interval between mode changes |
| GestureCanvas buffer not full yet | P2 | Return 0 for circularity until buffer fills |
| p5 sketch not running | P4 | Musical state broadcast gracefully handles no players |
| No gyro data (old phone) | P2 | Default GestureCanvas values to 0 (silent/closed) |
