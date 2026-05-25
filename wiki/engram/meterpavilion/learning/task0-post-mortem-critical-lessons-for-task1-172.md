---
id: 172
type: learning
project: meterpavilion
scope: project
topic_key: ""
session_id: manual-save-meterpavilion
created_at: "2026-05-19 18:24:46"
updated_at: "2026-05-19 18:24:46"
revision_count: 1
tags:
  - meterpavilion
  - learning
aliases:
  - "Task0 Post-Mortem: Critical Lessons for Task1"
---

# Task0 Post-Mortem: Critical Lessons for Task1

**What**: Complete post-mortem of Task0 (adrian_williams, Single Turn, Exploration+Relationships, Multi-App Light, Memory Usage). Reviewer scored 3/5 overall, 4/5 trajectory quality.

**Root Cause Analysis**: 
The prompt used "Draft an email" — a passive verb. The agent satisfied this by including the email text inline in its response, never triggering the email skill/tool. This meant only health-guardian (1 app) was used, failing Multi-App Light's core requirement of 2+ servers.

**Secondary Issues**:
1. Desired Outcome lacked deterministic ground truth — no exact RHR (66/67/77 bpm), HRV (43/44 ms), or sleep timing (2:03am-3:44am) values
2. Desired Outcome had scope creep — included activity/weight metrics the prompt never asked for
3. Task Description also had matching scope creep

**5 Golden Rules for Task1+**:
1. Action verbs that FORCE tool execution: "send" NOT "draft", "book" NOT "schedule concept", "pay" NOT "prepare payment"
2. Multi-App Light requires tools from ≥2 different skill folders/servers — verify the verb choice forces this
3. Desired Outcome must contain EXACT deterministic ground truth numbers from universe data
4. Desired Outcome scope must EXACTLY match prompt — no extra metrics, no missing metrics
5. Task Description scope must EXACTLY match prompt — same rule

**Where**: Tasks/Task0/ — all artifacts available for reference

**Learned**: The reviewer's feedback pattern is: (a) check verb choice determines tool execution, (b) verify deterministic data in DO, (c) verify scope match between prompt-DO-description. These three checks catch ~90% of rejections.

---
*Session*: [[session-manual-save-meterpavilion]]
