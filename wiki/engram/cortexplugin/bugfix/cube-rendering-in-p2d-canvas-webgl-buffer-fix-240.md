---
id: 240
type: bugfix
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 11:11:29"
updated_at: "2026-05-20 11:11:29"
revision_count: 1
tags:
  - cortexplugin
  - bugfix
aliases:
  - "Cube rendering in P2D canvas — WEBGL buffer fix"
---

# Cube rendering in P2D canvas — WEBGL buffer fix

**What**: Cube Snek 3D mode showed blank screen. Fixed by rendering cube to a createGraphics(WEBGL) off-screen buffer then compositing via image(buf, 0, 0) onto the P2D main canvas.

**Why**: The main canvas uses createCanvas(1600, 900) which is P2D mode. WEBGL-only operations (sphere(), vertex(x,y,z), rotateX/Y, beginShape(QUADS)) silently produce nothing in P2D mode.

**Where**: p5-sketch/sketch.js (VisualModeManager class, lines 167-206), p5-sketch/visuals-cube.js (line 300)

**Learned**: p5.js P2D canvas cannot display WEBGL primitives. The WebGL requires either createCanvas(WEBGL) or createGraphics(WEBGL) buffer. The buffer approach is safest because it doesn't break existing 2D visuals (which use P2D coordinates with top-left origin). Key: in WEBGL buffer, (0,0) is center — do NOT translate by centerX/centerY.

---
*Session*: [[session-manual-save-cortexplugin]]
