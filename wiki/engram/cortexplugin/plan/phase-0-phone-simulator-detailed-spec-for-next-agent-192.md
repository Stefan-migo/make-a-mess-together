---
id: 192
type: plan
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 00:18:21"
updated_at: "2026-05-20 00:18:21"
revision_count: 1
tags:
  - cortexplugin
  - plan
aliases:
  - "Phase 0 Phone Simulator — detailed spec for next agent"
---

# Phase 0 Phone Simulator — detailed spec for next agent

**What**: Created detailed Phase 0 spec document at .specify/specs/00-phone-simulator.md for the phone simulator tool. This is the first implementation phase and must be built before anything else.

**The simulator** is a Node.js script (scripts/simulate-phones.js) that:
- Spawns N virtual phone WebSocket connections (default 30)
- Generates realistic sensor data at 30fps (sine, noise, spikes, idle, mixed patterns)
- Reports real-time metrics (connections, latency, throughput, errors)
- Supports disconnect/reconnect simulation for resilience testing
- Zero npm dependencies (only ws + Node.js built-ins)
- JSON report output for post-run analysis

**Why build first**: Enables testing bridge capacity, slot allocation, message relay, and latency WITHOUT needing 30 physical phones.

**Implementation order**: CLI parser → SensorDataGenerator → VirtualPhone class → StatsAggregator → Console UI → ReportGenerator → Integration test

**TDD**: Requires tests/scripts/simulate-phones.test.js with minimum 20 test stubs covering generators, virtual phone lifecycle, stats, and CLI parsing.

**Test file location**: tests/scripts/simulate-phones.test.js (need to create tests/scripts/ directory)

---
*Session*: [[session-manual-save-cortexplugin]]
