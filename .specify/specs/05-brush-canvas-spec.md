# Feature Specification: Shared Canvas Brush System

**Spec ID**: `05-brush-canvas`  
**Created**: 2026-05-24  
**Status**: Draft  
**Phase**: Visual (sound deferred)  
**Constitution**: `05-brush-canvas-constitution.md`

---

## User Scenarios & Testing

### User Story 1 — Phone connects and paints on the shared canvas (Priority: P1)

A user opens the phone client on their device, it connects via WebSocket, gets assigned a slot (0–29), and starts painting on the shared canvas. The user tilts their phone to move the brush. Accelerometer data modulates color, size, and opacity.

**Why this priority**: This is the core experience — without it there is no product.

**Independent Test**: A simulated phone connection sends orientation data. The test verifies that the paint buffer receives strokes at the correct position and that the canvas displays them.

**Acceptance Scenarios**:

1. **Given** a phone connects and receives slot N, **When** orientation data arrives, **Then** a brush stroke is drawn from the previous position to the new position on the paint buffer
2. **Given** a phone is actively painting, **When** the user tilts the phone (orientation changes), **Then** the brush moves continuously (no gaps, smooth interpolation)
3. **Given** multiple phones connected, **When** they all send sensor data, **Then** all strokes appear on the same shared canvas simultaneously

---

### User Story 2 — Canvas accumulates and fades slowly (Priority: P1)

The canvas is a persistent surface that accumulates all brush strokes over time. Old marks fade very slowly (configurable, default ~6-7 minutes full decay), creating a living, evolving artwork.

**Why this priority**: The "shared canvas never clears" is the defining characteristic of this visual system.

**Independent Test**: A known pattern is painted on the canvas. After N frames with the fade active, the pattern's opacity is measured and confirmed to be within expected decay range.

**Acceptance Scenarios**:

1. **Given** a brush stroke is painted at time T, **When** 60 frames pass with fade active (default rate), **Then** the stroke's alpha is reduced by ~0.5%
2. **Given** continuous painting, **When** new strokes overlap old ones, **Then** both layers are visible (old fading underneath, new fresh on top)
3. **Given** the fade is set to 0 (no fade), **When** frames pass, **Then** the canvas shows all marks at full opacity permanently

---

### User Story 3 — 30 unique brush types (Priority: P1)

Each slot (0–29) has a pre-assigned brush type from the BrushWorks collection. Each brush type has a unique visual signature (classic satin, watercolor bleed, neon glow, spray can, etc.).

**Why this priority**: The variety of brushes is what makes the collaborative canvas interesting and poetic.

**Independent Test**: All 30 brush types are instantiated and a test stroke is executed for each. The test verifies no errors and that each produces visible output on the paint buffer.

**Acceptance Scenarios**:

1. **Given** slot 0 is assigned, **When** `brushType === 'classic'`, **Then** strokes are smooth interpolated ellipses
2. **Given** slot 7 is assigned, **When** `brushType === 'watercolor'`, **Then** strokes are translucent concentric bleeds
3. **Given** slot 12 is assigned, **When** `brushType === 'neon'`, **Then** strokes have layered glow halos
4. **Given** any slot, **When** the brush draws, **Then** the stroke respects the slot's base color + sensor modulation

---

### User Story 4 — Sensor modulation of brush parameters (Priority: P2)

Accelerometer and gyroscope data dynamically modulate brush parameters: hue shift (accel.x), saturation (accel.y), size (accel.z), opacity (gyro.α), scatter (gyro.β), brush angle (gyro.γ).

**Why this priority**: Sensor modulation makes the visual experience responsive and expressive, but a static version still works without it.

**Independent Test**: Known sensor values are fed into the system. The output brush parameters are measured and verified against expected mappings.

**Acceptance Scenarios**:

1. **Given** accel.x = +10, **When** the brush draws, **Then** the hue is shifted +180° from base
2. **Given** accel.z = +10, **When** the brush draws, **Then** brush size is at maximum (50px)
3. **Given** gyro.α = 2000, **When** the brush draws, **Then** opacity is at maximum (1.0)

---

### User Story 5 — Phone disconnects gracefully (Priority: P2)

When a phone disconnects, its brush state is cleaned up. Its existing marks remain on the canvas (fading normally). New phones can reuse the freed slot.

**Why this priority**: Graceful lifecycle is essential for multi-device sessions.

