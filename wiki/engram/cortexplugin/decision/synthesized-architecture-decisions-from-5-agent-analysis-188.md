---
id: 188
type: decision
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 00:02:25"
updated_at: "2026-05-20 00:02:25"
revision_count: 1
tags:
  - cortexplugin
  - decision
aliases:
  - "Synthesized architecture decisions from 5-agent analysis"
---

# Synthesized architecture decisions from 5-agent analysis

**What**: Final architecture decisions from 5-agent analysis for phone-sensor-orchestra project. These override / complement PLAN.md.

**Bridge Server Decisions**:
- Single port :8080 for v1 (phones + p5 use same port)
- Raw JSON WebSocket for bridge→p5 (drop osc-js, add --osc flag later if needed)
- Per-device message batch at 30Hz (decouple receive from send)
- O(1) Set-based slot allocator (not linear scan)
- 5s cooldown timer on slot free to prevent thrashing
- Heartbeat every 10s, zombie detection at 15s no-data
- Backpressure guard: check bufferedAmount before sending
- Protocol version field "v":1 from day one

**Audio Engine Decisions**:
- 30 voices (~120-180 AudioNodes) is feasible
- ONE shared reverb send bus + ONE shared delay send bus (not 30 instances)
- Slots 25-29 modulate shared FX busses, not create new FX instances
- Granular maxGrains: 8 (saves 96 AudioNodes)
- Hybrid voice architecture: family base classes + O(1) factory map
- Normalize sensor values in p5 (bridge relays raw)
- Per-axis EMA smoothing for noisy gyro data
- Pentatonic scale for pitched voices to prevent cacophony
- Master limiter at -1dBFS to prevent clipping

**Visual Engine Decisions**:
- Hybrid wedge: Identity layer clipped + Expression layer unclipped
- Fixed hue wheel: hue = slot × 12°, evenly spaced
- Canvas 2D, not WebGL (reserve for v2 shader slots)
- Audio-visual cohesion via AnalyserNode RMS per voice
- History fingerprint per slot (30s energy, activity, dominant axis)
- frameRate(30) from start (sensor data is 30fps)

**Phone Client Decisions**:
- Three-tier IP discovery: QR → URL param → localStorage → prompt
- rAF throttle with coalescing (overwrite pending, send latest each 33ms)
- Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s cap + jitter
- Use transform: scaleX() for progress bars (GPU composited)
- ~13KB payload, zero dependencies
- Graceful degradation on sensor denied

**Process Decisions**:
- Build phone simulator FIRST (Phase 0) before tuning anything
- Development order: Simulator → Bridge → p5 Audio → p5 Visuals → Phone Client → Deploy
- set frameRate(30) from day one, not 60

---
*Session*: [[session-manual-save-cortexplugin]]
