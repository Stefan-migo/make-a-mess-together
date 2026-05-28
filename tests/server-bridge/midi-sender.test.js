let mockOutputInstance;

jest.mock('@julusian/midi', () => {
  mockOutputInstance = {
    sendMessage: jest.fn(),
    openVirtualPort: jest.fn(),
    closePort: jest.fn()
  };
  return {
    Output: jest.fn(() => mockOutputInstance)
  };
});

const { MidiSender } = require('../../server-bridge/midi-sender');

describe('MidiSender', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('T001: creates virtual port named phone-sensor-orchestra', () => {
      const sender = new MidiSender();
      expect(mockOutputInstance.openVirtualPort).toHaveBeenCalledWith('phone-sensor-orchestra');
      sender.close();
    });
  });

  describe('sendNoteOn', () => {
    test('T002: sends correct bytes [0x90|ch, note, velocity]', () => {
      const sender = new MidiSender();
      sender.sendNoteOn(0, 60, 100);
      expect(mockOutputInstance.sendMessage).toHaveBeenCalledWith([0x90, 60, 100]);
      sender.close();
    });

    test('clamps note to 0-127', () => {
      const sender = new MidiSender();
      sender.sendNoteOn(0, 200, 100);
      expect(mockOutputInstance.sendMessage).toHaveBeenCalledWith([0x90, 127, 100]);
      sender.close();
    });

    test('clamps velocity to 0-127', () => {
      const sender = new MidiSender();
      sender.sendNoteOn(0, 60, 300);
      expect(mockOutputInstance.sendMessage).toHaveBeenCalledWith([0x90, 60, 127]);
      sender.close();
    });

    test('channel modulo 16 for safety', () => {
      const sender = new MidiSender();
      sender.sendNoteOn(18, 60, 100);
      expect(mockOutputInstance.sendMessage).toHaveBeenCalledWith([0x92, 60, 100]);
      sender.close();
    });
  });

  describe('sendNoteOff', () => {
    test('T003: sends correct bytes [0x80|ch, note, velocity]', () => {
      const sender = new MidiSender();
      sender.sendNoteOff(0, 60, 64);
      expect(mockOutputInstance.sendMessage).toHaveBeenCalledWith([0x80, 60, 64]);
      sender.close();
    });
  });

  describe('sendCC', () => {
    test('T004: sends correct bytes [0xB0|ch, cc, value]', () => {
      const sender = new MidiSender();
      sender.sendCC(0, 1, 127);
      expect(mockOutputInstance.sendMessage).toHaveBeenCalledWith([0xB0, 1, 127]);
      sender.close();
    });

    test('clamps CC value to 0-127', () => {
      const sender = new MidiSender();
      sender.sendCC(0, 1, 255);
      expect(mockOutputInstance.sendMessage).toHaveBeenCalledWith([0xB0, 1, 127]);
      sender.close();
    });
  });

  describe('sendPitchBend', () => {
    test('T005: sends 14-bit value [0xE0|ch, lsb, msb]', () => {
      const sender = new MidiSender();
      sender.sendPitchBend(0, 8192);
      expect(mockOutputInstance.sendMessage).toHaveBeenCalledWith([0xE0, 0, 64]);
      sender.close();
    });

    test('clamps pitch bend to 0-16383', () => {
      const sender = new MidiSender();
      sender.sendPitchBend(0, 99999);
      expect(mockOutputInstance.sendMessage).toHaveBeenCalledWith([0xE0, 127, 127]);
      sender.close();
    });

    test('value 0 sends lsb=0, msb=0', () => {
      const sender = new MidiSender();
      sender.sendPitchBend(0, 0);
      expect(mockOutputInstance.sendMessage).toHaveBeenCalledWith([0xE0, 0, 0]);
      sender.close();
    });

    test('value 16383 sends lsb=127, msb=127', () => {
      const sender = new MidiSender();
      sender.sendPitchBend(0, 16383);
      expect(mockOutputInstance.sendMessage).toHaveBeenCalledWith([0xE0, 127, 127]);
      sender.close();
    });
  });

  describe('allNotesOff', () => {
    test('sends CC 123 All Notes Off', () => {
      const sender = new MidiSender();
      sender.allNotesOff(0);
      expect(mockOutputInstance.sendMessage).toHaveBeenCalledWith([0xB0, 123, 0]);
      sender.close();
    });
  });

  describe('close', () => {
    test('T006: close() calls closePort()', () => {
      const sender = new MidiSender();
      sender.close();
      expect(mockOutputInstance.closePort).toHaveBeenCalledTimes(1);
    });
  });
});
