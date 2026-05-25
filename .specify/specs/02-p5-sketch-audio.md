# Phase 2 — p5 Sketch: Audio Engine & Device Manager

**Status**: Ready for implementation
**Priority**: P1 — Must be built after Phase 1 (bridge server)
**Dependencies**: p5.js, Tone.js, WebSocket API (browser-native)

---

## Architecture

```
┌─────────────────┐     WebSocket (JSON)     ┌────────────────────────────────────┐
│  Bridge Server  │ ─────────────────────────>│        p5 Sketch (local browser)   │
│  (localhost:8080)│                          │                                    │
│                 │  /system/assign {slot}    │  sketch.js                         │
│                 │  /system/disconnect {slot}│   ├── config.js (30-slot params)   │
│                 │  /system/count {count}    │   ├── sensor-mapper.js (norm→0-1)  │
│                 │  /device/{slot}/{type}    │   ├── audio-bus.js (shared FX)     │
│                 │                          │   ├── sound-engine.js (30 voices)   │
│                 │                          │   ├── device-manager.js (lifecycle) │
│                 │                          │   └── index.html (CDN deps)        │
└─────────────────┘                          └────────────────────────────────────┘
```

**Key decisions** (from architecture analysis):
- **Raw JSON WebSocket** for bridge→p5 (not osc-js) — drop OSC for v1, add `--osc` flag later
- **Normalize sensor values to 0..1** in sensor-mapper.js before passing to voices
- **Shared reverb/delay send busses** — not 30 instances of each FX
- **30 Tone.js voices** = ~120–180 AudioNodes — well within WebAudio limits
- **Granular maxGrains=8** — cap to prevent audio glitching
- **Hybrid module architecture**: SensorMapper + AudioBus as pure JS classes, SoundEngine as Tone.js wrapper
- **Voice disposal sequence** critical: disconnect nodes in reverse order before nulling references
- **frameRate(30)** from p5 start to keep draw budget manageable
- **Protocol version field `"v": 1`** from day one

---

## What To Build

A **p5.js + Tone.js sketch** at `p5-sketch/` that:

1. Connects to the bridge server via native WebSocket (port 8080)
2. Listens for `/system/*` lifecycle events (assign, disconnect, count)
3. Listens for `/device/*/sensor` data from each connected phone
4. Normalizes raw sensor values to 0..1 via config-defined ranges
5. Creates/destroys Tone.js voice signal chains per slot assignment
6. Maps sensor data to voice parameters per the 30-type table
7. Shares reverb/delay FX busses across all voices
8. Displays a radial HUD showing connected devices

---

## Module Details

### p5-sketch/index.html

```html
CDN dependencies (loaded in order):
  - p5.js 1.9+        — https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js
  - Tone.js 14.7+     — https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js

Script loading order:
  1. config.js         (data/config, no deps)
  2. sensor-mapper.js  (pure function, no deps)
  3. audio-bus.js      (Tone.js only)
  4. sound-engine.js   (Tone.js + AudioBus + SensorMapper)
  5. device-manager.js (SoundEngine + config)
  6. sketch.js         (p5 + DeviceManager + WebSocket)
```

