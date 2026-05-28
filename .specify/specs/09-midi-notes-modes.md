# Feature Specification: MIDI Notes + Modes — Phone as Musical Instrument

**Feature Branch**: `09-midi-notes-modes`  
**Created**: 2026-05-27  
**Status**: Spec  
**Input**: User wants phones to send MIDI notes/CC directly to REAPER (or any DAW) via a virtual ALSA MIDI port, with support for musical modes (scales, chords, arp) and a chaos mode. Each phone = one MIDI channel = one instrument.

---

## Architecture Overview

```
Phone → WebSocket → Bridge → ALSA Virtual MIDI Port → REAPER (MIDI Input)
                              │
                              └── Canal 0 → Track 1 (Synth)
                              └── Canal 1 → Track 2 (Bass)
                              └── ...
                              └── Canal 29 → Track 30 (Drums)
```

The bridge creates a **single virtual MIDI output port** called `phone-sensor-orchestra` using ALSA sequencer (via `@julusian/midi`). REAPER sees it as a MIDI input device. Each phone gets its own **MIDI channel (0-29)**.

**MIDI + OSC + WebSocket coexist:**

```
Bridge --daw --midi
  │
  ├── WebSocket → p5 (visuals)
  ├── UDP OSC → REAPER (param modulation, FX control)
  └── ALSA MIDI → REAPER (notes, CC, pitch bend)
```

---

## MIDI Protocol

### Per Phone (Slot N)

| MIDI Feature | Channel | Details |
|-------------|---------|---------|
| Channel | N (0-29) | One channel per phone |
| CC 1 | N | accel/x → filter cutoff (0-127) |
| CC 2 | N | accel/y → modulation (0-127) |
| CC 3 | N | accel/z → resonance (0-127) |
| CC 4 | N | gyro/a → LFO rate (0-127) |
| CC 5 | N | gyro/b → effect depth (0-127) |
| CC 6 | N | gyro/g → pan (0-127) |
| CC 7 | N | orientation/alpha → scene (0-127) |
| CC 8 | N | orientation/beta → tilt X (0-127) |
| CC 9 | N | orientation/gamma → tilt Y (0-127) |
| Pitch Bend | N | gyro/a → full 14-bit range |
| Note On/Off | N | accelMag threshold → trigger note |

**Note On/Off behavior depends on MODE:**

### Chaos Mode (`--mode chaos`)
```
Raw sensor → MIDI note, no theory:
  orientation/beta (0-180°) → Note: 36 + floor(beta/180 * 60)
  accelMag > threshold → Note On (velocity mapped)
  gyro/z → randomness amount (0=near scale, 1=full chaos)

Notes jump freely across the full MIDI range (C2-C7).
```

### Scale Mode (`--mode scale --scale pentatonic --key C`)
```
Sensor quantized to musical scale:
  orientation/beta → degree in scale → MIDI note
  0-180° mapped to scale.length degrees

Available scales: chromatic, major, minor, pentatonic, blues,
                 whole-tone, dorian, mixolydian, lydian,
                 phrygian, locrian, augmented, diminished
```

### Theremin Mode (`--mode theremin --scale whole-tone`)
```
Continuous pitch:
  orientation/beta → Note pitch (bend within scale degrees)
  accelMag > threshold → Note On/Off
  gyro/a → volume (CC 11)

Phone becomes a theremin: tilt for pitch, shake for note on/off.
```

### Chord Mode (`--mode chord --key Am`)
```
Phone plays full chords:
  orientation/beta → chord degree (I, ii, iii, IV, V, vi, vii°)
  accel/x → inversion (root, 1st, 2nd)
  gyro/z → extension (7th, 9th, 11th, 13th)

Note On triggered by accelMag threshold.
All chord notes sent simultaneously on same channel.
```

### Arp Mode (`--mode arp --scale pentatonic --bpm 120`)
```
Phone is an arpeggiator:
  orientation/beta → arp rate (1/32 to whole notes)
  accel/y → pattern (up, down, upDown, random, pingPong)
  gyro/a → octave range (1-4)
  orientation/gamma → gate length

Note On starts/stops the arp. Arp runs on bridge, sends MIDI notes.
```

---

## Global State

```javascript
// Stored in bridge, readable/writable via WebSocket
const GLOBAL_CONFIG = {
  mode: 'chaos',          // 'chaos' | 'scale' | 'theremin' | 'chord' | 'arp'
  scale: 'pentatonic',    // musical scale name
  key: 'C',               // 'C', 'C#', 'D', ... 'B'
  bpm: 120,               // beats per minute (for arp)
  octave: 3,              // base octave offset
  chaosAmount: 0.5,       // 0=deterministic, 1=full random
  channelPerSlot: true,    // true=slot→channel, false=all channel 1
  noteThreshold: 15,       // accelMag threshold for Note On
  noteVelocityMap: 'linear', // 'linear' | 'exponential' | 'inverse'
  noteRange: [36, 96],     // C2 to C7 in MIDI notes
};
```

