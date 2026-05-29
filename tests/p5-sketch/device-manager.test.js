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

function makeBrushCanvas() {
  const { BrushCanvas } = require('../../p5-sketch/brush-canvas.js');
  const mockPg = {
    noStroke: () => {}, fill: () => {}, rect: () => {}, ellipse: () => {},
    push: () => {}, pop: () => {}, stroke: () => {}, strokeWeight: () => {},
    beginShape: () => {}, endShape: () => {}, vertex: () => {}, noFill: () => {},
    color: () => ({})
  };
  return new BrushCanvas({
    maxDevices: 30,
    centerX: 400,
    centerY: 300,
    baseRadius: 200,
    slots: new Array(30).fill({ soundType: 'synthBasic', sensorMap: {}, color: { h: 0, s: 80, b: 90 }, brushType: 'classic' })
  }, mockPg);
}

describe('DeviceManager (visual-only)', () => {
  let dm;

  beforeEach(() => {
    dm = new DeviceManager(testConfig);
  });

  afterEach(() => {
    dm.disposeAll();
  });

  test('assign creates brush cursor when brushCanvas provided', () => {
    const bc = makeBrushCanvas();
    const dm2 = new DeviceManager(testConfig, bc);
    dm2.assign(0);
    expect(bc.getCursor(0)).not.toBeNull();
    dm2.disposeAll();
  });

  test('disconnect removes brush cursor', () => {
    const bc = makeBrushCanvas();
    const dm2 = new DeviceManager(testConfig, bc);
    dm2.assign(0);
    expect(bc.getCursor(0)).not.toBeNull();
    dm2.disconnect(0);
    // After disconnect, cursor is marked as disconnecting
    const cursor = bc.getCursor(0);
    expect(cursor.disconnecting).toBe(true);
    dm2.disposeAll();
  });

  test('updateSensor does not throw', () => {
    const sensorData = {
      accel: { x: 0, y: 5, z: 0 },
      gyro: { a: 0, b: 0, g: 0 },
      orientation: { a: 0, b: 0, g: 0 }
    };
    expect(() => {
      dm.updateSensor(0, 'accel', sensorData);
    }).not.toThrow();
  });

  test('caches sensor data on updateSensor', () => {
    dm.updateSensor(0, 'accel', { x: 1, y: 2, z: 3 });
    expect(dm._sensorCache[0]).toBeDefined();
    expect(dm._sensorCache[0].accel).toEqual({ x: 1, y: 2, z: 3 });
  });

  test('caches sensor data on updateCombinedSensor', () => {
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
  });

  test('activeCount is 0 without brushCanvas', () => {
    expect(dm.activeCount).toBe(0);
  });

  test('activeCount reflects brushCanvas cursors', () => {
    const bc = makeBrushCanvas();
    const dm2 = new DeviceManager(testConfig, bc);
    expect(dm2.activeCount).toBe(0);
    dm2.assign(0);
    expect(dm2.activeCount).toBe(1);
    dm2.assign(1);
    expect(dm2.activeCount).toBe(2);
    dm2.disposeAll();
  });

  test('updateCombinedSensor does not throw when slot not assigned', () => {
    expect(() => {
      dm.updateCombinedSensor(99, {
        accel: { x: 0, y: 0, z: 9.81 },
        gyro: { a: 0, b: 0, g: 0 },
        orientation: { a: 0, b: 0, g: 0 }
      });
    }).not.toThrow();
  });

  test('updateCombinedSensor does not throw with partial data', () => {
    expect(() => {
      dm.updateCombinedSensor(0, {
        accel: { x: 1, y: 2, z: 3 }
      });
    }).not.toThrow();
  });

  test('updateSensor still works after updateCombinedSensor', () => {
    dm.updateCombinedSensor(0, {
      accel: { x: 0.1, y: 5, z: -3 },
      gyro: { a: 0.5, b: 1, g: 2 },
      orientation: { a: 90, b: 45, g: 0 }
    });
    expect(() => {
      dm.updateSensor(0, 'accel', { x: 0.2, y: 3, z: 9 });
    }).not.toThrow();
  });

  test('drawHUD does not throw', () => {
    expect(() => {
      dm.drawHUD();
    }).not.toThrow();
  });

  test('disposeAll clears sensor cache', () => {
    dm.updateCombinedSensor(0, {
      accel: { x: 0.1, y: 5, z: -3 },
      gyro: { a: 0.5, b: 1, g: 2 },
      orientation: { a: 90, b: 45, g: 0 }
    });
    expect(Object.keys(dm._sensorCache).length).toBeGreaterThan(0);
    dm.disposeAll();
    expect(Object.keys(dm._sensorCache).length).toBe(0);
  });

  test('isSlotActive returns false without brushCanvas', () => {
    const result = dm.isSlotActive(0);
    expect(result).toBe(false);
  });

  test('activeSlots returns empty without brushCanvas', () => {
    expect(dm.activeSlots).toEqual([]);
  });

  test('updateConfig does not throw without brushCanvas', () => {
    expect(() => {
      dm.updateConfig(0, { brush: 'classic' });
    }).not.toThrow();
  });
});
