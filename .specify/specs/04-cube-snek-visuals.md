# Phase 4 — Cube Snek: 3D Collaborative Visual Mode

**Status**: Draft
**Priority**: P1 — Core experience enabler
**Dependencies**: p5.js WEBGL, Phase 3 (visuals.js radial renderers), existing sketch.js infrastructure

---

## Architecture

```
Phase 4 adds an ALTERNATE 3D rendering mode alongside the existing 2D radial mode:

sketch.js draw()
  ├── background()
  ├── if (mode === 'radial'):
  │     └── v.drawAll(dm.activeSlots, CONFIG)         ← Phase 3 2D visuals
  ├── if (mode === 'cube'):
  │     └── cubeSnek.draw(dm.activeSlots, sensorCache) ← Phase 4 3D cube
  └── dm.drawHUD()                                      ← always on top

Keypress 'c' toggles mode:
  'radial' ↔ 'cube'

Data flow: same sensor data → two parallel visual outputs:
  1. 2D Radial (Visuals class in visuals.js) — already built
  2. 3D Cube (CubeSnekEngine class in visuals-cube.js) — this phase
```

**Key decisions**:
- **New file, not modification** — `visuals-cube.js` is entirely separate from `visuals.js`. No changes to existing 30 visual renderers.
- **WEBGL renderer** — p5.js `WEBGL` mode for the cube context. 2D mode still uses `P2D`.
- **VisualModeManager** — new coordinator in sketch.js that toggles between `v.drawAll()` (radial) and `cubeSnek.draw()` (cube).
- **Shared cube, not per-slot** — all 30 cursors crawl on ONE shared 3D cube. Opposite of Phase 3's radial approach.
- **6 faces × 5 cursors** — slot 0-4 → Face 0 (X+), 5-9 → Face 1 (X-), 10-14 → Face 2 (Y+), etc.
- **Canvas 2D for HUD, WEBGL for cube** — HUD overlay drawn in 2D on top of WEBGL render.
- **Cursor trail via vertex() lines** — no sprites, no textures. Each cursor stores 80 path segments drawn as a line strip.

---

## What To Build

A **CubeSnekEngine class** at `p5-sketch/visuals-cube.js` that:

1. Renders a shared 3D cube with 6 faces in WEBGL mode
2. Manages 30 cursors — one per phone — crawling on cube faces
3. Implements a claims grid on each face for cursor position tracking
4. Nesting mechanic: when 5 cursors fill a face, new cursor drops inward one layer
5. Sensor-driven cursor parameters: orientation → movement direction, accel → nesting depth, gyro → line brightness
6. Orbiting camera around the cube
7. Integrates with DeviceManager lifecycle

---

## User Stories

### US1 (P1): Basic Cube Snek — Toggle + Crawling

**As a** performer,
**I want** to press 'c' to switch from 2D radial view to a 3D cube with cursors crawling on its faces,
**so that** the visuals change dramatically when I want to show the phones working together.

**Acceptance Criteria**:
- Pressing 'c' toggles between 2D radial mode and 3D cube mode
- 30 cursors appear on a shared 3D cube, distributed 5 per face
- Each cursor moves in response to its phone's deviceorientation data
- Cursor trails are visible as line strips on cube faces
- Toggling back to 2D mode restores radial visuals unchanged
- No errors in console on mode switch

### US2 (P2): Nesting + Camera

**As a** performer,
**I want** cursors to drop inward when a face is full and the camera to orbit around the cube,
**so that** the visual grows more complex over time and stays interesting from all angles.

**Acceptance Criteria**:
- When 5 cursors occupy a face, the next cursor on that face drops inward (smaller cube layer)
- Nesting depth is visible as the cursor moving to a smaller inset face
- Camera auto-orbits around the Y axis
- Camera can be tilted with mouse drag
- Up to 5 nesting layers (6 cubes of decreasing size)
- Nesting layer offset is visible as Z displacement from face surface

### US3 (P3): Sound Integration

**As a** performer,
**I want** nesting depth to affect sound parameters and gyroscope data to affect line brightness,
**so that** the audio-visual connection is maintained in 3D mode.

**Acceptance Criteria**:
- Cursor nesting depth modulates its paired voice's filter cutoff (deeper = darker)
- Nesting depth also modulates reverb send and pitch shift
- Line brightness maps to gyroscope Z-axis (more rotation = brighter)
- Each cursor's visual state matches its audio state (same sensor map)
- Sound parameters return to normal when toggling back to 2D mode

---

## Requirements

### FR-001: VisualModeManager
The system MUST provide a `VisualModeManager` in `sketch.js` that:
- Tracks the current visual mode: `'radial'` or `'cube'`
- Toggles mode on 'c' keypress
- Routes draw calls to the active visual engine
- Preserves state of both engines across toggles

### FR-002: CubeSnekEngine
The system MUST provide a `CubeSnekEngine` class that:
- Renders a 3D cube with 6 colored faces in WEBGL mode
- Manages 30 `AxisCursor` instances — one per slot
- Maps slot number to face: `Math.floor(slot / 5)` gives face index (0-5)
- Maps slot to face-local position: `slot % 5` gives cursor index on that face
- Calls `p.push()/pop()` per frame for the WEBGL context
- Provides a `draw(activeSlots, sensorCache)` method called from sketch.js

