---
id: 101
type: config
project: p2p
scope: project
topic_key: ""
session_id: manual-save-p2p
created_at: "2026-05-08 20:00:25"
updated_at: "2026-05-08 20:00:25"
revision_count: 1
tags:
  - p2p
  - config
aliases:
  - "P2P Documentation: DockerGuide.md"
---

# P2P Documentation: DockerGuide.md

**What**: Docker quick reference for Hawkins Experiments
**Why**: Provides Dockerfile template and common commands for P2P task environments
**Where**: .cortex/docs/DockerGuide.md
**Learned**: Dockerfile template has 5 sections: BASE IMAGE, WORKING DIRECTORY (/app, DO NOT MODIFY), SYSTEM DEPENDENCIES, REPOSITORY SETUP (clone + checkout specific commit SHA), PROJECT DEPENDENCIES, ENTRYPOINT (/bin/bash, DO NOT MODIFY). Common base images: python:3.10-slim, node:20-slim, ubuntu:22.04.

---
*Session*: [[session-manual-save-p2p]]
