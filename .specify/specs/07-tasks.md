# Tasks: Sensor Modulation Isolation + Dashboard Commands

**Prerequisites**: Spec at `.specify/specs/07-sensor-modulation-isolation.md`
**Tests**: Tests are MANDATORY per the TDD constitution. Every feature requires a failing test before implementation.

---

## Phase 1: User Story 1 — Color selection sticks on canvas (Priority: P1)

**Goal**: Color hue modulation is relative to user-selected base, not cumulative drift.

**Acceptance**: User selects color → immediate switch, stays as base hue.

### Tests (Write FIRST — must fail RED)

- [ ] T001 [US1] Test that `_modulateFromSensor` applies hue shift relative to `_baseHue` instead of cumulative
- [ ] T002 [P] [US1] Test that `updateConfig` with color sets `_baseHue` and resets `_hueOffset`
- [ ] T003 [US1] Test that hue doesn't drift more than expected range over 100 frames

### Implementation

- [ ] T004 [BrushCursor] Add `this._baseHue` and `this._hueOffset` fields in constructor
- [ ] T005 [createCursor] Initialize `_baseHue` from config's default color.h
- [ ] T006 [_modulateFromSensor] Change hue modulation to use base+offset pattern
- [ ] T007 [updateConfig] Set `_baseHue` and reset `_hueOffset = 0` when color.h is changed

---

## Phase 2: User Story 3 — Pen toggle stops drawing AND sound (Priority: P1)

**Goal**: Pen toggle stops/restarts both visual and audio. Stays stable across 5-second state broadcasts.

**Acceptance**: Pen UP → no drawing + muted voice. Pen DOWN → both resume. Survives 5s broadcast.

### Tests (Write FIRST — must fail RED)

- [ ] T008 [US3] Test that penDown=false stops drawing and stays false after simulated state broadcast (dm.assign)
- [ ] T009 [US3] Test that handleAssignedMessage sends saveAndSendConfig

### Implementation (already done in commits 3fa473a, 1316979 — verify and re-test)

- [ ] T010 [VERIFY] Guard in assign() — run tests to confirm
- [ ] T011 [VERIFY] saveAndSendConfig in handleAssignedMessage — run tests to confirm
- [ ] T012 [VERIFY] _processVoice mute check — run tests to confirm

---

## Phase 3: Polish & Cross-Cutting

- [ ] T013 Run full test suite — all 294+ tests must pass
- [ ] T014 Save key learnings to Engram memory

## Execution Order

1. Write tests T001-T003 (RED)
2. Implement T004-T007 (GREEN)
3. Verify T008-T012 (all existing tests pass)
4. Run full suite T013
5. Commit
