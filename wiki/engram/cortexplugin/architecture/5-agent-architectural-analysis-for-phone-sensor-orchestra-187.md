---
id: 187
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-19 23:51:43"
updated_at: "2026-05-19 23:51:43"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "5-agent architectural analysis for phone-sensor-orchestra"
---

# 5-agent architectural analysis for phone-sensor-orchestra

**What**: Spawned 5 subagents (Systems Architect, Audio Engineer, Creative Technologist, Mobile Engineer, Performance/QA) to analyze phone-sensor-orchestra architecture from different perspectives.

**Key decisions emerging from analysis**:
1. Bridge: Single port :8080 v1, drop osc-js for raw JSON WS, batch per-device at 30Hz, O(1) Set-based slot allocator, add protocol version field
2. Audio: 30 voices feasible (~120-180 AudioNodes), granular maxGrains=8, shared reverb/delay send busses, hybrid module architecture with base classes + O(1) factory map, normalize sensor values in p5 sketch
3. Visuals: Hybrid wedge clipping (identity layer clipped, expression layer unclipped), fixed hue wheel (slot × 12°), Canvas 2D not WebGL, audio-visual cohesion via AnalyserNode per voice
4. Phone: Three-tier IP discovery (QR > URL param > localStorage > prompt), rAF throttle with coalescing, exponential backoff reconnect, graceful sensor degradation, ~13KB payload
5. Performance: Build phone simulator before tuning, GC pressure from JSON parsing manageable, Tone.js disposal sequence critical, drop p5 frameRate(30) from start

**Key finding**: All 5 agents agreed Node.js + p5.js + Tone.js stack is correct for 30 devices. No need to rewrite in Rust/Go/Three.js.

---
*Session*: [[session-manual-save-cortexplugin]]
