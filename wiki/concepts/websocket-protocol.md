# WebSocket Protocol

## Connection
- Bridge listens on `ws://<laptop-ip>:8080`
- Phone connects via WebSocket URL (from QR code or manual entry)
- p5 sketch connects via osc-js WebSocketClientAdapter

## Message Types

### sensor (Phone → Bridge)
Periodic sensor data at 30fps.
```json
{ "type": "sensor", "accel": {...}, "gyro": {...}, "orientation": {...} }
```

### assigned (Bridge → Phone)
Sent once on successful slot assignment.
```json
{ "type": "assigned", "slot": 0, "bridgeIp": "192.168.1.100" }
```

### player (p5 → Bridge)
Sent once on connection to register as a listener.
```json
{ "type": "player" }
```

## Reconnection
- Phone implements exponential backoff on disconnect
- On reconnect, gets new slot assignment
