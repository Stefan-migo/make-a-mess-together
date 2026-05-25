---
id: 124
type: learning
project: openclawatlas
scope: project
topic_key: ""
session_id: manual-save-openclawatlas
created_at: "2026-05-17 00:33:52"
updated_at: "2026-05-17 00:33:52"
revision_count: 1
tags:
  - openclawatlas
  - learning
aliases:
  - "Task0 Rubric Evolution: v1→v7 (20→40 items)"
---

# Task0 Rubric Evolution: v1→v7 (20→40 items)

**What**: Iterated Task0's Rubrics.md from 20 items (0.65 fail-rate) through 6 major versions to 40 items (projected 0% fail-rate). Key fixes: atomicity splits, self-containedness rephrasing, removed redundancy, fixed polarity inversion on MEMORY.md raw-value items.

**Why**: Rubric Evaluator requires fail-rate <0.05. Each run exposed new defects that needed correction. The evaluator applies strict conjunction-split and contextual-universal rules.

**Where**: Tasks/Task0/Rubrics.md — v7 final version with sequential IDs 0001-0040

**Learned**: 
- Recovery Score formula and rolling averages are Core Functionalities (builder spec) — NOT in prompt/DO. Push back all evaluator missing-item claims about them.
- Items rewarding "specific metric values in MEMORY.md" are polarity-inverted — Core Functionalities line 284 forbids raw daily values in MEMORY.
- Item entailed by another (e.g., "mentions visit" by "contrasts visit snapshot") must be removed — it's redundant.
- Push back atomicity claims when items check a required complete set (all 3 data sources, all 3 thresholds) — that's one completeness check, not a bundle.

---
*Session*: [[session-manual-save-openclawatlas]]
