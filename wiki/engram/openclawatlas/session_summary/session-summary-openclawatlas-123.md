---
id: 123
type: session_summary
project: openclawatlas
scope: project
topic_key: ""
session_id: manual-save-openclawatlas
created_at: "2026-05-17 00:33:45"
updated_at: "2026-05-17 00:33:45"
revision_count: 1
tags:
  - openclawatlas
  - session_summary
aliases:
  - "Session summary: openclawatlas"
---

# Session summary: openclawatlas

## Goal
Iteratively audit, correct, and pass the Rubric Evaluator for Task0's Rubrics.md (wellness summary generation task in the melissa_jackson universe). The rubric set went from 20 items (v1, 0.65 fail-rate) through 6 major versions to 40 items (v7, 0% projected fail-rate).

## Instructions
- Rubrics must be atomic, self-contained, objective, verifiable, use positive language.
- Weights in {-5, -3, -1, +1, +3, +5}. Categories: task completion, instruction following, factuality and hallucination, tool use, agent behavior, safety & boundaries. Targets: outcome or trace.
- At least one negative-weight criterion required.
- Evaluator uses fail-rate = (D + M) / I, threshold ≥0.05 = FAIL.
- Task0 prompt is single-turn — model given one prompt and must act independently ("heading into a deployment push and won't be able to respond").
- Rubrics must test what the model was ASKED to do (prompt + Desired Outcome), NOT what the Core Functionalities spec says the builder should implement.

## Discoveries
- The Recovery Score formula (sleep×0.25 + (100-stress)×0.35 + body_battery×0.40) lives in Core Functionalities (builder design spec), not in the prompt or Desired Outcome — the model was never asked to compute it. Push back any evaluator missing-item claims about it.
- Rolling 7-day averages for sleep/stress/body battery are also Core Functionalities content — not in prompt or DO. Push back.
- Core Functionalities line 284 explicitly forbids raw daily values in MEMORY.md — rubrics that reward including specific metric values in MEMORY.md are polarity-inverted defects.
- The evaluator sometimes reads stale data (e.g., claimed item 24 had old title when file already had the fixed v4 version).
- Redundancy check: Item 11 (mentions Oct 20 visit) is logically entailed by Item 12 (contrasts clinical snapshot with wearable data). Always remove entailed items.
- Evaluator applies strict conjunction-split and contextual-universal rules aggressively — bundling multiple elements in one criterion is consistently flagged. When the elements are a required complete set (e.g., all 3 data sources, all 3 thresholds), push back as overfitting.
- The evaluator runs against the CURRENT file on disk — always verify the file state matches expectations before analyzing results.

## Accomplished
- ✅ v1 (20 items): Audited original rubric set, found 0.65 fail-rate with 11 defective + 2 missing
- ✅ v2 (29 items): First correction pass, reduced to 0.241 fail-rate
- ✅ v3 (34 items): Further splits and corrections, reduced to 0.235 fail-rate
- ✅ v4 (36 items): Fixed atomicity on items 9-10, self-containedness on items 22/30/34; push back on 3 missing items (formula, missing data, section headers)
- ✅ v5 (37 items): Split item 23 (each flagged period → Jan 20-21 + Feb 19), rephrased item 36 (environment reference → trajectory-verifiable), removed stale duplicate. Evaluator: 0.1111 fail-rate (3 defective + 1 missing)
- ✅ v5 analysis: Pushed back item 24 (already fixed — false positive) and missing Recovery Score formula (CF, not prompt)
- ✅ v6 (40 items): Clean sequential IDs 0001-0040. Split item 25 (overall trend + flagged period reasoning), rephrased items 21-22 (explicit sources/thresholds), added items 39-40 (Garmin + Calendar tool use traces). Evaluator: 0.20 fail-rate (7 defective + 1 missing)
- ✅ v6 analysis: Accepted 3 genuine issues (items 23/24 polarity inversion, item 26 "each flagged period" split, items 11/13 redundancy). Pushed back 4 overfitting claims (items 21/22/39 atomicity, missing Recovery Score formula)
- ✅ v7 (40 items): Removed item 11 (redundant), rephrased items 22-23 (removed metric value clause), split item 26 reasoning into 25 (Jan 20-21) + 26 (Feb 19). Clean IDs 0001-0040. Projected 0% fail-rate.

## Next Steps
- Run Rubric Evaluator on v7 to confirm PASS state (projected D=0, M=0)
- If PASS, proceed to model rating phase — evaluate both models against the 40 rubrics
- If FAIL, analyze new findings and iterate to v8

## Relevant Files
- Tasks/Task0/Rubrics.md — v7, 40 items, IDs 0001-0040
- Tasks/Task0/Task0Taxonomy.md — Full task taxonomy incl. Desired Outcome and Core Functionalities
- Tasks/Task0/ModelA/trajectory-2026-05-16T19-52-53-195Z.json — Model A trajectory
- Documentation/AttempterIstructions.md — Project guidelines for rubric quality
- Documentation/Course1.md — Task workflow documentation
- Documentation/ReviewerInstructions.md — QC rubrics and grading scale

---
*Session*: [[session-manual-save-openclawatlas]]
