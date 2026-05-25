---
id: 233
type: learning
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 04:30:55"
updated_at: "2026-05-20 04:30:55"
revision_count: 1
tags:
  - cortexplugin
  - learning
aliases:
  - "171 tests passing across all modules"
---

# 171 tests passing across all modules

**What**: After bridge HTTP routing fixes, all 171 tests pass (10/10 suites) — up from 163 before.

**Test breakdown**:
- bridge/slot-allocator.test.js: 13 tests
- bridge/message-protocol.test.js: 19 tests  
- bridge/http-routing.test.js: 8 tests (NEW — covers all 4 routing bugs)
- p5-sketch/sound-engine.test.js: 11 tests
- p5-sketch/visuals-rendering.test.js: 12 tests
- p5-sketch/device-manager.test.js: 7 tests
- p5-sketch/audio-bus.test.js: 6 tests
- p5-sketch/sensor-mapper.test.js: 4 suites
- phone-client/message-format.test.js: 28 tests

**Where**: tests/ directory, all 3 modules

---
*Session*: [[session-manual-save-cortexplugin]]
