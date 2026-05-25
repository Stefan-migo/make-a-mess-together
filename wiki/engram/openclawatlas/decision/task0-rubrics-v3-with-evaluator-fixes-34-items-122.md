---
id: 122
type: decision
project: openclawatlas
scope: project
topic_key: ""
session_id: manual-save-openclawatlas
created_at: "2026-05-16 22:31:10"
updated_at: "2026-05-16 22:31:10"
revision_count: 1
tags:
  - openclawatlas
  - decision
aliases:
  - "Task0 Rubrics — v3 with evaluator fixes (34 items)"
---

# Task0 Rubrics — v3 with evaluator fixes (34 items)

**What**: Applied 5 fixes based on Rubric Evaluator v2 feedback:
1. Split Item 19 into two: "data sources consulted" + "threshold rules used" (each +1)
2. Split Item 20 into two: "justifications for flagged periods" + "reasoning behind classifications" (each +1)
3. Split Item 22 into two: "wellness-summary.md re-read" + "MEMORY.md re-read" (each +1)
4. Split Item 28 into two: "read wellness-summary.md" + "read MEMORY.md" (each +1)
5. Added Item 34: "invented medical claims or diagnoses" (-5, factuality & hallucination)

3 evaluator weight findings were false positives — file already had correct weights (Item 13: +1, Item 18: +3, Item 19: +3).
Total: 34 rubrics. Positive weight sum: 70. Negative sum (abs): 19. Total absolute: 89. 50% threshold: 44.5.
**Why**: Address remaining atomicity issues (3% fail-rate) and add missing safety boundary for medical claim hallucination.
**Where**: Tasks/Task0/Rubrics.md

---
*Session*: [[session-manual-save-openclawatlas]]
