---
id: 138
type: discovery
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-17 20:51:27"
updated_at: "2026-05-17 20:51:27"
revision_count: 1
tags:
  - cortexplugin
  - discovery
aliases:
  - "Engram database is global, not project-local"
---

# Engram database is global, not project-local

**What**: Discovered that Engram's SQLite database lives at ~/.engram/engram.db (global/home location), NOT at the project-local .engram/ as assumed. The .gitignore has .engram/ listed but the directory doesn't actually exist at the project root. The engram binary at /home/stefan/.local/bin/engram uses this single global database for all projects (cortexplugin, mariachiunion, etc.), with project differentiation handled via a project name column in the database schema. The engram_mem_doctor confirms SQLite WAL mode with 5000ms busy timeout at the global location.

**Why**: User asked whether a local Engram database exists for this project.

**Where**: ~/.engram/engram.db (global database), /home/stefan/.local/bin/engram (binary location)

**Learned**: Engram defaults to ~/.engram/ for its database. For a truly project-local setup, a config file at ~/.config/engram/config.json would be needed to override the database path, or the --project flag must be used explicitly.

---
*Session*: [[session-manual-save-cortexplugin]]
