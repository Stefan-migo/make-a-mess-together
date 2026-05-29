const http = require('http');

const mockMidiSenderInstance = {
  sendNoteOn: jest.fn(),
  sendNoteOff: jest.fn(),
  sendCC: jest.fn(),
  sendPitchBend: jest.fn(),
  allNotesOff: jest.fn(),
  close: jest.fn()
};

const mockMidiMapperInstance = {
  setGlobalConfig: jest.fn(),
  setSlotConfig: jest.fn(),
  processSensor: jest.fn()
};

jest.mock('../../server-bridge/midi-sender', () => ({
  MidiSender: jest.fn(() => mockMidiSenderInstance)
}));

jest.mock('../../server-bridge/midi-mapper', () => ({
  MidiMapper: jest.fn(() => mockMidiMapperInstance)
}));

const { createBridge } = require('../../server-bridge/index');

function createMockWs() {
  const handlers = {};
  return {
    send: jest.fn(),
    on: jest.fn((event, handler) => { handlers[event] = handler; }),
    once: jest.fn(),
    close: jest.fn(),
    ping: jest.fn(),
    terminate: jest.fn(),
    readyState: 1,
    bufferedAmount: 0,
    _trigger(event, ...args) {
      if (handlers[event]) handlers[event](...args);
    }
  };
}

