---
id: 141
type: error
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-17 20:58:57"
updated_at: "2026-05-17 20:58:57"
revision_count: 1
tags:
  - cortexplugin
  - error
aliases:
  - "10 Common Errors That Fail QC (Memorize)"
---

# 10 Common Errors That Fail QC (Memorize)

**What**: The 10 common errors that cause QC rejection. Memorize all.

🔴 Error #1 — Hallucinated Trajectories (most common failure): Model references data before retrieving it, uses placeholder data instead of real tool outputs, orphaned references after cleanup. Score 2 (fail).

🔴 Error #2 — Explicit Instruction Misses: Final response omits something prompt explicitly asked for, or violates architectural constraints. Score 2 (fail).

🔴 Error #3 — Hint Leakage in Thinking/Reasoning: Model's internal thinking references "from hint", "per hint", "the hint says". QC checks thinking text too. Score 2 (fail).

🔴 Error #4 — No Sub-Agents Spawned: Zero sub-agents in trajectory. Score 2 (fail).

🔴 Error #5 — Placeholder Data: Fabricated names/numbers/IDs instead of real tool call outputs. Score 2 (fail).

🟡 Error #6 — Coordinator Duplicating Sub-Agent Work: Coordinator does same work it delegated. Score 3 (non-fail flag).

🔴 Error #7 — Hints Deleted During Cleanup: Removing `<hint>` messages. Score 2 (fail).

🔴 Error #8 — Incorrect Safety Reset Protocol: On destructive actions, must reset and re-send with safety hint, not fix mid-conversation.

🔴 Error #9 — Subagent Not Self-Contained: Sub-agent task missing IDs, dates, rules. Score 2 (fail).

🔴 Error #10 — Subagent Output Not Used in Final Response: Spawn sub-agent but ignore its results. Score 2 (fail).

**Remember**: Final score = lowest score across all 9 QC dimensions. A single 2 = task score 2.

---
*Session*: [[session-manual-save-cortexplugin]]
