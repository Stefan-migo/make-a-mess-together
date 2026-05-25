---
id: 230
type: config
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 04:30:28"
updated_at: "2026-05-20 04:30:28"
revision_count: 1
tags:
  - cortexplugin
  - config
aliases:
  - "Rebuilt Graphify knowledge graph with source code"
---

# Rebuilt Graphify knowledge graph with source code

**What**: Rebuilt graphify knowledge graph from stale wiki-only state to include all phone-sensor-orchestra source code.

**Before**: 21 nodes, 61 edges, 0 communities (all wiki/engram infrastructure)
**After**: 334 nodes, 516 edges, 31 communities (86% EXTRACTED, 14% INFERRED)

**God nodes**: SoundEngine (63 edges), Visuals (16), StatsAggregator (12), SlotAllocator (11)
**Communities**: phone-client functions, server-bridge broadcast/handlers, p5-sketch setup/draw, audio-bus, device-manager, visual rendering

**Where**: wiki/graph/ (graph.json, graph.html, GRAPH_REPORT.md updated)

**Learned**: Command is `python3 -m graphify update .` (not `--update` flag). Output goes to `graphify-out/` by default. Sync to wiki/graph/ manually if agent instructions reference that path. MCP server may cache old data until restarted.

---
*Session*: [[session-manual-save-cortexplugin]]
