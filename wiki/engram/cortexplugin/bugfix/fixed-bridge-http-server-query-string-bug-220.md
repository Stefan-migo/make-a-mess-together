---
id: 220
type: bugfix
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 03:52:20"
updated_at: "2026-05-20 03:52:20"
revision_count: 1
tags:
  - cortexplugin
  - bugfix
aliases:
  - "Fixed bridge HTTP server query string bug"
---

# Fixed bridge HTTP server query string bug

**What**: Fixed HTTP server in server-bridge/index.js where `req.url` (which includes query strings like `?ip=xxx`) was used directly for file path construction, causing ENOENT errors.
**Why**: When phones connect with `?ip=` in the URL, the query string gets appended to the file path, e.g. `phone-client/index.html?ip=192.168.1.100` which doesn't exist.
**Where**: server-bridge/index.js — HTTP request handler (~line 149-193)
**Learned**: Always parse URLs with `new URL(req.url, \`http://${req.headers.host}\`)` and use `.pathname` for file serving to strip query strings.

---
*Session*: [[session-manual-save-cortexplugin]]
