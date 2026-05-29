# REAPER 10-Track Template for Pooled MIDI Routing

## Overview

The phone-sensor-orchestra bridge sends MIDI over an ALSA virtual port using a **3-pool routing system**. Instead of 30 individual channels (one per phone), phones are grouped into three functional pools:

| Pool | Mode | MIDI Channels | REAPER Tracks |
|------|------|---------------|---------------|
| A | ChordSpace — chord tones, progressions, gate | CH 1–6 | Tracks 1–6 (synth) |
| B | Drums — percussive hits, GM drum map | CH 7–8 | Tracks 7–8 (drum VST) |
| C | GestureCanvas — continuous textures, no notes | CH 9–10 | Tracks 9–10 (texture synth) |

**Key insight**: Only 10 MIDI channels are actively used (out of 16 available). When more phones join a pool than it has dedicated channels, they **wrap** and share channels. REAPER VSTs handle this via polyphony — multiple simultaneous notes from different phones on the same channel = richer chords, layered drums, or denser textures.

---

## Prerequisites

1. **Bridge server running** with `--midi`:
   ```bash
   cd phone-sensor-orchestra/server-bridge
   node index.js --midi
   ```
   Confirm: `MIDI: ACTIVE` appears in the startup banner.

2. **ALSA virtual port visible** — check with:
   ```bash
   aconnect -o
   # Should show: "phone-sensor-orchestra"
   ```

3. **Enable MIDI input in REAPER**:
   - `Preferences → MIDI Devices`
   - Locate `phone-sensor-orchestra` in the list of MIDI inputs
   - Right-click → `Enable input`
   - Click OK

---

## Step-by-Step: Create 10 Tracks

| Track # | Name | MIDI Input | Channel | Recommended VST |
|---------|------|-----------|---------|-----------------|
| 1 | Chord 1 | phone-sensor-orchestra | CH 1 | Vital / Serum / Surge XT |
| 2 | Chord 2 | phone-sensor-orchestra | CH 2 | Vital / Serum / Surge XT |
| 3 | Chord 3 | phone-sensor-orchestra | CH 3 | Vital / Serum / Surge XT |
| 4 | Chord 4 | phone-sensor-orchestra | CH 4 | Vital / Serum / Surge XT |
| 5 | Chord 5 | phone-sensor-orchestra | CH 5 | Vital / Serum / Surge XT |
| 6 | Chord 6 | phone-sensor-orchestra | CH 6 | Vital / Serum / Surge XT |
| 7 | Drums 1 | phone-sensor-orchestra | CH 7 | MT Power Drumkit / SSD5.5 / DrumGizmo |
| 8 | Drums 2 | phone-sensor-orchestra | CH 8 | MT Power Drumkit / SSD5.5 / DrumGizmo |
| 9 | Texture 1 | phone-sensor-orchestra | CH 9 | Reaktor / Pigments / Absynth / Vital |
| 10 | Texture 2 | phone-sensor-orchestra | CH 10 | Reaktor / Pigments / Absynth / Vital |

### Detailed Instructions

1. **Insert 10 tracks**
   - `Ctrl+T` ten times (or `Insert → Track`)

2. **Name tracks**
   - Double-click each track name in the TCP (Track Control Panel)
   - Name them: Chord 1 through Chord 6, Drums 1, Drums 2, Texture 1, Texture 2

3. **Set MIDI input + channel for each track**
   - Right-click the Record Arm button on Track 1
   - `Input: MIDI → phone-sensor-orchestra → Channel 1`
   - Repeat for each track with the correct channel (CH 2 for Track 2, etc.)

4. **Add FX/VSTi to each track**
   - Click FX button on Track 1
   - Add a synthesizer VST (Vital, Surge XT, or built-in ReaSynth)
   - Repeat for all 10 tracks with appropriate VSTs per type

5. **Arm + monitor**
   - Click Record Arm button on each track (turns red)
   - Click the speaker/monitor icon (turns on) — this makes the VST sound immediately without needing to record-arm in record mode
   - You should see MIDI activity indicators when phones are connected and sending data

6. **Save as project template**
   - `File → Project Templates → Save as Template`
   - Name: `phone-sensor-orchestra-10ch`
   - This template can be reused every session

---

## Understanding Channel Sharing

When more phones are in a pool than it has channels, phones share channels:

```
Slots 0-5   → CH 1-6  (ChordSpace — dedicated)
Slots 6-9   → CH 7-10 (Drums + Gesture — dedicated)
Slots 10-15 → CH 1-6  (ChordSpace — wrap around)
Slots 16-17 → CH 7-8  (Drums — wrap)
Slots 18-19 → CH 9-10 (GestureCanvas — wrap)
Slots 20-29 → CH 1-10 (further wrap across all pools)
```

### What This Means in REAPER

Example: 8 phones in ChordSpace (slots 10-15 + slots 0-1)
- CH 1 has phones from slots 0 and 10
- CH 2 has phones from slots 1 and 11
- ...each ChordSpace track receives MIDI from 1-2 phones
- When both phones send a note, the VST plays both simultaneously = a 2-note chord
- REAPER and the VST handle this as standard MIDI polyphony — no special setup needed

Example: 3 phones in Drums
- CH 7 has phones from slots 6 and 16
- CH 8 has phone from slot 17
- Two drum VST tracks receive hits from 1-2 phones each

### When Is This Useful?

- **Solo jam**: 1 phone → plays on dedicated channel
- **Group jam**: 6 phones → fills ChordSpace perfectly (one channel each)
- **Party**: 15+ phones → channels wrap, VST polyphony creates thick chords and layered textures
- **Performance**: The wrapping is seamless — no MIDI re-configuration needed

---

## Per-Mode CC Mapping Reference

Each mode sends a unique set of CCs continuously at 30fps:

### ChordSpace CCs

| CC | Parameter | Sensor Source | Range | Notes |
|----|-----------|---------------|-------|-------|
| 1 | Filter cutoff | accel.z | 0–127 | Modulated by phone tilt |
| 2 | Modulation | accel.y | 0–127 | Chord degree modulation |
| 11 | Expression / Volume | orientation.β | 40–100 | **Bounded** — never 0, never 127 |
| Pitch Bend | Pitch bend | gyro.α | 0–16383 | Continuous pitch modulation between chord tones |

### Drums CCs

| CC | Parameter | Sensor Source | Range | Notes |
|----|-----------|---------------|-------|-------|
| 1 | Filter cutoff | accel.z | 0–127 | Drum brightness |
| 4 | Hi-hat openness | gyro.α | 0–127 | 0=closed, 127=fully open |
| 7 | Pattern zone | orientation.α | 0, 42, 84, 126 | 4 discrete zones (0°, 90°, 180°, 270°) |

### GestureCanvas CCs

| CC | Parameter | Sensor Source | Range | Notes |
|----|-----------|---------------|-------|-------|
| 1 | Speed / Filter cutoff | gyro magnitude | 0–127 | Gesture speed drives filter |
| 7 | Scene select | orientation.α | 0, 42, 84, 126 | 4 texture presets (0°, 90°, 180°, 270°) |
| 10 | Pan | gesture direction | 0–127 | atan2(gyro.β, gyro.α) |
| 16 | LFO Rate (alt) | motion complexity | 0–127 | Follows direction change rate |
| 17 | Circularity | gyro buffer correlation | 0–127 | 0=linear, 64=random, 127=circular |
| 71 | Filter Envelope | motion complexity | 0–127 | Same source as CC 16 |
| 74 | Filter Resonance | gesture speed | 0–127 | Follows speed proportionally (same as CC 1) |
| 91 | Reverb Send | gesture size | 0–127 | Derived from accel magnitude — gravity cancelled |
| 93 | Chorus Send | gesture size | 0–127 | Mirrors CC 91 value |

### Pitch Bend

| Channel | Sensor | Usage |
|---------|--------|-------|
| CH 1–6 | gyro.α | ChordSpace only — pitch bend between chord tones |

### Note On Messages by Mode

| Mode | Notes Sent | Note Off? | Velocity Source |
|------|-----------|-----------|-----------------|
| ChordSpace | Chord tone (single note) | Yes — on zone change or gate close | Volume CC value (40–100) |
| Drums | Percussive hits (GM map) | **No** — drum VST handles decay | Spike magnitude (0–127) |
| GestureCanvas | **None** | N/A | N/A (pure CC) |

---

## VST Recommendations Per Track Type

### Synth Tracks (CH 1–6 — ChordSpace)

| VST | Price | Why |
|-----|-------|-----|
| **Vital** | Free | Great for evolving chord pads. Map CC 1 to filter cutoff, CC 11 to volume. |
| **Surge XT** | Free | Massive sound design. Good for warm chord tones. |
| **Helm** | Free | Simple, clean interface. Good for learning. |
| **ReaSynth** | Built-in | Basic but works. Map Cutoff to CC 1. |