Design: Minimal dark background (#0a0a0a), centered canvas. HUD overlay showing device count.

**AudioContext start**: Tone.start() on mousePressed — required by browser autoplay policy.

### p5-sketch/config.js — 30-Slot Configuration

**CONSTANTS**:
```js
const CONFIG = {
  maxDevices: 30,
  bridgeUrl: "ws://localhost:8080",   // default, user edits
  canvasWidth: 1600,
  canvasHeight: 900,
  centerX: 800,
  centerY: 450,
  baseRadius: 300,
  frameRate: 30,
  
  // Each slot config
  slots: [ /* 30 entries */ ]
};
```

Each slot entry:
```js
{
  soundType: "synthBasic",              // 1 of 30 types
  slotIndex: 0,
  color: { h: 0, s: 80, b: 90 },       // hue = slotIndex * 12°
  sensorMap: {
    freq:    { source: "accel", axis: "y", range: [50, 2000], curve: "linear" },
    filter:  { source: "gyro",  axis: "z", range: [200, 8000], curve: "exponential" }
  }
}
```

**Color wheel**: `hue = slotIndex * 12` (fixed, matches 30 visuals in Phase 3)

**30 sound types with sensor mappings** (abbreviated in config — full mapping reference in PLAN.md):
| i | type | sensor→param 1 | sensor→param 2 |
|---|------|----------------|----------------|
| 0 | synthBasic | accel.y→pitch (50-2000) | gyro.z→filter (200-8000) |
| 1 | synthFM | accel.x→modIndex (0.1-20) | orient.β→carrier (100-2000) |
| 2 | synthAM | gyro.α→depth (0-1) | accel.z→modFreq (0.5-20) |
| 3 | synthDuo | orient.γ→detune (0-50) | accel.y→mix (0-1) |
| 4 | synthMono | gyro.β→glide (0-1) | accel.x→portamento (0-0.5) |
| 5 | arpRate | orient.β→rate (0.1-10) | accel.x→spread (1-4) |
| 6 | arpPattern | gyro.z→pattern (0-3) | accel.y→octave (1-4) |
| 7 | arpGate | orient.α→gate (0.01-0.5) | gyro.α→swing (0-0.5) |
| 8 | arpDirection | accel.z→dir (0-3) | gyro.β→steps (2-16) |
| 9 | noiseWhite | accel.z→cutoff (200-8000) | gyro.α→resonance (0-20) |
| 10 | noisePink | orient.γ→volume (0-1) | accel.x→pan (-1-1) |
| 11 | noiseBrown | gyro.β→lfoRate (0.1-10) | accel.y→lfoDepth (0-1) |
| 12 | kick | accelMag→trigger threshold | gyro.z→pitch (40-150) |
| 13 | snare | orient.β→noiseMix (0-1) | accel.y→decay (0.1-0.8) |
| 14 | hiHat | gyro.α→cutoff (2000-16000) | accel.z→decay (0.02-0.2) |
| 15 | drumPattern | orient.γ→speed (0.5-4) | accel.x→complexity (1-8) |
| 16 | tom | accelMag→trigger threshold | gyro.β→pitchDrop (0-200) |
| 17 | bitcrush | accel.x→bits (1-16) | gyro.z→sampleRate (1000-44100) |
| 18 | stutter | orient.γ→bufSize (0.05-0.5) | accel.y→rate (0.25-4) |
| 19 | wavefold | gyro.α→fold (1-20) | accel.z→symmetry (0-1) |
| 20 | glitchRandom | accel.x→probability (0-1) | gyro.β→interval (0.1-2) |
| 21 | grainSize | gyro.β→grainSize (0.01-0.5) | accel.y→pitch (0.5-2) |
| 22 | grainDensity | orient.α→density (1-50) | accel.z→spread (0-1) |
| 23 | grainScatter | gyro.γ→position (0-1) | accel.x→panSpread (0-1) |
| 24 | grainPosition | accel.y→bufPos (0-1) | gyro.α→overlap (0-0.5) |
| 25 | reverb | orient.α→roomSize (0.1-0.9) | accel.z→wetDry (0-1) |
| 26 | delay | gyro.β→time (0.05-0.8) | accel.y→feedback (0-0.9) |
| 27 | distortion | accel.x→amount (0-1) | gyro.γ→gain (0-2) |
| 28 | chorus | orient.β→depth (0-10) | gyro.α→rate (0.1-5) |
| 29 | compressor | accel.z→threshold (-60-0) | gyro.β→ratio (1-20) |

### p5-sketch/sensor-mapper.js — Sensor Normalization, Smoothing, Curve Mapping

**Purpose**: Convert raw sensor values → 0..1 normalized → mapped to parameter ranges.

Module exports a `SensorMapper` object (stateless functions):

```js
const SensorMapper = {
  // Normalize raw sensor value to 0..1 given known min/max
  normalize(value, min, max) → number (0..1, clamped)
  
  // Apply exponential moving average (EMA) smoothing
  smooth(prev, current, coefficient) → number
  
  // Map normalized 0..1 through curve type to output range
  mapCurve(normalized, outMin, outMax, curveType) → number
  
  // High-level: get normalized value for a sensor source
  getSensorValue(sensorData, source, axis, sensorConfig) → number
};
```

**Normalization ranges**:
- accel: ±9.81 m/s² → normalize to -10..10 → abs/map to 0..1
- gyro: ±2000°/s → normalize to -2000..2000 → abs/map to 0..1
- orientation.alpha: 0..360 → map to 0..1
- orientation.beta: -180..180 → map to -1..1 → rectify to 0..1
- orientation.gamma: -90..90 → same as beta

**Smoothing**: EMA filter with configurable coefficient per axis (default 0.3).

**Curve types**:
- `"linear"`: direct proportional mapping
- `"exponential"`: pow(normalized, 2) → amplifies low values
- `"logarithmic"`: pow(normalized, 0.5) → amplifies high values
- `"inverse"`: 1.0 - normalized → inverts control direction

### p5-sketch/audio-bus.js — Shared FX Busses & Master Chain

**Purpose**: Single shared reverb + delay + compressor across all 30 voices.

```js
class AudioBus {
  constructor()
  
  // Master chain: masterGain → limiter → destination
  get masterGain() → Tone.Gain
  
  // Reverb send: returns { send, return }
  // send: connect voice output here → internal mix → reverb → return channel
  get reverbSend() → Tone.Gain
  
  // Delay send: same pattern
  get delaySend() → Tone.Gain
  
  // Master output limiter (hard ceiling at -1dBFS)
  get limiter() → Tone.Limiter
  
  // FX modulation slots 25-29
  setReverbParam(param, value)   // roomSize, wet, decay
  setDelayParam(param, value)    // delayTime, feedback, wet
  setMasterVolume(value)         // 0..1
  
  // Cleanup
  dispose()
}
```

**Signal flow**:
```
Voice Output ──┬─→ masterGain → limiter → destination
               ├─→ reverbSend → reverb → returnGain → masterGain
               └─→ delaySend → delay → returnGain → masterGain
```

**Slots 25-29 special**: These slots modulate the FX bus parameters (reverb room, delay time, etc.) instead of creating independent voice chains. Config stores `isFxModulator: true` for these slots.

### p5-sketch/sound-engine.js — 30 Voice Types

**Purpose**: Factory for creating/disposing/updating Tone.js voice signal chains.

```js
class SoundEngine {
  constructor(audioBus)
  
  // Factory: returns voice instance based on soundType
  createVoice(slot, config) → VoiceHandle
  
  // Update voice parameters from sensor data
  updateVoice(voice, sensorData, config) → void
  
  // Dispose voice — critical: disconnect nodes in REVERSE order
  disposeVoice(voice) → void
  
  // 30 voice type implementations (private methods)
  _createSynthBasic(slot, config) → VoiceHandle
  _createSynthFM(slot, config) → VoiceHandle
  // ... one per type
  
  _mapSynthBasic(voice, sd, config) → void
  _mapSynthFM(voice, sd, config) → void
  // ... one per type
}
```

**VoiceHandle** structure:
```js
{
  type: "synthBasic",
  slot: 0,
  nodes: { osc, filter, env, gain, ... },   // all Tone.js node references
  sendGains: { reverb: 0.3, delay: 0.1 },    // send levels
  lastSensorData: { ... },                    // for smoothing
  isTriggered: false,                         // for drum types
  dispose: function()                         // cleanup function
}
```

**Per-type signal chains** (categories):

| Category | Types | Chain |
|----------|-------|-------|
| **Synth** | synthBasic, synthFM, synthAM, synthDuo, synthMono | Osc → Filter → Envelope → Gain → master |
| **Arp** | arpRate, arpPattern, arpGate, arpDirection | Osc + Tone.Pattern → Filter → Gain → master (has internal sequencer) |
| **Noise** | noiseWhite, noisePink, noiseBrown | Noise → Filter → Gain → pan → master |
| **Drum** | kick, snare, hiHat, tom | Tone.MembraneSynth / Tone.MetalSynth / Noise → Envelope → Gain → master (trigger-based) |
| **DrumPattern** | drumPattern | Tone.MembraneSynth array + Tone.Sequence → master |
| **FX** | bitcrush, stutter, wavefold, glitchRandom | Osc → BitCrusher / WaveShaper → Gain → master |
| **Granular** | grainSize, grainDensity, grainScatter, grainPosition | Custom grain scheduler using Tone.ToneBufferSource or Osc → Gain array (maxGrains=8) |
| **FX Bus Mod** | reverb, delay, distortion, chorus, compressor | These modulate the shared audio-bus FX params, no independent voice chain |

**Drum trigger detection**: When `accelMagnitude` exceeds a configurable threshold (default 15 m/s²), call `voice.nodes.drum.triggerAttackRelease(duration, time)`.

**Arp implementation**: Uses `Tone.Pattern` or manual `Tone.Counter` + setInterval-like scheduling via Transport. Each arp voice gets its own pattern and rate.

**Granular implementation**: Simplified approach — use short oscillator bursts or noise grains scheduled via `Tone.Transport` + counter. Max 8 simultaneous grains per voice.

### p5-sketch/device-manager.js — Slot Lifecycle & Data Routing

```js
class DeviceManager {
  constructor(soundEngine, config)
  
  // Slot lifecycle
  assign(slot) → void     // create voice via soundEngine
  disconnect(slot) → void // dispose voice, free slot
  get activeCount → number
  
  // Data routing
  updateSensor(slot, sensorType, data) → void
  //   - Look up config.slots[slot].sensorMap
  //   - Call SensorMapper.getSensorValue() for each param
  //   - Call soundEngine.updateVoice() with mapped values
  
  // Rendering
  drawHUD() → void        // draw radial layout with slot indicators
  
  // State
  get isSlotActive(slot) → boolean
  get activeSlots() → number[]
  
  // Cleanup
  disposeAll() → void
}
```

**Radial HUD**: For each active slot, draw a colored dot at `angle = (slot / maxDevices) * TWO_PI`, positioned at `{centerX + cos(angle) * baseRadius, centerY + sin(angle) * baseRadius}`. Color = config color. Size reflects signal activity.

### p5-sketch/sketch.js — Main Entry Point

```js
let dm, ws, started = false;

function setup() {
  createCanvas(CONFIG.canvasWidth, CONFIG.canvasHeight);
  colorMode(HSB, 360, 100, 100);
  frameRate(CONFIG.frameRate);
  
  const audioBus = new AudioBus();
  const engine = new SoundEngine(audioBus);
  dm = new DeviceManager(engine, CONFIG);
  
  // WebSocket connection to bridge
  connectWebSocket();
}

function draw() {
  background(0, 0, 8);
  dm.drawHUD();
}

function mousePressed() {
  if (!started) { Tone.start(); started = true; }
}

function connectWebSocket() {
  ws = new WebSocket(CONFIG.bridgeUrl);
  
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "player", v: 1 }));
  };
  
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    handleMessage(msg);
  };
  
  ws.onclose = () => {
    setTimeout(connectWebSocket, 3000); // reconnect
  };
}

function handleMessage(msg) {
  switch (msg.type) {
    case "system":
      switch (msg.event) {
        case "assign":      dm.assign(msg.slot); break;
        case "disconnect":  dm.disconnect(msg.slot); break;
        case "count":       /* update HUD count */ break;
      }
      break;
    case "sensor":
      dm.updateSensor(msg.slot, msg.sensor, msg.data);
      break;
  }
}
```

---

## TDD Requirements

### Existing Test Stubs (must convert to real tests)

**tests/p5-sketch/sensor-mapper.test.js** — 14 test.todo → real tests:
- normalize accel.x from -10..10 to 0..1
- return 0.5 for accel.x = 0 (midpoint)
- clamp values outside range
- normalize orientation.alpha 0..360 to 0..1
- EMA smoothing coefficient behavior
- linear/exponential/logarithmic/inverse curve mapping
- map accel.y to pitch 50..2000 Hz
- map gyro.z to filter 200..8000 Hz
- handle null/undefined sensor values gracefully

**tests/p5-sketch/audio-bus.test.js** — 6 test.todo → real tests:
- master gain connected to destination
- shared reverb send bus exists
- shared delay send bus exists
- reverb send gain ranges 0..1
- master limiter prevents output exceeding -1dBFS
- slots 25-29 modulate FX bus params, not create new voices

### New Tests to Write (not yet scaffolded)

**tests/p5-sketch/sound-engine.test.js** — ~15 tests:
- createVoice returns VoiceHandle with correct type
- createVoice for all 30 types returns valid handles
- updateVoice sets correct parameter values
- disposeVoice disconnects all nodes (verify no errors)
- trigger-based types (kick, snare, hiHat, tom) respond to threshold
- arp types create pattern with correct rate
- granular types respect maxGrains=8
- FX modulator slots don't create voice chains
- re-creating same slot after dispose works

**tests/p5-sketch/device-manager.test.js** — ~8 tests:
- assign creates voice, disconnect destroys it
- updateSensor routes data through sensor mapper
- activeCount reflects correct number
- assign same slot twice disposes first voice
- drawHUD doesn't throw
- disposeAll clears all voices

**tests/p5-sketch/bridge-connection.test.js** — ~5 tests:
- WebSocket connects to bridge on setup
- send player registration on connect
- handleMessage routes system events correctly
- handleMessage routes sensor events correctly
- reconnect on close with backoff

---

## Implementation Order

```
Phase 2a: Foundation (blocking)
  Step 1: p5-sketch/index.html — CDN deps + script loading
  Step 2: p5-sketch/config.js — Full 30-slot configuration
  Step 3: p5-sketch/sensor-mapper.js — Normalize, smooth, curve map

Phase 2b: Core Audio (blocking)
  Step 4: tests/p5-sketch/sensor-mapper.test.js — Convert 14 todos → real tests (TDD RED)
  Step 5: tests/p5-sketch/audio-bus.test.js — Convert 6 todos → real tests (TDD RED)
  Step 6: p5-sketch/audio-bus.js — Shared FX busses + master chain
  Step 7: p5-sketch/sound-engine.js — All 30 voice types (implement AFTER audio-bus)

Phase 2c: Device Lifecycle
  Step 8: tests/p5-sketch/sound-engine.test.js — Write ~15 new tests (TDD RED)
  Step 9: tests/p5-sketch/device-manager.test.js — Write ~8 new tests (TDD RED)
  Step 10: p5-sketch/device-manager.js — Slot lifecycle + data routing
  Step 11: p5-sketch/sketch.js — Main entry point + WebSocket

Phase 2d: Integration
  Step 12: Run ALL tests — verify ~43 tests pass
  Step 13: Manual integration — start bridge, connect simulator, verify audio
  Step 14: Graphify update + atomic commits
```

---

## Integration Test Plan

```bash
# Terminal 1: Start bridge
cd server-bridge && node index.js

# Terminal 2: Start p5 sketch
cd p5-sketch && npx http-server -p 3000 -c-1
# Open http://localhost:3000 in browser

# Terminal 3: Connect 3 simulated phones
node scripts/simulate-phones.js --count 3 --duration 30

# Expected:
# - Browser shows 3 colored dots on radial HUD
# - Audio output changes as simulated phones move
# - Console shows assign/disconnect events
```

---

## Key Behaviors to Verify

- [ ] p5 sketch connects to bridge and receives slot assignments
- [ ] Each assigned slot creates an audible Tone.js voice
- [ ] Sensor data maps to correct voice parameter ranges
- [ ] Disconnected phones remove their voice (no audio leak)
- [ ] Reverb/delay send busses are shared across all voices
- [ ] 30 simultaneous voices don't cause audio glitching
- [ ] AudioContext starts on first user click (browser policy)
- [ ] WebSocket reconnects automatically if bridge restarts
- [ ] Granular voices respect maxGrains=8
- [ ] Slots 25-29 modulate FX bus instead of creating voice chains
