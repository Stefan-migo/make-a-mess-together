---
id: 235
type: learning
project: meterpavilion
scope: project
topic_key: ""
session_id: manual-save-meterpavilion
created_at: "2026-05-20 04:47:18"
updated_at: "2026-05-20 04:47:18"
revision_count: 1
tags:
  - meterpavilion
  - learning
aliases:
  - "Task1 — second trajectory passes all linters"
---

# Task1 — second trajectory passes all linters

**What**: Second run of Task1 (chris_ryu, Single Turn, Multi-App Complex, Native Tools) with the linter-fixed prompt. All 9 previous linter points resolved. Trajectory scores 3/3/3/3 on rubric. All data claims trace to tool outputs. No degenerate loops, no hallucinations.

**Why**: First trajectory failed trajectory factual claims + prompt clarity linters. Fixed by: (1) replacing subjective music terms with genre labels, (2) framing queue analysis as a current snapshot, (3) acknowledging no reply expected from Elliot, (4) creating a real executable script + agentTurn cron job, (5) scanning full calendar data without truncation to find correct May 1 boundary.

**Where**: Tasks/Task1/ — new trajectory: trajectory-sb-kXiUNXpDkk52gqjSmgNoTY.json

**Learned**:
1. Key fix for cron: use `openclaw cron add` with `--message` not `--system-event` to trigger actual script execution
2. Calendar must use `show --limit 200` (not truncated `head -c 5000`) to see the full data boundary
3. Script should be in `scripts/` subdirectory with proper error handling for unreachable speaker
4. Prompt specificity (genre labels, volume scale, fallback behavior) prevents agent overclaiming
5. crontab may not be available — agent should try `openclaw cron add` instead

---
*Session*: [[session-manual-save-meterpavilion]]
