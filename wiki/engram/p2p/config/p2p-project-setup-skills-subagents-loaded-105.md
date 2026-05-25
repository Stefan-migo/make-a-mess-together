---
id: 105
type: config
project: p2p
scope: project
topic_key: ""
session_id: manual-save-p2p
created_at: "2026-05-08 20:01:00"
updated_at: "2026-05-08 20:01:00"
revision_count: 1
tags:
  - p2p
  - config
aliases:
  - "P2P project setup: skills + subagents loaded"
---

# P2P project setup: skills + subagents loaded

**What**: Copied 6 P2P task-creation skills and 3 subagents into the p2p project
**Why**: To equip the Cortex system with specialized skills for creating P2P evaluation tasks
**Where**: .opencode/skills/ (docker-configurator, human-writer, prompt-engineer, rubric-creator, script-generator, task-analyzer); .opencode/agents/ (attempter, auditor, reviewer)
**Learned**: Skills are for specific P2P task creation phases. Subagents handle complete workflows: attempter creates deliverables, auditor validates end-to-end, reviewer does quality review. All follow British English, helpful mentor tone.

---
*Session*: [[session-manual-save-p2p]]
