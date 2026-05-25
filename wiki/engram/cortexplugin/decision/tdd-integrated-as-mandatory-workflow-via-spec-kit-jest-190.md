---
id: 190
type: decision
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 00:13:11"
updated_at: "2026-05-20 00:13:11"
revision_count: 1
tags:
  - cortexplugin
  - decision
aliases:
  - "TDD integrated as mandatory workflow via Spec-Kit + Jest"
---

# TDD integrated as mandatory workflow via Spec-Kit + Jest

**What**: Integrated Test-Driven Development (TDD) as a mandatory workflow into phone-sensor-orchestra. Modified Spec-Kit templates, agent prompts, constitution, and set up Jest test infrastructure.

**What changed**:
1. Constitution (`.specify/memory/constitution.md`): Added Section VI — TDD as core principle. No test = no code. 
2. AGENTS.md: Updated 5-Step Gate to 7-Step TDD Gate (RED→GREEN→REFACTOR flow)
3. Tasks template (`.specify/templates/tasks-template.md`): Removed "OPTIONAL" labels, tests are now MANDATORY
4. Test template (`.specify/templates/test-template.md`): Created reusable TDD test file template
5. package.json: Added Jest with scripts (test, test:watch, test:coverage)
6. jest.config.js: Node env, tests/ root, coverage on bridge + p5
7. 4 test scaffold files created: 39 test.todo stubs ready for RED phase

**Why**: TDD prevents AI behavioral drift, catches edge cases early, and enforces modular design. With AI agents writing the code, the test becomes the "ground truth" the AI cannot cheat.

**SpecTest extension**: Community Spec-Kit extension not yet available via CLI. Noted for future re-check.

---
*Session*: [[session-manual-save-cortexplugin]]
