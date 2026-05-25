---
id: 94
type: learning
project: open-claw-hallucination
scope: project
topic_key: ""
session_id: manual-save-open-claw-hallucination
created_at: "2026-05-08 19:49:12"
updated_at: "2026-05-08 19:49:12"
revision_count: 1
tags:
  - open-claw-hallucination
  - learning
aliases:
  - "Course3 — Rubric Design, Weights & Hallucination Coverage"
---

# Course3 — Rubric Design, Weights & Hallucination Coverage

**What**: Course3.md — Comprehensive guide on writing rubric criteria for OpenClaw Hallucination tasks, including binary design, weights, hallucination coverage, repeated actions, stacked rubrics, unit tests vs rubrics, and the two-pass grading system.

**Core Rubric Rules**:
- **Binary**: Each criterion clearly markable as PRESENT or NOT PRESENT.
- **Self-contained**: Must include enough detail to evaluate without looking up the prompt.
- **Atomic & Objective**: One specific requirement per criterion. Avoid vague terms.
- **Positive Language**: All criteria as positive statements. Weight determines reward or penalty.

**Rubric Anatomy** (5 fields):
1. Criterion (binary statement)
2. Weight (+5/+3/+1/-1/-3/-5 only)
3. Category (Task Completion, Instruction Following, Factuality and Hallucination, Tool Use, Agent Behavior)
4. Target (Outcome = final results, Trace = process behavior)
5. Status (User Facing = visible response, State Change = environment modification)

**Weights**:
- +5 (Critically Important): Primary deliverable usability
- +3 (Important): Major quality/reliability component
- +1 (Slightly Important): Granular spot check
- -1 (Slightly Detrimental): Minor issue
- -3 (Detrimental): Significant reliability weakness
- -5 (Critically Detrimental): Invalidates result

**Hallucination Coverage**:
- Every valid hallucination annotation must be covered by the rubric (root cause only, not cascade).
- Two systems are separate: hallucination annotations (use hallucination taxonomy) and rubrics (use rubric schema: Category/Target/Status/Hallucination Mode/Hallucination Number).
- Default: use positive criterion with Hallucination Mode = Yes if it already covers the requirement violated.
- Add negative criterion only when no positive criterion captures the hallucinated root cause.
- Only ONE rubric should be marked as hallucination mode = yes per annotation (rare exceptions).

**Repeated Actions**: Use aggregate verification (e.g., "all 16 emails sent") + max 5 spot checks. No individual criteria per instance.

**Stacked Rubrics**: OR logic — only when multiple outcomes are genuinely equivalent. Not for hiding missing coverage.

**Unit Tests vs. Rubrics**:
- Unit tests: Use for deterministic, mechanical checks (file exists, CSV headers match, exact count).
- Rubrics: Use for judgment-heavy checks (summary quality, evidence grounding, hallucination detection).
- Overfitting trap: Test must be groundable in prompt/input data. If the model had to choose (vs. being told), it's overfitting.
- Decision rule: "Is there exactly one correct answer, fixed by the prompt and input data?"

**Two Rubric Passes**:
1. Initial trajectory rubrics — grade the hallucination-inducing first run.
2. Non-hallucinated version rubrics — grade corrected version with rewritten (clearer) prompt preserving same core goal.

**Common Errors**: Incorrect criteria, missing criteria, redundant criteria, overfitting, underfitting, subjective wording.

**Final Checklist**: 10 items covering rubric construction, hallucination coverage, silver trajectory satisfaction.

**Why**: This is the most detailed rubric design reference — critical for anyone writing evaluation criteria.
**Where**: Documentation/Course3.md (503 lines)
**Learned**: The overfitting trap is subtle — unit tests must have zero degrees of freedom. A filename assertion is only valid if the prompt explicitly required that exact filename. Two grading passes exist (initial + corrected), each with its own rubric set.

---
*Session*: [[session-manual-save-open-claw-hallucination]]
