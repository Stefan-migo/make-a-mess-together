# Cortex 2.5 — Tool-Driven Executive Reasoning

## Brain Lobe Architecture

```
Frontal Lobe (Planning)     → Spec-Kit (.specify/) — /speckit.{constitution,specify,plan,tasks,implement}
Parietal Lobe (Spatial)     → Graphify — codebase graph before editing
Hippocampus (Memory)        → Engram — persistent SQLite memory via MCP
Occipital Lobe (Archive)    → wiki/ — Obsidian-readable snapshot exported from Engram
```

## Two Identities

| Agent | Role | Permissions |
|-------|------|-------------|
| `@Cortex-Planner` | Human interaction, spec drafting, research, knowledge management | Read-only + webfetch + task |
| `@Cortex-Developer` | Technical execution, code writing, testing, quality gates | Full (edit, bash, write, task) |

Switch with Tab: Planner (read-only) / Developer (full tools).

## Tool-Belt (MCP + CLI + Custom Tools)

### Engram (Hippocampus — Memory)
| Tool | Purpose |
|------|---------|
| `mem_save` | Save structured observation (decision, architecture, bugfix, pattern, discovery, learning) |
| `mem_search` | FTS5 full-text search across all memory |
| `mem_judge` | Resolve conflict candidates returned by mem_save |
| `mem_session_start` | Register session start |
| `mem_session_end` | Mark session complete |
| `mem_session_summary` | Save comprehensive session summary |
| `mem_context` | Recent context from previous sessions |
| `mem_get_observation` | Full untruncated observation content |
| `mem_stats` | Memory system statistics |

### Graphify (Parietal Lobe — Code Understanding)
| Tool | Purpose |
|------|---------|
| `query_graph` | Query knowledge graph for relevant nodes |
| `god_nodes` | Find highest-degree concepts |
| `python3 -m graphify.serve <graph>` | MCP server for graph queries |
| `/graphify . --update` | Rebuild graph after code changes |

### Spec-Kit (Frontal Lobe — Planning)
| Command | Purpose |
|---------|---------|
| `/speckit.constitution` | Define project principles |
| `/speckit.specify` | Write feature spec (WHAT to build) |
| `/speckit.clarify` | Resolve ambiguities |
| `/speckit.plan` | Write tech plan (HOW to build) |
| `/speckit.tasks` | Break into executable tasks |
| `/speckit.implement` | Execute all tasks |
| `/speckit.analyze` | Cross-artifact consistency check |
| `/speckit.checklist` | Quality validation checklist |
| `/speckit.taskstoissues` | Convert tasks to GitHub issues |

### Code-Sandbox (Execution)
| Tool | Purpose |
|------|---------|
| `execute_script` | Run TypeScript/JavaScript in Node.js sandbox for multi-step logic |

## Session Flow

### Start (CLI handles this)
1. `cortex start` → creates session, pre-loads context from Engram + Graphify, launches OpenCode
2. Agent detects `.cortex/prelude.md` and uses it as working context

### Work
1. Planner discusses with user, drafts spec via `/speckit.specify`
2. Planner hands spec to Developer via `@Cortex-Developer`
3. Developer runs graphify check before editing code
4. Developer executes modified 5-Step Gate per task

### 5-Step Execution Gate (MANDATORY)
```
Step 1: GRAPH CHECK — query_graph before editing
Step 2: ATOMIC COMMIT — one concern per commit, ≤5 files
Step 3: VERIFY — lint + typecheck + tests (block on failure)
Step 4: SPEC CHECK — /speckit.analyze after completion
Step 5: FINALIZE — mem_save + cortex close --message "<summary>"
```

### End (Agent handles finalization)
1. `@Cortex-Developer` calls mem_save for all discoveries
2. `@Cortex-Developer` runs: bash("cortex close --message "<summary>"")
   → This calls mem_session_summary + wiki export + cleanup

## Active MCP Servers
| Server | Purpose | Status |
|--------|---------|--------|
| Engram | Persistent memory (19 tools) | Enabled |
| Graphify | Codebase knowledge graph | Enabled |

Optional: sequential-thinking, context7, github — enable in `opencode.json` as needed.

## Skills
| Skill | When to load |
|-------|-------------|
| `skill({name:"graphify"})` | Before any code editing |
| `skill({name:"design-system"})` | When building UI |

## Knowledge Capture Discipline
Save to Engram immediately when you encounter:
- **decision**: Architecture or design decisions with rationale
- **bugfix**: Root cause and fix for bugs
- **pattern**: Reusable patterns discovered
- **architecture**: System architecture insights
- **discovery**: Unexpected findings
- **learning**: Lessons learned during development

## Coding Standards
- Run lint + typecheck before considering work complete
- Follow existing project conventions
- Atomic commits: one concern per commit, descriptive messages
- Write tests alongside implementation
- NEVER commit secrets or credentials

## Project
This is the **{PROJECT_NAME}** project, created on {DATE}.
