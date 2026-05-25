<div align="center">
  <h1>Make A Mess Together</h1>
  <p><strong>Multi-device phone sensors → collaborative brush canvas + generative sound</strong></p>
  <p>
    <a href="https://github.com/Stefan-migo/make-a-mess-together"><img src="https://img.shields.io/badge/GitHub-Repo-181717?style=flat-square&logo=github" alt="GitHub Repo"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
    <a href="https://p5js.org"><img src="https://img.shields.io/badge/p5.js-2.2-ED225D?style=flat-square&logo=p5.js" alt="p5.js"></a>
    <a href="https://tonejs.github.io"><img src="https://img.shields.io/badge/Tone.js-14.7-FF6F00?style=flat-square" alt="Tone.js"></a>
  </p>
  <p>
    <a href="#-what-is-it">What is it</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-how-it-works">How It Works</a> •
    <a href="#-setup--run">Setup & Run</a> •
    <a href="#%EF%B8%8F-brush-types">Brush Types</a>
  </p>
</div>

---

A system where **up to 30 phones** stream their motion sensors (accelerometer, gyroscope, orientation) via WebSocket to a bridge server, which relays data to a p5.js application that generates:

- **Collaborative brush canvas** — each phone is a unique brush painting on a shared canvas (34 brush types)
- **Generative sound** — each phone drives a Tone.js voice (30 voice types)
- All running in the browser, no app install needed

---

## Architecture

```
┌─────────────────┐     WebSocket      ┌──────────────────┐     Raw JSON      ┌─────────────────┐
│ Phone A (Vercel) │ ──────────────────> │  Bridge Server   │ ────────────────> │ p5 Sketch (local)│
│ Sensor Reader   │  wss://tunnel      │  (laptop Node)   │    wss://tunnel   │ osc-js + Tone.js │
└─────────────────┘                    │  Slot Allocator  │                   │ Brush Canvas     │
┌─────────────────┐                    │  Message Relay   │                   │ 34 Brushes       │
│ Phone B (Vercel) │ ──────────────────> └──────────────────┘                   └─────────────────┘
│ ... up to 30     │
└─────────────────┘
         ▲                                    │
         │                                    │ ngrok / cloudflared tunnel
         │                                    ▼
   Deployed on Vercel                  Public wss:// URL
```

---

## How It Works

- **Phone** (deployed on Vercel): Serves static HTML/JS. Reads `DeviceMotion` + `DeviceOrientation` APIs at 30fps. Requires iOS permission gesture. Connects via WebSocket to the bridge.
- **Bridge** (laptop): Node.js server on port 8080. Assigns slot numbers (0–29). Relays sensor data to connected p5 players. Discovery page with QR code.
- **p5 Sketch** (deployed on Vercel): Collaborative brush canvas. 34 brush types. 30 Tone.js sound types. Radial layout → brush canvas mode.

### Two Deployments

This project is split into **two independent Vercel deployments** from one GitHub repo:

| Deployment | URL (example) | What it does |
|------------|---------------|--------------|
| **Phone Client** | `make-a-mess-client.vercel.app` | Sensor reader for phones |
| **p5 Sketch** | `make-a-mess-p5.vercel.app` | Brush canvas + generative sound |

---

## Setup & Run

### Prerequisites

- Node.js >= 18
- A phone with iOS/Android (or browser simulator)
- ngrok or cloudflared (for HTTPS tunnel to test with real phones)

### Local Development

```bash
# 1. Clone
git clone https://github.com/Stefan-migo/make-a-mess-together.git
cd make-a-mess-together

# 2. Start the bridge server
cd server-bridge
npm install
node index.js
# → Bridge at ws://localhost:8080

# 3. Open p5 sketch locally
cd ../p5-sketch
npx http-server -p 3000 -c-1
# → Open http://localhost:3000 in browser, click canvas to start audio

# 4. Open phone client locally
# Open http://localhost:8080 (served by bridge)
# Or deploy phone-client to Vercel and open the URL
```

### Testing with Real Phones (via tunnel)

