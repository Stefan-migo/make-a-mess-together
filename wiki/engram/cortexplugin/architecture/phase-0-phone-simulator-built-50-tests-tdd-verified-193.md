---
id: 193
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 00:25:16"
updated_at: "2026-05-20 00:25:16"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Phase 0: Phone simulator built — 50 tests, TDD verified"
---

# Phase 0: Phone simulator built — 50 tests, TDD verified

**What**: Built Phase 0 — phone simulator (scripts/simulate-phones.js) with 50 passing tests following TDD RED→GREEN workflow.

**Why**: The phone simulator is the foundational tool needed before building the bridge, p5 sketch, or phone client. Validates bridge capacity, slot allocator correctness, message relay format, and system stability without requiring physical phones.

**Where**: 
- scripts/simulate-phones.js — Main simulator (CLI parser, 5 sensor patterns, VirtualPhone, StatsAggregator, ReportGenerator, ConsoleUI)
- tests/scripts/simulate-phones.test.js — 50 tests covering all modules

**Architecture**:
- CLI parser: --count, --url, --pattern (sine/noise/spikes/idle/mixed), --interval, --duration, --disconnect, --report, --verbose, --help
- SensorDataGenerator: 5 pattern functions (sine with per-slot frequency variation, gaussian noise, periodic spike bursts for drum triggers, idle near-zero, mixed random per-slot)
- VirtualPhone: EventEmitter-based, connect/start/stop/disconnect lifecycle, 30fps send loop, slot assignment handling
- StatsAggregator: Per-phone and aggregate metrics (total messages, avg/max/min latency, throughput/sec, connection events)
- ReportGenerator: JSON output matching spec format
- ConsoleUI: Real-time animated dashboard with slot usage bar, per-phone table, summary stats

**Learned**: Node.js EventEmitter has special behavior for 'error' events — if emitted without a listener, the process crashes. Renamed to 'phoneError' to avoid this. VirtualPhone WebSocket tests should only verify the class interface (constructor, methods) without connecting, since no bridge exists during test.

**Dependencies**: ws (WebSocket), events (built-in). ws added as devDependency at root.

**Commits**:
1. 212b3e8 - feat(phase-0): phone simulator with 30 virtual connections
2. 312813b - fix(simulator): graceful WebSocket error handling

---
*Session*: [[session-manual-save-cortexplugin]]
