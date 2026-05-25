---
id: 212
type: discovery
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 02:33:25"
updated_at: "2026-05-20 02:33:25"
revision_count: 1
tags:
  - cortexplugin
  - discovery
aliases:
  - "iOS permission API unavailable over HTTP LAN IP"
---

# iOS permission API unavailable over HTTP LAN IP

**What**: DeviceOrientationEvent.requestPermission() may not be exposed by iOS Safari/Chrome when the page is loaded over HTTP to a LAN IP (e.g., http://192.168.100.15:3000). This caused the requiresSensorPermission() check to fail, skipping the permission overlay entirely.

**Why**: iOS considers LAN IPs over HTTP as non-secure contexts. The permission API may not be available outside secure contexts (HTTPS or localhost).

**Where**: phone-client/app.js — requiresSensorPermission() function

**Learned**: Two-layer detection is required: (1) check for the permission API directly, (2) fallback to navigator.userAgent regex /iPhone|iPad|iPod/ for non-secure contexts. The requestSensorPermission() function already handles the case where the permission API doesn't exist by falling through to startSensors() directly.

---
*Session*: [[session-manual-save-cortexplugin]]
