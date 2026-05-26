/**
 * Message Protocol Tests
 * Constitution: Section VI — TDD
 * Spec: .specify/specs/01-bridge-server.md
 * 
 * Tests JSON protocol format, versioning, role detection,
 * and message formatting for the bridge server.
 * 
 * 🔴 RED phase: Module doesn't exist yet — all tests fail.
 * 🟢 GREEN phase: After implementation, all tests pass.
 */

const { MessageRelay } = require('../../server-bridge/message-relay');

describe('Message Protocol', () => {
  let relay;

  beforeEach(() => {
    relay = new MessageRelay();
  });

  // -----------------------------------------------------------------------
  // Message validation
  // -----------------------------------------------------------------------
  test('parses valid sensor message with accel, gyro, orientation', () => {
    const msg = {
      type: 'sensor',
      v: 1,
      accel: { x: 0.1, y: 0.2, z: 9.81 },
      gyro: { a: 1, b: 2, g: 3 },
      orientation: { a: 45, b: 90, g: 0 }
    };
    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(true);
  });

  test('rejects messages with missing required fields', () => {
    const msg = { type: 'sensor', v: 1 };
    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('rejects messages with missing accel', () => {
    const msg = { type: 'sensor', v: 1, gyro: {}, orientation: {} };
    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(false);
  });

  test('rejects messages with missing gyro', () => {
    const msg = { type: 'sensor', v: 1, accel: {}, orientation: {} };
    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(false);
  });

  test('rejects messages with missing orientation', () => {
    const msg = { type: 'sensor', v: 1, accel: {}, gyro: {} };
    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(false);
  });

  test('rejects messages with unknown protocol version', () => {
    const msg = {
      type: 'sensor',
      v: 99,
      accel: { x: 0, y: 0, z: 9.81 },
      gyro: { a: 0, b: 0, g: 0 },
      orientation: { a: 0, b: 90, g: 0 }
    };
    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(false);
  });

  test('accepts messages without explicit version (v1 default)', () => {
    const msg = {
      type: 'sensor',
      accel: { x: 0, y: 0, z: 9.81 },
      gyro: { a: 0, b: 0, g: 0 },
      orientation: { a: 0, b: 90, g: 0 }
    };
    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Role detection
  // -----------------------------------------------------------------------
  test('detects "sensor" role from first message type', () => {
    const role = relay.detectRole({ type: 'sensor' });
    expect(role).toBe('sensor');
  });

  test('detects "player" role from first message type', () => {
    const role = relay.detectRole({ type: 'player' });
    expect(role).toBe('player');
  });

  test('rejects messages with no type field', () => {
    const role = relay.detectRole({ v: 1, accel: {} });
    expect(role).toBeNull();
  });

  test('rejects messages with unknown type field', () => {
    const role = relay.detectRole({ type: 'unknown' });
    expect(role).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Message formatting
  // -----------------------------------------------------------------------
  test('formats assign message correctly', () => {
    const msg = relay.formatAssignMessage(5);
    expect(msg).toEqual({
      type: 'system',
      event: 'assign',
      slot: 5
    });
  });

  test('formats disconnect message correctly', () => {
    const msg = relay.formatDisconnectMessage(3);
    expect(msg).toEqual({
      type: 'system',
      event: 'disconnect',
      slot: 3
    });
  });

  test('formats count message correctly', () => {
    const msg = relay.formatCountMessage(7);
    expect(msg).toEqual({
      type: 'system',
      event: 'count',
      count: 7
    });
  });

  test('formats sensor accel message for player relay', () => {
    const msg = relay.formatSensorMessage(0, 'accel', { x: 0.1, y: 0.2, z: 9.81 });
    expect(msg).toEqual({
      type: 'sensor',
      slot: 0,
      sensor: 'accel',
      data: { x: 0.1, y: 0.2, z: 9.81 }
    });
  });

  test('formats sensor gyro message for player relay', () => {
    const msg = relay.formatSensorMessage(1, 'gyro', { a: 1, b: 2, g: 3 });
    expect(msg).toEqual({
      type: 'sensor',
      slot: 1,
      sensor: 'gyro',
      data: { a: 1, b: 2, g: 3 }
    });
  });

  test('formats sensor orientation message for player relay', () => {
    const msg = relay.formatSensorMessage(2, 'orientation', { a: 45, b: 90, g: 0 });
    expect(msg).toEqual({
      type: 'sensor',
      slot: 2,
      sensor: 'orientation',
      data: { a: 45, b: 90, g: 0 }
    });
  });

  // -----------------------------------------------------------------------
  // Error cases
  // -----------------------------------------------------------------------
  test('rejects sensor message with non-numeric accel values', () => {
    const msg = {
      type: 'sensor',
      v: 1,
      accel: { x: 'abc', y: 0, z: 9.81 },
      gyro: { a: 0, b: 0, g: 0 },
      orientation: { a: 0, b: 90, g: 0 }
    };
    const result = relay.validateSensorMessage(msg);
    expect(result.valid).toBe(false);
  });

  test('formats assign message for slot 0 correctly', () => {
    const msg = relay.formatAssignMessage(0);
    expect(msg.slot).toBe(0);
    expect(msg.type).toBe('system');
    expect(msg.event).toBe('assign');
  });

  // -----------------------------------------------------------------------
  // Batch message formatting (Bridge-Side Message Batching)
  // -----------------------------------------------------------------------
  test('formats sensor batch message with combined sensor data', () => {
    const accel = { x: 0.1, y: 0.2, z: 9.81 };
    const gyro = { a: 1, b: 2, g: 3 };
    const orientation = { a: 45, b: 90, g: 0 };
    const msg = relay.formatSensorBatchMessage(3, accel, gyro, orientation);
    expect(msg).toEqual({
      type: 'sensor',
      slot: 3,
      sensor: 'combined',
      data: {
        accel: { x: 0.1, y: 0.2, z: 9.81 },
        gyro: { a: 1, b: 2, g: 3 },
        orientation: { a: 45, b: 90, g: 0 }
      }
    });
  });

  test('formatSensorBatchMessage does not mutate input objects', () => {
    const accel = { x: 0.1, y: 0.2, z: 9.81 };
    const gyro = { a: 1, b: 2, g: 3 };
    const orientation = { a: 45, b: 90, g: 0 };
    const originalAccel = { ...accel };
    const originalGyro = { ...gyro };
    const originalOrientation = { ...orientation };
    relay.formatSensorBatchMessage(0, accel, gyro, orientation);
    expect(accel).toEqual(originalAccel);
    expect(gyro).toEqual(originalGyro);
    expect(orientation).toEqual(originalOrientation);
  });
});
