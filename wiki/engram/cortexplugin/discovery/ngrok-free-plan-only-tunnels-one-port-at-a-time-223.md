---
id: 223
type: discovery
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 04:14:25"
updated_at: "2026-05-20 04:14:25"
revision_count: 1
tags:
  - cortexplugin
  - discovery
aliases:
  - "ngrok free plan only tunnels one port at a time"
---

# ngrok free plan only tunnels one port at a time

**What**: Ngrok Free plan only supports a single tunnel. Cannot tunnel both http-server (port 3000) and bridge (port 8080) simultaneously. Solution: have the bridge serve both phone-client files and WebSocket on a single port (8080), then tunnel just that port.

**Where**: Infrastructure setup for phone-sensor-orchestra testing

**Learned**: With a single ngrok tunnel on port 8080:
- Page: https://xxx.ngrok-free.dev/phone-client/index.html -> bridge HTTP server
- WebSocket: wss://xxx.ngrok-free.dev -> bridge WebSocket server (no port = 443)
- Bridge must serve files from phone-client/ directory

---
*Session*: [[session-manual-save-cortexplugin]]
