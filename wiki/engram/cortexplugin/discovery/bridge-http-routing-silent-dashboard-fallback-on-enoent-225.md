---
id: 225
type: discovery
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 04:23:55"
updated_at: "2026-05-20 04:23:55"
revision_count: 1
tags:
  - cortexplugin
  - discovery
aliases:
  - "Bridge HTTP routing: silent dashboard fallback on ENOENT"
---

# Bridge HTTP routing: silent dashboard fallback on ENOENT

**What**: Discovered 4 bugs in server-bridge HTTP routing logic:
1. **Silent dashboard fallback (CRITICAL)**: When fs.readFile() fails with ENOENT, the handler silently serves public/index.html (the dashboard QR page) instead of returning a 404. This is why opening https://ngrok-url/phone-client/index.html shows the QR page — the phone-client file path fails to resolve, ENOENT triggers, and the dashboard is served as a "fallback."
2. **No trailing-slash handling**: `/phone-client` (without trailing slash) doesn't match `startsWith('/phone-client/')`, falls to else branch, tries to serve `public/phone-client`, ENOENT, dashboard fallback.
3. **No try-catch around URL parsing**: `new URL(req.url, ...)` can throw if req.headers.host is malformed.
4. **Sub-resource cascade**: If phone-client/index.html loads but app.js or style.css 404s (silently), the page appears broken.

**Why**: Debugging why the phone-client page shows the dashboard QR code over ngrok tunnel.

**Where**: server-bridge/index.js lines 148-196 (HTTP request handler)

**Learned**: Always return real 404s instead of silent fallbacks. The ENOENT handler should serve a proper 404 page, not silently redirect to the dashboard.

---
*Session*: [[session-manual-save-cortexplugin]]
