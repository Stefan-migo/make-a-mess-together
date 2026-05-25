---
id: 159
type: decision
project: meterpavilion
scope: project
topic_key: ""
session_id: manual-save-meterpavilion
created_at: "2026-05-17 22:48:53"
updated_at: "2026-05-17 22:48:53"
revision_count: 1
tags:
  - meterpavilion
  - decision
aliases:
  - "Documentation Supremacy mandate enforced"
---

# Documentation Supremacy mandate enforced

**What**: Added "Documentation Is the Only Truth" CARDINAL RULE to the entire MeterPavilion agent system. Modified AGENTS.md, meter-planner.md, and meter-developer.md to enforce documentation-first behavior.

**Why**: User requested that all agents MUST reference documentation guidelines as the sole source of truth, and every deliverable must be audited against them.

**Where**: 
- AGENTS.md — Added CARDINAL RULE at top, strengthened Knowledge Base section, added Step 0 (TRUTH CHECK) + Step 3 (AUDIT) to Execution Gate
- .opencode/agents/meter-planner.md — Added Documentation Supremacy warning + Core Responsibility 0
- .opencode/agents/meter-developer.md — Added Documentation Supremacy warning + Core Responsibility 0 + strengthened Execution Gate

**Learned**: The golden rule is now: "Before every action: Read the relevant doc. Cite it. Before every deliverable: Audit every claim against the doc. If it's not in the doc, it's not valid."

---
*Session*: [[session-manual-save-meterpavilion]]
