---
id: 137
type: bugfix
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-17 20:46:53"
updated_at: "2026-05-17 20:46:53"
revision_count: 1
tags:
  - cortexplugin
  - bugfix
aliases:
  - "Fixed dual opencode.json config conflict"
---

# Fixed dual opencode.json config conflict

**What**: Fixed the dual opencode.json configuration conflict in CortexPlugin. Two configs were splitting critical configuration (MCP servers in root opencode.json, agents+plugin in .opencode/opencode.json). Merged everything into a single .opencode/opencode.json as the canonical config, and simplified root opencode.json to a minimal compatibility delegator.

**Changes made**:
- .opencode/opencode.json: Added all 5 MCP servers (engram, graphify, context7, sequential-thinking, github), fixed instructions path from 'CortexPlugin/AGENTS.md' to '../AGENTS.md', merged permission section, kept plugin reference
- Root opencode.json: Reduced from 80 lines to 5 lines (just $schema + instructions + comment delegating to .opencode/opencode.json)

**Why**: OpenCode uses .opencode/opencode.json as primary config. Having MCP servers only in root meant they weren't guaranteed to load. The broken instructions path ('CortexPlugin/AGENTS.md') would have failed to load AGENTS.md.

**Where**: opencode.json, .opencode/opencode.json

**Learned**: Dual configs with split responsibilities create fragility. OpenCode prioritizes .opencode/opencode.json. Always keep the canonical config there.

---
*Session*: [[session-manual-save-cortexplugin]]
