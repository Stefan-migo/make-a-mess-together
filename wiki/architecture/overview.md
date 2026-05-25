# Architecture Overview

## phone-sensor-orchestra

Multi-device phone sensor → p5.js sound + visuals over WebSocket/OSC.

## System Architecture

```
┌─────────────────┐     WebSocket      ┌──────────────────┐     OSC (WebSocket)  ┌─────────────────┐
│ Phone A (Vercel) │ ──────────────────> │  Bridge Server   │ ──────────────────> │ p5 Sketch (local)│
│ Sensor Reader   │     :8080           │  (laptop Node)   │     :8080           │ osc-js + Tone.js │
└─────────────────┘                    │  Slot Allocator   │                    │ 30 Voices + Vis  │
┌─────────────────┐                    │  Message Relay    │                    └─────────────────┘
│ Phone B (Vercel) │ ──────────────────> └──────────────────┘
│ ... up to 30     │
└─────────────────┘
```

## Three Modules

### 1. server-bridge/
Node.js server running on the laptop. Accepts WebSocket connections, assigns slot numbers (0–29), relays sensor data to p5 players. Also serves a discovery page with QR code.

### 2. phone-client/
Static HTML/JS deployed on Vercel. Reads DeviceMotion + DeviceOrientation APIs. Connects via WebSocket to the bridge. 30fps send rate.

### 3. p5-sketch/
Runs locally in a laptop browser tab. Uses osc-js (WebSocketClientAdapter) to receive OSC messages, Tone.js for 30 independent voices, p5.js for radial visual layout.

## Key Design Decisions
- Bridge runs locally (not in cloud) to minimize latency
- p5 sketch runs locally for WebSocket access to bridge
- Phone client deployed on Vercel CDN for fast global load
- Vercel is out of the picture after page load
