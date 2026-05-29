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

describe('MIDI Bridge Integration', () => {
  let bridge;

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

  test('T032: Bridge without --midi — MidiSender NOT created', () => {
    bridge = createBridge({});
    expect(bridge.midiSender).toBeNull();
    expect(bridge.midiMapper).toBeNull();
  });

  test('T033: Bridge with --midi creates MidiSender + MidiMapper', () => {
    bridge = createBridge({ midi: true });
    expect(bridge.midiSender).toBe(mockMidiSenderInstance);
    expect(bridge.midiMapper).toBe(mockMidiMapperInstance);
  });

  test('T034: Sensor message triggers midiMapper.processSensor and midiSender.sendCC', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'sensor', slot: 0, id: 1, messageCount: 0, lastSeen: Date.now() };
    bridge.connections.set(mockWs, info);

    const msg = {
      type: 'sensor',
      v: 1,
      accel: { x: 1, y: 2, z: 3 },
      gyro: { a: 0.1, b: 0.2, g: 0.3 },
      orientation: { a: 90, b: 45, g: 180 }
    };

    bridge._handleSensorMessage(mockWs, info, msg);

    expect(mockMidiMapperInstance.processSensor).toHaveBeenCalledWith(0, msg);
    expect(mockMidiSenderInstance.sendCC).toHaveBeenCalledWith(0, 1, 64);
  });

  test('Disconnect sends allNotesOff for freed slot', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const slot = bridge.allocator.allocate();
    const info = { role: 'sensor', slot, id: 1, messageCount: 0, lastSeen: Date.now() };
    bridge.connections.set(mockWs, info);

    bridge._handleDisconnect(mockWs);

    expect(mockMidiSenderInstance.allNotesOff).toHaveBeenCalledWith(slot & 0x0f);
  });

  test('CLI key/octave flags configure MidiMapper', () => {
    bridge = createBridge({ midi: true, midiKey: 'D', midiOctave: 4 });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ key: 'D' });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ octave: 4 });
  });

  test('midiSender.close() called when sender exists', () => {
    bridge = createBridge({ midi: true });
    bridge.midiSender.close();
    expect(mockMidiSenderInstance.close).toHaveBeenCalled();
  });

  test('T043: bridge exposes _connectMidiToReaper when MIDI active', () => {
    bridge = createBridge({ midi: true });
    expect(typeof bridge._connectMidiToReaper).toBe('function');
    expect(() => bridge._connectMidiToReaper()).not.toThrow();
  });
});
