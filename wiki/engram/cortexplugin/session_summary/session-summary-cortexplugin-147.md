---
id: 147
type: session_summary
project: cortexplugin
scope: project
topic_key: ""
session_id: Onboarding
created_at: "2026-05-17 20:59:29"
updated_at: "2026-05-17 20:59:29"
revision_count: 1
tags:
  - cortexplugin
  - session_summary
aliases:
  - "Session summary: cortexplugin"
---

# Session summary: cortexplugin

## Goal
Complete onboarding for the Mariachi Union project — read all core documentation (AttempterGuidelines.md, CommonErrors.md, Course1.md), understand the four-agent architecture, and persist all critical knowledge to Engram memory.

## Instructions
- User wants me to become an expert on this project as @MU-Planner (Frontal Lobe)
- I have READ-only + webfetch + task permissions (no EDIT/BASH)
- I spawn @MU-Attempter and @MU-QC-Reviewer via task() for trajectory execution and QC
- Knowledge capture is mandatory: save every pattern, error, technique, rule, and discovery to Engram

## Discoveries
- The project uses a 4-agent architecture: Planner (read-only), Architect (full access), Attempter (execution subagent), QC-Reviewer (QA subagent)
- Every trajectory MUST have ≥2 sub-agents with meaningful output usage — this is the most fundamental requirement
- The 10 Common Errors doc reveals that the #1 failure is hallucinated trajectories (data referenced before retrieval, placeholder data, orphaned refs after cleanup)
- Hint leakage in thinking/reasoning text is the #3 error and QC explicitly checks it — Ctrl+F for "hint" in JSON before submitting
- The 19-point checklist from Course1.md is the definitive verification gate
- Subtle hints preferred → Specific hints only as fallback after 3-4 fresh re-runs
- The SCORING MODEL: final score = LOWEST score across all 9 QC dimensions. A single 2 = task score 2.

## Accomplished
- ✅ Started Engram session "Onboarding" for the project
- ✅ Read AttempterGuidelines.md (631 lines) — complete workflow: understand task → run model → collect traces → clean → verify → upload
- ✅ Read CommonErrors.md (245 lines) — all 10 common errors with prevention strategies
- ✅ Read Course1.md (437 lines) — full training: overview, task dimensions, hints, multi-agent, safety, checklist
- ✅ Read all 4 agent definition files (mu-planner.md, mu-architect.md, mu-attempter.md, mu-qc-reviewer.md)
- ✅ Saved 8 structured observations to Engram covering: architecture overview, 5 rules, 10 common errors, 19-point checklist, hint design strategy, trajectory cleaning rules, multi-agent requirements, safety calibration
- ✅ Resolved 7 memory conflicts via mem_judge

## Next Steps
- Future sessions should load the trained knowledge from Engram before starting tasks
- Ready to receive actual trajectory tasks and execute the full Spec-Kit → spawn Attempter → spawn QC-Reviewer workflow

## Relevant Files
- raw/AttempterGuidelines.md — Primary workflow guide (5-step process)
- raw/CommonErrors.md — Top 10 QC errors with examples and prevention
- raw/Course1.md — Full training material with 19-point checklist
- .opencode/agents/mu-planner.md — My role definition (Frontal Lobe)
- .opencode/agents/mu-architect.md — System Designer role
- .opencode/subagent-definitions/mu-attempter.md — Execution subagent role
- .opencode/subagent-definitions/mu-qc-reviewer.md — QA subagent role
- .specify/ — Spec-Kit planning templates
- schema/ — Trajectory schemas

---
*Session*: [[session-Onboarding]]
