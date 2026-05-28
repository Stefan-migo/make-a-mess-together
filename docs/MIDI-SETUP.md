# MIDI Setup Guide — phone-sensor-orchestra

The bridge can output MIDI directly to your DAW via a virtual ALSA MIDI port on Linux.
Each phone (slot) maps to one MIDI channel (0–29), so REAPER sees 30 independent instruments.

---

## Quick Start

### Prerequisites
- Fedora Linux (or any distro with ALSA)
- DAW that supports MIDI input (REAPER, Bitwig, Ardour, etc.)
- `alsa-lib-devel` installed (if @julusian/midi needs compilation)

```bash
sudo dnf install alsa-lib-devel   # Fedora only — headers for MIDI
cd server-bridge
npm install                        # installs @julusian/midi
```

### Run the bridge with MIDI

```bash
# Chaos mode (default) — raw sensor-to-MIDI, no music theory
node index.js --midi

# Scale mode — quantized to a musical scale
node index.js --midi --mode scale --scale pentatonic --key D

# Theremin — continuous pitch with accelMag gate
node index.js --midi --mode theremin --scale whole-tone --key C

# Chord — orientation picks chord degree + inversion
node index.js --midi --mode chord --key Am

# Arpeggiator — BPM-synced note sequencer
node index.js --midi --mode arp --scale blues --key A --bpm 140

# All together: MIDI + OSC + WebSocket
node index.js --daw 127.0.0.1:9000 --midi --mode scale --scale pentatonic --key D
```

### Start the dashboard
Open `http://<bridge-ip>:8080/dashboard` in a browser for live mode/scale/key switching.

---

## REAPER Configuration

### Step 1: Enable MIDI Input
1. Open REAPER → **Options → Preferences** (or Ctrl+P)
2. Go to **Audio → MIDI Devices**
3. Find **"phone-sensor-orchestra"** in the list
4. Right-click → **Enable input**
5. Click **OK**

### Step 2: Create 30 Tracks (Template)

Create a 30-track project template with per-channel MIDI routing:

1. **Track 1**: Right-click Record Arm → **Input: MIDI → phone-sensor-orchestra → Channel 1**
2. **Track 2**: **Input: MIDI → phone-sensor-orchestra → Channel 2**
3. ...continue through **Track 30: Channel 16** (MIDI channels 0-15 map to channel 1-16 in REAPER; slots 16-29 wrap modulo 16)

> **Note**: MIDI has 16 channels (1-16). Slots 0-15 = channels 1-16. Slots 16-29 cycle back to channels 1-14. Each pair of phones shares a channel but plays different notes due to different sensor positions.

### Step 3: Add Instruments
- Add your favorite VSTi to each track (Synth1, Vital, Surge XT, etc.)
- Or use REAPER's built-in **ReaSynth** for testing

### Step 4: Save as Template
- File → **Project Templates → Save project as template**
- Name: "phone-sensor-orchestra-30ch"

---

## MIDI Message Reference

### Per Channel (Slot N)

| Message | Bytes | Sensor Mapping |
|---------|-------|---------------|
| Note On | `[0x90 \| ch, note, vel]` | accelMag > threshold triggers note |
| Note Off | `[0x80 \| ch, note, vel]` | accelMag < threshold releases note |
| CC 1 | `[0xB0 \| ch, 1, val]` | accel/x → filter cutoff |
| CC 2 | `[0xB0 \| ch, 2, val]` | accel/y → modulation |
| CC 3 | `[0xB0 \| ch, 3, val]` | accel/z → resonance |
| CC 4 | `[0xB0 \| ch, 4, val]` | gyro/a → LFO rate |
| CC 5 | `[0xB0 \| ch, 5, val]` | gyro/b → effect depth |
| CC 6 | `[0xB0 \| ch, 6, val]` | gyro/g → pan |
| CC 7 | `[0xB0 \| ch, 7, val]` | orientation/α → scene select |
| CC 8 | `[0xB0 \| ch, 8, val]` | orientation/β → tilt X |
| CC 9 | `[0xB0 \| ch, 9, val]` | orientation/γ → tilt Y |
| CC 11 | `[0xB0 \| ch, 11, val]` | gyro/a → expression (theremin only) |
| Pitch Bend | `[0xE0 \| ch, lsb, msb]` | gyro/a → 14-bit bend |

