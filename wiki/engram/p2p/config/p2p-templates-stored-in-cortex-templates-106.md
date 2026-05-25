---
id: 106
type: config
project: p2p
scope: project
topic_key: ""
session_id: manual-save-p2p
created_at: "2026-05-08 20:01:03"
updated_at: "2026-05-08 20:01:03"
revision_count: 1
tags:
  - p2p
  - config
aliases:
  - "P2P templates stored in .cortex/templates/"
---

# P2P templates stored in .cortex/templates/

**What**: Copied 4 P2P task templates into .cortex/templates/
**Why**: To have ready-to-use templates for Dockerfile, e2e.sh, parsing.py, and run_script.sh
**Where**: .cortex/templates/ (Dockerfile, e2e_new.sh, parsing_template.py, run_script.sh)
**Learned**: Templates must NOT be modified (especially e2e.sh). Dockerfile template has TODO markers for customization. parsing_template.py requires implementing parse_test_output() only. run_script.sh requires implementing run_all_tests().

---
*Session*: [[session-manual-save-p2p]]
