const { MidiMapper } = require('../../server-bridge/midi-mapper');

describe('MidiMapper', () => {
  let mapper;

  beforeEach(() => {
    mapper = new MidiMapper();
  });

  describe('setGlobalConfig', () => {
    test('updates global config', () => {
      mapper.setGlobalConfig({ mode: 'gesturecanvas', key: 'D' });
      expect(mapper.globalConfig.mode).toBe('gesturecanvas');
      expect(mapper.globalConfig.key).toBe('D');
    });
  });

  describe('setSlotConfig', () => {
    test('sets per-slot override', () => {
      mapper.setSlotConfig(5, { mode: 'drums' });
      expect(mapper.slotConfigs[5]).toBeDefined();
      expect(mapper.slotConfigs[5].mode).toBe('drums');
    });
  });

  describe('Utility methods', () => {
    test('_clamp keeps values within range', () => {
      expect(mapper._clamp(60, 0, 127)).toBe(60);
      expect(mapper._clamp(-10, 0, 127)).toBe(0);
      expect(mapper._clamp(200, 0, 127)).toBe(127);
    });

    test('_mapRange maps value correctly', () => {
      expect(mapper._mapRange(5, 0, 10, 0, 127)).toBeCloseTo(63.5);
      expect(mapper._mapRange(0, 0, 10, 0, 127)).toBe(0);
      expect(mapper._mapRange(10, 0, 10, 0, 127)).toBe(127);
    });

    test('_calcAccelMag computes magnitude', () => {
      expect(mapper._calcAccelMag({ x: 3, y: 4, z: 0 })).toBe(5);
      expect(mapper._calcAccelMag(null)).toBe(0);
    });

    test('_sensorToCC produces 0-127 range', () => {
      const val = mapper._sensorToCC(500, -2000, 2000);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(127);
    });

    test('_sensorToPitchBend produces 0-16383 range', () => {
      const val = mapper._sensorToPitchBend(0, -2000, 2000);
      expect(val).toBe(8192);
    });
  });

  describe('T-CHORD: ChordSpace mode', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    function confirmZone(slot, data) {
      mapper.processSensor(slot, data);
      jest.advanceTimersByTime(250);
      return mapper.processSensor(slot, data);
    }

    test('T-CHORD-001: accel.x zone 0 (root) produces root tone', () => {
      mapper.setSlotConfig(0, { mode: 'chordspace', key: 'C', octave: 3 });
      const events = confirmZone(0, {
        accel: { x: -10, y: -10, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 90, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'noteon').note).toBe(48);
    });

    test('T-CHORD-002: accel.x zone 1 (3rd) produces note +4 semitones', () => {
      mapper.setSlotConfig(0, { mode: 'chordspace', key: 'C', octave: 3 });
      const events = confirmZone(0, {
        accel: { x: -5, y: -10, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 90, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'noteon').note).toBe(52);
    });

    test('T-CHORD-003: accel.x zone 3 (7th) produces note +10 semitones', () => {
      mapper.setSlotConfig(0, { mode: 'chordspace', key: 'C', octave: 3 });
      const events = confirmZone(0, {
        accel: { x: 4, y: -10, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 90, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'noteon').note).toBe(58);
    });

    test('T-CHORD-004: accel.x zone 4 (tension) produces note +14 semitones', () => {
      mapper.setSlotConfig(0, { mode: 'chordspace', key: 'C', octave: 3 });
      const events = confirmZone(0, {
        accel: { x: 10, y: -10, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 90, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'noteon').note).toBe(62);
    });

    test('T-CHORD-005: accel.y zones produce correct chord degrees', () => {
      mapper.setSlotConfig(0, { mode: 'chordspace', key: 'C', octave: 3 });
      const shared = { accel: { x: -10, y: -10, z: 0 }, gyro: { a: 0, b: 0, g: 0 }, orientation: { a: 90, b: 0, g: 0 } };

      mapper._lastNote = {};
      mapper._pendingZone = {};
      const e0 = confirmZone(0, { ...shared, accel: { x: -10, y: -10, z: 0 } });
      expect(e0.find(e => e.type === 'noteon').note).toBe(48);

      mapper._lastNote = {};
      mapper._pendingZone = {};
      const e1 = confirmZone(0, { ...shared, accel: { x: -10, y: 0, z: 0 } });
      expect(e1.find(e => e.type === 'noteon').note).toBe(53);

      mapper._lastNote = {};
      mapper._pendingZone = {};
      const e2 = confirmZone(0, { ...shared, accel: { x: -10, y: 6, z: 0 } });
      expect(e2.find(e => e.type === 'noteon').note).toBe(55);

      mapper._lastNote = {};
      mapper._pendingZone = {};
      const e3 = confirmZone(0, { ...shared, accel: { x: -10, y: 10, z: 0 } });
      expect(e3.find(e => e.type === 'noteon').note).toBe(57);
    });

    test('T-CHORD-006: Gate opens at 45°', () => {
      mapper.setSlotConfig(0, { mode: 'chordspace', key: 'C', octave: 3 });
      const events = confirmZone(0, {
        accel: { x: -10, y: -10, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 45, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'noteon')).toBeTruthy();
    });

    test('T-CHORD-007: Gate closes at 40° with hysteresis', () => {
      mapper.setSlotConfig(0, { mode: 'chordspace', key: 'C', octave: 3 });
      const data90 = { accel: { x: -10, y: -10, z: 0 }, gyro: { a: 0, b: 0, g: 0 }, orientation: { a: 90, b: 0, g: 0 } };
      const data40 = { ...data90, orientation: { a: 90, b: 0, g: 0 } };

      mapper.processSensor(0, data90);
      jest.advanceTimersByTime(250);
      const frame2 = mapper.processSensor(0, data90);
      expect(frame2.find(e => e.type === 'noteon')).toBeTruthy();

      jest.advanceTimersByTime(100);
      const frame3 = mapper.processSensor(0, { ...data90, orientation: { a: 40, b: 0, g: 0 } });
      expect(frame3.find(e => e.type === 'noteoff')).toBeTruthy();
    });

    test('T-CHORD-008: Volume CC 11 bounded 40-100', () => {
      mapper.setSlotConfig(0, { mode: 'chordspace', key: 'C', octave: 3 });
      const low = mapper.processSensor(0, {
        accel: { x: -10, y: -10, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 90, b: -180, g: 0 }
      });
      expect(low.find(e => e.type === 'cc' && e.cc === 11).value).toBeGreaterThanOrEqual(40);
      expect(low.find(e => e.type === 'cc' && e.cc === 11).value).toBeLessThanOrEqual(100);

      const high = mapper.processSensor(0, {
        accel: { x: -10, y: -10, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 90, b: 180, g: 0 }
      });
      expect(high.find(e => e.type === 'cc' && e.cc === 11).value).toBeGreaterThanOrEqual(40);
      expect(high.find(e => e.type === 'cc' && e.cc === 11).value).toBeLessThanOrEqual(100);
    });

    test('T-CHORD-009: Zone change sends note off + note on after 250ms', () => {
      mapper.setSlotConfig(0, { mode: 'chordspace', key: 'C', octave: 3 });
      const d1 = { accel: { x: -10, y: -10, z: 0 }, gyro: { a: 0, b: 0, g: 0 }, orientation: { a: 90, b: 0, g: 0 } };
      mapper.processSensor(0, d1);
      jest.advanceTimersByTime(250);
      mapper.processSensor(0, d1);

      const d2 = { ...d1, accel: { x: -5, y: -10, z: 0 } };
      const offEvents = mapper.processSensor(0, d2);
      expect(offEvents.find(e => e.type === 'noteoff')).toBeTruthy();

      jest.advanceTimersByTime(250);
      const onEvents = mapper.processSensor(0, d2);
      expect(onEvents.find(e => e.type === 'noteon').note).toBe(52);
    });

    test('T-CHORD-010: Pitch bend from gyro.a', () => {
      mapper.setSlotConfig(0, { mode: 'chordspace', key: 'C', octave: 3 });
      const events = mapper.processSensor(0, {
        accel: { x: -10, y: -10, z: 0 },
        gyro: { a: 1000, b: 0, g: 0 },
        orientation: { a: 90, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'pitchbend').value).toBeGreaterThan(8192);
      expect(events.find(e => e.type === 'pitchbend').value).toBeLessThan(16384);
    });

    test('T-CHORD-011: Zero gyro gives center pitch bend', () => {
      mapper.setSlotConfig(0, { mode: 'chordspace', key: 'C', octave: 3 });
      const events = mapper.processSensor(0, {
        accel: { x: -10, y: -10, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 90, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'pitchbend').value).toBe(8192);
    });

    test('T-CHORD-012: CC 1 from accel.z', () => {
      mapper.setSlotConfig(0, { mode: 'chordspace', key: 'C', octave: 3 });
      const events = mapper.processSensor(0, {
        accel: { x: -10, y: -10, z: 6 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 90, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'cc' && e.cc === 1).value).toBeGreaterThan(63);
    });
  });

  describe('T-DRUM: Drums mode', () => {
    beforeEach(() => {
      mapper.setSlotConfig(0, { mode: 'drums' });
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    function sendSpike(slot, axis, magnitude) {
      const accel = { x: 0, y: 0, z: 0 };
      accel[axis] = magnitude;
      return mapper.processSensor(slot, {
        accel,
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
    }

    test('T-DRUM-001: X spike triggers kick (note 36)', () => {
      expect(sendSpike(0, 'x', 15).filter(e => e.type === 'noteon' && e.note === 36).length).toBe(1);
    });

    test('T-DRUM-002: Y spike triggers snare (note 38)', () => {
      expect(sendSpike(0, 'y', 15).filter(e => e.type === 'noteon' && e.note === 38).length).toBe(1);
    });

    test('T-DRUM-003: Z spike triggers crash (note 49)', () => {
      expect(sendSpike(0, 'z', 15).filter(e => e.type === 'noteon' && e.note === 49).length).toBe(1);
    });

    test('T-DRUM-004: Velocity proportional to spike magnitude', () => {
      const v1 = sendSpike(0, 'x', 10).find(e => e.type === 'noteon' && e.note === 36).velocity;
      mapper._prevSensor = {};
      jest.advanceTimersByTime(200);
      const v2 = sendSpike(0, 'x', 30).find(e => e.type === 'noteon' && e.note === 36).velocity;
      expect(v2).toBeGreaterThan(v1);
    });

    test('T-DRUM-005: Cooldown prevents repeated hits', () => {
      sendSpike(0, 'x', 15);
      jest.advanceTimersByTime(50);
      expect(sendSpike(0, 'x', 15).filter(e => e.type === 'noteon' && e.note === 36).length).toBe(0);
    });

    test('T-DRUM-006: gyro.a maps to CC 4 (hi-hat)', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 1000, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'cc' && e.cc === 4)).toBeTruthy();
    });

    test('T-DRUM-007: gyro.b selects correct tom (47/48/50)', () => {
      mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      jest.advanceTimersByTime(200);

      const low = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: -60, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(low.find(e => e.type === 'noteon' && e.note === 47)).toBeTruthy();
      jest.advanceTimersByTime(200);

      mapper._prevSensor = {};
      mapper._lastTom = {};
      const baselineForMid = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 60, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      jest.advanceTimersByTime(200);
      const mid = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(mid.find(e => e.type === 'noteon' && e.note === 48)).toBeTruthy();
      jest.advanceTimersByTime(200);

      mapper._prevSensor = {};
      mapper._lastTom = {};
      const baselineForHigh = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: -60, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      jest.advanceTimersByTime(200);
      const high = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 60, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(high.find(e => e.type === 'noteon' && e.note === 50)).toBeTruthy();
    });

    test('T-DRUM-008: orientation.a 4 zones via CC 7', () => {
      const z0 = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(z0.find(e => e.type === 'cc' && e.cc === 7).value).toBe(0);

      mapper._prevSensor = {};
      const z1 = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 100, b: 0, g: 0 }
      });
      expect(z1.find(e => e.type === 'cc' && e.cc === 7).value).toBe(42);

      mapper._prevSensor = {};
      const z2 = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 200, b: 0, g: 0 }
      });
      expect(z2.find(e => e.type === 'cc' && e.cc === 7).value).toBe(84);

      mapper._prevSensor = {};
      const z3 = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 300, b: 0, g: 0 }
      });
      expect(z3.find(e => e.type === 'cc' && e.cc === 7).value).toBe(126);
    });

    test('T-DRUM-009: No Note Off sent', () => {
      expect(sendSpike(0, 'x', 15).filter(e => e.type === 'noteoff').length).toBe(0);
    });

    test('T-DRUM-010: Spike below threshold does NOT trigger', () => {
      expect(sendSpike(0, 'x', 5).filter(e => e.type === 'noteon').length).toBe(0);
    });
  });

  describe('T-GEST: GestureCanvas mode', () => {
    beforeEach(() => {
      mapper.setSlotConfig(0, { mode: 'gesturecanvas' });
    });

    test('T-GEST-001: Speed maps to CC 1 + CC 74', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 1000, b: 500, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'cc' && e.cc === 1)).toBeTruthy();
      expect(events.find(e => e.type === 'cc' && e.cc === 74)).toBeTruthy();
    });

    test('T-GEST-002: Direction maps to CC 10 (pan)', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 100, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'cc' && e.cc === 10)).toBeTruthy();
    });

    test('T-GEST-003: Size maps to CC 91 + CC 93', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 15, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'cc' && e.cc === 91)).toBeTruthy();
      expect(events.find(e => e.type === 'cc' && e.cc === 93)).toBeTruthy();
      expect(events.find(e => e.type === 'cc' && e.cc === 91).value).toBe(events.find(e => e.type === 'cc' && e.cc === 93).value);
    });

    test('T-GEST-004: Complexity maps to CC 71 + CC 16', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 100, b: 200, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'cc' && e.cc === 71)).toBeTruthy();
      expect(events.find(e => e.type === 'cc' && e.cc === 16)).toBeTruthy();
    });

    test('T-GEST-005: Circularity maps to CC 17', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 100, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'cc' && e.cc === 17)).toBeTruthy();
    });

    test('T-GEST-006: orientation.a maps to CC 7 (scene) with 4 zones', () => {
      const z0 = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(z0.find(e => e.type === 'cc' && e.cc === 7).value).toBe(0);

      const z1 = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 100, b: 0, g: 0 }
      });
      expect(z1.find(e => e.type === 'cc' && e.cc === 7).value).toBe(42);

      const z2 = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 200, b: 0, g: 0 }
      });
      expect(z2.find(e => e.type === 'cc' && e.cc === 7).value).toBe(84);

      const z3 = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 300, b: 0, g: 0 }
      });
      expect(z3.find(e => e.type === 'cc' && e.cc === 7).value).toBe(126);
    });

    test('T-GEST-007: No Note On/Off events', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 15, y: 5, z: 8 },
        gyro: { a: 1000, b: 500, g: 200 },
        orientation: { a: 90, b: 45, g: 30 }
      });
      expect(events.filter(e => e.type === 'noteon').length).toBe(0);
      expect(events.filter(e => e.type === 'noteoff').length).toBe(0);
    });

    test('T-GEST-008: Zero gyro → speed CC at 0', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'cc' && e.cc === 1).value).toBe(0);
      expect(events.find(e => e.type === 'cc' && e.cc === 74).value).toBe(0);
    });

    test('T-GEST-009: Circularity = 0 until buffer full', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 100, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(events.find(e => e.type === 'cc' && e.cc === 17).value).toBe(0);
    });

    test('T-GEST-010: Buffer works per-slot', () => {
      mapper.setSlotConfig(1, { mode: 'gesturecanvas' });
      mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 100, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      mapper.processSensor(1, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 200, b: 50, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      expect(mapper._gyroBuffer[0]).toBeDefined();
      expect(mapper._gyroBuffer[1]).toBeDefined();
      expect(mapper._gyroBuffer[0]).not.toBe(mapper._gyroBuffer[1]);
    });
  });

  describe('KEY_TO_ROOT', () => {
    const { KEY_TO_ROOT } = require('../../server-bridge/midi-mapper');

    test('maps C to 0', () => {
      expect(KEY_TO_ROOT['C']).toBe(0);
    });

    test('maps enharmonic equivalents', () => {
      expect(KEY_TO_ROOT['C#']).toBe(KEY_TO_ROOT['Db']);
      expect(KEY_TO_ROOT['D#']).toBe(KEY_TO_ROOT['Eb']);
      expect(KEY_TO_ROOT['F#']).toBe(KEY_TO_ROOT['Gb']);
      expect(KEY_TO_ROOT['G#']).toBe(KEY_TO_ROOT['Ab']);
      expect(KEY_TO_ROOT['A#']).toBe(KEY_TO_ROOT['Bb']);
    });

    test('maps all natural keys', () => {
      expect(KEY_TO_ROOT['D']).toBe(2);
      expect(KEY_TO_ROOT['E']).toBe(4);
      expect(KEY_TO_ROOT['F']).toBe(5);
      expect(KEY_TO_ROOT['G']).toBe(7);
      expect(KEY_TO_ROOT['A']).toBe(9);
      expect(KEY_TO_ROOT['B']).toBe(11);
    });
  });
});