Per-slot overrides stored in `slotConfigs: { [slot]: { mode?, scale?, ... } }`.

---

## MIDI Output - Technical

### Virtual Port
- Name: `phone-sensor-orchestra`
- Type: `@julusian/midi` Output with `openVirtualPort()`
- REAPER sees: `Preferences → MIDI Devices → "phone-sensor-orchestra"` as Input

### Message Types (standard MIDI bytes)

```
Note On:     [0x90 | channel, note, velocity]
Note Off:    [0x80 | channel, note, velocity]
CC:          [0xB0 | channel, ccNumber, value]
Pitch Bend:  [0xE0 | channel, lsb14, msb14]  // 14-bit value
```

### Rate
- Notes: triggered by accelMag threshold (sporadic, ~1-10/s)
- CCs: 30fps continuous stream (like OSC)
- Pitch Bend: 30fps continuous stream

### Performance
- 30 channels × 9 CCs × 30fps = 8,100 CC messages/sec
- Each CC = 3 bytes = ~24 KB/sec (trivial)
- Notes are event-based, not continuous

---

## CLI Flags

```bash
# Mínimo: MIDI en modo chaos
node server-bridge/index.js --midi

# Escala pentatónica
node server-bridge/index.js --midi --mode scale --scale pentatonic --key Am

# Theremin
node server-bridge/index.js --midi --mode theremin --scale whole-tone

# Acordes
node server-bridge/index.js --midi --mode chord --key Cmaj7

# Arpegiador
node server-bridge/index.js --midi --mode arp --scale blues --bpm 140

# TODO: MIDI + OSC + WebSocket (p5 visuales)
node server-bridge/index.js --daw 127.0.0.1:9000 --midi --mode scale --scale pentatonic --key D
```

---

## Files to Create/Modify

### server-bridge/package.json
- Add dependency: `@julusian/midi` (^3.6.1)

### server-bridge/midi-sender.js (NEW)
- `MidiSender` class
- Constructor: `new MidiSender(config)` — creates virtual port `phone-sensor-orchestra`
- Methods:
  - `sendNoteOn(channel, note, velocity)`
  - `sendNoteOff(channel, note, velocity)`
  - `sendCC(channel, ccNumber, value)`
  - `sendPitchBend(channel, value)` — 14-bit value
  - `close()` — closes virtual port
- CC mapping: 9 CCs mapped from sensor axes (defined in protocol table)
- Handles MIDI byte packing (status byte + channel)

### server-bridge/midi-mapper.js (NEW)
- `MidiMapper` class
- Takes global config + per-slot config
- Maps sensor data to MIDI events based on current mode
- Scale library: all 13 scales with interval arrays
- Key transposition logic
- Chord voicings for chord mode
- Arpeggiator engine (runs on setInterval)
- Chaos randomization engine
- Methods:
  - `setGlobalConfig(config)`
  - `setSlotConfig(slot, config)`
  - `processSensor(slot, sensorData)` → returns array of MIDI events
  - `getScaleNotes(scale, key, octave)` → array of MIDI note numbers

### server-bridge/index.js
- Parse `--midi` flag and mode flags
- Initialize `MidiSender` and `MidiMapper` when `--midi` present
- In handleSensorMessage: call `midiMapper.processSensor()` and send result via `midiSender`
- In startup banner: show `MIDI: ACTIVE` with mode info
- Wire lifecycle events (assign/disconnect → MIDI note off cleanup)

### docs/MIDI-SETUP.md (NEW)
- Guide for configuring REAPER to receive MIDI from virtual port
- 30-track template setup
- Per-channel routing

---

## Edge Cases

- **Bridge without --midi**: No virtual port created, no MIDI deps loaded
- **REAPER not running**: MIDI messages go nowhere (ALSA virtual port exists regardless)
- **ALSA not available**: `@julusian/midi` throws on constructor — catch gracefully, log warning, disable MIDI
- **Multiple bridges on same machine**: Port name is unique, only one instance
- **Phone disconnects**: Send Note Off for any held notes on that channel
- **NaN in note calculation**: Clamp to valid MIDI range (0-127)
- **Scale degree out of range**: Wrap modulo to stay in scale
- **Arp mode with 0 BPM**: Default to 120

---

## Dependencies

```bash
npm install @julusian/midi
# Fedora pre-requisite (if prebuild not available):
sudo dnf install alsa-lib-devel
```

`@julusian/midi` ships prebuilds for linux-x64, so `npm install` should work without compilation in most cases.

---

## Success Criteria

- **SC-001**: `node index.js --midi` creates virtual MIDI port visible in REAPER
- **SC-002**: Phone movement produces MIDI notes in the selected scale
- **SC-003**: Chaos mode produces atonal notes that change unpredictably
- **SC-004**: 30 phones = 30 independent MIDI channels in REAPER
- **SC-005**: MIDI + OSC + WebSocket all work simultaneously
- **SC-006**: All existing tests pass (no regressions)
- **SC-007**: Changing mode via CLI flag changes note behavior in real time
