---
id: 210
type: bugfix
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 02:15:20"
updated_at: "2026-05-20 02:15:20"
revision_count: 1
tags:
  - cortexplugin
  - bugfix
aliases:
  - "Fixed rapid WebSocket disconnect — rAF vs setInterval + zombie cleanup leak"
---

# Fixed rapid WebSocket disconnect — rAF vs setInterval + zombie cleanup leak

**What**: Fixed two bugs causing rapid phone-client WebSocket disconnect/reconnect cycles:
1. **Primary**: `startSensorLoop` used `requestAnimationFrame` for the 30fps send loop. On mobile browsers, `requestAnimationFrame` stops entirely when the tab is backgrounded or phone sleeps. This caused zero data to reach the bridge, triggering zombie timeout (15s) → disconnect → reconnect → loop.
2. **Secondary**: Bridge heartbeat handler directly deleted entries from `connections` Map after `ws.close()`, bypassing the `on('close')` handler's proper cleanup (slot free via `allocator.free()`, disconnect broadcast). This caused slot leaks.

**Why**: The phone client didn't account for mobile browser behavior where `requestAnimationFrame` is tied to the rendering pipeline and pauses when the tab is non-visible.

**Where**: 
- `phone-client/app.js` — `startSensorLoop()`: replaced `requestAnimationFrame` with `setInterval`
- `server-bridge/index.js` — heartbeat handler: removed direct `connections.delete()`/`players.delete()`; replaced with `ws.terminate()` which triggers the close event handler for proper cleanup

**Learned**: `requestAnimationFrame` is unsuitable for network send loops on mobile. Browser throttling/stopping of rAF in background tabs is a well-known issue. `setInterval` continues to fire (though throttled) in background tabs, keeping the bridge's `lastSeen` fresh. Also, never bypass the WebSocket close event handler for cleanup — always let the close handler free resources.

---
*Session*: [[session-manual-save-cortexplugin]]
