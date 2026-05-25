---
id: 206
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 01:38:54"
updated_at: "2026-05-20 01:38:54"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Phase 4: Phone-client architecture pattern"
---

# Phase 4: Phone-client architecture pattern

**What**: Built the phone-client module (Phase 4) — browser-side HTML/CSS/JS that reads DeviceMotion + DeviceOrientation APIs, connects to bridge via WebSocket, sends sensor data at 30fps, and handles reconnection with exponential backoff.

**Why**: The phone-client is the sensor source for the phone-sensor-orchestra system. It must handle iOS permission requirements, sensor unavailability gracefully, and maintain a stable connection.

**Where**: phone-client/index.html, phone-client/style.css, phone-client/app.js

**Learned**: 
- Browser sensor APIs (DeviceMotionEvent, DeviceOrientationEvent) need special handling on iOS 13+ (DeviceOrientationEvent.requestPermission())
- rAF throttling at 33ms gives ~30fps send rate; separating UI update rAF from send rAF keeps display smooth
- Exponential backoff with ±30% jitter prevents thundering herd on reconnect
- IP discovery chain: URL param (?ip=) → localStorage → user prompt overlay

---
*Session*: [[session-manual-save-cortexplugin]]
