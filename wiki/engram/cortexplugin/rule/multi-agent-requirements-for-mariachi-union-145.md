---
id: 145
type: rule
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-17 20:59:06"
updated_at: "2026-05-17 20:59:06"
revision_count: 1
tags:
  - cortexplugin
  - rule
aliases:
  - "Multi-Agent Requirements for Mariachi Union"
---

# Multi-Agent Requirements for Mariachi Union

**What**: Every trajectory must genuinely require multiple sub-agents. Single-agent trajectories are rejected.

**Minimum Requirements**:
- ≥2 sub-agents spawned
- Each sub-agent's output meaningfully used in final response (Error #10)
- Sub-agent creation calls must be self-contained (Error #9)
- Coordinator must NOT duplicate work delegated to sub-agents (Error #6)

**Multi-Agent Patterns**:
- Parallel Search: Multiple sub-agents search different data sources simultaneously
- Parallel Analysis: Sub-agents analyze different aspects of the same data
- Parallel Generation: Sub-agents produce different outputs that get combined
- Specialist Delegation: Different expertise areas (returns vs refunds vs support)
- Productivity Flow: Sequential steps in a workflow pipeline

**Subagent Self-Containment**:
- Include all critical info (IDs, dates, names, amounts) inline in the spawn call
- OR ensure it's findable in workspace files the sub-agent can read
- Never leave vague references ("as discussed," "the plan from earlier," "handle those tickets")
- Never leave unfilled placeholders (`[insert ID]`, `[X]`)

**Subagent Trajectories**:
- Sub-agent trajectories appear after main agent trajectory
- Labeled as "User" messages but NOT actual user messages
- Same cleanup rules apply: hint leakage, duplicates, hallucinations
- Thinking/reasoning text checked for hint references

---
*Session*: [[session-manual-save-cortexplugin]]
