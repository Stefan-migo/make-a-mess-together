---
id: 92
type: learning
project: open-claw-hallucination
scope: project
topic_key: ""
session_id: manual-save-open-claw-hallucination
created_at: "2026-05-08 19:48:56"
updated_at: "2026-05-08 19:48:56"
revision_count: 1
tags:
  - open-claw-hallucination
  - learning
aliases:
  - "Course1 — Project Fundamentals & Task Lifecycle"
---

# Course1 — Project Fundamentals & Task Lifecycle

**What**: Course1.md — An introduction to the OpenClaw Hallucination project covering what is evaluated, how tasks are structured, and the full lifecycle from planning through submission.

**Key Topics**:
- **6 Evaluation Areas**: Reliability, Correct Tool Usage, Multi-system Coordination, Instruction Adherence, Hallucination Behavior, Final Output Quality.
- **Natural Task Complexity**: Tasks must be realistic, multi-step, interdependent, cross-system, have defined artifacts, friction points, and hallucination opportunities. Rule of thumb: if it can be completed in a short linear interaction, it's too simple.
- **Task Parameters**: Universe (work strictly inside assigned), Domain (fit naturally), Task Type (single-turn or multi-turn — no filler turns).
- **Source Authenticity**: Must be inspired by real public OpenClaw discussion. Requires: source platform, URL, screenshot, retrieval date (YYYY-MM-DD), connection to the source. Not allowed: LLM-generated ideas, hypotheticals, private convos, universe-based sources.
- **Agent Objective**: Persona + problem + context + high-level success state. Answers: who, what problem, why it matters, what final artifact.
- **Core Functionalities**: End-to-end capabilities — ingest data, compare evidence, apply logic, track state, generate structured artifacts.
- **Build Complexity**: Multi-stage dependencies, cross-system coordination, realistic friction, persistent state, backtracking/verification.
- **Desired Outcome**: Must be concrete, verifiable — specifies file names, rows, fields, logic, verification method. Weak outcomes (vague) cause misalignment.
- **Initial Prompt**: Must sound realistic, reflect Universe/Domain/Type, include constraints, define expected final state, leave room for reasoning and hallucination.
- **Initial Trajectory**: Must contain at least one valid hallucination. If not, revise and rerun. Inspect both trajectory and workspace files — don't rely solely on final response.
- **Silver Trajectory**: Guide the flawed trajectory to correct result — point out mistakes, redo parts, use correct tools. Preserves same original objective. Use Restore to Seed if needed, NEVER Start Fresh.
- **Rubrics**: Built against initial trajectory. Must be binary, objective, self-contained. Include negative criteria for hallucination classes. Use valid weights and categories.
- **Final Justification**: For each failed criterion, explain why rubric is correct, where model erred, why criterion is necessary.
- **Common Failures Checklist**: 13 failure modes (too simple, vague outcome, wrong universe, fake systems, missing source, no hallucination, unchecked artifacts, objective changed, claims don't match state).

**Why**: This is the introductory course that establishes the foundational understanding needed before attempting tasks.
**Where**: Documentation/Course1.md (397 lines)
**Learned**: The silver trajectory must preserve the original objective — it's a correction, not a rewrite. Always inspect workspace artifacts, not just the chat response.

---
*Session*: [[session-manual-save-open-claw-hallucination]]