describe('Bridge Pool Routing (Phase 3)', () => {
  let bridge;
  let server;
  let baseUrl;

  const POOLS = {
    chordspace: { channels: [1, 2, 3, 4, 5, 6], max: 6 },
    drums: { channels: [7, 8], max: 2 },
    gesturecanvas: { channels: [9, 10], max: 2 }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMidiMapperInstance.processSensor.mockReturnValue([
      { type: 'cc', channel: 0, cc: 1, value: 64 }
    ]);
  });

  afterEach(() => {
    try { bridge?.wss?.close(); } catch (_) {}
    try { bridge?.httpServer?.close(); } catch (_) {}
  });

  // -----------------------------------------------------------------------
  // T-POOL-001 to 003: Channel assignment & wrapping
  // -----------------------------------------------------------------------

  test('T-POOL-001: _assignChannel returns first channel of ChordSpace pool', () => {
    bridge = createBridge({ midi: true });
    expect(bridge._assignChannel(0, 'chordspace')).toBe(1);
  });

  test('T-POOL-001: _assignChannel returns first channel of Drums pool', () => {
    bridge = createBridge({ midi: true });
    expect(bridge._assignChannel(0, 'drums')).toBe(7);
  });

  test('T-POOL-001: _assignChannel returns first channel of GestureCanvas pool', () => {
    bridge = createBridge({ midi: true });
    expect(bridge._assignChannel(0, 'gesturecanvas')).toBe(9);
  });

  test('T-POOL-002: _assignChannel wraps when pool is full', () => {
    bridge = createBridge({ midi: true });
    const count = POOLS.chordspace.max;
    for (let i = 0; i <= count; i++) {
      const ch = bridge._assignChannel(i, 'chordspace');
      if (i < count) {
        expect(ch).toBe(i + 1);
      } else {
        expect(ch).toBe(1);
      }
      const mockWs = createMockWs();
      bridge.connections.set(mockWs, { role: 'sensor', slot: i, mode: 'chordspace', id: i, messageCount: 0, lastSeen: Date.now() });
    }
  });

  test('T-POOL-003: mode in connInfo stored on first sensor message', () => {
    bridge = createBridge({ midi: true });
    const mockWs = createMockWs();

    bridge.wss.emit('connection', mockWs);
    mockWs._trigger('message', Buffer.from(JSON.stringify({ type: 'sensor', mode: 'drums', v: 1, accel: { x: 0, y: 0, z: 9.8 }, gyro: { a: 0, b: 0, g: 0 }, orientation: { a: 0, b: 90, g: 0 } })));

    const info = bridge.connections.get(mockWs);
    expect(info).toBeDefined();
    expect(info.mode).toBe('drums');
  });

  // -----------------------------------------------------------------------
  // T-POOL-004: Mode change cleanup
  // -----------------------------------------------------------------------

  test('T-POOL-004: _handleModeChange sends allNotesOff then re-assigns mode', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'sensor', slot: 0, mode: 'chordspace', id: 1, messageCount: 0, lastSeen: Date.now() };
    bridge.connections.set(mockWs, info);

    bridge._handleModeChange(mockWs, info, { type: 'modeChange', mode: 'drums' });

    expect(mockMidiSenderInstance.allNotesOff).toHaveBeenCalled();
    expect(info.mode).toBe('drums');
  });

  test('T-POOL-004: _handleModeChange rejects invalid mode', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'sensor', slot: 0, mode: 'chordspace', id: 1, messageCount: 0, lastSeen: Date.now() };
    bridge.connections.set(mockWs, info);

    bridge._handleModeChange(mockWs, info, { type: 'modeChange', mode: 'invalid' });

    expect(mockMidiSenderInstance.allNotesOff).not.toHaveBeenCalled();
    expect(info.mode).toBe('chordspace');
    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('error'));
  });

  test('T-POOL-004: modeChange triggers _handleModeChange from WebSocket message', () => {
    bridge = createBridge({ midi: true });
    const mockWs = createMockWs();
    bridge.wss.emit('connection', mockWs);
    mockWs._trigger('message', Buffer.from(JSON.stringify({ type: 'sensor', mode: 'chordspace', v: 1, accel: { x: 0, y: 0, z: 9.8 }, gyro: { a: 0, b: 0, g: 0 }, orientation: { a: 0, b: 90, g: 0 } })));

    mockWs._trigger('message', Buffer.from(JSON.stringify({ type: 'modeChange', mode: 'gesturecanvas' })));

    const info = bridge.connections.get(mockWs);
    expect(info.mode).toBe('gesturecanvas');
  });

  // -----------------------------------------------------------------------
  // T-POOL-005: GET /api/pools
  // -----------------------------------------------------------------------

  test('T-POOL-005: GET /api/pools returns pool configuration', async () => {
    bridge = createBridge({ midi: true });
    server = bridge.httpServer;
    server.listen(0);
    const addr = server.address().port;
    baseUrl = `http://localhost:${addr}`;

    const res = await new Promise((resolve, reject) => {
      http.get(`${baseUrl}/api/pools`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body }));
      }).on('error', reject);
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.chordspace).toBeDefined();
    expect(data.drums).toBeDefined();
    expect(data.gesturecanvas).toBeDefined();
    expect(data.chordspace.channels).toEqual([1, 2, 3, 4, 5, 6]);
    expect(data.drums.channels).toEqual([7, 8]);
    expect(data.gesturecanvas.channels).toEqual([9, 10]);
  });

  test('T-POOL-005: GET /api/pools reflects active phone count', async () => {
    bridge = createBridge({ midi: true });
    const mockWs1 = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const mockWs2 = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    bridge.connections.set(mockWs1, { role: 'sensor', slot: 0, mode: 'chordspace', id: 1, messageCount: 0, lastSeen: Date.now() });
    bridge.connections.set(mockWs2, { role: 'sensor', slot: 1, mode: 'chordspace', id: 2, messageCount: 0, lastSeen: Date.now() });

    server = bridge.httpServer;
    server.listen(0);
    const addr = server.address().port;
    baseUrl = `http://localhost:${addr}`;

    const res = await new Promise((resolve, reject) => {
      http.get(`${baseUrl}/api/pools`, (res2) => {
        let body = '';
        res2.on('data', chunk => body += chunk);
        res2.on('end', () => resolve({ statusCode: res2.statusCode, body }));
      }).on('error', reject);
    });

    const data = JSON.parse(res.body);
    expect(data.chordspace.active).toBe(2);
    expect(data.drums.active).toBe(0);
    expect(data.gesturecanvas.active).toBe(0);
  });

  // -----------------------------------------------------------------------
  // T-POOL-006: Musical state broadcast
  // -----------------------------------------------------------------------

  test('T-POOL-006: musical state broadcast after sensor message with MIDI', () => {
    bridge = createBridge({ midi: true });
    const mockPlayer = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    bridge.players.add(mockPlayer);

    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'sensor', slot: 0, mode: 'chordspace', id: 1, messageCount: 0, lastSeen: Date.now() };
    bridge.connections.set(mockWs, info);

    const msg = {
      type: 'sensor', v: 1,
      accel: { x: -10, y: -10, z: 0 },
      gyro: { a: 0, b: 0, g: 0 },
      orientation: { a: 90, b: 0, g: 0 }
    };

    bridge._handleSensorMessage(mockWs, info, msg);

    const calls = mockPlayer.send.mock.calls.filter(c => {
      try { return JSON.parse(c[0]).type === 'musicalState'; }
      catch (_) { return false; }
    });
    expect(calls.length).toBeGreaterThanOrEqual(1);
    const state = JSON.parse(calls[0][0]);
    expect(state.slot).toBe(0);
    expect(state.mode).toBe('chordspace');
  });

  test('T-POOL-006: musical state NOT broadcast when no midi', () => {
    bridge = createBridge({});
    const mockPlayer = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    bridge.players.add(mockPlayer);

    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'sensor', slot: 0, mode: 'chordspace', id: 1, messageCount: 0, lastSeen: Date.now() };
    bridge.connections.set(mockWs, info);

    const msg = {
      type: 'sensor', v: 1,
      accel: { x: 0, y: 0, z: 9.8 },
      gyro: { a: 0, b: 0, g: 0 },
      orientation: { a: 90, b: 0, g: 0 }
    };

    bridge._handleSensorMessage(mockWs, info, msg);

    const calls = mockPlayer.send.mock.calls.filter(c => {
      try { return JSON.parse(c[0]).type === 'musicalState'; }
      catch (_) { return false; }
    });
    expect(calls.length).toBe(0);
  });

  // -----------------------------------------------------------------------
  // T-POOL-007: CL flag — --mode removed
  // -----------------------------------------------------------------------

  test('T-POOL-007: Bridge without --midi does not set midiMode', () => {
    bridge = createBridge({});
    expect(bridge.midiSender).toBeNull();
    expect(bridge.midiMapper).toBeNull();
  });

  test('T-POOL-008: per-slot mode passed to midiMapper via setSlotConfig', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'sensor', slot: 0, mode: 'drums', id: 1, messageCount: 0, lastSeen: Date.now() };
    bridge.connections.set(mockWs, info);

    const msg = {
      type: 'sensor', v: 1,
      accel: { x: 0, y: 0, z: 9.8 },
      gyro: { a: 0, b: 0, g: 0 },
      orientation: { a: 90, b: 0, g: 0 }
    };

    bridge._handleSensorMessage(mockWs, info, msg);

    // bridge should set slot config mode before processing
    expect(mockMidiMapperInstance.setSlotConfig).toHaveBeenCalledWith(0, { mode: 'drums', channel: expect.any(Number) });
  });
});
