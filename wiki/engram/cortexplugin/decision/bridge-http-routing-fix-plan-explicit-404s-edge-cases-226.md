---
id: 226
type: decision
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 04:23:58"
updated_at: "2026-05-20 04:23:58"
revision_count: 1
tags:
  - cortexplugin
  - decision
aliases:
  - "Bridge HTTP routing fix plan: explicit 404s + edge cases"
---

# Bridge HTTP routing fix plan: explicit 404s + edge cases

**What**: Decision on how to fix the bridge HTTP routing bugs:
- Remove the silent ENOENT→dashboard fallback. Instead return a proper 404 HTML page.
- Add try-catch around URL parsing for crash safety.
- Add explicit check for `/phone-client` (no trailing slash) → serve index.html or 301 redirect.
- Add logging to ENOENT handler for debugging visibility.
- The `new URL(req.url, \`http://${req.headers.host}\`)` approach IS correct — it strips query strings properly. Keep it, but wrap in try-catch.

**Why**: The silent fallback masks routing failures and makes debugging impossible. Proper error handling + logging will make future routing issues self-diagnosing.

**Where**: server-bridge/index.js lines 148-196

---
*Session*: [[session-manual-save-cortexplugin]]
