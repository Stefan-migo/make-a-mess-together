---
id: 162
type: learning
project: meterpavilion
scope: project
topic_key: ""
session_id: manual-save-meterpavilion
created_at: "2026-05-18 00:09:47"
updated_at: "2026-05-18 00:09:47"
revision_count: 1
tags:
  - meterpavilion
  - learning
aliases:
  - "Onboarding Context — Explicit Mistakes Documentation"
---

# Onboarding Context — Explicit Mistakes Documentation

**What**: Explicit mistake documentation from the MeterPavilion screening quiz onboarding session.

**∅ Mistake 1 — Completeness vs Correctness confusion (Question 10)**
  - Wrong answer: C (1-Incomplete) — thinking wrong count = missed request
  - Right answer: B (2-Partial) — model DID address both requests (ticket summary + email table), count mismatch is a Correctness issue
  - Fix: Always ask "Did the model ADDRESS the request?" for Completeness, not "Was the data ACCURATE?"
  - Rubric anchor: AttemptersGuidelines.md:464-467

**∅ Mistake 2 — Assuming hallucination without data verification (Question 9)**
  - Wrong answer: C (1-Reject) assuming 14 guests hallucinated
  - Right answer: A single surface error — Mark Allen's booking source (Expedia vs Booking.com) out of 14 entries
  - Fix: NEVER assume hallucination — query the actual database/Universe Explorer first
  - Fix: Cross-reference every single data point before grading Correctness
  - Rubric anchor: AttemptersGuidelines.md:224-225, 459-461

**∅ Correct Answers Confirmed**:
  - Q1: D (Universe Explorer = source of truth)
  - Q2: C (Natural language, no tool names)
  - Q3: B (Discovery = use existing, Gap = create new)
  - Q4: D (Finance logic = Advice domain)
  - Q5: C (One-time analysis ≠ Skill Gap)
  - Q6: A (Reset All + modify prompt = single-turn fix)
  - Q7: C (All 3 buckets: exact data, tool, persona)
  - Q8: C (Hallucinated candidates = Correctness 1)
  - Q11: C (3 identical queries = degenerate loop)
  - Q12: B (Calendar call with no date context = incoherent)
  - Q13: D (Most specific bucketed justification)

**Why**: User explicitly requested to "learn from mistakes" and save into memory for future sessions.

---
*Session*: [[session-manual-save-meterpavilion]]
