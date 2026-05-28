# Tech Plan: MIDI Notes + Modes — Phone as Musical Instrument

**Based on**: `.specify/specs/09-midi-notes-modes.md` (feature spec)  
**Clarifications**: `.specify/09-clarify.md`  
**Date**: 2026-05-27

---

## Already Implemented (376 tests)

| Phase | Files | Tests |
|-------|-------|-------|
| Phase 1: MidiSender | `midi-sender.js` | 14 tests |
| Phase 2: Scales + MidiMapper core | `midi-mapper.js` (scales, chaos, scale mode, CC/pitch) | 36 tests |
| Phase 3: Bridge Integration | `index.js` (--midi flag, CLI flags, event dispatch, cleanup) | 6 tests |

## Remaining Implementation Plan

### Phase 5: Theremin Mode (P2 — ~1hr)

**What changes**:
- `server-bridge/midi-mapper.js` — Add theremin mode to processSensor
- `tests/server-bridge/midi-mapper.test.js` — T023-T025

**How**:
1. In `processSensor`, add `else if (mode === 'theremin')` block
2. Track note state via `_heldNotes[slot]`
3. Hysteresis: threshold=15, release=10
4. Pitch bend calculated from fractional degree offset
5. gyro/a → CC 11 expression
6. Tests:
   - T023: Theremin sends pitch bend for smooth transitions
   - T024: Note on/off controlled by accelMag with hysteresis
   - T025: CC 11 sent from gyro/a

### Phase 6: Chord Mode (P3 — ~1.5hr)

**What changes**:
- `server-bridge/midi-mapper.js` — Add chord mode + chord voicings library
- `tests/server-bridge/midi-mapper.test.js` — T026-T028

**How**:
1. Add `CHORD_VOICINGS` constant (7 diatonic chords with extensions)
2. In `processSensor`, add `else if (mode === 'chord')` block
3. orientation/beta → degree (0-6)
4. accel/x → inversion (0-2)
5. gyro/z → extension level (0-4)
6. Track `_heldChordNotes[slot]` — array of notes
7. On accelMag > threshold: send NoteOff for old chord, NoteOn for all new chord notes
8. On accelMag < threshold: NoteOff for all chord notes
9. Tests:
   - T026: Chord mode outputs 3-4 simultaneous notes
   - T027: Chord degree maps to correct chord type
   - T028: Inversion and extension work

### Phase 7: Arp Mode (P3 — ~2hr)

**What changes**:
- `server-bridge/midi-mapper.js` — Add arp engine inside MidiMapper
- `tests/server-bridge/midi-mapper.test.js` — T029-T031

**How**:
1. Add `_startArp(slot, config, scaleNotes)` and `_stopArp(slot)` methods
2. `_arpState[slot] = { active, timer, step, lastNote, direction, pattern, rateMs }`
3. On processSensor: if mode=arp, check accelMag threshold to start/stop
4. Arp tick function: `_arpTick(slot)`:
   - Pick next note from scaleNotes based on pattern+step
   - Send NoteOff(previous), NoteOn(next)
   - Advance step (wrapping based on pattern)
5. orientation/beta modulates rate (recreate interval when changed)
6. Patterns: up, down, upDown, random, pingPong
7. Gate length controls note-off timing within tick
8. Tests (use fake timers via jest):
   - T029: Arp sends notes at BPM rate
   - T030: Arp patterns produce correct sequences
   - T031: Start/stop via accelMag threshold

### Phase 8: Bridge Dashboard (P2 — ~2hr)

**What changes**:
- `server-bridge/public/dashboard.html` — NEW: HTML/CSS/JS dashboard page
- `server-bridge/index.js` — Add dashboard route + MidiConfig handler
- `tests/server-bridge/dashboard.test.js` — NEW: integration tests

**How**:
1. Dashboard page served at `GET /dashboard`
2. Opens WebSocket connection to bridge as "monitor" type
3. UI controls:
   - Mode: dropdown (chaos, scale, theremin, chord, arp)
   - Scale: dropdown (13 scales)
   - Key: dropdown (C, C#, D, ..., B)
   - Octave: slider/number (2-6)
   - Chaos Amount: slider (0-1)
   - BPM: slider (60-200)
   - Note Threshold: slider (5-50)
4. On UI change: send `{ type: 'midiConfig', ... }` via WebSocket
5. Bridge `handleMidiConfigMessage()`: validate, call `midiMapper.setGlobalConfig()`
6. Tests:
   - T038: Dashboard serves at /dashboard
   - T039: Config message updates MidiMapper global config
   - T040: Invalid config values rejected (clamped)
   - T041: Dashboard connects as monitor (receives state)
   - T042: Config changes reflected immediately in MIDI output

### Phase 9: Documentation (P2 — ~1hr)

**What changes**:
- `docs/MIDI-SETUP.md` — NEW: complete REAPER setup guide
- `docs/DAW-INTEGRATION.md` — UPDATE: add MIDI section
- `README.md` — UPDATE: add MIDI usage examples

**How**:
1. MIDI-SETUP.md covers:
   - REAPER MIDI device configuration (enable phone-sensor-orchestra as input)
   - 30-track template with per-channel MIDI routing
   - Each track: set MIDI input = phone-sensor-orchestra, channel = N
   - Mode selection: command-line flags
   - Troubleshooting: ALSA, permissions, port not visible
2. Tests: None needed (documentation only)

---

## Execution Order

```
Phase 5: Theremin  ──→  Phase 6: Chord  ──→  Phase 7: Arp  ──→  Phase 8: Dashboard  ──→  Phase 9: Docs
   1hr                   1.5hr                2hr                  2hr                    1hr
```

Total estimated: ~7.5 hours remaining.

## Test Strategy

- All new modes tested at unit level (mock MidiSender, test MidiMapper event output)
- Arp mode uses `jest.useFakeTimers()` for interval-based testing
- Dashboard tests use `supertest` or mock WebSocket to verify /dashboard route + config messages
- All 376 existing tests must continue to pass (regression gate)
- Final test count target: ~420 tests

## Risk Areas

1. **Arp timer accumulation**: If accelMag threshold flickers rapidly, multiple arp instances could start. Mitigation: guard with `_arpState[slot].active` flag + clearTimeout before start.
2. **Chord note-off storm**: Sending NoteOff for 3-4 notes per chord change is fine. Risk: if accelMag oscillates around threshold, rapid chord changes. Mitigation: hysteresis.
3. **Dashboard WebSocket resource leak**: Each dashboard tab opens a new WS connection. Mitigation: dashboard reuses single WS, reconnects on close.
