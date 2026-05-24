# phone-sensor-orchestra — Shared Canvas Constitution

**Version**: 1.0.0 | **Ratified**: 2026-05-24 | **Phase**: Brush Canvas

---

## Core Principles

### I. One Shared Canvas
All phones paint onto the **same persistent offscreen buffer**. The canvas is NEVER fully cleared — marks accumulate and decay very slowly. There is no per-device wedge or slice.

### II. Orientation as Cursor
Phone orientation controls brush position: `orientation.α` (compass) → X, `orientation.β` (tilt) → Y. The phone is a pointing device — tilt to paint.

### III. 30 Unique Brushes (Pre-assigned)
Each slot (0–29) has a unique brush type pre-assigned in `config.js`. Brush types come from the `BrushWorks` system (34 brush algorithms) and are mapped 1:1 to slots.

### IV. Sensor Modulation, Not Control
Sensors modulate brush parameters but don't control them absolutely:
- `accel.x,y,z` → hue shift, saturation, size
- `gyro.α,β,γ` → opacity, scatter, brush angle
- Base color comes from the slot config

### V. Module Isolation
The Brush Canvas system is a **self-contained module** (`brush-canvas.js`). It has:
- No dependency on sound-engine.js
- No dependency on old visuals.js or visuals-cube.js (archived)
- Clean lifecycle: create, update, draw, dispose

### VI. TDD Strict (NON-NEGOTIABLE)
- Tests MUST be written and FAIL before implementation (RED)
- Tests MUST pass after implementation (GREEN)
- Refactor only while keeping tests GREEN
- Focus: sensor→position mapping, brush lifecycle, fade math, 30 brush registration

### VII. p5.js 2.x + p5.brush
- Upgrade to p5.js 2.x (WEBGL mode required by p5.brush)
- Use p5.brush.js v2.x CDN for brush rendering
- Offscreen `createGraphics(WEBGL)` for persistent paint buffer

---

## Additional Constraints

### Technology Stack
- **Canvas**: p5.js 2.2.x (WEBGL) + p5.brush.js 2.x
- **Brush Algorithms**: From BrushWorks (34 brush types, ported from instance mode to global mode)
- **Paint Buffer**: `createGraphics(w, h, WEBGL)` — NEVER cleared, only faded
- **Fade Mechanism**: Semi-transparent black rect at configurable rate (default: alpha 0.005 every 60 frames ≈ 6-7 min full decay)
- **Smoothing**: EMA at 0.3 coefficient on orientation values to prevent jitter

### What's Out of Scope
- Sound engine (deferred to future module)
- Vercel deploy (deferred)
- Cube Snek 3D mode (removed)
- Old radial layout visuals (archived)

---

## Quality Gates

1. **All 30 brush types must be registerable** without throwing
2. **Sensor → position mapping** must be smooth (no abrupt jumps)
3. **Canvas fade** must be configurable and measurable
4. **Phone connect/disconnect** must correctly create/dispose brush state
5. **30 concurrent phones** must not degrade performance below 15fps
6. **Blend mode** must be selectable per session (default: source-over)

---

## Governance

This constitution governs the Brush Canvas phase. It supersedes the previous visual system architecture (radial layout, per-wedge visuals, cube mode). Amendments require discussion and documentation.

Constitution violations must be justified in the implementation plan.
