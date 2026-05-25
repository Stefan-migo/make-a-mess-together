# Phase 3 — p5 Sketch: Visuals (30 Visual Renderers)

**Status**: Ready for implementation
**Priority**: P1 — Must be built after Phase 2 (audio engine)
**Dependencies**: p5.js, Phase 2 modules (device-manager.js, sketch.js infrastructure)

---

## Architecture

```
Phase 3 adds a Visuals layer alongside the existing audio engine:

sketch.js draw()
  ├── dm.drawHUD()      ← existing Phase 2 (colored dots)
  └── v.drawAll()       ← NEW Phase 3 (30 visual renderers)

DeviceManager.updateSensor()
  → soundEngine.updateVoice()     ← existing
  → visuals.updateVisual(slot)    ← NEW: passes sensor data to visual

Data flow: same sensor data → two parallel outputs:
  1. Audio (SoundEngine) — already built
  2. Visuals (Visuals class) — this phase
```

**Key decisions** (from architecture analysis):
- **Hybrid wedge clipping**: identity layer clipped to wedge, expression layer unclipped (can extend beyond wedge)
- **Fixed hue wheel** per slot (slot × 12°) — already in config.js, visuals use the same
- **Canvas 2D, not WebGL** — p5.js 2D is sufficient for 30 simple visuals at 30fps
- **Visual type matches slot index** — slot 0 always gets "pulsingCircle", slot 1 gets "rotatingLine", etc.
- **Audio-visual cohesion**: each visual uses same sensor axes as its paired sound type (when meaningful)
- **Each visual self-contained**: push()/pop() transforms, no global state pollution
- **Alpha blending enabled**: overlapping visuals composite naturally

---

## What To Build

A **Visuals class** at `p5-sketch/visuals.js` that:

1. Maintains visual state per slot (positions, angles, accumulated values)
2. Provides 30 factory functions — one per visual type
3. Renders each active slot's visual within its radial wedge position
4. Updates visual parameters from sensor data each frame
5. Integrates with DeviceManager for lifecycle (create on assign, destroy on disconnect)

---

## Module Details

### p5-sketch/visuals.js — Visuals Class

```js
class Visuals {
  constructor(config)
  
  // Factory: returns visual state object based on slot index
  createVisual(slot) → VisualState
  
  // Update visual parameters from sensor data
  updateVisual(state, sensorData, config) → void
  
  // Draw visual at its radial position
  draw(state, slot, config) → void  // calls p5 push/pop internally
  
  // Draw all active visuals (called from sketch.js draw())
  drawAll(activeSlots, config) → void
  
  // Cleanup
  disposeVisual(state) → void
}
```

**VisualState** structure:
```js
{
  type: "pulsingCircle",    // visual type string
  slot: 0,
  params: { size: 50, hue: 0, ... },    // current visual parameters from sensor
  accum: { angle: 0, phase: 0, ... },   // accumulated state (for rotating, bouncing, etc.)
  trail: [],                            // optional trail history
  particles: [],                        // optional particle array
  lastSensorData: null,
  dispose: function()
}
```

### Radial Layout Math (shared with DeviceManager)

Each device draws at a fixed radial position:
```js
const angle = (slot / maxDevices) * TWO_PI;
const x = centerX + cos(angle) * baseRadius;
const y = centerY + sin(angle) * baseRadius;
```

The **identity layer** is clipped to a wedge centered at `angle` with arc width:
```js
const wedgeAngle = TWO_PI / maxDevices;  // 12° for 30 devices
```

Visuals use `p.push()`, translate to position, rotate to face outward, apply optional clip, then `p.pop()`.

### 30 Visual Types — Full Reference

All types are pure p5.js 2D drawing. No textures. No extra dependencies.

