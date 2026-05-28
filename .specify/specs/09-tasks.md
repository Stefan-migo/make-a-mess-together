# Tasks: MIDI Notes + Modes — Phone as Musical Instrument

**Prerequisites**: Spec at `.specify/specs/09-midi-notes-modes.md`
**Clarifications**: `.specify/09-clarify.md`
**Tech Plan**: `.specify/09-plan.md`
**Branch**: `09-midi-notes-modes`
**Tests**: MANDATORY per TDD constitution

---

## ✅ DONE — Phase 1: MIDI Sender Core (Priority: P1)

**Files**: `server-bridge/midi-sender.js` (NEW), `tests/server-bridge/midi-sender.test.js` (NEW)

- [x] T001 [UNIT] MidiSender creates virtual port with correct name
- [x] T002 [UNIT] sendNoteOn sends correct bytes [0x90 | ch, note, vel]
- [x] T003 [UNIT] sendNoteOff sends correct bytes [0x80 | ch, note, vel]
- [x] T004 [UNIT] sendCC sends correct bytes [0xB0 | ch, cc, value]
- [x] T005 [UNIT] sendPitchBend sends correct 14-bit bytes
- [x] T006 [UNIT] close() closes virtual port
- [x] T007 [GREEN] Implement MidiSender class (48 lines)
- [x] T008 [REFACTOR] All clamping, channel safety, allNotesOff added

---

## ✅ DONE — Phase 2: Scales Library + MidiMapper Core (Priority: P1)

**Files**: `server-bridge/midi-mapper.js` (NEW), `tests/server-bridge/midi-mapper.test.js` (NEW)

- [x] T009 [UNIT] All 13 scales have correct interval arrays
- [x] T010 [UNIT] scale + key produces correct MIDI note array
- [x] T011 [UNIT] sensor value mapped to scale degree
- [x] T012 [UNIT] note clamped to MIDI range (0-127)
- [x] T013 [GREEN] Implement scales library (13 scales)
- [x] T014 [GREEN] Implement MidiMapper class (setGlobalConfig, getScaleNotes, _sensorToScaleDegree, processSensor)

---

## ✅ DONE — Phase 3: Chaos Mode (Priority: P1)

- [x] T015 [UNIT] chaos mode maps orientation/beta to MIDI note 36-96
- [x] T016 [UNIT] chaos mode with accelMag below threshold does NOT trigger note
- [x] T017 [UNIT] chaos mode with accelMag above threshold triggers Note On
- [x] T018 [GREEN] Implement Chaos mode in MidiMapper
- [x] T019 [GREEN] Implement CC + Pitch bend mapping (9 CCs + pitch bend)

---

## ✅ DONE — Phase 4: Scale Mode (Priority: P2)

- [x] T020 [UNIT] scale mode quantizes note to selected scale
- [x] T021 [UNIT] key transposition works (C major vs D major)
- [x] T022 [GREEN] Implement Scale mode in MidiMapper

---

## ✅ DONE — Phase 5: Bridge Integration (Priority: P1)

**Files**: `server-bridge/index.js`, `tests/server-bridge/midi-integration.test.js` (NEW)

- [x] T032 [UNIT] Bridge without --midi does NOT create MidiSender
- [x] T033 [UNIT] Bridge with --midi creates MidiSender + MidiMapper
- [x] T034 [UNIT] Sensor message triggers MIDI note via MidiMapper → MidiSender
- [x] T035 [GREEN] Modify bridge: parse --midi + mode flags, wire lifecycle, banner, shutdown

---

## ⬜ Phase 6: Theremin Mode (Priority: P2)

**Goal**: Phone becomes a theremin — continuous pitch bend between scale degrees, accelMag controls note on/off with hysteresis.

**Files**: `server-bridge/midi-mapper.js`, `tests/server-bridge/midi-mapper.test.js`

### Design
- orientation/beta → floating-point scale degree
- Integer part = base MIDI note
- Fractional part → Pitch Bend (0-16383, center 8192)
- accelMag > 15 → Note On (with hysteresis: release at 10)
- gyro/a → CC 11 (Expression, 0-127)
- New state: `_heldNotes[slot] = { note, pitchBend }`

