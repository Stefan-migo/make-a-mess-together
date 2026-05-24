(function(global) {
  'use strict';

  /**
   * BrushCanvas — Shared persistent canvas for collaborative multi-phone brush painting
   * 
   * Architecture:
   *   Layer 1 (Offscreen paintBuffer): WEBGL createGraphics, NEVER cleared.
   *     - All brush strokes render here via brush-registry.js
   *     - Fade mechanism applies gradually via semi-transparent overlay
   *   Layer 2 (On-screen canvas): Draws paintBuffer as image, overlays HUD
   * 
   * Each phone = one BrushCursor with its own:
   *   - Brush type (pre-assigned by slot, 0-29)
   *   - Position (mapped from orientation α, β)
   *   - Color, size, opacity, scatter (modulated by accelerometer/gyroscope)
   *   - Smoothing via EMA filter on position
   */

  // ============================================================
  // BrushCursor — per-phone state
  // ============================================================

  class BrushCursor {
    constructor(slot, brushType) {
      this.slot = slot;
      this.brushType = brushType || 'classic';
      this.x = 0;
      this.y = 0;
      this.prevX = 0;
      this.prevY = 0;
      this.hasPrev = false;
      this.active = true;
      // Smoothed values (EMA)
      this.smoothX = 0;
      this.smoothY = 0;
      // Sensor-modulated values with defaults
      this.color = { h: (slot * 12) % 360, s: 80, b: 90, a: 1 };
      this.size = 20;
      this.opacity = 1;
      this.scatter = 0;
      this.angle = 0;
      this.hueShift = 0;
      this.lastUpdate = Date.now();
      // EMA smoothing coefficient (0.0 = no smoothing, 1.0 = instant)
      this.smoothing = 0.3;
      // Persistent brush state (for brushes needing history like sketchyPoints)
      this._brushState = {};

      // --- Phase 3: Lifecycle Properties ---

      // Connection blink: brief visual pulse on connection
      this.connectionTime = Date.now();
      this.isBlinking = true;
      this.blinkDuration = 1000; // 1 second blink

      // Idle state: cursor fades when inactive
      this.isIdle = false;
      this.idleOpacity = 1.0;

      // Disconnect fade: smooth removal instead of instant vanish
      this.disconnecting = false;
      this.disconnectFadeStart = 0;
    }
  }

  // ============================================================
  // BrushCanvas
  // ============================================================

  class BrushCanvas {
    /**
     * @param {Object} config - Global configuration object
     * @param {Object} [paintBuffer] - Injected paint buffer for testing
     */
    constructor(config, paintBuffer) {
      this.config = config || {};
      this.width = config.canvasWidth || 800;
      this.height = config.canvasHeight || 600;
      this.cursors = new Array(config.maxDevices || 30).fill(null);
      this.initialized = false;
      this.frameCount = 0;
      this._visible = true;
      this.fadeInterval = config.canvasFadeInterval || 60;
      this.fadeRate = config.canvasFadeRate || 0.005;

      // --- Phase 3: Lifecycle Config ---
      this.idleTimeout = config.idleTimeout || 5000;        // ms before cursor goes idle
      this.disconnectFadeDuration = config.disconnectFadeDuration || 3000;  // ms for disconnect fade

      // Create or accept paint buffer
      if (paintBuffer) {
        this.paintBuffer = paintBuffer;
        this.initialized = true;
      } else {
        this.paintBuffer = this._createPaintBuffer();
      }
    }

    /**
     * Create an offscreen WEBGL graphics buffer
     * (No-op in test environment; returns a placeholder object)
     */
    _createPaintBuffer() {
      // In browser: return createGraphics(this.width, this.height, WEBGL);
      // In test: return a mock-compatible object
      if (typeof createGraphics !== 'undefined') {
        const pg = createGraphics(this.width, this.height, WEBGL);
        pg.colorMode(HSB, 360, 100, 100, 1);
        pg.noStroke();
        return pg;
      }
      // Fallback placeholder for tests or non-p5 environment
      return {
        _isPaintBuffer: true,
        width: this.width,
        height: this.height,
        isWebGL: true
      };
    }

    // ============================================================
    // Cursor Lifecycle
    // ============================================================

    /**
     * Create a cursor for a phone at a given slot
     * @param {number} slot - Slot index (0-29)
     * @param {string} brushType - Brush type name
     * @param {Object} [color] - Initial color { h, s, b }
     * @returns {BrushCursor}
     */
    createCursor(slot, brushType, color) {
      const cursor = new BrushCursor(slot, brushType);
      if (color) {
        cursor.color = { ...color, a: 1 };
      }
      this.cursors[slot] = cursor;
      return cursor;
    }

    /**
     * Get cursor for a slot
     * @param {number} slot
     * @returns {BrushCursor|null}
     */
    getCursor(slot) {
      return this.cursors[slot] || null;
    }

    /**
     * Update cursor position from sensor data and draw brush stroke
     * @param {number} slot
     * @param {Object} sensorData - { orientation: {a, b, g}, accel: {x, y, z}, gyro: {a, b, g} }
     */
    updateCursor(slot, sensorData) {
      const cursor = this.cursors[slot];
      if (!cursor) return;

      // Map orientation to position
      const pos = this._sensorToPosition(sensorData);

      // Apply EMA smoothing
      if (!cursor.hasPrev) {
        cursor.smoothX = pos.x;
        cursor.smoothY = pos.y;
        cursor.x = pos.x;
        cursor.y = pos.y;
        cursor.prevX = pos.x;
        cursor.prevY = pos.y;
        cursor.hasPrev = true;
      } else {
        cursor.smoothX = cursor.smoothX * (1 - cursor.smoothing) + pos.x * cursor.smoothing;
        cursor.smoothY = cursor.smoothY * (1 - cursor.smoothing) + pos.y * cursor.smoothing;
        cursor.prevX = cursor.x;
        cursor.prevY = cursor.y;
        cursor.x = cursor.smoothX;
        cursor.y = cursor.smoothY;
      }

      // Modulate brush parameters from sensor data
      this._modulateFromSensor(cursor, sensorData);

      // Draw brush stroke on paint buffer
      this._drawBrush(cursor);

      cursor.lastUpdate = Date.now();
    }

    /**
     * Remove cursor and free slot
     * If cursor exists, starts a disconnect fade instead of instant removal.
     * The cursor is actually removed later via _cleanupExpiredCursors().
     * @param {number} slot
     * @param {boolean} [instant=false] - If true, removes immediately (for cleanup)
     */
    disposeCursor(slot, instant) {
      const cursor = this.cursors[slot];
      if (!cursor) return;

      if (instant) {
        delete this.cursors[slot];
        this.cursors[slot] = null;
        return;
      }

      // Start disconnect fade
      cursor.disconnecting = true;
      cursor.disconnectFadeStart = Date.now();
      cursor.active = false; // stop position updates
    }

    /**
     * Get count of active (non-disconnecting) cursors
     * @returns {number}
     */
    get activeCount() {
      return this.cursors.filter(c => c !== null && !c.disconnecting).length;
    }

    // ============================================================
    // Drawing
    // ============================================================

    /**
     * Draw all cursors (called from sketch.js draw())
     * Updates lifecycle state (blink, idle, disconnect fade)
     * and cleans up expired cursors
     */
    drawAll() {
      this.frameCount++;

      // Update lifecycle state for all cursors
      for (const cursor of this.cursors) {
        if (!cursor) continue;
        if (!cursor.disconnecting) {
          this._updateCursorBlink(cursor);
          this._updateCursorIdle(cursor);
        }
      }

      // Clean up fully-faded disconnecting cursors
      this._cleanupExpiredCursors();

      // Apply canvas fade periodically
      if (this.frameCount % this.fadeInterval === 0) {
        this.applyFade();
      }
    }

    // ============================================================
    // Phase 3: Lifecycle Methods
    // ============================================================

    /**
     * Update cursor connection blink state
     * Blinks for blinkDuration ms, then resolves
     * @param {BrushCursor} cursor
     */
    _updateCursorBlink(cursor) {
      if (!cursor.isBlinking) return;
      const elapsed = Date.now() - cursor.connectionTime;
      if (elapsed >= cursor.blinkDuration) {
        cursor.isBlinking = false;
      }
    }

    /**
     * Update cursor idle state
     * If lastUpdate is older than idleTimeout, marks cursor as idle
     * @param {BrushCursor} cursor
     */
    _updateCursorIdle(cursor) {
      const elapsed = Date.now() - cursor.lastUpdate;
      if (elapsed >= this.idleTimeout) {
        cursor.isIdle = true;
        // Gradually reduce idle opacity
        cursor.idleOpacity = Math.max(0.1, cursor.idleOpacity - 0.01);
      } else {
        cursor.isIdle = false;
        // Recover idle opacity when active again
        cursor.idleOpacity = Math.min(1.0, cursor.idleOpacity + 0.05);
      }
    }

    /**
     * Remove cursors whose disconnect fade has completed
     */
    _cleanupExpiredCursors() {
      for (let i = 0; i < this.cursors.length; i++) {
        const cursor = this.cursors[i];
        if (!cursor || !cursor.disconnecting) continue;
        const elapsed = Date.now() - cursor.disconnectFadeStart;
        if (elapsed >= this.disconnectFadeDuration) {
          delete this.cursors[i];
          this.cursors[i] = null;
        }
      }
    }

    /**
     * Apply canvas fade (semi-transparent overlay)
     * Called periodically to gradually age old strokes
     */
    applyFade() {
      if (!this.paintBuffer) return;
      const pb = this.paintBuffer;
      if (typeof pb.noStroke === 'function') pb.noStroke();
      if (typeof pb.fill === 'function') {
        pb.fill(0, 0, 0, this.fadeRate);
      }
      if (typeof pb.rect === 'function') {
        pb.rect(0, 0, this.width * 2, this.height * 2);
      }
    }

    // ============================================================
    // Private: Sensor → Position Mapping
    // ============================================================

    /**
     * Map orientation angles to canvas X/Y position
     *   α (alpha) 0-360 → X (0 to canvasWidth)
     *   β (beta)  -180-180 → Y (0 to canvasHeight)
     * 
     * "Laser pointer" metaphor: tilt phone to aim the brush
     */
    _sensorToPosition(sd) {
      const orient = sd.orientation || {};
      const alpha = orient.a !== undefined ? orient.a : 180;
      const beta = orient.b !== undefined ? orient.b : 0;

      // Map alpha (0-360) to X (0 to width)
      // Normalize so alpha=180 is center
      const x = (alpha / 360) * this.width;

      // Map beta (-180 to 180) to Y (0 to height)
      // Normalize so beta=0 is center
      const y = ((beta + 180) / 360) * this.height;

      return {
        x: Math.max(0, Math.min(this.width, x)),
        y: Math.max(0, Math.min(this.height, y))
      };
    }

    // ============================================================
    // Private: Sensor Modulation
    // ============================================================

    /**
     * Modulate brush color/size/opacity/scatter from accelerometer + gyroscope
     */
    _modulateFromSensor(cursor, sd) {
      const accel = sd.accel || {};
      const gyro = sd.gyro || {};

      // Accel X: hue shift (0-360)
      const hueShift = accel.x !== undefined ? mapAndConstrain(accel.x, -20, 20, -60, 60) : 0;
      cursor.color.h = ((cursor.color.h + hueShift * 0.1) % 360 + 360) % 360;

      // Accel Y: size (5-80)
      if (accel.y !== undefined) {
        cursor.size = mapAndConstrain(Math.abs(accel.y), 0, 20, 15, 80);
      }

      // Accel Z: opacity (0.1-1.0)
      if (accel.z !== undefined) {
        cursor.opacity = mapAndConstrain(Math.abs(accel.z), 0, 20, 0.1, 1.0);
      }

      // Gyro α (alpha): scatter (0-40)
      if (gyro.a !== undefined) {
        cursor.scatter = mapAndConstrain(Math.abs(gyro.a), 0, 500, 0, 40);
      }

      // Gyro β (beta): rotation angle
      if (gyro.b !== undefined) {
        cursor.angle = gyro.b * 0.01; // subtle rotation
      }

      // Gyro γ (gamma): saturation (20-100)
      if (gyro.g !== undefined) {
        cursor.color.s = mapAndConstrain(Math.abs(gyro.g), 0, 500, 20, 100);
      }
    }

    // ============================================================
    // Private: Brush Drawing
    // ============================================================

    /**
     * Draw a brush stroke using brush-registry
     * Converts HSB color to RGB for brush functions (user's algorithms expect RGB)
     * Applies lifecycle effects: blink pulse, idle fade, disconnect fade
     */
    _drawBrush(cursor) {
      if (!this.paintBuffer) return;

      const pb = this.paintBuffer;
      const hsbColor = cursor.color;

      // Compute effective opacity with lifecycle modifiers
      let effectiveOpacity = cursor.opacity * hsbColor.a;

      // Connection blink: pulse opacity for first blinkDuration
      if (cursor.isBlinking) {
        const elapsed = Date.now() - cursor.connectionTime;
        const blinkPhase = (elapsed % 400) / 400; // pulse every 400ms
        const blinkPulse = 0.5 + Math.sin(blinkPhase * Math.PI * 2) * 0.5;
        effectiveOpacity *= (0.7 + blinkPulse * 0.3);
      }

      // Idle fade: reduce opacity gradually
      if (cursor.isIdle) {
        effectiveOpacity *= cursor.idleOpacity;
      }

      // Disconnect fade: ramp opacity to zero
      if (cursor.disconnecting) {
        const elapsed = Date.now() - cursor.disconnectFadeStart;
        const fadeProgress = Math.min(1, elapsed / this.disconnectFadeDuration);
        effectiveOpacity *= (1 - fadeProgress);
      }

      // Convert HSB to RGB for brush functions
      const rgb = hsbToRgb(hsbColor.h, hsbColor.s, hsbColor.b);
      const color = { r: rgb.r, g: rgb.g, b: rgb.b };

      // Build opts for brush (user's algorithms expect RGB color + alpha 0-255)
      const opts = {
        alpha: Math.round(effectiveOpacity * 255),
        frameCount: this.frameCount,
        state: cursor._brushState,
        scatter: cursor.scatter,
        angle: cursor.angle,
        hueShift: cursor.hueShift,
        blendMode: 'normal',
        saturation: hsbColor.s
      };

      // Try using brush registry first
      if (typeof drawBrush !== 'undefined') {
        drawBrush(
          cursor.brushType,
          pb,
          cursor.prevX, cursor.prevY,
          cursor.x, cursor.y,
          color,
          cursor.size,
          opts
        );
        return;
      }

      // Fallback: Simple ellipse stroke
      if (typeof pb.noStroke === 'function') pb.noStroke();
      if (typeof pb.fill === 'function') {
        pb.fill(hsbColor.h, hsbColor.s, hsbColor.b, effectiveOpacity);
      }
      if (typeof pb.ellipse === 'function') {
        const d = this._dist(cursor.prevX, cursor.prevY, cursor.x, cursor.y);
        const steps = Math.max(Math.floor(d), 1);
        for (let i = 0; i <= steps; i++) {
          const t = steps > 0 ? i / steps : 0;
          const x = this._lerp(cursor.prevX, cursor.x, t);
          const y = this._lerp(cursor.prevY, cursor.y, t);
          pb.ellipse(x, y, cursor.size, cursor.size);
        }
      }
    }

    // ============================================================
    // Math Helpers (standalone, no p5 dependency)
    // ============================================================

    _dist(x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    }

    _lerp(a, b, t) {
      return a + (b - a) * t;
    }
  }

  // ============================================================
  // Standalone Helpers
  // ============================================================

  function mapAndConstrain(value, inMin, inMax, outMin, outMax) {
    const norm = (value - inMin) / (inMax - inMin);
    const clamped = Math.max(0, Math.min(1, norm));
    return outMin + clamped * (outMax - outMin);
  }

  /**
   * Convert HSB (0-360, 0-100, 0-100) to RGB (0-255)
   */
  function hsbToRgb(h, s, b) {
    const hue = ((h % 360) + 360) % 360;
    const saturation = Math.max(0, Math.min(100, s)) / 100;
    const brightness = Math.max(0, Math.min(100, b)) / 100;

    if (saturation === 0) {
      const v = Math.round(brightness * 255);
      return { r: v, g: v, b: v };
    }

    const f = hue / 60;
    const i = Math.floor(f);
    const rgb = [
      brightness,
      brightness * (1 - saturation),
      brightness * (1 - saturation * (1 - ((f - i) % 1))),
      brightness * (1 - saturation * ((f - i) % 1))
    ];
    const vals = [
      [rgb[0], rgb[3], rgb[1]],
      [rgb[2], rgb[0], rgb[1]],
      [rgb[1], rgb[0], rgb[3]],
      [rgb[1], rgb[2], rgb[0]],
      [rgb[3], rgb[1], rgb[0]],
      [rgb[0], rgb[1], rgb[2]]
    ][i % 6];

    return {
      r: Math.round(vals[0] * 255),
      g: Math.round(vals[1] * 255),
      b: Math.round(vals[2] * 255)
    };
  }

  // ============================================================
  // Exports
  // ============================================================

  global.BrushCanvas = BrushCanvas;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrushCanvas };
  }

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
