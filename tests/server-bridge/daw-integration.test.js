const dgram = require('dgram');
const { OscSender } = require('../../server-bridge/osc-sender');

const mockOscSenderInstance = {
  sendAccel: jest.fn(),
  sendGyro: jest.fn(),
  sendOrientation: jest.fn(),
  sendAssign: jest.fn(),
  sendDisconnect: jest.fn(),
  sendCount: jest.fn(),
  close: jest.fn()
};

jest.mock('../../server-bridge/osc-sender', () => ({
  OscSender: jest.fn(() => mockOscSenderInstance)
}));

const { createBridge } = require('../../server-bridge/index');

describe('DAW OSC Bridge Integration', () => {
  let bridge;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (bridge) {
      try { bridge.wss.close(); } catch (_) { /* ignore */ }
      try { bridge.httpServer.close(); } catch (_) { /* ignore */ }
    }
  });

  test('1: Bridge without --daw — OscSender NOT created', () => {
    bridge = createBridge({});
    expect(bridge.oscSender).toBeNull();
    expect(OscSender).not.toHaveBeenCalled();
  });

  test('2: Bridge with --daw — OscSender IS created with defaults', () => {
    bridge = createBridge({ daw: '127.0.0.1:9000' });
    expect(bridge.oscSender).toBe(mockOscSenderInstance);
    expect(OscSender).toHaveBeenCalledWith('127.0.0.1', 9000);
  });

  test('3: Bridge with --daw custom host:port', () => {
    bridge = createBridge({ daw: '192.168.1.100:9001' });
    expect(bridge.oscSender).toBe(mockOscSenderInstance);
    expect(OscSender).toHaveBeenCalledWith('192.168.1.100', 9001);
  });

  test('4: Sensor message triggers OSC sendAccel/sendGyro/sendOrientation', () => {
    bridge = createBridge({ daw: '127.0.0.1:9000' });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'sensor', slot: 0, id: 1, messageCount: 0, lastSeen: Date.now() };
    bridge.connections.set(mockWs, info);

    const msg = {
      type: 'sensor',
      v: 1,
      accel: { x: 1.0, y: 2.0, z: 3.0 },
      gyro: { a: 0.1, b: 0.2, g: 0.3 },
      orientation: { a: 90, b: 45, g: 180 }
    };

    bridge._handleSensorMessage(mockWs, info, msg);

    expect(mockOscSenderInstance.sendAccel).toHaveBeenCalledWith(0, 1.0, 2.0, 3.0);
    expect(mockOscSenderInstance.sendGyro).toHaveBeenCalledWith(0, 0.1, 0.2, 0.3);
    expect(mockOscSenderInstance.sendOrientation).toHaveBeenCalledWith(0, 90, 45, 180);
  });

  test('5: Connect triggers OSC sendAssign and sendCount', () => {
    bridge = createBridge({ daw: '127.0.0.1:9000' });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const info = { role: 'sensor', id: 1, messageCount: 0, lastSeen: Date.now(), slot: -1 };

    bridge._handleSensorConnect(mockWs, info);

    expect(mockOscSenderInstance.sendAssign).toHaveBeenCalledWith(info.slot);
    expect(mockOscSenderInstance.sendCount).toHaveBeenCalled();
    expect(info.slot).toBeGreaterThanOrEqual(0);
  });

  test('6: Disconnect triggers OSC sendDisconnect and sendCount', () => {
    bridge = createBridge({ daw: '127.0.0.1:9000' });
    const mockWs = { send: jest.fn(), readyState: 1, bufferedAmount: 0 };
    const slot = bridge.allocator.allocate();
    const info = { role: 'sensor', slot, id: 1, lastSeen: Date.now(), messageCount: 0 };
    bridge.connections.set(mockWs, info);

    bridge._handleDisconnect(mockWs);

    expect(mockOscSenderInstance.sendDisconnect).toHaveBeenCalledWith(slot);
    expect(mockOscSenderInstance.sendCount).toHaveBeenCalled();
    expect(bridge.connections.has(mockWs)).toBe(false);
  });
});