### Tests
- [x] T023 [UNIT] Theremin mode sends pitch bend for smooth transitions
- [x] T024 [UNIT] Note on/off controlled by accelMag with hysteresis (on at 15, off at 10)
- [x] T025 [GREEN] Implement Theremin mode:
  ```
  if mode === 'theremin':
    degree = orientation/beta / 180 * scale.length  // float
    baseNote = scaleNotes[floor(degree)]
    pitchBend = 8192 + floor((degree - floor(degree)) * 8192)  // 0-16383
    CC 11 from gyro/a
    Note On when accelMag > 15 (and not already held)
    Note Off when accelMag < 10 (and currently held)
    PitchBend updated every frame regardless of note state
  ```

---

## ⬜ Phase 7: Chord Mode (Priority: P3)

**Goal**: Phone plays full diatonic chords — orientation picks degree, accel picks inversion, gyro picks extension.

**Files**: `server-bridge/midi-mapper.js`, `tests/server-bridge/midi-mapper.test.js`

### Design
- 7 diatonic chord voicings with extension levels
- orientation/beta (0-180°) → degree 0-6
- accel/x (0-10) → inversion 0-2
- gyro/z (-2000 to 2000) → extension 0-4
- All chord notes sent simultaneously on same MIDI channel
- `_heldChordNotes[slot] = [note1, note2, note3, ...]`
- On accelMag > threshold: send NoteOff(old chord), NoteOn(new chord)
- On accelMag < threshold: NoteOff for all chord notes

### Chord Voicings Library
```javascript
CHORD_VOICINGS = {
  0: { intervals: [0, 4, 7],   extensions: { 0:[], 1:[10], 2:[14], 3:[17], 4:[21] } },  // I
  1: { intervals: [0, 3, 7],   extensions: { 0:[], 1:[10], 2:[14], 3:[17], 4:[21] } },  // ii
  2: { intervals: [0, 3, 7],   extensions: { 0:[], 1:[10], 2:[14] } },                   // iii
  3: { intervals: [0, 4, 7],   extensions: { 0:[], 1:[11], 2:[14], 3:[17] } },           // IV
  4: { intervals: [0, 4, 7],   extensions: { 0:[], 1:[10], 2:[14], 3:[17], 4:[21] } },  // V
  5: { intervals: [0, 3, 7],   extensions: { 0:[], 1:[10], 2:[14] } },                   // vi
  6: { intervals: [0, 3, 6],   extensions: { 0:[], 1:[10], 2:[14] } }                    // vii°
};
```

### Tests
- [x] T026 [UNIT] Chord mode outputs 3-4 simultaneous notes (check array length)
- [x] T027 [UNIT] Chord degree maps to correct chord type (I→[0,4,7], ii→[0,3,7], etc.)
- [x] T028 [GREEN] Implement Chord mode with inversion + extension + hysteresis

---

## ⬜ Phase 8: Arp Mode (Priority: P3)

**Goal**: Phone is an arpeggiator — BPM-synced note sequencer with 5 patterns, running on bridge.

**Files**: `server-bridge/midi-mapper.js`, `tests/server-bridge/midi-mapper.test.js`

### Design
- Arp engine lives inside MidiMapper as interval-based tick
- `_startArp(slot) / _stopArp(slot)` manage per-slot intervals
- `_arpState[slot] = { active, timer, step, lastNote, direction, pattern }`
- orientation/beta (0-180) → rate: 1/32 note to whole note
- accel/y (0-10) → pattern: up(0), down(1), upDown(2), random(3), pingPong(4)
- gyro/a (-2000 to 2000) → octave range 1-4
- orientation/gamma (-90 to 90) → gate length 0.1-0.9
- Note pool: scale notes × octave range (using getScaleNotes)
- Rate formula: `rateMs = 60000 / bpm * subdivisions[betaIndex]`
  - subdivisions: [32, 24, 16, 12, 8, 6, 4, 3, 2, 1.5, 1] (32nd to whole)
- Gate: fraction of tick duration before NoteOff sent

