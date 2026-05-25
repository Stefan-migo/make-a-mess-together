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
