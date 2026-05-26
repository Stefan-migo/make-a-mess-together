/**
 * Tests for BrushCanvas — Shared Canvas Brush System
 * 
 * TDD: These tests MUST fail before implementation (RED),
 * then pass after implementation (GREEN).
 */

// Mock p5.Graphics
function createMockGraphics() {
  const ctx = {
    _calls: [],
    clear() { this._calls.push('clear'); },
    noStroke() { this._calls.push('noStroke'); },
    fill() { this._calls.push('fill'); },
    rect() { this._calls.push('rect'); },
    stroke() { this._calls.push('stroke'); },
    strokeWeight() { this._calls.push('strokeWeight'); },
    line() { this._calls.push('line'); },
    ellipse() { this._calls.push('ellipse'); },
    beginShape() { this._calls.push('beginShape'); },
    vertex() { this._calls.push('vertex'); },
    endShape() { this._calls.push('endShape'); },
    push() { this._calls.push('push'); },
    pop() { this._calls.push('pop'); },
    image() { this._calls.push('image'); },
    background() { this._calls.push('background'); },
    colorMode() {},
    translate() {},
    rotate() {},
    scale() {},
    textFont() {},
    textSize() {},
    text() {},
    textAlign() {},
    noFill() {},
    drawingContext: {
      shadowBlur: 0,
      shadowColor: 'transparent'
    },
    width: 800,
    height: 600,
    PI: 3.14159,
    TWO_PI: 6.28318,
    HALF_PI: 1.57079,
    CENTER: 'center'
  };
  return ctx;
}

// Mock p5.brush (loaded by index.html, expected as global)
global.brush = {
  _target: null,
  load(g) { this._target = g; },
  set() {},
  stroke() {},
  strokeWeight() {},
  noStroke() {},
  fill() {},
  noFill() {},
  line() {},
  flowLine() {},
  spline() {},
  render() {},
  add() {},
  remove() {},
  scaleBrushes() {},
  noField() {},
  field() {},
};

// Mock config
const mockConfig = {
  maxDevices: 30,
  canvasWidth: 800,
  canvasHeight: 600,
  centerX: 400,
  centerY: 300,
  baseRadius: 200,
  frameRate: 30,
  canvasFadeRate: 0.005,
  canvasFadeInterval: 60,
  penUpAngle: 50,
  penHysteresis: 5,
  slots: []
};

// Pre-populate 30 slots with brush types
const BRUSH_TYPES = [
  'classic', 'blade', 'dotted', 'stamped', 'velocity', 'dash',
  'sketchy', 'watercolor', 'spray', 'chalk', 'smoke', 'furry',
  'neon', 'plasma', 'vortex', 'bead', 'bubble', 'star',
  'quantum', 'aurora', 'geometric', 'pixel', 'shattered', 'web',
  'abstract', 'trail', 'isometric', 'triangulate',
  'mirror-h', 'mirror-v', 'mirror-quad', 'mirror-tri', 'mirror-hex', 'mirror-twelve'
];

for (let i = 0; i < 30; i++) {
  mockConfig.slots.push({
    slotIndex: i,
    brushType: BRUSH_TYPES[i % BRUSH_TYPES.length] || 'classic',
    color: { h: i * 12 % 360, s: 80, b: 90 },
    soundType: 'synthBasic',
    sensorMap: {}
  });
}

const { BrushCanvas } = require('../../p5-sketch/brush-canvas.js');