| Slot | Visual Type | Parameters from Sensor | Drawing Approach |
|------|-------------|----------------------|------------------|
| 0 | pulsingCircle | accel.y → radius (10-80), gyro.z → hue | `circle()` with dynamic radius, fill from hue |
| 1 | rotatingLine | accel.x → angle (0-360°), orient.β → length (20-120) | `line()` rotated by angle |
| 2 | arcSweep | gyro.α → sweep (0-360°), accel.z → thickness (2-20) | `arc()` with sweep angle, thick stroke |
| 3 | polygon | orient.γ → sides (3-12), accel.y → radius (20-80) | `beginShape()` with N vertices |
| 4 | spiral | gyro.β → turns (1-10), accel.x → tightness (5-30) | Spiral via cos/sin in loop, increasing radius |
| 5 | connectedDots | orient.β → count (3-20), accel.x → spread (10-80) | Draw N dots in a circle, connect with lines |
| 6 | waveAmplitude | gyro.z → amplitude (5-50), accel.y → frequency (1-10) | `beginShape()` with sin wave, dynamic amplitude |
| 7 | lissajous | orient.α → a/b ratio (1-5), gyro.α → phase (0-360°) | Lissajous curve via `vertex(cos(θ), sin(θ×ratio+phase))` |
| 8 | concentricRings | accel.z → count (2-15), orient.γ → spacing (5-30) | Multiple `circle()` calls with increasing radius |
| 9 | particleCloud | accel.z → count (5-50), gyro.α → spread (5-60) | Particle array with random positions within spread |
| 10 | oscilloscopeTrail | orient.γ → trailLen (10-80), accel.x → amplitude (5-40) | Array of recent Y positions drawn as connected dots |
| 11 | wobblyCircle | gyro.β → wobble (2-30), accel.y → speed (0.1-5) | `beginShape()` with radial deform via sin(time×speed) |
| 12 | expandingRing | accelMag → trigger, gyro.z → ringCount (1-5) | On trigger, spawn expanding rings that fade out |
| 13 | starburst | orient.β → count (4-24), accel.y → length (10-80) | Lines radiating from center at equal angles |
| 14 | glowingDot | gyro.α → opacity (0-1), orient.γ → glowRadius (5-30) | `drawingContext.shadowBlur` for glow effect |
| 15 | pulseFlash | orient.γ → speed (0.5-5), accel.x → brightness (0-100) | Full-wedge flash at speed-controlled intervals |
| 16 | bouncingBall | gyro.β → height (0-100), accel.z → size (5-30) | Ball bouncing vertically, size dynamic |
| 17 | pixelatedGrid | accel.x → resolution (4-32), gyro.z → blockSize (5-30) | Grid of rects, each at different hue |
| 18 | stutterStrobe | orient.γ → rate (1-20), accel.y → contrast (0-100) | Alternating black/white rect at rate |
| 19 | foldedWaveform | gyro.α → foldCount (1-8), accel.z → detail (5-30) | Wave with multiple fold reflections |
| 20 | jitterOffset | accel.x → jitter (0-30), gyro.β → interval (1-20) | Random offset from center position |
| 21 | scatteredGrains | gyro.β → dotSize (2-15), accel.y → count (5-40) | Random dots within wedge area |
| 22 | particleFountain | orient.α → rate (1-20), accel.z → gravity (0.1-2) | Particles spawn at center, fall outward |
| 23 | randomBlink | gyro.γ → speed (0.5-10), accel.x → randomPos (0-50) | Dot blinks at random position within wedge |
| 24 | slidingWindow | accel.y → windowPos (0-1), gyro.α → windowWidth (0.1-0.5) | Highlighted arc segment sliding around |
| 25 | abstractShape | orient.α → size (10-80), accel.z → complexity (3-12) | Irregular polygon with random vertex offsets |
| 26 | echoGhosts | gyro.β → ghostCount (2-10), accel.y → fadeRate (0.01-0.1) | Previous positions drawn with fading opacity |
| 27 | warpDistortion | accel.x → warp (1-20), gyro.γ → frequency (1-10) | `beginShape()` with sin/cos grid deformation |
| 28 | rippleRings | orient.β → count (1-8), gyro.α → speed (0.5-5) | Concentric rings with expanding radius from center |
| 29 | thresholdBars | accel.z → barHeight (0-100), gyro.β → barCount (3-20) | Vertical bar graph showing sensor levels |

---

## Integration Points

### Changes to Existing Files

**p5-sketch/sketch.js** — Add Visuals integration:
```js
let dm, v, ws, audioBus, started = false;  // add v for visuals

function setup() {
  // ... existing setup ...
  v = new Visuals(CONFIG);                    // NEW
  dm = new DeviceManager(engine, CONFIG);
}

function draw() {
  background(0, 0, 8);
  v.drawAll(dm.activeSlots, CONFIG);         // NEW: draw visuals first (behind HUD)
  dm.drawHUD();                                // existing
}
```

