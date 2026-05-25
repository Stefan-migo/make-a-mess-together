---
id: 236
type: learning
project: meterpavilion
scope: project
topic_key: ""
session_id: manual-save-meterpavilion
created_at: "2026-05-20 05:05:15"
updated_at: "2026-05-20 05:05:15"
revision_count: 1
tags:
  - meterpavilion
  - learning
aliases:
  - "Domain alignment linter fix — health framing"
---

# Domain alignment linter fix — health framing

**What**: Fixed domain alignment linter for Task1 (Health + Exploration + Relationships). The linter flagged that the prompt didn't sufficiently surface the Health domain despite it being assigned. Fix applied: (1) opened with "insomnia's kicking my ass again — I was up at 4am" to center the health driver, (2) added timezone clarification for calendar scan, (3) added health outcome to breathing exercise automation ("— I need something to help me actually wind down and stay asleep"), (4) added "just tell me what's there" and "just give me what's in the history" to prevent speculation.

**Where**: Tasks/Task1/Task1Taxonomy.md lines 89-99

**Learned**: When Health is assigned alongside other domains (Exploration, Relationships), the prompt must make the wellness concern the DRIVER of all asks, not just a passing mention. The breathing exercise and insomnia shouldn't be side notes — they should be framed as the reason for the automation.

---
*Session*: [[session-manual-save-meterpavilion]]
