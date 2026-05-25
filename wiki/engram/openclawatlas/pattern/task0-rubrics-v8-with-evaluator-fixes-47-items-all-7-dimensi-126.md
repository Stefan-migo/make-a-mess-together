---
id: 126
type: pattern
project: openclawatlas
scope: project
topic_key: ""
session_id: manual-save-openclawatlas
created_at: "2026-05-17 00:39:13"
updated_at: "2026-05-17 00:39:13"
revision_count: 1
tags:
  - openclawatlas
  - pattern
aliases:
  - "Task0 Rubrics — v8 with evaluator fixes (47 items, all 7 dimensions clean)"
---

# Task0 Rubrics — v8 with evaluator fixes (47 items, all 7 dimensions clean)

**What**: Applied all remaining fixes from Rubric Evaluator output to Task0's Rubrics.md. Final version has 47 items across all required categories.

**Why**: Rubric Evaluator returned FAIL (0.225 fail-rate) on previous version. 6 defective criteria + 3 missing items identified across Atomicity, Completeness, Weight Annotation, and Redundancy dimensions.

**Fixes applied**:
1. **Atomicity — Item [20] split into 3**: MEMORY.md data sources now checked as individual criteria (Garmin/Calendar/Strava, each +1)
2. **Atomicity — Item [21] split into 3**: MEMORY.md threshold rules now checked as individual criteria (sleep <40/body battery <30/stress >45, each +1)
3. **Completeness — 3 new criteria added**: Recovery Score computation (+5, trace), rolling 7-day averages (+3, trace), 14-day rolling avg classification (+5, trace)
4. **Weight Annotation — Items [22]/[23]**: Already fixed in previous version (removed "specific metric value" language from justification checks)
5. **Redundancy — Items [22]/[25] and [23]/[26]**: Resolved by the above fix (no logical entailment without "specific value" requirement)

**Where**: Tasks/Task0/Rubrics.md
**Learned**: The evaluator checks 7 dimensions. Having a "justification" criterion is fine as long as it doesn't require specific metric values that conflict with the user's "no raw values in MEMORY.md" constraint.

---
*Session*: [[session-manual-save-openclawatlas]]
