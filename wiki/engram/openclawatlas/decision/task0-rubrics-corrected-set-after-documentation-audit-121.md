---
id: 121
type: decision
project: openclawatlas
scope: project
topic_key: ""
session_id: manual-save-openclawatlas
created_at: "2026-05-16 22:03:53"
updated_at: "2026-05-16 22:03:53"
revision_count: 1
tags:
  - openclawatlas
  - decision
aliases:
  - "Task0 Rubrics — corrected set after documentation audit"
---

# Task0 Rubrics — corrected set after documentation audit

**What**: Audited 20 original Task0 rubrics against documentation guidelines (AttempterIstructions.md §§3.1-3.5 + ReviewerInstructions.md). Applied 15 fixes:
- REMOVED: #1 (redundant — file existence entailed by content checks)
- MODIFIED: #4 (fixed overfitting: "exactly one" → "one or two")
- SPLIT: #5, #6, #8, #10, #11, #13 for atomicity (was bundling independent values)
- RECATEGORIZED: #14, #15 (agent behavior → instruction following)
- WEIGHT CHANGED: #16 (-5→-3, raw values don't invalidate deliverable), #20 (-3→-5, PII exposure is safety violation)
- ADDED: 2 tool-use trace rubrics (re-read files, Strava search)
- FIXED: self-containedness on #20 (removed external reference to "Melissa Jackson's")
- ADDED: (case-insensitive) to classification check, grounding requirement to questions check
Total: 20→29 rubrics. Positive weight sum: 70. Negative sum (abs): 19. Total absolute: 89. 50% threshold: 44.5.
**Why**: Original rubric set had 65% defective rate with moderate atomicity, classification, weight, and completeness issues per ReviewerInstructions thresholds.
**Where**: Tasks/Task0/Rubrics.md

---
*Session*: [[session-manual-save-openclawatlas]]
