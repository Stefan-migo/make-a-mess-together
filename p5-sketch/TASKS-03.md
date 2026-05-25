# Tasks: Phase 3 — p5 Sketch Visuals

**Input**: `.specify/specs/03-p5-sketch-visuals.md` (spec) + `p5-sketch/PLAN-03.md` (tech plan)
**Prerequisites**: Phase 2 (audio engine) complete — 123 tests passing
**Tests**: MANDATORY per TDD constitution. Write failing tests FIRST.

---

## Phase 3a: Integration Points (Steps 1-4)

**Purpose**: Modify existing files to create hooks for visuals — no new module yet.

- [ ] **T001** Add `visualType` to all 30 slots in `p5-sketch/config.js`
  - Add field: `visualType: "pulsingCircle"` to slot 0, `visualType: "rotatingLine"` to slot 1, etc.
  - 30 visual types mapped by slot index (see full table in spec)
  - Visual type naming convention: camelCase, matches the visual factory key
  - Run tests to verify nothing broken (all existing tests must pass)

- [ ] **T002** Add visuals.js script tag to `p5-sketch/index.html`
  - Insert `<script src="visuals.js"></script>` after `sound-engine.js` and before `device-manager.js`
  - This ensures visuals module is available when DeviceManager is constructed

- [ ] **T003** Update `p5-sketch/device-manager.js` to accept Visuals instance
  - Constructor: add optional 3rd param `visuals` (stored as `this._visuals`)
  - `assign(slot)`: after creating voice, call `this._visuals?.createVisual(slot)`
  - `disconnect(slot)`: before freeing slot, call `this._visuals?.disposeVisual(slot)`
  - `updateSensor()`: after audio update, call `this._visuals?.updateVisual(slot, data, config)`
  - Store visual state references: `this._visualStates = {}` keyed by slot
  - `disposeAll()`: also call `this._visuals?.disposeAll()`
  - Run tests — all existing must still pass

- [ ] **T004** Update `p5-sketch/sketch.js` to instantiate and draw Visuals
  - Add `let v;` alongside existing globals
  - In `setup()`: instantiate `v = new Visuals(CONFIG)` after sound engine creation
  - Pass `v` to DeviceManager constructor as 3rd arg: `dm = new DeviceManager(engine, CONFIG, v)`
  - In `draw()`: call `v.drawAll(dm.activeSlots, CONFIG)` BEFORE `dm.drawHUD()`
  - Verify page loads without errors

**Checkpoint**: p5-sketch loads in browser without errors (visuals.js not yet implemented, so no visuals appear — but no crashes)

---

## Phase 3b: Visual Engine (Steps 5-6)

**Purpose**: Build the Visuals class with all 30 visual types.

