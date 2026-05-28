const http = require('http');
const path = require('path');
const fs = require('fs');

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

describe('Bridge Dashboard (Phase 9)', () => {
  let bridge;
  let server;
  let baseUrl;

  beforeAll((done) => {
    bridge = createBridge({ midi: true, midiMode: 'chaos' });
    server = bridge.httpServer;
    server.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      done();
    });
  });

  afterAll((done) => {
    if (bridge) {
      try { bridge.wss.close(); } catch (_) {}
    }
    if (server) server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function fetch(urlPath) {
    return new Promise((resolve, reject) => {
      http.get(`${baseUrl}${urlPath}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        }));
      }).on('error', reject);
    });
  }

  test('T038: /dashboard route serves dashboard.html', async () => {
    const res = await fetch('/dashboard');
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('MIDI Dashboard');
    expect(res.headers['content-type']).toContain('text/html');
  });

  test('T038: dashboard.html file exists with required controls', () => {
    const dashboardPath = path.join(__dirname, '../../server-bridge/public/dashboard.html');
    expect(fs.existsSync(dashboardPath)).toBe(true);
    const html = fs.readFileSync(dashboardPath, 'utf-8');
    expect(html).toContain('MIDI Dashboard');
    expect(html).toContain('mode');
    expect(html).toContain('scale');
    expect(html).toContain('key');
    expect(html).toContain('octave');
    expect(html).toContain('bpm');
    expect(html).toContain('chaosAmount');
    expect(html).toContain('noteThreshold');
  });

  test('T039: handleMidiConfigMessage calls midiMapper.setGlobalConfig with valid mode', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', mode: 'scale' });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ mode: 'scale' });
  });

  test('T039: handleMidiConfigMessage calls midiMapper.setGlobalConfig with valid scale', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', scale: 'blues' });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ scale: 'blues' });
  });

  test('T039: handleMidiConfigMessage calls midiMapper.setGlobalConfig with valid key', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', key: 'F#' });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ key: 'F#' });
  });

  test('T039: handleMidiConfigMessage calls midiMapper.setGlobalConfig with bpm and octave', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', bpm: 140, octave: 4 });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ bpm: 140, octave: 4 });
  });

  test('T039: handleMidiConfigMessage calls midiMapper.setGlobalConfig with chaosAmount and noteThreshold', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', chaosAmount: 0.75, noteThreshold: 25 });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ chaosAmount: 0.75, noteThreshold: 25 });
  });

  test('T040: invalid mode is rejected', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', mode: 'invalid' });
    expect(mockMidiMapperInstance.setGlobalConfig).not.toHaveBeenCalled();
  });

  test('T040: invalid scale is rejected', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', scale: 'nonsense' });
    expect(mockMidiMapperInstance.setGlobalConfig).not.toHaveBeenCalled();
  });

  test('T040: invalid key is rejected', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', key: 'H' });
    expect(mockMidiMapperInstance.setGlobalConfig).not.toHaveBeenCalled();
  });

  test('T040: octave is clamped to 1-7', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', octave: 99 });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ octave: 7 });

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', octave: -5 });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ octave: 1 });
  });

  test('T040: bpm is clamped to 20-300', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', bpm: 500 });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ bpm: 300 });

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', bpm: 5 });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ bpm: 20 });
  });

  test('T040: chaosAmount is clamped to 0-1', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', chaosAmount: 5 });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ chaosAmount: 1 });

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', chaosAmount: -1 });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ chaosAmount: 0 });
  });

  test('T040: noteThreshold is clamped to 1-127', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', noteThreshold: 200 });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ noteThreshold: 127 });

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', noteThreshold: 0 });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ noteThreshold: 1 });
  });

  test('T041: dashboard registers as monitor (player type)', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };

    bridge._handlePlayerConnect(mockWs, { id: 1, role: 'player', messageCount: 0, lastSeen: Date.now() });

    expect(bridge.players.size).toBe(1);
    expect(bridge.players.has(mockWs)).toBe(true);
  });

  test('T041: no state broadcast failure when no players', () => {
    bridge = createBridge({ midi: true });
    expect(() => {
      const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
      const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };
      bridge.connections.set(mockWs, info);
      bridge._handleDisconnect(mockWs);
    }).not.toThrow();
    expect(bridge.players.size).toBe(0);
  });

  test('T039: handleMidiConfigMessage ignored when midi not active', () => {
    const bridgeNoMidi = createBridge({});
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridgeNoMidi._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', mode: 'scale' });
    expect(mockMidiMapperInstance.setGlobalConfig).not.toHaveBeenCalled();
    try { bridgeNoMidi.wss.close(); } catch (_) {}
    try { bridgeNoMidi.httpServer.close(); } catch (_) {}
  });

  test('T039: handleMidiConfigMessage with multiple fields sends one update', () => {
    bridge = createBridge({ midi: true });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };

    bridge._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', mode: 'arp', bpm: 160, chaosAmount: 0.9, key: 'D' });
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledTimes(1);
    expect(mockMidiMapperInstance.setGlobalConfig).toHaveBeenCalledWith({ mode: 'arp', bpm: 160, chaosAmount: 0.9, key: 'D' });
  });

  test('T042: enableMidi activates MIDI on-the-fly', () => {
    const bridgeNoMidi = createBridge({});
    expect(bridgeNoMidi.midiSender).toBeNull();
    expect(bridgeNoMidi.midiMapper).toBeNull();

    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'player', id: 1, messageCount: 0, lastSeen: Date.now() };
    bridgeNoMidi._handleMidiConfigMessage(mockWs, info, { type: 'midiConfig', enableMidi: true });

    expect(bridgeNoMidi.midiSender).not.toBeNull();
    expect(bridgeNoMidi.midiMapper).not.toBeNull();
    try { bridgeNoMidi.wss.close(); } catch (_) {}
    try { bridgeNoMidi.httpServer.close(); } catch (_) {}
  });
});
