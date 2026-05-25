---
id: 186
type: learning
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-19 23:51:25"
updated_at: "2026-05-19 23:51:25"
revision_count: 1
tags:
  - cortexplugin
  - learning
aliases:
  - "Performance analysis — bridge safe up to 800 conn, browser is bottleneck at 15-20 devices"
---

# Performance analysis — bridge safe up to 800 conn, browser is bottleneck at 15-20 devices

**What**: Full performance engineering analysis for phone-sensor-orchestra at 30 devices. Bridge handles 900 msg/s easily (<5% CPU). Browser p5.js main thread is the bottleneck: 30 draw calls + 30 voice updates exceed 16.6ms frame budget at ~15-20 devices.

**Where**: server-bridge/index.js, p5-sketch/sketch.js, p5-sketch/visuals.js, p5-sketch/sound-engine.js

**Key findings**:
- Bridge (Node.js + ws) safe up to ~800 concurrent connections; 30 is trivial
- Browser main thread is #1 bottleneck — p5.js visual draw from 30 devices at 60fps exceeds frame budget
- Solution: drop visual framerate to 30fps (33ms budget), use raw Canvas2D API (drawingContext), use offscreen buffers for slow-changing visuals
- Tone.js voice disposal sequence is critical: stop → disconnect → dispose → null. Missing .dispose() causes AudioNode memory leak
- GC pressure from 360KB/s message parsing is fine for V8; object pooling recommended to eliminate spiky allocation
- Always use rampTo() (not direct value assignment) for AudioParam changes to prevent clicks
- Set Tone.context.lookAhead = 0.2s and latencyHint = "playback" for audio glitch margin
- Tone.js lookahead scheduling (0.1s default) provides natural buffer against main-thread lag — audio stays smooth even if visuals stutter
- Build phone simulator for testing: 30 virtual connections with sine/noise/burst/chaos patterns
- 60-min endurance test required to verify no memory leak

---
*Session*: [[session-manual-save-cortexplugin]]
