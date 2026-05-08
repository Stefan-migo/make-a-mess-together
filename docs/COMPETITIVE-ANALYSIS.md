# Cortex 2.5 — Competitive Analysis

How Cortex 2.5 compares to the coding agent ecosystem after the Architecture 2.5 upgrade.

---

## Architecture Shift: Cortex 2.5 vs Prior Art

Cortex 2.5 collapses the old multi-agent bureaucracy (41 agents, 66 commands, 3 planning systems) into a **two-persona, four-lobe model** powered by three real tools:

| Lobe | Cortex 2.5 | Prior Art |
|------|-----------|-----------|
| Planning | **Spec-Kit** (github/spec-kit, 93k★) | Replace GSD + Planning-with-Files |
| Memory | **Engram** (Gentleman-Programming/engram, 3.3k★) | Replace file-based wiki memory |
| Code understanding | **Graphify** (safishamsi/graphify, 39k★) | Same (kept) |
| API archive | **wiki/** (snapshot via `engram obsidian-export`) | Previously manual wiki ingestion/lint |

## Competitive Positioning

Cortex 2.5's advantage is **vertical integration** of three independent open-source tools that other systems use only in isolation:

- No other system combines Spec-Kit + Engram + Graphify
- No other system has the 4-lobe brain metaphor as an architectural pattern
- No other system has a pre-commit atomicity gate and 5-step execution discipline built in

**Weaknesses remaining:**
- OpenCode-only (not multi-platform like GSD or ECC)
- No eval/benchmark suite
- No built-in CI/CD or test runner

## MCP Servers Available

Configured in `opencode.json`:

| Server | Status | Purpose |
|--------|--------|---------|
| Engram | Enabled | Persistent memory (19 tools) |
| Graphify | Enabled | Codebase knowledge graph |
| Sequential Thinking | Disabled | Structured reasoning |
| Context7 | Disabled | Doc search (30+ libraries) |
| GitHub | Disabled | PR/issue management |

Enable any by setting `"enabled": true` in `opencode.json`.