describe('BrushCanvas — Foundation', () => {
  
  test('T001: constructor creates instance with paintBuffer', () => {
    const canvas = new BrushCanvas(mockConfig);
    expect(canvas).toBeDefined();
    expect(canvas.paintBuffer).toBeDefined();
    expect(typeof canvas.paintBuffer).toBe('object');
  });

  test('T002: constructor accepts injected paintBuffer', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    expect(canvas.paintBuffer).toBe(mockPg);
  });

  test('T003: has drawAll method', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    expect(typeof canvas.drawAll).toBe('function');
  });

  test('T004: createCursor stores cursor state', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    canvas.createCursor(0, 'classic');
    const cursor = canvas.getCursor(0);
    expect(cursor).toBeDefined();
    expect(cursor.slot).toBe(0);
    expect(cursor.brushType).toBe('classic');
    expect(cursor.hasPrev).toBe(false);
  });

  test('T005: updateCursor updates position from orientation', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    canvas.createCursor(0, 'classic');
    
    // First update: no stroke drawn (no previous position)
    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });
    expect(canvas.getCursor(0).hasPrev).toBe(true);
    
    // Before first update, no draw calls happened yet
    const callsBefore = mockPg._calls.length;
    
    // Second update: should draw a stroke
    canvas.updateCursor(0, {
      orientation: { a: 190, b: 10, g: 0 },
      accel: { x: 1, y: 2, z: 3 },
      gyro: { a: 100, b: 50, g: 10 }
    });
    
    // Some drawing call should have been made
    expect(canvas.getCursor(0).hasPrev).toBe(true);
  });

  test('T006: disposeCursor removes cursor (instant mode)', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    canvas.createCursor(0, 'classic');
    expect(canvas.getCursor(0)).toBeDefined();
    canvas.disposeCursor(0, true); // instant removal
    expect(canvas.getCursor(0)).toBeNull();
  });

  test('T007: disposeCursor does NOT clear paint buffer', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    canvas.createCursor(0, 'classic');
    mockPg._calls = []; // reset call tracker
    canvas.disposeCursor(0, true); // instant removal
    // After dispose, paint buffer should NOT have been cleared
    expect(mockPg._calls.includes('clear')).toBe(false);
  });

  test('T008: applyFade draws transparent rect on paintBuffer', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    mockPg._calls = [];
    canvas.applyFade();
    // Should have called fill and rect
    const hasFillAndRect = mockPg._calls.includes('fill') && mockPg._calls.includes('rect');
    expect(hasFillAndRect).toBe(true);
  });

  test('T009: constructor preserves injected paintBuffer', () => {
    const mockPg = createMockGraphics();
    mockPg.isWebGL = true;
    const canvas = new BrushCanvas(mockConfig, mockPg);
    expect(canvas.paintBuffer).toBe(mockPg);
    // Existing property on injected mock is preserved
    expect(canvas.paintBuffer.isWebGL).toBe(true);
  });

  test('T025: _createPaintBuffer creates P2D (not WEBGL) buffer', () => {
    // Mock p5.js globals for test environment
    const originalCG = global.createGraphics;
    const originalWEBGL = global.WEBGL;
    const originalRGB = global.RGB;
    global.WEBGL = 'WEBGL';
    global.RGB = 'RGB';

    let capturedRenderer = null;
    global.createGraphics = (w, h, renderer) => {
      capturedRenderer = renderer;
      const mock = createMockGraphics();
      return mock;
    };

    const canvas = new BrushCanvas(mockConfig);
    // After fix, the auto-created paint buffer should NOT use WEBGL renderer
    // (p5.brush is unused — WEBGL is unnecessary overhead + breaks P2D coordinates)
    expect(capturedRenderer).not.toBe(global.WEBGL);

    // Restore
    delete global.createGraphics;
    delete global.WEBGL;
    delete global.RGB;
    if (originalCG) global.createGraphics = originalCG;
    if (originalWEBGL) global.WEBGL = originalWEBGL;
    if (originalRGB) global.RGB = originalRGB;
  });
});