### FR-003: AxisCursor Class
The system MUST provide an `AxisCursor` class that:
- Stores position on a face grid (x, y in grid units)
- Stores a trail of up to 80 {x, y, z} path segments
- Moves in response to `move(direction)` calls from sensor data
- Claims grid cells on its face — no two cursors on same cell
- Draws its trail as a `beginShape(LINES)` / `vertex()` strip
- Supports `setNestingLevel(level)` for inward layers

### FR-004: 6 Face Geometry
The system MUST render 6 cube faces at correct 3D positions:
- Face 0: X+ (right), Face 1: X- (left)
- Face 2: Y+ (top), Face 3: Y- (bottom)
- Face 4: Z+ (front), Face 5: Z- (back)
- Each face is a square with a 5×5 grid of claimable points
- Face edges drawn as semi-transparent wireframe
- Each face has a distinct tint color (hue shifted by face index × 60°)

### FR-005: Claims Grid
The system MUST maintain a claims grid per face:
- 5×5 grid of points on each face
- Cursor claims a grid point when moving to it
- Claimed points are drawn as small dots
- Cursors cannot move to an already-claimed point
- When all 25 points on a face are claimed, cursors on that face are forced to nest

### FR-006: Nesting Mechanic
The system MUST implement nesting:
- When a cursor cannot find an unclaimed adjacent cell, it drops inward by one layer
- Nesting creates a smaller inset cube face at a Z offset from the main face surface
- Nesting layers: 5 levels (0-4), each reducing face size by 20%
- Layer offset: `level * (cubeSize / 10)` inward from face surface
- Cursor trail opacity reduces with nesting depth: `1.0 - (level * 0.15)`

### FR-007: Sensor-Driven Cursor Parameters
The system MUST map sensor axes to cursor parameters:

| Sensor Axis | Cursor Parameter | Mapping |
|-------------|-----------------|---------|
| orientation.α | Direction on face (horizontal axis) | α remapped 0-360° → 4 cardinal directions |
| orientation.β | Direction on face (vertical axis) | β tilt bias → direction preference |
| accel magnitude | Nesting trigger urgency | High magnitude → prefer nesting |
| gyro.z | Line brightness | gyro.z 0-360 → brightness 0.2-1.0 |
| accel.x | Trail length (80 max) | accel.x 0-1 → trail segments 20-80 |

### FR-008: Camera Control
The system MUST provide camera controls:
- Auto-orbit around Y axis at configurable speed (default: 0.005 rad/frame)
- Mouse drag to rotate camera (when held)
- Mouse wheel to zoom in/out
- Camera distance: configurable (default: `cubeSize * 3.5`)
- Camera look-at: always the cube center (origin)

### FR-009: Performance
The system MUST maintain 30fps with:
- 30 cursors × 80 trail segments = 2,400 vertex() calls per frame
- 6 cube faces rendered as wireframe squares
- Claims grid dots (25 per face × 6 faces = 150 dots)
- No textures, no lighting, no shadows

### FR-010: Keypress Toggle
The system MUST respond to the 'c' key:
- Press 'c' once: switch from current mode to other mode
- Mode is stored in `VisualModeManager.mode`
- Switching mode does NOT reset cursor/visual state of either engine
- 'c' key handler must not interfere with other key handlers

### FR-011: Independent Sensor Mapping
The system MUST maintain a separate sensor mapping path for 3D cube mode:
- `CubeSnekEngine.updateSensor(slot, sensorData)` called from DeviceManager
- Mapping is independent of Phase 3 visual mapping
- Uses `SensorMapper` helper class in `visuals-cube.js`
- Default mappings per PLAN.md sensor→parameter table

### FR-012: 3D-to-Sound Bridge
The system MUST expose nesting depth and cursor state for sound modulation:
- `CubeSnekEngine.getCursorState(slot)` returns `{ nestingLevel, faceIndex, gridX, gridY, brightness }`
- SoundEngine reads nesting level to modulate filter, pitch, reverb
- Deeper nesting: lower filter cutoff, lower pitch, more reverb
- Depth 0: normal sound. Depth 4: heavily filtered/processed

---

## Integration Points

### Changes to Existing Files

**p5-sketch/sketch.js** — Add VisualModeManager + CubeSnekEngine:
```js
let v, cubeSnek, modeManager;       // add cubeSnek, modeManager

function setup() {
  // ... existing setup with createCanvas(P2D) ...
  v = new Visuals(CONFIG);
  cubeSnek = new CubeSnekEngine(CONFIG);     // NEW
  modeManager = new VisualModeManager(v, cubeSnek); // NEW
}

function draw() {
  modeManager.draw(dm.activeSlots, dm.sensorCache);
  dm.drawHUD();
}

function keyPressed() {
  if (key === 'c') { modeManager.toggle(); }
}
```

