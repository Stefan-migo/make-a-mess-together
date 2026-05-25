---
id: 170
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-19 10:45:18"
updated_at: "2026-05-19 10:45:18"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Post-clone setup documented — 3 issues addressed in docs + scripts"
---

# Post-clone setup documented — 3 issues addressed in docs + scripts

**What**: Documented 3 known post-clone issues in README.md, USER-GUIDE.md, and scripts/install-deps.sh. Also applied the agent frontmatter fix to current repo.

**Issue 1 (speckit)**: Added Section 5 to install-deps.sh that auto-installs speckit via `gh extension install github/spec-kit`. Documented in README "First-Time Setup" and USER-GUIDE Troubleshooting table.

**Issue 2 (config split)**: Added documentation in README "First-Time Setup" explaining how to merge root opencode.json into .opencode/opencode.json after clone. Added to USER-GUIDE Quick Start warning and Troubleshooting table.

**Issue 3 (mode: primary)**: Added Section 6 to install-deps.sh that auto-adds `mode: primary` to any agent .md file missing it. Applied fix to current repo's cortex-planner.md and cortex-developer.md. Documented in README and USER-GUIDE.

**Where**: 
- scripts/install-deps.sh — sections 5 (speckit) + 6 (agent frontmatter) added
- README.md — New "First-Time Setup" section + table rows added
- USER-GUIDE.md — Quick Start warning + Troubleshooting rows updated
- .opencode/agents/*.md — mode: primary added (line 3 of both files)

**Learned**: Automating fixes in install-deps.sh is better than documenting manual steps. The script now handles 2/3 issues automatically. Only the config merge remains a manual step because it requires user judgment about which file is canonical.

---
*Session*: [[session-manual-save-cortexplugin]]
