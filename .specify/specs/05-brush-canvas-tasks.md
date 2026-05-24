# Tasks: Shared Canvas Brush System

**Spec**: `05-brush-canvas-spec.md`  
**Plan**: `05-brush-canvas-plan.md`  
**Tests**: MANDATORY per TDD constitution — RED before GREEN before REFACTOR

---

## Phase 1: Foundation — p5.js 2.x + Paint Buffer (Shared)

**Purpose**: Upgrade p5.js version, set up WEBGL canvas architecture, create the persistent paint buffer.

**⚠️ CRITICAL**: All user stories depend on this phase.

### Tests for Foundation (TDD RED)

- [ ] **T001** [P] [FOUNDATION] Test that createPaintBuffer() returns a valid p5.Graphics with WEBGL in tests/p5-sketch/brush-canvas.test.js

### Implementation

- [ ] **T002** Update `p5-sketch/index.html`:
  - p5.js CDN: `1.9.0` → `https://cdn.jsdelivr.net/npm/p5@2.2.3/lib/p5.min.js`
  - Add p5.brush CDN: `https://cdn.jsdelivr.net/npm/p5.brush@2.1.0-beta/dist/p5.brush.js`
  - Remove `visuals-cube.js` script tag
  - Add `brush-registry.js` before `brush-canvas.js`
  - Add `brush-canvas.js` before `device-manager.js`
  - Script order: config → sensor-mapper → audio-bus → sound-engine → brush-registry → brush-canvas → device-manager → sketch
- [ ] **T003** Create `p5-sketch/brush-canvas.js`:
  - `BrushCanvas` class skeleton with constructor(w, h)
  - `_createPaintBuffer()` — `createGraphics(w, h, WEBGL)` + `brush.load()`
  - `getPaintBuffer()` accessor
- [ ] **T004** Create `p5-sketch/brush-registry.js`:
  - Placeholder with `BRUSH_REGISTRY` object and `registerBrush(name, fn)` function
  - Export both to global scope

**Checkpoint**: p5 sketch loads without errors, canvas shows a blank WEBGL surface

---

## Phase 2: Brush Registry — 34 Brush Types (US3)

**Purpose**: Port all 34 brush algorithms from BrushWorks into standalone functions. Each brush draws a stroke segment from (x1,y1) to (x2,y2).

### Tests for Brush Registry (TDD RED)

- [ ] **T005** [P] [US3] Test that `BRUSH_REGISTRY` contains 34 entries in tests/p5-sketch/brush-registry.test.js
- [ ] **T006** [P] [US3] Test that `registerBrush('testBrush', fn)` adds to registry and `drawBrush('testBrush', ...)` calls without error
- [ ] **T007** [P] [US3] Test that `drawBrush('unknown', ...)` returns false gracefully
- [ ] **T008** [P] [US3] Test each of the 34 brush types executes without throwing when called with mock params

### Implementation

- [ ] **T009** Port all 34 brush algorithms to `brush-registry.js`:
  - Each brush is a function `(pg, x1, y1, x2, y2, color, size, opts) => void`
  - Uses `pg` (p5.Graphics) for all drawing operations
  - Color = `{ h, s, b, a }` (HSB mode)
  - opts = `{ scatter, angle, blendMode }`
  - Brushes to port:
    - Ink (6): classic, blade, dotted, stamped, velocity, dash
    - Art (6): sketchy, watercolor, spray, chalk, smoke, furry
    - SFX (8): neon, plasma, vortex, bead, bubble, star, quantum, aurora
    - Geometry (8): geometric, pixel, shattered, web, abstract, trail, isometric, triangulate
    - Symmetry (6): mirror-h, mirror-v, mirror-quad, mirror-tri, mirror-hex, mirror-twelve
- [ ] **T010** Update `p5-sketch/config.js`:
  - Add `brushType` field to each of the 30 slots
  - Map slot 0→classic, 1→blade, ..., 29→mirror-twelve
  - Keep existing fields (soundType, color, sensorMap, etc.)
  - Add `canvasFadeRate: 0.005` and `canvasFadeInterval: 60` to CONFIG

**Checkpoint**: All 34 brush functions registered and testable without errors

---

