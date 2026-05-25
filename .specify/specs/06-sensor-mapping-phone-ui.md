# Feature Specification: Sensor Mapping + Phone Dashboard UI

**Spec ID**: `06-sensor-mapping-phone-ui`
**Created**: 2026-05-25
**Status**: Draft
**Phase**: Polish & UX

---

## User Scenarios & Testing

### User Story 1 — Natural brush movement across full canvas (P1)

The user tilts their phone and the cursor moves smoothly across the entire canvas. Small tilts give fine control, large tilts reach the edges. The movement direction matches the phone: tilt left = cursor moves left.

**Why this priority**: Without natural-feeling responsive drawing, the experience is frustrating.

**Acceptance Scenarios**:
1. Given a phone is connected and the user holds it still, When the initial orientation is captured, Then the cursor appears at canvas center
2. Given the cursor is at center, When the user tilts left, Then the cursor moves left (not right)
3. Given the cursor is at center, When the user tilts forward, Then the cursor moves up the canvas
4. Given the cursor is near the edge, When the user tilts further, Then the cursor stops at the canvas edge (clamped)
5. Given the user makes a small tilt, When sensitivity curve is applied, Then the cursor moves a small proportional distance (fine control near center)
6. Given the user makes a large tilt, When sensitivity curve is applied, Then the cursor spans the full canvas width/height

### User Story 2 — Phone dashboard shows brush + color controls (P1)

The phone client shows a brush selector and color picker. The user can change their brush type and color in real-time, and the canvas updates immediately.

**Why this priority**: Personalization is key for collaborative drawing — each phone should be able to choose their mark.

**Acceptance Scenarios**:
1. Given the phone is connected, When the user taps the brush selector, Then a list of brush types appears
2. Given the user selects a brush type, When the selection is confirmed, Then the bridge relays the config to the p5 sketch and the cursor uses the new brush
3. Given the phone is connected, When the user adjusts the color slider, Then the cursor color changes immediately on the canvas
4. Given the phone reconnects, When the page reloads, Then the last selected brush and color are restored from localStorage

### User Story 3 — Config persists across sensor messages (P2)

Brush config (type + color) is sent once when changed, not with every sensor message. The bridge relays it to the p5 sketch as a separate message.

**Why this priority**: Sending config with every sensor message wastes bandwidth. Config changes are rare events.

**Acceptance Scenarios**:
1. Given the user changes brush type, When the phone sends a config message, Then the bridge relays it without attaching to sensor data
2. Given config was sent, When subsequent sensor messages arrive, Then the p5 sketch uses the stored config (no need to re-send)

---

## Design

### Phase A: Sensor-to-Canvas Mapping

**Current problem**: `_sensorToPosition` maps raw alpha(0-360°)→X, beta(-180-180°)→Y. Phone's usable tilt range is much smaller (~30° alpha, ~60° beta), so cursor only uses ~10-25% of canvas. Movement is mirrored (left tilt → right cursor).

**Solution**: Auto-calibrate on first sensor data, then map deviation from center to full canvas with sensitivity curve.

#### Auto-calibration (p5-sketch/brush-canvas.js)

Add a `_calibrateCenter(sensorData)` method:
- On first sensor data with combined orientation, save alpha and beta as `_centerAlpha` and `_centerBeta`
- Set `_calibrated = true`
- All subsequent calculations use deviation from this center

#### Deviation calculation

```
deltaAlpha = alpha - centerAlpha   // normalized -180 to +180
deltaBeta  = beta - centerBeta     // normalized -180 to +180
```

Normalize delta to -1..+1:
```
normalizedX = deltaAlpha / MAX_EXPECTED_TILT    // clamp to -1..+1
normalizedY = deltaBeta / MAX_EXPECTED_TILT     // clamp to -1..+1
```

