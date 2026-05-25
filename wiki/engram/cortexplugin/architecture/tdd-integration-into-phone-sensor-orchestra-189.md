---
id: 189
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 00:12:49"
updated_at: "2026-05-20 00:12:49"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "TDD integration into phone-sensor-orchestra"
---

# TDD integration into phone-sensor-orchestra

**What**: Integrated Test-Driven Development (TDD) as mandatory workflow into the phone-sensor-orchestra project. Modified constitution (Section VI), AGENTS.md (7-step gate), tasks template (mandatory tests), created Jest config, 4 scaffold test files (39 test.todo items), and test-template.md.

**Why**: To enforce test-before-code discipline across all development. Constitution Section VI requires a failing test before any implementation code.

**Where**: 
- .specify/memory/constitution.md — added Section VI (TDD), SpecTooling note
- AGENTS.md — replaced 5-step gate with 7-step TDD gate (RED→GRAPH→GREEN→COMMIT→REFACTOR→VERIFY→SPEC)
- .specify/templates/tasks-template.md — removed OPTIONAL labels, added TDD Enforcement Gate section
- package.json — added Jest scripts
- jest.config.js — root-level config for Node env, coverage on server-bridge + p5-sketch
- tests/bridge/slot-allocator.test.js — 10 test.todo
- tests/bridge/message-protocol.test.js — 9 test.todo
- tests/p5-sketch/sensor-mapper.test.js — 14 test.todo
- tests/p5-sketch/audio-bus.test.js — 6 test.todo
- .specify/templates/test-template.md — new test file template

**Learned**: SpecTest community extension (`spec-kit-spectest`) is not available via `specify extension add` — the `extension` subcommand doesn't exist in the current Spec-Kit version. Noted in constitution with a re-check hint. Jest 29.7.0 installed successfully, runs all 39 todo tests in ~3s.

---
*Session*: [[session-manual-save-cortexplugin]]
