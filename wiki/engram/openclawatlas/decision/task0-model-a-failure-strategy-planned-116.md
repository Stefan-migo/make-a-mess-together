---
id: 116
type: decision
project: openclawatlas
scope: project
topic_key: ""
session_id: manual-save-openclawatlas
created_at: "2026-05-16 14:50:35"
updated_at: "2026-05-16 14:50:35"
revision_count: 1
tags:
  - openclawatlas
  - decision
aliases:
  - "Task0 — Model A failure strategy planned"
---

# Task0 — Model A failure strategy planned

**What**: Designed rubric set for Model A to fail ≥50% of total rubric score. 9 rubric criteria total with a maximum absolute weight sum of 25.

**Key differentiation points**:
1. **Jan 19-21 ground-truth check (+5)**: Model A may approximate values rather than cite exact sleep score 31 + stress 46
2. **Clinical divergence discussion (+3)**: Model A describes both sources independently but doesn't explicitly contrast/clash analysis
3. **Grounded questions (+3)**: Model A writes generic health questions ("How can I sleep better?") instead of data-specific ones
4. **MEMORY.md reasoning (+1)**: Model A may skip memory entirely
5. **Methodology thresholds (+1)**: Model A lists sources but omits numeric thresholds
6. **Recovery classification (+1)**: Model A hedges instead of making a definitive call
7. **Hallucination penalty (-3)**: Model A may fabricate metrics or dates
8. **Medical claim penalty (-3)**: Model A may overstep into diagnostic advice

**Expected outcome**: Model A scores ~36% (9/25) — clear fail. Model B scores ~76% (19/25) — clear pass. Good differentiation.

**Where**: Will be applied in second taxonomy section rubric design.

**Learned**: The -5 Critically Detrimental weight was avoided for the medical claims rubric since this is a Non-Safety task and medical advice would be a secondary concern. Using -3 for both negative criteria keeps the evaluation focused on the core task completion.

---
*Session*: [[session-manual-save-openclawatlas]]
