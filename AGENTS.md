# phone-sensor-orchestra — Cortex Agentic System

This project uses the **Cortex 2.5** brain-lobe architecture adapted for building a
multi-device phone sensor → p5.js sound + visuals system over WebSocket/OSC.

Primary spec document: **PLAN.md** — read it first for architecture, data flow,
slot assignment, 30 sound types, 30 visual types, and module details.

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
| `@Cortex-Planner` | Human interaction, spec drafting, sensor protocol design, sound/visual mapping decisions | Read-only + webfetch + task |
| `@Cortex-Developer` | Technical execution: bridge server, phone client, p5 sketch implementation | Full (edit, bash, write, task) |

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

## Project Modules

The project has 3 source modules under the repo root:

| Module | Directory | Purpose |
|--------|-----------|---------|
| **Server Bridge** | `server-bridge/` | Node.js WebSocket server, slot allocator, message relay |
| **Phone Client** | `phone-client/` | Static HTML/JS, reads DeviceMotion + DeviceOrientation APIs |
| **p5 Sketch** | `p5-sketch/` | p5.js + Tone.js + osc-js, 30 voice types, 30 visual types |

Data flow: Phone → WebSocket → Bridge → OSC → p5 Sketch

## Session Flow

### Start (CLI handles this)
1. `cortex start` → creates session, pre-loads context from Engram + Graphify, launches OpenCode
2. Agent detects `.cortex/prelude.md` and uses it as working context

### Work
1. Planner discusses with user, drafts spec via `/speckit.specify`
2. Planner hands spec to Developer via `@Cortex-Developer`
3. Developer runs graphify check before editing code
4. Developer executes modified 5-Step Gate per task

### 5-Step Execution Gate with TDD (MANDATORY)

```
Step 0: TDD RED — Write a FAILING test for the new behavior
  → Write one focused test in tests/ or appropriate location
  → Run `npm test` — the test MUST fail (RED)
  → Show user the failing test before proceeding
  
Step 1: GRAPH CHECK — query_graph for relevant nodes BEFORE editing
  → Focus on data flow: phone-client → server-bridge → p5-sketch
  → If graph doesn't exist / is stale: run graphify first

Step 2: TDD GREEN — Write MINIMUM code to make the test pass
  → Run `npm test` — the test MUST pass (GREEN)
  → Write the simplest implementation — no gold-plating

Step 3: ATOMIC COMMIT
  → Each concern = one separate commit
  → Commit grouping: bridge changes / phone-client changes / p5-sketch changes / config / tests
  → NO mixing refactors with feature work
  → NO commits touching >5 unrelated files

Step 4: TDD REFACTOR — Clean up while keeping tests green
  → Run `npm test` — still GREEN
  → Remove duplication, clarify names, simplify logic

Step 5: VERIFICATION GATE
  Bridge:   → node server-bridge/index.js starts without error
            → WebSocket accepts connections, slot assignment works
  Phone:    → Static files serve correctly, sensor API calls exist
  p5:       → load p5-sketch/index.html in browser, check console for errors
  All:      → Run `npm test` — ALL tests pass
  → If ANY fails: FIX FIRST, then re-commit
  → Only proceed when all pass

Step 6: SPEC COMPLIANCE
  → After all tasks: run /speckit.analyze
  → Run /speckit.test.gaps to find untested requirements
  → Verify against PLAN.md:
    - Sound type matches slot's sensor mapping (30 types table)
    - Visual type matches slot's sensor mapping (30 visuals table)
    - OSC message format matches protocol spec
    - Slot lifecycle (assign/disconnect/count) implemented
  → Every requirement must have at least one test

Step 7: SESSION FINALIZATION
  → Save key learnings via mem_save (type: bugfix | pattern | architecture | discovery | learning)
  → bash("cortex close --message "<brief summary of what was accomplished>"")
  → This finalizes the session in Engram and exports to wiki
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

## Skills
| Skill | When to load |
|-------|-------------|
| `skill({name:"phone-sensor-orchestra"})` | First — load project domain knowledge |
| `skill({name:"graphify"})` | Before any code editing |
| `skill({name:"design-system"})` | When building phone client UI |

## Knowledge Capture Discipline
Save to Engram immediately when you encounter:
- **decision**: Sensor mapping choices, sound type assignments, protocol decisions
- **bugfix**: WebSocket reconnect issues, sensor permission quirks, voice cleanup leaks
- **pattern**: Reusable sensor→parameter mapping patterns, Tone.js voice chain patterns
- **architecture**: Data flow insights, slot allocation strategies, OSC message routing
- **discovery**: Browser-specific sensor behavior, performance findings for 30 voices
- **learning**: Lessons learned during development

## Coding Standards
- Run lint + typecheck before considering work complete
- Follow existing project conventions
- Atomic commits: one concern per commit, descriptive messages
- Write tests alongside implementation
- NEVER commit secrets or credentials

## graphify

This project has a graphify knowledge graph at wiki/graph/.

Rules:
- Before answering architecture or codebase questions, read wiki/graph/GRAPH_REPORT.md for god nodes and community structure
- For cross-module "how does X relate to Y" questions about data flow between phone-client, server-bridge, and p5-sketch, prefer graphify queries over grep
- After modifying code files, run `python3 -m graphify . --update` to keep the graph current