**Recommended patch**: Start with a soft pad patch. Set amp envelope to slow attack (200ms) and long release (1-2s) for smooth chord transitions.

### Drum Tracks (CH 7–8 — Drums)

| VST | Price | Why |
|-----|-------|-----|
| **MT Power Drumkit** | Free | Full GM drum map, great rock sounds. |
| **Sennheiser DrumMic'a** | Free | Excellent acoustic drum samples. |
| **DrumGizmo** | Free / Open | Multi-velocity drum sampler. |
| **ReaSamplOmatic5000** | Built-in | Can load drum samples per note. |

**Important**: Configure the drum VST to receive on the correct MIDI channel. Most drum VSTs default to "Omni" (all channels) — this works but if you want separation between Drums 1 (CH 7) and Drums 2 (CH 8), set each instance to its specific channel.

### Texture Tracks (CH 9–10 — GestureCanvas)

| VST | Price | Why |
|-----|-------|-----|
| **Vital** | Free | Noise oscillator + filter + reverb = great textures. |
| **Surge XT** | Free | Excellent for ambient, evolving soundscapes. |
| **Helm** | Free | Simpler but capable of good filter sweeps. |

**Recommended patch**: Start with a noise-based patch. Map CC 1 to filter cutoff, CC 91 to reverb wet/dry, CC 10 to pan. Set amp envelope to "always on" (no envelope follower — GestureCanvas never sends Note On/Off, so the VST must produce sound based on CC alone).

---

## Routing Audio from 10 Tracks to Master

REAPER's default routing handles this correctly:
- All 10 tracks are automatically routed to Master
- No additional routing configuration needed
- Use the Master track's volume fader for overall mix level

If you want sub-mixes:
1. Create 3 folder tracks: `ChordSpace Bus`, `Drums Bus`, `GestureCanvas Bus`
2. Drag tracks 1–6 into the ChordSpace Bus folder
3. Drag tracks 7–8 into the Drums Bus folder
4. Drag tracks 9–10 into the GestureCanvas Bus folder
5. Route the 3 folder tracks to Master

---

## Troubleshooting

### No MIDI Input Visible in REAPER

- **Problem**: `phone-sensor-orchestra` doesn't appear in `Preferences → MIDI Devices`
- **Check**: Is `@julusian/midi` installed? Run `npm ls @julusian/midi` in `server-bridge/`
- **Check**: Is ALSA sequencer available? Run `aconnect -o` — the port must appear
- **Fix**: `sudo modprobe snd-seq` if the sequencer module isn't loaded
- **Fix**: Install ALSA dev libraries: `sudo dnf install alsa-lib-devel` (Fedora) or `sudo apt install libasound2-dev` (Debian)

### Wrong MIDI Channel

- **Problem**: Phone is sending but REAPER track isn't responding
- **Check**: Right-click Record Arm → Ensure MIDI Input is `phone-sensor-orchestra` AND the correct channel is selected
- **Check**: Is the track armed (red button)? Is monitoring on (speaker icon)?
- **Fix**: Set input to `All Channels` for debugging — if it works, narrow to the specific channel

### No Sound from VST

- **Problem**: MIDI activity light is flashing but no audio
- **Check**: Is the VST loaded with a patch that produces sound? Try ReaSynth first (guaranteed to work).
- **Check**: Master track volume is up, track volume fader is at 0dB
- **Check**: For GestureCanvas tracks: the VST must produce sound without Note On messages — ensure the amp envelope is set to "always on" or the filter is open at rest

### Multiple Phones But Only One Sounding

- **Problem**: Two phones in ChordSpace but only one note sounds
- **Check**: Are the phones assigned to different MIDI channels? Check bridge dashboard.
- **Check**: If both on same channel (wrapping), ensure the VST has enough polyphony (set max voices to 16+)
- **Fix**: In Vital/Surge: increase `Max Voices` in the voice settings

### MIDI Messages Too Fast (Note Flood)

- **Problem**: Machine-gun triggering or stuck notes
- **Check**: Drums pool — ensure spike detection cooldowns are active (100ms kick, 80ms snare)
- **Check**: ChordSpace — ensure hysteresis timer (250ms) is active
- **Fix**: Restart bridge with debug logging: `DEBUG=midi* node index.js --midi`

### Bridge Starts Without --midi

- **Problem**: Forgot the `--midi` flag
- **Fix**: `Ctrl+C` and restart with `node index.js --midi`
- **Note**: Without `--midi`, no virtual MIDI port is created. The dashboard will show mode selection but no MIDI channel assignment will function.
