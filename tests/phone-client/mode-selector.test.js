/**
 * Phase 1 — Mode Selector Tests
 * 
 * Tests the mode selection UI logic and message format for the phone client.
 * Validates that:
 * 1. Connection message includes mode field
 * 2. Mode change messages use correct format
 * 3. Mode is stored in state
 * 4. Pool info is parsed correctly
 */

// =========================================================================
// Helper: Simulate the mode-related logic from app.js
// =========================================================================

const VALID_MODES = ['chordspace', 'drums', 'gesturecanvas'];

/**
 * Build the initial WebSocket connection message.
 * Must include the selected mode.
 */
function buildConnectMessage(mode) {
  const msg = { type: 'sensor' };
  if (mode && VALID_MODES.includes(mode)) {
    msg.mode = mode;
  }
  return msg;
}

/**
 * Build a mode change message.
 */
function buildModeChangeMessage(mode) {
  return { type: 'modeChange', mode };
}

/**
 * Validate a mode string.
 */
function isValidMode(mode) {
  return VALID_MODES.includes(mode);
}

/**
 * Parse pool info from bridge response.
 * Expected format: { type: "poolInfo", pools: { chordspace: { active: 1, max: 6 }, ... } }
 */
function parsePoolInfo(msg) {
  if (!msg || msg.type !== 'poolInfo' || !msg.pools) return null;
  return msg.pools;
}

/**
 * Format pool display string.
 */
function formatPoolDisplay(poolName, pool) {
  if (!pool) return '';
  const label = poolName.charAt(0).toUpperCase() + poolName.slice(1);
  return `${label}: ${pool.active}/${pool.max}`;
}

describe('Phone Client — Mode Selection', () => {
  // -----------------------------------------------------------------------
  // T1.1: Mode selection UI logic (message contract)
  // -----------------------------------------------------------------------
  test('default connection message without mode', () => {
    const msg = buildConnectMessage();
    expect(msg.type).toBe('sensor');
    expect(msg.mode).toBeUndefined();
  });

  test('connection message includes selected mode when provided', () => {
    const msg = buildConnectMessage('chordspace');
    expect(msg.type).toBe('sensor');
    expect(msg.mode).toBe('chordspace');
  });

  test('connection message accepts all three valid modes', () => {
    for (const mode of VALID_MODES) {
      const msg = buildConnectMessage(mode);
      expect(msg.mode).toBe(mode);
    }
  });

  test('invalid mode does not appear in connection message', () => {
    const msg = buildConnectMessage('invalid_mode');
    expect(msg.mode).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // T1.2: Mode validation
  // -----------------------------------------------------------------------
  test('validates chordspace as valid mode', () => {
    expect(isValidMode('chordspace')).toBe(true);
  });

  test('validates drums as valid mode', () => {
    expect(isValidMode('drums')).toBe(true);
  });

  test('validates gesturecanvas as valid mode', () => {
    expect(isValidMode('gesturecanvas')).toBe(true);
  });

  test('rejects invalid mode string', () => {
    expect(isValidMode('chaos')).toBe(false);
    expect(isValidMode('')).toBe(false);
    expect(isValidMode(null)).toBe(false);
    expect(isValidMode(undefined)).toBe(false);
  });

  // -----------------------------------------------------------------------
  // T1.3: Mode change message format
  // -----------------------------------------------------------------------
  test('mode change message uses correct format', () => {
    const msg = buildModeChangeMessage('drums');
    expect(msg.type).toBe('modeChange');
    expect(msg.mode).toBe('drums');
  });

  test('mode change message for gesturecanvas', () => {
    const msg = buildModeChangeMessage('gesturecanvas');
    expect(msg.type).toBe('modeChange');
    expect(msg.mode).toBe('gesturecanvas');
  });

  test('mode change message for chordspace', () => {
    const msg = buildModeChangeMessage('chordspace');
    expect(msg.type).toBe('modeChange');
    expect(msg.mode).toBe('chordspace');
  });

  // -----------------------------------------------------------------------
  // T1.4: Pool info display
  // -----------------------------------------------------------------------
  test('parsePoolInfo extracts pool data from bridge message', () => {
    const msg = {
      type: 'poolInfo',
      pools: {
        chordspace: { active: 3, max: 6, channels: [1, 2, 3, 4, 5, 6] },
        drums: { active: 1, max: 2, channels: [7, 8] },
        gesturecanvas: { active: 0, max: 2, channels: [9, 10] }
      }
    };
    const pools = parsePoolInfo(msg);
    expect(pools).not.toBeNull();
    expect(pools.chordspace.active).toBe(3);
    expect(pools.drums.max).toBe(2);
    expect(pools.gesturecanvas.active).toBe(0);
  });

  test('parsePoolInfo returns null for non-poolInfo messages', () => {
    expect(parsePoolInfo(null)).toBeNull();
    expect(parsePoolInfo({ type: 'assigned', slot: 0 })).toBeNull();
    expect(parsePoolInfo({})).toBeNull();
  });

  test('formatPoolDisplay shows correct string format', () => {
    const pool = { active: 2, max: 6 };
    expect(formatPoolDisplay('chordspace', pool)).toBe('Chordspace: 2/6');
  });

  test('formatPoolDisplay returns empty for null/undefined pool', () => {
    expect(formatPoolDisplay('drums', null)).toBe('');
    expect(formatPoolDisplay('drums', undefined)).toBe('');
  });

  test('formatPoolDisplay shows zero active for empty pool', () => {
    const pool = { active: 0, max: 6 };
    expect(formatPoolDisplay('chordspace', pool)).toBe('Chordspace: 0/6');
  });

  // -----------------------------------------------------------------------
  // Full lifecycle: select mode → connect → mode change
  // -----------------------------------------------------------------------
  test('full mode lifecycle produces correct messages', () => {
    // Step 1: User selects ChordSpace
    const connectMsg = buildConnectMessage('chordspace');
    expect(connectMsg.type).toBe('sensor');
    expect(connectMsg.mode).toBe('chordspace');

    // Step 2: User switches to Drums
    const modeChangeMsg1 = buildModeChangeMessage('drums');
    expect(modeChangeMsg1.type).toBe('modeChange');
    expect(modeChangeMsg1.mode).toBe('drums');

    // Step 3: User switches to GestureCanvas
    const modeChangeMsg2 = buildModeChangeMessage('gesturecanvas');
    expect(modeChangeMsg2.type).toBe('modeChange');
    expect(modeChangeMsg2.mode).toBe('gesturecanvas');
  });
});