- [ ] **T005** 🔴 TDD RED — Write visual rendering tests
  - Create `tests/p5-sketch/visuals-rendering.test.js` with ~15 tests:
    - createVisual returns valid VisualState for all 30 types
    - createVisual gets correct type string for slot 0 (pulsingCircle), slot 1 (rotatingLine), etc.
    - updateVisual modifies params from sensor data
    - drawAll runs without throwing for 0, 1, 5 active slots
    - visual positions match radial math
    - state accumulation works (angle/phase increments over frames)
    - trail arrays bounded at max 50 entries
    - disposeVisual clears all state
    - particle arrays cleared on dispose
    - re-creating visual for same slot resets state
    - handle null/undefined sensor data gracefully
  - Run `npm test` — ALL must FAIL (visuals.js doesn't exist)

- [ ] **T006** 🟢 TDD GREEN — Implement `p5-sketch/visuals.js`
  - Visuals class with:
    - constructor(config)
    - createVisual(slot) → returns and stores VisualState
    - updateVisual(slot, sensorData, config) → maps sensor to visual params
    - draw(state, slot, config) → renders one visual at its radial position
    - drawAll(activeSlots, config) → loops active slots, calls draw()
    - disposeVisual(slot) → clears state

  - **Factory**: Map of 30 visual types. Each factory returns a VisualState with:
    - type, slot, params (current visual params from sensor), accum (running state), trail[], particles[]

  - **Helper**: `_getRadialPosition(slot, config)` → { angle, x, y, wedgeAngle }

  - **30 visual drawer implementations** (each is a pair — factory + draw):
  
    0. **pulsingCircle**: `circle(x, y, params.size)` — size from accel.y, hue from gyro.z
    1. **rotatingLine**: `line()` rotated by params.angle — angle from accel.x, length from orient.β
    2. **arcSweep**: `arc()` with sweepAngle from gyro.α, thickness from accel.z
    3. **polygon**: `beginShape/vertex/endShape` with sides from orient.γ, radius from accel.y
    4. **spiral**: Loop cos/sin with increasing radius — turns from gyro.β, tightness from accel.x
    5. **connectedDots**: N dots in circle, connected by lines — count from orient.β, spread from accel.x
    6. **waveAmplitude**: `beginShape()` sin wave — amplitude from gyro.z, frequency from accel.y
    7. **lissajous**: `vertex(cos(θ), sin(θ*ratio+phase))` curve — ratio from orient.α, phase from gyro.α
    8. **concentricRings**: Multiple `circle()` with increasing radius — count from accel.z, spacing from orient.γ
    9. **particleCloud**: Array of particle objects with random positions — count from accel.z, spread from gyro.α
    10. **oscilloscopeTrail**: Array of recent Y positions drawn as connected dots — trailLen from orient.γ, amp from accel.x
    11. **wobblyCircle**: Radial deform via sin(time×speed) — wobble from gyro.β, speed from accel.y
    12. **expandingRing**: On trigger spawn expanding ring that fades — trigger from accelMag, ringCount from gyro.z
    13. **starburst**: Lines at equal angles from center — count from orient.β, length from accel.y
    14. **glowingDot**: `drawingContext.shadowBlur` glow — opacity from gyro.α, glowRadius from orient.γ
    15. **pulseFlash**: Full-wedge rect flash at speed-controlled intervals — speed from orient.γ, brightness from accel.x
    16. **bouncingBall**: Ball with vertical velocity+gravity — height from gyro.β, size from accel.z
    17. **pixelatedGrid**: Grid of colored rects — resolution from accel.x, blockSize from gyro.z
    18. **stutterStrobe**: Alternating BW rect at frame interval — rate from orient.γ, contrast from accel.y
    19. **foldedWaveform**: Wave with mirror folds — foldCount from gyro.α, detail from accel.z
    20. **jitterOffset**: Random position offset from base — jitter from accel.x, interval from gyro.β
    21. **scatteredGrains**: Random dots within wedge — dotSize from gyro.β, count from accel.y
    22. **particleFountain**: Particles spawn at center, fall outward with gravity — rate from orient.α, gravity from accel.z
    23. **randomBlink**: Dot at random position blinks — speed from gyro.γ, posRandom from accel.x
    24. **slidingWindow**: Highlighted arc segment — windowPos from accel.y, windowWidth from gyro.α
    25. **abstractShape**: Irregular polygon with random offsets — size from orient.α, complexity from accel.z
    26. **echoGhosts**: Previous positions drawn with fading opacity — ghostCount from gyro.β, fadeRate from accel.y
    27. **warpDistortion**: Grid deformation via sin/cos — warp from accel.x, frequency from gyro.γ
    28. **rippleRings**: Expanding concentric rings — count from orient.β, speed from gyro.α
    29. **thresholdBars**: Vertical bar graph — barHeight from accel.z, barCount from gyro.β

  - **Implementation guidelines**:
    - Every draw function calls `p.push()` at start, `p.pop()` at end
    - `_drawIdentityLayer(state, params)`: clipped to wedge (optional for each visual)
    - `_drawExpressionLayer(state, params)`: unclipped (optional for each visual)
    - Particle-based visuals: prune particles with lifetime <= 0 each frame
    - Trail-based visuals: max 50 entries, shift oldest on push
    - All config values come from: `config.centerX, centerY, baseRadius, maxDevices, slots[slot].color`

  - Run `npm test` — all ~15 new tests PASS (GREEN)

**Checkpoint**: Open p5-sketch with bridge + simulator. Visuals appear at correct radial positions.

---

## Phase 3c: Integration & Polish (Steps 7-8)

- [ ] **T007** Run ALL tests + manual verification
  - `npm test` — expected 138 tests passing (123 existing + 15 new)
  - Manual: start bridge → open p5 → connect 3 simulated phones
  - Verify: visuals draw at correct angles, respond to sensor data, clean up on disconnect
  - Verify: frame rate stays above 25fps
  - Edge case test: connect 10 phones, verify no visual overlap at wedges
  - Edge case test: rapid connect/disconnect cycle, verify no memory leaks

- [ ] **T008** Atomic commits + graphify update
  - Commit 1: `feat(phase-3a): add visualType config, integration hooks in device-manager + sketch`
    - Files: config.js, index.html, device-manager.js, sketch.js
  - Commit 2: `feat(phase-3b): implement 30 visual types in visuals.js with tests`
    - Files: visuals.js, tests/p5-sketch/visuals-rendering.test.js
  - Run `python3 -m graphify . --update`
  - Run `/speckit.analyze` for spec compliance
  - Verify all 30 visual types match PLAN.md table

---

## Task Summary

| Phase | Tasks | Files Changed/Created | Tests |
|-------|-------|-----------------------|-------|
| 3a Integration | T001-T004 | config.js, index.html, device-manager.js, sketch.js | 0 new (existing must pass) |
| 3b Visual Engine | T005-T006 | visuals.js (NEW), visuals-rendering.test.js (NEW) | ~15 new |
| 3c Polish | T007-T008 | None (verification + commit) | ~138 total |

**Total new files**: 2 (visuals.js, visuals-rendering.test.js)
**Total modified files**: 4 (config.js, index.html, device-manager.js, sketch.js)
**Total tests**: ~138