**p5-sketch/device-manager.js** — Add CubeSnek lifecycle calls:
```js
updateSensor(slot, sensorType, data) {
  // ... existing audio update ...
  if (this._cubeSnek) {
    this._cubeSnek.updateSensor(slot, sensorType, data);
  }
}
```

**p5-sketch/index.html** — Add script tag:
```html
<script src="visuals.js"></script>
<script src="visuals-cube.js"></script>     <!-- NEW -->
<script src="device-manager.js"></script>
```

**p5-sketch/config.js** — Add 3D mode config:
```js
cubeMode: {
  enabled: true,
  cubeSize: 200,
  gridSize: 5,          // 5×5 grid per face
  maxTrailLength: 80,
  orbitSpeed: 0.005,
  nestingLevels: 5,
  faceColors: [
    { h: 0, s: 60, b: 80 },   // Face 0: red
    { h: 60, s: 60, b: 80 },  // Face 1: yellow
    { h: 120, s: 60, b: 80 }, // Face 2: green
    { h: 180, s: 60, b: 80 }, // Face 3: cyan
    { h: 240, s: 60, b: 80 }, // Face 4: blue
    { h: 300, s: 60, b: 80 }, // Face 5: purple
  ]
}
```

### No Changes Needed To
- `visuals.js` — pure 2D radial visuals, no 3D concern
- `sound-engine.js` — reads cursor state via getter, no direct coupling
- `audio-bus.js` — pure audio routing
- `sensor-mapper.js` — Cube mode has its own mapper in visuals-cube.js
- `server-bridge/` — no bridge changes needed

---

## TDD Requirements

### New Tests

**tests/p5-sketch/visuals-cube.test.js** — ~15 tests:
- CubeSnekEngine constructor creates 6 faces with correct geometry
- AxisCursor moves in 4 cardinal directions on face grid
- Cursor claims grid cells — cannot move to occupied cell
- Nesting increments when face grid is full
- Trail length stays bounded at 80 segments
- Face assignment: slot 0→Face 0, slot 4→Face 0, slot 5→Face 1, slot 29→Face 5
- Sensor data updates cursor direction correctly
- Camera orbit angle increments each frame
- Toggle between modes works without errors
- Mode switch preserves state
- getCursorState returns correct nesting level
- draw() with 0, 1, 30 active slots doesn't throw
- draw() with all cursors at max nesting doesn't throw
- Nesting layer offset is correct distance from face surface
- Orientation α/β maps to cardinal directions

### Existing Tests That Still Pass
- Bridge tests (34): no bridge changes
- Simulator tests (50): no simulator changes
- Phase 2 tests (39): no audio changes
- Phase 3 tests (~15): visuals.js not modified

---

## Implementation Order

```
Step 1: Update config.js — add cubeMode config section
Step 2: Update index.html — add visuals-cube.js script tag
Step 3: Write TDD RED tests — visuals-cube.test.js
Step 4: Implement CubeSnekEngine + AxisCursor in visuals-cube.js
Step 5: Implement VisualModeManager in sketch.js
Step 6: Update device-manager.js — add CubeSnek lifecycle hooks
Step 7: Run ALL tests + manual integration verification
Step 8: Atomic commits + graphify update
```

---

## Success Criteria

- [ ] 'c' key toggles between 2D radial mode and 3D cube mode
- [ ] 30 cursors appear on cube faces, 5 per face
- [ ] Cursors move in response to phone orientation data
- [ ] Cursor trails render as visible line strips
- [ ] Nesting works: full face → cursor drops inward
- [ ] Camera orbits automatically, mouse drag and wheel work
- [ ] Nesting depth modulates sound (filter/pitch/reverb)
- [ ] Frame rate stays above 25fps with 30 active cursors
- [ ] Toggling modes preserves state in both engines
- [ ] No errors on rapid connect/disconnect in 3D mode
- [ ] All existing Phase 0-3 tests still pass
- [ ] No modifications to visual.js or sound-engine.js

---

## Edge Cases

| Edge Case | Expected Behavior |
|-----------|------------------|
| **0 active slots** | Cube renders with no cursors. Wireframe still visible. 'c' toggle still works. |
| **1 active slot** | Single cursor on Face 0 at grid (0,0). Moves normally. |
| **6+ active slots** | Cursors spill to Face 1 (slot 5). Face 0 has 5 cursors at grid points. |
| **30 active slots** | All 6 faces have 5 cursors. All cursors claiming grid points. |
| **Face grid full, no nesting possible** | Cursors stop moving. Trail frozen. New sensor input ignored until cell opens. |
| **Rapid mode toggle** | State preserved. No memory leak. No visual glitch on switch. |
| **Window resize** | Cube re-centers. Canvas redraws correctly. |
| **All disconnected mid-cube-mode** | Cursors removed. Cube wireframe remains. No orphan state. |
| **Phone with no orientation data** | Cursor stays at last known position. Doesn't move until data resumes. |
| **Nesting depth maxed (all 5 layers)** | Cursor at innermost layer. Further input ignored for nesting. |
| **Mouse drag during auto-orbit** | Drag overrides auto-orbit temporarily. Auto-orbit resumes after 2s of no drag. |
