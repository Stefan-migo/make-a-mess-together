---
id: 23
type: bugfix
project: p2p-cortex
scope: project
topic_key: ""
session_id: manual-save-p2p-cortex
created_at: "2026-05-08 11:33:31"
updated_at: "2026-05-08 11:33:31"
revision_count: 1
tags:
  - p2p-cortex
  - bugfix
aliases:
  - "Regex Greedy Capture"
---

# Regex Greedy Capture

Avoid greedy .+ in parsing.py regex. Anchor to line start or use non-greedy quantifiers. Only capture test result lines, not tracebacks.

---
*Session*: [[session-manual-save-p2p-cortex]]