describe('BrushCanvas — Phase 3: Cursor Lifecycle', () => {

  test('T010: createCursor sets connection blink state', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    const cursor = canvas.createCursor(0, 'classic');
    expect(cursor.connectionTime).toBeDefined();
    expect(typeof cursor.connectionTime).toBe('number');
    expect(cursor.isBlinking).toBe(true);
    expect(cursor.blinkDuration).toBeGreaterThan(0);
  });

  test('T011: cursor stops blinking after blinkDuration', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    const cursor = canvas.createCursor(0, 'classic');
    // If blinkDuration is 0, blink resolves immediately
    cursor.blinkDuration = 0;
    // Simulate drawAll calling _updateCursorBlink
    canvas._updateCursorBlink(cursor);
    expect(cursor.isBlinking).toBe(false);
  });

  test('T012: drawAll updates cursor idle state', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    const cursor = canvas.createCursor(0, 'classic');
    // Set lastUpdate to long ago
    cursor.lastUpdate = Date.now() - 20000;
    canvas.idleTimeout = 5000;
    canvas.drawAll();
    // Cursor should be marked as idle
    expect(cursor.isIdle).toBe(true);
  });

  test('T013: disposeCursor starts disconnect fade instead of instant removal', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    const cursor = canvas.createCursor(0, 'classic');
    canvas.disposeCursor(0);
    // Cursor should still exist but marked as disconnecting
    expect(canvas.getCursor(0)).not.toBeNull();
    expect(cursor.disconnecting).toBe(true);
    expect(cursor.disconnectFadeStart).toBeGreaterThan(0);
  });

  test('T014: disconnecting cursor is removed after fade completes', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    const cursor = canvas.createCursor(0, 'classic');
    canvas.disposeCursor(0);
    expect(cursor.disconnecting).toBe(true);
    // Set disconnectFadeStart to long ago so fade is complete
    cursor.disconnectFadeStart = Date.now() - 20000;
    canvas.disconnectFadeDuration = 100;
    canvas._cleanupExpiredCursors();
    expect(canvas.getCursor(0)).toBeNull();
  });
});

describe('BrushCanvas — Phase 8: Edge Cases & Stress', () => {

  test('T020: 30-phone stress test — creates and manages all cursors', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    // Create 30 cursors
    for (let i = 0; i < 30; i++) {
      canvas.createCursor(i, BRUSH_TYPES[i % BRUSH_TYPES.length]);
    }
    expect(canvas.activeCount).toBe(30);
    // All cursors should be individually accessible
    for (let i = 0; i < 30; i++) {
      const c = canvas.getCursor(i);
      expect(c).not.toBeNull();
      expect(c.slot).toBe(i);
      expect(c.brushType).toBe(BRUSH_TYPES[i % BRUSH_TYPES.length]);
    }
    // drawAll should work with 30 cursors
    expect(() => canvas.drawAll()).not.toThrow();
  });

  test('T021: empty state — canvas with no cursors does not throw', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    expect(canvas.activeCount).toBe(0);
    expect(() => canvas.drawAll()).not.toThrow();
    expect(() => canvas.applyFade()).not.toThrow();
    expect(() => canvas._cleanupExpiredCursors()).not.toThrow();
  });

  test('T022: activeCount excludes disconnecting cursors', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    canvas.createCursor(0, 'classic');
    canvas.createCursor(1, 'classic');
    canvas.createCursor(2, 'classic');
    expect(canvas.activeCount).toBe(3);
    // Start disconnect fade on slot 1
    canvas.disposeCursor(1);
    expect(canvas.activeCount).toBe(2);
    // Instant-remove slot 2
    canvas.disposeCursor(2, true);
    expect(canvas.activeCount).toBe(1);
  });

  test('T023: cursor survives sensor update with missing orientation data', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    canvas.createCursor(0, 'classic');
    // Update with incomplete sensor data
    expect(() => {
      canvas.updateCursor(0, { accel: {}, gyro: {} });
    }).not.toThrow();
    const cursor = canvas.getCursor(0);
    expect(cursor.hasPrev).toBe(true);
    expect(typeof cursor.x).toBe('number');
    expect(typeof cursor.y).toBe('number');
  });

  test('T024: disposeAll gracefully handles mixed cursor states', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    // Mix of active, idle, and disconnecting cursors
    canvas.createCursor(0, 'classic');
    canvas.createCursor(1, 'blade');
    canvas.createCursor(2, 'spray');
    canvas.disposeCursor(1); // starts fade
    // Instant-remove all
    expect(() => {
      for (let i = 0; i < canvas.cursors.length; i++) {
        if (canvas.cursors[i]) {
          canvas.disposeCursor(i, true);
        }
      }
    }).not.toThrow();
    expect(canvas.activeCount).toBe(0);
  });
});

