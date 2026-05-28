# Clarification: MIDI Notes + Modes — Phone as Musical Instrument

**Status**: Resolved  
**Date**: 2026-05-27  
**Spec**: `.specify/specs/09-midi-notes-modes.md`

---

## 1. Note On/Off Lifecycle

**Question**: When does Note Off fire? Does it fire on accelMag drop? On note change?

**Resolution**: 
- MidiMapper maintains `_heldNotes[slot]` state tracking
- On each processSensor call:
  - If accelMag > threshold AND note changed from held: send NoteOff(old), send NoteOn(new), update held
  - If accelMag > threshold AND note same: do nothing (note sustains)
  - If accelMag < threshold AND note held: send NoteOff(held), clear held
- This applies to chaos, scale, theremin, chord modes
- Arp mode has its own note-on/off logic (arp engine controls timing)

**Edge case**: Rapid shaking produces sequential notes, each decaying naturally via DAW envelope.

---

## 2. Theremin Mode — "Bend within scale degrees"

**Question**: How exactly does "bend within scale degrees" work?

**Resolution**:
- orientation/beta (0-180°) selects a floating-point scale degree
- Integer part = base scale degree → MIDI note
- Fractional part = microtonal offset → mapped to Pitch Bend (±8192 centered = 8192)
- Example: degree=2.7 → base=scale[2], pitchBend=8192+floor(0.7*8192)=8192+5734=13926
- accelMag threshold with HYSTERESIS:
  - Note On when accelMag > 15
  - Note Off when accelMag < 10 (lower hysteresis threshold = 10)
- gyro/a → CC 11 (Expression, 0-127)

**Implementation**: `_heldNotes[slot]` = { note, pitchBend }. On each call: update pitch bend continuously via sendPitchBend. Note on/off only on threshold crossing.

---

## 3. Chord Mode — Voicings and Extensions

**Question**: What are the exact chord voicings per degree? How do extensions work?

**Resolution**:

Use the key's diatonic triads as base, with extensions as interval additions:

```
chordVoicings = {
  0: { name: 'I',   intervals: [0, 4, 7],   extensions: { 0:[], 1:[10], 2:[14], 3:[17], 4:[21] } },
  1: { name: 'ii',  intervals: [0, 3, 7],   extensions: { 0:[], 1:[10], 2:[14], 3:[17], 4:[21] } },
  2: { name: 'iii', intervals: [0, 3, 7],   extensions: { 0:[], 1:[10], 2:[14] } },
  3: { name: 'IV',  intervals: [0, 4, 7],   extensions: { 0:[], 1:[11], 2:[14], 3:[17] } },
  4: { name: 'V',   intervals: [0, 4, 7],   extensions: { 0:[], 1:[10], 2:[14], 3:[17], 4:[21] } },
  5: { name: 'vi',  intervals: [0, 3, 7],   extensions: { 0:[], 1:[10], 2:[14] } },
  6: { name: 'vii°',intervals: [0, 3, 6],   extensions: { 0:[], 1:[10], 2:[14] } }
}
```

- orientation/beta (0-180°) → degree 0-6 (7 positions)
- accel/x (0-10 m/s²) → inversion 0, 1, 2 (0=root, 1=third in bass, 2=fifth in bass)
- gyro/z (-2000 to 2000°/s) → extension level 0-4
- All chord notes sent as simultaneous sendNoteOn on same channel
- Extension levels: 0=triad, 1=7th, 2=9th, 3=11th, 4=13th
- Inversion: rotate the note array. Root=[C,E,G], 1st=[E,G,C], 2nd=[G,C,E]
- When accelMag drops below threshold: send NoteOff for ALL notes in chord

---

## 4. Arp Mode — Engine Architecture

**Question**: Where does the arp engine live? Timer-based? Note-off tracking?

**Resolution**:
- ArpEngine is a sub-class or contained within MidiMapper
- Uses `setInterval` (or `setTimeout` chain) on the bridge
- AccelMag > threshold → start arp. AccelMag < threshold (hysteresis) → stop arp + all notes off
- Orientation/beta (0-180°) modulates rate: linear map from 1/32 note to whole note
  - At BPM 120: 1/32=62.5ms, 1/16=125ms, 1/8=250ms, 1/4=500ms, 1/2=1000ms, whole=2000ms
  - Formula: rateMs = 60000 / bpm * (1 / subdivisions), subdivisions mapped from beta
- Accel/y (0-10 m/s²) → pattern: 0=up, 1=down, 2=upDown, 3=random, 4=pingPong
- Gyro/a (-2000 to 2000°/s) → octave range 1-4 (number of octaves to arpeggiate over)
- Orientation/gamma (-90 to 90°) → gate length (0.1 to 0.9 of note duration)
- Arp note pool: `getScaleNotes(scale, key, octaveBase)` expanded by octave range
- Each arp tick: pick next note(s) from pattern, send NoteOff(previous), sendNoteOn(next)
- Arp state per slot: `_arpState[slot] = { active: bool, timer: handle, step: int, lastNote: int }`

---

## 5. Bridge Dashboard — WebSocket Config Channel

**Question**: What does the dashboard send? How does the bridge config channel work?

**Resolution**:
- Dashboard lives at `http://<bridge-ip>:8080/dashboard` (new route)
- Dashboard opens a WebSocket to the bridge (same ws://...)
- Sends config messages: `{ type: 'config', mode: 'scale', scale: 'blues', key: 'D', chaosAmount: 0.3, bpm: 140, octave: 4 }`
- Bridge already has `handleConfigMessage()` in `index.js` — but that's for phone-client brush config
  - NEED a NEW handler for MIDI config: `handleMidiConfigMessage(ws, info, msg)`
  - This calls `midiMapper.setGlobalConfig({...relevant fields...})`
- Dashboard also registers as a "monitor" (like the discovery page) to receive state updates
- Dashboard UI: mode selector (dropdown), scale selector, key selector, chaos slider, BPM slider, octave selector
- Uses the existing `broadcastToPlayers` for state feedback (reuse pattern)

---

## 6. Phase Ordering

**Execution order for remaining phases:**

1. Phase 5: Theremin mode (T023-T025) — builds directly on scale infrastructure
2. Phase 6: Chord mode (T026-T028) — more complex note arrays
3. Phase 7: Arp mode (T029-T031) — most complex, requires timer engine
4. Phase 9: Bridge Dashboard (NEW: T038-T042) — extends existing HTML/JS
5. Phase 10: Documentation (T036-T037) — MIDI-SETUP.md

---

## 7. Edge Cases Not in Original Spec

- **Hysteresis for theremin/arp**: Use 15 (on) / 10 (off) to prevent flickering
- **Arp with no notes in scale**: Default to C major scale if selected scale has 0 notes
- **Chord inversion with <3 notes**: Don't invert, play as-is
- **Rapid mode switching via dashboard**: MidiMapper.setGlobalConfig is called on each config message; arp engine restarts if mode changes to/from arp
- **MIDI sender not available**: Dashboard shows "MIDI disabled" if bridge started without --midi
