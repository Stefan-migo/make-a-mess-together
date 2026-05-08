---
id: 87
type: session_summary
project: cortexplugin
scope: project
topic_key: ""
session_id: cortex-cli-planning-2026-05-08
created_at: "2026-05-08 18:01:53"
updated_at: "2026-05-08 18:01:53"
revision_count: 1
tags:
  - cortexplugin
  - session_summary
aliases:
  - "Session summary: cortexplugin"
---

# Session summary: cortexplugin

## Goal
Build a `cortex` CLI tool that manages the Cortex "brain" across OpenCode projects — wrapping OpenCode with project scaffolding, session lifecycle automation, smart context curation, and template evolution.

## Instructions
- User wants a pragmatic approach: not building a full harness, wrapping OpenCode instead
- CLI communicates with Engram via both MCP (session lifecycle) and CLI subprocess (context queries)
- Every component degrades gracefully — Engram/Graphify unavailability never blocks work
- Template evolution via SHA256 manifest tracking — key innovation for self-improving brain

## Discoveries
- Engram MCP responses are complex nested JSON — need careful unwrapping (content array → text field → possible JSON parse)
- esbuild bundles code but template files (74 files) need a separate copy step — can't be inline
- OpenCode TUI breaks in non-TTY environments (like CI/testing) — the `--no-open` flag is essential
- Force-overwriting a project directory needs stale `.git` cleanup or git commit fails on re-init
- The cortex CLI at ~2500 lines of TypeScript achieves what the ARCHITECTURE.md envisioned at 50,000+ lines — by wrapping, not replacing, OpenCode

## Accomplished
- ✅ Phase 1: `cortex init` + `cortex install` — project scaffolding with 74-file template, variable substitution, SHA256 manifest, git init
- ✅ Phase 2: `cortex start` + `cortex close` — session lifecycle via Engram MCP, context prelude, wiki export, OpenCode launch
- ✅ Phase 3: `cortex status` + smart context — ranked/scored context items, token budget allocation, Graphify MCP integration, brain health overview
- ✅ Phase 4: `cortex update` + `cortex analyze` + `--retrospective` — template diff/merge, session pattern detection, retrospective generation
- ✅ Agent prompts updated — 5-Step Gate now includes `cortex close` for session finalization

## Next Steps
- Publish to npm: `cortex init` would work globally as `npm install -g cortex-brain`
- Windows support: shell scripts need Node.js equivalents
- Unit tests: vitest test suite for all commands
- More sophisticated analyze: better pattern detection with real session data accumulation

## Relevant Files
- cli/src/index.ts — CLI entry: 8 commands registered
- cli/src/commands/*.ts — 7 command implementations (init, install, start, close, status, update, analyze)
- cli/src/engine/*.ts — Core engine (template, manifest, session, context, deps)
- cli/src/utils/mcp.ts — Minimal MCP client for Engram/Graphify
- cli/src/template/ — 74-file Cortex brain template
- .opencode/agents/cortex-developer.md — Updated 5-Step Gate
- .opencode/agents/cortex-planner.md — Updated session lifecycle
- AGENTS.md — Updated hybrid workflow documentation

---
*Session*: [[session-cortex-cli-planning-2026-05-08]]
