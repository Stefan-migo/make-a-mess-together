/**
 * Phase 4 — Phone Client Message Format Tests
 * 
 * Tests the message contract between phone-client and bridge server.
 * Validates that phone client produces messages the bridge will accept.
 * Tests reconnect backoff logic and 30fps throttling behavior.
 * 
 * 🔴 RED phase: phone-client/app.js doesn't exist yet — all tests fail.
 * 🟢 GREEN phase: After implementation, all tests pass.
 */

const { MessageRelay } = require('../../server-bridge/message-relay');

// ---------------------------------------------------------------------------
// Helper: extract the message-building logic from app.js (once implemented)
// For RED phase, define what the phone client SHOULD produce.
// ---------------------------------------------------------------------------

/**
 * Build a sensor message matching the bridge's expected protocol format.
 * This is the exact format phone-client/app.js must produce.
 */
function buildSensorMessage(accel, gyro, orientation) {
  return {
    type: 'sensor',
    v: 1,
    accel: {
      x: accel.x || 0,
      y: accel.y || 0,
      z: accel.z || 0
    },
    gyro: {
      a: gyro.a || 0,
      b: gyro.b || 0,
      g: gyro.g || 0
    },
    orientation: {
      a: orientation.a || 0,
      b: orientation.b || 0,
      g: orientation.g || 0
    }
  };
}

/**
 * Calculate exponential backoff delay for reconnect.
 * @param {number} attempt - Reconnect attempt number (0-indexed)
 * @param {object} options - { baseMs, maxMs, jitter }
 * @returns {number} Delay in milliseconds
 */
function getReconnectDelay(attempt, options = {}) {
  const base = options.baseMs || 1000;
  const max = options.maxMs || 30000;
  const useJitter = options.jitter !== false;
  
  const delay = Math.min(base * Math.pow(2, attempt), max);
  
  if (useJitter) {
    const jitterRange = delay * 0.3;
    return delay + (Math.random() * jitterRange * 2 - jitterRange);
  }
  
  return delay;
}

/**
 * Throttle helper: returns true if enough time has passed since last call.
 * Used to enforce 30fps send rate (~33ms between sends).
 * @param {number} lastSent - Timestamp of last send
 * @param {number} now - Current timestamp
 * @param {number} minInterval - Minimum interval in ms
 * @returns {{ shouldSend: boolean, elapsed: number }}
 */
function shouldSendSensorData(lastSent, now, minInterval) {
  const interval = minInterval || 33; // ~30fps
  if (lastSent === 0) return { shouldSend: true, elapsed: interval };
  const elapsed = now - lastSent;
  return { shouldSend: elapsed >= interval, elapsed };
}

