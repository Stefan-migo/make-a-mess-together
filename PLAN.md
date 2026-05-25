# phone-sensor-orchestra

Multi-device phone sensor → p5.js sound + visuals over WebSocket/OSC

## Architecture

```
┌─────────────────┐     WebSocket      ┌──────────────────┐     WebSocket      ┌─────────────────┐
│ Phone A (Vercel) │ ──────────────────> │  Bridge Server   │ ──────────────────> │ p5 Sketch (local)│
│ Sensor Reader   │     :8080           │  (laptop Node)   │     :8080           │ osc-js + Tone.js │
└─────────────────┘                    │  Slot Allocator   │                    │ 30 Voices + Vis  │
┌─────────────────┐                    │  Message Relay    │                    └─────────────────┘
│ Phone B (Vercel) │ ──────────────────> └──────────────────┘
│ ... up to 30     │
└─────────────────┘
```

**Phone client** – Static HTML/JS deployed on Vercel. Reads DeviceMotion + DeviceOrientation APIs. Connects via WebSocket to the bridge.

**Bridge** – Node.js server running on the laptop. Accepts WebSocket connections, assigns slot numbers (0–29), relays sensor data to p5 players.

**p5 Sketch** – Runs locally in a laptop browser tab. Uses osc-js (WebSocketClientAdapter) to receive OSC messages, Tone.js for 30 independent voices, p5.js for radial visual layout.

## Repo Structure

```
phone-sensor-orchestra/
├── vercel.json                    # / → phone-client, /p5 → p5-sketch
├── PLAN.md                        # This file
├── server-bridge/                 # Local laptop server (NOT deployed)
│   ├── package.json               # ws + qrcode
│   ├── index.js                   # WebSocket :8080 + HTTP discovery page
│   └── public/
│       └── index.html             # QR code + connection info page
├── phone-client/                  # Deployed at root URL on Vercel
│   ├── index.html                 # Sensor page shell
│   ├── style.css                  # Minimal dark UI
│   └── app.js                     # Sensor read + WebSocket + live readouts
└── p5-sketch/                     # Deployed at /p5, runs locally
    ├── index.html                 # Loads p5.js, Tone.js, osc-js via CDN
    ├── config.js                  # 30-slot parameter config, layout geometry
    ├── sound-engine.js            # 30 voice types creation + update
    ├── visuals.js                 # 30 visual renderers (radial layout)
    ├── device-manager.js          # Slot lifecycle, OSC message handlers
    └── sketch.js                  # p5 setup(), draw(), OSC init
```

## Data Flow

```
Phone → Bridge:
  { type: "sensor", accel: {x,y,z}, gyro: {a,b,g}, orientation: {a,b,g} }

Bridge → Phone:
  { type: "assigned", slot: 0, bridgeIp: "192.168.1.100" }

Bridge → p5 Sketch (osc-js format):
  /system/assign     { slot: 0 }
  /system/disconnect { slot: 0 }
  /system/count      { count: 3 }
  /device/0/accel    [{type:"f",value:x}, {type:"f",value:y}, {type:"f",value:z}]
  /device/0/gyro     [{type:"f",value:a}, {type:"f",value:b}, {type:"f",value:g}]
  /device/0/orientation [{type:"f",value:a}, {type:"f",value:b}, {type:"f",value:g}]
```

## Slot Assignment

- Bridge maintains a pool of 30 slots (0–29)
- Each phone connection gets the lowest available slot
- On disconnect, slot is freed and reused
- Slot assignment is broadcast to all p5 players via `/system/assign`
- Device count broadcast via `/system/count`

## 30 Sound Types & Sensor Mappings

