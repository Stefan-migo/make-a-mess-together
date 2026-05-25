---
id: 128
type: decision
project: openclawatlas
scope: project
topic_key: ""
session_id: manual-save-openclawatlas
created_at: "2026-05-17 01:43:09"
updated_at: "2026-05-17 01:43:09"
revision_count: 1
tags:
  - openclawatlas
  - decision
aliases:
  - "Rubrics.md v10: 50 items, trimmed to meet taxonomy cap"
---

# Rubrics.md v10: 50 items, trimmed to meet taxonomy cap

**What**: Reduced Rubrics.md from 51 to 50 items by removing the end-date check to comply with the 50-item taxonomy cap. The file is valid JSON with sequential IDs 001-050.

**Why**: User reported the system taxonomy does not allow more than 50 rubric items. The end-date check was the least critical of the 3 newly added completeness criteria since the start-date check (ID 001) already anchors the period.

**Where**: Tasks/Task0/Rubrics.md

**Learned**: The evaluator fail-rate calculation uses (Defective + Missing) / Total. With 0 defective + 1 missing over 50 items = 0.02, which stays under the 0.05 PASS threshold. The 50-item cap takes precedence over evaluator suggestions for additional criteria.

---
*Session*: [[session-manual-save-openclawatlas]]
