# Phase 2 Implementation Plan — p5 Sketch Audio Engine

**Branch**: `main` (no branch needed — sequential phase on main)
**Date**: 2026-05-19
**Spec**: `.specify/specs/02-p5-sketch-audio.md`
**Status**: Ready

---

## Summary

Build the p5.js + Tone.js audio engine that connects to the bridge server, manages 30 phone slots, normalizes sensor data, and creates/disposes/updates 30 different Tone.js voice types with shared FX busses.

---

## Technical Context

| Dimension | Value |
|-----------|-------|
| **Runtime** | Browser (Chrome/Firefox/Safari latest) |
| **Primary Dependencies** | p5.js 1.9+, Tone.js 14.7+ (loaded via CDN) |
| **WebSocket** | Native browser WebSocket API (no osc-js for v1) |
| **Testing** | Jest + jsdom (for pure-logic modules: sensor-mapper, audio-bus) |
| **Audio Nodes** | ~120-180 for 30 voices — well within WebAudio limits |
| **Frame Rate** | 30fps (p5.frameRate(30)) |
| **Canvas Size** | 1600×900 |
| **Max Grains** | 8 per granular voice |
| **Tone.js Start** | On user `mousePressed` (browser autoplay policy) |

**Key Constraints**:
- AudioContext must be resumed on user gesture (Tone.start())
- WebSocket reconnection with 3s backoff
- Voice disposal must disconnect nodes in reverse signal-chain order
- Drum voices need magnitude threshold detection from raw accel data
- Slots 25-29 are FX bus modulators, not independent voices

---

## Architecture Decisions

### D1: Voice Factory Pattern
**Decision**: Map of 30 factory functions keyed by `soundType` string.
**Why**: O(1) lookup, easy to add new types, each type self-contained in its own method.
**Trade-off**: More boilerplate than a data-driven approach, but clearer for 30 distinct signal chains.

### D2: Sensor Mapping Pipeline
**Decision**: `raw → normalize(0..1) → smooth(EMA) → curveMap(paramRange)`
**Why**: Clean separation of concerns. Config per slot stores source+axis, curve type, and output range.
**Trade-off**: Extra function call overhead per axis per frame. Negligible at 30fps × 30 voices × 2 params = 1800 calls/sec.

### D3: Shared FX Busses
**Decision**: Single AudioBus instance with reverb + delay send/return chains.
**Why**: 30 separate reverbs would be 30× convolution buffers — massive memory waste. Shared busses are standard practice in audio routing.
**Trade-off**: All voices share the same reverb/delay character. Acceptable for this project — individual FX character comes from per-voice signal chains (filter, distortion, bitcrush, etc.).

### D4: Drum Threshold Detection
**Decision**: Compute `accelMagnitude = sqrt(x^2 + y^2 + z^2)` in sensor-mapper. Compare against threshold from config. Retrigger only when magnitude crosses threshold then drops below 50% of threshold (hysteresis).
**Why**: Prevents retrigger chattering on sustained movement.
**Trade-off**: Slight delay on release. Acceptable for percussive sounds.

### D5: Granular Simplification
**Decision**: Use short Tone.Oscillator bursts + Tone.Gain envelope scheduled via Tone.Transport, not Tone.GrainPlayer (which requires preloaded buffers).
**Why**: This project uses synthetic sounds only — no sample files. Buffer-based granular would require generating and loading buffers.
**Trade-off**: Less authentic granular sound. Acceptable for synthetic-only constraint.

### D6: Arp Implementation
**Decision**: Use Tone.Pattern + Tone.Sequence scheduled on Tone.Transport, not manual setTimeout.
**Why**: Tone.Transport ensures sample-accurate timing, automatic BPM sync, and clean lifecycle management.
**Trade-off**: Arp BPM is linked to Transport BPM. We can set Transport.bpm per-arp-voice via.value ramp.

