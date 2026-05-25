# Data Flow

## Phone → Bridge (WebSocket JSON)

```json
{
  "type": "sensor",
  "accel": { "x": 0.1, "y": 0.2, "z": 9.8 },
  "gyro": { "a": 0.05, "b": 0.01, "g": 0.03 },
  "orientation": { "a": 0, "b": 90, "g": 0 }
}
```

## Bridge → Phone (WebSocket JSON)

```json
{ "type": "assigned", "slot": 0, "bridgeIp": "192.168.1.100" }
```

## Bridge → p5 Sketch (OSC via osc-js)

```
/system/assign     { slot: 0 }
/system/disconnect { slot: 0 }
/system/count      { count: 3 }
/device/0/accel    [{type:"f",value:x}, {type:"f",value:y}, {type:"f",value:z}]
/device/0/gyro     [{type:"f",value:a}, {type:"f",value:b}, {type:"f",value:g}]
/device/0/orientation [{type:"f",value:a}, {type:"f",value:b}, {type:"f",value:g}]
```

## OSC Message Routing
- `/system/*` — lifecycle events (assign, disconnect, count)
- `/device/<slot>/*` — per-device sensor data

## Bridge Role Detection
- First message from client determines role
- `{ type: "sensor" }` → phone client, gets slot
- `{ type: "player" }` → p5 sketch, added to broadcast list