**p5-sketch/device-manager.js** — Add visual lifecycle calls:
```js
class DeviceManager {
  constructor(soundEngine, config, visuals) {   // visuals param added
    this._visuals = visuals;                     // NEW
  }

  assign(slot) {
    // ... existing voice creation ...
    if (this._visuals) {
      this._visuals.createVisual(slot);          // NEW
    }
  }

  disconnect(slot) {
    // ... existing voice disposal ...
    if (this._visuals) {
      this._visuals.disposeVisual(slot);         // NEW
    }
  }

  updateSensor(slot, sensorType, data) {
    // ... existing sensor mapping for audio ...
    if (this._visuals && this._visualStates[slot]) {
      this._visuals.updateVisual(this._visualStates[slot], data, this._config);
    }
  }
}
```

**p5-sketch/config.js** — Add visualType per slot:
```js
slots: [
  {
    soundType: "synthBasic",
    visualType: "pulsingCircle",      // NEW field
    slotIndex: 0,
    color: { h: 0, s: 80, b: 90 },
    sensorMap: { ... }
  },
  // ... all 30 slots get visualType field
]
```

**p5-sketch/index.html** — Add script tag:
```html
<script src="config.js"></script>
<script src="sensor-mapper.js"></script>
<script src="audio-bus.js"></script>
<script src="sound-engine.js"></script>
<script src="visuals.js"></script>       <!-- NEW -->
<script src="device-manager.js"></script>
<script src="sketch.js"></script>
```

### No Changes Needed To
- `sound-engine.js` — pure audio, no visual concern
- `audio-bus.js` — pure audio routing
- `sensor-mapper.js` — mapping already returns values both audio and visuals consume
- `server-bridge/` — no bridge changes needed

---

## TDD Requirements

### New Tests

**tests/p5-sketch/visuals-rendering.test.js** — ~15 tests:
- createVisual returns state with correct type for each slot
- updateVisual updates params from sensor data
- drawAll doesn't throw for 0, 1, 30 active slots
- drawAll renders at correct radial positions
- visual state accumulates over frames (for trail, bounce, etc.)
- disposeVisual cleans up state
- handle missing/partial sensor data gracefully
- visual trail doesn't grow unbounded (memory safety)

### Existing Tests That Still Pass
- Bridge tests (34): no bridge changes
- Simulator tests (50): no simulator changes
- Phase 2 tests (39): no audio changes, only integration additions

---

## Implementation Order

```
Step 1: Update config.js — add visualType to all 30 slots
Step 2: Update index.html — add visuals.js script tag
Step 3: Update sketch.js — integrate Visuals into draw()
Step 4: Update device-manager.js — add visual lifecycle + sensor routing
Step 5: TDD RED — Write visuals-rendering tests (~15 tests)
Step 6: TDD GREEN — Implement p5-sketch/visuals.js with all 30 visual types
Step 7: Run ALL tests + manual integration verification
Step 8: Atomic commits + graphify update
```

---

## Integration Test Plan

```bash
# Terminal 1: Start bridge
cd server-bridge && node index.js

# Terminal 2: Open p5 sketch in browser
cd p5-sketch && npx http-server -p 3000 -c-1
# Open http://localhost:3000 — click to start audio

# Terminal 3: Connect 3 simulated phones
node scripts/simulate-phones.js --count 3 --duration 60

# Expected behavior:
# - 3 visual elements appear at correct radial positions (0°, 12°, 24°)
# - Each visual's style matches its slot's visualType
# - Visuals animate in response to simulated sensor data
# - Disconnecting phones removes their visual element
# - No frame rate drop below 25fps with 3 devices
# - No visual overlap (each in its own wedge space)
```

---

## Key Behaviors to Verify

- [ ] All 30 visual types render without errors
- [ ] Each visual draws at the correct radial position for its slot
- [ ] Visual parameters change in response to sensor data
- [ ] Disconnected phones remove their visual element cleanly
- [ ] Frame rate stays above 25fps with 3+ active visuals
- [ ] No visual state persists after dispose
- [ ] Trail-based visuals (echoGhosts, oscilloscopeTrail) don't grow unbounded
- [ ] Particle-based visuals (particleCloud, particleFountain) clean up dead particles
- [ ] ExpandingRing visuals fade out and remove rings after expansion
- [ ] All visuals respect the identity layer wedge position
