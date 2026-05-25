# Phase 4 Implementation Plan — Cube Snek 3D Visual Mode

**Branch**: `main` (sequential phase)
**Date**: 2026-05-20
**Spec**: `.specify/specs/04-cube-snek-visuals.md`
**Status**: Draft

---

## Summary

Add an alternate 3D visual mode to the p5 sketch — a shared cube with 30 cursor trails crawling on its 6 faces (5 cursors per face). Toggleable via 'c' key between 2D radial mode (Phase 3) and 3D cube mode (this phase). Each cursor is driven by its phone's sensor data: orientation determines movement direction, accelerometer affects nesting urgency, gyroscope controls line brightness. When a face's grid is full, cursors nest inward to smaller layers.

---

## Technical Context

| Dimension | Value |
|-----------|-------|
| **Runtime** | Browser (Chrome/Firefox/Safari latest) |
| **Rendering API** | p5.js WEBGL (cube), P2D (HUD overlay) |
| **Frame Rate** | 30fps (already set in config.js) |
| **Canvas Size** | 1600×900 (already set — WEBGL ignores this for 3D but viewport remains) |
| **Draw Order** | Background → 3D Cube / 2D Radial (toggle) → HUD overlay |
| **Cursors per Frame** | Up to 30 cursors × 80 vertex calls = 2,400 vertices |
| **Cube Geometry** | 6 faces, wireframe edges, 5×5 claim grid per face |
| **Nesting Layers** | 5 levels (depth 0-4), size reduction 20% per layer |
| **Camera** | Auto-orbit Y-axis, mouse drag rotate, scroll zoom |
| **CubeSnekEngine** | New `visuals-cube.js` module, NOT modifying `visuals.js` |

**Key Constraints**:
- Must maintain 30fps with 30 cursors each rendering 80 trail segments (2,400 vertices total)
- New file only — zero changes to `visuals.js` or the 30 radial visual types
- WEBGL context for cube, P2D for HUD overlay drawn on top
- No textures, no lighting, no shadows — pure vertex() line rendering
- No external 3D libraries — pure p5.js WEBGL primitives

---

## Architecture Decisions

### D1: Separate File, Not Extension (visuals-cube.js)
**Decision**: Create a new `p5-sketch/visuals-cube.js` containing `CubeSnekEngine` and `AxisCursor`. Do NOT touch `visuals.js`.
**Why**: Phase 3's 30 radial visuals are 2D-only and optimized differently. Mixing WEBGL and 2D logic in one file would be confusing. Separate modules can be tested independently.
**Trade-off**: Some radial layout math is duplicated if 3D mode ever needs radial positions. Acceptable — 3D mode is fundamentally different (shared cube vs individual wedges).

### D2: VisualModeManager for Toggling
**Decision**: A `VisualModeManager` class in `sketch.js` owns the toggle state and routes draw calls to the active engine.
**Why**: Keeping toggle logic out of both Visuals and CubeSnekEngine keeps each engine pure. Manager only needs to know two methods: `draw()` on whichever engine is active.
**Trade-off**: Manager introduces a trivial indirection. But it cleanly separates mode-switching from rendering logic. The 'c' key handler calls `modeManager.toggle()` — that's it.

### D3: CubeSnekEngine — Composable, Not Inheritable
**Decision**: `CubeSnekEngine` is a standalone class with no inheritance from Visuals. It takes config, manages 30 cursors, and has its own draw loop.
**Why**: WEBGL rendering is fundamentally different from 2D Canvas. Shared state (orbit angle, cursor positions, claims grid) is unique to the cube mode. Inheritance would force awkward abstractions.
**Structure**:
```
CubeSnekEngine
  ├── this.faces[6]         — Face objects (each with 5×5 claims grid)
  ├── this.cursors[30]      — AxisCursor instances
  ├── this.orbitAngle       — camera orbit state
  └── this.cameraTilt       — mouse drag tilt state

CubeSnekEngine.draw()
  ├── p.push(), p.translate(0,0,0)
  ├── p.rotateY(orbitAngle), p.rotateX(cameraTilt)
  ├── draw all 6 faces (wireframe + grid dots)
  ├── for each active cursor:
  │     draw cursor trail as vertex() line strip
  │     draw cursor head as sphere/dot
  └── p.pop()
```

