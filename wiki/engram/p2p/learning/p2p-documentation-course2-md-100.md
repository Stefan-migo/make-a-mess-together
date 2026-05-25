---
id: 100
type: learning
project: p2p
scope: project
topic_key: ""
session_id: manual-save-p2p
created_at: "2026-05-08 20:00:23"
updated_at: "2026-05-08 20:00:23"
revision_count: 1
tags:
  - p2p
  - learning
aliases:
  - "P2P Documentation: Course2.md"
---

# P2P Documentation: Course2.md

**What**: Hawkins Experiments Intro Course - creating Code-Based (CB) tasks
**Why**: Teaches how to create deterministic P2P task packages (prompt + Docker + scripts + golden patch)
**Where**: .cortex/docs/Course2.md
**Learned**: Required deliverables vary by task type. R/M tasks: rubric + unit tests. PO tasks: target functions + reproduction script. Key workflow: Source PR → Dockerfile → Prompt → Task Type → Scripts → Golden Patch → e2e.sh validation. Critical: Golden patch cannot modify test files per v7.0. Rubric must be 15-20 criteria with weights 1/3/5 only. e2e.sh cannot be modified.

---
*Session*: [[session-manual-save-p2p]]
