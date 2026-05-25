---
id: 234
type: discovery
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 04:43:42"
updated_at: "2026-05-20 04:43:42"
revision_count: 1
tags:
  - cortexplugin
  - discovery
aliases:
  - "End-to-end test PASSED — phone → bridge → p5 via ngrok"
---

# End-to-end test PASSED — phone → bridge → p5 via ngrok

**What**: Complete end-to-end test passed. Phone client loaded via ngrok HTTPS tunnel, WebSocket connected to bridge (wss:// via ngrok), sensor data streamed from phone to bridge. Bridge routing fix (silent dashboard fallback → proper 404) resolved the ngrok issue.

**Architecture flow verified**:
1. ✅ Bridge serves phone-client files on port 8080 (single ngrok tunnel)
2. ✅ ngrok HTTPS tunnel forwards to bridge
3. ✅ Phone client loads at /phone-client/index.html?ip=ngrok-hostname (NOT the QR dashboard)
4. ✅ WebSocket connects via wss:// (auto-detected from HTTPS context)
5. ✅ Slot assigned, sensor data streaming

**Key**: Desktop browsers don't have accelerometers (devicemotion event never fires) — expected behavior. Real phone test confirmed full pipeline works.

**Where**: server-bridge/index.js, phone-client/app.js, ngrok tunnel subscribe-garden-plentiful.ngrok-free.dev

**Learned**: The three fix layers — (1) UA fallback for permission overlay, (2) ngrok HTTPS/WSS tunnel, (3) bridge URL routing for phone-client files — all work together in production.

---
*Session*: [[session-manual-save-cortexplugin]]
