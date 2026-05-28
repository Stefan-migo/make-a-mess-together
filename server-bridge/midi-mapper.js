const SCALES = {
  chromatic:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major:       [0, 2, 4, 5, 7, 9, 11],
  minor:       [0, 2, 3, 5, 7, 8, 10],
  pentatonic:  [0, 2, 4, 7, 9],
  blues:       [0, 3, 5, 6, 7, 10],
  wholeTone:   [0, 2, 4, 6, 8, 10],
  dorian:      [0, 2, 3, 5, 7, 9, 10],
  mixolydian:  [0, 2, 4, 5, 7, 9, 10],
  lydian:      [0, 2, 4, 6, 7, 9, 11],
  phrygian:    [0, 1, 3, 5, 7, 8, 10],
  locrian:     [0, 1, 3, 5, 6, 8, 10],
  augmented:   [0, 3, 4, 7, 8, 11],
  diminished:  [0, 2, 3, 5, 6, 8, 9, 11]
};

const KEY_TO_ROOT = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

const ARP_SUBDIVISIONS = [32, 24, 16, 12, 8, 6, 4, 3, 2, 1.5, 1];
const ARP_PATTERNS = ['up', 'down', 'upDown', 'random', 'pingPong'];

const CHORD_VOICINGS = {
  0: { intervals: [0, 4, 7],   extensions: { 0:[], 1:[10], 2:[14], 3:[17], 4:[21] } },
  1: { intervals: [0, 3, 7],   extensions: { 0:[], 1:[10], 2:[14], 3:[17], 4:[21] } },
  2: { intervals: [0, 3, 7],   extensions: { 0:[], 1:[10], 2:[14] } },
  3: { intervals: [0, 4, 7],   extensions: { 0:[], 1:[11], 2:[14], 3:[17] } },
  4: { intervals: [0, 4, 7],   extensions: { 0:[], 1:[10], 2:[14], 3:[17], 4:[21] } },
  5: { intervals: [0, 3, 7],   extensions: { 0:[], 1:[10], 2:[14] } },
  6: { intervals: [0, 3, 6],   extensions: { 0:[], 1:[10], 2:[14] } }
};

class MidiMapper {
  constructor() {
    this.globalConfig = {
      mode: 'chaos',
      scale: 'pentatonic',
      key: 'C',
      octave: 3,
      chaosAmount: 0.5,
      noteThreshold: 15,
      noteRange: [36, 96]
    };
    this.slotConfigs = {};
    this._heldNotes = {};
    this._heldChordNotes = {};
    this._arpState = {};
  }

  setGlobalConfig(config) {
    Object.assign(this.globalConfig, config);
  }

  setSlotConfig(slot, config) {
    this.slotConfigs[slot] = { ...config };
  }

  getScaleNotes(scaleName, keyName, octave) {
    const scale = SCALES[scaleName] || SCALES.pentatonic;
    const root = KEY_TO_ROOT[keyName] !== undefined ? KEY_TO_ROOT[keyName] : 0;
    const baseNote = (octave + 1) * 12 + root;
    return scale.map(interval => baseNote + interval);
  }

  _sensorToScaleDegree(value, scaleLength) {
    const index = Math.floor(value * scaleLength);
    return Math.min(index, scaleLength - 1);
  }

  _clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  _mapRange(value, inMin, inMax, outMin, outMax) {
    const inRange = inMax - inMin;
    if (inRange === 0) return outMin;
    const outRange = outMax - outMin;
    const normalized = (value - inMin) / inRange;
    return outMin + normalized * outRange;
  }

  _getConfig(slot) {
    return this.slotConfigs[slot] || this.globalConfig;
  }

  _calcAccelMag(accel) {
    if (!accel) return 0;
    return Math.sqrt(
      (accel.x || 0) ** 2 +
      (accel.y || 0) ** 2 +
      (accel.z || 0) ** 2
    );
  }

  _sensorToCC(value, inMin, inMax) {
    const mapped = this._mapRange(value, inMin, inMax, 0, 127);
    return Math.round(this._clamp(mapped, 0, 127));
  }

  _sensorToPitchBend(value, inMin, inMax) {
    const mapped = this._mapRange(value, inMin, inMax, 0, 16383);
    return Math.round(this._clamp(mapped, 0, 16383));
  }

  _calcArpRate(beta, bpm) {
    const normalized = Math.min(Math.max(beta / 180, 0), 1);
    const index = Math.min(Math.floor(normalized * (ARP_SUBDIVISIONS.length - 1)), ARP_SUBDIVISIONS.length - 1);
    const subdivision = ARP_SUBDIVISIONS[index];
    return Math.round(60000 / bpm / subdivision);
  }

  _calcArpPattern(y) {
    const normalized = Math.min(Math.max(Math.abs(y) / 10, 0), 1);
    const index = Math.min(Math.floor(normalized * (ARP_PATTERNS.length - 1)), ARP_PATTERNS.length - 1);
    return ARP_PATTERNS[index];
  }

  _calcArpOctaveRange(a) {
    const normalized = Math.min(Math.max((a + 2000) / 4000, 0), 1);
    return 1 + Math.floor(normalized * 3);
  }

