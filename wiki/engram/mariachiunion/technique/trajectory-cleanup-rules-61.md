---
id: 61
type: technique
project: mariachiunion
scope: project
topic_key: ""
session_id: manual-save-MariachiUnion
created_at: "2026-05-08 12:47:00"
updated_at: "2026-05-08 12:47:00"
revision_count: 1
tags:
  - mariachiunion
  - technique
aliases:
  - "Trajectory Cleanup Rules"
---

# Trajectory Cleanup Rules

DELETE: failed tool calls + retry text, duplicate tool calls, redundant steps, exploratory steps. REWRITE: hint leakage in model responses AND thinking/reasoning text. KEEP INTACT: prompt + hint turn-1 message, tool call inputs, tool call outputs. If removing a buggy file creation step would leave orphaned edit logic, do a fresh run instead of forcing cleanup.

---
*Session*: [[session-manual-save-MariachiUnion]]
