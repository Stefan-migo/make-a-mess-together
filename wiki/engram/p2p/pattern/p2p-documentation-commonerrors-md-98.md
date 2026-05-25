---
id: 98
type: pattern
project: p2p
scope: project
topic_key: ""
session_id: manual-save-p2p
created_at: "2026-05-08 20:00:18"
updated_at: "2026-05-08 20:00:18"
revision_count: 1
tags:
  - p2p
  - pattern
aliases:
  - "P2P Documentation: CommonErrors.md"
---

# P2P Documentation: CommonErrors.md

**What**: Common errors and anti-patterns from P2P task reviews
**Why**: Central reference of verified reviewer feedback to avoid repeating mistakes in P2P task creation
**Where**: .cortex/docs/CommonErrors.md
**Learned**: Key patterns include: (1) Prompts must describe the problem not the solution, (2) Prompts must be self-consistent with golden patch, (3) Regex in parsing.py must handle greedy capture, parametrized brackets, and edge cases, (4) Rubrics must fit ALL correct solutions not just golden patch, (5) Golden patches must compile not just apply, (6) Tests must verify BOTH new presence AND old absence, (7) Compiled languages need build step in run_script, (8) Rename PRs touching test files are invalid per v7.0, (9) Repos without unit tests are invalid

---
*Session*: [[session-manual-save-p2p]]
