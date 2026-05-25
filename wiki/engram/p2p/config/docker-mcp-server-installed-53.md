---
id: 53
type: config
project: p2p
scope: project
topic_key: ""
session_id: manual-save-p2p
created_at: "2026-05-08 11:53:08"
updated_at: "2026-05-08 11:53:08"
revision_count: 1
tags:
  - p2p
  - config
aliases:
  - "Docker MCP server installed"
---

# Docker MCP server installed

**What**: Installed docker-mcp v0.2.0 and registered it in opencode.json and SYSTEM-MAP.md as a new MCP server

**Why**: Need Docker container and compose management via MCP structured tools for P2P task creation

**Where**: opencode.json (line 55-60), .opencode/SYSTEM-MAP.md (MCP SERVERS table)

**Learned**: uv/uvx is not available on this system; used pip install docker-mcp instead. The config command ["uvx", "docker-mcp"] won't work without uv — may need to switch to ["~/.local/bin/docker-mcp"] or ["python", "-m", "docker_mcp"]. The server validates correctly via MCP initialize (returns serverInfo name "docker-mcp", version "0.1.0").

---
*Session*: [[session-manual-save-p2p]]
