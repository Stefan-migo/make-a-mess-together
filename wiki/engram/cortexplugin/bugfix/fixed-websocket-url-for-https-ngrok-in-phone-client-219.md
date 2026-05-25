---
id: 219
type: bugfix
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 03:33:59"
updated_at: "2026-05-20 03:33:59"
revision_count: 1
tags:
  - cortexplugin
  - bugfix
aliases:
  - "Fixed WebSocket URL for HTTPS/ngrok in phone-client"
---

# Fixed WebSocket URL for HTTPS/ngrok in phone-client

**What**: Fixed phone-client/app.js to handle HTTPS (ngrok proxy) WebSocket connections. When page is HTTPS, omits port number (defaults to 443). When HTTP, includes explicit port 8080. Also updated `isValidIp()` to accept hostname domains (not just IPv4), and fixed bridge address display to show correct protocol/port.

**Why**: When served over HTTPS via ngrok, the WebSocket URL must use wss:// and omit the port (ngrok handles 443). The previous code always appended the port, causing connection failure over ngrok.

**Where**: phone-client/app.js — connect() function (line ~201), isValidIp() (line ~128), handleAssignedMessage() (line ~340)

**Learned**: Hostname validation was needed alongside IPv4 for ngrok domains like `subscribe-garden-plentiful.ngrok-free.dev`. The bridge address display also needs to reflect the correct protocol (wss vs ws).

---
*Session*: [[session-manual-save-cortexplugin]]
