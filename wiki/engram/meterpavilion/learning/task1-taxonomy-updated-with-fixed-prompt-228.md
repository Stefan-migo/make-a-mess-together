---
id: 228
type: learning
project: meterpavilion
scope: project
topic_key: ""
session_id: manual-save-meterpavilion
created_at: "2026-05-20 04:30:09"
updated_at: "2026-05-20 04:30:09"
revision_count: 1
tags:
  - meterpavilion
  - learning
aliases:
  - "Task1 — taxonomy updated with fixed prompt"
---

# Task1 — taxonomy updated with fixed prompt

**What**: Updated Task1Taxonomy.md with the linter-approved prompt, task description, and desired outcome. Prompt now uses genre-based criteria (ambient/classical vs jazz/electronic), snapshot-only framing (no recurring pattern claims), specific volume (3 on 0-100), single cron time (12:05 AM), fallback behavior for unreachable speaker, and "no reply expected" caveat for Elliot message.

**Why**: Two rounds of linter warnings (Trajectory Factual Claims + Prompt Clarity Feasibility) identified overclaiming in the original trajectory and ambiguity in the prompt. Fixed all 14 linter points across prompt, description, and desired outcome.

**Where**: Tasks/Task1/Task1Taxonomy.md — lines 89-97 (prompt), 171-173 (task description), 202-208 (desired outcome)

**Learned**: 
1. Linters are iterative — first round flags trajectory issues, second round flags prompt clarity
2. "Chill"/"mellow" must be replaced with objective genre labels
3. Volume needs scale context (0-100 for Sonos)
4. Cron time must be unambiguous — resolve "11 PM but check after midnight" to a single time
5. Notification must specify real action (message), not echo/system_event text
6. Every claim in the response must trace to a tool output — no inferences about playlists or patterns

---
*Session*: [[session-manual-save-meterpavilion]]
