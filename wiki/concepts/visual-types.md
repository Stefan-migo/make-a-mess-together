# Visual Types (30 Visualizers)

All rendered in a radial layout around canvas center.
Position: `angle = (slot / 30) * TWO_PI`, `x = centerX + cos(angle)*radius`, `y = centerY + sin(angle)*radius`

| Slot | Visual | Sensor → Parameter |
|------|--------|--------------------|
| 0 | Pulsing circle | accel.y → size, gyro.z → hue |
| 1 | Rotating line | accel.x → rotation, orientation.β → length |
| 2 | Arc sweep | gyro.α → sweep, accel.z → thickness |
| 3 | Polygon | orientation.γ → sides, accel.y → radius |
| 4 | Spiral | gyro.β → turns, accel.x → tightness |
| 5 | Connected dots | orientation.β → count, accel.x → spread |
| 6 | Wave | gyro.z → amplitude, accel.y → frequency |
| 7 | Lissajous | orientation.α → a/b ratio, gyro.α → phase |
| 8 | Concentric rings | accel.z → count, orientation.γ → spacing |
| 9 | Noise particles | accel.z → count, gyro.α → spread |
| 10 | Oscilloscope | orientation.γ → trail, accel.x → amplitude |
| 11 | Wobbly circle | gyro.β → wobble, accel.y → speed |
| 12 | Expanding rings | accel magnitude → speed, gyro.z → count |
| 13 | Starburst | orientation.β → lines, accel.y → length |
| 14 | Glowing dot | gyro.α → opacity, orientation.γ → glow |
| 15 | Pulse flash | orientation.γ → speed, accel.x → brightness |
| 16 | Bouncing ball | gyro.β → height, accel.z → size |
| 17 | Pixelated grid | accel.x → resolution, gyro.z → block size |
| 18 | Stutter strobe | orientation.γ → rate, accel.y → contrast |
| 19 | Folded waveform | gyro.α → fold count, accel.z → detail |
| 20 | Jitter offset | accel.x → jitter, gyro.β → interval |
| 21 | Scatter dots | gyro.β → dot size, accel.y → count |
| 22 | Particle fountain | orientation.α → rate, accel.z → gravity |
| 23 | Random blink | gyro.γ → speed, accel.x → randomness |
| 24 | Sliding window | accel.y → position, gyro.α → width |
| 25 | Abstract shape | orientation.α → size, accel.z → complexity |
| 26 | Echo ghost trail | gyro.β → ghosts, accel.y → fade |
| 27 | Distortion warp | accel.x → warp, gyro.γ → frequency |
| 28 | Ripple rings | orientation.β → count, gyro.α → speed |
| 29 | Bar graph | accel.z → bar height, gyro.β → count |

Full spec: [PLAN.md](../../PLAN.md)
