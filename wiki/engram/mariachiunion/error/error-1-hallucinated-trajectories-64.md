---
id: 64
type: error
project: mariachiunion
scope: project
topic_key: ""
session_id: manual-save-MariachiUnion
created_at: "2026-05-08 12:47:14"
updated_at: "2026-05-08 12:47:14"
revision_count: 1
tags:
  - mariachiunion
  - error
aliases:
  - "Error #1: Hallucinated Trajectories"
---

# Error #1: Hallucinated Trajectories

Most common failure. Model references data before retrieval, uses placeholder/fabricated data, orphaned refs after cleanup. Prevention: re-read after every cleanup pass, trace every data point to tool call, check later steps don't depend on deleted call output. Model must read SKILL.md before using commands from that skill. Never accept placeholder/generic data.

---
*Session*: [[session-manual-save-MariachiUnion]]
