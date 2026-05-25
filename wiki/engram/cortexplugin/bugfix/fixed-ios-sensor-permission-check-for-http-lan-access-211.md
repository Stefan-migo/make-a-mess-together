---
id: 211
type: bugfix
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 02:32:50"
updated_at: "2026-05-20 02:32:50"
revision_count: 1
tags:
  - cortexplugin
  - bugfix
aliases:
  - "Fixed iOS sensor permission check for HTTP LAN access"
---

# Fixed iOS sensor permission check for HTTP LAN access

**What**: Fixed `requiresSensorPermission()` in phone-client/app.js to detect iOS via user agent fallback.

**Why**: Over HTTP to a LAN IP (not localhost), iOS does not expose `DeviceOrientationEvent.requestPermission`, so the original check returned false and the permission overlay was never shown.

**Where**: phone-client/app.js:423

**Learned**: `DeviceOrientationEvent.requestPermission` is only available on secure contexts (HTTPS or localhost). On HTTP LAN, iOS still requires the permission grant flow — so you must detect iOS via `navigator.userAgent` as a fallback.

---
*Session*: [[session-manual-save-cortexplugin]]
