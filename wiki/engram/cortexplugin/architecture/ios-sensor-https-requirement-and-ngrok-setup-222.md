---
id: 222
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 04:14:22"
updated_at: "2026-05-20 04:14:22"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "iOS sensor HTTPS requirement and ngrok setup"
---

# iOS sensor HTTPS requirement and ngrok setup

**What**: iOS requires HTTPS for DeviceMotion/DeviceOrientation sensor APIs. Over HTTP to a LAN IP, both APIs and their requestPermission() method are hidden. The three-layer fix: (1) UA fallback for permission overlay, (2) ngrok HTTPS tunnel for the page, (3) WebSocket must also go through same HTTPS tunnel (WSS) to avoid mixed content blocking. Both page and WebSocket must share one ngrok tunnel on the bridge's port.

**Why**: Apple blocks sensor APIs in non-secure contexts (HTTP). Chrome on iOS also blocks ws:// WebSocket from HTTPS pages.

**Where**: phone-client/app.js, server-bridge/index.js

**Learned**: 
- For iOS testing, use ngrok to create an HTTPS endpoint
- The bridge must serve both phone-client files AND WebSocket on the same port
- WebSocket connection must use wss:// (no explicit port = default 443 via ngrok)
- User accesses: https://xxx.ngrok-free.dev/phone-client/index.html?ip=xxx.ngrok-free.dev
- Three terminals needed: bridge (port 8080), ngrok (tunnels 8080), http-server (optional, port 3000)

---
*Session*: [[session-manual-save-cortexplugin]]
