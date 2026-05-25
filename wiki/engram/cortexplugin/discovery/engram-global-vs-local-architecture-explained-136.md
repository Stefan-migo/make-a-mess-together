---
id: 136
type: discovery
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-17 20:46:07"
updated_at: "2026-05-17 20:46:07"
revision_count: 1
tags:
  - cortexplugin
  - discovery
aliases:
  - "Engram global vs local architecture explained"
---

# Engram global vs local architecture explained

**What**: Clarified Engram's installation architecture for CortexPlugin. Engram uses a HYBRID model: (1) The `engram` CLI binary is installed GLOBALLY in system PATH (via npm/pip), accessible as a command from anywhere. (2) Each project has its own LOCAL `.engram/` directory containing the SQLite database — this is in .gitignore and NOT committed to the repo. (3) The MCP config in opencode.json points to the global binary with `["engram", "mcp"]`, and Engram auto-detects which project it's running in to use the correct local database.

**Why**: User asked whether Engram is installed globally or locally.

**Where**: System PATH (global binary), .engram/ at project root (local DB), opencode.json (MCP config)

---
*Session*: [[session-manual-save-cortexplugin]]