Where `MAX_EXPECTED_TILT = 45` (degrees — user shouldn't need to tilt more than 45° in any direction from center).

#### Sensitivity curve

Apply a cubic ease curve for finer control near center:
```
curvedX = sign(normalizedX) * pow(abs(normalizedX), 0.6)   // exponent < 1 = more sensitivity near center
curvedY = sign(normalizedY) * pow(abs(normalizedY), 0.6)
```

#### Map to canvas (fix inversion)

```
canvasX = centerX + curvedX * canvasRadiusX    // invert alpha: -curvedX if mirrored
canvasY = centerY + curvedY * canvasRadiusY
```

Where `canvasRadiusX = width/2 - margin`, `canvasRadiusY = height/2 - margin`.

**Fixing the inversion**: The sign of deltaAlpha should be reversed (tilt left = alpha decreases = negative delta = cursor should go left = negative X). Since canvas X increases rightward, and negative deltaAlpha maps to negative X, this should already work correctly... The user reported mirroring, which means the sign needs to be checked. The fix is: `canvasX = centerX - curvedX * canvasRadiusX` if the mapping is inverted.

Actually, the simplest fix: test and swap. If moving phone left → cursor goes right, the fix is `canvasX = centerX - curvedX * radius` instead of `+ curvedX`.

#### Smoothing

Apply EMA smoothing to the normalized deviation values before curve mapping:
```
smoothX = smoothX * (1 - smoothFactor) + normalizedX * smoothFactor
```
Default `smoothFactor = 0.4` (responsive but not jittery).

---

### Phase B: Phone Dashboard UI

#### Brush selector

Add to `phone-client/index.html`:

A collapsible "Brush" section below the sensor readouts:
```
[▼ Brush & Color]
Brush: [Classic      ▼]  ← dropdown/select
Color: [●●●●●●●●●●●●●]  ← hue slider (0-360)
       [   Saturation ]  ← saturation slider
       [  Brightness   ]  ← brightness slider
```

Or a simpler version:
```
[▼ Brush & Color]
Brush: [classic] [blade] [dotted] [stamped] ...  ← pill buttons
Color: [■ hue slider ■■■■■■■■■■■]
```

Style: matches the existing dark theme (#0a0a0a), white text, sensor-colored accent bars.

#### Config message format

Phone → Bridge:
```json
{
  "type": "config",
  "brush": "classic",
  "color": { "h": 120, "s": 80, "b": 90 }
}
```

Bridge → p5 sketch:
```json
{
  "type": "system",
  "event": "config",
  "slot": 0,
  "config": {
    "brush": "classic",
    "color": { "h": 120, "s": 80, "b": 90 }
  }
}
```

#### Phone client storage (localStorage)
- Save brush type and color when changed: `localStorage.setItem('brushConfig', JSON.stringify({brush, color}))`
- Restore on page load
- Send config to bridge after connection is established

---

### Phase C: Bridge relay for config

#### server-bridge/message-relay.js
Add `formatConfigMessage(slot, config)` method:
```js
formatConfigMessage(slot, config) {
    return {
        type: 'system',
        event: 'config',
        slot,
        config: { ...config }
    };
}
```

#### server-bridge/index.js
In `handleSensorMessage`, after relaying sensor data, also handle non-sensor messages from authenticated sensors:
- After role is determined, check for `msg.type !== 'sensor'` but role === 'sensor'
- If `msg.type === 'config'`, relay to players via `formatConfigMessage`

Actually cleaner: add a separate message handler for config messages that doesn't go through `validateSensorMessage` (which requires type:'sensor'):

```js
// In ws.on('message'), after role detection:
if (connInfo.role === 'sensor') {
    if (msg.type === 'sensor') {
        handleSensorMessage(ws, connInfo, msg);
    } else if (msg.type === 'config') {
        handleConfigMessage(ws, connInfo, msg);
    }
}
```

```js
function handleConfigMessage(ws, info, msg) {
    if (!msg.brush && !msg.color) return; // need at least one
    const config = {};
    if (msg.brush) config.brush = msg.brush;
    if (msg.color) config.color = { ...msg.color };
    broadcastToPlayers(relay.formatConfigMessage(info.slot, config));
}
```

#### p5-sketch/sketch.js
In `handleMessage`, add case for `system/config`:
```js
case 'config':
    dm.updateConfig(msg.slot, msg.config);
    break;
```

#### p5-sketch/device-manager.js
Add `updateConfig(slot, config)` method:
```js
updateConfig(slot, config) {
    if (!this._brushCanvas) return;
    const cursor = this._brushCanvas.getCursor(slot);
    if (!cursor) return;
    if (config.brush) cursor.brushType = config.brush;
    if (config.color) cursor.color = { ...cursor.color, ...config.color };
}
```

---

## Data Flow

```
Phone Client                    Bridge                      p5 Sketch
───────────                     ──────                      ─────────
                                
1. Connect ── {type:"sensor"} ──→ detect role ── assign slot ──→
                                                       
2. Sensor ── {type:"sensor",     │ relay accel/gyro/
             accel,gyro,orient}──→ orientation to p5 ──→ update position
                                                       
3. User picks ── {type:"config",  │ formatConfigMessage──→ updateCursor
   "blade"      brush:"blade",    │                       brushType="blade"
                color:{h,s,b}} ──→ broadcast to players ──→
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `p5-sketch/brush-canvas.js` | Add auto-calibration, deviation mapping, sensitivity curve, inversion fix, EMA smoothing for normalized values |
| `phone-client/index.html` | Add brush selector + color picker UI (collapsible section) |
| `phone-client/style.css` | Styles for new UI elements (dark theme, pill buttons, sliders) |
| `phone-client/app.js` | Brush config state, config message send, localStorage, UI bindings |
| `server-bridge/message-relay.js` | Add `formatConfigMessage()` |
| `server-bridge/index.js` | Add `handleConfigMessage()` for type:'config' from sensors |
| `p5-sketch/sketch.js` | Add `system/config` message handler |
| `p5-sketch/device-manager.js` | Add `updateConfig(slot, config)` method |

---

## Edge Cases

1. **No orientation data yet**: Cursor stays at center until first complete sensor reading
2. **Phone flat on table**: orientation alpha/beta are near 0/0/0, cursor should be manageable
3. **Rapid tilt changes**: EMA smoothing prevents jitter, sensitivity curve prevents overreaction
4. **Config arrives before cursor exists**: DeviceManager should store pending config and apply when cursor is created
5. **Bridge receives config before slot assigned**: Only relay config if slot >= 0
6. **Invalid brush name**: Fall back to 'classic'
7. **LSB color values**: Clamp h(0-360), s(0-100), b(0-100)
