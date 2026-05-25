---
id: 37
type: decision
project: p2p-cortex
scope: project
topic_key: ""
session_id: manual-save-p2p-cortex
created_at: "2026-05-08 11:33:34"
updated_at: "2026-05-08 11:33:34"
revision_count: 1
tags:
  - p2p-cortex
  - decision
aliases:
  - "PR Touching Test Files = Invalid"
---

# PR Touching Test Files = Invalid

If PR diff modifies test files, flag task invalid. v7.0: golden patch cannot modify test files. Rename PRs propagating to tests are inherently invalid.

---
*Session*: [[session-manual-save-p2p-cortex]]
