---
id: 237
type: decision
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 05:30:03"
updated_at: "2026-05-20 05:30:03"
revision_count: 1
tags:
  - cortexplugin
  - decision
aliases:
  - "Cube Snek 3D visual mode: spec + plan in progress"
---

# Cube Snek 3D visual mode: spec + plan in progress

**What**: Planning a new 3D visual mode for phone-sensor-orchestra based on the "Cube Snek" reference sketch. Key decisions:
- Mode 2 (alternate to existing radial 2D visuals), switchable with keypress
- Single shared 3D cube with 30 cursors (one per phone)
- p5.js WEBGL renderer
- New file: p5-sketch/visuals-cube.js (doesn't modify existing visuals.js)
- Cube face groups: 5 phones per face (slots 0-4 Face 0, 5-9 Face 1, etc.)
- Camera orbit controlled by average sensor data

**Where**: New module p5-sketch/visuals-cube.js + integration in sketch.js, device-manager.js

**Learned**: The existing spec template uses sections: Architecture, User Stories, Requirements, Success Criteria. Follow established format from .specify/specs/03-p5-sketch-visuals.md.

---
*Session*: [[session-manual-save-cortexplugin]]
