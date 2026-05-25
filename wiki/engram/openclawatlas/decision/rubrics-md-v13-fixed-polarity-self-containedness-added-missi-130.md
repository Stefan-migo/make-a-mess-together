---
id: 130
type: decision
project: openclawatlas
scope: project
topic_key: ""
session_id: manual-save-openclawatlas
created_at: "2026-05-17 02:53:49"
updated_at: "2026-05-17 02:53:49"
revision_count: 1
tags:
  - openclawatlas
  - decision
aliases:
  - "Rubrics.md v13 — Fixed polarity, self-containedness, added missing criteria"
---

# Rubrics.md v13 — Fixed polarity, self-containedness, added missing criteria

**What**: Applied final round of fixes to Task0/Rubrics.md based on latest evaluator (D=4, M=3, fail-rate=0.14). Removed Items 021-023 (MEMORY Garmin/Calendar/Strava sources, +1 each) — substantially covered by Methodology Notes 015-016, 020. Fixed Item 029 (was 032) polarity: "does not contain" → "contains raw daily values" with -3 weight. Fixed Item 033 (was 036) self-containedness: replaced "Garmin records, OhioHealth visit summary, or calendar entries" with "beyond describing the observation that vitals and labs were normal". Fixed Item 044 (was 047) self-containedness: replaced "Melissa Jackson universe" with "any file read or tool output accessed during the agent's execution". Added Items 048 (MEMORY justification for flagged periods, +3), 049 (MEMORY classification reasoning, +3), 050 (Escalated consecutive-day flag, +3).

**Why**: Latest evaluator flagged 4 defective (Item 048 atomicity — accepted D=1, Items 036+047 self-containedness — referenced external data sources, Item 032 polarity — positive wording with negative weight) and 3 missing (MEMORY justifications, MEMORY reasoning, consecutive-day escalation — all previously removed to fit 50-cap).

**Where**: Tasks/Task0/Rubrics.md — 50 items, sequential IDs 001-050

**Learned**: Self-containedness violations occur when criteria reference specific external data sources or universe names that the evaluator cannot inspect. The fix is to describe the hallucination generically (e.g., "not present in any file read or tool output"). For polarity coherence, negative-weight criteria must describe the undesired behavior directly (e.g., "contains" instead of "does not contain"). Missing criteria flagged by evaluator are the items I removed earlier — adding them back by swapping lowest-value items is the correct strategy.

---
*Session*: [[session-manual-save-openclawatlas]]
