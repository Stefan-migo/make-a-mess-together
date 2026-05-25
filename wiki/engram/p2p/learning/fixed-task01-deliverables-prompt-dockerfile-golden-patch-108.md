---
id: 108
type: learning
project: p2p
scope: project
topic_key: ""
session_id: manual-save-p2p
created_at: "2026-05-08 23:32:17"
updated_at: "2026-05-08 23:32:17"
revision_count: 1
tags:
  - p2p
  - learning
aliases:
  - "Fixed task01 deliverables: Prompt, Dockerfile, golden.patch"
---

# Fixed task01 deliverables: Prompt, Dockerfile, golden.patch

**What**: Fixed 3 deliverable files for P2P task01 (indico/indico PR #6526 — caching + rate limiting for LaTeX PDFs). (1) Prompt.md: removed solution-leaking Notes section, rephrased R4 to eliminate self-contradiction about config file modifications. (2) Created actual app/Dockerfile (not .md) per DockerGuide.md template with specific commit hash, platform-agnostic setup, redis-server + texlive deps. (3) Created actual app/golden.patch (not .md) — valid unified diff with 6 hunks, 86 insertions, 24 deletions, excluding documentation files (CHANGES.rst, settings.rst), no test file changes.

**Why**: Audit found Prompt.md Notes section leaked solution by naming PDFLaTeXBase.generate() and send_file() pattern — violated InstructionsHawkinsExperiments.md §3 and CommonErrors.md §1. Dockerfile and golden patch were only .md reference files, not actual deliverable files expected by e2e.sh.

**Where**: .cortex/task01/Prompt.md, .cortex/task01/app/Dockerfile, .cortex/task01/app/golden.patch

**Learned**: The Prompt.md Notes section is the most common anti-pattern (CommonErrors.md §1). The golden.patch must be a real unified diff file, not a markdown description. The Dockerfile must be named exactly "Dockerfile" (no extension). All three must be ready for e2e.sh validation pipeline.

---
*Session*: [[session-manual-save-p2p]]
