---
id: 135
type: discovery
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-17 20:43:10"
updated_at: "2026-05-17 20:43:10"
revision_count: 1
tags:
  - cortexplugin
  - discovery
aliases:
  - "CortexPlugin full setup audit findings"
---

# CortexPlugin full setup audit findings

**What**: Performed complete setup audit of CortexPlugin project. Key findings:
- Engram: FULLY FUNCTIONAL (133 observations, 26 sessions, all 4 diagnostic checks pass)
- Spec-Kit: NOT INSTALLED (config/templates exist at .specify/ but `speckit` binary is missing — needs `gh extension install github/spec-kit`)
- Graphify: FUNCTIONAL (24 nodes, 73 edges, MCP wrapper patched)
- Custom Tools: ALL 6 PRESENT (trajectory-analyzer, hint-validator, checklist-runner, execute_script, wiki-link, wiki-search)
- Dual opencode.json CONFLICT: MCP servers in root opencode.json but OpenCode primary reads .opencode/opencode.json which lacks MCP config
- Instructions path broken in .opencode/opencode.json: 'CortexPlugin/AGENTS.md' should be '../AGENTS.md'
- Wiki: 5 broken cross-references (sessions/index, graph/index, etc.)
- Agent/subagent defs: ALL 4 COMPLETE
- Skills: ALL 7 PRESENT

**Why**: User requested verification that entire CortexPlugin is fully set up and adapted to the project, especially Engram and Spec-Kit.

**Where**: opencode.json, .opencode/opencode.json, .specify/, scripts/, wiki/, .opencode/agents/, .opencode/subagent-definitions/, .opencode/tools/, .opencode/skills/

---
*Session*: [[session-manual-save-cortexplugin]]
