(function(global) {
  'use strict';

  /**
   * BrushCanvas — Shared persistent canvas for collaborative multi-phone brush painting
   * 
   * Architecture:
   *   Layer 1 (Offscreen paintBuffer): P2D createGraphics, NEVER cleared.
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

      // --- Pen up/down (Drawing Cone) ---
      this.penDown = true;
      this.wasPenDown = true;
      this._penSmoothDeviation = 0;

      // --- Phase 2: Smooth Traces & Dead Zones ---
      this.pressure = 0;
      this._wasInDeadZone = true;
      this._isInDeadZone = false;
      this._historyX = [];
      this._historyY = [];
      this._historyP = [];
      this._jitterScore = 0;
      this._lastSignDx = 0;
      this._lastSignDy = 0;

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

      // ===== Per-cursor state (previously shared on BrushCanvas — DO NOT SHARE) =====
      // Auto-calibration for sensor-to-canvas mapping
      this._calibrated = false;
      this._centerAlpha = 0;
      this._centerBeta = 0;
      // Normalized EMA smoothing state
      this._smoothNormX = 0;
      this._smoothNormY = 0;
      // Pressure EMA smoothing state
      this._smoothGamma = 0;
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

      // Phase 1: Pressure pipeline
      this.pressureCurve = config.pressureCurve || 'natural';
      this.pressureSmoothing = config.pressureSmoothing || 0.2;
      this.deadZoneGamma = config.deadZoneGamma || 5;

      // Phase 2: Smooth Traces & Dead Zones
      this.deadZonePosition = config.deadZonePosition || 3;

      // Phase 6: Auto-calibration for sensor-to-canvas mapping
      this._smoothFactor = 0.4;
      this._maxTiltDeg = 90;
      this._sensitivityExponent = 2.0;

    }

    /**
     * Create an offscreen WEBGL graphics buffer
     * (No-op in test environment; returns a placeholder object)
     */
    _createPaintBuffer() {
      // In browser: create a P2D graphics buffer
      // (p5.brush is unused — WEBGL is unnecessary overhead and breaks P2D coordinates)
      if (typeof createGraphics !== 'undefined') {
        const pg = createGraphics(this.width, this.height);
        pg.colorMode(RGB, 255, 255, 255, 1);
        pg.noStroke();
        return pg;
      }
      // Fallback placeholder for tests or non-p5 environment
      return {
        _isPaintBuffer: true,
        width: this.width,
        height: this.height
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
      const pos = this._sensorToPosition(sensorData, cursor);

      // Initialize on first frame (must happen even in dead zone)
      if (!cursor.hasPrev) {
        cursor.smoothX = pos.x;
        cursor.smoothY = pos.y;
        cursor.x = pos.x;
        cursor.y = pos.y;
        cursor.prevX = pos.x;
        cursor.prevY = pos.y;
        cursor.hasPrev = true;
      }

      // --- Phase 2: Position Dead Zone ---
      const orient = sensorData.orientation || {};
      const alpha = orient.a !== undefined ? orient.a : 180;
      const beta = orient.b !== undefined ? orient.b : 0;

      let deltaAlpha = alpha - cursor._centerAlpha;
      if (deltaAlpha > 180) deltaAlpha -= 360;
      if (deltaAlpha < -180) deltaAlpha += 360;
      let deltaBeta = beta - cursor._centerBeta;

      const DEAD_ZONE_DEG = this.deadZonePosition !== undefined ? this.deadZonePosition : 3;
      const isInDeadZone = Math.abs(deltaAlpha) < DEAD_ZONE_DEG && Math.abs(deltaBeta) < DEAD_ZONE_DEG;

      if (isInDeadZone && cursor._wasInDeadZone) {
        cursor._isInDeadZone = true;
        // Still modulate sensor parameters (pressure, hue, etc.) even when stationary
        this._modulateFromSensor(cursor, sensorData);
        cursor.lastUpdate = Date.now();
        return;
      } else if (isInDeadZone) {
        cursor._isInDeadZone = true;
        cursor._wasInDeadZone = true;
        this._modulateFromSensor(cursor, sensorData);
        cursor.lastUpdate = Date.now();
        return;
      } else {
        cursor._isInDeadZone = false;
        cursor._wasInDeadZone = false;

        // Apply EMA smoothing
        cursor.smoothX = cursor.smoothX * (1 - cursor.smoothing) + pos.x * cursor.smoothing;
        cursor.smoothY = cursor.smoothY * (1 - cursor.smoothing) + pos.y * cursor.smoothing;
        cursor.x = cursor.smoothX;
        cursor.y = cursor.smoothY;

        // Modulate brush parameters from sensor data
        this._modulateFromSensor(cursor, sensorData);

        if (cursor.penDown) {
          cursor._historyX.push(cursor.x);
          cursor._historyY.push(cursor.y);
          cursor._historyP.push(cursor.pressure);
          if (cursor._historyX.length > 4) cursor._historyX.shift();
          if (cursor._historyY.length > 4) cursor._historyY.shift();
          if (cursor._historyP.length > 4) cursor._historyP.shift();

          this._drawBrush(cursor);

          cursor.prevX = cursor.x;
          cursor.prevY = cursor.y;
        }
      }

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
    _sensorToPosition(sd, cursor) {
      const orient = sd.orientation || {};
      const alpha = orient.a !== undefined ? orient.a : 180;
      const beta = orient.b !== undefined ? orient.b : 0;

      // Auto-calibrate on first reading
      if (!cursor._calibrated) {
        cursor._centerAlpha = alpha;
        cursor._centerBeta = beta;
        cursor._calibrated = true;
        cursor._smoothNormX = 0;
        cursor._smoothNormY = 0;
        return { x: this.width / 2, y: this.height / 2 };
      }

      // Deviation from center (handle wraparound for alpha 0-360)
      let deltaAlpha = alpha - cursor._centerAlpha;
      if (deltaAlpha > 180) deltaAlpha -= 360;
      if (deltaAlpha < -180) deltaAlpha += 360;

      let deltaBeta = beta - cursor._centerBeta;

      // Normalize to -1..+1
      let normX = Math.max(-1, Math.min(1, deltaAlpha / this._maxTiltDeg));
      let normY = Math.max(-1, Math.min(1, deltaBeta / this._maxTiltDeg));

      // Phase 2: Adaptive EMA smoothing (per-cursor jitter tracking)
      let smoothCoeff = this._smoothFactor;
      if (cursor) {
        const signDx = Math.sign(normX);
        const signDy = Math.sign(normY);
        const signChange = (signDx !== 0 && signDx !== cursor._lastSignDx) ||
                           (signDy !== 0 && signDy !== cursor._lastSignDy) ? 1 : 0;
        cursor._lastSignDx = signDx;
        cursor._lastSignDy = signDy;

        cursor._jitterScore = cursor._jitterScore * 0.9 + signChange * 0.1;

        smoothCoeff = cursor._jitterScore > 0.3 ? 0.2 : 0.4;
      }

      // Apply EMA smoothing with adaptive coefficient
      cursor._smoothNormX = cursor._smoothNormX * (1 - smoothCoeff) + normX * smoothCoeff;
      cursor._smoothNormY = cursor._smoothNormY * (1 - smoothCoeff) + normY * smoothCoeff;

      // Apply sensitivity curve (fine control near center)
      const curvedX = Math.sign(cursor._smoothNormX) * Math.pow(Math.abs(cursor._smoothNormX), this._sensitivityExponent);
      const curvedY = Math.sign(cursor._smoothNormY) * Math.pow(Math.abs(cursor._smoothNormY), this._sensitivityExponent);

      // Map to canvas with inversion fix
      const margin = 40;
      const radiusX = (this.width / 2) - margin;
      const radiusY = (this.height / 2) - margin;

      // Negate to fix inversion: deltaAlpha positive = turned right = cursor goes right
      const x = (this.width / 2) + (-curvedX * radiusX);
      const y = (this.height / 2) + (-curvedY * radiusY);

      return {
        x: Math.max(0, Math.min(this.width, x)),
        y: Math.max(0, Math.min(this.height, y))
      };
    }

    // ============================================================
    // Private: Pressure Mapping (Phase 1)
    // ============================================================

    /**
     * Compute pressure from orientation gamma (roll).
     * Gamma range: -90 to +90 degrees.
     * Uses dead zone, EMA smoothing, and configurable curve.
     * @param {number} rawGamma - Raw orientation.gamma in degrees
     * @returns {number} Pressure value 0.0-1.0
     */
    _computePressure(rawGamma, cursor) {
      if (Math.abs(rawGamma) < this.deadZoneGamma) return 0;

      const normalized = Math.min(1, Math.abs(rawGamma) / 90);

      cursor._smoothGamma = cursor._smoothGamma * (1 - this.pressureSmoothing) + normalized * this.pressureSmoothing;

      const exponent = this._getPressureExponent(this.pressureCurve);
      const pressure = Math.pow(cursor._smoothGamma, exponent);

      return Math.min(1, Math.max(0, pressure));
    }

    _getPressureExponent(curve) {
      switch (curve) {
        case 'linear': return 1.0;
        case 'aggressive': return 0.7;
        case 'natural':
        default: return 2.5;
      }
    }

    // ============================================================
    // Private: Sensor Modulation
    // ============================================================

    /**
     * Modulate brush color/size/opacity/scatter from accelerometer + gyroscope
     * Size and opacity are now driven by orientation.gamma (pressure) instead of accel.y/z.
     */
    _modulateFromSensor(cursor, sd) {
      const accel = sd.accel || {};
      const gyro = sd.gyro || {};

      // Accel X: hue shift (0-360)
      const hueShift = accel.x !== undefined ? mapAndConstrain(accel.x, -20, 20, -60, 60) : 0;
      cursor.color.h = ((cursor.color.h + hueShift * 0.1) % 360 + 360) % 360;

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

      // Pressure → brushSize + opacity (Phase 1)
      const gamma = (sd.orientation && sd.orientation.g !== undefined) ? sd.orientation.g : 0;
      const newPressure = this._computePressure(gamma, cursor);

      // Phase 2: Pressure delta limiter — prevent sudden pressure jumps
      const MAX_PRESSURE_DELTA = this.config.pressureDeltaMax !== undefined ? this.config.pressureDeltaMax : 0.1;
      let pressureDelta = newPressure - cursor.pressure;
      if (pressureDelta > MAX_PRESSURE_DELTA) pressureDelta = MAX_PRESSURE_DELTA;
      if (pressureDelta < -MAX_PRESSURE_DELTA) pressureDelta = -MAX_PRESSURE_DELTA;
      cursor.pressure += pressureDelta;

      cursor.size = 5 + cursor.pressure * (80 - 5);
      cursor.opacity = 0.3 + cursor.pressure * (1.0 - 0.3);
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

      // Phase 2: Build drawing segments (Catmull-Rom or linear)
      let segments = [];

      if (cursor._historyX.length >= 4 && (this.config.interpolateSteps || 5) > 1) {
        const STEPS = this.config.interpolateSteps || 5;
        const p0x = cursor._historyX[0], p0y = cursor._historyY[0];
        const p1x = cursor._historyX[1], p1y = cursor._historyY[1];
        const p2x = cursor._historyX[2], p2y = cursor._historyY[2];
        const p3x = cursor._historyX[3], p3y = cursor._historyY[3];

        let prevIx = p1x, prevIy = p1y;
        for (let i = 1; i <= STEPS; i++) {
          const t = i / STEPS;
          const ix = this._catmullRom(p0x, p1x, p2x, p3x, t);
          const iy = this._catmullRom(p0y, p1y, p2y, p3y, t);
          segments.push({ fromX: prevIx, fromY: prevIy, toX: ix, toY: iy });
          prevIx = ix;
          prevIy = iy;
        }
      } else {
        segments.push({ fromX: cursor.prevX, fromY: cursor.prevY, toX: cursor.x, toY: cursor.y });
      }

      // Try using brush registry first
      const drawSegment = (fromX, fromY, toX, toY) => {
        if (typeof drawBrush !== 'undefined') {
          drawBrush(cursor.brushType, pb, fromX, fromY, toX, toY, color, cursor.size, opts);
        } else {
          if (typeof pb.noStroke === 'function') pb.noStroke();
          if (typeof pb.fill === 'function') {
            pb.fill(color.r, color.g, color.b, effectiveOpacity);
          }
          if (typeof pb.ellipse === 'function') {
            const d = this._dist(fromX, fromY, toX, toY);
            const steps = Math.max(Math.floor(d), 1);
            for (let i = 0; i <= steps; i++) {
              const t = steps > 0 ? i / steps : 0;
              const x = this._lerp(fromX, toX, t);
              const y = this._lerp(fromY, toY, t);
              pb.ellipse(x, y, cursor.size, cursor.size);
            }
          }
        }
      };

      for (const seg of segments) {
        drawSegment(seg.fromX, seg.fromY, seg.toX, seg.toY);
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

    _catmullRom(p0, p1, p2, p3, t) {
      const t2 = t * t;
      const t3 = t2 * t;
      return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
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
