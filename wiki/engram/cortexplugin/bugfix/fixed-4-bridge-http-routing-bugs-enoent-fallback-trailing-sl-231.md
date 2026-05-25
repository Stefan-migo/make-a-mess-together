---
id: 231
type: bugfix
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 04:30:50"
updated_at: "2026-05-20 04:30:50"
revision_count: 1
tags:
  - cortexplugin
  - bugfix
aliases:
  - "Fixed 4 bridge HTTP routing bugs: ENOENT fallback, trailing slash, URL crash, logging"
---

# Fixed 4 bridge HTTP routing bugs: ENOENT fallback, trailing slash, URL crash, logging

**What**: Fixed 4 bugs in server-bridge/index.js HTTP handler:
1. **ENOENT silent dashboard fallback**: Replaced with proper 404 HTML response + console.log warning
2. **/phone-client (no trailing slash)**: Added explicit check to serve index.html instead of mismatching the startsWith('/phone-client/') guard
3. **URL parsing crash**: Wrapped new URL() in try-catch, returns 400 on malformed headers
4. **No logging**: Added console.log('[http]', method, pathname, '→ 404') on ENOENT
5. **Refactoring**: Extracted handleRequest(), added module.exports for testability

**Why**: Opening https://ngrok-url/phone-client/index.html showed the bridge dashboard QR page instead of the phone client sensor dashboard. The root cause was the silent ENOENT→dashboard fallback masking any file resolution failures.

**Where**: server-bridge/index.js lines 148-196, tests/bridge/http-routing.test.js (8 new tests)

**Learned**: Silent fallbacks are dangerous — always return explicit error codes. The new URL() constructor needs try-catch wrapping. Handle both /phone-client and /phone-client/ variants.

---
*Session*: [[session-manual-save-cortexplugin]]