```bash
# 1. Start bridge
cd server-bridge && node index.js

# 2. Tunnel with ngrok
ngrok http 8080
# → Get URL like https://xxx.ngrok-free.dev

# 3. Open p5 sketch with bridge param
# https://make-a-mess-p5.vercel.app/?bridge=wss://xxx.ngrok-free.dev

# 4. On phone, open phone client with IP param
# https://make-a-mess-client.vercel.app/?ip=xxx.ngrok-free.dev
# Tap "Request Permission" then watch the canvas!
```

---

## Project Structure

```
make-a-mess-together/
├── phone-client/              # Deployed on Vercel
│   ├── index.html             # Sensor page shell
│   ├── style.css              # Minimal dark UI
│   └── app.js                 # Sensor read + WebSocket + live readouts
├── p5-sketch/                 # Deployed on Vercel
│   ├── index.html             # Loads p5.js, Tone.js
│   ├── config.js              # Bridge URL, slot config, layout
│   ├── sketch.js              # p5 setup/draw, WebSocket init
│   ├── brush-canvas.js        # Shared collaborative canvas
│   ├── brush-registry.js      # 34 brush types
│   ├── sound-engine.js        # 30 Tone.js voice types
│   ├── audio-bus.js           # Shared reverb/delay busses
│   ├── sensor-mapper.js       # Normalize, smooth, curveMap
│   ├── device-manager.js      # Slot lifecycle, sensor routing
│   └── visuals.js             # (legacy) 30 visual radial types
├── server-bridge/             # Local laptop server
│   ├── index.js               # HTTP + WebSocket server
│   ├── slot-allocator.js      # O(1) 30-slot pool
│   ├── message-relay.js       # Protocol handler
│   └── public/                # Discovery page with QR code
├── tests/                     # 240+ tests (Jest)
├── PLAN.md                    # Full architecture spec
├── wiki/                      # Obsidian wiki (auto-generated)
└── .opencode/                 # CortexPlugin agent framework
```

---

## Tech Stack

- **Frontend**: p5.js 2.2, Tone.js 14.7, Vanilla JS
- **Backend**: Node.js, ws library
- **Deployment**: Vercel (static sites)
- **Tunnel**: ngrok / cloudflared
- **Framework**: CortexPlugin (brain-lobe agent system used to build this)
- **Testing**: Jest (240+ tests)

---

## 🖊️ Brush Types

### Ink & Pens
Classic, Blade, Dotted, Stamped, Velocity, Dash

### Art & Texture
Sketchy, Watercolor, Spray, Chalk, Smoke, Furry

### SFX & Glow
Neon, Plasma, Fire, Frost, Lightning, Glitch

### Nature & Organic
Leaf, Vine, Feather, Cloud, Splatter, Honey

### Abstract & Weird
Wormhole, Ripple, Fractal, DNA, Gravity, Kaleido, Spores, PixelSort, Echo, Void

---

## 🔊 Sound Types

5 synth types, 4 arp types, 3 noise types, 5 drum types, 4 FX types, 4 granular types, 5 FX bus modulators. Each phone slot gets a unique voice mapped to its sensor data. See [`PLAN.md`](./PLAN.md) for the full 30-row table.

---

## Built With CortexPlugin

**Make A Mess Together** was built using [CortexPlugin](https://github.com/Stefan-migo/Cortex) — a brain-lobe agentic framework for OpenCode that combines Spec-Kit planning, Graphify code understanding, Engram persistent memory, and a Planner/Developer agent split. The project structure (`.opencode/`, `AGENTS.md`, `PLAN.md`, `wiki/`) reflects this framework.

---

## License

MIT License — feel free to use, modify, and make a mess.

---

<div align="center">
  <p>Up to 30 phones. One canvas. Infinite mess.</p>
  <p>
    <a href="https://github.com/Stefan-migo/make-a-mess-together/issues">Report Issue</a> •
    <a href="https://github.com/Stefan-migo/make-a-mess-together">GitHub</a>
  </p>
</div>
