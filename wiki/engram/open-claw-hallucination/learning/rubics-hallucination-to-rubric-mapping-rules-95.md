---
id: 95
type: learning
project: open-claw-hallucination
scope: project
topic_key: ""
session_id: manual-save-open-claw-hallucination
created_at: "2026-05-08 19:49:18"
updated_at: "2026-05-08 19:49:18"
revision_count: 1
tags:
  - open-claw-hallucination
  - learning
aliases:
  - "Rubics — Hallucination-to-Rubric Mapping Rules"
---

# Rubics — Hallucination-to-Rubric Mapping Rules

**What**: Rubics.md — Concise reference guide explaining how hallucination annotations relate to rubric fields, when to use Hallucination Mode = Yes, and how to avoid double penalization.

**Key Rules**:
1. **Two separate systems**: Hallucination annotations use the hallucination taxonomy (4 categories + subcategories). Rubrics use a different schema (Category, Target, Status, Hallucination Mode, Hallucination Number). Never confuse hallucination categories with rubric categories.
   - Annotation example: User Input → Exploration
   - Rubric example: Agent Behavior / trace / Verification Before Action / Hallucination Mode = Yes / Hallucination Number = 2

2. **Default coverage rule**: Every valid hallucination must be covered by the rubric. Steps:
   a. Check if a positive criterion already directly measures the violated requirement.
   b. If yes, use that criterion with Hallucination Mode = Yes.
   c. If no positive criterion covers root cause, add a negative criterion.
   d. Negative criterion may target the specific issue directly.

3. **Root cause only, not cascade**: One annotation for missed file inspection (root cause), not separate annotations for every downstream error.

4. **Filling rubric fields**:
   - Category: Use rubric category (Task Completion, Instruction Following, Factuality and Hallucination, Tool Use, Agent Behavior), NOT hallucination category.
   - Target: outcome or trace.
   - Status: User Facing, State Change, or Verification Before Action.
   - Hallucination Mode: Yes only when directly covering a hallucination annotation.
   - Hallucination Number: Fill only when Hallucination Mode = Yes. Points to exact annotation number.

5. **MAIN RULE**: Each hallucination annotation must be covered by a criterion or unit test. Usually only ONE rubric should be marked hallucination mode = yes per annotation. If the rubric does not cover the root cause but is just a consequence — IT'S NOT A HALLUCINATION MODE!

**Why**: This is the most critical reference for correctly linking hallucination annotations to rubric criteria — a common source of errors.
**Where**: Documentation/Rubics.md (55 lines)
**Learned**: The most common mistake is marking downstream consequences (not root cause) as hallucination mode = yes. Always trace back to the root failure.

---
*Session*: [[session-manual-save-open-claw-hallucination]]
