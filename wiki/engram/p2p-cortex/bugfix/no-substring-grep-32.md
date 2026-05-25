---
id: 32
type: bugfix
project: p2p-cortex
scope: project
topic_key: ""
session_id: manual-save-p2p-cortex
created_at: "2026-05-08 11:33:33"
updated_at: "2026-05-08 11:33:33"
revision_count: 1
tags:
  - p2p-cortex
  - bugfix
aliases:
  - "No Substring Grep"
---

# No Substring Grep

Never use grep patterns matching both old and new names. Verify new name present (exact match with \b) AND old name absent. Each test must fail on original code.

---
*Session*: [[session-manual-save-p2p-cortex]]
