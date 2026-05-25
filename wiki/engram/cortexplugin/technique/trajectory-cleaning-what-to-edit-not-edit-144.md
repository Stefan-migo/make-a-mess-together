---
id: 144
type: technique
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-17 20:59:03"
updated_at: "2026-05-17 20:59:03"
revision_count: 1
tags:
  - cortexplugin
  - technique
aliases:
  - "Trajectory Cleaning — What to Edit & Not Edit"
---

# Trajectory Cleaning — What to Edit & Not Edit

**What**: The precise rules for what can and cannot be edited during trajectory cleanup.

✅ CAN EDIT:
- Assistant reasoning text (rewrite to remove hint leakage, fix gaps, ensure flow)
- The stitching point where model acknowledges a hint (rewrite to sound self-directed)
- The final response (fix minor factual errors against tool outputs)
- Thinking/reasoning text (must be rewritten if it references hints)

❌ CANNOT EDIT:
- Tool call inputs (command or arguments) — never change
- Tool call outputs (what the tool returned) — never change
- The initial user message (prompt + `<hint>...</hint>` block) — must remain exactly as sent
- Downloaded workspace files — never rename, edit, reformat, or remove

**Cleaning Steps in Order**:
1. Delete failed tool calls + retry text
2. Delete duplicate tool calls
3. Delete redundant/exploratory steps (if removing doesn't change final answer)
4. Rewrite hint leakage in model reasoning AND thinking text
5. Verify tool call consistency after cleanup
6. Ensure ≥2 sub-agent outputs meaningfully used
7. Handle broken file creation sequences properly (prefer fresh run if cleanup breaks logic)

---
*Session*: [[session-manual-save-cortexplugin]]