### D7: State Broadcast Handling
**Decision**: On connect as "player", bridge sends all active slots. DeviceManager must handle bulk assign (multiple `/system/assign` in sequence on initial handshake).
**Why**: Bridge broadcasts current state to newly connected players.
**Trade-off**: Brief moment where voices are created sequentially. At 30fps render cycle, this is imperceptible.

---

## File Structure

```
p5-sketch/
├── index.html              # CDN deps + script loading
├── config.js               # 30-slot config + constants
├── sensor-mapper.js        # Pure functions: normalize, smooth, curveMap
├── audio-bus.js            # Shared FX busses + master chain (Tone.js class)
├── sound-engine.js         # 30 voice types factory (Tone.js class)
├── device-manager.js       # Slot lifecycle + data routing
└── sketch.js               # p5 setup/draw + WebSocket handler
```

---

## Data Flow

```
Bridge WebSocket message
  │
  ▼
sketch.js handleMessage(msg)
  │
  ├─ type: "system", event: "assign"   → dm.assign(slot)
  ├─ type: "system", event: "disconnect" → dm.disconnect(slot)
  ├─ type: "system", event: "count"    → update HUD
  │
  └─ type: "sensor"                    → dm.updateSensor(slot, sensorType, data)
                                              │
                                              ▼
                                        config.slots[slot].sensorMap
                                              │
                                              ▼
                                        for each param:
                                          SensorMapper.getSensorValue(data, source, axis, paramConfig)
                                            → normalize → smooth → curveMap
                                              │
                                              ▼
                                        soundEngine.updateVoice(voice, mappedValues, config)
                                              │
                                              ▼
                                        Tone.js node.param.value = mappedValue
                                              │
                                              ▼
                                        Audio flows through voice chain → AudioBus → destination
```

---

## Test Strategy

| Module | Test File | Count | What to Test |
|--------|-----------|-------|-------------|
| SensorMapper | `tests/p5-sketch/sensor-mapper.test.js` | 14 | Normalization, smoothing, curve mapping, edge cases |
| AudioBus | `tests/p5-sketch/audio-bus.test.js` | 6 | Master chain, send busses, limiter, FX mod slots |
| SoundEngine | `tests/p5-sketch/sound-engine.test.js` | ~15 | Voice creation/disposal/update for all 30 types |
| DeviceManager | `tests/p5-sketch/device-manager.test.js` | ~8 | Lifecycle, data routing, HUD |
| Integration | `tests/p5-sketch/bridge-connection.test.js` | ~5 | WS connect, message routing, reconnect |

**Total**: ~48 tests

**Note**: SoundEngine and DeviceManager require Tone.js runtime. For Jest, use manual mocks of Tone.js API (or skip complex audio tests in CI, run only during manual verification). Pure-logic tests (sensor-mapper, audio-bus structure) run in Jest directly.

---

## Implementation Strategy

### Phase 2a: Foundation (Steps 1-3)
Build index.html, config.js, and sensor-mapper.js first — these have zero audio dependencies and can be tested immediately.

### Phase 2b: Core Audio (Steps 4-7)
Build audio-bus.js then sound-engine.js. Audio-bus is the simpler of the two (single class, straightforward signal chain). Sound-engine is the most complex module with 30 voice types.

### Phase 2c: Lifecycle (Steps 8-11)
Build device-manager.js then sketch.js. Device-manager wires everything together. sketch.js is the thinnest module — it should be pure orchestration.

### Phase 2d: Integration (Steps 12-14)
Run all tests, manual verification with bridge + simulator, commit.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tone.js CDN version mismatch | Low | High | Pin exact versions in index.html |
| Browser autoplay policy blocks audio | Medium | High | Tone.start() on mousePressed + visual indicator |
| 30 voices cause audio crackling | Low | Medium | frameRate(30), maxGrains=8, shared FX busses |
| WebSocket reconnect storms | Low | Low | 3s reconnect delay, connection dedup in sketch.js |
| Safari DeviceOrientation differences | Medium | Low | sensor-mapper handles missing axes gracefully |
