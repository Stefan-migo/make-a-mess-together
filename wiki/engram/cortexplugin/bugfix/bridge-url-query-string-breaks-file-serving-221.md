---
id: 221
type: bugfix
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 04:14:18"
updated_at: "2026-05-20 04:14:18"
revision_count: 1
tags:
  - cortexplugin
  - bugfix
aliases:
  - "Bridge URL query string breaks file serving"
---

# Bridge URL query string breaks file serving

**What**: Bridge HTTP server used req.url directly for file paths, which includes query strings. /phone-client/index.html?ip=xxx became path phone-client/index.html?ip=xxx instead of phone-client/index.html. Fixed by parsing URL with new URL() and using pathname.

**Why**: Phone client passed bridge IP via ?ip= URL param. Query string appended to file path caused 404, falling back to dashboard index.html.

**Where**: server-bridge/index.js — HTTP request handler

**Learned**: Always parse req.url with new URL(req.url, base) and use pathname for file serving. Query strings are not part of the file path.

---
*Session*: [[session-manual-save-cortexplugin]]
