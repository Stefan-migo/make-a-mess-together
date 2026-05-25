---
id: 88
type: learning
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 18:21:24"
updated_at: "2026-05-08 18:21:24"
revision_count: 1
tags:
  - cortexplugin
  - learning
aliases:
  - "Pushed Cortex CLI v1 to GitHub — 28 atomic commits"
---

# Pushed Cortex CLI v1 to GitHub — 28 atomic commits

**What**: Pushed the complete Cortex CLI tool (~7800 lines, 120+ files) to GitHub in 28 atomic commits across 10 logical groups: gitignore config, CLI entrypoint+config, commands batch 1/2, engine+utils, template bundle (16 sub-commits), scripts+readme, agent template updates, wiki memory exports (5 sub-commits).

**Why**: User wanted to push a version to GitHub for testing.

**Where**: https://github.com/Stefan-migo/CortexPlugin — commits c4c0730..b1df72a

**Learned**: The atomic commit gate enforces ≤5 files per commit strictly. Template bundles with 72+ files had to be split across 16 sub-commits by subdirectory. The pre-commit graphify hook automatically rebuilds the knowledge graph on every commit (108 nodes, 241 edges).

---
*Session*: [[session-manual-save-cortexplugin]]
