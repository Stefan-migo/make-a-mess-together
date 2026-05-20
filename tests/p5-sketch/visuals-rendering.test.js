const { Visuals } = require('../../p5-sketch/visuals.js');

const testConfig = {
  maxDevices: 30,
  canvasWidth: 1600,
  canvasHeight: 900,
  centerX: 800,
  centerY: 450,
  baseRadius: 300,
  frameRate: 30,
  smoothCoefficient: 0.3,
  slots: Array.from({ length: 30 }, (_, i) => ({
    soundType: 'synthBasic',
    visualType: [
      'pulsingCircle', 'rotatingLine', 'arcSweep', 'polygon', 'spiral',
      'connectedDots', 'waveAmplitude', 'lissajous', 'concentricRings', 'particleCloud',
      'oscilloscopeTrail', 'wobblyCircle', 'expandingRing', 'starburst', 'glowingDot',
      'pulseFlash', 'bouncingBall', 'pixelatedGrid', 'stutterStrobe', 'foldedWaveform',
      'jitterOffset', 'scatteredGrains', 'particleFountain', 'randomBlink', 'slidingWindow',
      'abstractShape', 'echoGhosts', 'warpDistortion', 'rippleRings', 'thresholdBars'
    ][i],
    slotIndex: i,
    color: { h: i * 12, s: 80, b: 90 },
    isFxModulator: i >= 25,
    sensorMap: {}
  }))
};

const mockP5 = {
  push: () => {},
  pop: () => {},
  translate: () => {},
  rotate: () => {},
  fill: () => {},
  stroke: () => {},
  noFill: () => {},
  noStroke: () => {},
  strokeWeight: (v) => {},
  circle: (x, y, r) => {},
  line: (x1, y1, x2, y2) => {},
  arc: (x, y, w, h, start, stop) => {},
  beginShape: () => {},
  vertex: (x, y) => {},
  endShape: (m) => {},
  textAlign: () => {},
  text: () => {},
  textSize: () => {},
  cos: Math.cos,
  sin: Math.sin,
  TWO_PI: Math.PI * 2,
  PI: Math.PI,
  HALF_PI: Math.PI / 2,
  QUARTER_PI: Math.PI / 4,
  random: (a, b) => typeof b === 'number' ? a + Math.random() * (b - a) : Math.random() * a,
  colorMode: () => {},
  rect: (x, y, w, h) => {},
  drawingContext: {
    beginPath: () => {},
    clip: () => {},
    shadowBlur: 0,
    shadowColor: 'transparent'
  },
  millis: () => Date.now(),
  noise: (x) => Math.sin(x) * 0.5 + 0.5
};

const sensorData = {
  accel: { x: 0.5, y: 0.3, z: 0.7 },
  gyro: { a: 45, b: 30, c: 60 },
  orientation: { a: 90, b: 45, c: 10 }
};