### D4: AxisCursor — Grid-Based Movement
**Decision**: Each cursor moves on a discrete 5×5 grid on its assigned face. Movement is step-by-step (not continuous). Direction is determined by phone orientation (α maps to horizontal, β to vertical bias).
**Why**: Grid-based movement matches the reference sketch ("Cube Snek" at p5 editor). Discrete positions make claims tracking simple. Step-by-step movement gives clear visual trails.
**Movement Algorithm**:
```
Input: alpha (0-360°), beta (-180 to 180°)
1. Normalize alpha to 0-1 → horizontal direction bias
2. Normalize beta to 0-1 → vertical direction bias
3. From current grid position, evaluate 4 adjacent cells (up/down/left/right)
4. Filter out occupied cells
5. From available cells, pick direction closest to sensor bias
6. If no unoccupied adjacent cells → trigger nesting
```

### D5: SensorMapper (3D) — Separate from Phase 3 Mapper
**Decision**: `CubeSnekEngine` contains its own `SensorMapper` helper that converts sensor data to cursor parameters. This is independent of `sensor-mapper.js`.
**Why**: Phase 3's sensor-mapper normalizes for audio (0-1 range, EMA smoothing). Cube mode needs different mappings (cardinal directions, raw gyro values for brightness). Same sensor source, different interpretation.
**Mappings**:
| Sensor | Output | Range | Use |
|--------|--------|-------|-----|
| orientation.α | horizontalBias | 0-1 | Weight toward left/right movement |
| orientation.β | verticalBias | 0-1 | Weight toward up/down movement |
| accel magnitude | nestUrgency | 0-1 | Threshold for preferring nesting |
| accel.x | trailLength | 20-80 | Active trail segments |
| gyro.z | lineBrightness | 0.2-1.0 | Stroke luminance |

---

## File Changes Summary

| File | Change | Lines Changed |
|------|--------|---------------|
| `p5-sketch/visuals-cube.js` | **NEW** — CubeSnekEngine, AxisCursor, Face, SensorMapper | ~400 new |
| `p5-sketch/sketch.js` | Add VisualModeManager, CubeSnekEngine instantiation, 'c' handler | ~30 lines |
| `p5-sketch/device-manager.js` | Add `cubeSnek` param, lifecycle hooks in updateSensor | ~10 lines |
| `p5-sketch/index.html` | Add `visuals-cube.js` script tag | 1 line |
| `p5-sketch/config.js` | Add `cubeMode` config section | ~20 lines |
| `tests/p5-sketch/visuals-cube.test.js` | **NEW** — ~15 tests | ~200 lines |

---

## Data Flow

```
Bridge WebSocket → sketch.js handleMessage(msg)
  → dm.assign(slot)     → engine.createVoice + visuals.createVisual
                          + cubeSnek.createCursor(slot)      [if cube mode]
  → dm.updateSensor()   → engine.updateVoice
                          + visuals.updateVisual
                          + cubeSnek.updateSensor(slot, type, data)
  → dm.disconnect(slot) → engine.disposeVoice + visuals.disposeVisual
                          + cubeSnek.disposeCursor(slot)

Frame loop (cube mode):
  sketch.js draw() {
    background(0,0,8)
    p.push() | p.translate(centerX, centerY)
    cubeSnek.draw(activeSlots, sensorCache)   // WEBGL context
    p.pop()
    dm.drawHUD()                               // P2D overlay
  }

Sensor → Cursor flow (per frame):
  updateSensor(slot, "orientation", {alpha, beta, gamma})
    → cursor.setDirection(alpha, beta)
  
  updateSensor(slot, "accel", {x, y, z})
    → cursor.setNestUrgency(magnitude)
  
  updateSensor(slot, "gyro", {alpha, beta, gamma})
    → cursor.setBrightness(gyro.z)
  
  cubeSnek.update()  // called in draw:
    → for each active cursor: cursor.tick()
      → evaluate direction bias
      → check adjacent cells for occupancy
      → move or nest
      → append position to trail
```

---

## Module Structure

### p5-sketch/visuals-cube.js — Exports

```js
export { CubeSnekEngine, AxisCursor, Face, SensorMapper };
```

Or, since p5 sketches use global scope via script tags, these are constructor functions attached to the global scope:

