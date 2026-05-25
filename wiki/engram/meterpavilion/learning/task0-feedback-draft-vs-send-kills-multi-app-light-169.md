---
id: 169
type: learning
project: meterpavilion
scope: project
topic_key: ""
session_id: manual-save-meterpavilion
created_at: "2026-05-19 01:39:35"
updated_at: "2026-05-19 01:39:35"
revision_count: 1
tags:
  - meterpavilion
  - learning
aliases:
  - "Task0 Feedback: Draft vs Send kills Multi-App Light"
---

# Task0 Feedback: Draft vs Send kills Multi-App Light

**What**: Task0 (adrian_williams, Multi-App Light, Memory Usage) scored 3/5 overall and 4/5 trajectory quality. The core failure: the prompt used "Draft an email" instead of action-oriented language like "Send an email" or "Get that email out." Because of this, the agent included the email inline in its text response instead of triggering the email skill/tool. This meant only 1 app (health-guardian) was actually used, failing the Multi-App Light requirement for cross-domain tool chaining. Additionally, the Desired Outcome lacked ground truth values (no specific RHR 66/67/77 bpm, no HRV 43/44 ms, no sleep timing data) and had scope creep (added activity/weight beyond the prompt).

**Why**: Multi-App Light requires the agent to use tools from at least 2 different servers/skill folders. "Draft" is a passive instruction that the agent can satisfy by writing text inline. "Send" forces the agent to find and use the email tool. The Desired Outcome must be deterministic with exact data points from the universe, and its scope must match the prompt exactly — no extra metrics.

**Where**: Tasks/Task0 — tradoff between prompt phrasing and tool execution

**Learned**: 
1. For Multi-App tasks, always use action verbs that force tool execution: "send" not "draft", "book" not "schedule concept", "pay" not "prepare payment"
2. Desired Outcome must contain deterministic ground truth with exact numbers from the universe data (e.g., "66 bpm, 67 bpm, 77 bpm for RHR")
3. Desired Outcome scope must match the prompt exactly — no adding metrics the prompt didn't ask for
4. Task Description must also match scope precisely — remove activity and weight if the prompt doesn't mention them

---
*Session*: [[session-manual-save-meterpavilion]]
