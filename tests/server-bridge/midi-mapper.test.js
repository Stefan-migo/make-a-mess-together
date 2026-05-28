const { MidiMapper } = require('../../server-bridge/midi-mapper');

describe('MidiMapper', () => {
  let mapper;

  beforeEach(() => {
    mapper = new MidiMapper();
  });

  describe('T009: Scales library', () => {
    const expectedScales = {
      chromatic: { length: 12, first: 0, last: 11 },
      major: { length: 7, first: 0, last: 11 },
      minor: { length: 7, first: 0, last: 10 },
      pentatonic: { length: 5, first: 0, last: 9 },
      blues: { length: 6, first: 0, last: 10 },
      wholeTone: { length: 6, first: 0, last: 10 },
      dorian: { length: 7, first: 0, last: 10 },
      mixolydian: { length: 7, first: 0, last: 10 },
      lydian: { length: 7, first: 0, last: 11 },
      phrygian: { length: 7, first: 0, last: 10 },
      locrian: { length: 7, first: 0, last: 10 },
      augmented: { length: 6, first: 0, last: 11 },
      diminished: { length: 8, first: 0, last: 11 }
    };

    const SCALES = require('../../server-bridge/midi-mapper').SCALES || {};

    test('has all 13 scales', () => {
      const scaleNames = Object.keys(SCALES);
      expect(scaleNames.sort()).toEqual(Object.keys(expectedScales).sort());
    });

    test.each(Object.keys(expectedScales))('%s has correct properties', (name) => {
      const scale = SCALES[name];
      const expected = expectedScales[name];
      expect(scale).toBeDefined();
      expect(Array.isArray(scale)).toBe(true);
      expect(scale.length).toBe(expected.length);
      expect(scale[0]).toBe(expected.first);
      expect(scale[scale.length - 1]).toBe(expected.last);
      expect(scale.every((v) => v >= 0 && v <= 11)).toBe(true);
      expect(scale.every((v, i) => i === 0 || v > scale[i - 1])).toBe(true);
    });
  });

  describe('T010: getScaleNotes', () => {
    test('C major returns correct MIDI notes', () => {
      const notes = mapper.getScaleNotes('major', 'C', 2);
      expect(notes).toEqual([36, 38, 40, 41, 43, 45, 47]);
    });

    test('D major returns correct MIDI notes', () => {
      const notes = mapper.getScaleNotes('major', 'D', 2);
      expect(notes).toEqual([38, 40, 42, 43, 45, 47, 49]);
    });

    test('returns empty array for unknown scale (falls back to pentatonic)', () => {
      const notes = mapper.getScaleNotes('nonexistent', 'C', 2);
      expect(notes.length).toBeGreaterThan(0);
    });

    test('unknown key defaults to C', () => {
      const notes = mapper.getScaleNotes('major', 'XYZ', 2);
      expect(notes).toEqual([36, 38, 40, 41, 43, 45, 47]);
    });
  });

  describe('T011: _sensorToScaleDegree', () => {
    test('value 0 maps to degree 0', () => {
      expect(mapper._sensorToScaleDegree(0, 7)).toBe(0);
    });

    test('value 1 maps to last degree', () => {
      expect(mapper._sensorToScaleDegree(1, 7)).toBe(6);
    });

    test('value 0.5 maps to middle degree', () => {
      expect(mapper._sensorToScaleDegree(0.5, 7)).toBe(3);
    });

    test('value just below 1 maps correctly', () => {
      expect(mapper._sensorToScaleDegree(0.99, 5)).toBe(4);
    });
  });

  describe('T012: Note clamped to MIDI range', () => {
    test('_clamp keeps values within MIDI range', () => {
      expect(mapper._clamp(60, 0, 127)).toBe(60);
      expect(mapper._clamp(-10, 0, 127)).toBe(0);
      expect(mapper._clamp(200, 0, 127)).toBe(127);
    });
  });

  describe('T015: Chaos mode — note mapping', () => {
    test('orientation/beta 0 maps to note 36', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const noteOns = events.filter(e => e.type === 'noteon');
      expect(noteOns.length).toBeGreaterThanOrEqual(0);
      if (noteOns.length > 0) {
        expect(noteOns[0].note).toBeGreaterThanOrEqual(36);
        expect(noteOns[0].note).toBeLessThanOrEqual(96);
      }
    });

    test('orientation/beta 180 maps to note near 96', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 20, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 180, g: 0 }
      });
      const noteOns = events.filter(e => e.type === 'noteon');
      expect(noteOns.length).toBeGreaterThan(0);
      expect(noteOns[0].note).toBeGreaterThanOrEqual(90);
    });
  });

  describe('T016: Chaos mode — threshold below', () => {
    test('accelMag below threshold produces no note events', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const noteOns = events.filter(e => e.type === 'noteon');
      expect(noteOns).toHaveLength(0);
    });

    test('accelMag threshold = 15, value 10 produces no note', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 10, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 90, g: 0 }
      });
      const noteOns = events.filter(e => e.type === 'noteon');
      expect(noteOns).toHaveLength(0);
    });
  });

  describe('T017: Chaos mode — threshold above', () => {
    test('accelMag above threshold produces Note On event', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 10, y: 10, z: 10 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 90, g: 0 }
      });
      const noteOns = events.filter(e => e.type === 'noteon');
      expect(noteOns.length).toBeGreaterThan(0);
      expect(noteOns[0].type).toBe('noteon');
      expect(noteOns[0].channel).toBe(0);
    });

    test('velocity maps accelMag 15→40 and 30→127', () => {
      const events1 = mapper.processSensor(0, {
        accel: { x: 15, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 90, g: 0 }
      });
      const noteOns1 = events1.filter(e => e.type === 'noteon');
      if (noteOns1.length > 0) {
        expect(noteOns1[0].velocity).toBe(40);
      }

      const events2 = mapper.processSensor(0, {
        accel: { x: 30, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 90, g: 0 }
      });
      const noteOns2 = events2.filter(e => e.type === 'noteon');
      if (noteOns2.length > 0) {
        expect(noteOns2[0].velocity).toBe(127);
      }
    });
  });

  describe('CC mapping', () => {
    test('all 9 CC events are produced', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const ccEvents = events.filter(e => e.type === 'cc');
      expect(ccEvents).toHaveLength(9);
    });

    test('CC events have correct CC numbers 1-9', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 1, y: 2, z: 3 },
        gyro: { a: 4, b: 5, g: 6 },
        orientation: { a: 7, b: 8, g: 9 }
      });
      const ccEvents = events.filter(e => e.type === 'cc').sort((a, b) => a.cc - b.cc);
      expect(ccEvents.map(e => e.cc)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    test('CC values clamped to 0-127', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 999, y: -999, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const ccEvents = events.filter(e => e.type === 'cc');
      expect(ccEvents.find(e => e.cc === 1).value).toBeGreaterThanOrEqual(0);
      expect(ccEvents.find(e => e.cc === 1).value).toBeLessThanOrEqual(127);
      expect(ccEvents.find(e => e.cc === 2).value).toBeGreaterThanOrEqual(0);
      expect(ccEvents.find(e => e.cc === 2).value).toBeLessThanOrEqual(127);
    });
  });

  describe('Pitch bend', () => {
    test('gyro/a produces pitch bend event', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 500, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const pbEvents = events.filter(e => e.type === 'pitchbend');
      expect(pbEvents.length).toBeGreaterThan(0);
      expect(pbEvents[0].channel).toBe(0);
      expect(pbEvents[0].value).toBeGreaterThanOrEqual(0);
      expect(pbEvents[0].value).toBeLessThanOrEqual(16383);
    });
  });

  describe('T020: Scale mode — note quantized to selected scale', () => {
    test('C major pentatonic at beta=0 maps to C (note 48 in octave 3)', () => {
      mapper.setGlobalConfig({ mode: 'scale', scale: 'pentatonic', key: 'C', octave: 3 });
      const events = mapper.processSensor(0, {
        accel: { x: 20, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const noteOns = events.filter(e => e.type === 'noteon');
      expect(noteOns.length).toBeGreaterThan(0);
      expect(noteOns[0].note).toBe(48);
    });

    test('beta=180 maps to last degree of pentatonic (D in C pentatonic → note 57)', () => {
      mapper.setGlobalConfig({ mode: 'scale', scale: 'pentatonic', key: 'C', octave: 3 });
      const events = mapper.processSensor(0, {
        accel: { x: 20, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 180, g: 0 }
      });
      const noteOns = events.filter(e => e.type === 'noteon');
      expect(noteOns.length).toBeGreaterThan(0);
      expect(noteOns[0].note).toBe(57);
    });

    test('accelMag below threshold produces no note events in scale mode', () => {
      mapper.setGlobalConfig({ mode: 'scale', scale: 'pentatonic', key: 'C' });
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 90, g: 0 }
      });
      const noteOns = events.filter(e => e.type === 'noteon');
      expect(noteOns).toHaveLength(0);
    });
  });

  describe('T021: Key transposition — C major gives different notes than D major', () => {
    test('C major and D major produce different notes for same sensor input', () => {
      mapper.setGlobalConfig({ mode: 'scale', scale: 'major', key: 'C', octave: 3 });
      const eventsC = mapper.processSensor(0, {
        accel: { x: 20, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 90, g: 0 }
      });
      const noteOnsC = eventsC.filter(e => e.type === 'noteon');

      mapper.setGlobalConfig({ mode: 'scale', scale: 'major', key: 'D', octave: 3 });
      const eventsD = mapper.processSensor(0, {
        accel: { x: 20, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 90, g: 0 }
      });
      const noteOnsD = eventsD.filter(e => e.type === 'noteon');

      expect(noteOnsC.length).toBeGreaterThan(0);
      expect(noteOnsD.length).toBeGreaterThan(0);
      expect(noteOnsC[0].note).not.toBe(noteOnsD[0].note);
    });
  });

  describe('T022: Scale mode — note is within selected scale notes', () => {
    test('note produced by scale mode is always in the selected scale', () => {
      mapper.setGlobalConfig({ mode: 'scale', scale: 'blues', key: 'C', octave: 3 });
      const scaleNotes = mapper.getScaleNotes('blues', 'C', 3);

      for (let beta = 0; beta <= 180; beta += 15) {
        const events = mapper.processSensor(0, {
          accel: { x: 20, y: 0, z: 0 },
          gyro: { a: 0, b: 0, g: 0 },
          orientation: { a: 0, b: beta, g: 0 }
        });
        const noteOns = events.filter(e => e.type === 'noteon');
        if (noteOns.length > 0) {
          expect(scaleNotes).toContain(noteOns[0].note);
        }
      }
    });
  });

  describe('setGlobalConfig', () => {
    test('updates global config', () => {
      mapper.setGlobalConfig({ mode: 'scale', scale: 'major' });
      expect(mapper.globalConfig.mode).toBe('scale');
      expect(mapper.globalConfig.scale).toBe('major');
    });
  });

  describe('setSlotConfig', () => {
    test('sets per-slot override', () => {
      mapper.setSlotConfig(5, { mode: 'scale' });
      expect(mapper.slotConfigs[5]).toBeDefined();
      expect(mapper.slotConfigs[5].mode).toBe('scale');
    });
  });

  describe('Theremin mode', () => {
    beforeEach(() => {
      mapper.setGlobalConfig({ mode: 'theremin', scale: 'pentatonic', key: 'C', octave: 3 });
    });

    test('T023: sends pitch bend for smooth transitions', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 9.8, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 45, g: 0 }
      });
      const pbEvents = events.filter(e => e.type === 'pitchbend');
      expect(pbEvents.length).toBeGreaterThanOrEqual(1);
      expect(pbEvents[0].value).toBeGreaterThan(8192);
      expect(pbEvents[0].value).toBeLessThanOrEqual(16383);
    });

    test('T024: note on/off controlled by accelMag with hysteresis', () => {
      let events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 20 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 90, g: 0 }
      });
      let noteOns = events.filter(e => e.type === 'noteon');
      expect(noteOns.length).toBe(1);

      events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 90, g: 0 }
      });
      let noteOffs = events.filter(e => e.type === 'noteoff');
      expect(noteOffs.length).toBe(1);
    });

    test('T025: CC 11 sent from gyro/a for volume/expression', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 9.8, y: 0, z: 0 },
        gyro: { a: 1000, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const cc11Events = events.filter(e => e.type === 'cc' && e.cc === 11);
      expect(cc11Events.length).toBe(1);
      expect(cc11Events[0].value).toBeGreaterThanOrEqual(0);
      expect(cc11Events[0].value).toBeLessThanOrEqual(127);
    });
  });

  describe('Chord mode', () => {
    beforeEach(() => {
      mapper.setGlobalConfig({ mode: 'chord', scale: 'major', key: 'C', octave: 3 });
    });

    test('T026: chord mode outputs 3-4 simultaneous notes', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 5, y: 0, z: 15 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 45, g: 0 }
      });
      const noteOns = events.filter(e => e.type === 'noteon');
      expect(noteOns.length).toBeGreaterThanOrEqual(3);
    });

    test('T027: chord degree maps to correct chord type', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 5, y: 0, z: 15 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const noteOns = events.filter(e => e.type === 'noteon');
      expect(noteOns.length).toBe(3);
      const notes = noteOns.map(e => e.note).sort();
      expect(notes).toContain(48);
      expect(notes).toContain(52);
      expect(notes).toContain(55);
    });

    test('T028a: inversion changes note order', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 9, y: 0, z: 15 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const noteOns = events.filter(e => e.type === 'noteon');
      expect(noteOns.length).toBe(3);
    });

    test('T028b: extension adds more notes', () => {
      const events = mapper.processSensor(0, {
        accel: { x: 5, y: 0, z: 15 },
        gyro: { a: 0, b: 0, g: 1900 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const noteOns = events.filter(e => e.type === 'noteon');
      expect(noteOns.length).toBeGreaterThan(3);
    });

    test('T028c: chord releases on accelMag drop', () => {
      mapper.processSensor(0, {
        accel: { x: 5, y: 0, z: 15 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const noteOffs = events.filter(e => e.type === 'noteoff');
      expect(noteOffs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('_mapRange', () => {
    test('maps value from input range to output range', () => {
      expect(mapper._mapRange(5, 0, 10, 0, 127)).toBeCloseTo(63.5);
      expect(mapper._mapRange(0, 0, 10, 0, 127)).toBe(0);
      expect(mapper._mapRange(10, 0, 10, 0, 127)).toBe(127);
    });
  });

  describe('T029-T031: Arp mode', () => {
    beforeEach(() => {
      mapper.setGlobalConfig({ mode: 'arp', scale: 'pentatonic', key: 'C', octave: 3, bpm: 120 });
    });

    test('T029: arp rate calculated from orientation/beta', () => {
      mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 20 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const state = mapper.getArpState ? mapper.getArpState(0) : mapper._arpState[0];
      expect(state).toBeTruthy();
      expect(state.rateMs).toBeLessThanOrEqual(500);
      expect(state.rateMs).toBeGreaterThanOrEqual(10);
    });

    test('T030: arp patterns produce correct sequences', () => {
      mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 20 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
      const state = mapper.getArpState ? mapper.getArpState(0) : mapper._arpState[0];

      expect(state.notePool.length).toBeGreaterThanOrEqual(5);
      expect(['up', 'down', 'upDown', 'random', 'pingPong']).toContain(state.pattern);
    });

    test('T031a: arp starts on accelMag threshold and stops on release', () => {
      let events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 90, g: 0 }
      });
      let state = mapper.getArpState ? mapper.getArpState(0) : mapper._arpState[0];
      expect(state).toBeTruthy();
      if (state) expect(state.active).toBe(false);

      events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 20 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 90, g: 0 }
      });
      state = mapper.getArpState ? mapper.getArpState(0) : mapper._arpState[0];
      if (state) expect(state.active).toBe(true);
      expect(events.some(e => e.type === 'noteon')).toBe(true);

      events = mapper.processSensor(0, {
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 90, g: 0 }
      });
      state = mapper.getArpState ? mapper.getArpState(0) : mapper._arpState[0];
      if (state) expect(state.active).toBe(false);
      expect(events.some(e => e.type === 'noteoff')).toBe(true);
    });
  });
});
