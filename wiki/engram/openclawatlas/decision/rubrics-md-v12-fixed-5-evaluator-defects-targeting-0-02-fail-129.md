---
id: 129
type: decision
project: openclawatlas
scope: project
topic_key: ""
session_id: manual-save-openclawatlas
created_at: "2026-05-17 02:32:11"
updated_at: "2026-05-17 02:32:11"
revision_count: 1
tags:
  - openclawatlas
  - decision
aliases:
  - "Rubrics.md v12: Fixed 5 evaluator defects, targeting 0.02 fail-rate"
---

# Rubrics.md v12: Fixed 5 evaluator defects, targeting 0.02 fail-rate

**What**: Applied 4 fixes to Rubrics.md based on evaluator findings: (1) rephrased 3 items for self-containedness, (2) removed 2 low-value MEMORY justification items, (3) re-added MEMORY raw-data penalty (-3), (4) added missing-signals flagging check (+3). Net item count stays at 50.

**Why**: The evaluator flagged 4 defective (self-containedness on "after the edits" phrasing) and 2 missing criteria (MEMORY raw data penalty and missing-signals flagging). 

**Where**: Tasks/Task0/Rubrics.md

**Fixes Applied**:
- Items 033, 034: "after applying the edits" → "after modifying the file content"
- Item 049: "after the edits" → "after modifications were made"
- Removed Items 027-028 (MEMORY Jan/Feb justifications, +1 each)
- Added Item 032: MEMORY raw daily values penalty (-3)
- Added Item 046: Agent flags missing signal days (+3)

**Expected**: D=1 (Item 048 atomicity, accepted as unfixable within 50-cap), M=0. Fail-rate = 1/50 = 0.02 → PASS

---
*Session*: [[session-manual-save-openclawatlas]]
