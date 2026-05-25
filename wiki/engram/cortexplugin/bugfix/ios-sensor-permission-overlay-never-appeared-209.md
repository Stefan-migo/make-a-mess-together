---
id: 209
type: bugfix
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 02:02:46"
updated_at: "2026-05-20 02:02:46"
revision_count: 1
tags:
  - cortexplugin
  - bugfix
aliases:
  - "iOS sensor permission overlay never appeared"
---

# iOS sensor permission overlay never appeared

**What**: The permission overlay started hidden and was never shown, so startSensors() was never called on iOS. All sensor values stayed at zero because Safari blocks DeviceMotion/DeviceOrientation until requestPermission() is called from a user gesture.

**Why**: The init() flow connected to the bridge immediately without first checking if the device needs sensor permission (iOS).

**Where**: phone-client/app.js — init(), requestSensorPermission(), requiresSensorPermission(), resolveIpAndConnect()

**Learned**: 
- iOS detection: check typeof DeviceOrientationEvent.requestPermission === 'function'
- Permission flow must show overlay FIRST, wait for user tap, THEN connect to bridge
- Non-iOS devices can start sensors + connect immediately
- The resolveIpAndConnect() helper consolidates the IP config → connection flow used by both iOS and non-iOS paths

---
*Session*: [[session-manual-save-cortexplugin]]