| Slots | Type | Sensor → Parameter | Detail |
|-------|------|--------------------|--------|
| 0 | SynthBasic | accel.y → pitch, gyro.z → filter | Simple oscillator + envelope |
| 1 | SynthFM | accel.x → modulation index, orientation.β → carrier freq | FM synthesis |
| 2 | SynthAM | gyro.α → depth, accel.z → modulator freq | Amplitude modulation |
| 3 | SynthDuo | orientation.γ → detune, accel.y → mix | Two detuned oscillators |
| 4 | SynthMono | gyro.β → glide time, accel.x → portamento | Mono synth with glide |
| 5 | ArpRate | orientation.β → rate, accel.x → note spread | Arpeggiator speed |
| 6 | ArpPattern | gyro.z → pattern select, accel.y → octave range | Pattern sequencer |
| 7 | ArpGate | orientation.α → gate length, gyro.α → swing | Gate time modulation |
| 8 | ArpDirection | accel.z → direction (up/down/pingpong/random), gyro.β → step count | Arp direction |
| 9 | NoiseWhite | accel.z → filter cutoff, gyro.α → resonance | White noise + filter |
| 10 | NoisePink | orientation.γ → volume, accel.x → pan | Pink noise spatial |
| 11 | NoiseBrown | gyro.β → LFO rate on cutoff, accel.y → LFO depth | Brown noise modulated |
| 12 | Kick | accel magnitude spike → trigger, gyro.z → pitch | Membrane synth triggered |
| 13 | Snare | orientation.β → noise mix, accel.y → decay | Noise + tone triggered |
| 14 | HiHat | gyro.α → cutoff, accel.z → decay time | Filtered noise triggered |
| 15 | DrumPattern | orientation.γ → pattern speed, accel.x → complexity | Rhythmic gate sequencer |
| 16 | Tom | accel magnitude → trigger, gyro.β → pitch drop | Tuned membrane |
| 17 | Bitcrush | accel.x → bit depth (1–16), gyro.z → sample rate reduction | Bit crusher FX |
| 18 | Stutter | orientation.γ → buffer size, accel.y → stutter rate | Buffer repeat glitch |
| 19 | Wavefold | gyro.α → fold amount, accel.z → symmetry | Wavefolder distortion |
| 20 | GlitchRandom | accel.x → randomize probability, gyro.β → interval | Random glitch triggers |
| 21 | GrainSize | gyro.β → grain size (0.01–0.5s), accel.y → grain pitch | Granular size + pitch |
| 22 | GrainDensity | orientation.α → density (1–50), accel.z → spread | Granular density |
| 23 | GrainScatter | gyro.γ → random position, accel.x → pan spread | Grain scatter |
| 24 | GrainPosition | accel.y → position in buffer, gyro.α → grain overlap | Buffer scan |
| 25 | Reverb | orientation.α → room size, accel.z → wet/dry | Convolution-like reverb |
| 26 | Delay | gyro.β → delay time, accel.y → feedback amount | Ping-pong delay |
| 27 | Distortion | accel.x → distortion amount, gyro.γ → output gain | Waveshaper distortion |
| 28 | Chorus | orientation.β → depth, gyro.α → rate | Chorus/flanger |
| 29 | Compressor | accel.z → threshold, gyro.β → ratio | Dynamic compression |

## 30 Visual Types

All rendered in a radial layout around the canvas center.

| Slots | Visual | Sensor → Parameter |
|-------|--------|--------------------|
| 0 | Pulsing circle radius | accel.y → size, gyro.z → hue |
| 1 | Rotating line angle | accel.x → rotation, orientation.β → length |
| 2 | Arc sweep | gyro.α → sweep angle, accel.z → thickness |
| 3 | Polygon vertex count | orientation.γ → sides, accel.y → radius |
| 4 | Spiral turns | gyro.β → turns, accel.x → spiral tightness |
| 5 | Connected dots count | orientation.β → dot count, accel.x → spread radius |
| 6 | Wave amplitude | gyro.z → amplitude, accel.y → frequency |
| 7 | Lissajous curve params | orientation.α → a/b ratio, gyro.α → phase |
| 8 | Concentric rings | accel.z → ring count, orientation.γ → ring spacing |
| 9 | Noise particle cloud | accel.z → particle count, gyro.α → spread |
| 10 | Oscilloscope trail | orientation.γ → trail length, accel.x → amplitude |
| 11 | Wobbly circle deform | gyro.β → wobble amount, accel.y → wobble speed |
| 12 | Expanding ring on trigger | accel magnitude → ring speed, gyro.z → ring count |
| 13 | Starburst lines | orientation.β → line count, accel.y → line length |
| 14 | Glowing dot opacity | gyro.α → opacity, orientation.γ → glow radius |
| 15 | Rhythmic pulse flash | orientation.γ → flash speed, accel.x → brightness |
| 16 | Bouncing ball height | gyro.β → bounce height, accel.z → ball size |
| 17 | Pixelated grid | accel.x → grid resolution, gyro.z → block size |
| 18 | Stutter strobe | orientation.γ → strobe rate, accel.y → contrast |
| 19 | Folded waveform | gyro.α → fold count, accel.z → waveform detail |
| 20 | Jitter offset | accel.x → jitter amount, gyro.β → interval |
| 21 | Scattered grain dots | gyro.β → dot size, accel.y → dot count |
| 22 | Particle fountain | orientation.α → particle rate, accel.z → gravity |
| 23 | Random position blink | gyro.γ → blink speed, accel.x → position randomness |
| 24 | Sliding window highlight | accel.y → window position, gyro.α → window width |
| 25 | Abstract shape size | orientation.α → shape size, accel.z → complexity |
| 26 | Echo ghost trail | gyro.β → ghost count, accel.y → fade rate |
| 27 | Visual distortion warp | accel.x → warp intensity, gyro.γ → warp frequency |
| 28 | Ripple rings | orientation.β → ripple count, gyro.α → ripple speed |
| 29 | Threshold bar graph | accel.z → bar height, gyro.β → bar count |

