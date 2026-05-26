/**
 * MessageRelay — Message validation, role detection, and formatting.
 * 
 * Handles the protocol between phone clients, bridge server,
 * and p5 sketch players. Validates incoming messages, detects
 * connection roles, and formats outgoing messages.
 * 
 * Spec: .specify/specs/01-bridge-server.md
 */

// Protocol version supported
const SUPPORTED_VERSION = 1;

// Valid sensor data axes
const ACCEL_AXES = ['x', 'y', 'z'];
const GYRO_AXES = ['a', 'b', 'g'];
const ORIENTATION_AXES = ['a', 'b', 'g'];

// Valid role types
const VALID_ROLES = ['sensor', 'player'];

class MessageRelay {
  /**
   * Validate an incoming sensor message.
   * @param {object} msg - Parsed JSON message
   * @returns {{ valid: boolean, error?: string }}
   */
  validateSensorMessage(msg) {
    // Check type field
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: 'Message must be an object' };
    }

    if (msg.type !== 'sensor') {
      return { valid: false, error: 'Message type must be "sensor"' };
    }

    // Check protocol version (default to 1 if not present)
    const version = msg.v !== undefined ? msg.v : 1;
    if (version !== SUPPORTED_VERSION) {
      return { valid: false, error: `Unsupported protocol version: ${version}` };
    }

    // Check required sections
    if (!msg.accel || typeof msg.accel !== 'object') {
      return { valid: false, error: 'Missing required field: accel' };
    }
    if (!msg.gyro || typeof msg.gyro !== 'object') {
      return { valid: false, error: 'Missing required field: gyro' };
    }
    if (!msg.orientation || typeof msg.orientation !== 'object') {
      return { valid: false, error: 'Missing required field: orientation' };
    }

    // Validate accel axes
    for (const axis of ACCEL_AXES) {
      if (typeof msg.accel[axis] !== 'number' || isNaN(msg.accel[axis])) {
        return { valid: false, error: `accel.${axis} must be a number` };
      }
    }

    // Validate gyro axes
    for (const axis of GYRO_AXES) {
      if (typeof msg.gyro[axis] !== 'number' || isNaN(msg.gyro[axis])) {
        return { valid: false, error: `gyro.${axis} must be a number` };
      }
    }

    // Validate orientation axes
    for (const axis of ORIENTATION_AXES) {
      if (typeof msg.orientation[axis] !== 'number' || isNaN(msg.orientation[axis])) {
        return { valid: false, error: `orientation.${axis} must be a number` };
      }
    }

    return { valid: true };
  }

  /**
   * Detect the role of a connection from its first message.
   * @param {object} msg - Parsed JSON message
   * @returns {'sensor' | 'player' | null}
   */
  detectRole(msg) {
    if (!msg || typeof msg !== 'object' || !msg.type) {
      return null;
    }
    if (VALID_ROLES.includes(msg.type)) {
      return msg.type;
    }
    return null;
  }

  /**
   * Format a system assign message for broadcast to players.
   * @param {number} slot
   * @returns {object}
   */
  formatAssignMessage(slot) {
    return {
      type: 'system',
      event: 'assign',
      slot
    };
  }

  /**
   * Format a system disconnect message for broadcast to players.
   * @param {number} slot
   * @returns {object}
   */
  formatDisconnectMessage(slot) {
    return {
      type: 'system',
      event: 'disconnect',
      slot
    };
  }

  /**
   * Format a system count message for broadcast to players.
   * @param {number} count
   * @returns {object}
   */
  formatCountMessage(count) {
    return {
      type: 'system',
      event: 'count',
      count
    };
  }

  /**
   * Format a config update message for broadcast to players.
   * @param {number} slot - Device slot number
   * @param {object} config - Config object { brush?, color?, pressureCurve?, penDown? }
   * @returns {object}
   */
  formatConfigMessage(slot, config) {
    return {
      type: 'system',
      event: 'config',
      slot,
      config: { ...config }
    };
  }

  /**
   * Format a sensor data message for relay to a player.
   * @param {number} slot - Device slot number
   * @param {string} sensor - Sensor type: 'accel', 'gyro', or 'orientation'
   * @param {object} data - Sensor data object with axis values
   * @returns {object}
   */
  formatSensorMessage(slot, sensor, data) {
    return {
      type: 'sensor',
      slot,
      sensor,
      data: { ...data }
    };
  }

  /**
   * Format a combined sensor batch message with all three sensor types.
   * Sends ONE message per phone per frame instead of three separate messages.
   * @param {number} slot - Device slot number
   * @param {object} accel - Accelerometer data { x, y, z }
   * @param {object} gyro - Gyroscope data { a, b, g }
   * @param {object} orientation - Orientation data { a, b, g }
   * @returns {object}
   */
  formatSensorBatchMessage(slot, accel, gyro, orientation) {
    return {
      type: 'sensor',
      slot,
      sensor: 'combined',
      data: {
        accel: { ...accel },
        gyro: { ...gyro },
        orientation: { ...orientation }
      }
    };
  }
}

module.exports = { MessageRelay };
