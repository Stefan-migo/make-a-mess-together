---
id: 125
type: pattern
project: openclawatlas
scope: project
topic_key: ""
session_id: manual-save-openclawatlas
created_at: "2026-05-17 00:33:54"
updated_at: "2026-05-17 00:33:54"
revision_count: 1
tags:
  - openclawatlas
  - pattern
aliases:
  - "Rubric Evaluator: fail-rate formula and behavior"
---

# Rubric Evaluator: fail-rate formula and behavior

**What**: The Rubric Evaluator uses fail-rate = (Defective + Missing) / Total, with threshold ≥0.05 = FAIL. It checks 7 dimensions: Atomicity, Self-Containedness, Completeness, Rounding, Weight Annotation, Classification, Redundancy.

**Why**: Understanding evaluator behavior is critical to passing it efficiently.

**Where**: Applied to Tasks/Task0/Rubrics.md across 7 iterations.

**Learned**: 
- Evaluator aggressively flags conjunction splits (any "and" bundling) and generalized quantifiers ("each flagged period" over enumerable sets).
- Evaluator sometimes reads stale data — verify file state before each analysis.
- For "Completeness" (missing items), the evaluator suggests additions from Core Functionalities that the model was never asked to implement — these must be pushed back.
- For "Redundancy", the evaluator correctly identifies logical entailment (item A is always true if item B is true).
- Clean sequential IDs help but don't affect the evaluator's scoring — it checks content, not IDs.

---
*Session*: [[session-manual-save-openclawatlas]]