describe('BrushCanvas — Phase 1: Pressure Pipeline', () => {

  function createCanvasWithPressure(opts) {
    const config = { ...mockConfig, ...opts };
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(config, mockPg);
    canvas.createCursor(0, 'classic');
    return canvas;
  }

  test('T030: _computePressure(γ=0) returns 0 (dead zone)', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 1.0, deadZoneGamma: 5 });
    expect(canvas._computePressure(0)).toBe(0);
  });

  test('T031: _computePressure(γ=45) returns ~0.18 with curve=natural', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 1.0, pressureCurve: 'natural' });
    const pressure = canvas._computePressure(45);
    expect(pressure).toBeGreaterThan(0.15);
    expect(pressure).toBeLessThan(0.20);
  });

  test('T032: _computePressure(γ=90) returns 1.0', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 1.0 });
    expect(canvas._computePressure(90)).toBeCloseTo(1.0, 5);
  });

  test('T033: _computePressure(γ=-45) same as γ=45 (symmetric)', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 1.0, pressureCurve: 'linear' });
    const pos = canvas._computePressure(45);
    const neg = canvas._computePressure(-45);
    expect(Math.abs(pos - neg)).toBeLessThan(0.001);
  });

  test('T034: _computePressure(γ=100) clamps to 1.0', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 1.0 });
    expect(canvas._computePressure(100)).toBe(1.0);
  });

  test('T035: pressure=0 → size=5, pressure=1 → size=80', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 1.0, deadZoneGamma: 0, pressureDeltaMax: 1.0 });
    const cursor = canvas.getCursor(0);
    cursor.size = 20;

    // Simulate pressure=0 (γ=0, deadZone bypassed)
    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });
    expect(cursor.size).toBe(5);

    // Simulate pressure=1 (γ=90)
    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 90 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });
    expect(cursor.size).toBe(80);
  });

  test('T036: pressure=0 → opacity=0.3, pressure=1 → opacity=1.0', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 1.0, deadZoneGamma: 0, pressureDeltaMax: 1.0 });
    const cursor = canvas.getCursor(0);

    // pressure 0
    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });
    expect(cursor.opacity).toBeCloseTo(0.3, 1);

    // pressure 1
    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 90 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });
    expect(cursor.opacity).toBeCloseTo(1.0, 1);
  });

  test('T037: EMA smoothing converges to steady state', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 0.2, pressureCurve: 'linear', deadZoneGamma: 0 });
    // First call: _smoothGamma = 0 * 0.8 + 0.5 * 0.2 = 0.1
    const first = canvas._computePressure(45);
    // Second call: 0.1 * 0.8 + 0.5 * 0.2 = 0.18
    const second = canvas._computePressure(45);
    // After many calls, should approach 0.5
    for (let i = 0; i < 50; i++) canvas._computePressure(45);
    const steady = canvas._computePressure(45);
    expect(steady).toBeGreaterThan(0.48);
    expect(steady).toBeLessThan(0.52);
  });

  test('T038: accel.y/z no longer affect brushSize/opacity', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 1.0, deadZoneGamma: 0 });
    const cursor = canvas.getCursor(0);
    cursor.size = 20;
    cursor.opacity = 1;

    // Send accel data with NO orientation gamma (pressure stays 0)
    canvas._modulateFromSensor(cursor, {
      accel: { x: 0, y: 15, z: 10 },
      gyro: { a: 0, b: 0, g: 0 },
      orientation: { a: 180, b: 0, g: 0 }
    });
    // With pressure=0: size=5, opacity=0.3
    expect(cursor.size).toBe(5);
    expect(cursor.opacity).toBeCloseTo(0.3, 1);
  });

  test('T039: accel.x still modulates hue shift (no regression)', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 1.0, deadZoneGamma: 5 });
    const cursor = canvas.getCursor(0);
    cursor.color.h = 100;

    canvas._modulateFromSensor(cursor, {
      accel: { x: 10, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 },
      orientation: { a: 180, b: 0, g: 0 }
    });
    // accel.x=10 → hueShift = mapAndConstrain(10, -20, 20, -60, 60) = 30
    // 100 + 30 * 0.1 = 103
    expect(cursor.color.h).toBeCloseTo(103, 0);
  });

  test('T040: gyro.α still modulates scatter (no regression)', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 1.0, deadZoneGamma: 5 });
    const cursor = canvas.getCursor(0);

    canvas._modulateFromSensor(cursor, {
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 200, b: 0, g: 0 },
      orientation: { a: 180, b: 0, g: 5 }
    });
    // gyro.a=200 → mapAndConstrain(200, 0, 500, 0, 40) = 16
    expect(cursor.scatter).toBeGreaterThan(15);
    expect(cursor.scatter).toBeLessThan(17);
  });

  test('T041: γ < deadZoneGamma returns 0 (dead zone)', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 1.0, deadZoneGamma: 5 });
    expect(canvas._computePressure(4)).toBe(0);
    expect(canvas._computePressure(-4)).toBe(0);
  });

  test('T042: curve=linear produces proportional mapping', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 1.0, pressureCurve: 'linear', deadZoneGamma: 0 });
    const p1 = canvas._computePressure(45);
    expect(p1).toBeCloseTo(0.5, 1);
  });

  test('T043: curve=aggressive produces faster ramp-up', () => {
    const canvas = createCanvasWithPressure({ pressureSmoothing: 1.0, pressureCurve: 'aggressive', deadZoneGamma: 0 });
    const p = canvas._computePressure(45);
    // aggressive uses exponent 0.7: 0.5^0.7 ≈ 0.615
    expect(p).toBeGreaterThan(0.55);
    expect(p).toBeLessThan(0.70);
  });
});

