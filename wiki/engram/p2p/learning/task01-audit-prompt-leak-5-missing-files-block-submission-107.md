---
id: 107
type: learning
project: p2p
scope: project
topic_key: ""
session_id: manual-save-p2p
created_at: "2026-05-08 23:26:44"
updated_at: "2026-05-08 23:26:44"
revision_count: 1
tags:
  - p2p
  - learning
aliases:
  - "Task01 audit: Prompt leak + 5 missing files block submission"
---

# Task01 audit: Prompt leak + 5 missing files block submission

**What**: Full audit of task01 deliverables against all documentation guidelines. Found critical issues: (1) Prompt.md Notes section leaks solution by naming PDFLaTeXBase.generate(), send_file(), and rate limiting pattern — violates CommonErrors.md §1 and InstructionsHawkinsExperiments.md §3; (2) 5 mandatory files missing entirely (run_script.sh, parsing.py, reproduction_script.sh, e2e.sh, Target Functions); (3) 1 warning (texlive-fonts-extra image size risk).

**Why**: Task01 is for indico/indico PR #6526 — caching + rate limiting for LaTeX PDF generation. Task type: PO (Performance Optimization). The audit verified golden patch is valid (6 files, 80 insertions, no test files), Dockerfile design is correct, and PR_Analysis.md is accurate. Prompt leak is the blocker.

**Where**: .cortex/task01/ (all deliverables), .cortex/docs/ (all guidelines used as source of truth)

**Learned**: The Prompt.md Notes section is the most common anti-pattern from CommonErrors.md §1 — describing the solution mechanism instead of the problem. The task is BLOCKED and needs remediation before it can proceed to e2e.sh validation.

---
*Session*: [[session-manual-save-p2p]]
