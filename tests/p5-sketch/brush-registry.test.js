/**
 * Tests for Brush Registry — 34 Brush Types
 * 
 * Phase 2 of the Shared Canvas Brush System.
 * TDD: These tests MUST fail before implementation (RED),
 * then pass after implementation (GREEN).
 */

// Mock p5.Graphics for brush rendering tests
function createMockGraphics() {
  return {
    _calls: [],
    noStroke() { this._calls.push('noStroke'); },
    stroke() { this._calls.push('stroke'); },
    strokeWeight() { this._calls.push('strokeWeight'); },
    fill() { this._calls.push('fill'); },
    noFill() { this._calls.push('noFill'); },
    ellipse() { this._calls.push('ellipse'); },
    rect() { this._calls.push('rect'); },
    line() { this._calls.push('line'); },
    beginShape() { this._calls.push('beginShape'); },
    vertex() { this._calls.push('vertex'); },
    endShape() { this._calls.push('endShape'); },
    push() { this._calls.push('push'); },
    pop() { this._calls.push('pop'); },
    translate() { this._calls.push('translate'); },
    rotate() { this._calls.push('rotate'); },
    scale() { this._calls.push('scale'); },
    image() { this._calls.push('image'); },
    clear() { this._calls.push('clear'); },
    background() { this._calls.push('background'); },
    colorMode() {},
    ellipseMode() {},
    rectMode() {},
    textFont() {},
    textSize() {},
    text() {},
    textAlign() {},
    drawingContext: {
      shadowBlur: 0,
      shadowColor: 'transparent'
    },
    width: 800,
    height: 600,
    PI: 3.141592653589793,
    TWO_PI: 6.283185307179586,
    HALF_PI: 1.5707963267948966,
    CENTER: 'center',
    CLOSE: 'close',
    BLEND: 'blend',
    SCREEN: 'screen',
    MULTIPLY: 'multiply',
    OVERLAY: 'overlay',
    RGB: 'rgb',
    HSB: 'hsb',
    HSL: 'hsl',
    TRIANGLE_FAN: 'triangle_fan'
  };
}

const { BRUSH_REGISTRY, registerBrush, drawBrush, getBrushNames, getBrushCount } = require('../../p5-sketch/brush-registry.js');

describe('Brush Registry — 34 Types', () => {

  test('T005: BRUSH_REGISTRY contains 34 entries', () => {
    const names = getBrushNames();
    expect(names.length).toBe(34);
    // Verify all 34 expected brush names
    const expected = [
      'classic', 'blade', 'dotted', 'stamped', 'velocity', 'dash',
      'sketchy', 'watercolor', 'spray', 'chalk', 'smoke', 'furry',
      'neon', 'plasma', 'vortex', 'bead', 'bubble', 'star',
      'quantum', 'aurora', 'geometric', 'pixel', 'shattered', 'web',
      'abstract', 'trail', 'isometric', 'triangulate',
      'mirror-h', 'mirror-v', 'mirror-quad', 'mirror-tri', 'mirror-hex', 'mirror-twelve'
    ];
    expected.forEach(name => {
      expect(names).toContain(name);
    });
  });

  test('T006: registerBrush adds to registry and drawBrush calls without error', () => {
    const mockPg = createMockGraphics();
    const testFn = jest.fn();
    registerBrush('test-brush', testFn);
    
    // Verify it was added
    expect(getBrushNames()).toContain('test-brush');
    expect(getBrushCount()).toBe(35); // 34 + 1 test
    
    // Verify it can be called
    const result = drawBrush('test-brush', mockPg, 0, 0, 10, 10, { r: 255, g: 0, b: 0 }, 10, { alpha: 255 });
    expect(result).toBe(true);
    expect(testFn).toHaveBeenCalledTimes(1);
  });

  test('T007: drawBrush with unknown type returns false gracefully', () => {
    const mockPg = createMockGraphics();
    const result = drawBrush('nonexistent-brush', mockPg, 0, 0, 10, 10, { r: 0, g: 0, b: 0 }, 10, {});
    expect(result).toBe(false);
  });

  test('T008: All 34 brush types execute without throwing', () => {
    const mockPg = createMockGraphics();
    const color = { r: 100, g: 50, b: 200 };
    const opts = { alpha: 200, scatter: 5, angle: 0, frameCount: 100, state: {} };

    const brushNames = getBrushNames().filter(n => !n.startsWith('test-'));
    
    brushNames.forEach(name => {
      expect(() => {
        const result = drawBrush(name, mockPg, 5, 5, 15, 20, color, 16, opts);
        expect(result).toBe(true);
      }).not.toThrow();
    });

    // All 34 original brushes should be here
    expect(brushNames.length).toBe(34);
  });
});
