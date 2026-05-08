# Cortex 2.5 — User Guide

Your guide to using the Cortex 2.5 tool-driven executive reasoning system with OpenCode.

---

## Quick Start

```bash
cd CortexPlugin
opencode
```

The system loads automatically. Two agents are available, switch with Tab:

| Agent | Tab | Use for |
|-------|-----|---------|
| `@Cortex-Planner` | Planner | Planning, research, specs, memory |
| `@Cortex-Developer` | Developer | Building, coding, testing, quality |

---

## Daily Workflow

### Start a Session
1. Switch to `@Cortex-Planner`
2. Agent auto-runs `mem_session_start` and `mem_context` to restore context
3. Discuss your goal with the agent

### Build a Feature (Spec-Driven)
```
1. /speckit.specify         → Write feature spec (Planner)
2. /speckit.clarify         → Resolve ambiguities (Planner, optional)
3. /speckit.plan            → Create tech plan (Planner)
4. /speckit.tasks           → Break into tasks (Planner)
   Then Tab to @Cortex-Developer
5. Developer executes via 5-Step Gate:
   ← Graph check → Atomic commit → Verify → Spec check → Memory save
6. /speckit.checklist       → Quality validation (Developer)
```

### End a Session
1. `@Cortex-Developer` saves discoveries: `mem_save`
2. `@Cortex-Planner` runs `mem_session_summary` + `mem_session_end`
3. Run `scripts/engram-export-wiki.sh` to sync to Obsidian vault

---

## Tool Reference

### Engram (Memory — Hippocampus)
| Tool | When |
|------|------|
| `mem_save` | After every decision, bug fix, pattern, discovery |
| `mem_search` | When you need to recall past context |
| `mem_judge` | When mem_save returns conflict candidates |
| `mem_session_start` | Session start |
| `mem_session_end` | Session end |
| `mem_session_summary` | Before closing |

### Spec-Kit (Planning — Frontal Lobe)
| Command | What it does |
|---------|-------------|
| `/speckit.constitution` | Define project principles |
| `/speckit.specify` | Write feature spec (WHAT) |
| `/speckit.clarify` | Resolve ambiguities |
| `/speckit.plan` | Write tech plan (HOW) |
| `/speckit.tasks` | Break into tasks |
| `/speckit.implement` | Execute all tasks |
| `/speckit.analyze` | Consistency check |
| `/speckit.checklist` | Quality validation |

### Graphify (Code Understanding — Parietal Lobe)
| Command | When |
|---------|------|
| `python3 -m graphify.serve wiki/graph/graph.json` | Start MCP server |
| `query_graph` | Before editing any code |
| `god_nodes` | Find key concepts |
| `/graphify . --update` | After major refactors |

### Code Sandbox
| Tool | Use |
|------|-----|
| `execute_script` | Run TypeScript/JS snippets for prototyping |

### Execution Discipline (5-Step Gate)
Built into `@Cortex-Developer` — fires automatically on every task:
1. **GRAPH CHECK** — query the knowledge graph before editing
2. **ATOMIC COMMIT** — one concern per commit (≤5 files)
3. **VERIFY** — lint + typecheck + tests (block on failure)
4. **SPEC CHECK** — /speckit.analyze after completion
5. **MEMORY** — mem_save key learnings

Plus a pre-commit hook enforces the ≤5-file atomicity gate mechanically.

---

## Architecture (Brain Lobe Model)

```
Frontal Lobe  → Spec-Kit (.specify/) — Planning
Parietal Lobe → Graphify — Code understanding before edits
Hippocampus   → Engram (MCP) — Persistent SQLite memory, 19 tools
Occipital Lobe → wiki/ — Obsidian-readable snapshot from Engram
```

Two agents, four lobes. No GSD, no 33 subagents, no planning-with-files.

---

## Obsidian Usage

The `wiki/` directory is an Obsidian vault. At session end, `scripts/engram-export-wiki.sh` syncs Engram observations to `wiki/engram/` as markdown files with proper frontmatter and [[wikilinks]]. Open the `wiki/` folder in Obsidian for visual graph view and Dataview dashboards.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Agent doesn't load context | Run `mem_context` manually |
| Spec-Kit command not found | Run `specify check` |
| Engram MCP not connecting | Run `engram mcp --tools=all` to test |
| Graphify graph is stale | Run `/graphify . --update` |
| Pre-commit hook too strict | Edit threshold in `.git/hooks/pre-commit` |
