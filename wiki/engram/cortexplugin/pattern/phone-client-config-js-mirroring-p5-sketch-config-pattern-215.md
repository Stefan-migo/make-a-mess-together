---
id: 215
type: pattern
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 02:59:23"
updated_at: "2026-05-20 02:59:23"
revision_count: 1
tags:
  - cortexplugin
  - pattern
aliases:
  - "Phone-client config.js mirroring p5-sketch config pattern"
---

# Phone-client config.js mirroring p5-sketch config pattern

**What**: Created phone-client/config.js that mirrors p5-sketch/config.js pattern. Stores default bridgeIp, wsPort, and sendIntervalMs. Read by app.js with URL param > localStorage > config.js > prompt priority chain.

**Why**: The user wants to set their bridge IP once without typing ?ip= every time. localStorage already persists the IP after first use, but config.js provides an editable file default for fresh visits or deployment configuration.

**Where**: phone-client/config.js, phone-client/app.js (getBridgeIp function), phone-client/index.html (script load order)

**Learned**: Static frontend projects without a build step can't use .env.local files. The config.js pattern (already established by p5-sketch) is the appropriate equivalent. PHONE_CONFIG global is checked only as a fallback, so URL params always win.

---
*Session*: [[session-manual-save-cortexplugin]]
