# DAW Integration Guide for phone-sensor-orchestra

## Architecture

```
Phone → Bridge (WebSocket:8080) → p5 Sketch (visuals + fallback audio)
                                → UDP OSC → DAW (professional audio)
```

The bridge has two output paths that run simultaneously:
- **WebSocket** (existing): forwards sensor data to p5.js sketch for visuals
- **UDP OSC** (new with --daw flag): forwards same data as OSC packets for DAW integration

## Getting Started

```bash
cd server-bridge
node index.js --daw 127.0.0.1:9000
```

This starts the bridge with OSC output enabled. Phones connect via WebSocket as usual.

## OSC Protocol Reference

### Addresses and Arguments

| OSC Address | Type Tag | Arguments | Description |
|-------------|----------|-----------|-------------|
| `/device/{slot}/accel` | `,fff` | 3 floats (x, y, z) | Accelerometer: -10 to 10 m/s² |
| `/device/{slot}/gyro` | `,fff` | 3 floats (a, b, g) | Gyroscope: -2000 to 2000 °/s |
| `/device/{slot}/orientation` | `,fff` | 3 floats (a, b, g) | Orientation: alpha 0-360°, beta ±180°, gamma ±90° |
| `/system/assign` | `,i` | 1 int (slot) | Phone connected, slot assigned |
| `/system/disconnect` | `,i` | 1 int (slot) | Phone disconnected |
| `/system/count` | `,i` | 1 int (count) | Active device count |

### Binary Format

Standard OSC (Open Sound Control) binary over UDP:
- Address string: null-terminated ASCII, padded to 4-byte boundary
- Type tag string: comma + type chars (f=float32, i=int32), null-terminated, 4-byte padded
- Arguments: 32-bit big-endian values

### Performance

- 30 phones × 30fps × 3 OSC = **2,700 packets/second**
- Each packet: ~48 bytes = **~130 KB/sec** total bandwidth
- Node.js `dgram` handles 100,000+ packets/sec — this is trivial

## DAW-Specific Setup

### REAPER (recommended, $60)
See [REAPER-SETUP.md](REAPER-SETUP.md) for full guide.
- Built-in OSC control surface
- OSC Learn per parameter
- $60 for personal license

### Bitwig Studio ($399)
- Controller Scripts API (JavaScript) can receive OSC
- Need a custom script to parse `/device/*/*` addresses
- Or use Bitwig's modulation system with MIDI CC bridge
- Native Linux support, built by former Ableton devs

### Ardour (Free / PWYW)
- OSC control surface support built-in
- Configure in Preferences → Control Surfaces → OSC
- Maps OSC to mixer parameters

### Ableton Live (via Wine, $599+)
- Use LiveOSC protocol or Max for Live
- Requires Wine + WineASIO on Linux
- Less stable than native DAW options

## Testing OSC Without a DAW

```bash
# Listen on UDP port 9000 - see binary OSC packets
nc -ul 9000 | xxd

# Or use socat for hex dump
socat UDP-LISTEN:9000,fork -
```

## Troubleshooting

- **No OSC**: Check `--daw` flag, verify port, check firewall
- **Missing devices**: Each slot has a unique OSC address — DAW must listen per-slot
- **High CPU**: 2700 pkts/sec is fine, but each DAW track processes audio — disable unneeded tracks
- **Latency**: UDP is fire-and-forget. If you need guaranteed delivery, use TCP instead (future feature)

---

## MIDI Output (Native Linux)

The bridge also supports native Linux MIDI output via ALSA virtual ports — see [MIDI-SETUP.md](MIDI-SETUP.md) for configuration.

Key differences from OSC:
| Feature | OSC (--daw) | MIDI (--midi) |
|---------|-------------|---------------|
| Data | Raw sensor floats | Notes, CC, Pitch Bend |
| Rate | 30fps continuous | 30fps CC, event-based notes |
| DAW Setup | REAPER OSC config | REAPER MIDI input |
| Channels | Per-slot OSC address | MIDI channels 0-15 (wrapped) |
| Coexistence | Can run with MIDI | Can run with OSC (`--daw --midi`) |

Run both simultaneously:
```bash
node server-bridge/index.js --daw 127.0.0.1:9000 --midi --mode scale
```
