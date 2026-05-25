---
id: 165
type: config
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-18 20:47:55"
updated_at: "2026-05-18 20:47:55"
revision_count: 1
tags:
  - cortexplugin
  - config
aliases:
  - "Subagent mode fix — no longer appear as primary agents"
---

# Subagent mode fix — no longer appear as primary agents

**What**: Added `mode: subagent` to the frontmatter of all 7 subagent files in `.opencode/agents/`. Without it they defaulted to `mode: all`, making them Tab-switchable as primary agents alongside MeterPlanner and MeterDeveloper.

**Why**: Per OpenCode docs (opencode.ai/docs/es/agents/), only `mode: primary` agents should be Tab-switchable. Subagents with no `mode` field default to `all`, which includes primary behavior — that's why 7 extra agents appeared in the Tab cycle.

**Where**: `.opencode/agents/guideline-expert.md`, `skill-consultant.md`, `persona-specialist.md`, `prompt-architect.md`, `desired-outcome-designer.md`, `trajectory-engineer.md`, `quality-auditor.md` — frontmatter only, one line added each.

**Learned**: OpenCode agents in `.opencode/agents/` can be either primary or subagent — the `mode` field in frontmatter is what distinguishes them, NOT the directory location. A `.opencode/subagents/` directory wouldn't work because OpenCode only scans `.opencode/agents/` and `~/.config/opencode/agents/`.

---
*Session*: [[session-manual-save-cortexplugin]]
