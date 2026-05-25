---
id: 166
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-18 21:18:06"
updated_at: "2026-05-18 21:18:06"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Wiki isolation — removed cross-project Engram data"
---

# Wiki isolation — removed cross-project Engram data

**What**: Isolated the CortexPlugin wiki by removing non-CortexProject Engram data from wiki/engram/. Archived 69 files from 6 foreign projects (mariachiunion, p2p, p2p-cortex, test-cortex, verify2, unknown) to wiki/engram-archive/. Also removed 10 non-CortexPlugin session hub files from _sessions/ and updated .engram-sync-state.json accordingly.

**Why**: Cross-project Engram export data was polluting the CortexPlugin wiki, creating 174 broken cross-references and 96 orphan pages. The wiki should only contain CortexPlugin-canonical data.

**Where**: wiki/engram/ — removed mariachiunion/, p2p/, p2p-cortex/, test-cortex/, verify2/, unknown/ directories and cleaned _sessions/ to only keep 4 CortexPlugin session files.

**Learned**: The wiki-link tool's "broken link" count is inflated by Obsidian's flat namespace resolution — wikilinks like [[session-manual-save-cortexplugin]] resolve to _sessions/manual-save-cortexplugin.md perfectly fine. The true fix was removing foreign project data, not fixing the links themselves.

---
*Session*: [[session-manual-save-cortexplugin]]