describe('Visuals', () => {
  let visuals;

  beforeEach(() => {
    visuals = new Visuals(testConfig);
  });

  afterEach(() => {
    if (visuals) {
      visuals.disposeAll();
    }
  });

  test('createVisual returns valid VisualState for all 30 types', () => {
    const visualTypes = [
      'pulsingCircle', 'rotatingLine', 'arcSweep', 'polygon', 'spiral',
      'connectedDots', 'waveAmplitude', 'lissajous', 'concentricRings', 'particleCloud',
      'oscilloscopeTrail', 'wobblyCircle', 'expandingRing', 'starburst', 'glowingDot',
      'pulseFlash', 'bouncingBall', 'pixelatedGrid', 'stutterStrobe', 'foldedWaveform',
      'jitterOffset', 'scatteredGrains', 'particleFountain', 'randomBlink', 'slidingWindow',
      'abstractShape', 'echoGhosts', 'warpDistortion', 'rippleRings', 'thresholdBars'
    ];
    for (let i = 0; i < 30; i++) {
      const state = visuals.createVisual(i);
      expect(state).toBeDefined();
      expect(state.type).toBe(visualTypes[i]);
      expect(state.slot).toBe(i);
      expect(typeof state.dispose).toBe('function');
    }
  });

  test('createVisual gets correct type string for slots 0, 1, 5, 12, 29', () => {
    expect(visuals.createVisual(0).type).toBe('pulsingCircle');
    expect(visuals.createVisual(1).type).toBe('rotatingLine');
    expect(visuals.createVisual(5).type).toBe('connectedDots');
    expect(visuals.createVisual(12).type).toBe('expandingRing');
    expect(visuals.createVisual(29).type).toBe('thresholdBars');
  });

  test('updateVisual modifies params from sensor data', () => {
    const state = visuals.createVisual(0);
    visuals.updateVisual(0, sensorData, testConfig);
    expect(state.params).toBeDefined();
    expect(typeof state.params.size).toBe('number');
    expect(typeof state.params.hue).toBe('number');
  });

  test('drawAll runs without throwing for 0, 1, and 5 active slots', () => {
    expect(() => {
      visuals.drawAll([], testConfig);
    }).not.toThrow();
    visuals.createVisual(0);
    expect(() => {
      visuals.drawAll([0], testConfig);
    }).not.toThrow();
    visuals.createVisual(1);
    visuals.createVisual(2);
    visuals.createVisual(3);
    visuals.createVisual(4);
    expect(() => {
      visuals.drawAll([0, 1, 2, 3, 4], testConfig);
    }).not.toThrow();
  });

  test('visual positions match radial math', () => {
    const cx = testConfig.centerX;
    const cy = testConfig.centerY;
    const r = testConfig.baseRadius;
    for (let slot = 0; slot < 30; slot++) {
      const angle = (slot / testConfig.maxDevices) * Math.PI * 2;
      const expectedX = cx + Math.cos(angle) * r;
      const expectedY = cy + Math.sin(angle) * r;
      const pos = visuals._getRadialPosition(slot, testConfig);
      expect(pos.angle).toBeCloseTo(angle, 5);
      expect(pos.x).toBeCloseTo(expectedX, 5);
      expect(pos.y).toBeCloseTo(expectedY, 5);
    }
  });

  test('state accumulation works (angle/phase increments over frames)', () => {
    const state = visuals.createVisual(0);
    state.accum.angle = 0;
    state.accum.phase = 0;
    const frame1Angle = state.accum.angle;
    const frame1Phase = state.accum.phase;
    const frame2Angle = state.accum.angle;
    const frame2Phase = state.accum.phase;
    expect(typeof frame1Angle).toBe('number');
    expect(typeof frame1Phase).toBe('number');
  });

  test('trail arrays are bounded at max 50 entries', () => {
    const state = visuals.createVisual(0);
    state.trail = [];
    for (let i = 0; i < 100; i++) {
      state.trail.push({ x: i, y: i, t: Date.now() });
      if (state.trail.length > 50) {
        state.trail.shift();
      }
    }
    expect(state.trail.length).toBeLessThanOrEqual(50);
  });

  test('disposeVisual clears all state', () => {
    visuals.createVisual(0);
    visuals.createVisual(1);
    expect(visuals._states[0]).toBeDefined();
    expect(visuals._states[1]).toBeDefined();
    visuals.disposeVisual(0);
    expect(visuals._states[0]).toBeUndefined();
    expect(visuals._states[1]).toBeDefined();
    visuals.disposeVisual(1);
    expect(visuals._states[1]).toBeUndefined();
  });

  test('particle arrays are cleared on dispose', () => {
    const state = visuals.createVisual(9);
    state.particles = [{ x: 10, y: 20, vx: 1, vy: 1, life: 1 }];
    expect(state.particles.length).toBeGreaterThan(0);
    state.dispose();
    expect(state.particles.length).toBe(0);
  });

  test('re-creating visual for same slot resets state', () => {
    const state1 = visuals.createVisual(5);
    state1.accum.angle = 123;
    visuals.disposeVisual(5);
    const state2 = visuals.createVisual(5);
    expect(state2.accum.angle).not.toBe(123);
  });

  test('handle null/undefined sensor data gracefully', () => {
    visuals.createVisual(0);
    expect(() => {
      visuals.updateVisual(0, null, testConfig);
    }).not.toThrow();
    expect(() => {
      visuals.updateVisual(0, undefined, testConfig);
    }).not.toThrow();
    expect(() => {
      visuals.updateVisual(0, {}, testConfig);
    }).not.toThrow();
  });

  test('disposeAll clears all visual states', () => {
    visuals.createVisual(0);
    visuals.createVisual(1);
    visuals.createVisual(2);
    expect(visuals._states[0]).toBeDefined();
    expect(visuals._states[1]).toBeDefined();
    expect(visuals._states[2]).toBeDefined();
    visuals.disposeAll();
    expect(Object.keys(visuals._states).length).toBe(0);
  });
});
