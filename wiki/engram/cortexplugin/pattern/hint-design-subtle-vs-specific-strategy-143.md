---
id: 143
type: pattern
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-17 20:59:01"
updated_at: "2026-05-17 20:59:01"
revision_count: 1
tags:
  - cortexplugin
  - pattern
aliases:
  - "Hint Design — Subtle vs Specific Strategy"
---

# Hint Design — Subtle vs Specific Strategy

**What**: Two hint styles for Mariachi Union tasks. Always single-turn: hint sent with prompt at turn 1 only.

**Subtle Hints (preferred)**:
- Sound like the persona naturally framing the request
- Reference data sources by product/persona-world name, not file paths or skill names
- Point at desired outcome, not technical process
- Examples: "Give me the full picture of my finances" instead of "Read stripe SKILL.md and use stripe_data.py"

**Specific Hints (fallback)**:
- Only use when subtle hints have failed after 3-4 fresh re-runs
- Explicitly name skills, tools, scripts
- Provide technical roadmap: read → query → output
- Example: `<hint>Read the stride-support skill for shopify integration. Use shopify_data.py search-orders to pull catalog.</hint>`

**Critical**: Each fresh attempt = Reset All → Start Fresh with new hint in turn-1 block. Never send as separate message.

**Hint Tag Rules**:
- Always wrapped in `<hint>...</hint>`
- NEVER delete hint message during cleanup (Error #7)
- Model's reasoning/thinking must not acknowledge the hint (Error #3)

---
*Session*: [[session-manual-save-cortexplugin]]
