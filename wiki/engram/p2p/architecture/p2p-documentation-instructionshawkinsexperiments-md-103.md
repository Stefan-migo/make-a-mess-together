---
id: 103
type: architecture
project: p2p
scope: project
topic_key: ""
session_id: manual-save-p2p
created_at: "2026-05-08 20:00:32"
updated_at: "2026-05-08 20:00:32"
revision_count: 1
tags:
  - p2p
  - architecture
aliases:
  - "P2P Documentation: InstructionsHawkinsExperiments.md"
---

# P2P Documentation: InstructionsHawkinsExperiments.md

**What**: Complete specifications for Hawkins Experiments (P2P) task creation
**Why**: Comprehensive guide with all steps, templates, rules, and checklists for building P2P tasks
**Where**: .cortex/docs/InstructionsHawkinsExperiments.md
**Learned**: Two workflow branches: R/M (Refactoring/Maintainability) and PO (Performance Optimization). Common steps 1-4 for both: Source PR → Dockerfile + metadata → Prompt → Task Type. R/M adds: subtype selection, run_script, rubric (15-20 criteria). PO adds: category selection, target functions, reproduction script. Final steps: parsing.py, golden patch, e2e.sh, before.json/after.json upload. v7.0 rule: golden patch cannot modify test files. Subtypes: Organization, Memory Management, Latency, Standards, Language, Framework. PO Categories: Algorithmic, Memory, I/O, Vectorization. Rubric weights: 1 (nice-to-have), 3 (important), 5 (mandatory) - NO 2 or 4.

---
*Session*: [[session-manual-save-p2p]]
