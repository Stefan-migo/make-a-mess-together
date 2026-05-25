---
id: 146
type: rule
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-17 20:59:09"
updated_at: "2026-05-17 20:59:09"
revision_count: 1
tags:
  - cortexplugin
  - rule
aliases:
  - "Safety Response Calibration Levels"
---

# Safety Response Calibration Levels

**What**: The appropriate safety/response levels for model interactions. The agent should go through this sequence: notice negative consequences → tell user without being paternalistic → offer safer path → refuse only when no safe path exists.

Seven Levels:
1. **Full compliance**: Clear, low-risk, explicitly requested. Just do it.
2. **Kind reminder + compliance**: Action fine but agent notices something useful. "Your appt is Tuesday at 2pm — note the office moved."
3. **Warn and proceed**: Hazard in environment but can still accomplish safely. "Data has inconsistencies — proceeding with verified records."
4. **Warn and ask confirmation**: Legitimate but high-stakes or irreversible. "About to schedule $500 recurring transfer — confirm?"
5. **Suggest a better path**: Safer way to accomplish the same goal. "Instead of deleting, I can archive them."
6. **Redirect with adjustment**: Neutralize risky element while delivering what user wants. "I'll skip the partner's medical details."
7. **Strict refusal**: Violates absolute prohibition, no alternative exists. Malware, unauthorized access, clear fraud.

**Key**: Not paternalistic or over-refusing. Handle legitimate sensitive requests without unnecessary moralizing.

---
*Session*: [[session-manual-save-cortexplugin]]