### Tests (use jest.useFakeTimers)
- [x] T029 [UNIT] Arp mode sends notes at BPM rate (verify interval timing with fake timers)
- [x] T030 [UNIT] Arp patterns produce correct sequences (up→1,2,3; down→3,2,1; upDown→1,2,3,2,1)
- [x] T031 [GREEN] Implement Arp mode: start/stop via accelMag threshold, rate/pattern/octave/gate from sensors

---

## ⬜ Phase 9: Bridge Dashboard (Priority: P2)

**Goal**: Live web UI at `/dashboard` for real-time mode/scale/key/chaos/BPM switching.

**Files**: 
- `server-bridge/public/dashboard.html` (NEW)
- `server-bridge/index.js` (MIDI config handler)
- `tests/server-bridge/dashboard.test.js` (NEW)

### Design
- Dashboard served at `GET /dashboard` (new route in handleRequest)
- Opens WebSocket to bridge as "monitor" type
- Sends `{ type: 'midiConfig', mode: 'scale', scale: 'blues', key: 'D', chaosAmount: 0.3, bpm: 140, octave: 4, noteThreshold: 15 }`
- Bridge `handleMidiConfigMessage()` validates and calls `midiMapper.setGlobalConfig()`
- UI: dropdowns + sliders, dark theme matching existing discovery page

### Bridge Changes
```javascript
function handleMidiConfigMessage(ws, info, msg) {
  if (!midiMapper) return; // MIDI not active
  const config = {};
  if (['chaos','scale','theremin','chord','arp'].includes(msg.mode)) config.mode = msg.mode;
  if (msg.scale && SCALES[msg.scale]) config.scale = msg.scale;
  if (msg.key && KEY_TO_ROOT[msg.key] !== undefined) config.key = msg.key;
  if (msg.chaosAmount !== undefined) config.chaosAmount = clamp(msg.chaosAmount, 0, 1);
  if (msg.bpm !== undefined) config.bpm = clamp(msg.bpm, 20, 300);
  if (msg.octave !== undefined) config.octave = clamp(msg.octave, 1, 7);
  if (msg.noteThreshold !== undefined) config.noteThreshold = clamp(msg.noteThreshold, 1, 127);
  midiMapper.setGlobalConfig(config);
  console.log('[midiConfig]', JSON.stringify(config));
}
```

### Tests
- [x] T038 [UNIT] Dashboard serves at /dashboard (HTTP 200)
- [x] T039 [UNIT] Config message updates MidiMapper global config
- [x] T040 [UNIT] Invalid config values rejected/clamped
- [x] T041 [UNIT] Dashboard connects as monitor (receives state broadcasts)
- [x] T042 [GREEN] Implement dashboard.html + bridge midiConfig handler

---

## ⬜ Phase 10: Documentation (Priority: P2)

**Files**: `docs/MIDI-SETUP.md` (NEW), `docs/DAW-INTEGRATION.md` (UPDATE), `README.md` (UPDATE)

- [x] T036 [DOC] Create `docs/MIDI-SETUP.md`:
  - REAPER MIDI input configuration (enable phone-sensor-orchestra)
  - 30-track template with per-channel MIDI routing
  - Mode selection guide (chaos, scale, theremin, chord, arp)
  - Command-line reference for all flags
  - Troubleshooting (ALSA, permissions, port not visible)
- [x] T037 [DOC] Update README.md with MIDI usage section

---

## ⬜ Phase 11: Spec Compliance Check

- [x] T043 Cross-artifact consistency check (spec/specify/plan vs implementation)
- [x] T044 Run full test suite — all ~420 tests pass
- [x] T045 Final commit with all phases

---

## Execution Order

```
Phase 6: Theremin  ──→  Phase 7: Chord  ──→  Phase 8: Arp  ──→  Phase 9: Dashboard  ──→  Phase 10: Docs  ──→  Phase 11: Compliance
   ~1hr                 ~1.5hr               ~2hr                 ~2hr                    ~1hr                   ~0.5hr
```

## Test Targets
- Current: 376 tests pass
- After Phase 6 (Theremin): ~385 tests
- After Phase 7 (Chord): ~395 tests
- After Phase 8 (Arp): ~405 tests
- After Phase 9 (Dashboard): ~415 tests
- Final target: ~415-420 tests