**Independent Test**: A phone connects, paints some strokes, then disconnects. The slot's brush state is verified as disposed, but the paint buffer retains the strokes.

**Acceptance Scenarios**:

1. **Given** a phone is painting, **When** it disconnects, **Then** the brush position state is freed
2. **Given** a disconnected phone's marks exist, **When** fade continues, **Then** its marks continue fading normally
3. **Given** a slot is freed, **When** a new phone connects and takes that slot, **Then** painting resumes with the new phone

---

### Edge Cases

- **No orientation data**: If orientation.α/β are NaN or undefined, the brush stays at its last known position (doesn't jump to 0,0)
- **Rapid reconnect**: If the same phone reconnects to a different slot, its previous brush marks remain on canvas under the old slot
- **30 phones full**: 31st connection is rejected by bridge (standard behavior)
- **Very fast phone movement**: Between 30fps frames, if orientation changes drastically, interpolate the stroke
- **All phones disconnect**: Canvas continues fading but no new strokes are added

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST maintain a persistent offscreen paint buffer (`createGraphics(WEBGL)`)
- **FR-002**: System MUST map `orientation.α` (0–360) to canvas X position (0 → canvasWidth)
- **FR-003**: System MUST map `orientation.β` (-180–180) to canvas Y position (0 → canvasHeight)
- **FR-004**: System MUST draw continuous strokes (line segments from prev→current position) for each active phone every frame
- **FR-005**: System MUST apply a configurable slow fade to the paint buffer (default: alpha 0.005 every 60 frames)
- **FR-006**: System MUST support 30 brush types, one per slot, pre-assigned in config
- **FR-007**: System MUST modulate brush hue by sensor data (accel.x → hue shift)
- **FR-008**: System MUST modulate brush size by sensor data (accel.z → size range 5–50px)
- **FR-009**: System MUST modulate brush opacity by sensor data (gyro.α → 0.2–1.0)
- **FR-010**: System MUST modulate brush saturation by sensor data (accel.y → saturation shift)
- **FR-011**: System MUST modulate brush scatter by sensor data (gyro.β → scatter amount)
- **FR-012**: System MUST smooth orientation values with EMA (coefficient 0.3)
- **FR-013**: System MUST blend strokes using configurable blend mode (default: BLEND)
- **FR-014**: System MUST clean up brush state on phone disconnect
- **FR-015**: System MUST NOT clear the paint buffer on disconnect (marks persist)
- **FR-016**: System MUST NOT depend on sound-engine.js or old visual modules
- **FR-017**: p5.js version MUST be 2.x (WEBGL mode required by p5.brush)
- **FR-018**: p5.brush.js MUST be loaded as a dependency

### Key Entities

- **PaintBuffer**: Offscreen `p5.Graphics(WEBGL)` that accumulates all brush strokes. Has a singleton lifecycle. Loaded into p5.brush via `brush.load()`.
- **BrushCursor**: Per-slot state tracking current position, previous position, accumulated sensor data. Created on connect, disposed on disconnect.
- **BrushType**: One of 34 registered brush algorithms. Pre-assigned to slots via config. Each is a function: `drawBrush(pg, x1, y1, x2, y2, color, size, opts)`.
- **SensorProfile**: Per-slot sensor data cache with EMA-smoothed values. Maps raw sensor axes to brush parameters via lookup.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 30 simultaneous phone connections each draw on the canvas without dropping below 15fps
- **SC-002**: Canvas fade is measurable — a mark at full opacity reaches <1% opacity after N frames
- **SC-003**: All 30 brush types produce visually distinct strokes (verifiable by comparing outputs)
- **SC-004**: Orientation-to-position mapping has <100ms latency (sensor arrival → pixel drawn)
- **SC-005**: Phone disconnect leaves existing marks undisturbed

---

## Assumptions

- **p5.js 2.2.x is stable** and the CDN is reliable
- **p5.brush 2.x works with p5.js 2.x WEBGL mode** and `brush.load(p5Graphics)` targets offscreen buffers
- **Orientation API works on modern phones** (iOS 13+, Android 10+)
- **Users hold phones naturally** — orientation.α (compass) and orientation.β (tilt) provide smooth 2D cursor control
- **30fps from each phone** is sufficient for smooth brush strokes (mouse/pointer events are not available on phones)
- **Sound module is 100% separate** — no shared state with visual module