  _calcArpGate(gamma) {
    const normalized = Math.min(Math.max((gamma + 90) / 180, 0), 1);
    return 0.1 + normalized * 0.8;
  }

  _buildArpNotePool(slot, config) {
    const scaleNotes = this.getScaleNotes(config.scale, config.key, config.octave);
    const range = this._arpState[slot]?.octaveRange || 2;
    const pool = [];
    for (let oct = 0; oct < range; oct++) {
      for (const note of scaleNotes) {
        pool.push(note + (oct * 12));
      }
    }
    return pool;
  }

  _nextArpStep(slot) {
    const state = this._arpState[slot];
    if (!state || state.notePool.length === 0) return null;

    const maxIdx = state.notePool.length - 1;
    let step;

    switch (state.pattern) {
      case 'up':
        step = state.step + 1;
        if (step > maxIdx) step = 0;
        break;
      case 'down':
        step = state.step - 1;
        if (step < 0) step = maxIdx;
        break;
      case 'upDown':
        step = state.step + state.direction;
        if (step > maxIdx) { state.direction = -1; step = maxIdx - 1; }
        if (step < 0) { state.direction = 1; step = 1; }
        break;
      case 'random':
        step = Math.floor(Math.random() * (maxIdx + 1));
        break;
      case 'pingPong':
        step = state.step + state.direction;
        if (step >= maxIdx) { state.direction = -1; }
        if (step <= 0) { state.direction = 1; }
        break;
      default:
        step = (state.step + 1) % (maxIdx + 1);
    }

    return Math.min(Math.max(step, 0), maxIdx);
  }

  _startArp(slot, config) {
    if (this._arpState[slot]?.active) return;

    const state = this._arpState[slot] || {};
    state.active = true;
    state.step = 0;
    state.direction = 1;
    state.pattern = state.pattern || 'up';
    state.rateMs = state.rateMs || 125;
    state.gate = state.gate || 0.5;
    state.octaveRange = state.octaveRange || 2;
    state.notePool = this._buildArpNotePool(slot, config);
    state.lastNote = null;
    this._arpState[slot] = state;
  }

