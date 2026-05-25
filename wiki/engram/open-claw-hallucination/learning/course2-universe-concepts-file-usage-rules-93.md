---
id: 93
type: learning
project: open-claw-hallucination
scope: project
topic_key: ""
session_id: manual-save-open-claw-hallucination
created_at: "2026-05-08 19:49:02"
updated_at: "2026-05-08 19:49:02"
revision_count: 1
tags:
  - open-claw-hallucination
  - learning
aliases:
  - "Course2 — Universe Concepts & File Usage Rules"
---

# Course2 — Universe Concepts & File Usage Rules

**What**: Course2.md — Explains what a "Universe" is in OpenClaw and the rules for using files within tasks.

**Key Concepts**:
- **Universe Definition**: A preloaded, self-contained environment containing structured data, system state, and objects. The data already exists — you do not provide it.
- **Model Access**: When a model runs in a universe, it has access to the environment's data. It does NOT need URLs or external APIs.
- **Viewers vs. Universe**: Viewers (e.g., Finance Support Viewer, Hotel Manager Viewer) are windows for humans to inspect the environment. The model does NOT use the viewer URL — it accesses the universe data directly.
- **One-Line Rule**: "Don't pass the viewer — design tasks that use the universe."

**File Usage Rules**:
- Files can add context but cannot replace, duplicate, or contradict universe data.
- Valid files: referenced by prompt (e.g., needed_info.txt), simulate real-world inputs (lawyer docs, emails, notes), give model extra context to interpret.
- Invalid files: those that act as the main dataset instead of the universe.
- Universe = source of truth (data). Files = supporting context.
- If the file helps interpret or guide behavior → it's correct. If it replaces the data → it's wrong.

**Examples**:
- ✅ GOOD: File adds context (needed_info.txt from lawyer) while universe has actual financial records.
- ✅ GOOD: File provides response guidelines (policy.txt) while universe has customer data.
- ❌ BAD: Prompt passes the viewer URL and asks model to fetch data from it.
- ❌ BAD: File duplicates or replaces universe data.

**Why**: This is critical for task design correctness — violations of universe rules are among the most common rejection reasons.
**Where**: Documentation/Course2.md (166 lines)
**Learned**: The model accesses universe data natively — do NOT provide URLs or pass viewer links. Files are for context/guidance only, never as a data replacement.

---
*Session*: [[session-manual-save-open-claw-hallucination]]
