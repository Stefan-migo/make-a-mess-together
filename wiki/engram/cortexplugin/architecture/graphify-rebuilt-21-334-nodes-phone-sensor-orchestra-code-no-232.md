---
id: 232
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 04:30:51"
updated_at: "2026-05-20 04:30:51"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Graphify rebuilt: 21→334 nodes, phone-sensor-orchestra code now captured"
---

# Graphify rebuilt: 21→334 nodes, phone-sensor-orchestra code now captured

**What**: Rebuilt graphify knowledge graph from 21 nodes (CortexPlugin infrastructure only) to 334 nodes with 31 communities covering all phone-sensor-orchestra source code.

**Key god nodes now**: SoundEngine (63 edges), Visuals (16), SlotAllocator (11), StatsAggregator (12), SensorMapper, DeviceManager, MessageRelay, Phone Client, etc.

**Where**: wiki/graph/graph.json, wiki/graph/GRAPH_REPORT.md

**Learned**: graphify MCP server uses cached graph data and needs restart to reflect updated wiki/graph/graph.json. Running python3 -m graphify . --update works correctly for rebuilding.

---
*Session*: [[session-manual-save-cortexplugin]]
