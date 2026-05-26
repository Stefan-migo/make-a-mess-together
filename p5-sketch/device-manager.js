(function(global) {
  class DeviceManager {
    constructor(soundEngine, config, brushCanvas) {
      this._engine = soundEngine;
      this._config = config;
      this._brushCanvas = brushCanvas || null;
      this._voices = {};
      this._sensorCache = {};
      this._useFrameBudgetGovernor = true;
      this._frameBudget = {
        maxVoiceTimePerFrame: 8,
        skippedSlots: new Set(),
        frameDeadline: 0,
      };
    }

    assign(slot) {
      if (this._voices[slot]) {
        this._engine.disposeVoice(this._voices[slot]);
        delete this._voices[slot];
      }
      const slotConfig = this._config.slots[slot];
      if (!slotConfig) return;
      const voice = this._engine.createVoice(slot, slotConfig);
      if (voice) {
        this._voices[slot] = voice;
      }
      // Create brush cursor
      if (this._brushCanvas) {
        const brushType = slotConfig.brushType || 'classic';
        const color = slotConfig.color || { h: (slot * 12) % 360, s: 80, b: 90 };
        this._brushCanvas.createCursor(slot, brushType, color);
      }
    }

    disconnect(slot) {
      if (this._voices[slot]) {
        this._engine.disposeVoice(this._voices[slot]);
        delete this._voices[slot];
      }
      // Dispose brush cursor (fades out)
      if (this._brushCanvas) {
        this._brushCanvas.disposeCursor(slot);
      }
    }

    updateCombinedSensor(slot, data) {
      if (!this._sensorCache[slot]) {
        this._sensorCache[slot] = {};
      }
      if (data.accel) this._sensorCache[slot].accel = { ...data.accel };
      if (data.gyro) this._sensorCache[slot].gyro = { ...data.gyro };
      if (data.orientation) this._sensorCache[slot].orientation = { ...data.orientation };

      if (this._brushCanvas) {
        this._brushCanvas.updateCursor(slot, this._sensorCache[slot]);
      }

      if (!this._useFrameBudgetGovernor) {
        this._processVoiceInline(slot);
      }
    }

    _processVoiceInline(slot) {
      const voice = this._voices[slot];
      if (!voice) return;

      const slotConfig = this._config.slots[slot];
      if (!slotConfig) return;

      const sensorMap = slotConfig.sensorMap;
      if (!sensorMap) return;

      const paramNames = Object.keys(sensorMap);
      if (paramNames.length === 0) return;

      const mapped = {};

      for (const paramName of paramNames) {
        const paramConfig = sensorMap[paramName];
        const normRange = SensorMapper.getNormalizationRange(paramConfig.source, paramConfig.axis);
        const fullConfig = {
          source: paramConfig.source,
          axis: paramConfig.axis,
          range: paramConfig.range,
          curve: paramConfig.curve || 'linear',
          normMin: normRange.min,
          normMax: normRange.max
        };

        const value = SensorMapper.getSensorValue(this._sensorCache[slot], paramConfig.source, paramConfig.axis, fullConfig);

        if (voice.lastSensorData && voice.lastSensorData[paramName] !== undefined) {
          const coeff = this._config.smoothCoefficient || 0.3;
          mapped[paramName] = SensorMapper.smooth(voice.lastSensorData[paramName], value, coeff);
        } else {
          mapped[paramName] = value;
        }
      }

      voice.lastSensorData = mapped;

      this._engine.updateVoice(voice, mapped, this._config);
    }

    beginFrame() {
      this._frameBudget.frameDeadline = performance.now() + this._frameBudget.maxVoiceTimePerFrame;
      this._frameBudget.skippedSlots.clear();
    }

    endFrame() {
      // Reset for next frame; skippedSlots is already cleared in beginFrame
    }

    processAllVoices() {
      this.beginFrame();
      for (const slot of this.activeSlots) {
        if (performance.now() > this._frameBudget.frameDeadline) {
          this._frameBudget.skippedSlots.add(slot);
          continue;
        }
        this._processVoice(slot);
      }
      this.endFrame();
    }

    _processVoice(slot) {
      const voice = this._voices[slot];
      if (!voice) return;

      const slotConfig = this._config.slots[slot];
      if (!slotConfig) return;

      const sensorMap = slotConfig.sensorMap;
      if (!sensorMap) return;

      const paramNames = Object.keys(sensorMap);
      if (paramNames.length === 0) return;

      const mapped = {};

      for (const paramName of paramNames) {
        const paramConfig = sensorMap[paramName];
        const normRange = SensorMapper.getNormalizationRange(paramConfig.source, paramConfig.axis);
        const fullConfig = {
          source: paramConfig.source,
          axis: paramConfig.axis,
          range: paramConfig.range,
          curve: paramConfig.curve || 'linear',
          normMin: normRange.min,
          normMax: normRange.max
        };

        const value = SensorMapper.getSensorValue(this._sensorCache[slot], paramConfig.source, paramConfig.axis, fullConfig);

        if (voice.lastSensorData && voice.lastSensorData[paramName] !== undefined) {
          const coeff = this._config.smoothCoefficient || 0.3;
          mapped[paramName] = SensorMapper.smooth(voice.lastSensorData[paramName], value, coeff);
        } else {
          mapped[paramName] = value;
        }
      }

      voice.lastSensorData = mapped;

      this._engine.updateVoice(voice, mapped, this._config);
    }

    updateSensor(slot, sensorType, data) {
      if (!this._sensorCache[slot]) {
        this._sensorCache[slot] = {};
      }
      const sensorTypeKey = sensorType === 'orientation' ? 'orientation' :
                            sensorType === 'accel' ? 'accel' : 'gyro';
      this._sensorCache[slot][sensorTypeKey] = { ...data };

      if (this._brushCanvas) {
        const combined = {
          accel: this._sensorCache[slot].accel || {},
          gyro: this._sensorCache[slot].gyro || {},
          orientation: this._sensorCache[slot].orientation || {}
        };
        this._brushCanvas.updateCursor(slot, combined);
      }

      if (!this._useFrameBudgetGovernor) {
        this._processVoiceInline(slot);
      }
    }

    updateConfig(slot, config) {
      if (!this._brushCanvas) return;
      const cursor = this._brushCanvas.getCursor(slot);
      if (!cursor) return;
      if (config.brush) {
        cursor.brushType = config.brush;
      }
      if (config.color) {
        if (config.color.h !== undefined) cursor.color.h = config.color.h;
        if (config.color.s !== undefined) cursor.color.s = config.color.s;
        if (config.color.b !== undefined) cursor.color.b = config.color.b;
        cursor.color.a = 1;
      }
      if (config.penDown !== undefined) {
        cursor.penDown = config.penDown;
      }
    }

    get isSlotActive() {
      return (slot) => !!this._voices[slot];
    }

    get activeSlots() {
      return Object.keys(this._voices).map(Number).sort((a, b) => a - b);
    }

    get activeCount() {
      return Object.keys(this._voices).length;
    }

    drawHUD() {
      // Simplified HUD — rendered via sketch.js overlay instead
    }

    disposeAll() {
      for (const slot of Object.keys(this._voices)) {
        this._engine.disposeVoice(this._voices[slot]);
      }
      this._voices = {};
      this._sensorCache = {};
      // BrushCanvas cursors fade out independently
    }
  }

  global.DeviceManager = DeviceManager;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DeviceManager };
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
