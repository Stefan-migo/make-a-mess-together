# REAPER Setup Guide for phone-sensor-orchestra

Receive phone sensor data from the bridge server via OSC and map it to VST parameters.

## Prerequisites
- Fedora Linux (works with PipeWire out of the box)
- phone-sensor-orchestra bridge server running with `--daw`

## Step 1: Download and Install REAPER
1. Download from: https://www.reaper.fm/download.php
2. Choose "Linux x86-64/AMD64 64-bit" (13MB)
3. Extract: `tar -xzf reaper-7xx-linux-x86_64.tar.gz`
4. Install: `cd reaper-7xx && ./install.sh`
5. Launch REAPER from your application menu

## Step 2: Start the Bridge with OSC
```bash
cd phone-sensor-orchestra/server-bridge
node index.js --daw
```
You should see: `║  OSC DAW    : 127.0.0.1:9000`

## Step 3: Configure OSC in REAPER
1. Go to `Preferences → Control Surfaces → Add`
2. Select `OSC (Open Sound Control)`
3. In the configuration dialog:
   - Local listen port: `9000`
   - Leave other defaults
4. Click OK

## Step 4: Create Tracks and OSC Learn
1. Create 30 tracks (one per phone slot)
2. Load a VST synth on track 1 (e.g., ReaSynth, Vital, Surge XT)
3. Right-click a parameter (e.g., `Filter Cutoff`) → `Learn`
4. Click `OSC Learn` in the MIDI Learn dialog
5. Move the phone connected to slot 0
6. The OSC address `/device/0/accel` should appear
7. Click OK to bind
8. Repeat for each track/slot

## How Sensor Data Maps to OSC Addresses

| Sensor | OSC Address | Values | Best for |
|--------|-------------|--------|----------|
| Accelerometer X | `/device/{slot}/accel` | float 0-3 | Filter cutoff, pitch |
| Accelerometer Y | `/device/{slot}/accel` | float 0-3 | Volume, modulation |
| Accelerometer Z | `/device/{slot}/accel` | float 9.8± | Tilt, gravity |
| Gyroscope α | `/device/{slot}/gyro` | float ±2000 | Fast modulation, vibrato |
| Gyroscope β | `/device/{slot}/gyro` | float ±2000 | Pan, sweep |
| Gyroscope γ | `/device/{slot}/gyro` | float ±2000 | Wobble, tremolo |
| Orientation α | `/device/{slot}/orientation` | float 0-360 | Parameter scene, octave |
| Orientation β | `/device/{slot}/orientation` | float ±180 | Horizontal tilt |
| Orientation γ | `/device/{slot}/orientation` | float ±90 | Vertical tilt |

**Note**: All values are normalized floats. Accelerometer ranges from ~-10 to ~10, gyroscope from ~-2000 to ~2000, orientation in degrees.

## Optimized Track Template (for 30 phones)

1. Set up Track 1 with a VST synth
2. Map 2-3 OSC parameters (e.g., accel → cutoff, gyro → pitch LFO, orientation → pan)
3. `File → Save as Track Template`
4. Insert 29 more tracks from template
5. On each track, OSC Learn must be done per-track (they listen to different `/device/{slot}/` addresses)

## OSC Address Pattern Reference
```
/device/0/accel         →  accelerometer data for phone in slot 0
/device/1/accel         →  accelerometer data for phone in slot 1
/device/0/gyro          →  gyroscope data for phone in slot 0
/device/0/orientation   →  orientation data for phone in slot 0
/system/assign          →  sent when a phone connects (arg: slot number)
/system/disconnect      →  sent when a phone disconnects (arg: slot number)
/system/count           →  number of active devices (arg: count)
```

## Troubleshooting

### No OSC packets arriving
- Check bridge is running with `--daw`
- Verify port: `sudo ss -tulpn | grep 9000`
- Test with netcat: `nc -ul 9000` (should see binary data)
- Check FirewallD: `sudo firewall-cmd --add-port=9000/udp`

### REAPER not seeing any OSC messages
- Confirm port 9000 matches in both bridge and REAPER
- Check REAPER's OSC control surface is configured (not MIDI)
- Restart REAPER after setting up OSC
- Try a different port (e.g., 8000)

### OSC Learn not capturing
- Click "OSC Learn" button (not just "Learn")
- Move phone with enough range (gyroscope: fast motion)
- Check the bridge console for incoming messages

### Fedora-specific
- PipeWire works out of the box — no JACK config needed
- If using FirewallD: `sudo firewall-cmd --add-port=9000/udp --permanent`
- REAPER runs as a native Linux app, no Wine needed
