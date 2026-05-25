---
id: 199
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 01:07:51"
updated_at: "2026-05-20 01:07:51"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Phase 2 completed — p5 Sketch Audio Engine"
---

# Phase 2 completed — p5 Sketch Audio Engine

**What**: Implemented Phase 2 of phone-sensor-orchestra — the p5.js + Tone.js audio engine with 30 voice types, shared FX busses, sensor normalization, and device lifecycle management.

**Why**: Required to transform phone sensor data (acclerometer/gyroscope/orientation) into audio output with 30 distinct voice types mapped to specific sensor parameters.

**Where**: 
- p5-sketch/index.html — CDN deps + script loading
- p5-sketch/config.js — 30-slot config with sensorMap for each type
- p5-sketch/sensor-mapper.js — normalize, smooth(EMA), mapCurve, getSensorValue
- p5-sketch/audio-bus.js — AudioBus class with master chain + reverb/delay send busses
- p5-sketch/sound-engine.js — SoundEngine class with 30 voice factories + updaters
- p5-sketch/device-manager.js — DeviceManager for slot lifecycle + data routing
- p5-sketch/sketch.js — p5 setup/draw + WebSocket handler
- tests/p5-sketch/ — 39 tests across 4 test files

**Learned**: 
- Use IIFE pattern for browser modules that also need Node.js require() compatibility for Jest testing
- Closure bugs in voice dispose callbacks when object literals reference a non-existent 'voice' variable — always declare voice as const first
- Tone.js API: Gain constructor uses gain.value in v14.7 vs newer versions using gain.value
- Drum trigger with hysteresis: magnitude threshold + 50% release prevents retrigger chatter
- FX Bus Modulator pattern: slots 25-29 share one factory since they modulate AudioBus params instead of creating voice chains

---
*Session*: [[session-manual-save-cortexplugin]]
