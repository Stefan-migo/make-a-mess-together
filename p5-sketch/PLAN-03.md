# Phase 3 Implementation Plan — p5 Sketch Visuals

**Branch**: `main` (sequential phase)
**Date**: 2026-05-19
**Spec**: `.specify/specs/03-p5-sketch-visuals.md`
**Status**: Ready

---

## Summary

Add 30 visual renderers to the p5 sketch — one per slot — that draw in a radial layout around the canvas center. Each visual maps sensor data to visual parameters (size, rotation, color, opacity, etc.). Visuals integrate with the existing DeviceManager lifecycle (create on assign, update on sensor data, dispose on disconnect).

---

## Technical Context

| Dimension | Value |
|-----------|-------|
| **Runtime** | Browser (Chrome/Firefox/Safari latest) |
| **Rendering API** | p5.js Canvas 2D (no WebGL) |
| **Frame Rate** | 30fps (already set in config.js) |
| **Canvas Size** | 1600×900 (already set) |
| **Draw Order** | Background → Visuals → HUD overlay |
| **Visuals per Frame** | Up to 30 `push()/pop()` operations |
| **Existing HUD** | `device-manager.js drawHUD()` draws colored dots at radial positions |
| **Visuals Class** | New `visuals.js` module, instantiated in `sketch.js` |

**Key Constraints**:
- Must maintain 30fps with 30 active visuals — each visual must be lightweight
- No visual can modify global p5 state (push/pop required)
- No textures, no images, no WebGL
- Visual type is fixed per slot (slot 0 = pulsingCircle always)
- Need to modify 4 existing files + add 1 new file + 1 new test file

---

## Architecture Decisions

### D1: Separate Visuals Class (not merged into DeviceManager)
**Decision**: Visuals gets its own class in `visuals.js`, instantiated alongside DeviceManager in sketch.js.
**Why**: Separation of concerns — DeviceManager manages lifecycle, Visuals handles rendering. Each can be tested independently.
**Trade-off**: DeviceManager needs a reference to Visuals for lifecycle hooks. Slight interconnect, but clean.

### D2: Identity Layer + Expression Layer
**Decision**: Each visual has two conceptual layers:
- **Identity layer**: clipped to the slot's radial wedge (12°) — ensures you can identify which phone is which
- **Expression layer**: can extend beyond the wedge (e.g., spiral arms, particle fountain) — artistic freedom
**Implementation**: Identity layer uses `p.clip()` via `p.drawingContext.beginPath()` + clip. Expression layer is drawn after without clip.
**Why**: Architecture decision from 5-agent analysis. Prevents visual chaos while allowing creativity.

### D3: Stateful Visuals (not pure functions)
**Decision**: Visual state objects hold accumulated values (angles, velocities, trail history, particle arrays).
**Why**: Many visuals need frame-to-frame state (bouncing ball needs velocity, trail needs history, particles need lifecycle).
**Trade-off**: Must call `disposeVisual()` on disconnect to prevent memory leaks. Bounded arrays for trails (max 50 entries).

### D4: Sensor Data Reuse (no second normalization pipeline)
**Decision**: Visuals receive the same normalized sensor data that audio uses (0..1 per axis).
**Why**: Sensor-mapper.js already normalizes values. Duplicating the pipeline would be wasteful.
**Trade-off**: Visuals share the EMA-smoothed values from audio. If visuals need raw/juicier data, they can access the sensor cache directly. Configurable per slot: `audioSmoothing` vs `visualSmoothing`.

### D5: Draw Order Within a Frame
**Decision**: 
1. Clear background
2. Draw all visuals (back to front by slot number)
3. Draw DeviceManager HUD (colored dots + labels)
**Why**: HUD is informational overlay — should always be on top. Visuals are the main content.

---

## File Changes Summary

| File | Change | Lines Changed |
|------|--------|---------------|
| `p5-sketch/visuals.js` | **NEW** — 30 visual types + rendering | ~500 new |
| `p5-sketch/config.js` | Add `visualType` field to all 30 slots | ~30 lines (1 per slot) |
| `p5-sketch/device-manager.js` | Add `visuals` param, lifecycle hooks in assign/disconnect/updateSensor | ~20 lines |
| `p5-sketch/sketch.js` | Instantiate Visuals, call `v.drawAll()` in draw() | ~5 lines |
| `p5-sketch/index.html` | Add `visuals.js` script tag | 1 line |
| `tests/p5-sketch/visuals-rendering.test.js` | **NEW** — ~15 tests | ~200 lines |

---

## Data Flow

```
Bridge WebSocket → sketch.js handleMessage(msg)
  → dm.assign(slot)     → engine.createVoice + visuals.createVisual
  → dm.updateSensor()   → engine.updateVoice + visuals.updateVisual
  → dm.disconnect(slot) → engine.disposeVoice + visuals.disposeVisual

Frame loop:
  draw() {
    background(0,0,8)
    v.drawAll(activeSlots, config)    // render 30 visuals
    dm.drawHUD()                       // render HUD dots + overlay text
  }
```

---

## Test Strategy

| Module | Test File | Count | What to Test |
|--------|-----------|-------|-------------|
| Visuals | `tests/p5-sketch/visuals-rendering.test.js` | ~15 | create, update, draw, dispose, state accumulation, bounds |
| Existing tests | All Phase 0-2 tests | 123 | Must still pass with integration changes |

**Testing approach**: Visuals are tested by:
1. Creating visual states and verifying type/params are correct
2. Updating with sensor data and checking param values
3. Calling draw with mock p5 context (or verifying no throws)
4. Verifying dispose cleans up particles/trails/arrays

---

## Implementation Strategy

The implementation follows a clear order — existing file modifications first (to establish the integration points), then the main visual engine:

1. **Patch config.js** — Add `visualType` to each slot. Quick edit, unblocks everything.
2. **Patch index.html** — Add script tag. One line.
3. **Patch device-manager.js** — Add `visuals` constructor param, lifecycle hooks in assign/disconnect/updateSensor. Minimal changes.
4. **Patch sketch.js** — Instantiate Visuals, call drawAll. Minimal changes.
5. **Write tests first** (RED) — Then implement visuals.js (GREEN). Core work.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 30 visuals drop frame rate below 25fps | Medium | Medium | Profile each visual's cost; batch with `beginShape/endShape`; reduce particle counts |
| Visual overlap at wedge boundaries | Low | Medium | Identity layer clip ensures minimum separation; expression layer intentionally unbounded |
| Trail arrays grow unbounded (memory leak) | Low | High | Hard cap at 50 entries per trail; dispose clears all arrays |
| p5.js drawingContext clip API differences across browsers | Low | Low | Test in Chrome primarily; fallback to no-clip for edge cases |
| Visual state not cleaned up on disconnect | Low | High | disposeVisual() clears all arrays, particles, timeouts |
