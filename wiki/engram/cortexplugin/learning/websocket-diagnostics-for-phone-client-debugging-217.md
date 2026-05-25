---
id: 217
type: learning
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 03:26:03"
updated_at: "2026-05-20 03:26:03"
revision_count: 1
tags:
  - cortexplugin
  - learning
aliases:
  - "WebSocket diagnostics for phone-client debugging"
---

# WebSocket diagnostics for phone-client debugging

**What**: Added WebSocket close code and reason to the phone-client UI so we can diagnose why connections drop. The onclose handler now shows event.code and event.reason in the connection status display. Also added a sensor-data diagnostic that warns when all readings stay at zero.

**Why**: On iOS via HTTPS (ngrok), the phone connects to the bridge but disconnects rapidly. The bridge doesn't show [zombie] kills, so the close is from the phone side. Close codes tell us: 1000=normal, 1006=abnormal/network, 4000-4002=server rejected.

**Where**: phone-client/app.js — onclose, onerror, startSensorLoop

**Learned**: WebSocket close codes: 1000=normal close, 1001=going away, 1002=protocol error, 1005=no status, 1006=abnormal close (network drop), 1011=server error, 4000-4999=app-specific.

---
*Session*: [[session-manual-save-cortexplugin]]
