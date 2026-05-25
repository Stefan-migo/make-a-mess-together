---
id: 54
type: decision
project: p2p
scope: project
topic_key: ""
session_id: manual-save-p2p
created_at: "2026-05-08 12:06:51"
updated_at: "2026-05-08 12:06:51"
revision_count: 1
tags:
  - p2p
  - decision
aliases:
  - "Task7 scality/cloudserver PR#1889 flagged invalid — sproxyd external dependency"
---

# Task7 scality/cloudserver PR#1889 flagged invalid — sproxyd external dependency

**What**: Task7 (scality/cloudserver PR#1889 — sproxyd batch delete) flagged as INVALID. The PR adds sproxyd batch delete support by converting batchDelete from fire-and-forget to callback-based. The performance improvement requires a real sproxyd server, which cannot be run inside Docker. The mem backend fallback shows identical performance before and after the patch.

**Why**: The task claimed Performance Optimization type but the optimisation (sproxyd batch delete) requires an external sproxyd server. Per §8 Invalid Tasks (InstructionsHawkinsExperiments.md:625), "The task requires an external dependency that cannot be created or simulated within the Dockerfile." Also, simulated/dummy benchmarks are prohibited per Step 7 guidelines.

**Where**: /run/media/stefan/Nuevo vol/AI JOB/outlier/P2P/Tasks/task7/task7Information.md

**Learned**: 
- Always verify PO tasks can actually measure performance improvement with available backends (mem, file, etc.) before proceeding
- If an optimisation is backend-specific (sproxyd, AWS, etc.), check if the backend can run in Docker
- Converting fire-and-forget to callback-based async is primarily a refactoring, not a PO — check task type alignment before building
- The pre-flight validity check must include: "Can the reproduction script show a measurable improvement using only the infrastructure available in Docker?"
- Package.json test command uses S3BACKEND=mem — the sproxyd batch path is never exercised by unit tests

---
*Session*: [[session-manual-save-p2p]]
