---
id: 227
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 04:24:01"
updated_at: "2026-05-20 04:24:01"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Graphify graph missing phone-sensor-orchestra source nodes"
---

# Graphify graph missing phone-sensor-orchestra source nodes

**What**: The Graphify knowledge graph at wiki/graph/ contains only CortexPlugin infrastructure nodes (21 nodes total — wiki/sessions/bootstrap). The phone-sensor-orchestra source code (server-bridge/, phone-client/, p5-sketch/) is not represented at all. Needs rebuild.

**Stats**: 21 nodes, 61 edges, 0 communities. God nodes are: manual-save-cortex-plugin (11 edges), cortex-wiki-created-1 (9 edges), graphify-gsd-2 (9 edges), etc. — all CortexPlugin docs. No phone-sensor-orchestra code in graph.

**Why**: The graph was built from the initial repo structure before the phone-sensor-orchestra code was written. A full rebuild is needed.

**Where**: wiki/graph/graph.json, wiki/graph/GRAPH_REPORT.md

---
*Session*: [[session-manual-save-cortexplugin]]
