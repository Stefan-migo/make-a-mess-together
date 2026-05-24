# Implementation Plan: Shared Canvas Brush System

**Spec**: `05-brush-canvas-spec.md`  
**Constitution**: `05-brush-canvas-constitution.md`  
**Date**: 2026-05-24

---

## Summary

Replace the current per-wedge radial visual system with a shared persistent canvas where each phone is a unique brush. Uses p5.js 2.x WEBGL + p5.brush.js for rendering. 30 brush types are pre-assigned to slots. Orientation controls position, accelerometer modulates color/size, gyroscope modulates opacity/scatter. Canvas fades very slowly (configurable, default ~6-7 min). Sound module is untouched.

---

## Technical Context

| Dimension | Value |
|-----------|-------|
| **Language** | JavaScript (ES6+, IIFE module pattern) |
| **Canvas** | p5.js 2.2.3 (WEBGL mode) + p5.brush.js 2.1.0-beta |
| **Paint Buffer** | `createGraphics(w, h, WEBGL)` — persistent offscreen |
| **Brush Algorithms** | 34 types ported from BrushWorks (React → global p5.js) |
| **Testing** | Jest (mocked Tone.js, mocked p5.js) |
| **Target Platform** | Browser (laptop p5 sketch, phone WebSocket client) |
| **Performance** | 30 concurrent phones at 15+ fps |
| **Constraints** | No sound dependency, no old visual dependency |

---

## Architecture

### Canvas Layer Model

```
┌──────────────────────────────────────────┐
│         MAIN CANVAS (WEBGL)              │
│  createCanvas(w, h, WEBGL)               │
│  Cleared each frame with background()    │
│  Draws: paint buffer image + HUD overlay │
├──────────────────────────────────────────┤
│         PAINT BUFFER (WEBGL)             │
│  createGraphics(w, h, WEBGL)             │
│  NEVER cleared                           │
│  Loaded into p5.brush via brush.load()   │
│  All brush strokes drawn here            │
│  Faded with transparent rect every ~2s   │
└──────────────────────────────────────────┘
```

### Flow per Frame (draw loop)

```
1. background() → clear main canvas
2. For each active slot:
   a. Get prev position (px, py) and current position (x, y) from orientation
   b. Get brush params from sensor data (hue shift, size, opacity, scatter)
   c. Call drawBrush(type, pg, px, py, x, y, color, size, opts)
   d. Store current as new prev
3. image(paintBuffer, 0, 0) → display on main canvas
4. Every N frames: apply fade to paint buffer
5. Draw HUD (connection status, device count, mode)
```

### Module Structure

```
brush-canvas.js          → BrushCanvas class (orchestrator)
                           - Paint buffer lifecycle
                           - Per-slot cursor state
                           - Fade timer
                           - drawAll() entry point

brush-registry.js        → BrushType definitions (34 types)
                           - Each brush is a function:
                             drawBrush(pg, x1, y1, x2, y2, color, size, opts)
                           - Registration map: name → function
                           - Config defaults per brush type

config.js (modified)     → Each slot gets brushType field
                           - brushType: 'classic' | 'blade' | 'dotted' | ...

device-manager.js (mod)  → integrate BrushCanvas lifecycle
                           - constructor gets brushCanvas param
                           - assign() → brushCanvas.createCursor(slot)
                           - updateSensor() → brushCanvas.updateCursor(slot, data)
                           - disconnect() → brushCanvas.disposeCursor(slot)

sketch.js (modified)     → Simplified
                           - No VisualModeManager
                           - Just BrushCanvas + DeviceManager
                           - 'c' key removed (no cube mode toggle)

index.html (modified)    → CDN updates
                           - p5.js 1.9.0 → 2.2.3
                           - Add p5.brush.js
                           - Remove visuals-cube.js
                           - Add brush-canvas.js, brush-registry.js
```

### BrushCursor State (per slot)

```js
{
  slot: 0,
  brushType: 'classic',
  prevX: 400,       // Last X position (smooth EMA)
  prevY: 300,       // Last Y position (smooth EMA)
  hasPrev: false,   // False until first position received
  hueShift: 0,      // From accel.x
  saturation: 80,   // From accel.y
  brushSize: 20,    // From accel.z
  opacity: 0.8,     // From gyro.a
  scatter: 0,       // From gyro.b
  brushAngle: 0,    // From gyro.g
}
```

