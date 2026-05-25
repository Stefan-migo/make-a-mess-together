---
id: 161
type: learning
project: meterpavilion
scope: project
topic_key: ""
session_id: manual-save-meterpavilion
created_at: "2026-05-18 00:09:32"
updated_at: "2026-05-18 00:09:32"
revision_count: 1
tags:
  - meterpavilion
  - learning
aliases:
  - "Screening Quiz — Mistakes & Corrections (Onboarding)"
---

# Screening Quiz — Mistakes & Corrections (Onboarding)

**What**: Completed the MeterPavilion screening quiz (13 questions) with two key mistakes corrected via user feedback.

**Mistake #1 — Question 10 (Completeness)**: Initially answered C (1-Incomplete) for the maintenance tickets + emails scenario. The model DID address both explicit requests (provided ticket summary AND email table), just with a count mismatch (14 vs 9). The correct answer was B (2-Partial) because the goals were met but a filtering step was missed. Lesson: Completeness measures whether the request WAS ADDRESSED, not whether data is ACCURATE. Count mismatches are Correctness issues, not Completeness failures.

**Mistake #2 — Question 9 (Database verification)**: Initially assumed hallucination without checking the actual database. When the user provided the real hotel database URL at https://mila-avag.github.io/hotel-manager-environment/data/reservations.json, I fetched it and found 14 guests with check_in_date = 2026-02-27 — all correctly listed by the model except ONE error (Mark Allen's booking source was Expedia in model but Booking.com in database). Lesson: NEVER assume hallucination — always cross-reference against the actual data source (Universe Explorer). A single surface error (wrong source for 1 of 14 guests) is Correctness=2 (Acceptable), not necessarily Correctness=1 (Reject with hallucinations).

**Key Learnings**:
- **Completeness rubric**: Asking "was the request addressed?" vs "was the data accurate?" — these are different metrics
- **Always verify via data source**: The Universe Explorer / live database is the only ground truth (per AttemptersGuidelines.md:224-225)
- **Degenerate loop detection**: 3 identical tool calls = auto-fail Efficiency=1 (AttemptersGuidelines.md:443)
- **Incoherent tool calls**: Calendar tool when no date mentioned = logic failure (AttemptersGuidelines.md:445)
- **3-bucket Desired Outcome**: Must contain exact data (B1), named skill folder+tool (B2), and persona/memory influence (B3)
- **Single-turn rule**: Cannot add chat turns — must Reset All and modify original prompt
- **Skill Discovery vs Skill Gap**: Discovery = use existing tool; Gap = create new one

**Why**: User requested the quiz, provided corrective feedback on Q9 (real database URL) and Q10 (completeness explanation). All answers cite specific documentation lines.

---
*Session*: [[session-manual-save-meterpavilion]]