```js
class CubeSnekEngine {
  constructor(config)            // init 6 faces, 30 cursor slots, camera state
  createCursor(slot)             // create AxisCursor for a phone
  disposeCursor(slot)            // remove cursor, free claims
  updateSensor(slot, type, data) // route sensor data to cursor + mapper
  draw(activeSlots, sensorCache) // render cube + all active cursors
  getCursorState(slot)           // { nestingLevel, faceIndex, gridX, gridY, brightness }
  destroy()                      // full cleanup
}

class AxisCursor {
  constructor(slot, faceIndex, config)  // set initial grid position
  setDirection(alpha, beta)             // update movement bias
  setNestUrgency(urgency)               // 0-1, threshold for nesting
  setBrightness(value)                  // 0.2-1.0
  tick(claimsGrid)                      // evaluate and move one step
  draw(p, offset)                       // render trail + head
  getState()                            // { x, y, nestingLevel, ... }
  dispose()                             // cleanup
}

class Face {
  constructor(faceIndex, config)   // init 5×5 claims grid
  get claimsGrid()                 // 5×5 boolean array
  isCellOccupied(x, y)             // check if cell is claimed
  claimCell(x, y, cursorId)        // claim a cell
  releaseCell(x, y)                // free a cell
  isFull()                         // all 25 cells claimed
  getAdjacentCells(x, y)           // [{x, y, dir}] of unoccupied neighbors
  reset()                          // clear all claims
}

class SensorMapper {
  static orientationToDirection(alpha, beta)  // → { dx, dy }
  static accelToNestUrgency(accelData)        // → 0-1
  static gyroToBrightness(gyroData)           // → 0.2-1.0
  static accelToTrailLength(accelData)        // → 20-80
}
```

---

## Test Strategy

| Module | Test File | Count | What to Test |
|--------|-----------|-------|-------------|
| CubeSnekEngine | `tests/p5-sketch/visuals-cube.test.js` | ~15 | constructor, create/dispose cursor, face assignment, draw, sensor update, state query, nesting, toggle |
| AxisCursor | (same) | — | move, claims, trail bounds, nesting trigger, direction from sensor |
| Face | (same) | — | 5×5 grid, claim/release, isFull, adjacent cells |
| SensorMapper | (same) | — | orientation→direction, accel→urgency, gyro→brightness |
| Existing tests | All Phase 0-3 tests | 138 | Must still pass with integration changes |

**Testing approach**: Cube mode components are tested by:
1. Instantiating CubeSnekEngine and verifying 6 faces, 30 cursor slots
2. Creating cursors and checking correct face assignment (slot→face math)
3. Calling cursor.tick() and verifying grid position changes
4. Filling a face grid and checking nesting trigger
5. Verifying trail bounded at 80 segments
6. Calling draw with mock p5 context (or verifying no throws)
7. Verifying sensor data maps to correct cursor parameters
8. Verifying getCursorState returns correct data

---

## Implementation Strategy

1. **Patch config.js** — Add `cubeMode` config section. Quick edit, unblocks everything.
2. **Patch index.html** — Add script tag. One line.
3. **Patch device-manager.js** — Add `cubeSnek` constructor param, lifecycle hook in updateSensor. Minimal changes.
4. **Patch sketch.js** — Instantiate CubeSnekEngine + VisualModeManager, add 'c' key handler, route draw.
5. **Write tests first** (RED) — Then implement visuals-cube.js (GREEN). Core work.
6. **Sound integration** — Wire nesting depth into SoundEngine via getCursorState.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WEBGL + 2D overlay causes rendering glitches | Medium | Medium | Use createGraphics() for separate layers, or setRenderer() based on mode |
| 30 cursors × 80 segments = 2,400 vertices drops below 25fps | Low | Medium | Profile on target hardware; reduce trail length to 60 if needed |
| Nesting algorithm creates infinite loop | Low | Medium | Max nesting 5 levels; hard cap on tick() iterations per frame |
| Mouse drag conflicts with auto-orbit | Low | Low | 2s timeout on auto-orbit after last drag; drag sets cameraTilt directly |
| Phone with no gyro data has stuck cursor | Low | Low | Default brightness 0.6; cursor stays at last known position |
| Mode toggle loses cursor state | Low | High | Both engines persist state independently; toggle only changes which draw() is called |
| Grid claims leak on disconnect | Low | High | disposeCursor() releases all cells claimed by that cursor |