### Sensor → Parameter Mapping

```js
// Position (from orientation — EMA smoothed)
x = constrain(map(orientation.a, 0, 360, 0, canvasWidth), 0, canvasWidth);
y = constrain(map(orientation.b, -180, 180, 0, canvasHeight), 0, canvasHeight);

// Modulations (from accel/gyro — raw each frame)
hueShift   = norm(accel.x, -10, 10) * 180 - 90;        // ±90° hue shift
saturation = constrain(baseSat + norm(accel.y, -10, 10) * 40 - 20, 0, 100);
brushSize  = scale(norm(accel.z, -10, 10), 5, 50);
opacity    = scale(norm(gyro.a, -2000, 2000), 0.2, 1.0);
scatter    = scale(norm(gyro.b, -2000, 2000), 0, 20);  // pixels
brushAngle = scale(norm(gyro.g, -2000, 2000), 0, PI * 2);
```

### Fade Mechanism

```js
// In sketch draw() — after all brush strokes
const CANVAS_FADE_RATE = 0.005;   // per fade event
const CANVAS_FADE_INTERVAL = 60;  // frames between fades (≈2s at 30fps)

if (frameCount % CANVAS_FADE_INTERVAL === 0) {
  paintBuffer.noStroke();
  paintBuffer.fill(0, 0, 0, CANVAS_FADE_RATE);
  paintBuffer.rect(0, 0, width, height);
}
```

At this rate: 1/0.005 = 200 fade events. 200 × 2s = 400s ≈ 6.7 minutes for full decay.

---

## Project Structure Changes

```
p5-sketch/
├── index.html              ← MODIFIED (CDN versions, script order)
├── config.js               ← MODIFIED (brushType per slot)
├── brush-canvas.js         ← NEW (BrushCanvas class)
├── brush-registry.js       ← NEW (34 brush type definitions)
├── device-manager.js       ← MODIFIED (BrushCanvas integration)
├── sketch.js               ← MODIFIED (simplified, single mode)
├── sensor-mapper.js        ← UNCHANGED (still needed)
├── audio-bus.js            ← UNCHANGED
├── sound-engine.js         ← UNCHANGED
├── visuals.js              ← ARCHIVED (not loaded)
├── visuals-cube.js         ← ARCHIVED (not loaded)

tests/
├── p5-sketch/
│   ├── brush-canvas.test.js  ← NEW
│   └── brush-registry.test.js ← NEW
```

---

## Brush Registry (34 types)

Each brush from the BrushWorks system is ported to a standalone function:

```js
// Signature
function drawBrush(pg, x1, y1, x2, y2, color, size, opts) {
  // pg:        p5.Graphics target (the paint buffer)
  // x1, y1:    previous position
  // x2, y2:    current position
  // color:     { h, s, b, a } object
  // size:      brush base size in pixels
  // opts:      { scatter, angle, blendMode, ... }
}

// Registration
const BRUSH_REGISTRY = {
  classic: drawClassic,
  blade: drawBlade,
  dotted: drawDotted,
  // ... 31 more
};

// Usage
BRUSH_REGISTRY[brushType](pg, px, py, x, y, color, size, opts);
```

---

## Migration: Old → New

| Old File | New Status | Reason |
|----------|-----------|--------|
| `visuals.js` | Not loaded (kept on disk) | Replaced entirely |
| `visuals-cube.js` | Not loaded (kept on disk) | De-scoped |
| `sketch.js` VMM code | Removed | No mode switching needed |
| `device-manager.js` visuals hooks | Replaced with brush-canvas hooks | New lifecycle |
| `config.js` visualType per slot | Replaced with brushType per slot | New field |
| `index.html` p5.js 1.9.0 | → p5.js 2.2.3 | WEBGL requirement |

---

## Constitution Check

| Principle | Status |
|-----------|--------|
| I. One Shared Canvas | ✅ Paint buffer, never cleared |
| II. Orientation as Cursor | ✅ orientation.α/β → XY |
| III. 30 Unique Brushes | ✅ Pre-assigned via config |
| IV. Sensor Modulation | ✅ accel/gyro → color/size/opacity |
| V. Module Isolation | ✅ No dependency on sound/old visuals |
| VI. TDD Strict | ✅ Tests before implementation |
| VII. p5.js 2.x + p5.brush | ✅ CDN updates |
