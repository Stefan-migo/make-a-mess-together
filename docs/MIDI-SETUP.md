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

The bridge automatically connects to REAPER via PipeWire (`pw-link`) — no extra setup needed.

```bash
# Default — 3-pool system (ChordSpace, Drums, GestureCanvas)
node server-bridge/index.js --midi

# With OSC output alongside MIDI
node server-bridge/index.js --daw 127.0.0.1:9000 --midi
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

### Per Mode — CC + Note Maps

Messages vary by the phone's active mode (set per-slot via dashboard or WebSocket):

**ChordSpace:**
| Message | Channel Range | Sensor Mapping |
|---------|--------------|---------------|
| Note On/Off | CH 1–6 (MIDI ch 0–5) | accel.x zone → chord tone, gate from orientation.a |
| CC 1 | CH 1–6 (MIDI ch 0–5) | accel.z → filter cutoff |
| CC 2 | CH 1–6 (MIDI ch 0–5) | accel.y → modulation |
| CC 11 | CH 1–6 (MIDI ch 0–5) | orientation.β → volume (bounded 40–100) |
| Pitch Bend | CH 1–6 (MIDI ch 0–5) | gyro.a → 14-bit bend |

**Drums:**
| Message | Channel Range | Sensor Mapping |
|---------|--------------|---------------|
| Note On (no Off) | CH 7–8 (MIDI ch 6–7) | accel delta spikes: X=kick(36), Y=snare(38), Z=crash(49); gyro.b delta → tom(47/48/50) |
| CC 1 | CH 7–8 (MIDI ch 6–7) | accel.z → filter cutoff |
| CC 4 | CH 7–8 (MIDI ch 6–7) | gyro.a → hi-hat openness |
| CC 7 | CH 7–8 (MIDI ch 6–7) | orientation.a → pattern zone (4 × 42) |

**GestureCanvas:**
| Message | Channel Range | Sensor Mapping |
|---------|--------------|---------------|
| CC 1 + 74 | CH 9–10 (MIDI ch 8–9) | gyro magnitude → gesture speed |
| CC 7 | CH 9–10 (MIDI ch 8–9) | orientation.a → scene (4 × 42) |
| CC 10 | CH 9–10 (MIDI ch 8–9) | gyro direction → pan |
| CC 16 + 71 | CH 9–10 (MIDI ch 8–9) | direction change → complexity |
| CC 17 | CH 9–10 (MIDI ch 8–9) | gyro buffer correlation → circularity |
| CC 91 + 93 | CH 9–10 (MIDI ch 8–9) | accel magnitude → reverb/chorus send |

### Rate
- **CCs + Pitch Bend**: 30fps continuous stream
- **Notes**: Event-based, triggered by zone change or accel spike
- Throughput: ~24 KB/sec for all 30 channels — negligible

---

## Mode Reference

Modes are assigned per-slot via the dashboard or WebSocket `modeChange` messages. Each mode maps to its own MIDI channel pool.

| Mode | MIDI Channels | Description |
|------|--------------|-------------|
| ChordSpace | CH 1–6 (MIDI ch 0–5) | Each phone plays one chord tone selected by accel.x zone (root/3rd/5th/7th/tension). Chord degree selected by accel.y tilt. Compass gate (orientation.a) silences notes outside active windows. Pitch bend from gyro.a. Volume bounded 40–100. |
| Drums | CH 7–8 (MIDI ch 6–7) | Percussive hits triggered by accel delta spikes. GM drum map: kick (36) on X spike, snare (38) on Y spike, crash (49) on Z spike. Hi-hat openness via gyro.a (CC 4). Toms (47/48/50) via gyro.b tilt. Pattern zone selector via orientation.a (CC 7). No Note Off — drum VST handles decay. |
| GestureCanvas | CH 9–10 (MIDI ch 8–9) | Pure continuous CC stream — no notes. Gyro magnitude maps to speed (CC 1 + 74). Gesture direction to pan (CC 10). Accel magnitude (gravity-cancelled) to reverb/chorus send (CC 91/93). Motion complexity to modulation (CC 16/71). Circularity metric from gyro buffer correlation (CC 17). Scene select via orientation.a (CC 7). |

---

## Command-Line Reference

```
node server-bridge/index.js [options]

Options:
  --midi                  Enable MIDI output (ALSA virtual port)
  --daw <host:port>       Enable OSC output for DAW parameter control
  --key <key>             Key / root note (default: C)
  --octave <n>            Base octave 1-7 (default: 3)

Examples:
  node index.js --midi                          # Default 3-pool MIDI
  node index.js --midi --key D --octave 3       # Set key + octave
  node index.js --daw 192.168.1.100:9000 --midi # MIDI + OSC
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

### MIDI not reaching REAPER (PipeWire)
The bridge automatically runs `pw-link` to connect its virtual MIDI port to REAPER. If MIDI doesn't reach REAPER:

1. Check REAPER is running before starting the bridge
2. Verify the PipeWire port exists:
   ```bash
   pw-link -o | grep phone-sensor-orchestra
   ```
3. Manually connect:
   ```bash
   pw-link "Midi-Bridge:RtMidi Output Clientphone-sensor-orchestra (capture)" "REAPER:MIDI Input 1"
   ```
4. If `pw-link` is not installed: `sudo dnf install pipewire-jack-audio-connection-kit` (Fedora) or `sudo apt install pipewire` (Ubuntu)

---

## Advanced: Per-Slot Configuration

The dashboard sends per-slot overrides via WebSocket:
```javascript
// Override mode for slot 3 only
{ type: 'modeChange', mode: 'drums' }
```

Not yet implemented in the bridge — coming in a future update.
