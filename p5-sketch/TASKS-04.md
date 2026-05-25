# Tasks: Phase 4 — Cube Snek 3D Visual Mode

**Input**: `.specify/specs/04-cube-snek-visuals.md` (spec) + `p5-sketch/PLAN-04.md` (tech plan)
**Prerequisites**: Phase 3 (radial visuals) complete — ~138 tests passing
**Tests**: MANDATORY per TDD constitution. Write failing tests FIRST.

---

## Phase 4a: Setup — Skeleton + Integration Points

**Purpose**: Create the `visuals-cube.js` skeleton, patch existing files so integration works.

- [ ] **T001** 🔴 TDD RED — Write initial CubeSnekEngine skeleton tests
  - Create `tests/p5-sketch/visuals-cube.test.js`
  - Tests:
    - CubeSnekEngine can be instantiated with config (no throw)
    - CubeSnekEngine creates 6 Face instances
    - Each Face has a 5×5 claims grid (all false initially)
    - AxisCursor can be instantiated with slot + faceIndex
    - AxisCursor starts at grid (0, 0) on its face
    - SensorMapper.orientationToDirection returns { dx, dy } for all 4 quadrants
    - SensorMapper.gyroToBrightness maps 0→0.2, 180→0.6, 360→1.0
  - Run `npm test` — ALL must FAIL (visuals-cube.js doesn't exist)

- [ ] **T002** 🟢 TDD GREEN — Create `p5-sketch/visuals-cube.js` skeleton
  - Define classes with empty method stubs:
    - `CubeSnekEngine` (constructor, createCursor, disposeCursor, updateSensor, draw, getCursorState)
    - `AxisCursor` (constructor, setDirection, setNestUrgency, setBrightness, tick, draw, getState, dispose)
    - `Face` (constructor, claimsGrid, isCellOccupied, claimCell, releaseCell, isFull, getAdjacentCells, reset)
    - `SensorMapper` (static methods only)
  - Face constructor: create 5×5 boolean `_claims` array, all false
  - AxisCursor constructor: store `slot`, `faceIndex`, set `_x = 0`, `_y = 0`, `_trail = []`
  - CubeSnekEngine constructor: create 6 Face instances in `this.faces[]`
  - Stub methods should return sensible defaults (e.g., `getAdjacentCells` returns empty array)
  - Run `npm test` — all tests PASS (GREEN)

- [ ] **T003** Update `p5-sketch/config.js` — Add cubeMode config section
  - Add to CONFIG object:
    ```js
    cubeMode: {
      enabled: true,
      cubeSize: 200,
      gridSize: 5,
      maxTrailLength: 80,
      orbitSpeed: 0.005,
      nestingLevels: 5,
      faceColors: [
        { h: 0, s: 60, b: 80 },
        { h: 60, s: 60, b: 80 },
        { h: 120, s: 60, b: 80 },
        { h: 180, s: 60, b: 80 },
        { h: 240, s: 60, b: 80 },
        { h: 300, s: 60, b: 80 },
      ]
    }
    ```
  - Run `npm test` — all existing tests must still pass

- [ ] **T004** Update `p5-sketch/index.html` — Add script tag
  - Insert `<script src="visuals-cube.js"></script>` after `visuals.js`
  - This ensures CubeSnekEngine is available for instantiation

- [ ] **T005** Update `p5-sketch/device-manager.js` — Add CubeSnek lifecycle hooks
  - Constructor: add optional 4th param `cubeSnek` (stored as `this._cubeSnek`)
  - `updateSensor(slot, sensorType, data)`: after audio+visual update, call `this._cubeSnek?.updateSensor(slot, sensorType, data)`
  - `assign(slot)`: call `this._cubeSnek?.createCursor(slot)`
  - `disconnect(slot)`: call `this._cubeSnek?.disposeCursor(slot)`
  - Run `npm test` — all existing tests must still pass

- [ ] **T006** Update `p5-sketch/sketch.js` — Add VisualModeManager + CubeSnekEngine
  - Add globals: `let cubeSnek, modeManager;`
  - In `setup()`: instantiate `cubeSnek = new CubeSnekEngine(CONFIG)`
  - Instantiate `modeManager = new VisualModeManager(v, cubeSnek)`
  - Pass `cubeSnek` to DeviceManager: `dm = new DeviceManager(engine, CONFIG, v, cubeSnek)`
  - In `draw()`: replace direct `v.drawAll(...)` call with `modeManager.draw(dm.activeSlots, dm.sensorCache)`
  - Add `keyPressed()` handler: `if (key === 'c') { modeManager.toggle(); }`
  - Add `VisualModeManager` class:
    ```js
    class VisualModeManager {
      constructor(visuals, cubeSnek) {
        this._visuals = visuals;
        this._cubeSnek = cubeSnek;
        this.mode = 'radial';  // or 'cube'
      }
      toggle() {
        this.mode = (this.mode === 'radial') ? 'cube' : 'radial';
      }
      draw(activeSlots, sensorCache) {
        if (this.mode === 'radial') {
          this._visuals.drawAll(activeSlots, CONFIG);
        } else {
          this._cubeSnek.draw(activeSlots, sensorCache);
        }
      }
    }
    ```
  - Run `npm test` — all existing must still pass

**Checkpoint**: Page loads without errors. 'c' key toggles mode (cube mode renders nothing yet — no draw implementation). No console errors.

---

## Phase 4b: Core Cube Rendering (WEBGL Setup + 6 Faces)

**Purpose**: Implement the 3D cube wireframe, face coloring, and claims grid dots.

- [ ] **T007** 🔴 TDD RED — Write Face drawing tests
  - Tests:
    - Face.claimCell sets cell to true
    - Face.releaseCell sets cell to false
    - Face.isFull returns true when all 25 cells claimed, false otherwise
    - Face.isCellOccupied returns correct value after claim/release
    - Face.getAdjacentCells returns 2-4 neighbors (edge cells == fewer)
    - Face.getAdjacentCells excludes occupied cells
    - Face.reset clears all claims

- [ ] **T008** 🟢 TDD GREEN — Implement Face class fully
  - `_claims`: 5×5 boolean array (Array of Arrays)
  - `claimCell(x, y, cursorId)`: set `_claims[y][x] = cursorId`
  - `releaseCell(x, y)`: set `_claims[y][x] = false`
  - `isCellOccupied(x, y)`: return `!!_claims[y][x]`
  - `isFull()`: every cell is occupied
  - `getAdjacentCells(x, y)`:
    - Check 4 neighbors (up/down/left/right)
    - Filter bounds (0 ≤ x < 5, 0 ≤ y < 5)
    - Filter occupied cells
    - Return `[{x, y, direction}]` where direction is 'up'|'down'|'left'|'right'
  - `reset()`: fill all cells with false
  - Run `npm test` — Face tests PASS

- [ ] **T009** 🔴 TDD RED — Write cube rendering tests
  - Tests:
    - CubeSnekEngine.draw() does not throw with 0 active cursors
    - CubeSnekEngine.draw() renders 6 face wireframes (verify via mock or no-throw)
    - Cube Face positions: Face 0 at (+size/2, 0, 0), Face 4 at (0, 0, +size/2)
    - Grid dots appear at correct 3D positions on each face
    - Face wireframe uses correct color from config

- [ ] **T010** 🟢 TDD GREEN — Implement WEBGL cube rendering in CubeSnekEngine.draw()
  - Use `p.push()` / `p.pop()` for the WEBGL context
  - `p.translate(CONFIG.centerX, CONFIG.centerY, 0)` to center cube
  - For each of 6 faces:
    - `p.push()`
    - `p.rotateY()` / `p.rotateX()` to orient face correctly
    - `p.translate(0, 0, cubeSize/2)` to position at face surface
    - Draw wireframe: `beginShape(LINES)`, 4 edges via vertex()
    - Draw grid dots: 5×5 small circles at grid positions
    - `p.pop()`
  - Face rotations:
    - Face 0 (X+): `rotateY(HALF_PI)`
    - Face 1 (X-): `rotateY(-HALF_PI)`
    - Face 2 (Y+): `rotateX(-HALF_PI)`
    - Face 3 (Y-): `rotateX(HALF_PI)`
    - Face 4 (Z+): no rotation
    - Face 5 (Z-): `rotateY(PI)`
  - Run `npm test` — cube rendering tests PASS

**Checkpoint**: Cube wireframe visible in browser with grid dots on all 6 faces. No cursors yet. Camera static.

---

## Phase 4c: 30 Cursors with Sensor Control

**Purpose**: Implement cursor movement on face grids, trail rendering, and sensor-driven direction.

- [ ] **T011** 🔴 TDD RED — Write AxisCursor movement tests
  - Tests:
    - cursor.tick() moves to adjacent cell when direction set
    - cursor.tick() does not move into occupied cell
    - cursor.tick() appends position to trail
    - cursor trail is bounded at maxTrailLength (80)
    - cursor.setDirection() updates internal direction bias
    - cursor.draw() does not throw with empty trail
    - cursor.draw() does not throw with 80 trail segments
    - Slot-to-face mapping: slot 0→Face 0, slot 5→Face 1, slot 29→Face 5
    - Cursor starting position on face: slot % 5 determines initial grid y (row)

- [ ] **T012** 🟢 TDD GREEN — Implement AxisCursor fully
  - `constructor(slot, faceIndex, config)`:
    - `slot`, `faceIndex` stored
    - `_x = 0`, `_y = slot % 5` (each cursor starts on different row)
    - `_trail = []`
    - `_directionBias = { horizontal: 0, vertical: 0 }`
    - `_nestUrgency = 0`, `_brightness = 0.6`
    - `_nestingLevel = 0`
  - `setDirection(alpha, beta)`:
    - Normalize alpha (0-360) to horizontalBias (-1 to 1): `cos(radians(alpha))`
    - Normalize beta (-180 to 180) to verticalBias (-1 to 1): `beta / 180`
    - Store as `_directionBias`
  - `setNestUrgency(value)`: clamp 0-1
  - `setBrightness(value)`: clamp 0.2-1.0
  - `tick(face)`:
    - Get adjacent unoccupied cells via `face.getAdjacentCells(_x, _y)`
    - If none: trigger nesting (see Phase 4d)
    - Pick cell closest to `_directionBias`
      - Score each cell by dot product of (cell direction vector × bias)
      - `dx = cell.x - _x`, `dy = cell.y - _y`
      - Score = `dx * horizontalBias + dy * verticalBias`
    - Move to chosen cell: `_x = cell.x`, `_y = cell.y`
    - Add position to trail: `_trail.push({ x: _x, y: _y, z: _nestingLevel })`
    - If trail > maxTrailLength: shift oldest
    - Claim new cell, release old cell on face
  - `draw(p, offset)`:
    - `p.push()`
    - `p.stroke(255 * _brightness)`
    - `p.strokeWeight(2)` for trail, `p.strokeWeight(4)` for head
    - `p.beginShape(LINES)` — walk trail segments, `vertex()` each point
    - Map grid coords to 3D positions: `x = map(gridX, 0, 4, -halfSize, halfSize)`
    - Draw cursor head as small sphere or dot
    - `p.pop()`
  - `getState()`: return `{ x: _x, y: _y, nestingLevel: _nestingLevel, brightness: _brightness }`
  - `dispose()`: clear trail, release face cells
  - Run `npm test` — cursor movement tests PASS

- [ ] **T013** Update CubeSnekEngine — manage cursors, route sensor data
  - `createCursor(slot)`:
    - `faceIndex = Math.floor(slot / 5)`
    - Create `AxisCursor(slot, faceIndex, config)`
    - Store in `this._cursors[slot]`
  - `disposeCursor(slot)`:
    - Cursor releases face cells
    - Delete from `this._cursors[slot]`
  - `updateSensor(slot, type, data)`:
    - Get cursor at slot (ignore if null)
    - If type === 'orientation': `cursor.setDirection(data.alpha, data.beta)`
    - If type === 'accel': `cursor.setNestUrgency(magnitude(data))`
    - If type === 'gyro': `cursor.setBrightness(data.beta)` (gyro Z = beta in p5)
  - `draw(activeSlots, sensorCache)`:
    - Apply orbit rotation (see Phase 4e)
    - Draw 6 faces
    - For each active slot: cursor.tick(face) then cursor.draw(p)
  - Run `npm test` — all tests PASS

**Checkpoint**: Cursors crawl on cube faces driven by simulated orientation data. Trails visible. Each face has 5 cursors starting on different rows.

---

## Phase 4d: Nesting Mechanic

**Purpose**: When a face grid is full, cursors drop inward to smaller layers.

- [ ] **T014** 🔴 TDD RED — Write nesting tests
  - Tests:
    - cursor with no available adjacent cells triggers nesting
    - cursor.nest() increments nestingLevel
    - cursor.nest() resets grid position to (0, 0) at new layer
    - nestingLevel max is CONFIG.cubeMode.nestingLevels (5)
    - cursor.trail positions reflect nesting Z-offset
    - Cursor on nested layer cannot move when its 5×5 sub-grid is full
    - draw() with all cursors at max nesting does not throw

- [ ] **T015** 🟢 TDD GREEN — Implement nesting in AxisCursor
  - `nest()`:
    - If `_nestingLevel >= config.cubeMode.nestingLevels`: return (can't nest further)
    - Increment `_nestingLevel`
    - Reset grid position: `_x = 0`, `_y = 0`
    - Add position to trail with Z-offset
  - In `tick(face)`:
    - If `getAdjacentCells` returns empty:
      - Check `_nestUrgency > 0.5` or all attempts exhausted
      - Call `nest()`
      - If nested, use the nested face grid (sub-grid)
      - If nestingLevel maxed, cursor stops moving (trail frozen)
  - Trail positions use Z = `_nestingLevel * (cubeSize / 10)` for inward offset
  - CubeSnekEngine.draw() applies nesting Z-offset to cursor positions:
    - `vertex(x, y, z + nestingLevel * (cubeSize / 10))`
  - Run `npm test` — nesting tests PASS

- [ ] **T016** visual verification — manual test
  - Simulate 30 phones with aggressive movement to fill face grids
  - Verify cursors nest inward when faces fill
  - Verify nested cursors have smaller face rendering (optional — Phase 5 polish)
  - Verify nesting stops at level 5

**Checkpoint**: Cursors nest inward when faces fill. Nesting visible as Z displacement from face surface. Capped at 5 layers.

---

## Phase 4e: Camera + Polish

**Purpose**: Orbiting camera, mouse controls, keypress toggle fully functional.

- [ ] **T017** 🔴 TDD RED — Write camera tests
  - Tests:
    - CubeSnekEngine.orbitAngle increments by orbitSpeed each frame
    - Camera applies orbitAngle as rotateY
    - Mouse drag sets cameraTilt
    - Mouse scroll changes camera distance
    - draw() with camera rotated 180° still renders correctly (no throw)

- [ ] **T018** 🟢 TDD GREEN — Implement camera system
  - In CubeSnekEngine constructor:
    - `_orbitAngle = 0`
    - `_cameraTilt = 0.3` (slight default tilt for 3D depth)
    - `_cameraDistance = CONFIG.cubeMode.cubeSize * 3.5`
    - `_lastDragTime = 0`
  - `update()` (called once per frame from draw()):
    - `_orbitAngle += CONFIG.cubeMode.orbitSpeed`
  - In `draw()`:
    - `p.push()`
    - `p.translate(CONFIG.centerX, CONFIG.centerY, 0)`
    - `p.rotateY(_orbitAngle)`
    - `p.rotateX(_cameraTilt)`
    - ... render faces + cursors ...
    - `p.pop()`
  - Mouse interaction (in sketch.js, forwarded to CubeSnekEngine):
    - `mouseDragged`: set `_cameraTilt += (pmouseY - mouseY) * 0.01`
    - `mouseWheel(event)`: set `_cameraDistance += event.delta * 0.5`
    - Auto-orbit pauses for 2000ms after last drag: `_lastDragTime = millis()`
    - If `millis() - _lastDragTime > 2000`: resume auto-orbit
  - Run `npm test` — camera tests PASS

- [ ] **T019** Polish: visual feedback on mode toggle
  - Brief crossfade or flash when toggling modes (optional)
  - HUD shows current mode: "Mode: RADIAL" / "Mode: CUBE"
  - Mode indicator drawn in drawHUD()
  - HUD still renders in P2D overlay on top of WEBGL cube
  - Ensure no flicker during toggle — switch modes at start of frame

**Checkpoint**: Camera orbits cube. Mouse drag tilts view. Scroll zooms. 'c' toggles between 2D radial and 3D cube modes cleanly. No flicker.

---

## Phase 4f: Sound Integration

**Purpose**: Nesting depth affects sound parameters (filter cutoff, pitch, reverb).

- [ ] **T020** 🔴 TDD RED — Write nesting→sound mapping tests
  - Tests:
    - CubeSnekEngine.getCursorState(slot) returns correct nestingLevel
    - getCursorState returns null for disconnected slot
    - getCursorState returns { nestingLevel, faceIndex, gridX, gridY, brightness }
    - SoundEngine receives nesting level after cursor update
    - Nesting depth 0: normal filter (no change)
    - Nesting depth 4: filter at 20% of normal, pitch -12 semitones, reverb 80%

- [ ] **T021** 🟢 TDD GREEN — Wire nesting depth into sound
  - In updateSensor() or after cursor.tick():
    - `const state = this.getCursorState(slot)`
    - `if (state) { this._emitNesting(slot, state.nestingLevel); }`
  - Add event emitter or direct call:
    - `onNestingChange` callback: `cubeSnek.onNestingChange((slot, level) => { ... })`
    - Or direct: `soundEngine.setNesting(slot, level)`
  - SoundEngine.setNesting(slot, level):
    - `filter.freq.rampTo(map(level, 0, 4, 20000, 500))` — lower cutoff
    - `voice.pitch -= level * 3` — 3 semitones per level
    - `reverbSend.gain.rampTo(level * 0.2)` — more reverb
  - Connect in sketch.js:
    ```js
    cubeSnek.onNestingChange((slot, level) => {
      engine.setNesting(slot, level);
    });
    ```
  - Run `npm test` — sound integration tests PASS

- [ ] **T022** Integration test: end-to-end
  - Start bridge + open p5 sketch
  - Connect 30 simulated phones
  - Switch to cube mode ('c')
  - Move phones aggressively to fill faces and trigger nesting
  - Verify: sound changes as cursors nest inward
  - Verify: switching back to 2D mode restores sound to normal
  - Verify: 30fps maintained, no audio glitches
  - Verify: disconnect phone removes cursor, sound returns to default

**Checkpoint**: Full feature complete. Cursors crawl, nest, sound changes with depth. Modes toggle cleanly. No performance issues.

---

## Task Summary

| Phase | Tasks | Files Changed/Created | Tests |
|-------|-------|-----------------------|-------|
| 4a Setup | T001-T006 | visuals-cube.js (NEW), config.js, index.html, device-manager.js, sketch.js | ~7 new (skeleton) |
| 4b Core Cube | T007-T010 | visuals-cube.js (Face + draw) | ~7 new (face/rendering) |
| 4c 30 Cursors | T011-T013 | visuals-cube.js (AxisCursor + sensor) | ~7 new (movement/trail) |
| 4d Nesting | T014-T016 | visuals-cube.js (nesting logic) | ~5 new (nesting) |
| 4e Camera | T017-T019 | visuals-cube.js (camera) + sketch.js (mouse) | ~4 new (camera) |
| 4f Sound | T020-T022 | visuals-cube.js (getCursorState) + sketch.js/sound-engine | ~4 new (sound) |

**Total new files**: 2 (visuals-cube.js, visuals-cube.test.js)
**Total modified files**: 4 (config.js, index.html, device-manager.js, sketch.js)
**Total new tests**: ~34
**Total tests (all phases)**: ~172
