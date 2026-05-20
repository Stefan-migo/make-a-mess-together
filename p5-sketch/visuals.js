(function(global) {
  const VISUAL_TYPES = [
    'pulsingCircle', 'rotatingLine', 'arcSweep', 'polygon', 'spiral',
    'connectedDots', 'waveAmplitude', 'lissajous', 'concentricRings', 'particleCloud',
    'oscilloscopeTrail', 'wobblyCircle', 'expandingRing', 'starburst', 'glowingDot',
    'pulseFlash', 'bouncingBall', 'pixelatedGrid', 'stutterStrobe', 'foldedWaveform',
    'jitterOffset', 'scatteredGrains', 'particleFountain', 'randomBlink', 'slidingWindow',
    'abstractShape', 'echoGhosts', 'warpDistortion', 'rippleRings', 'thresholdBars'
  ];

  const SENSOR_RANGES = {
    accel: { min: -10, max: 10 },
    gyro: { min: -2000, max: 2000 },
    orientation: { min: 0, max: 360 },
    orientationBeta: { min: -180, max: 180 },
    orientationGamma: { min: -90, max: 90 },
    accelMag: { min: 0, max: 30 }
  };

  class Visuals {
    constructor(config) {
      this._config = config;
      this._states = {};
    }

    _getCtx() {
      if (typeof p !== 'undefined') return p;
      if (typeof window !== 'undefined') return window;
      return null;
    }

    _norm(value, srcMin, srcMax) {
      if (typeof value !== 'number' || isNaN(value)) return 0;
      const range = srcMax - srcMin;
      if (range === 0) return 0.5;
      return Math.max(0, Math.min(1, (value - srcMin) / range));
    }

    _scale(norm, outMin, outMax) {
      return outMin + norm * (outMax - outMin);
    }

    _getSensor(data, source, axis) {
      if (!data) return 0;
      if (source === 'accelMag') {
        const a = data.accel || {};
        const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
        return this._norm(mag, SENSOR_RANGES.accelMag.min, SENSOR_RANGES.accelMag.max);
      }
      const section = data[source];
      if (!section || typeof section !== 'object') return 0;
      const val = section[axis];
      return typeof val === 'number' ? val : 0;
    }

    _getSensorVal(data, source, axis, range) {
      const raw = this._getSensor(data, source, axis);
      if (source === 'accelMag') return raw;
      return this._norm(raw, range.min, range.max);
    }

    _getRadialPosition(slot, config) {
      const angle = (slot / config.maxDevices) * Math.PI * 2;
      const x = config.centerX + Math.cos(angle) * config.baseRadius;
      const y = config.centerY + Math.sin(angle) * config.baseRadius;
      const wedgeAngle = (Math.PI * 2) / config.maxDevices;
      return { angle, x, y, wedgeAngle };
    }

    // ========================
    // VISUAL FACTORIES
    // ========================

    _makeState(slot, type, params, accum) {
      const state = {
        type,
        slot,
        params: params || {},
        accum: accum || { angle: 0, phase: 0, counter: 0 },
        trail: [],
        particles: [],
        lastSensorData: null,
        dispose() {
          this.trail.length = 0;
          this.particles.length = 0;
        }
      };
      return state;
    }

    _factory(slot, type) {
      switch (type) {
        case 'pulsingCircle':
          return this._makeState(slot, type, { size: 50, hue: 0 }, { angle: 0, phase: 0 });
        case 'rotatingLine':
          return this._makeState(slot, type, { angle: 0, length: 60 }, { angle: 0 });
        case 'arcSweep':
          return this._makeState(slot, type, { sweep: 180, thickness: 8 }, { angle: 0 });
        case 'polygon':
          return this._makeState(slot, type, { sides: 6, radius: 50 }, { angle: 0 });
        case 'spiral':
          return this._makeState(slot, type, { turns: 5, tightness: 15 }, { angle: 0 });
        case 'connectedDots':
          return this._makeState(slot, type, { count: 10, spread: 50 }, { angle: 0 });
        case 'waveAmplitude':
          return this._makeState(slot, type, { amplitude: 25, frequency: 5 }, { angle: 0, phase: 0 });
        case 'lissajous':
          return this._makeState(slot, type, { ratio: 3, phase: 0 }, { angle: 0, phase: 0 });
        case 'concentricRings':
          return this._makeState(slot, type, { count: 8, spacing: 15 }, { angle: 0 });
        case 'particleCloud':
          return this._makeState(slot, type, { count: 25, spread: 30 }, { angle: 0 }, []);
        case 'oscilloscopeTrail':
          return this._makeState(slot, type, { trailLen: 40, amplitude: 20 }, { angle: 0 }, []);
        case 'wobblyCircle':
          return this._makeState(slot, type, { wobble: 15, speed: 2 }, { angle: 0, phase: 0 });
        case 'expandingRing':
          return this._makeState(slot, type, { ringSpeed: 2, ringCount: 3 }, { rings: [], lastTrigger: 0 });
        case 'starburst':
          return this._makeState(slot, type, { count: 12, length: 50 }, { angle: 0 });
        case 'glowingDot':
          return this._makeState(slot, type, { opacity: 0.8, glowRadius: 15 }, { angle: 0 });
        case 'pulseFlash':
          return this._makeState(slot, type, { speed: 2, brightness: 50 }, { angle: 0, timer: 0 });
        case 'bouncingBall':
          return this._makeState(slot, type, { height: 50, size: 15 }, { vy: 0, posY: 0 });
        case 'pixelatedGrid':
          return this._makeState(slot, type, { resolution: 16, blockSize: 15 }, { angle: 0 });
        case 'stutterStrobe':
          return this._makeState(slot, type, { rate: 10, contrast: 50 }, { frame: 0, on: true });
        case 'foldedWaveform':
          return this._makeState(slot, type, { foldCount: 4, detail: 15 }, { angle: 0, phase: 0 });
        case 'jitterOffset':
          return this._makeState(slot, type, { jitter: 15, interval: 10 }, { offsetX: 0, offsetY: 0, lastJitter: 0 });
        case 'scatteredGrains':
          return this._makeState(slot, type, { dotSize: 8, count: 20 }, { angle: 0 }, []);
        case 'particleFountain':
          return this._makeState(slot, type, { rate: 10, gravity: 0.5 }, { angle: 0 }, []);
        case 'randomBlink':
          return this._makeState(slot, type, { speed: 3, posRandom: 25 }, { blinkX: 0, blinkY: 0, lastChange: 0, visible: true });
        case 'slidingWindow':
          return this._makeState(slot, type, { windowPos: 0.5, windowWidth: 0.3 }, { angle: 0 });
        case 'abstractShape':
          return this._makeState(slot, type, { size: 45, complexity: 6 }, { angle: 0, offsets: [] });
        case 'echoGhosts':
          return this._makeState(slot, type, { ghostCount: 5, fadeRate: 0.05 }, { angle: 0 }, []);
        case 'warpDistortion':
          return this._makeState(slot, type, { warp: 10, frequency: 5 }, { angle: 0, phase: 0 });
        case 'rippleRings':
          return this._makeState(slot, type, { count: 4, speed: 2 }, { angle: 0, phase: 0 });
        case 'thresholdBars':
          return this._makeState(slot, type, { barHeight: 50, barCount: 10 }, { angle: 0 });
        default:
          return this._makeState(slot, type, {}, { angle: 0 });
      }
    }

    // ========================
    // CREATE / UPDATE / DRAW
    // ========================

    createVisual(slot) {
      if (this._states[slot]) {
        this._states[slot].dispose();
        delete this._states[slot];
      }
      const slotConfig = this._config.slots[slot];
      if (!slotConfig) return null;
      const type = slotConfig.visualType;
      const state = this._factory(slot, type);
      this._states[slot] = state;
      return state;
    }

    updateVisual(slot, sensorData, config) {
      const state = this._states[slot];
      if (!state) return;
      if (!sensorData) return;

      const p = state.params;
      const sz = (sensorData.accel && typeof sensorData.accel.x === 'number') || false;

      switch (state.type) {
        case 'pulsingCircle': {
          const y = this._getSensorVal(sensorData, 'accel', 'y', SENSOR_RANGES.accel);
          const z = this._getSensorVal(sensorData, 'gyro', 'z', SENSOR_RANGES.gyro);
          p.size = this._scale(y, 10, 80);
          p.hue = this._scale(z, 0, 360);
          break;
        }
        case 'rotatingLine': {
          const x = this._getSensorVal(sensorData, 'accel', 'x', SENSOR_RANGES.accel);
          const b = this._getSensorVal(sensorData, 'orientation', 'b', SENSOR_RANGES.orientationBeta);
          p.angle = this._scale(x, 0, Math.PI * 2);
          p.length = this._scale(b, 20, 120);
          break;
        }
        case 'arcSweep': {
          const a = this._getSensorVal(sensorData, 'gyro', 'a', SENSOR_RANGES.gyro);
          const z = this._getSensorVal(sensorData, 'accel', 'z', SENSOR_RANGES.accel);
          p.sweep = this._scale(a, 0, Math.PI * 2);
          p.thickness = this._scale(z, 2, 20);
          break;
        }
        case 'polygon': {
          const g = this._getSensorVal(sensorData, 'orientation', 'g', SENSOR_RANGES.orientationGamma);
          const y = this._getSensorVal(sensorData, 'accel', 'y', SENSOR_RANGES.accel);
          p.sides = Math.max(3, Math.round(this._scale(g, 3, 12)));
          p.radius = this._scale(y, 20, 80);
          break;
        }
        case 'spiral': {
          const b = this._getSensorVal(sensorData, 'gyro', 'b', SENSOR_RANGES.gyro);
          const x = this._getSensorVal(sensorData, 'accel', 'x', SENSOR_RANGES.accel);
          p.turns = this._scale(b, 1, 10);
          p.tightness = this._scale(x, 5, 30);
          break;
        }
        case 'connectedDots': {
          const b = this._getSensorVal(sensorData, 'orientation', 'b', SENSOR_RANGES.orientationBeta);
          const x = this._getSensorVal(sensorData, 'accel', 'x', SENSOR_RANGES.accel);
          p.count = Math.max(3, Math.round(this._scale(b, 3, 20)));
          p.spread = this._scale(x, 10, 80);
          break;
        }
        case 'waveAmplitude': {
          const z = this._getSensorVal(sensorData, 'gyro', 'z', SENSOR_RANGES.gyro);
          const y = this._getSensorVal(sensorData, 'accel', 'y', SENSOR_RANGES.accel);
          p.amplitude = this._scale(z, 5, 50);
          p.frequency = this._scale(y, 1, 10);
          break;
        }
        case 'lissajous': {
          const a = this._getSensorVal(sensorData, 'orientation', 'a', SENSOR_RANGES.orientation);
          const ga = this._getSensorVal(sensorData, 'gyro', 'a', SENSOR_RANGES.gyro);
          p.ratio = Math.max(1, Math.round(this._scale(a, 1, 5)));
          p.phase = this._scale(ga, 0, Math.PI * 2);
          break;
        }
        case 'concentricRings': {
          const z = this._getSensorVal(sensorData, 'accel', 'z', SENSOR_RANGES.accel);
          const g = this._getSensorVal(sensorData, 'orientation', 'g', SENSOR_RANGES.orientationGamma);
          p.count = Math.max(2, Math.round(this._scale(z, 2, 15)));
          p.spacing = this._scale(g, 5, 30);
          break;
        }
        case 'particleCloud': {
          const z = this._getSensorVal(sensorData, 'accel', 'z', SENSOR_RANGES.accel);
          const a = this._getSensorVal(sensorData, 'gyro', 'a', SENSOR_RANGES.gyro);
          p.count = Math.max(5, Math.round(this._scale(z, 5, 50)));
          p.spread = this._scale(a, 5, 60);
          break;
        }
        case 'oscilloscopeTrail': {
          const g = this._getSensorVal(sensorData, 'orientation', 'g', SENSOR_RANGES.orientationGamma);
          const x = this._getSensorVal(sensorData, 'accel', 'x', SENSOR_RANGES.accel);
          p.trailLen = this._scale(g, 10, 80);
          p.amplitude = this._scale(x, 5, 40);
          break;
        }
        case 'wobblyCircle': {
          const b = this._getSensorVal(sensorData, 'gyro', 'b', SENSOR_RANGES.gyro);
          const y = this._getSensorVal(sensorData, 'accel', 'y', SENSOR_RANGES.accel);
          p.wobble = this._scale(b, 2, 30);
          p.speed = this._scale(y, 0.1, 5);
          break;
        }
        case 'expandingRing': {
          const mag = this._getSensorVal(sensorData, 'accelMag', 'magnitude', SENSOR_RANGES.accelMag);
          const z = this._getSensorVal(sensorData, 'gyro', 'z', SENSOR_RANGES.gyro);
          p.ringCount = Math.max(1, Math.round(this._scale(z, 1, 5)));
          const now = Date.now();
          if (mag > 0.5 && now - state.accum.lastTrigger > 200) {
            state.accum.lastTrigger = now;
            const newRings = [];
            for (let i = 0; i < p.ringCount; i++) {
              newRings.push({ radius: 0, alpha: 1, speed: 2 + Math.random() * 3 });
            }
            state.accum.rings.push(...newRings);
            if (state.accum.rings.length > 20) {
              state.accum.rings = state.accum.rings.slice(-20);
            }
          }
          break;
        }
        case 'starburst': {
          const b = this._getSensorVal(sensorData, 'orientation', 'b', SENSOR_RANGES.orientationBeta);
          const y = this._getSensorVal(sensorData, 'accel', 'y', SENSOR_RANGES.accel);
          p.count = Math.max(4, Math.round(this._scale(b, 4, 24)));
          p.length = this._scale(y, 10, 80);
          break;
        }
        case 'glowingDot': {
          const a = this._getSensorVal(sensorData, 'gyro', 'a', SENSOR_RANGES.gyro);
          const g = this._getSensorVal(sensorData, 'orientation', 'g', SENSOR_RANGES.orientationGamma);
          p.opacity = this._scale(a, 0, 1);
          p.glowRadius = this._scale(g, 5, 30);
          break;
        }
        case 'pulseFlash': {
          const g = this._getSensorVal(sensorData, 'orientation', 'g', SENSOR_RANGES.orientationGamma);
          const x = this._getSensorVal(sensorData, 'accel', 'x', SENSOR_RANGES.accel);
          p.speed = this._scale(g, 0.5, 5);
          p.brightness = this._scale(x, 0, 100);
          break;
        }
        case 'bouncingBall': {
          const b = this._getSensorVal(sensorData, 'gyro', 'b', SENSOR_RANGES.gyro);
          const z = this._getSensorVal(sensorData, 'accel', 'z', SENSOR_RANGES.accel);
          p.height = this._scale(b, 0, 100);
          p.size = this._scale(z, 5, 30);
          break;
        }
        case 'pixelatedGrid': {
          const x = this._getSensorVal(sensorData, 'accel', 'x', SENSOR_RANGES.accel);
          const z = this._getSensorVal(sensorData, 'gyro', 'z', SENSOR_RANGES.gyro);
          p.resolution = Math.max(4, Math.round(this._scale(x, 4, 32)));
          p.blockSize = this._scale(z, 5, 30);
          break;
        }
        case 'stutterStrobe': {
          const g = this._getSensorVal(sensorData, 'orientation', 'g', SENSOR_RANGES.orientationGamma);
          const y = this._getSensorVal(sensorData, 'accel', 'y', SENSOR_RANGES.accel);
          p.rate = Math.max(1, Math.round(this._scale(g, 1, 20)));
          p.contrast = this._scale(y, 0, 100);
          break;
        }
        case 'foldedWaveform': {
          const a = this._getSensorVal(sensorData, 'gyro', 'a', SENSOR_RANGES.gyro);
          const z = this._getSensorVal(sensorData, 'accel', 'z', SENSOR_RANGES.accel);
          p.foldCount = Math.max(1, Math.round(this._scale(a, 1, 8)));
          p.detail = this._scale(z, 5, 30);
          break;
        }
        case 'jitterOffset': {
          const x = this._getSensorVal(sensorData, 'accel', 'x', SENSOR_RANGES.accel);
          const b = this._getSensorVal(sensorData, 'gyro', 'b', SENSOR_RANGES.gyro);
          p.jitter = this._scale(x, 0, 30);
          p.interval = this._scale(b, 1, 20);
          break;
        }
        case 'scatteredGrains': {
          const b = this._getSensorVal(sensorData, 'gyro', 'b', SENSOR_RANGES.gyro);
          const y = this._getSensorVal(sensorData, 'accel', 'y', SENSOR_RANGES.accel);
          p.dotSize = this._scale(b, 2, 15);
          p.count = Math.max(5, Math.round(this._scale(y, 5, 40)));
          break;
        }
        case 'particleFountain': {
          const a = this._getSensorVal(sensorData, 'orientation', 'a', SENSOR_RANGES.orientation);
          const z = this._getSensorVal(sensorData, 'accel', 'z', SENSOR_RANGES.accel);
          p.rate = Math.max(1, Math.round(this._scale(a, 1, 20)));
          p.gravity = this._scale(z, 0.1, 2);
          break;
        }
        case 'randomBlink': {
          const g = this._getSensorVal(sensorData, 'gyro', 'g', SENSOR_RANGES.gyro);
          const x = this._getSensorVal(sensorData, 'accel', 'x', SENSOR_RANGES.accel);
          p.speed = this._scale(g, 0.5, 10);
          p.posRandom = this._scale(x, 0, 50);
          break;
        }
        case 'slidingWindow': {
          const y = this._getSensorVal(sensorData, 'accel', 'y', SENSOR_RANGES.accel);
          const a = this._getSensorVal(sensorData, 'gyro', 'a', SENSOR_RANGES.gyro);
          p.windowPos = this._scale(y, 0, 1);
          p.windowWidth = this._scale(a, 0.1, 0.5);
          break;
        }
        case 'abstractShape': {
          const a = this._getSensorVal(sensorData, 'orientation', 'a', SENSOR_RANGES.orientation);
          const z = this._getSensorVal(sensorData, 'accel', 'z', SENSOR_RANGES.accel);
          p.size = this._scale(a, 10, 80);
          p.complexity = Math.max(3, Math.round(this._scale(z, 3, 12)));
          break;
        }
        case 'echoGhosts': {
          const b = this._getSensorVal(sensorData, 'gyro', 'b', SENSOR_RANGES.gyro);
          const y = this._getSensorVal(sensorData, 'accel', 'y', SENSOR_RANGES.accel);
          p.ghostCount = Math.max(2, Math.round(this._scale(b, 2, 10)));
          p.fadeRate = this._scale(y, 0.01, 0.1);
          break;
        }
        case 'warpDistortion': {
          const x = this._getSensorVal(sensorData, 'accel', 'x', SENSOR_RANGES.accel);
          const g = this._getSensorVal(sensorData, 'gyro', 'g', SENSOR_RANGES.gyro);
          p.warp = this._scale(x, 1, 20);
          p.frequency = Math.max(1, Math.round(this._scale(g, 1, 10)));
          break;
        }
        case 'rippleRings': {
          const b = this._getSensorVal(sensorData, 'orientation', 'b', SENSOR_RANGES.orientationBeta);
          const a = this._getSensorVal(sensorData, 'gyro', 'a', SENSOR_RANGES.gyro);
          p.count = Math.max(1, Math.round(this._scale(b, 1, 8)));
          p.speed = this._scale(a, 0.5, 5);
          break;
        }
        case 'thresholdBars': {
          const z = this._getSensorVal(sensorData, 'accel', 'z', SENSOR_RANGES.accel);
          const b = this._getSensorVal(sensorData, 'gyro', 'b', SENSOR_RANGES.gyro);
          p.barHeight = this._scale(z, 0, 100);
          p.barCount = Math.max(3, Math.round(this._scale(b, 3, 20)));
          break;
        }
      }

      state.lastSensorData = sensorData;
    }

    // ========================
    // DRAWING
    // ========================

    drawAll(activeSlots, config) {
      const ctx = this._getCtx();
      if (!ctx || typeof ctx.push !== 'function') return;

      for (const slot of activeSlots) {
        const state = this._states[slot];
        if (!state) continue;
        this._draw(state, slot, config);
      }
    }

    _draw(state, slot, config) {
      const ctx = this._getCtx();
      if (!ctx) return;

      const slotConfig = config.slots[slot];
      if (!slotConfig) return;

      const { angle, x, y, wedgeAngle } = this._getRadialPosition(slot, config);
      const col = slotConfig.color;
      const p = state.params;
      const accum = state.accum;
      const now = Date.now();

      ctx.push();
      ctx.translate(x, y);
      ctx.rotate(angle + ctx.HALF_PI);

      switch (state.type) {
        case 'pulsingCircle': {
          ctx.noStroke();
          ctx.fill(col.h + (p.hue || 0), col.s, col.b, 0.8);
          ctx.circle(0, 0, p.size || 50);
          break;
        }
        case 'rotatingLine': {
          ctx.push();
          ctx.rotate(p.angle || 0);
          ctx.stroke(col.h, col.s, col.b, 0.9);
          ctx.strokeWeight(2);
          ctx.line(0, 0, 0, -(p.length || 60));
          ctx.pop();
          break;
        }
        case 'arcSweep': {
          ctx.noFill();
          ctx.stroke(col.h, col.s, col.b, 0.8);
          ctx.strokeWeight(p.thickness || 8);
          ctx.arc(0, 0, 80, 80, -p.sweep / 2, p.sweep / 2);
          break;
        }
        case 'polygon': {
          const sides = p.sides || 6;
          const radius = p.radius || 50;
          ctx.noFill();
          ctx.stroke(col.h, col.s, col.b, 0.8);
          ctx.strokeWeight(2);
          ctx.beginShape();
          for (let i = 0; i <= sides; i++) {
            const a = (i / sides) * ctx.TWO_PI - ctx.HALF_PI;
            ctx.vertex(Math.cos(a) * radius, Math.sin(a) * radius);
          }
          ctx.endShape();
          break;
        }
        case 'spiral': {
          const turns = p.turns || 5;
          const tightness = p.tightness || 15;
          ctx.noFill();
          ctx.stroke(col.h, col.s, col.b, 0.8);
          ctx.strokeWeight(2);
          ctx.beginShape();
          const steps = Math.round(turns * 40);
          for (let i = 0; i <= steps; i++) {
            const t = i / steps * turns * ctx.TWO_PI;
            const r = i / steps * tightness * turns;
            ctx.vertex(Math.cos(t) * r, Math.sin(t) * r);
          }
          ctx.endShape();
          break;
        }
        case 'connectedDots': {
          const count = p.count || 10;
          const spread = p.spread || 50;
          const dotPositions = [];
          for (let i = 0; i < count; i++) {
            const a = (i / count) * ctx.TWO_PI;
            const dx = Math.cos(a) * spread;
            const dy = Math.sin(a) * spread;
            dotPositions.push({ x: dx, y: dy });
          }
          ctx.stroke(col.h, col.s, col.b, 0.4);
          ctx.strokeWeight(1);
          for (let i = 0; i < dotPositions.length; i++) {
            for (let j = i + 1; j < dotPositions.length; j++) {
              ctx.line(dotPositions[i].x, dotPositions[i].y, dotPositions[j].x, dotPositions[j].y);
            }
          }
          ctx.fill(col.h, col.s, col.b, 0.9);
          ctx.noStroke();
          for (const pos of dotPositions) {
            ctx.circle(pos.x, pos.y, 4);
          }
          break;
        }
        case 'waveAmplitude': {
          const amp = p.amplitude || 25;
          const freq = p.frequency || 5;
          ctx.noFill();
          ctx.stroke(col.h, col.s, col.b, 0.8);
          ctx.strokeWeight(2);
          ctx.beginShape();
          for (let i = 0; i <= 60; i++) {
            const t = (i / 60) * ctx.TWO_PI;
            const yy = Math.sin(t * freq + (accum.phase || 0)) * amp;
            ctx.vertex(t * 5 - ctx.PI * 2.5, yy);
          }
          ctx.endShape();
          break;
        }
        case 'lissajous': {
          const ratio = p.ratio || 3;
          const phase = p.phase || 0;
          ctx.noFill();
          ctx.stroke(col.h, col.s, col.b, 0.8);
          ctx.strokeWeight(2);
          ctx.beginShape();
          const lissSteps = 200;
          for (let i = 0; i <= lissSteps; i++) {
            const t = (i / lissSteps) * ctx.TWO_PI * 2;
            ctx.vertex(Math.cos(t) * 40, Math.sin(t * ratio + phase) * 40);
          }
          ctx.endShape();
          break;
        }
        case 'concentricRings': {
          const ringCount = p.count || 8;
          const spacing = p.spacing || 15;
          ctx.noFill();
          ctx.stroke(col.h, col.s, col.b, 0.4);
          for (let i = 1; i <= ringCount; i++) {
            const r = i * spacing;
            ctx.strokeWeight(Math.max(1, 4 - i * 0.3));
            ctx.circle(0, 0, r * 2);
          }
          break;
        }
        case 'particleCloud': {
          const cloudCount = p.count || 25;
          const spread = p.spread || 30;
          ctx.fill(col.h, col.s, col.b, 0.6);
          ctx.noStroke();
          for (let i = 0; i < cloudCount; i++) {
            const angle2 = Math.random() * ctx.TWO_PI;
            const dist = Math.random() * spread;
            ctx.circle(Math.cos(angle2) * dist, Math.sin(angle2) * dist, 3 + Math.random() * 4);
          }
          break;
        }
        case 'oscilloscopeTrail': {
          const trailLen = p.trailLen || 40;
          const amp = p.amplitude || 20;
          const val = Math.sin(now * 0.003) * amp;
          state.trail.push({ y: val, t: now });
          if (state.trail.length > 50) state.trail.shift();
          ctx.noFill();
          ctx.stroke(col.h, col.s, col.b, 0.7);
          ctx.strokeWeight(2);
          ctx.beginShape();
          const trail = state.trail;
          const start = Math.max(0, trail.length - Math.round(trailLen / 2));
          for (let i = start; i < trail.length; i++) {
            const t = (i - start) / Math.max(1, trail.length - start) * trailLen - trailLen / 2;
            ctx.vertex(t, trail[i].y);
          }
          ctx.endShape();
          break;
        }
        case 'wobblyCircle': {
          const wobble = p.wobble || 15;
          const speed = p.speed || 2;
          accum.phase = (accum.phase || 0) + 0.05 * speed;
          ctx.noFill();
          ctx.stroke(col.h, col.s, col.b, 0.8);
          ctx.strokeWeight(2);
          ctx.beginShape();
          const wobbleSteps = 40;
          for (let i = 0; i <= wobbleSteps; i++) {
            const a = (i / wobbleSteps) * ctx.TWO_PI;
            const deform = Math.sin(a * 3 + (accum.phase || 0)) * wobble;
            const r = 30 + deform;
            ctx.vertex(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.endShape();
          break;
        }
        case 'expandingRing': {
          const rings = accum.rings || [];
          ctx.noFill();
          for (let i = rings.length - 1; i >= 0; i--) {
            const ring = rings[i];
            ring.radius += ring.speed;
            ring.alpha -= 0.01;
            if (ring.alpha <= 0) {
              rings.splice(i, 1);
              continue;
            }
            ctx.stroke(col.h, col.s, col.b, ring.alpha);
            ctx.strokeWeight(2);
            ctx.circle(0, 0, ring.radius * 2);
          }
          break;
        }
        case 'starburst': {
          const burstCount = p.count || 12;
          const burstLen = p.length || 50;
          ctx.stroke(col.h, col.s, col.b, 0.8);
          ctx.strokeWeight(1.5);
          for (let i = 0; i < burstCount; i++) {
            const a = (i / burstCount) * ctx.TWO_PI;
            ctx.line(0, 0, Math.cos(a) * burstLen, Math.sin(a) * burstLen);
          }
          break;
        }
        case 'glowingDot': {
          const opacity = p.opacity || 0.8;
          const glowRadius = p.glowRadius || 15;
          ctx.drawingContext.shadowBlur = glowRadius * 3;
          ctx.drawingContext.shadowColor = `hsla(${col.h}, ${col.s}%, ${col.b}%, ${opacity})`;
          ctx.fill(col.h, col.s, col.b, opacity);
          ctx.noStroke();
          ctx.circle(0, 0, glowRadius * 2);
          ctx.drawingContext.shadowBlur = 0;
          break;
        }
        case 'pulseFlash': {
          const speed = p.speed || 2;
          const brightness = p.brightness || 50;
          accum.timer = (accum.timer || 0) + 0.02 * speed;
          const flash = Math.sin(accum.timer * ctx.TWO_PI) > 0.3;
          if (flash) {
            ctx.fill(col.h, col.s, brightness, 0.3);
            ctx.noStroke();
            ctx.rect(-40, -40, 80, 80);
          }
          break;
        }
        case 'bouncingBall': {
          const height = p.height || 50;
          const ballSize = p.size || 15;
          const gravity = 0.4;
          const ground = height;
          if (accum.posY === undefined) accum.posY = 0;
          if (accum.vy === undefined) accum.vy = 0;
          accum.vy += gravity;
          accum.posY += accum.vy;
          if (accum.posY > 0) {
            accum.posY = 0;
            accum.vy = -Math.abs(accum.vy) * 0.7;
          }
          const bouncePos = accum.posY - ground;
          ctx.fill(col.h, col.s, col.b, 0.9);
          ctx.noStroke();
          ctx.circle(0, bouncePos, ballSize);
          break;
        }
        case 'pixelatedGrid': {
          const res = p.resolution || 16;
          const blockSize = p.blockSize || 15;
          const gridSize = res * blockSize;
          ctx.noStroke();
          for (let row = 0; row < res; row++) {
            for (let col2 = 0; col2 < res; col2++) {
              const hue = (col.h + (row / res) * 60 + (col2 / res) * 60) % 360;
              ctx.fill(hue, col.s, col.b, 0.7);
              ctx.rect(col2 * blockSize - gridSize / 2, row * blockSize - gridSize / 2, blockSize - 1, blockSize - 1);
            }
          }
          break;
        }
        case 'stutterStrobe': {
          const rate = p.rate || 10;
          const contrast = p.contrast || 50;
          accum.frame = (accum.frame || 0) + 1;
          if (accum.frame % Math.max(1, Math.round(10 / rate)) === 0) {
            accum.on = !accum.on;
          }
          if (accum.on) {
            const bright = 50 + contrast * 0.5;
            ctx.fill(0, 0, bright, 0.9);
          } else {
            ctx.fill(0, 0, 10, 0.9);
          }
          ctx.noStroke();
          ctx.rect(-40, -40, 80, 80);
          break;
        }
        case 'foldedWaveform': {
          const foldCount = p.foldCount || 4;
          const detail = p.detail || 15;
          ctx.noFill();
          ctx.stroke(col.h, col.s, col.b, 0.8);
          ctx.strokeWeight(1.5);
          accum.phase = (accum.phase || 0) + 0.05;
          ctx.beginShape();
          for (let i = 0; i <= 80; i++) {
            const t = (i / 80) * ctx.TWO_PI;
            let val = Math.sin(t + (accum.phase || 0));
            for (let f = 0; f < foldCount; f++) {
              val = Math.sin(val * ctx.PI * 0.5);
            }
            ctx.vertex(t * 2 - ctx.PI, val * detail);
          }
          ctx.endShape();
          break;
        }
        case 'jitterOffset': {
          const jitter = p.jitter || 15;
          const interval = p.interval || 10;
          accum.counter = (accum.counter || 0) + 1;
          if (accum.counter % Math.max(1, Math.round(interval)) === 0) {
            accum.offsetX = (Math.random() - 0.5) * jitter * 2;
            accum.offsetY = (Math.random() - 0.5) * jitter * 2;
          }
          ctx.fill(col.h, col.s, col.b, 0.8);
          ctx.noStroke();
          ctx.circle(accum.offsetX || 0, accum.offsetY || 0, 12);
          break;
        }
        case 'scatteredGrains': {
          const dotSize = p.dotSize || 8;
          const grainCount = p.count || 20;
          ctx.fill(col.h, col.s, col.b, 0.6);
          ctx.noStroke();
          for (let i = 0; i < grainCount; i++) {
            const a = Math.random() * ctx.TWO_PI;
            const d = Math.random() * 50;
            ctx.circle(Math.cos(a) * d, Math.sin(a) * d, dotSize * 0.5 + Math.random() * dotSize * 0.5);
          }
          break;
        }
        case 'particleFountain': {
          const rate = Math.min(p.rate || 10, 20);
          const gravity = p.gravity || 0.5;
          for (let i = 0; i < Math.min(rate, 5); i++) {
            if (Math.random() < rate / 20) {
              const angle2 = (Math.random() - 0.5) * ctx.PI;
              const speed = 1 + Math.random() * 3;
              state.particles.push({
                x: 0, y: 0,
                vx: Math.sin(angle2) * speed,
                vy: -Math.abs(Math.cos(angle2)) * speed,
                life: 1,
                decay: 0.01 + Math.random() * 0.02
              });
            }
          }
          ctx.noStroke();
          for (let i = state.particles.length - 1; i >= 0; i--) {
            const pt = state.particles[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.vy += gravity * 0.1;
            pt.life -= pt.decay;
            if (pt.life <= 0) {
              state.particles.splice(i, 1);
              continue;
            }
            ctx.fill(col.h, col.s, col.b, pt.life * 0.8);
            ctx.circle(pt.x, pt.y, 2 + pt.life * 3);
          }
          break;
        }
        case 'randomBlink': {
          const blinkSpeed = p.speed || 3;
          const posRandom = p.posRandom || 25;
          accum.counter = (accum.counter || 0) + 1;
          const changeInterval = Math.max(5, Math.round(30 / blinkSpeed));
          if (accum.counter % changeInterval === 0) {
            accum.blinkX = (Math.random() - 0.5) * posRandom * 2;
            accum.blinkY = (Math.random() - 0.5) * posRandom * 2;
            accum.visible = !accum.visible;
          }
          if (accum.visible) {
            ctx.fill(col.h, col.s, col.b, 0.9);
            ctx.noStroke();
            ctx.circle(accum.blinkX || 0, accum.blinkY || 0, 8);
          }
          break;
        }
        case 'slidingWindow': {
          const windowPos = p.windowPos || 0.5;
          const windowWidth = p.windowWidth || 0.3;
          const startAngle = (windowPos - windowWidth / 2) * ctx.TWO_PI;
          const sweepAngle = windowWidth * ctx.TWO_PI;
          ctx.noFill();
          ctx.stroke(col.h, col.s, col.b, 0.8);
          ctx.strokeWeight(4);
          ctx.arc(0, 0, 70, 70, startAngle - ctx.HALF_PI, startAngle + sweepAngle - ctx.HALF_PI);
          break;
        }
        case 'abstractShape': {
          const shapeSize = p.size || 45;
          const complexity = p.complexity || 6;
          ctx.fill(col.h, col.s, col.b, 0.3);
          ctx.stroke(col.h, col.s, col.b, 0.8);
          ctx.strokeWeight(2);
          ctx.beginShape();
          for (let i = 0; i <= complexity; i++) {
            const a = (i / complexity) * ctx.TWO_PI;
            const offset = (accum.offsets && accum.offsets[i] !== undefined ? accum.offsets[i] : 0);
            const r = shapeSize + Math.sin(a * 2 + (accum.angle || 0)) * offset * 0.5;
            ctx.vertex(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.endShape();
          if (accum.offsets.length === 0) {
            for (let i = 0; i <= complexity; i++) {
              accum.offsets.push((Math.random() - 0.5) * shapeSize * 0.5);
            }
          }
          break;
        }
        case 'echoGhosts': {
          const ghostCount = p.ghostCount || 5;
          const fadeRate = p.fadeRate || 0.05;
          const currentVal = Math.sin(now * 0.002) * 30;
          state.trail.push({ x: currentVal, y: currentVal * 0.5, alpha: 1 });
          if (state.trail.length > 50) state.trail.shift();
          for (let i = 0; i < state.trail.length; i++) {
            const ghost = state.trail[i];
            ghost.alpha = Math.max(0, ghost.alpha - fadeRate * 0.1);
          }
          ctx.noStroke();
          for (const ghost of state.trail) {
            ctx.fill(col.h, col.s, col.b, ghost.alpha * 0.3);
            ctx.circle(ghost.x, ghost.y, 6 * ghost.alpha);
          }
          ctx.fill(col.h, col.s, col.b, 0.9);
          ctx.circle(0, 0, 8);
          break;
        }
        case 'warpDistortion': {
          const warp = p.warp || 10;
          const freq = p.frequency || 5;
          accum.phase = (accum.phase || 0) + 0.03;
          ctx.noFill();
          ctx.stroke(col.h, col.s, col.b, 0.6);
          ctx.strokeWeight(1);
          const gridRes = 12;
          for (let row = 0; row <= gridRes; row++) {
            ctx.beginShape();
            for (let col2 = 0; col2 <= gridRes; col2++) {
              const nx = (col2 / gridRes - 0.5) * 80;
              const ny = (row / gridRes - 0.5) * 80;
              const dx = Math.sin(ny * 0.1 * freq + (accum.phase || 0)) * warp;
              const dy = Math.cos(nx * 0.1 * freq + (accum.phase || 0)) * warp;
              ctx.vertex(nx + dx, ny + dy);
            }
            ctx.endShape();
          }
          for (let col2 = 0; col2 <= gridRes; col2++) {
            ctx.beginShape();
            for (let row = 0; row <= gridRes; row++) {
              const nx = (col2 / gridRes - 0.5) * 80;
              const ny = (row / gridRes - 0.5) * 80;
              const dx = Math.sin(ny * 0.1 * freq + (accum.phase || 0)) * warp;
              const dy = Math.cos(nx * 0.1 * freq + (accum.phase || 0)) * warp;
              ctx.vertex(nx + dx, ny + dy);
            }
            ctx.endShape();
          }
          break;
        }
        case 'rippleRings': {
          const rippleCount = p.count || 4;
          const rippleSpeed = p.speed || 2;
          accum.phase = (accum.phase || 0) + 0.02 * rippleSpeed;
          ctx.noFill();
          for (let i = 0; i < rippleCount; i++) {
            const phase = (accum.phase || 0) + (i / rippleCount) * ctx.TWO_PI;
            const r = 10 + (Math.sin(phase) * 0.5 + 0.5) * 40;
            ctx.stroke(col.h, col.s, col.b, 0.5 - i * 0.05);
            ctx.strokeWeight(2 - i * 0.3);
            ctx.circle(0, 0, r * 2);
          }
          break;
        }
        case 'thresholdBars': {
          const barHeight = p.barHeight || 50;
          const barCount = p.barCount || 10;
          ctx.noStroke();
          const totalWidth = 60;
          const barW = totalWidth / barCount;
          for (let i = 0; i < barCount; i++) {
            const h = (barHeight / 100) * 70 * ((i + 1) / barCount);
            const hue = (col.h + (i / barCount) * 60) % 360;
            ctx.fill(hue, col.s, col.b, 0.7);
            ctx.rect(i * barW - totalWidth / 2, -h, barW - 1, h);
          }
          break;
        }
      }

      ctx.pop();
    }

    // ========================
    // DISPOSE
    // ========================

    disposeVisual(slot) {
      const state = this._states[slot];
      if (state) {
        if (typeof state.dispose === 'function') state.dispose();
        delete this._states[slot];
      }
    }

    disposeAll() {
      for (const slot of Object.keys(this._states)) {
        this.disposeVisual(parseInt(slot));
      }
    }
  }

  global.Visuals = Visuals;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Visuals };
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
