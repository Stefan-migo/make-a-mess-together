---
id: 66
type: manual
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 13:19:16"
updated_at: "2026-05-08 13:19:16"
revision_count: 1
tags:
  - cortexplugin
  - manual
aliases:
  - "Documentation: AttempterGuidelines.md - Full operational workflow"
---

# Documentation: AttempterGuidelines.md - Full operational workflow

**What**: Complete Mariachi Union Attempter Guidelines ingested. Covers: Step 1 (Understand Task Requirements - Type/Domain/Difficulty/Category, Universe Explorer as source of truth), Step 2 (Understand Prompt and Hint - Architectural Complexity Requirements: Three-Stage Workflow, Multi-System Coordination, Multi-Agent ≥2 subagents, Friction Points, Skill & Memory; How Hints Work - single turn-1 format [prompt] <hint>[hint]</hint>), Step 3 (Generate Model Response - Load Universe via Create & Load, Reset All → Start Fresh, send prompt+hint as ONE message, watch for good/bad signs, retry up to 3-4 times), Step 4 (Refine Trajectory - Collect traces via Collect Traces & Continue, Clean: failed calls, duplicates, redundant steps, hint references in model text AND thinking, tool call consistency, file creation bugs, subagent output usage), Step 5 (Upload - workspace files + JSON trajectory zipped together, never rename/edit files), Quick Reference Checklist, Common Problems & Fixes table, The 5 Never-Break Rules, Safety Response levels.

**Why**: Step-by-step operational guide for every task run. Defines exactly how attempter should run, clean, and submit.

**Where**: ../Documentation/AttempterGuidelines.md, wiki/workflow/index.md, wiki/rules/index.md

**Learned**: Key rules: Reset All → Start Fresh for retries (never mid-conversation fix), Collect Traces & Continue button only shows after closing OpenClaw tab, 3-4 attempt limit before flagging task, every subagent output must be meaningfully used (not just spawned), thinking/reasoning text counts for hint leakage.

---
*Session*: [[session-manual-save-cortexplugin]]
