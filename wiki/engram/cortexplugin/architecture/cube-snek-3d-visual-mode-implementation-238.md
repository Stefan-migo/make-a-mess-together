---
id: 238
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 05:41:18"
updated_at: "2026-05-20 05:41:18"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Cube Snek 3D visual mode implementation"
---

# Cube Snek 3D visual mode implementation

**What**: Implemented Cube Snek 3D collaborative visual mode — an alternate 3D rendering mode where 30 phone cursors crawl on the faces of a shared WEBGL cube. Toggleable between 2D radial mode and 3D cube mode via 'c' key.

**Why**: Spec requirement Phase 4 — adds dramatic visual shift for performances, letting phones work together on a shared 3D surface.

**Where**: 
- NEW p5-sketch/visuals-cube.js (442 lines) — CubeSnekEngine, AxisCursor, Face, CubeSensorMapper classes
- NEW tests/p5-sketch/visuals-cube.test.js — 41 tests
- MODIFIED p5-sketch/sketch.js — VisualModeManager, keyPressed 'c', mouseDragged/mouseWheel handlers, mode HUD
- MODIFIED p5-sketch/config.js — cubeMode config section (cubeSize, gridSize, orbitSpeed, nestingLevels, faceColors)
- MODIFIED p5-sketch/index.html — added visuals-cube.js script tag
- MODIFIED p5-sketch/device-manager.js — cubeSnek lifecycle hooks (createCursor/disposeCursor/updateSensor)

**Learned**: 
- Named CubeSensorMapper to avoid conflict with existing SensorMapper in sensor-mapper.js
- Face class uses 5x5 claims grid per face, 6 faces total for 30 cursors (5 per face)
- Nesting: cursors drop inward when face grid is full, 5 levels max
- Camera: auto-orbit around Y, mouse drag tilts, scroll zooms
- Sound bridge: onNestingChange callback fires when cursor nests, wiring into SoundEngine
- 212 total tests pass (171 existing + 41 new)

---
*Session*: [[session-manual-save-cortexplugin]]
