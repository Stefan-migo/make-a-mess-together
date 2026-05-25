---
id: 58
type: error
project: mariachiunion
scope: project
topic_key: ""
session_id: manual-save-MariachiUnion
created_at: "2026-05-08 12:46:52"
updated_at: "2026-05-08 12:46:52"
revision_count: 1
tags:
  - mariachiunion
  - error
aliases:
  - "Error #3: Hint Leakage in Thinking Text"
---

# Error #3: Hint Leakage in Thinking Text

Most common QC failure. The trajectory mentions hints in model responses or thinking/reasoning text. Ctrl+F JSON for 'hint', 'suggest', 'mention', 'recommend'. Common leakage phrases: 'from hint', 'per hint', 'the hint says', 'the hint mentions', 'as you suggested', 'good idea', 'youre right', 'as you mentioned', 'great point'. Thinking/reasoning text counts too. Always check internal model reasoning.

---
*Session*: [[session-manual-save-MariachiUnion]]