## Module Details

### server-bridge/index.js

- HTTP server on port 8080 serving `/public/index.html` (QR code + connection info)
- WebSocket server on the same port
- On connect: wait for first message to detect role (`"sensor"` or `"player"`)
- Sensor: assign slot via `assignSlot()` (linear scan for null), send `{type:"assigned", slot}` back
- Player: add to broadcast list, send current state (all active devices)
- On sensor message: forward to all players as osc-js formatted message
- On disconnect: free slot, broadcast `/system/disconnect` + `/system/count`
- `/system/count` broadcast whenever device count changes

### server-bridge/public/index.html

- Bridge IP + port displayed large
- QR code generated client-side (qrcode.js CDN) encoding `ws://<ip>:8080`
- "Open p5 sketch" link (for laptop)
- Active device list

### phone-client/index.html + style.css + app.js

**UI:**
- Dark background (#0a0a0a), white monospace text
- Header: slot number (large), connection status indicator (green/red dot)
- Sensor readouts in a 3-column grid:
  - Accelerometer: X, Y, Z with mini progress bars
  - Gyroscope: α, β, γ (degrees/s)
  - Orientation: α, β, γ (degrees)
- Permission request button (required on iOS)

**app.js logic:**
```js
// 1. Connect to WebSocket (IP from URL param ?ip= or prompt)
// 2. Request sensor permission on user gesture
// 3. devicemotion → accel + gyro data
// 4. deviceorientation → orientation data
// 5. requestAnimationFrame send loop at 30fps
// 6. Update DOM readouts
// 7. Reconnect on disconnect with exponential backoff
```

### p5-sketch/config.js

```js
const CONFIG = {
  maxDevices: 30,
  bridgeUrl: "ws://192.168.1.100:8080",  // user edits this
  canvasWidth: 1600,
  canvasHeight: 900,
  // Radial layout
  centerX: 800,
  centerY: 450,
  baseRadius: 300,
  // Per-slot config
  slots: [
    {
      soundType: "synthBasic",
      color: { h: 0, s: 80, b: 90 },
      soundParams: { freq: [50, 2000], filter: [200, 5000] },
      sensorMap: { freq: "accel.y", filter: "gyro.z" }
    },
    // ... 29 more
  ]
};
```

### p5-sketch/sound-engine.js

```js
class SoundEngine {
  constructor() { /* master gain to destination */ }
  createVoice(slot) { /* returns Tone.js node graph per soundType */ }
  updateVoice(voice, sd) { /* maps sensorData to voice params */ }
  disposeVoice(voice) { /* cleanup */ }
}
```

Each `createVoice` constructs a Tone.js signal chain:
- Synth types: Oscillator → Envelope → AmplitudeEnvelope → Gain
- Noise types: Noise → Filter → Gain
- Drum types: MembraneSynth/MetalSynth with `.triggerAttackRelease()` on threshold
- Glitch types: Oscillator → BitCrusher → Gain
- Granular: Tone.GrainPlayer or custom buffer + Tone.ToneBufferSource
- FX: Tone.Reverb, Tone.FeedbackDelay, Tone.Distortion, Tone.Chorus, Tone.Compressor

`updateVoice` maps sensor axis values to parameter ranges using config's `sensorMap` and `soundParams` ranges.

### p5-sketch/visuals.js

```js
class Visuals {
  constructor() { /* init */ }
  createVisual(slot) { /* returns visual state object */ }
  draw(slot, state, sd) { /* p5 drawing within radial wedge */ }
}
```

Each device draws in its angular slice of the circle:
- `angle = (slot / maxDevices) * TWO_PI`
- Position: `x = centerX + cos(angle) * radius`, `y = centerY + sin(angle) * radius`
- Each visual type uses `push()/pop()` with local transforms

### p5-sketch/device-manager.js

```js
class DeviceManager {
  constructor(engine, visuals) {
    this.slots = new Array(CONFIG.maxDevices).fill(null);
  }
  assign(slot, sensorData) { /* create voice + visual */ }
  update(slot, type, data) { /* update sensor data + engine/visuals */ }
  disconnect(slot) { /* dispose + free slot */ }
  drawAll() { /* draw each active device */ }
  get count() { /* active count */ }
}
```

### p5-sketch/sketch.js

```js
let dm, osc, started = false;

function setup() {
  createCanvas(CONFIG.canvasWidth, CONFIG.canvasHeight);
  colorMode(HSB, 360, 100, 100);
  
  dm = new DeviceManager(new SoundEngine(), new Visuals());
  
  osc = new OSC({ adapter: new WebSocketClientAdapter(CONFIG.bridgeUrl) });
  osc.on("/system/assign", m => dm.assign(m.args[0].value));
  osc.on("/system/disconnect", m => dm.disconnect(m.args[0].value));
  osc.on("/system/count", m => { /* update HUD */ });
  osc.on("/device/*/*", m => {
    const [, slot, type] = m.address.split("/");
    dm.update(parseInt(slot), type, m.args[0].value);
  });
  osc.open();
}

function draw() {
  background(0, 0, 8);
  dm.drawAll();
  // HUD overlay
}

function mousePressed() {
  if (!started) { Tone.start(); started = true; }
}
```

### p5-sketch/index.html

```html
CDN deps: p5.js 1.9, Tone.js 14.7, osc-js 2.4
Scripts in order: config.js → sound-engine.js → visuals.js → device-manager.js → sketch.js
```

### vercel.json

```json
{
  "rewrites": [
    { "source": "/p5/(.*)", "destination": "/p5-sketch/$1" },
    { "source": "/(.*)", "destination": "/phone-client/$1" }
  ]
}
```

## Setup & Run

```bash
# 1. Clone and install bridge
git clone <repo>
cd phone-sensor-orchestra/server-bridge
npm install
node index.js
# → Prints: "Bridge at ws://192.168.1.100:8080"
# → Prints: "Discovery page at http://192.168.1.100:8080"

# 2. Serve p5 sketch locally
cd ../p5-sketch
npx http-server -p 3000 -c-1
# → Open http://localhost:3000 on laptop

# 3. Phone: scan QR from bridge discovery page
#    (or open Vercel URL and enter IP)
# → Phone connects, gets slot#, streams sensor data

# 4. Click p5 canvas to activate audio
# → Each new phone adds a voice + visual element
```

## Vercel Deploy

```bash
cd phone-sensor-orchestra
vercel --prod
# → Phone client at: https://phone-sensor-orchestra.vercel.app
# → p5 sketch at:    https://phone-sensor-orchestra.vercel.app/p5
```

## Phone Client On Vercel

- Only serves static files (HTML/CSS/JS)
- Phone loads page from CDN edge (fast anywhere)
- All real-time data flows over LAN WebSocket to laptop bridge
- Vercel is out of the picture after page load

## Performance Notes

- **30 WebSocket connections** → trivial for Node.js (handles 1000+)
- **30 Tone.js voices** → ~120 AudioNodes → fine for WebAudio
- **30 draw calls/frame** → use `beginShape/endShape` batching if needed
- **30fps send rate** from phones (not 60) to reduce message flood
- **Bridge relays** messages individually (not batched) for lowest latency

## Sound Output

Default: Audio plays from **laptop speakers** only. All 30 voices mix in Tone.js on the laptop.

Future option: Each phone generates its own audio locally via WebAudio API, receiving parameter updates from the bridge. This would allow sound from each phone but adds complexity.

## Assumptions & Constraints

- All devices on same WiFi/LAN (laptop bridge IP must be reachable)
- iOS requires user tap for sensor permission
- Browsers block autoplay — requires click to start Tone.js
- p5 sketch opened locally (not on Vercel) for WebSocket to bridge
- Synthetic sounds only — no sample files needed
- Minimal visual style — no textures, no extra dependencies
