global.Tone = {
  Gain: class {
    constructor(v) { this.gain = { value: v || 1 }; this._connections = []; }
    connect(n) { this._connections.push(n); return n; }
    dispose() { this._connections = []; }
    toDestination() { return this; }
  },
  Limiter: class {
    constructor() { this._connections = []; this.threshold = -1; }
    connect(n) { this._connections.push(n); return n; }
    dispose() { this._connections = []; }
    toDestination() { return this; }
  },
  Reverb: class {
    constructor() { this.roomSize = { value: 0.5 }; this.wet = { value: 0.3 }; this.decay = 2; }
    connect(n) { return n; }
    dispose() {}
  },
  FeedbackDelay: class {
    constructor() { this.delayTime = { value: 0.3 }; this.feedback = { value: 0.4 }; this.wet = { value: 0.2 }; }
    connect(n) { return n; }
    dispose() {}
  },
  Oscillator: class {
    constructor() { this.frequency = { value: 440, rampTo: (v, t) => {} }; this.detune = { value: 0 }; this.type = 'sine'; }
    connect(n) { return n; }
    start() {}
    stop() {}
    dispose() {}
  },
  Filter: class {
    constructor() { this.frequency = { value: 2000 }; this.Q = { value: 1 }; this.type = 'lowpass'; }
    connect(n) { return n; }
    dispose() {}
  },
  AmplitudeEnvelope: class {
    constructor() { this.attack = 0.01; this.decay = 0.3; this.sustain = 0.4; this.release = 0.5; }
    connect(n) { return n; }
    triggerAttackRelease(d, t) {}
    dispose() {}
  },
  Noise: class {
    constructor() { this.type = 'white'; }
    connect(n) { return n; }
    start() {}
    stop() {}
    dispose() {}
  },
  Panner: class {
    constructor(v) { this.value = v || 0; }
    connect(n) { return n; }
    dispose() {}
  },
  LFO: class {
    constructor() { this.frequency = { value: 0.5 }; this.min = 200; this.max = 4000; this.type = 'sine'; }
    connect(n) { return n; }
    start() {}
    stop() {}
    dispose() {}
  },
  MembraneSynth: class {
    constructor() { this.frequency = { value: 100 }; this.octaves = 5; this.pitchDecay = 0.05; this.envelope = { attack: 0.001, decay: 0.4, sustain: 0 }; }
    connect(n) { return n; }
    triggerAttackRelease(n, d) {}
    dispose() {}
  },
  Synth: class {
    constructor() { this.oscillator = { type: 'triangle' }; this.envelope = { attack: 0.001, decay: 0.2, sustain: 0 }; }
    connect(n) { return n; }
    dispose() {}
  },
  BitCrusher: class {
    constructor() { this.bits = { value: 8 }; }
    connect(n) { return n; }
    dispose() {}
  },
  WaveShaper: class {
    constructor() { this.curve = null; }
    connect(n) { return n; }
    dispose() {}
  },
  Pattern: class {
    constructor(cb, vals, pat) { this.callback = cb; this.values = vals; this.pattern = pat; }
    next(t) {}
  },
  Frequency: { toFrequency: (n) => { const f = { C3: 131, E3: 165, G3: 196, C4: 262 }; return f[n] || 440; } },
  Destination: { _connections: [] },
  now: () => 0
};

global.MAX_GRAINS = 8;

const { AudioBus } = require('../../p5-sketch/audio-bus.js');
const { SoundEngine } = require('../../p5-sketch/sound-engine.js');
const { DeviceManager } = require('../../p5-sketch/device-manager.js');
const { SensorMapper } = require('../../p5-sketch/sensor-mapper.js');

const testConfig = {
  maxDevices: 30,
  bridgeUrl: 'ws://localhost:8080',
  canvasWidth: 1600,
  canvasHeight: 900,
  centerX: 800,
  centerY: 450,
  baseRadius: 300,
  frameRate: 30,
  drumThreshold: 15,
  drumHysteresisRatio: 0.5,
  smoothCoefficient: 0.3,
  slots: Array.from({ length: 30 }, (_, i) => ({
    soundType: [
      'synthBasic', 'synthFM', 'synthAM', 'synthDuo', 'synthMono',
      'arpRate', 'arpPattern', 'arpGate', 'arpDirection',
      'noiseWhite', 'noisePink', 'noiseBrown',
      'kick', 'snare', 'hiHat', 'drumPattern', 'tom',
      'bitcrush', 'stutter', 'wavefold', 'glitchRandom',
      'grainSize', 'grainDensity', 'grainScatter', 'grainPosition',
      'reverb', 'delay', 'distortion', 'chorus', 'compressor'
    ][i],
    slotIndex: i,
    color: { h: i * 12, s: 80, b: 90 },
    isFxModulator: i >= 25,
    sensorMap: {}
  }))
};

describe('DeviceManager', () => {
  let dm;

  beforeEach(() => {
    const bus = new AudioBus();
    const engine = new SoundEngine(bus);
    dm = new DeviceManager(engine, testConfig);
  });

  afterEach(() => {
    dm.disposeAll();
  });

  test('assign creates a voice, disconnect destroys it', () => {
    dm.assign(0);
    expect(dm.isSlotActive(0)).toBe(true);
    expect(dm.activeCount).toBe(1);

    dm.disconnect(0);
    expect(dm.isSlotActive(0)).toBe(false);
    expect(dm.activeCount).toBe(0);
  });

  test('updateSensor routes data through sensor mapper', () => {
    dm.assign(0);
    const sensorData = {
      accel: { x: 0, y: 5, z: 0 },
      gyro: { a: 0, b: 0, g: 0 },
      orientation: { a: 0, b: 0, g: 0 }
    };

    expect(() => {
      dm.updateSensor(0, 'accel', sensorData);
    }).not.toThrow();
  });

  test('activeCount reflects correct number of active slots', () => {
    expect(dm.activeCount).toBe(0);
    dm.assign(0);
    expect(dm.activeCount).toBe(1);
    dm.assign(1);
    expect(dm.activeCount).toBe(2);
    dm.disconnect(0);
    expect(dm.activeCount).toBe(1);
    dm.disconnect(1);
    expect(dm.activeCount).toBe(0);
  });

  test('assign same slot twice disposes first voice', () => {
    dm.assign(0);
    const count1 = dm.activeCount;
    dm.assign(0);
    expect(dm.activeCount).toBe(count1);
  });

  test('drawHUD does not throw', () => {
    dm.assign(0);
    dm.assign(1);
    expect(() => {
      dm.drawHUD();
    }).not.toThrow();
  });

  test('disposeAll clears all voices', () => {
    dm.assign(0);
    dm.assign(1);
    dm.assign(2);
    expect(dm.activeCount).toBe(3);
    dm.disposeAll();
    expect(dm.activeCount).toBe(0);
  });

  test('activeSlots returns list of active slot numbers', () => {
    dm.assign(2);
    dm.assign(5);
    dm.assign(8);
    const active = dm.activeSlots;
    expect(active).toContain(2);
    expect(active).toContain(5);
    expect(active).toContain(8);
    expect(active.length).toBe(3);
  });
});
