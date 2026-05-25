# Tasks: Phase 2 — p5 Sketch Audio Engine

**Input**: `.specify/specs/02-p5-sketch-audio.md` (spec) + `p5-sketch/PLAN-02.md` (tech plan)
**Prerequisites**: Phase 0 (phone simulator) + Phase 1 (bridge server) complete
**Tests**: Tests are MANDATORY per TDD constitution. Write failing tests FIRST (RED), then implement (GREEN).

---

## Phase 2a: Foundation (Steps 1-3)

**Purpose**: Set up p5-sketch entry point, configuration, and sensor math — no audio dependencies.

- [ ] **T001** Create `p5-sketch/index.html`
  - Load p5.js 1.9+ CDN, Tone.js 14.7+ CDN
  - Script loading order: config.js → sensor-mapper.js → audio-bus.js → sound-engine.js → device-manager.js → sketch.js
  - Dark background (#0a0a0a), centered canvas container
  - "Click to start audio" overlay
  - Viewport meta tag, no-scroll CSS

- [ ] **T002** Create `p5-sketch/config.js`
  - CONST object with: maxDevices (30), bridgeUrl, canvasWidth (1600), canvasHeight (900), centerX (800), centerY (450), baseRadius (300), frameRate (30)
  - slots[] array with 30 entries, each containing:
    - soundType (string matching PLAN.md 30 types)
    - slotIndex (0-29)
    - color: { h: slotIndex*12, s: 80, b: 90 }
    - sensorMap: object with param→{source, axis, range[min,max], curve}
  - Full 30-entry table matching PLAN.md sensor mappings

- [ ] **T003** Create `p5-sketch/sensor-mapper.js`
  - Module exports SensorMapper object with pure functions:
  - `normalize(value, min, max)` → 0..1 clamped
  - `smooth(prev, current, coefficient)` → EMA filter
  - `mapCurve(normalized, outMin, outMax, curveType)` → parameter value
  - `getSensorValue(sensorData, source, axis, paramConfig)` → full pipeline
  - Default curve types: linear, exponential, logarithmic, inverse
  - Default normalization ranges per sensor:
    - accel: ±9.81 → normalize to -10..10
    - gyro: ±2000 → normalize to -2000..2000
    - orientation: alpha(0-360), beta(-180-180), gamma(-90-90)

**Checkpoint**: Open p5-sketch/index.html in browser — should see dark canvas. Tests for T003 should exist and pass.

---

## Phase 2b: Core Audio (Steps 4-7)

**Purpose**: Build the audio engine with 30 voice types and shared FX busses.

- [ ] **T004** 🔴 TDD RED — Write SensorMapper tests
  - Convert `tests/p5-sketch/sensor-mapper.test.js` from 14 test.todo to real tests
  - Test normalization, smoothing, curve mapping, edge cases
  - Run `npm test` — ALL 14 must FAIL (SensorMapper doesn't exist yet)

- [ ] **T005** 🔴 TDD RED — Write AudioBus tests
  - Convert `tests/p5-sketch/audio-bus.test.js` from 6 test.todo to real tests
  - Test master gain, reverb send, delay send, limiter, FX mod slots
  - Run `npm test` — ALL 6 must FAIL

- [ ] **T006** 🟢 TDD GREEN — Implement `p5-sketch/audio-bus.js`
  - AudioBus class with:
    - constructor(): masterGain → limiter → Tone.Destination
    - reverbSend: Tone.Gain → Tone.Reverb → return Gain → masterGain
    - delaySend: Tone.Gain → Tone.FeedbackDelay → return Gain → masterGain
    - setReverbParam(param, value), setDelayParam(param, value)
    - setMasterVolume(0..1)
    - dispose()
  - Run `npm test` — AudioBus tests now PASS (GREEN)

- [ ] **T007** 🟢 TDD GREEN — Implement `p5-sketch/sound-engine.js`
  - SoundEngine class with:
    - constructor(audioBus)
    - createVoice(slot, config) → VoiceHandle
    - updateVoice(voice, sensorData, config) → void
    - disposeVoice(voice) → void
  - Implement ALL 30 voice types:
    - Synth types (0-4): Oscillator → Filter → Envelope → Gain → audioBus.masterGain
    - Arp types (5-8): Tone.Pattern + Osc → Filter → Gain → masterGain
    - Noise types (9-11): Tone.Noise → Filter → Pan → Gain → masterGain
    - Drum types (12-16): Tone.MembraneSynth/MetalSynth trigger-based, threshold detection
    - FX types (17-20): Osc → Tone.BitCrusher/Tone.WaveShaper → Gain → masterGain
    - Granular types (21-24): Osc bursts via Transport, maxGrains=8
    - FX Bus Mod types (25-29): No voice chain — modulate audioBus FX params instead
  - VoiceHandle structure: { type, slot, nodes: {...}, sendGains: {reverb, delay}, dispose }
  - Run `npm test` — all tests still pass

**Checkpoint**: Start bridge + p5 sketch. Click canvas. Connect 1-2 simulated phones. Should hear audio.

---

## Phase 2c: Device Lifecycle (Steps 8-11)

**Purpose**: Wire the full lifecycle — slot assignment, sensor data routing, HUD rendering.

- [ ] **T008** 🔴 TDD RED — Write SoundEngine lifecycle tests
  - Create `tests/p5-sketch/sound-engine.test.js` with ~15 tests:
    - createVoice returns valid VoiceHandle for all 30 types
    - updateVoice sets correct parameters
    - disposeVoice cleans up (verify via spy/mock)
    - trigger-based types respond to magnitude threshold
    - maxGrains=8 enforced for granular types
    - FX modulator slots don't create voice chains
    - re-creating same slot after dispose works
  - Run `npm test` — all must FAIL

- [ ] **T009** 🔴 TDD RED — Write DeviceManager lifecycle tests
  - Create `tests/p5-sketch/device-manager.test.js` with ~8 tests:
    - assign creates voice, disconnect destroys it
    - updateSensor routes data through sensor mapper
    - activeCount reflects correct number
    - assign same slot twice disposes first voice
    - drawHUD doesn't throw (mock p5)
    - disposeAll clears all voices
  - Run `npm test` — all must FAIL

- [ ] **T010** 🟢 TDD GREEN — Implement `p5-sketch/device-manager.js`
  - DeviceManager class with:
    - constructor(soundEngine, config)
    - assign(slot): create voice via soundEngine
    - disconnect(slot): dispose voice, free slot
    - updateSensor(slot, sensorType, data):
      - Look up config.slots[slot].sensorMap
      - Call SensorMapper.getSensorValue() for each param
      - Call soundEngine.updateVoice() with mapped values
    - drawHUD(ctx): radial layout of active slot indicators
      - angle = (slot / maxDevices) * TWO_PI
      - position: centerX + cos(angle)*radius, centerY + sin(angle)*radius
      - Color from config, size reflects signal activity
    - isSlotActive(slot), activeSlots[], activeCount
    - disposeAll()
  - Run `npm test` — new tests PASS

- [ ] **T011** 🟢 TDD GREEN — Implement `p5-sketch/sketch.js`
  - p5 setup():
    - createCanvas, colorMode(HSB), frameRate(30)
    - Create AudioBus → SoundEngine → DeviceManager
    - Connect WebSocket to CONFIG.bridgeUrl
  - p5 draw():
    - background(0, 0, 8)
    - dm.drawHUD()
    - HUD text overlay: device count, connection status
  - MousePressed: Tone.start(), remove overlay
  - WebSocket handlers:
    - onopen: send { type: "player", v: 1 }
    - onmessage: JSON.parse → handleMessage(msg)
    - onclose: setTimeout(reconnect, 3000)
  - handleMessage():
    - system.assign → dm.assign()
    - system.disconnect → dm.disconnect()
    - system.count → update HUD
    - sensor → dm.updateSensor()

**Checkpoint**: Full integration — bridge + p5 sketch + simulator. Audio works for N phones. HUD shows active slots.

---

## Phase 2d: Integration & Polish (Steps 12-14)

- [ ] **T012** Run ALL tests — verify passing
  - Expected: ~48 tests across sensor-mapper, audio-bus, sound-engine, device-manager
  - Run `npm test` — ALL GREEN

- [ ] **T013** Manual integration test
  - Terminal 1: `cd server-bridge && node index.js`
  - Terminal 2: `cd p5-sketch && npx http-server -p 3000 -c-1`
  - Open http://localhost:3000, click to start audio
  - Terminal 3: `node scripts/simulate-phones.js --count 3 --duration 30`
  - Verify: audio changes, HUD shows 3 dots, no console errors
  - Test disconnect: stop simulator, verify voices clean up
  - Test reconnect: re-run simulator, verify new slots assigned

- [ ] **T014** Atomic commits + Graphify update
  - Commit 1: `feat(phase-2a): p5-sketch foundation (index.html, config, sensor-mapper)`
  - Commit 2: `feat(phase-2b): audio engine (audio-bus, sound-engine, tests)`
  - Commit 3: `feat(phase-2c): device lifecycle (device-manager, sketch.js, tests)`
  - Run `python3 -m graphify . --update`
  - Run `/speckit.analyze` for spec compliance check

- [ ] **T015** Spec compliance verification
  - Verify against PLAN.md: all 30 sound types implemented
  - Verify OSC message format matches bridge protocol
  - Verify slot lifecycle (assign/disconnect) works
  - Verify sensor mapping per slot matches 30-type table
  - Verify no memory leaks on rapid assign/disconnect cycles

---

## Task Summary

| Phase | Tasks | Files Created | Tests |
|-------|-------|---------------|-------|
| 2a | T001-T003 | index.html, config.js, sensor-mapper.js | 14 (preexisting stubs) |
| 2b | T004-T007 | audio-bus.js, sound-engine.js | 6 + ~15 new |
| 2c | T008-T011 | device-manager.js, sketch.js | ~8 + ~15 new |
| 2d | T012-T015 | (none — testing + commit) | ~48 total |

**Total new files**: 6
**Total tests**: ~48
**Known risks**: Tone.js CDN version, browser autoplay policy, 30-voice CPU budget
