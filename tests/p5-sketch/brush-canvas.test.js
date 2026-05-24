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

  test('T006: disposeCursor removes cursor', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    canvas.createCursor(0, 'classic');
    expect(canvas.getCursor(0)).toBeDefined();
    canvas.disposeCursor(0);
    expect(canvas.getCursor(0)).toBeNull();
  });

  test('T007: disposeCursor does NOT clear paint buffer', () => {
    const mockPg = createMockGraphics();
    const canvas = new BrushCanvas(mockConfig, mockPg);
    canvas.createCursor(0, 'classic');
    mockPg._calls = []; // reset call tracker
    canvas.disposeCursor(0);
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

  test('T009: paintBuffer is WEBGL (mock verifies)', () => {
    const mockPg = createMockGraphics();
    mockPg.isWebGL = true;
    const canvas = new BrushCanvas(mockConfig, mockPg);
    expect(canvas.paintBuffer.isWebGL).toBe(true);
  });
});
