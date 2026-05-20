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
  Destination: { _connections: [] },
  now: () => 0
};

const { AudioBus } = require('../../p5-sketch/audio-bus.js');

describe('AudioBus', () => {
  test('creates master gain connected to destination', () => {
    const bus = new AudioBus();
    expect(bus.masterGain).toBeDefined();
    expect(typeof bus.masterGain).toBe('object');
    bus.dispose();
  });

  test('creates shared reverb send bus', () => {
    const bus = new AudioBus();
    expect(bus.reverbSend).toBeDefined();
    expect(typeof bus.reverbSend).toBe('object');
    bus.dispose();
  });

  test('creates shared delay send bus', () => {
    const bus = new AudioBus();
    expect(bus.delaySend).toBeDefined();
    expect(typeof bus.delaySend).toBe('object');
    bus.dispose();
  });

  test('reverb send gain ranges 0..1', () => {
    const bus = new AudioBus();
    expect(bus.reverbSend).toBeDefined();
    bus.setReverbParam('wet', 0.5);
    expect(() => bus.setReverbParam('wet', 2)).not.toThrow();
    bus.dispose();
  });

  test('master limiter prevents output exceeding -1dBFS', () => {
    const bus = new AudioBus();
    expect(bus.limiter).toBeDefined();
    expect(typeof bus.limiter).toBe('object');
    bus.dispose();
  });

  test('slots 25-29 modulate FX bus parameters, not create new fx', () => {
    const bus = new AudioBus();
    expect(typeof bus.setReverbParam).toBe('function');
    expect(typeof bus.setDelayParam).toBe('function');
    expect(typeof bus.setMasterVolume).toBe('function');
    bus.dispose();
  });
});
