---
id: 207
type: pattern
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-20 01:38:57"
updated_at: "2026-05-20 01:38:57"
revision_count: 1
tags:
  - cortexplugin
  - pattern
aliases:
  - "Phone→Bridge protocol contract test pattern"
---

# Phone→Bridge protocol contract test pattern

**What**: Created a test pattern where helper functions (buildSensorMessage, getReconnectDelay, shouldSendSensorData) act as the spec/contract for what the browser-side phone-client must implement. The tests require no DOM/WebSocket mocks — they test pure logic that exactly matches the bridge's message-relay validation.

**Why**: This abstracts the browser-specific code (DOM, WebSocket, sensor events) from the logic that must match the bridge contract exactly, making the contract testable in Node.js/jest without browser mocks.

**Where**: tests/phone-client/message-format.test.js — 28 tests covering message format, backoff, throttle, and integration scenarios

**Learned**: Three test categories for a browser sensor client: (1) protocol contract (message format bridge will accept), (2) algorithmic behavior (backoff delays, throttle timing), (3) integration (full lifecycle scenarios)

---
*Session*: [[session-manual-save-cortexplugin]]
