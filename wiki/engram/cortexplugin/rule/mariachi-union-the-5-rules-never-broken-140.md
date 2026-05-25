---
id: 140
type: rule
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-17 20:58:53"
updated_at: "2026-05-17 20:58:53"
revision_count: 1
tags:
  - cortexplugin
  - rule
aliases:
  - "MARIACHI UNION — The 5 Rules Never Broken"
---

# MARIACHI UNION — The 5 Rules Never Broken

**What**: The 5 sacred rules that must never be violated in Mariachi Union project.

1. Always wrap hints in `<hint>...</hint>` tags.
2. Send prompt + hint as ONE message at turn 1. Never send hint separately.
3. Never send follow-up hints, corrections, or clarifications after the model starts working.
4. Never edit the provided prompt.
5. Never rename or edit files before uploading.

**Additional critical rules**:
- NEVER delete the `<hint>` message during cleanup (Error #7).
- ALWAYS check thinking/reasoning text for hint leakage (Error #3).
- ALWAYS verify ≥2 sub-agents with meaningful output usage (Error #4, #10).
- Sub-agent creation calls must be self-contained (Error #9).
- The model must read every SKILL.md before using commands from that skill — no exceptions.

**Why**: Violating any of these causes automatic QC failure at score 2.

---
*Session*: [[session-manual-save-cortexplugin]]
