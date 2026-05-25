---
id: 89
type: learning
project: open-claw-hallucination
scope: project
topic_key: ""
session_id: manual-save-open-claw-hallucination
created_at: "2026-05-08 19:44:57"
updated_at: "2026-05-08 19:44:57"
revision_count: 1
tags:
  - open-claw-hallucination
  - learning
aliases:
  - "Project Guidelines Expertise Session"
---

# Project Guidelines Expertise Session

**What**: Completed a comprehensive study of the OpenClaw Hallucination project documentation (AttempterGuidelines.md, Course1.md, Course2.md, Course3.md, Rubics.md) and answered 15+ knowledge check questions.

**Why**: The user requested a deep-dive into the guidelines to validate understanding across rubric design, hallucination annotation, test validity, silver trajectory rules, and project fundamentals.

**Where**: Documentation/ directory — AttempterGuidelines.md, Course1.md, Course2.md, Course3.md, Rubics.md

**Learned**:
- Rubrics are built against the initial trajectory, not the silver trajectory.
- Every valid hallucination annotation must be covered by the rubric (root cause only, not cascade).
- Hallucination annotation categories and rubric categories are separate systems — never confuse them.
- All rubric criteria must use positive wording; weight determines if positive or negative.
- Atomicity: each criterion evaluates one specific thing.
- Self-containment: a criterion must be evaluable without looking up external context.
- Repeated actions use aggregate + spot-check approach, not individual criteria per instance.
- +5 = determines primary deliverable usability; +3 = major component; +1 = granular spot check.
- Negative criteria: PRESENT = bad behavior happened; NOT PRESENT = did not happen.
- Stacked rubrics only for genuinely equivalent alternative outcomes.
- Unit tests must be grounded in the prompt — hardcoded filenames or non-existent modules are invalid.
- Silver trajectory preserves same core goal with clearer guidance, never changes the objective.
- Failed criterion justification must include: why rubric is correct, where model erred, why criterion is necessary.

---
*Session*: [[session-manual-save-open-claw-hallucination]]