## Phase 3: BrushCursor — Per-Slot State + Lifecycle (US1, US5)

**Purpose**: Create the per-slot brush state machine. Handle connect (create cursor), sensor update (move brush), disconnect (dispose cursor).

### Tests for BrushCursor (TDD RED)

- [ ] **T011** [P] [US1] Test that `brushCanvas.createCursor(slot, brushType)` initializes cursor with correct slot and type
- [ ] **T012** [P] [US1] Test that `brushCanvas.updateCursor(slot, sensorData)` updates cursor position based on orientation
- [ ] **T013** [P] [US1] Test that cursor position is EMA-smoothed (coefficient 0.3)
- [ ] **T014** [P] [US1] Test that first sensor data sets prev position without drawing (no segment to draw)
- [ ] **T015** [P] [US1] Test that second+ sensor data draws a stroke segment from prev to current
- [ ] **T016** [P] [US5] Test that `brushCanvas.disposeCursor(slot)` removes cursor state
- [ ] **T017** [P] [US5] Test that disposed cursor's paint buffer marks are NOT cleared

### Implementation

- [ ] **T018** Add to `brush-canvas.js`:
  - `_cursors = {}` — per-slot storage
  - `createCursor(slot, brushType)`:
    - Initialize `{ slot, brushType, prevX, prevY, hasPrev: false, sensorCache: {} }`
    - Store in `_cursors[slot]`
  - `updateCursor(slot, sensorData)`:
    - Get or create cursor
    - Parse orientation: x = map(a, 0, 360, 0, w), y = map(b, -180, 180, 0, h)
    - Smooth with EMA: `x = prevX * 0.7 + x * 0.3; y = prevY * 0.7 + y * 0.3`
    - Parse accel/gyro modulations
    - If hasPrev: call `drawBrush(brushType, pg, prevX, prevY, x, y, color, size, opts)`
    - Update prevX, prevY
    - Set hasPrev = true
  - `disposeCursor(slot)`:
    - Delete `_cursors[slot]`
    - Do NOT clear paint buffer
  - `getCursor(slot)` accessor

**Checkpoint**: Single phone can connect and leave brush marks on paint buffer

---

## Phase 4: DeviceManager Integration (US1, US5)

**Purpose**: Hook BrushCanvas into the existing DeviceManager lifecycle.

### Tests for Integration (TDD RED)

- [ ] **T019** [P] [US1] Test that `DeviceManager.assign(slot)` creates brush cursor
- [ ] **T020** [P] [US1] Test that `DeviceManager.updateSensor(slot, 'orientation', data)` updates brush position
- [ ] **T021** [P] [US5] Test that `DeviceManager.disconnect(slot)` disposes brush cursor

### Implementation

- [ ] **T022** Modify `p5-sketch/device-manager.js`:
  - Constructor: add `brushCanvas` parameter (after `cubeSnek` or replacing it)
  - `assign(slot)`: call `this._brushCanvas.createCursor(slot, config.slots[slot].brushType)`
  - `updateSensor(slot, sensorType, data)`:
    - After sound engine update, call `this._brushCanvas.updateCursor(slot, data)` when sensorType === 'orientation'
  - `disconnect(slot)`: call `this._brushCanvas.disposeCursor(slot)`
  - `disposeAll()`: iterate and dispose all cursors

**Checkpoint**: Phones connect → sensor data flows → brush marks appear on canvas

---

## Phase 5: Sketch.js — Simplified Single Mode (US1, US2)

**Purpose**: Remove VisualModeManager, cube mode, radial mode. Single shared canvas mode.

### Tests (TDD RED)

- [ ] **T023** [P] [US1] Test that sketch draw() calls brushCanvas.drawAll()
- [ ] **T024** [P] [US2] Test that fade is applied at correct interval

### Implementation

