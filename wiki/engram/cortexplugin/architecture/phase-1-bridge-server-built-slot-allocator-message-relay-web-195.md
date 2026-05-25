---
id: 195
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 00:33:42"
updated_at: "2026-05-20 00:33:42"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Phase 1: Bridge server built — slot allocator, message relay, WebSocket"
---

# Phase 1: Bridge server built — slot allocator, message relay, WebSocket

**What**: Built Phase 1 — the bridge server (server-bridge/) that connects phone sensors to p5 sketch players via WebSocket on port 8080.

**Where**:
- server-bridge/slot-allocator.js — O(1) Set-based allocator with 5s cooldown, 30 slots
- server-bridge/message-relay.js — Message validation, role detection, message formatting
- server-bridge/index.js — HTTP + WebSocket server, heartbeat (10s), zombie detection (15s)
- server-bridge/public/index.html — Discovery page with QR code, live device list
- server-bridge/package.json — ws dependency
- tests/bridge/slot-allocator.test.js — 15 tests (burst allocation, cooldown, edge cases)
- tests/bridge/message-protocol.test.js — 19 tests (validation, role detection, formatting)

**Architecture**:
- Single port :8080 for both sensors and players (role detected from first message)
- Slot allocator: O(1) pop from free Set, automatic cooldown expiry via setTimeout
- Message relay: validates incoming sensor data (all 9 axes numeric), formats outgoing messages
- Heartbeat: ping every 10s, zombie connections closed after 15s no-data
- Backpressure guard: skip sending if bufferedAmount > 64KB
- State broadcast: periodic (5s) state updates to discovery page
- Protocol version field v:1 from day one

**Integration verified**: 5 simulated phones sent 1,181 messages at ~3ms avg latency with 0 errors. Sequential slot assignment (0-4), clean disconnect handling.

**TDD**: 34 bridge tests + 50 Phase 0 tests = 84 passing across all modules.

---
*Session*: [[session-manual-save-cortexplugin]]
