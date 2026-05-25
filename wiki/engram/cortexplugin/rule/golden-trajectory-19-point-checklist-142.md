---
id: 142
type: rule
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-17 20:58:59"
updated_at: "2026-05-17 20:58:59"
revision_count: 1
tags:
  - cortexplugin
  - rule
aliases:
  - "Golden Trajectory — 19-Point Checklist"
---

# Golden Trajectory — 19-Point Checklist

**What**: The 19-point checklist for trajectory verification before submission.

1. Turn-1 message: prompt + `<hint>...</hint>` as single message (no follow-up hints)
2. No hint leakage in model responses OR thinking text
3. No duplicate tool calls remain
4. No failed calls, retries, or error-recovery text remain (except clean file creation sequences)
5. All remaining tool calls are necessary
6. No missing steps between retrieving and using information
7. Model doesn't use information it never retrieved
8. Every remaining step contributes to the final answer
9. No references to deleted context or jumps in reasoning
10. Trajectory reads as if model solved it perfectly on first try
11. ≥2 sub-agents spawned, each output meaningfully used
12. Sub-agent creation calls are self-contained
13. Final response covers ALL explicitly requested info + matches Desired Outcome
14. Three-Stage Workflow visible: gather → analyze → output
15. Multi-System Coordination across ≥2 systems/tools/data sources
16. Real Universe Explorer data — no hallucinated names/IDs/numbers
17. Appropriate safety/response level
18. No workspace files renamed/edited/reformatted/removed before zipping
19. Package contains workspace folder + JSON trajectory zipped together

---
*Session*: [[session-manual-save-cortexplugin]]