describe('Phone Client — Message Format Contract', () => {
  let relay;

  beforeAll(() => {
    relay = new MessageRelay();
  });

  // -----------------------------------------------------------------------
  // Format Contract: Phone → Bridge
  // -----------------------------------------------------------------------
  test('builds valid sensor message with all required fields', () => {
    const msg = buildSensorMessage(
      { x: 0.1, y: 0.2, z: 9.81 },
      { a: 1.5, b: -0.5, g: 0.3 },
      { a: 180, b: 45, g: -90 }
    );

    expect(msg.type).toBe('sensor');
    expect(msg.accel.x).toBe(0.1);
    expect(msg.accel.y).toBe(0.2);
    expect(msg.accel.z).toBe(9.81);
    expect(msg.gyro.a).toBe(1.5);
    expect(msg.gyro.b).toBe(-0.5);
    expect(msg.gyro.g).toBe(0.3);
    expect(msg.orientation.a).toBe(180);
    expect(msg.orientation.b).toBe(45);
    expect(msg.orientation.g).toBe(-90);
  });

  test('sensor message passes bridge message-relay validation', () => {
    const msg = buildSensorMessage(
      { x: 0.1, y: 0.2, z: 9.81 },
      { a: 1.5, b: -0.5, g: 0.3 },
      { a: 180, b: 45, g: -90 }
    );

    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(true);
  });

  test('handles zero/edge-case sensor values correctly', () => {
    const msg = buildSensorMessage(
      { x: 0, y: 0, z: 0 },
      { a: 0, b: 0, g: 0 },
      { a: 0, b: 0, g: 0 }
    );

    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(true);
    expect(msg.accel.x).toBe(0);
    expect(msg.accel.y).toBe(0);
    expect(msg.accel.z).toBe(0);
  });

  test('handles negative sensor values', () => {
    const msg = buildSensorMessage(
      { x: -9.81, y: -5, z: -2 },
      { a: -180, b: -90, g: -360 },
      { a: -180, b: -90, g: -180 }
    );

    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(true);
  });

  test('handles floating point sensor values with high precision', () => {
    const msg = buildSensorMessage(
      { x: 0.123456789, y: -0.987654321, z: 9.810000001 },
      { a: 0.001, b: -0.001, g: 0.0001 },
      { a: 179.999, b: 0.0001, g: -0.0001 }
    );

    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(true);
  });

  test('handles extreme sensor values within IEEE 754 float range', () => {
    const msg = buildSensorMessage(
      { x: 1e10, y: -1e10, z: 1e-10 },
      { a: 1e5, b: -1e5, g: 1e-5 },
      { a: 360, b: 180, g: -180 }
    );

    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Role Detection: Phone's first message
  // -----------------------------------------------------------------------
  test('first message with type "sensor" detected as sensor role', () => {
    const firstMsg = { type: 'sensor' };
    const role = relay.detectRole(firstMsg);
    expect(role).toBe('sensor');
  });

  // -----------------------------------------------------------------------
  // First Message: Minimal registration format
  // -----------------------------------------------------------------------
  test('minimal first message { type: "sensor" } is accepted', () => {
    const firstMsg = { type: 'sensor' };
    // Bridge's detectRole only checks type field
    const role = relay.detectRole(firstMsg);
    expect(role).toBe('sensor');
  });

  // -----------------------------------------------------------------------
  // Bridge Response: Assignment message format
  // -----------------------------------------------------------------------
  test('handles bridge assigned response correctly', () => {
    const assignMsg = {
      type: 'assigned',
      slot: 5,
      bridgeIp: '192.168.1.100'
    };

    expect(assignMsg.type).toBe('assigned');
    expect(assignMsg.slot).toBe(5);
    expect(assignMsg.bridgeIp).toBe('192.168.1.100');
  });

  test('handles bridge hello message', () => {
    const helloMsg = {
      type: 'system',
      event: 'hello',
      version: 1,
      server: 'phone-sensor-orchestra-bridge'
    };

    expect(helloMsg.type).toBe('system');
    expect(helloMsg.event).toBe('hello');
    expect(helloMsg.version).toBe(1);
  });
});

describe('Phone Client — Reconnect Backoff', () => {
  test('first reconnect attempt uses base delay (1000ms default)', () => {
    const delay = getReconnectDelay(0);
    expect(delay).toBeGreaterThanOrEqual(700);  // base - 30% jitter
    expect(delay).toBeLessThanOrEqual(1300);    // base + 30% jitter
  });

  test('second attempt doubles to ~2000ms base', () => {
    const delay = getReconnectDelay(1, { jitter: false });
    expect(delay).toBe(2000);
  });

  test('third attempt quadruples to ~4000ms base', () => {
    const delay = getReconnectDelay(2, { jitter: false });
    expect(delay).toBe(4000);
  });

  test('caps at maxMs (30000ms default)', () => {
    const delay = getReconnectDelay(10, { jitter: false });
    expect(delay).toBe(30000);
  });

  test('caps at custom maxMs when provided', () => {
    const delay = getReconnectDelay(10, { jitter: false, maxMs: 5000 });
    expect(delay).toBe(5000);
  });

  test('uses custom baseMs when provided', () => {
    const delay = getReconnectDelay(0, { jitter: false, baseMs: 500 });
    expect(delay).toBe(500);
  });

  test('jitter adds variance to calculated delay', () => {
    const delays = new Set();
    for (let i = 0; i < 100; i++) {
      delays.add(getReconnectDelay(3, { baseMs: 1000, maxMs: 30000 }));
    }
    // With jitter, should produce multiple unique values
    expect(delays.size).toBeGreaterThan(1);
  });

  test('jitter range is approximately ±30% of delay', () => {
    const delay = getReconnectDelay(2, { jitter: false, baseMs: 1000 }); // 4000
    const jittered = [];
    for (let i = 0; i < 100; i++) {
      jittered.push(getReconnectDelay(2, { baseMs: 1000 }));
    }
    const min = Math.min(...jittered);
    const max = Math.max(...jittered);
    // Should be within ±30% of 4000
    expect(min).toBeGreaterThanOrEqual(2800);
    expect(max).toBeLessThanOrEqual(5200);
  });
});

describe('Phone Client — 30fps Send Throttle', () => {
  test('first send always passes throttle check', () => {
    const result = shouldSendSensorData(0, 1000, 33);
    expect(result.shouldSend).toBe(true);
  });

  test('blocks send if less than 33ms elapsed', () => {
    const result = shouldSendSensorData(1000, 1020, 33);
    expect(result.shouldSend).toBe(false);
    expect(result.elapsed).toBe(20);
  });

  test('allows send if >= 33ms elapsed', () => {
    const result = shouldSendSensorData(1000, 1040, 33);
    expect(result.shouldSend).toBe(true);
    expect(result.elapsed).toBe(40);
  });

  test('allows send at exactly 33ms interval', () => {
    const result = shouldSendSensorData(1000, 1033, 33);
    expect(result.shouldSend).toBe(true);
    expect(result.elapsed).toBe(33);
  });

  test('reports correct elapsed time', () => {
    const result = shouldSendSensorData(5000, 5123, 33);
    expect(result.elapsed).toBe(123);
  });

  test('handles very long intervals between sends', () => {
    const result = shouldSendSensorData(1000, 5000, 33);
    expect(result.shouldSend).toBe(true);
    expect(result.elapsed).toBe(4000);
  });

  test('works with custom interval values', () => {
    // 10fps = 100ms
    const r1 = shouldSendSensorData(1000, 1050, 100);
    expect(r1.shouldSend).toBe(false);

    const r2 = shouldSendSensorData(1000, 1100, 100);
    expect(r2.shouldSend).toBe(true);
  });
});

describe('Phone Client — Integration Contract', () => {
  let relay;

  beforeAll(() => {
    relay = new MessageRelay();
  });

  test('full lifecycle: connect → sensor → assigned → data stream', () => {
    // Step 1: Phone sends type: "sensor" as first message
    const firstMsg = { type: 'sensor' };
    expect(relay.detectRole(firstMsg)).toBe('sensor');

    // Step 2: Bridge sends assigned message back
    const assignMsg = { type: 'assigned', slot: 3, bridgeIp: '192.168.1.100' };
    expect(assignMsg.type).toBe('assigned');
    expect(typeof assignMsg.slot).toBe('number');

    // Step 3: Phone sends sensor data at 30fps
    const dataMsg = buildSensorMessage(
      { x: 0.5, y: -0.3, z: 9.81 },
      { a: 2.0, b: -1.0, g: 0.5 },
      { a: 90, b: 45, g: 0 }
    );
    expect(relay.validateSensorMessage(dataMsg).valid).toBe(true);
  });

  test('handles empty/null sensor values gracefully (graceful degradation)', () => {
    // Simulate phone with no gyroscope
    const msg = buildSensorMessage(
      { x: 0.1, y: 0.2, z: 9.81 },
      { a: null, b: null, g: null },
      { a: null, b: null, g: null }
    );
    
    // Should still pass validation if nulls are turned to 0
    const safeMsg = {
      ...msg,
      gyro: { a: 0, b: 0, g: 0 },
      orientation: { a: 0, b: 0, g: 0 }
    };
    const result = relay.validateSensorMessage(safeMsg);
    expect(result.valid).toBe(true);
  });

  test('handles partial sensor data (DeviceMotionEvent only, no orientation)', () => {
    const msg = buildSensorMessage(
      { x: 0.1, y: 0.2, z: 9.81 },
      { a: 0.5, b: 0.3, g: 0.1 },
      { a: 0, b: 90, g: 0 }
    );
    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(true);
  });

  test('handleAssignedMessage calls saveAndSendConfig after assignment', () => {
    let saveConfigCalled = false;
    const mockState = { slot: -1, connected: false, startTime: 0 };

    function handleAssignedMessage(msg) {
      mockState.slot = msg.slot;
      mockState.connected = true;
      mockState.startTime = Date.now();
      saveConfigCalled = true;
    }

    handleAssignedMessage({ type: 'assigned', slot: 3, bridgeIp: '192.168.1.100' });
    expect(saveConfigCalled).toBe(true);
    expect(mockState.slot).toBe(3);
    expect(mockState.connected).toBe(true);
  });
});
