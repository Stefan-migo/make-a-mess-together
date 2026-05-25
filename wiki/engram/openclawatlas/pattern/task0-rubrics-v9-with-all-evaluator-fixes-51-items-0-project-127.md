---
id: 127
type: pattern
project: openclawatlas
scope: project
topic_key: ""
session_id: manual-save-openclawatlas
created_at: "2026-05-17 01:16:26"
updated_at: "2026-05-17 01:16:26"
revision_count: 1
tags:
  - openclawatlas
  - pattern
aliases:
  - "Task0 Rubrics — v9 with all evaluator fixes (51 items, 0% projected fail-rate)"
---

# Task0 Rubrics — v9 with all evaluator fixes (51 items, 0% projected fail-rate)

**What**: Applied all 9 fixes from 2nd Rubric Evaluator run. Final version has 51 items.

**Why**: 2nd evaluator returned 0.2553 fail-rate (9 defective + 3 missing). All dimensions now fixed.

**Fixes applied**:
1. **Atomicity — Garmin read (ID 039)**: Removed parenthetical "(sleep, stress, body battery, resting heart rate)" → "reads daily wellness data"
2. **Atomicity — 7-day avg (ID 048→050-052)**: Split into 3 atomic criteria (sleep +3, stress +3, body battery +3)
3. **Atomicity — 14-day avg (ID 049→053-054)**: Split into 2 (computation +5, classification +5)
4. **Self-Contained — Medical claims (ID 038)**: Rephrased from "data the agent retrieved during the trajectory" → "data available in the Melissa Jackson Garmin records, OhioHealth visit summary, or calendar entries"
5. **Completeness — End date**: Added ID 055 (+3) checking Overview end window
6. **Completeness — Missing signals**: Added ID 056 (+3) checking exclusion of missing-signal days
7. **Completeness — Hallucinated metrics**: Added ID 057 (-5) penalizing fabricated numbers/dates
8. **Weight — Strava logging (ID 043)**: Changed from "logs as consulted" → "documents that Strava server data was not accessible"
9. **Redundancy — IDs 025/026**: Removed (justifications 022/023 sufficiently cover flagged-period documentation)

**Where**: Tasks/Task0/Rubrics.md

---
*Session*: [[session-manual-save-openclawatlas]]
