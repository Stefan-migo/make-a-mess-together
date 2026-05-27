const dgram = require('dgram');
const { OscSender } = require('../../server-bridge/osc-sender');

function getOscAddress(buf) {
  const nullIdx = buf.indexOf(0);
  return buf.toString('ascii', 0, nullIdx);
}

function getOscTypeTag(buf) {
  const firstNull = buf.indexOf(0);
  const addrLen = firstNull + 1;
  const addrPad = (4 - (addrLen % 4)) % 4;
  const typeStart = addrLen + addrPad;
  const typeNull = buf.indexOf(0, typeStart);
  return buf.toString('ascii', typeStart, typeNull);
}

function getHeaderLength(buf) {
  const firstNull = buf.indexOf(0);
  const addrLen = firstNull + 1;
  const addrPad = (4 - (addrLen % 4)) % 4;
  const typeStart = addrLen + addrPad;
  const typeNull = buf.indexOf(0, typeStart);
  const typeLen = typeNull - typeStart + 1;
  const typePad = (4 - (typeLen % 4)) % 4;
  return typeStart + typeLen + typePad;
}

function getFloatArg(buf, index) {
  const offset = getHeaderLength(buf) + index * 4;
  return buf.readFloatBE(offset);
}

function getIntArg(buf, index) {
  const offset = getHeaderLength(buf) + index * 4;
  return buf.readInt32BE(offset);
}

describe('OscSender', () => {
  let sendSpy;

  beforeEach(() => {
    sendSpy = jest.fn((buf, _offset, _len, _port, _addr, cb) => {
      if (typeof cb === 'function') cb(null);
    });
    jest.spyOn(dgram.Socket.prototype, 'send').mockImplementation(function (...args) {
      if (args.length >= 2 && Buffer.isBuffer(args[0])) {
        sendSpy(args[0], ...args.slice(1));
      } else {
        return dgram.Socket.prototype.send.apply(this, args);
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendAccel', () => {
    test('sends correct OSC binary packet for slot 0', () => {
      const sender = new OscSender('127.0.0.1', 9000);
      sender.sendAccel(0, 1.0, 2.0, 3.0);

      expect(sendSpy).toHaveBeenCalledTimes(1);
      const buf = sendSpy.mock.calls[0][0];

      expect(getOscAddress(buf)).toBe('/device/0/accel');
      expect(getOscTypeTag(buf)).toBe(',fff');
      expect(getFloatArg(buf, 0)).toBeCloseTo(1.0, 5);
      expect(getFloatArg(buf, 1)).toBeCloseTo(2.0, 5);
      expect(getFloatArg(buf, 2)).toBeCloseTo(3.0, 5);
    });

    test('sends correct address for slot 10 (different padding)', () => {
      const sender = new OscSender();
      sender.sendAccel(10, 0, 0, 0);

      expect(sendSpy).toHaveBeenCalledTimes(1);
      const buf = sendSpy.mock.calls[0][0];
      expect(getOscAddress(buf)).toBe('/device/10/accel');
    });
  });

  describe('sendGyro', () => {
    test('sends correct OSC binary packet', () => {
      const sender = new OscSender();
      sender.sendGyro(0, 0.5, 1.5, 2.5);

      expect(sendSpy).toHaveBeenCalledTimes(1);
      const buf = sendSpy.mock.calls[0][0];
      expect(getOscAddress(buf)).toBe('/device/0/gyro');
      expect(getOscTypeTag(buf)).toBe(',fff');
      expect(getFloatArg(buf, 0)).toBeCloseTo(0.5, 5);
      expect(getFloatArg(buf, 1)).toBeCloseTo(1.5, 5);
      expect(getFloatArg(buf, 2)).toBeCloseTo(2.5, 5);
    });
  });

  describe('sendOrientation', () => {
    test('sends correct OSC binary packet', () => {
      const sender = new OscSender();
      sender.sendOrientation(0, 90, 45, 180);

      const buf = sendSpy.mock.calls[0][0];
      expect(getOscAddress(buf)).toBe('/device/0/orientation');
      expect(getOscTypeTag(buf)).toBe(',fff');
      expect(getFloatArg(buf, 0)).toBeCloseTo(90, 5);
      expect(getFloatArg(buf, 1)).toBeCloseTo(45, 5);
      expect(getFloatArg(buf, 2)).toBeCloseTo(180, 5);
    });
  });

  describe('system messages', () => {
    test('sendAssign sends /system/assign with int32 slot', () => {
      const sender = new OscSender();
      sender.sendAssign(5);

      const buf = sendSpy.mock.calls[0][0];
      expect(getOscAddress(buf)).toBe('/system/assign');
      expect(getOscTypeTag(buf)).toBe(',i');
      expect(getIntArg(buf, 0)).toBe(5);
    });

    test('sendDisconnect sends /system/disconnect with int32 slot', () => {
      const sender = new OscSender();
      sender.sendDisconnect(3);

      const buf = sendSpy.mock.calls[0][0];
      expect(getOscAddress(buf)).toBe('/system/disconnect');
      expect(getOscTypeTag(buf)).toBe(',i');
      expect(getIntArg(buf, 0)).toBe(3);
    });

    test('sendCount sends /system/count with int32 count', () => {
      const sender = new OscSender();
      sender.sendCount(10);

      const buf = sendSpy.mock.calls[0][0];
      expect(getOscAddress(buf)).toBe('/system/count');
      expect(getOscTypeTag(buf)).toBe(',i');
      expect(getIntArg(buf, 0)).toBe(10);
    });
  });

  describe('NaN/Infinity clamping', () => {
    test('clamps NaN to 0', () => {
      const sender = new OscSender();
      sender.sendAccel(0, NaN, 2.0, 3.0);

      const buf = sendSpy.mock.calls[0][0];
      expect(getFloatArg(buf, 0)).toBe(0);
      expect(getFloatArg(buf, 1)).toBeCloseTo(2.0, 5);
      expect(getFloatArg(buf, 2)).toBeCloseTo(3.0, 5);
    });

    test('clamps Infinity to 0', () => {
      const sender = new OscSender();
      sender.sendAccel(0, Infinity, 2.0, 3.0);

      const buf = sendSpy.mock.calls[0][0];
      expect(getFloatArg(buf, 0)).toBe(0);
    });

    test('clamps -Infinity to 0', () => {
      const sender = new OscSender();
      sender.sendAccel(0, -Infinity, 2.0, 3.0);

      const buf = sendSpy.mock.calls[0][0];
      expect(getFloatArg(buf, 0)).toBe(0);
    });
  });

  describe('close()', () => {
    test('closes the UDP socket', () => {
      const sender = new OscSender();
      const closeSpy = jest.spyOn(sender.socket, 'close');
      sender.close();
      expect(closeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('packet structure', () => {
    test('buffer has correct total length for accel message', () => {
      const sender = new OscSender();
      sender.sendAccel(0, 1.0, 2.0, 3.0);

      const buf = sendSpy.mock.calls[0][0];
      const addr = '/device/0/accel';
      const addrLen = addr.length + 1;
      const addrPad = (4 - (addrLen % 4)) % 4;
      const tagLen = 5;
      const tagPad = (4 - (tagLen % 4)) % 4;
      const expectedTotal = addrLen + addrPad + tagLen + tagPad + 12;
      expect(buf.length).toBe(expectedTotal);
    });
  });
});
