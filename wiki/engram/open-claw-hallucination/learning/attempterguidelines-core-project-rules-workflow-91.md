---
id: 91
type: learning
project: open-claw-hallucination
scope: project
topic_key: ""
session_id: manual-save-open-claw-hallucination
created_at: "2026-05-08 19:48:48"
updated_at: "2026-05-08 19:48:48"
revision_count: 1
tags:
  - open-claw-hallucination
  - learning
aliases:
  - "AttempterGuidelines — Core Project Rules & Workflow"
---

# AttempterGuidelines — Core Project Rules & Workflow

**What**: OpenClaw Hallucination AttempterGuidelines.md — the master project rules, task workflow, and definitions for building hallucination-evaluation tasks.

**Key Sections**:
- **Project Overview**: Evaluates LLM reliability, correct tool usage, multi-system coordination, instruction adherence, hallucination behavior, final output quality.
- **6 Core Rules**: (1) Agent-building capability > prompt quality, (2) Understand task workflow with Attempter + Reviewer submissions, (3) Naturality driving complexity — realistic day-to-day scenarios not linear tool calls, (4) Multi-stage coordination with interdependent stages, (5) The Hallucination Rule — DO NOT continue if model produced no hallucination, (6) 100% Alignment Rule — output must fully match intended outcome.
- **8-Step Task Workflow**: (1) Planning → (2) Run Prompt → (3) OpenClaw Environment → (4) Hallucinations → (5) Silver Trajectory → (6) Rubric Building → (7) Final Justification → (8) Task Setup: Good vs Bad Examples.
- **Task Parameters**: Category (Single-turn/Multi-turn), Domain (Guidance/Relationships/Openness/Wellness), Universe (FinTrack/Stride/Property/Hotel/Bella Note/Canvas/Meriton/Long Horizon), Persona.
- **Domain Restrictions**: Work strictly within assigned universe — no mocked environments, fake personas, or simulated apps.
- **Source Authenticity**: Task ideas MUST come from real public online discussions about OpenClaw. NOT from LLMs, hypotheticals, private convos, or the assigned universe itself.
- **Agent Environment Definition**: Agent Objective (persona + problem + context + artifact), Core Functionalities (what capabilities), Build Complexity (architectural depth), Source of inspiration (URL + screenshot + retrieval date), Zip File Upload, Desired Outcome (concrete verifiable end state).
- **Universe Reconnaissance**: Auto-evaluator runs against configured Universe, generates score 1-5.
- **Hallucination Categories**: 4 main categories, 11 sub-types: (1) External Facts, (2) Environment States & Actions (False Action, Destructive Action, No Verification Before Action), (3) User/Environment Inputs (Multimodal, Files, Multiturn, Misleading Prompts, Exploration, Instruction Following), (4) Other.
- **Root Cause Rule**: Hallucination annotations point to root cause only, not every cascade outcome.
- **Rubric Building**: Focused on Architectural Behavior, Tool Use, Reasoning, Final Artifact Quality. 80% outcome, 20% trace. Binary design, atomicity, self-containment, positive language.
- **Rubric Weights**: +5 (critically important), +3 (important), +1 (slightly important).

**Why**: This is the foundational governance document for the entire OpenClaw Hallucination project.
**Where**: Documentation/AttempterGuidelines.md (598+ lines)
**Learned**: The hallucination rule is non-negotiable — if the model produces no hallucination, the task must be revised. Source authenticity requires a real public link. Rubrics must be binary (pass/fail), atomic, self-contained, use positive language.

---
*Session*: [[session-manual-save-open-claw-hallucination]]