- [ ] **T025** Modify `p5-sketch/sketch.js`:
  - Remove `cubeSnek`, `modeManager`, `VisualModeManager` class
  - Remove `c` key handling in `keyPressed()`
  - Remove `mouseDragged()`, `mouseWheel()` (cube controls)
  - Add `paintBuffer` global
  - `setup()`:
    - `createCanvas(w, h, WEBGL)` — note: WEBGL!
    - Load brush: `brush.load(paintBuffer)`
    - Create `BrushCanvas` instance
    - Pass to `DeviceManager` instead of old visuals
  - `draw()`:
    - `background(0, 0, 8)`
    - `BrushCanvas.drawAll()` (draws all active cursors to paint buffer)
    - `image(paintBuffer, -w/2, -h/2)` — center in WEBGL coords
    - Apply fade (interval-based)
    - HUD (device count, status, mode)
  - Remove `visuals.drawAll()` and `cubeSnek.draw()` calls

**Checkpoint**: Sketch runs with shared canvas only, no mode switching

---

## Phase 6: Canvas Fade — Slow Decay (US2)

**Purpose**: Implement the canvas fade mechanism. Old marks slowly disappear.

### Tests for Fade (TDD RED)

- [ ] **T026** [P] [US2] Test that fade reduces paint buffer opacity over time
- [ ] **T027** [P] [US2] Test that `canvasFadeRate = 0` disables fade

### Implementation

- [ ] **T028** Add fade logic to `brush-canvas.js`:
  - `applyFade()` method
  - Uses config `canvasFadeRate` and `canvasFadeInterval`
  - Called from sketch `draw()` on interval
  - Works by drawing semi-transparent black rect on paint buffer
  - Uses HSB: `fill(0, 0, 0, fadeRate)` then `rect(0, 0, w, h)`

**Checkpoint**: Brush marks persist for minutes, slowly fading

---

## Phase 7: Sensor Modulation — Expressive Brushes (US4)

**Purpose**: Connect accel/gyro data to brush parameters for responsive painting.

### Tests for Modulation (TDD RED)

- [ ] **T029** [P] [US4] Test that accel.x → hueShift produces correct range (±90°)
- [ ] **T030** [P] [US4] Test that accel.z → brushSize produces range [5, 50]
- [ ] **T031** [P] [US4] Test that gyro.a → opacity produces range [0.2, 1.0]

### Implementation

- [ ] **T032** Add modulation logic to `brush-canvas.js > updateCursor()`:
  - After position calculation, parse accel/gyro for modulations
  - Apply to cursor state: `cursor.hueShift`, `cursor.saturation`, `cursor.brushSize`, `cursor.opacity`, `cursor.scatter`
  - Pass these to `drawBrush()` via `opts`

**Checkpoint**: Moving phone changes color/size/opacity in real time

---

## Phase 8: Final Polish & Edge Cases

**Purpose**: Handle edge cases, ensure stability.

### Tests for Edge Cases

- [ ] **T033** [P] [US5] Test rapid reconnect (same phone, different slot)
- [ ] **T034** [P] [US1] Test NaN orientation values (no jump to origin)
- [ ] **T035** [P] [US1] Test all 30 phones painting simultaneously

### Implementation

- [ ] **T036** Edge case handling:
  - NaN guard on orientation values: if NaN, skip this frame for that slot
  - Zero-division guard on normalization
  - Memory: limit cursor trail storage if added
- [ ] **T037** Update `p5-sketch/config.js` with final brush-to-slot mapping

---

## Execution Order

```
Phase 1 (Foundation) ── BLOCKS EVERYTHING
       │
Phase 2 (Brush Registry) ── parallel with Phase 3 after Phase 1
       │
       ├──► Phase 3 (BrushCursor) ── BLOCKS Phase 4
       │         │
       │         └──► Phase 4 (DeviceManager) ── BLOCKS Phase 5
       │                   │
       │                   └──► Phase 5 (Sketch.js)
       │
       └──► Phase 6 (Fade) ── can start after Phase 3
       └──► Phase 7 (Modulation) ── can start after Phase 3
       
Phase 8 (Polish) ── after all phases complete
```

### Parallel Opportunities

- **Phase 2 & Phase 3** can be implemented in parallel (different files)
- **Phase 6** can start as soon as Phase 3 is done (no dependency on DeviceManager)
- **Phase 7** can start as soon as Phase 3 is done

### TDD Enforcement

Before implementing ANY task:
1. Write the test file in `tests/p5-sketch/`
2. Run `npm test` — verify the test FAILS (RED)
3. Write implementation code
4. Run `npm test` — verify the test PASSES (GREEN)
5. Refactor, keeping tests GREEN
