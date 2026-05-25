---
id: 139
type: learning
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-17 20:58:51"
updated_at: "2026-05-17 20:58:51"
revision_count: 1
tags:
  - cortexplugin
  - learning
aliases:
  - "MariachiUnion — Project Overview & Architecture"
---

# MariachiUnion — Project Overview & Architecture

**What**: Mariachi Union is a multi-agent OpenClaw project for creating and refining Golden Trajectories — clean, efficient records of AI agents solving complex tasks.

**Architecture**: Four-agent system
- @MU-Planner (Frontal Lobe): Read-only, strategic planning, hint design, universe research, memory management. Spawns @MU-Attempter and @MU-QC-Reviewer.
- @MU-Architect (System Designer): Full access, multi-agent task decomposition, blueprint design, universe config. Spawns @MU-Attempter.
- @MU-Attempter (Subagent - Execution): Full access, runs trajectory, collects traces, cleans, refines. Spawned via task().
- @MU-QC-Reviewer (Subagent - QA): Read-only + bash, audits trajectories against 10 Common Errors and 19-point checklist.

**Key Tools**: Engram (SQLite memory), Graphify (knowledge graph), Spec-Kit (planning), trajectory-analyzer, hint-validator, checklist-runner.

**Session Flow**: Start → Context → Analyze → Delegate → Review → Escalate → End

---
*Session*: [[session-manual-save-cortexplugin]]
