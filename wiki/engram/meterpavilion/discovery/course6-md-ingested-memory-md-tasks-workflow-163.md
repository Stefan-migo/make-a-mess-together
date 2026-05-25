---
id: 163
type: discovery
project: meterpavilion
scope: project
topic_key: ""
session_id: manual-save-meterpavilion
created_at: "2026-05-18 00:26:05"
updated_at: "2026-05-18 00:26:05"
revision_count: 1
tags:
  - meterpavilion
  - discovery
aliases:
  - "Course6.md ingested — Memory.md Tasks Workflow"
---

# Course6.md ingested — Memory.md Tasks Workflow

**What**: New documentation file Course6.md (288 lines) has been added to Documentation/. It covers the "Memory.md Tasks Workflow" — how to write prompts that incorporate MEMORY.md context for the Memory Usage category.

**Where**: /run/media/stefan/Nuevo vol/AI JOB/outlier/MeterPavilion/Documentation/Course6.md

**Structure**:
- Lines 1-36: Memory.md Tasks Workflow (4-step process for Memory Usage tasks)
- Lines 38-50: Case Study intro (Andrew Mitchell example)
- Lines 52-210: Golden Example — Andrew Mitchell persona (full MEMORY.md contents with identity, finances, contacts, rules, etc.)
- Lines 212-216: The prompt for the case study (Red River Gorge trip feasibility)
- Lines 219-223: Task Description (synthesizes MEMORY.md + FinTrack data)
- Lines 225-288: Desired Outcome using 3-bucket template (with specific financial figures)

**Key content — 4-step Memory Usage workflow**:
1. Understand task requirements (domain, persona, universe, locate MEMORY.md)
2. Write grounded prompts (use specific background details, NOT explicit "look at memory")
3. Define influence in Desired Outcome (state how memory shapes response)
4. Validation & Justification (verify agent cross-referenced memory with tool output)

**Case study — Andrew Mitchell**:
- 42-year-old occupational therapist in New Orleans
- Has $8k underwater truck loan (SENSITIVE — never disclose)
- MEMORY.md contains 7 Personal Rules (security against phishing, financial privacy)
- Task: Assess Red River Gorge trip feasibility using MEMORY.md budget estimates vs FinTrack actuals
- Shows how to synthesize ideal budget (712 surplus) with reality (240.40 actual surplus)

**3-Bucket Desired Outcome example**:
- Bucket 1: Specific financial data (gas $315.52 avg, groceries $551.55 avg, surplus $240.40)
- Bucket 2: FinTrack skill, `get-transactions` command, `read` and `exec` tools
- Bucket 3: Must NOT disclose savings balance or auto loan per Rule 4

**Relationship to other docs**:
- Builds on Course2.md category alignment (Memory Usage) and Course3.md (3-bucket desired outcome)
- Provides concrete worked example unlike the abstract descriptions in earlier courses
- Aligns with AttemptersGuidelines.md:185-204 (Memory Usage explanation section)
- The Andrew Mitchell persona is new — not listed in the 11 universes from AttemptersGuidelines.md:210-221

**Why**: User added this file to Documentation/ and requested it be ingested into the system for reference.

---
*Session*: [[session-manual-save-meterpavilion]]