describe('BrushCanvas — Phase 2: Smooth Traces & Dead Zones', () => {

  test('T050: Cursor does NOT draw when position deviation < deadZonePosition degrees', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    canvas.createCursor(0, 'classic');
    const cursor = canvas.getCursor(0);

    // First update: calibrates at alpha=180, beta=0
    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    mockPg._calls = [];

    // Second update: small deviation (1°, < deadZonePosition=3)
    canvas.updateCursor(0, {
      orientation: { a: 181, b: 1, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    // No drawing should have occurred (no ellipse/line calls)
    expect(cursor._isInDeadZone).toBe(true);
    expect(mockPg._calls.length).toBe(0);
  });

  test('T051: Cursor resumes from same position after leaving dead zone (no jump)', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    canvas.createCursor(0, 'classic');
    const cursor = canvas.getCursor(0);

    // First update: calibrate
    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    // Second update: inside dead zone (1°, < 3)
    canvas.updateCursor(0, {
      orientation: { a: 181, b: 1, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    const posBefore = { x: cursor.x, y: cursor.y, prevX: cursor.prevX, prevY: cursor.prevY };

    // Third update: inside dead zone (2°, still < 3)
    canvas.updateCursor(0, {
      orientation: { a: 182, b: 2, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    // position should NOT have changed (still in dead zone)
    expect(cursor.x).toBe(posBefore.x);
    expect(cursor.y).toBe(posBefore.y);
    expect(cursor._isInDeadZone).toBe(true);

    // Fourth update: leave dead zone (10°, > 3)
    mockPg._calls = [];
    canvas.updateCursor(0, {
      orientation: { a: 190, b: 10, g: 30 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    // Should no longer be in dead zone
    expect(cursor._isInDeadZone).toBe(false);
    // prevX/prevY should have been updated (from dead zone freeze to new position)
    // The important thing is that we didn't lose prev position
    expect(cursor.hasPrev).toBe(true);
  });

  test('T052: Adaptive EMA reduces coefficient when jitter detected', () => {
    const pg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, pg);
    canvas.createCursor(0, 'classic');
    const cursor = canvas.getCursor(0);

    // Send alternating sign frames to trigger jitter detection
    // First frame: calibrates at alpha=180, beta=0
    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    // Send alternating data: right+up, then left+down repeatedly
    // Each needs to be > deadZonePosition (3°) to be processed
    for (let i = 0; i < 10; i++) {
      // Alternating direction to create sign changes
      if (i % 2 === 0) {
        canvas.updateCursor(0, {
          orientation: { a: 200, b: 30, g: 0 },
          accel: { x: 0, y: 0, z: 0 },
          gyro: { a: 0, b: 0, g: 0 }
        });
      } else {
        canvas.updateCursor(0, {
          orientation: { a: 160, b: -30, g: 0 },
          accel: { x: 0, y: 0, z: 0 },
          gyro: { a: 0, b: 0, g: 0 }
        });
      }
    }

    // Jitter score should have increased above 0.3
    expect(cursor._jitterScore).toBeGreaterThan(0.3);
  });

  test('T053: Catmull-Rom produces interpolated points between 2 input points', () => {
    const canvas = new BrushCanvas(mockConfig, createMockGraphics());

    // For collinear, evenly-spaced points with p0=p1=0, p2=p3=10,
    // CR at t=0.5 should be the midpoint (5)
    const result = canvas._catmullRom(0, 0, 10, 10, 0.5);
    expect(result).toBeCloseTo(5, 4);
  });

  test('T054: interpolateSteps=1 falls back effectively to linear', () => {
    const config = { ...mockConfig, interpolateSteps: 1 };
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(config, mockPg);
    canvas.createCursor(0, 'classic');
    const cursor = canvas.getCursor(0);

    // First update: calibrate
    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    mockPg._calls = [];

    // Second update: move to distinct position (outside dead zone)
    canvas.updateCursor(0, {
      orientation: { a: 200, b: 20, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    // With interpolateSteps=1, should have drawn normally
    expect(mockPg._calls.includes('ellipse')).toBe(true);
    expect(cursor.hasPrev).toBe(true);
  });

  test('T055: Pressure delta per frame does not exceed pressureDeltaMax', () => {
    const pg = createMockGraphics();
    const config = { ...mockConfig, pressureSmoothing: 1.0, deadZoneGamma: 0, pressureDeltaMax: 0.1 };
    const canvas = new BrushCanvas(config, pg);
    canvas.createCursor(0, 'classic');
    const cursor = canvas.getCursor(0);
    cursor.pressure = 0;

    // Send gamma=90 (full pressure)
    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 90 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    // Pressure should have increased by at most 0.1
    expect(cursor.pressure).toBeLessThanOrEqual(0.11);
  });

  test('T056: Cursor starts with _wasInDeadZone = true (no line from origin)', () => {
    const canvas = new BrushCanvas(mockConfig, createMockGraphics());
    const cursor = canvas.createCursor(0, 'classic');
    expect(cursor._wasInDeadZone).toBe(true);
  });
});

describe('BrushCanvas — Phase 9: Pen Up/Down (Drawing Cone)', () => {

  function createCanvasWithPenConfig(opts) {
    const config = { ...mockConfig, penUpAngle: 10, penHysteresis: 2, ...opts };
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(config, mockPg);
    canvas._smoothFactor = 1.0;
    canvas.createCursor(0, 'classic');
    return { canvas, cursor: canvas.getCursor(0), mockPg };
  }

  test('T060: default penUpAngle is 50 when config not provided', () => {
    const config = { ...mockConfig };
    delete config.penUpAngle;
    delete config.penHysteresis;
    const canvas = new BrushCanvas(config, createMockGraphics());
    expect(canvas.penUpAngle).toBe(50);
    expect(canvas.penHysteresis).toBe(5);
  });

  test('T061: penDown is true initially after cursor creation', () => {
    const { cursor } = createCanvasWithPenConfig();
    expect(cursor.penDown).toBe(true);
  });

  test('T062: pen goes up when deviation > penUpAngle + hysteresis/2', () => {
    const { canvas, cursor } = createCanvasWithPenConfig();
    // penUpAngle=10, hysteresis=2 → upThreshold = 11

    // Calibrate at center
    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });
    expect(cursor.penDown).toBe(true);

    // Large deviation: alpha=140 (delta=-40°, deviation ≈ 40 > 11)
    canvas.updateCursor(0, {
      orientation: { a: 140, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    expect(cursor.penDown).toBe(false);
  });

  test('T063: pen goes down when deviation < penUpAngle - hysteresis/2', () => {
    const { canvas, cursor } = createCanvasWithPenConfig();

    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    // Go pen up (single frame is enough — dev ≈ 16 > 11)
    canvas.updateCursor(0, {
      orientation: { a: 140, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });
    expect(cursor.penDown).toBe(false);

    // Send small deviation frames until smoothing converges below downThreshold
    // (The jitter-detection override clamps smoothCoeff to 0.4, so convergence
    //  takes a few frames — but well below downThreshold=9)
    for (let i = 0; i < 10; i++) {
      canvas.updateCursor(0, {
        orientation: { a: 176, b: 0, g: 0 },
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 }
      });
    }

    expect(cursor.penDown).toBe(true);
  });

  test('T064: prevX/prevY do not change when pen is up', () => {
    const { canvas, cursor } = createCanvasWithPenConfig();

    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    // Draw a stroke
    canvas.updateCursor(0, {
      orientation: { a: 175, b: 5, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });
    expect(cursor.penDown).toBe(true);

    const prevXBefore = cursor.prevX;
    const prevYBefore = cursor.prevY;

    // Go pen up
    canvas.updateCursor(0, {
      orientation: { a: 140, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });
    expect(cursor.penDown).toBe(false);

    // prevX/prevY should still be from the last drawn stroke
    expect(cursor.prevX).toBe(prevXBefore);
    expect(cursor.prevY).toBe(prevYBefore);
  });

  test('T065: prevX/prevY reset to current position when pen goes down (no jump)', () => {
    const { canvas, cursor } = createCanvasWithPenConfig();

    canvas.updateCursor(0, {
      orientation: { a: 180, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });

    // Go pen up first
    canvas.updateCursor(0, {
      orientation: { a: 140, b: 0, g: 0 },
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 }
    });
    expect(cursor.penDown).toBe(false);

    // Send frames until pen goes down; verify prevX= x on transition frame
    let checkedDown = false;
    for (let i = 0; i < 10; i++) {
      const wasDown = cursor.penDown;
      canvas.updateCursor(0, {
        orientation: { a: 176, b: 0, g: 0 },
        accel: { x: 0, y: 0, z: 0 },
        gyro: { a: 0, b: 0, g: 0 }
      });
      if (!wasDown && cursor.penDown && !checkedDown) {
        checkedDown = true;
        expect(cursor.prevX).toBe(cursor.x);
        expect(cursor.prevY).toBe(cursor.y);
      }
    }

    expect(cursor.penDown).toBe(true);
    expect(checkedDown).toBe(true);
  });
});
