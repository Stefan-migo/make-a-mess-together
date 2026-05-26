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
    triggerAttack() {}
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
    brushType: [
      'classic', 'blade', 'dotted', 'stamped', 'velocity', 'dash',
      'sketchy', 'watercolor', 'spray', 'chalk', 'smoke', 'furry',
      'neon', 'plasma', 'vortex', 'bead', 'bubble', 'star',
      'quantum', 'aurora', 'geometric', 'pixel', 'shattered', 'web',
      'abstract', 'trail', 'isometric', 'triangulate', 'mirror-h', 'mirror-v'
    ][i],
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

  test('accumulates partial sensor updates for correct multi-sensor mapping', () => {
    const sm = {
      pitch: { source: 'accel', axis: 'y', range: [50, 2000], curve: 'linear' },
      filter: { source: 'gyro', axis: 'g', range: [200, 8000], curve: 'exponential' }
    };
    testConfig.slots[0].sensorMap = sm;

    dm.assign(0);
    dm._useFrameBudgetGovernor = false;
    const voice = dm._voices[0];
    expect(voice).toBeDefined();
    expect(voice.lastSensorData).toBeNull();

    // Bridge sends only accel data (gyro + orientation follow in separate msgs)
    dm.updateSensor(0, 'accel', { x: 5, y: 2, z: -3 });

    expect(voice.lastSensorData).toBeDefined();
    // Accel-mapped param should resolve from cache (BUG: gets default 50)
    expect(voice.lastSensorData.pitch).toBeGreaterThan(50);
    expect(voice.lastSensorData.pitch).toBeLessThanOrEqual(2000);
    // Gyro-mapped param should at least have a value (no crash)
    expect(voice.lastSensorData.filter).toBeDefined();

    delete testConfig.slots[0].sensorMap;
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

  test('updateCombinedSensor processes all three sensor types at once', () => {
    const sm = {
      pitch: { source: 'accel', axis: 'y', range: [50, 2000], curve: 'linear' },
      filter: { source: 'gyro', axis: 'g', range: [200, 8000], curve: 'exponential' },
      pan: { source: 'orientation', axis: 'a', range: [-1, 1], curve: 'linear' }
    };
    testConfig.slots[0].sensorMap = sm;

    dm.assign(0);
    dm._useFrameBudgetGovernor = false;
    const voice = dm._voices[0];
    expect(voice).toBeDefined();

    const data = {
      accel: { x: 0.1, y: 5, z: -3 },
      gyro: { a: 0.5, b: 1, g: 2 },
      orientation: { a: 90, b: 45, g: 0 }
    };

    dm.updateCombinedSensor(0, data);

    expect(dm._sensorCache[0]).toBeDefined();
    expect(dm._sensorCache[0].accel).toEqual(data.accel);
    expect(dm._sensorCache[0].gyro).toEqual(data.gyro);
    expect(dm._sensorCache[0].orientation).toEqual(data.orientation);

    expect(voice.lastSensorData).toBeDefined();
    expect(voice.lastSensorData.pitch).toBeGreaterThan(50);
    expect(voice.lastSensorData.filter).toBeGreaterThan(200);
    expect(voice.lastSensorData.pan).toBeGreaterThanOrEqual(-1);
    expect(voice.lastSensorData.pan).toBeLessThanOrEqual(1);

    delete testConfig.slots[0].sensorMap;
  });

  test('updateCombinedSensor does not throw when no voice exists', () => {
    expect(() => {
      dm.updateCombinedSensor(99, {
        accel: { x: 0, y: 0, z: 9.81 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
    }).not.toThrow();
  });

  test('updateCombinedSensor does not throw with partial data', () => {
    dm.assign(0);
    expect(() => {
      dm.updateCombinedSensor(0, {
        accel: { x: 1, y: 2, z: 3 }
      });
    }).not.toThrow();
  });

  test('updateSensor still works after updateCombinedSensor — backward compat', () => {
    dm.assign(0);
    dm.updateCombinedSensor(0, {
      accel: { x: 0.1, y: 5, z: -3 },
      gyro: { a: 0.5, b: 1, g: 2 },
      orientation: { a: 90, b: 45, g: 0 }
    });
    expect(() => {
      dm.updateSensor(0, 'accel', { x: 0.2, y: 3, z: 9 });
    }).not.toThrow();
  });
});

describe('DeviceManager — Phase 5: Stripped Dependencies', () => {

  function makeBrushCanvas() {
    const bc = new (require('../../p5-sketch/brush-canvas.js').BrushCanvas)(testConfig, {});
    return bc;
  }

  test('T015: constructor works with just engine + config (no brushCanvas)', () => {
    const bus = new (require('../../p5-sketch/audio-bus.js').AudioBus)();
    const engine = new (require('../../p5-sketch/sound-engine.js').SoundEngine)(bus);
    expect(() => {
      const dm2 = new DeviceManager(engine, testConfig);
      dm2.disposeAll();
    }).not.toThrow();
  });

  test('T016: assign does NOT create _visualStates entries', () => {
    const bus = new (require('../../p5-sketch/audio-bus.js').AudioBus)();
    const engine = new (require('../../p5-sketch/sound-engine.js').SoundEngine)(bus);
    const dm2 = new DeviceManager(engine, testConfig);
    dm2.assign(0);
    // After Phase 5, _visualStates should not exist
    expect(dm2._visualStates).toBeUndefined();
    dm2.disposeAll();
  });

  test('T017: no _cubeSnek property exists', () => {
    const bus = new (require('../../p5-sketch/audio-bus.js').AudioBus)();
    const engine = new (require('../../p5-sketch/sound-engine.js').SoundEngine)(bus);
    const dm2 = new DeviceManager(engine, testConfig);
    // After Phase 5, _cubeSnek should not exist
    expect(dm2._cubeSnek).toBeUndefined();
    dm2.disposeAll();
  });

  test('T018: assign creates brush cursor when brushCanvas provided', () => {
    const bus = new (require('../../p5-sketch/audio-bus.js').AudioBus)();
    const engine = new (require('../../p5-sketch/sound-engine.js').SoundEngine)(bus);
    const bc = makeBrushCanvas();
    const dm2 = new DeviceManager(engine, testConfig, bc);
    dm2.assign(0);
    expect(bc.getCursor(0)).not.toBeNull();
    dm2.disposeAll();
  });

  test('T019: disconnect does not throw', () => {
    const bus = new (require('../../p5-sketch/audio-bus.js').AudioBus)();
    const engine = new (require('../../p5-sketch/sound-engine.js').SoundEngine)(bus);
    const dm2 = new DeviceManager(engine, testConfig);
    dm2.assign(0);
    expect(() => {
      dm2.disconnect(0);
    }).not.toThrow();
    dm2.disposeAll();
  });
});

describe('DeviceManager — Frame-Budget Governor', () => {
  let dm;
  let originalPerformanceNow;

  beforeAll(() => {
    originalPerformanceNow = performance.now.bind(performance);
  });

  afterAll(() => {
    performance.now = originalPerformanceNow;
  });

  beforeEach(() => {
    const bus = new AudioBus();
    const engine = new SoundEngine(bus);
    const cfg = JSON.parse(JSON.stringify(testConfig));
    cfg.slots[0].sensorMap = {
      pitch: { source: 'accel', axis: 'y', range: [50, 2000], curve: 'linear' }
    };
    cfg.slots[1].sensorMap = {
      filter: { source: 'gyro', axis: 'g', range: [200, 8000], curve: 'exponential' }
    };
    cfg.slots[2].sensorMap = {
      depth: { source: 'gyro', axis: 'a', range: [0, 1], curve: 'linear' }
    };
    dm = new DeviceManager(engine, cfg);
  });

  afterEach(() => {
    dm.disposeAll();
  });

  test('processAllVoices processes all active slots when within budget', () => {
    performance.now = originalPerformanceNow;

    dm.assign(0);
    dm.assign(1);

    dm.updateCombinedSensor(0, {
      accel: { x: 0, y: 5, z: 0 },
      gyro: { a: 0, b: 0, g: 0 },
      orientation: { a: 0, b: 0, g: 0 }
    });
    dm.updateCombinedSensor(1, {
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 2 },
      orientation: { a: 0, b: 0, g: 0 }
    });

    dm.processAllVoices();

    const voice0 = dm._voices[0];
    const voice1 = dm._voices[1];
    expect(voice0.lastSensorData).toBeDefined();
    expect(voice0.lastSensorData.pitch).toBeGreaterThan(50);
    expect(voice1.lastSensorData).toBeDefined();
    expect(voice1.lastSensorData.filter).toBeGreaterThan(200);
    expect(dm._frameBudget.skippedSlots.size).toBe(0);
  });

  test('processAllVoices skips slots when budget exceeded', () => {
    let callCount = 0;
    performance.now = jest.fn(() => {
      callCount++;
      if (callCount <= 2) return 1000;
      return 1100;
    });

    dm.assign(0);
    dm.assign(1);
    dm.assign(2);

    for (let i = 0; i < 3; i++) {
      dm.updateCombinedSensor(i, {
        accel: { x: 0, y: 5, z: 0 },
        gyro: { a: 0, b: 0, g: 2 },
        orientation: { a: 0, b: 0, g: 0 }
      });
    }

    dm.processAllVoices();

    const voice0 = dm._voices[0];
    expect(voice0.lastSensorData).toBeDefined();

    const voice1 = dm._voices[1];
    expect(voice1.lastSensorData).toBeNull();

    const voice2 = dm._voices[2];
    expect(voice2.lastSensorData).toBeNull();

    performance.now = originalPerformanceNow;
  });

  test('skipped slots are reported in _frameBudget.skippedSlots', () => {
    let callCount = 0;
    performance.now = jest.fn(() => {
      callCount++;
      if (callCount <= 2) return 1000;
      return 1100;
    });

    dm.assign(0);
    dm.assign(1);
    dm.assign(2);

    for (let i = 0; i < 3; i++) {
      dm.updateCombinedSensor(i, {
        accel: { x: 0, y: 5, z: 0 },
        gyro: { a: 0, b: 0, g: 2 },
        orientation: { a: 0, b: 0, g: 0 }
      });
    }

    dm.processAllVoices();

    expect(dm._frameBudget.skippedSlots.has(1)).toBe(true);
    expect(dm._frameBudget.skippedSlots.has(2)).toBe(true);
    expect(dm._frameBudget.skippedSlots.has(0)).toBe(false);

    performance.now = originalPerformanceNow;
  });
});
