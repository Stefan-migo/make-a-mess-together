---
name: phone-sensor-orchestra
description: Domain knowledge for the multi-device phone sensor → p5.js sound + visuals system over WebSocket/OSC
license: MIT
compatibility: opencode
metadata:
  workflow: development
  audience: all agents
---

## What It Does
Provides domain-specific knowledge for the phone-sensor-orchestra project: sensor APIs, WebSocket protocol, OSC message format, 30 sound types, 30 visual types, and slot lifecycle management.

## When to Load
- Before any code editing session
- When discussing sensor mappings or sound/visual design
- When debugging data flow issues

## Architecture Overview

```
Phone (Vercel)  ──WebSocket──>  Bridge (laptop Node)  ──OSC──>  p5 Sketch (local browser)
Sensor Reader       :8080        Slot Allocator         :8080      osc-js + Tone.js + p5.js
                                  Message Relay                   30 Voices + 30 Visuals (radial)
```

Three modules:
- **server-bridge/** — Node.js WebSocket server on port 8080, slot allocator (0–29), message relay
- **phone-client/** — Static HTML/JS on Vercel, reads DeviceMotion + DeviceOrientation APIs
- **p5-sketch/** — p5.js + Tone.js + osc-js, 30 voice types, 30 visual types in radial layout

## Data Flow Protocol

### Phone → Bridge (WebSocket JSON)
```json
{ "type": "sensor", "accel": {"x":0.1,"y":0.2,"z":9.8}, "gyro": {"a":0,"b":0,"g":0}, "orientation": {"a":0,"b":90,"g":0} }
```

### Bridge → Phone (WebSocket JSON)
```json
{ "type": "assigned", "slot": 0, "bridgeIp": "192.168.1.100" }
```

### Bridge → p5 (OSC via osc-js WebSocketClientAdapter)
```
/system/assign     { slot: 0 }
/system/disconnect { slot: 0 }
/system/count      { count: 3 }
/device/0/accel    [{type:"f",value:x}, {type:"f",value:y}, {type:"f",value:z}]
/device/0/gyro     [{type:"f",value:a}, {type:"f",value:b}, {type:"f",value:g}]
/device/0/orientation [{type:"f",value:a}, {type:"f",value:b}, {type:"f",value:g}]
```

## Slot Assignment
- Pool of 30 slots (0–29)
- Lowest available slot on connect
- Slot freed on disconnect, reused
- `/system/assign` broadcast to all p5 players
- `/system/count` on any device count change

## 30 Sound Types (quick reference)
| Slots | Type | Sensor → Parameter |
|-------|------|--------------------|
| 0 | SynthBasic | accel.y → pitch, gyro.z → filter |
| 1 | SynthFM | accel.x → mod index, orientation.β → carrier |
| 2 | SynthAM | gyro.α → depth, accel.z → mod freq |
| 3 | SynthDuo | orientation.γ → detune, accel.y → mix |
| 4 | SynthMono | gyro.β → glide, accel.x → portamento |
| 5 | ArpRate | orientation.β → rate, accel.x → spread |
| 6 | ArpPattern | gyro.z → pattern, accel.y → octave range |
| 7 | ArpGate | orientation.α → gate, gyro.α → swing |
| 8 | ArpDirection | accel.z → direction, gyro.β → steps |
| 9 | NoiseWhite | accel.z → cutoff, gyro.α → resonance |
| 10 | NoisePink | orientation.γ → volume, accel.x → pan |
| 11 | NoiseBrown | gyro.β → LFO rate, accel.y → LFO depth |
| 12 | Kick | accel.magnitude → trigger, gyro.z → pitch |
| 13 | Snare | orientation.β → noise mix, accel.y → decay |
| 14 | HiHat | gyro.α → cutoff, accel.z → decay |
| 15 | DrumPattern | orientation.γ → speed, accel.x → complexity |
| 16 | Tom | accel.magnitude → trigger, gyro.β → pitch drop |
| 17 | Bitcrush | accel.x → bit depth, gyro.z → sample rate |
| 18 | Stutter | orientation.γ → buffer, accel.y → stutter rate |
| 19 | Wavefold | gyro.α → fold, accel.z → symmetry |
| 20 | GlitchRandom | accel.x → probability, gyro.β → interval |
| 21 | GrainSize | gyro.β → grain size, accel.y → grain pitch |
| 22 | GrainDensity | orientation.α → density, accel.z → spread |
| 23 | GrainScatter | gyro.γ → position, accel.x → pan |
| 24 | GrainPosition | accel.y → buffer pos, gyro.α → overlap |
| 25 | Reverb | orientation.α → room, accel.z → wet/dry |
| 26 | Delay | gyro.β → time, accel.y → feedback |
| 27 | Distortion | accel.x → amount, gyro.γ → gain |
| 28 | Chorus | orientation.β → depth, gyro.α → rate |
| 29 | Compressor | accel.z → threshold, gyro.β → ratio |

## 30 Visual Types (quick reference)
All rendered in radial layout. Position: `angle = (slot/30) * TWO_PI`, then `x = centerX + cos(angle)*radius, y = centerY + sin(angle)*radius`.

## Key Constraints
- iOS requires user gesture for sensor permission
- Browsers block autoplay — click to start Tone.js
- p5 sketch opens LOCALLY (not on Vercel) for WebSocket to bridge
- 30fps send rate from phones
- Synthetic sounds only, no sample files
- All devices on same LAN

## Run Commands
```bash
# Bridge
cd server-bridge && npm install && node index.js

# p5 sketch
cd p5-sketch && npx http-server -p 3000 -c-1

# Deploy phone client
vercel --prod
```
