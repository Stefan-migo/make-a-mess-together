---
id: 229
type: bugfix
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 04:30:25"
updated_at: "2026-05-20 04:30:25"
revision_count: 1
tags:
  - cortexplugin
  - bugfix
aliases:
  - "Fixed 4 HTTP routing bugs in server-bridge"
---

# Fixed 4 HTTP routing bugs in server-bridge

**What**: Fixed 4 bugs in server-bridge/index.js HTTP handler. Extracted inline handler to named `handleRequest()` function + `require.main === module` guard + module.exports for testability.

**Bug #1 (CRITICAL)**: Silent dashboard fallback on ENOENT. Fixed by returning proper 404 HTML page instead of silently serving public/index.html.

**Bug #2**: `/phone-client` (no trailing slash) fell to else branch, serving dashboard instead of phone-client index.html. Fixed by adding explicit `/phone-client` path check.

**Bug #3**: No try-catch around `new URL()` parsing — malformed Host header would crash request. Fixed by wrapping in try-catch, returning 400 Bad Request on error.

**Bug #4**: No logging for debugging routing failures. Added `console.log('[http]', method, pathname, '→ 404')`.

**Where**: server-bridge/index.js (lines 148-199, 440-476), tests/bridge/http-routing.test.js (new file, 8 tests)

**Learned**: module scope `httpServer.listen()` prevents test imports — use `if (require.main === module)` guard to allow both direct execution and test require.

---
*Session*: [[session-manual-save-cortexplugin]]
