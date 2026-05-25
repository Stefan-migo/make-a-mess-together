---
id: 102
type: learning
project: p2p
scope: project
topic_key: ""
session_id: manual-save-p2p
created_at: "2026-05-08 20:00:28"
updated_at: "2026-05-08 20:00:28"
revision_count: 1
tags:
  - p2p
  - learning
aliases:
  - "P2P Documentation: HowToUseTemplates.md"
---

# P2P Documentation: HowToUseTemplates.md

**What**: Guide for using P2P templates (parsing.py and run.sh)
**Why**: Explains how to generate test output files, run the parser, and validate results
**Where**: .cortex/docs/HowToUseTemplates.md
**Learned**: Workflow: run tests > stdout.txt/stderr.txt > parsing.py stdout.txt stderr.txt results.json. parse_test_output() must be implemented. The JSON output format is {"tests": [{"name": "...", "status": "PASSED|FAILED|SKIPPED|ERROR"}]}. Docker workflow: build image, run container, execute scripts inside.

---
*Session*: [[session-manual-save-p2p]]