  _stopArp(slot) {
    const state = this._arpState[slot];
    if (!state) return;
    state.active = false;
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  getArpState(slot) {
    return this._arpState[slot] || null;
  }

  processSensor(slot, sensorData) {
    const events = [];
    const config = this._getConfig(slot);
    const mode = config.mode || 'chaos';
    const accelMag = this._calcAccelMag(sensorData.accel);
    const accel = sensorData.accel || {};
    const gyro = sensorData.gyro || {};
    const orientation = sensorData.orientation || {};

    const channel = slot & 0x0f;

    if (mode === 'chaos') {
      const threshold = config.noteThreshold || 15;
      const beta = typeof orientation.b === 'number' ? orientation.b : 0;
      const noteRaw = 36 + Math.floor((beta / 180) * 60);
      const note = this._clamp(noteRaw, 0, 127);

      if (accelMag > threshold) {
        const velocityRaw = this._mapRange(accelMag, 15, 30, 40, 127);
        const velocity = this._clamp(Math.round(velocityRaw), 0, 127);
        events.push({ type: 'noteon', channel, note, velocity });
      }
    } else if (mode === 'scale') {
      const threshold = config.noteThreshold || 15;
      const beta = typeof orientation.b === 'number' ? orientation.b : 0;
      const normalized = beta / 180;
      const scaleNotes = this.getScaleNotes(config.scale, config.key, config.octave);
      const degree = this._sensorToScaleDegree(normalized, scaleNotes.length);
      const note = this._clamp(scaleNotes[degree], config.noteRange[0], config.noteRange[1]);

      if (accelMag > threshold) {
        const velocityRaw = this._mapRange(accelMag, 15, 30, 40, 127);
        const velocity = this._clamp(Math.round(velocityRaw), 0, 127);
        events.push({ type: 'noteon', channel, note, velocity });
      }
    } else if (mode === 'theremin') {
      const threshold = config.noteThreshold || 15;
      const releaseThreshold = threshold * 0.67;
      const beta = typeof orientation.b === 'number' ? orientation.b : 0;
      const normalized = beta / 180;
      const scaleNotes = this.getScaleNotes(config.scale, config.key, config.octave);
      const floatDegree = normalized * scaleNotes.length;
      const degreeIndex = Math.min(Math.floor(floatDegree), scaleNotes.length - 1);
      const fractional = floatDegree - degreeIndex;
      const baseNote = this._clamp(scaleNotes[degreeIndex] || scaleNotes[0], config.noteRange[0], config.noteRange[1]);
      const pitchBend = 8192 + Math.floor(fractional * 8191);
      const held = this._heldNotes[slot];

      events.push({ type: 'pitchbend', channel, value: pitchBend });

      const gyroA = typeof gyro.a === 'number' ? gyro.a : 0;
      const cc11 = this._sensorToCC(gyroA, -2000, 2000);
      events.push({ type: 'cc', channel, cc: 11, value: cc11 });

      if (accelMag > threshold && (!held || held.note !== baseNote)) {
        if (held) events.push({ type: 'noteoff', channel, note: held.note, velocity: 0 });
        events.push({ type: 'noteon', channel, note: baseNote, velocity: 80 });
        this._heldNotes[slot] = { note: baseNote, pitchBend };
      } else if (accelMag < releaseThreshold && held) {
        events.push({ type: 'noteoff', channel, note: held.note, velocity: 0 });
        this._heldNotes[slot] = null;
      }
    } else if (mode === 'arp') {
      const threshold = config.noteThreshold || 15;
      const releaseThreshold = threshold * 0.67;
      const beta = typeof orientation.b === 'number' ? orientation.b : 0;
      const accelY = typeof accel.y === 'number' ? accel.y : 0;
      const gyroA = typeof gyro.a === 'number' ? gyro.a : 0;
      const gamma = typeof orientation.g === 'number' ? orientation.g : 0;
      const bpm = config.bpm || 120;

      const rateMs = this._calcArpRate(beta, bpm);
      const pattern = this._calcArpPattern(accelY);
      const octaveRange = this._calcArpOctaveRange(gyroA);
      const gate = this._calcArpGate(gamma);

      if (!this._arpState[slot]) {
        this._arpState[slot] = { active: false };
      }
      const state = this._arpState[slot];
      state.pattern = pattern;
      state.rateMs = rateMs;
      state.octaveRange = octaveRange;
      state.gate = gate;
      state.notePool = this._buildArpNotePool(slot, config);

      if (accelMag > threshold && !state.active) {
        this._startArp(slot, config);
        const firstNote = state.notePool[0];
        if (firstNote !== undefined && firstNote !== null) {
          events.push({ type: 'noteon', channel, note: firstNote, velocity: 75 });
          state.step = 0;
          state.lastNote = firstNote;
        }
      } else if (accelMag < releaseThreshold && state.active) {
        this._stopArp(slot);
        if (state.lastNote !== null) {
          events.push({ type: 'noteoff', channel, note: state.lastNote, velocity: 0 });
          state.lastNote = null;
        }
      }
    } else if (mode === 'chord') {
      const threshold = config.noteThreshold || 15;
      const releaseThreshold = threshold * 0.67;
      const beta = typeof orientation.b === 'number' ? orientation.b : 0;
      const normalized = beta / 180;
      const degree = this._clamp(Math.floor(normalized * 7), 0, 6);
      const accelX = typeof accel.x === 'number' ? Math.abs(accel.x) : 0;
      const inversion = this._clamp(Math.floor(accelX / 3.5), 0, 2);
      const gyroZ = typeof gyro.g === 'number' ? Math.abs(gyro.g) : 0;
      const extension = this._clamp(Math.floor(gyroZ / 500), 0, 4);

      const chordDef = CHORD_VOICINGS[degree];
      const keyRoot = (KEY_TO_ROOT[config.key] !== undefined ? KEY_TO_ROOT[config.key] : 0);
      const baseOctave = (config.octave + 1) * 12;

      const allIntervals = [...chordDef.intervals, ...(chordDef.extensions[extension] || [])];

      let chordNotes = allIntervals.map(interval => {
        return this._clamp(baseOctave + keyRoot + interval, 0, 127);
      });

      for (let i = 0; i < inversion; i++) {
        chordNotes.push(chordNotes.shift());
      }

      const held = this._heldChordNotes[slot];

      if (accelMag > threshold) {
        if (held) {
          for (const note of held) {
            events.push({ type: 'noteoff', channel, note, velocity: 0 });
          }
        }
        for (const note of chordNotes) {
          events.push({ type: 'noteon', channel, note, velocity: 70 });
        }
        this._heldChordNotes[slot] = chordNotes;
      } else if (accelMag < releaseThreshold && held) {
        for (const note of held) {
          events.push({ type: 'noteoff', channel, note, velocity: 0 });
        }
        this._heldChordNotes[slot] = null;
      }
    }

    const ccMappings = [
      { cc: 1, value: this._sensorToCC(accel.x, -12, 12) },
      { cc: 2, value: this._sensorToCC(accel.y, -12, 12) },
      { cc: 3, value: this._sensorToCC(accel.z, -12, 12) },
      { cc: 4, value: this._sensorToCC(gyro.a, -2000, 2000) },
      { cc: 5, value: this._sensorToCC(gyro.b, -2000, 2000) },
      { cc: 6, value: this._sensorToCC(gyro.g, -2000, 2000) },
      { cc: 7, value: this._sensorToCC(orientation.a, 0, 360) },
      { cc: 8, value: this._sensorToCC(orientation.b, -180, 180) },
      { cc: 9, value: this._sensorToCC(orientation.g, -90, 90) }
    ];

    for (const mapping of ccMappings) {
      events.push({ type: 'cc', channel, cc: mapping.cc, value: mapping.value });
    }

    const pitchValue = this._sensorToPitchBend(gyro.a, -2000, 2000);
    events.push({ type: 'pitchbend', channel, value: pitchValue });

    return events;
  }
}

module.exports = { MidiMapper, SCALES, CHORD_VOICINGS };
