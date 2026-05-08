---
id: 67
type: manual
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 13:19:26"
updated_at: "2026-05-08 13:19:26"
revision_count: 1
tags:
  - cortexplugin
  - manual
aliases:
  - "Documentation: CommonErrors.md - Top 10 QC errors with prevention"
---

# Documentation: CommonErrors.md - Top 10 QC errors with prevention

**What**: Complete Mariachi Union Common Errors document ingested. All 10 errors with real QC examples and prevention strategies:

Error #1 - Hallucinated Trajectories (HIGH: auto-fail). Pre-retrieval claims, orphaned references after cleanup, placeholder/mock data. Prevention: trace every data point to tool call, check for pre-retrieval claims, verify SKILL.md read before use.

Error #2 - Explicit Instruction Misses (HIGH: auto-fail). Missing required fields, violating coordinator/subagent architecture, wrong trajectory uploaded. Prevention: re-read prompt line by line, verify all requested fields present.

Error #3 - Hint Leakage in Thinking/Reasoning (HIGH: auto-fail). Thinking text references hints. Prevention: Ctrl+F JSON for "hint", "suggest", "mention", "recommend" - check thinking text explicitly.

Error #4 - No Sub-Agents Spawned (HIGH: auto-fail). Zero sub-agents. Prevention: every task MUST have ≥2 sub-agents.

Error #5 - Placeholder Data Instead of Real Tool Outputs (HIGH: auto-fail). Fabricated names/IDs/amounts. Prevention: every data point traceable to tool call, verify against Universe Explorer.

Error #6 - Coordinator Duplicating Sub-Agent Work (MEDIUM: score 3). Coordinator does same work as delegated. Prevention: wait for sub-agent results, check execution order.

Error #7 - Hints Deleted During Cleanup (HIGH: auto-fail). Contributors remove <hint> messages. Prevention: NEVER delete hints, clean only model's reaction to hints.

Error #8 - Incorrect Safety Reset Protocol (HIGH: auto-fail). Trying to fix mid-conversation instead of resetting. Prevention: Reset All → Start Fresh with inline hint.

Error #9 - Subagent Task Not Self-Contained (HIGH: auto-fail). Missing info in subagent creation call. Prevention: read subagent task in isolation, concrete IDs/dates/rules inline, no vague references.

Error #10 - Subagent Output Not Used in Final Response (HIGH: auto-fail). Spawned but ignored. Prevention: final response must quote/paraphrase/reference each subagent output.

Pre-Submission Checklist (13 checks for catching all errors).

**Why**: Reference for QC review and error prevention. Critical for avoiding task rejection.

**Where**: ../Documentation/CommonErrors.md, wiki/errors/index.md, wiki/checklists/index.md

**Learned**: QC score is lowest across all 9 dimensions (one 2 = whole task fails). Error #1 (Hallucinations) is most common failure. Errors #3 (Hint Leakage in Thinking) and #7 (Hints Deleted) are most commonly missed in training quizzes.

---
*Session*: [[session-manual-save-cortexplugin]]
