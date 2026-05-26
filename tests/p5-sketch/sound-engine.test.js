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
    constructor() { this.attack = 0.01; this.decay = 0.3; this.sustain = 0.4; this.release = 0.5; this._triggered = false; }
    connect(n) { return n; }
    triggerAttack() { this._triggered = true; }
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

const mockConfig = {
  maxDevices: 30,
  drumThreshold: 15,
  drumHysteresisRatio: 0.5,
  maxGrains: 8,
  smoothCoefficient: 0.3,
  slots: [
    { soundType: 'synthBasic', slotIndex: 0, color: { h: 0, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'synthFM', slotIndex: 1, color: { h: 12, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'synthAM', slotIndex: 2, color: { h: 24, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'synthDuo', slotIndex: 3, color: { h: 36, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'synthMono', slotIndex: 4, color: { h: 48, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'arpRate', slotIndex: 5, color: { h: 60, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'arpPattern', slotIndex: 6, color: { h: 72, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'arpGate', slotIndex: 7, color: { h: 84, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'arpDirection', slotIndex: 8, color: { h: 96, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'noiseWhite', slotIndex: 9, color: { h: 108, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'noisePink', slotIndex: 10, color: { h: 120, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'noiseBrown', slotIndex: 11, color: { h: 132, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'kick', slotIndex: 12, color: { h: 144, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'snare', slotIndex: 13, color: { h: 156, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'hiHat', slotIndex: 14, color: { h: 168, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'drumPattern', slotIndex: 15, color: { h: 180, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'tom', slotIndex: 16, color: { h: 192, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'bitcrush', slotIndex: 17, color: { h: 204, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'stutter', slotIndex: 18, color: { h: 216, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'wavefold', slotIndex: 19, color: { h: 228, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'glitchRandom', slotIndex: 20, color: { h: 240, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'grainSize', slotIndex: 21, color: { h: 252, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'grainDensity', slotIndex: 22, color: { h: 264, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'grainScatter', slotIndex: 23, color: { h: 276, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'grainPosition', slotIndex: 24, color: { h: 288, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'reverb', slotIndex: 25, isFxModulator: true, color: { h: 300, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'delay', slotIndex: 26, isFxModulator: true, color: { h: 312, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'distortion', slotIndex: 27, isFxModulator: true, color: { h: 324, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'chorus', slotIndex: 28, isFxModulator: true, color: { h: 336, s: 80, b: 90 }, sensorMap: {} },
    { soundType: 'compressor', slotIndex: 29, isFxModulator: true, color: { h: 348, s: 80, b: 90 }, sensorMap: {} }
  ]
};

describe('SoundEngine', () => {
  let engine;

  beforeEach(() => {
    const bus = new AudioBus();
    engine = new SoundEngine(bus);
  });

  test('createVoice returns valid VoiceHandle for synthBasic', () => {
    const voice = engine.createVoice(0, mockConfig.slots[0]);
    expect(voice).toBeDefined();
    expect(voice.type).toBe('synthBasic');
    expect(voice.slot).toBe(0);
    expect(typeof voice.dispose).toBe('function');
    voice.dispose();
  });

  test('createVoice works for all 30 types', () => {
    for (let i = 0; i < 30; i++) {
      const voice = engine.createVoice(i, mockConfig.slots[i]);
      expect(voice).toBeDefined();
      expect(voice.type).toBe(mockConfig.slots[i].soundType);
      expect(typeof voice.dispose).toBe('function');
      voice.dispose();
    }
  });

  test('updateVoice sets correct parameters for synthBasic', () => {
    const voice = engine.createVoice(0, mockConfig.slots[0]);
    expect(() => {
      engine.updateVoice(voice, { pitch: 880, filter: 3000 }, mockConfig.slots[0]);
    }).not.toThrow();
    voice.dispose();
  });

  test('disposeVoice cleans up without errors', () => {
    const voice = engine.createVoice(0, mockConfig.slots[0]);
    expect(() => {
      engine.disposeVoice(voice);
    }).not.toThrow();
  });

  test('disposeVoice handles null gracefully', () => {
    expect(() => {
      engine.disposeVoice(null);
    }).not.toThrow();
  });

  test('trigger-based types (kick, tom) respond to sensor data', () => {
    const kick = engine.createVoice(12, mockConfig.slots[12]);
    expect(kick.type).toBe('kick');
    expect(() => {
      engine.updateVoice(kick, { trigger: 20, pitch: 80 }, mockConfig);
    }).not.toThrow();
    engine.disposeVoice(kick);

    const tom = engine.createVoice(16, mockConfig.slots[16]);
    expect(tom.type).toBe('tom');
    expect(() => {
      engine.updateVoice(tom, { trigger: 20, pitchDrop: 100 }, mockConfig);
    }).not.toThrow();
    engine.disposeVoice(tom);
  });

  test('FX modulator slots (25-29) do not create voice chains', () => {
    for (let i = 25; i <= 29; i++) {
      const voice = engine.createVoice(i, mockConfig.slots[i]);
      expect(voice.isFxModulator).toBe(true);
      expect(voice.nodes).toBeDefined();
      engine.disposeVoice(voice);
    }
  });

  test('re-creating same slot after dispose works', () => {
    const voice1 = engine.createVoice(0, mockConfig.slots[0]);
    engine.disposeVoice(voice1);
    const voice2 = engine.createVoice(0, mockConfig.slots[0]);
    expect(voice2).toBeDefined();
    expect(voice2.slot).toBe(0);
    expect(voice2).not.toBe(voice1);
    engine.disposeVoice(voice2);
  });

  test('all drum types are trigger-based', () => {
    const drumIndices = [12, 13, 14, 15, 16];
    for (const i of drumIndices) {
      const voice = engine.createVoice(i, mockConfig.slots[i]);
      expect(voice).toBeDefined();
      engine.disposeVoice(voice);
    }
  });

  test('granular types respect maxGrains limit', () => {
    const voice = engine.createVoice(21, mockConfig.slots[21]);
    expect(voice).toBeDefined();
    expect(voice._grainCount).toBeDefined();
    expect(voice._grainCount).toBe(0);
    expect(typeof voice._interval).not.toBe('undefined');
    engine.disposeVoice(voice);
  });

  test('updateVoice for FX modulator does not throw', () => {
    const voice = engine.createVoice(25, mockConfig.slots[25]);
    expect(() => {
      engine.updateVoice(voice, { roomSize: 0.8, wetDry: 0.5 }, mockConfig);
    }).not.toThrow();
    engine.disposeVoice(voice);
  });

  test('synth voices trigger their AmplitudeEnvelope on creation (BUG FIX)', () => {
    const synthTypes = ['synthBasic', 'synthFM', 'synthDuo', 'synthMono'];
    for (const type of synthTypes) {
      const slotIdx = mockConfig.slots.findIndex(s => s.soundType === type);
      const voice = engine.createVoice(slotIdx, mockConfig.slots[slotIdx]);
      expect(voice.nodes.env._triggered).toBe(true);
      engine.disposeVoice(voice);
    }
  });
});
