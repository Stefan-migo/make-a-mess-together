# Sensor Mapping

## Sensor Axes

### Accelerometer (devicemotion event)
- `accel.x` — left/right tilt
- `accel.y` — forward/backward tilt
- `accel.z` — up/down (gravity ≈ 9.8 at rest)
- `accel.magnitude` — sqrt(x² + y² + z²), used for trigger events

### Gyroscope (devicemotion event)
- `gyro.α` (alpha) — rotation around z-axis (deg/s)
- `gyro.β` (beta) — rotation around x-axis (deg/s)
- `gyro.γ` (gamma) — rotation around y-axis (deg/s)

### Orientation (deviceorientation event)
- `orientation.α` (alpha) — compass direction (0–360)
- `orientation.β` (beta) — front/back tilt (-180 to 180)
- `orientation.γ` (gamma) — left/right tilt (-90 to 90)

## Mapping Strategy
Each slot maps 2 sensor axes to sound parameters and 1–2 sensor axes to visual parameters.
Config defines per-slot `sensorMap` and `soundParams`/`visualParams` ranges.

## Threshold Detection
Slots 12 (Kick), 13 (Snare), 14 (HiHat), 16 (Tom) use accel.magnitude spike
detection to trigger sounds. Threshold is configurable per slot.
