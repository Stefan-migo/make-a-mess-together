# Feature Specification: Sensor Modulation Isolation + Dashboard Commands

**Feature Branch**: `07-sensor-modulation-isolation`  
**Created**: 2026-05-27  
**Status**: Spec  
**Input**: User reports that dashboard commands (brush, color, pen toggle) don't work; color drifts into rainbow despite selection; multi-phone traces interfere

## User Scenarios & Testing

### User Story 1 — Color selection sticks on canvas (Priority: P1)

The user selects a color from the phone dashboard color sliders. The canvas immediately draws with that color. Moving the phone modulates the hue RELATIVE to the selected color, not drifting into rainbow.

**Why this priority**: Color selection is the most visible dashboard command. Currently always overridden by rainbow drift.

**Acceptance Scenarios**:
1. **Given** the phone is drawing on canvas, **When** user changes color slider to hue=200 (blue), **Then** brush color immediately changes to blue and stays blue as base, with only subtle hue modulation from accelerometer movement
2. **Given** user has been drawing with hue=200 for 10 seconds, **When** user changes slider to hue=0 (red), **Then** brush immediately switches to red (not drifting gradually from blue)

### User Story 2 — Brush selection loads immediately (Priority: P1)

The user taps a brush type on the phone dashboard. The canvas immediately switches to drawing with that brush.

**Why this priority**: Second most visible dashboard command. Currently does not switch at all.

**Acceptance Scenarios**:
1. **Given** the phone is drawing with brush "classic", **When** user taps "spray" on dashboard, **Then** canvas immediately draws with spray pattern
2. **Given** user switches from "spray" to "mirror-hex", **Then** canvas draws hex mirror pattern

### User Story 3 — Pen toggle stops/restarts drawing + sound (Priority: P1)

The user taps the pen toggle button. Drawing stops AND sound mutes. Tapping again resumes both.

**Why this priority**: Core interaction for controlling the instrument. Previously only stopped drawing briefly.

**Acceptance Scenarios**:
1. **Given** the phone is drawing, **When** user taps "PEN UP", **Then** brush stroke stops AND voice volume ramps to 0
2. **Given** pen is up for 5+ seconds (past any state broadcast), **When** user taps "PEN DOWN", **Then** brush resumes from current position AND voice volume restores

### User Story 4 — Two phones are independent (Priority: P2)

When a second phone connects, its cursor and voice are completely independent from the first phone's.

**Why this priority**: Ensures multi-device experience works.

**Acceptance Scenarios**:
1. **Given** phone A draws on canvas, **When** phone B connects and moves differently, **Then** phone B's cursor follows its own motion (not copying phone A's pattern)
2. **Given** phone A has pen UP and phone B has pen DOWN, **When** both phones move, **Then** only phone B's cursor draws

## Requirements

### Functional Requirements

- **FR-001**: Color hue MUST NOT drift cumulatively from sensor modulation. Sensor hue shift MUST be relative to the user-selected color.
- **FR-002**: When user selects a new color, the modulation offset MUST reset to zero immediately.
- **FR-003**: Brush type from phone config MUST immediately apply to drawing.
- **FR-004**: Pen toggle MUST stop both visual drawing AND voice audio within 100ms of toggling.
- **FR-005**: Pen state MUST persist across state broadcasts (not reset by 5-second timer).
- **FR-006**: Pen state MUST persist across phone reconnects.
- **FR-007**: Each phone cursor MUST have independent calibration, smoothing, and pressure state.
- **FR-008**: Sensor modulation (hue shift, saturation, scatter, angle, pressure) MUST still work — only the BASE color is locked by user selection.

### Technical Requirements

- **TR-001**: `cursor._baseHue` stores user-selected hue (initialized from config default color)
- **TR-002**: `cursor._hueOffset` accumulates sensor modulation relative to base
- **TR-003**: `cursor._hueOffset` normalized to prevent unbounded growth (wrapped to 0-360 periodically)
- **TR-004**: `cursor.color.h = ((cursor._baseHue + cursor._hueOffset) % 360 + 360) % 360` computed each modulation frame
- **TR-005**: `updateConfig` sets `cursor._baseHue` and resets `cursor._hueOffset = 0` when user selects color
- **TR-006**: `assign()` guard prevents cursor reset from state broadcasts (already implemented in commit 3fa473a)
- **TR-007**: `handleAssignedMessage()` calls `saveAndSendConfig()` (already implemented in commit 3fa473a)
- **TR-008**: `_processVoice` checks cursor.penDown for mute (already implemented in commit 3fa473a)
- **TR-009**: Per-cursor state for calibration/smoothing/pressure (already implemented in commit 1316979)

### Files to Modify

- `p5-sketch/brush-canvas.js` — BrushCursor constructor (add _baseHue, _hueOffset), _modulateFromSensor (relative hue), createCursor (init from config)
- `p5-sketch/device-manager.js` — updateConfig (set _baseHue, reset _hueOffset when color changes)
- `tests/p5-sketch/brush-canvas.test.js` — new tests for relative hue modulation + color selection stickiness
- `tests/p5-sketch/device-manager.test.js` — new tests for updateConfig setting _baseHue

### Edge Cases

- Hue push past 360 or below 0 → Wrapped to 0-359 range
- `_baseHue` undefined (first cursor, no user selection yet) → Initialize from config's default color.h when cursor created
- `_hueOffset` grows very large over time → Normalize to -360..360 range periodically (every modulation frame)
- Phone sends config with color but cursor doesn't exist yet → updateConfig returns early via getCursor null check (already handled)
- Saturation from user config vs gyro modulation → Saturation currently directly overwritten by gyro (user selection lost). FIX: same pattern as hue — store `_baseSaturation` and modulate relative to it.

### Success Criteria

- **SC-001**: User selects hue=200 → brush draws blue, stays blue as base hue through modulation
- **SC-002**: User selects brush=spray → immediate spray pattern on canvas
- **SC-003**: Pen toggle UP → drawing + sound stops, stays stopped past 5s broadcast mark
- **SC-004**: Two phones move independently → each cursor follows its own phone
- **SC-005**: All 294+ existing tests pass; 4+ new tests pass