### Rate
- **CCs + Pitch Bend**: 30fps continuous stream
- **Notes**: Event-based, triggered by phone shaking (accelMag threshold)
- Throughput: ~24 KB/sec for all 30 channels — negligible

---

## Mode Reference

| Mode | CLI Flag | Description |
|------|----------|-------------|
| Chaos | `--mode chaos` | Raw sensor → MIDI note. No music theory. orientation/β → note 36-96. gyro/z → randomness amount. |
| Scale | `--mode scale --scale <name> --key <key>` | Sensor quantized to musical scale. orientation/β → degree in scale. 13 scales available. |
| Theremin | `--mode theremin --scale <name>` | Continuous pitch bend between scale degrees. accelMag > 15 = note on, < 10 = note off. gyro/a → CC 11 volume. |
| Chord | `--mode chord --key <key>` | Full diatonic chords. orientation/β → degree (I-VII). accel/x → inversion. gyro/z → extension (7th, 9th, 11th, 13th). |
| Arp | `--mode arp --scale <name> --key <key> --bpm <bpm>` | BPM-synced arpeggiator. orientation/β → rate. accel/y → pattern. gyro/a → octave range. orientation/γ → gate. |

### Available Scales
chromatic, major, minor, pentatonic, blues, wholeTone, dorian, mixolydian, lydian, phrygian, locrian, augmented, diminished

### Available Keys
C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B

---

## Command-Line Reference

```
node server-bridge/index.js [options]

Options:
  --midi                  Enable MIDI output (ALSA virtual port)
  --daw <host:port>       Enable OSC output for DAW parameter control
  --mode <name>           MIDI mode: chaos, scale, theremin, chord, arp
  --scale <name>          Musical scale (default: pentatonic)
  --key <key>             Key / root note (default: C)
  --octave <n>            Base octave 1-7 (default: 3)
  --bpm <n>               Beats per minute for arp mode (default: 120)
  --chaos-amount <n>      Chaos randomization 0-1 (default: 0.5)

Examples:
  node index.js --midi                          # Chaos mode
  node index.js --midi --mode scale --scale blues --key A   # Blues in A
  node index.js --daw 192.168.1.100:9000 --midi --mode chord --key Cmaj7
```

---

## Troubleshooting

### ALSA virtual port not visible in REAPER
1. Ensure bridge is running: `node index.js --midi`
2. Check port is created: `aconnect -o` should list "phone-sensor-orchestra"
3. REAPER: **Preferences → MIDI Devices** → click **Refresh** list
4. If still not visible, restart REAPER

### `@julusian/midi` fails to install
```bash
# Fedora — install ALSA development headers
sudo dnf install alsa-lib-devel
# Ubuntu/Debian
sudo apt install libasound2-dev
# Then retry
npm install @julusian/midi
```

### No sound from MIDI
1. Check REAPER track is record-armed
2. Check track input is set to "phone-sensor-orchestra" + correct channel
3. Check monitor is ON (speaker icon)
4. Check VSTi has sound (test with MIDI keyboard)
5. Verify phone is sending data (bridge logs show sensor messages)

### Dashboard not loading
- Ensure bridge is running
- Open `http://<bridge-ip>:8080/dashboard` in a modern browser
- Check browser console for WebSocket errors

### Multiple bridges on same machine
Only one instance can use the "phone-sensor-orchestra" port name. Run a single bridge with both MIDI and OSC.

---

## Advanced: Per-Slot Configuration

The dashboard sends per-slot overrides via WebSocket:
```javascript
// Override mode for slot 3 only
{ type: 'midiConfig', slot: 3, mode: 'theremin', scale: 'whole-tone' }
```

Not yet implemented in the bridge — coming in a future update.
