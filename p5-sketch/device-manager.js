(function(global) {
  class DeviceManager {
    constructor(soundEngine, config) {
      this._engine = soundEngine;
      this._config = config;
      this._voices = {};
      this._sensorCache = {};
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
    }

    disconnect(slot) {
      if (this._voices[slot]) {
        this._engine.disposeVoice(this._voices[slot]);
        delete this._voices[slot];
      }
    }

    updateSensor(slot, sensorType, data) {
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

        const value = SensorMapper.getSensorValue(data, paramConfig.source, paramConfig.axis, fullConfig);

        if (voice.lastSensorData && voice.lastSensorData[paramName] !== undefined) {
          const coeff = this._config.smoothCoefficient || 0.3;
          mapped[paramName] = SensorMapper.smooth(voice.lastSensorData[paramName], value, coeff);
        } else {
          mapped[paramName] = value;
        }
      }

      voice.lastSensorData = mapped;
      this._sensorCache[slot] = data;

      this._engine.updateVoice(voice, mapped, this._config);
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
      if (typeof p === 'undefined' && typeof window === 'undefined') return;
      const p5 = typeof p !== 'undefined' ? p : window;

      const cx = this._config.centerX;
      const cy = this._config.centerY;
      const radius = this._config.baseRadius;

      for (const slot of this.activeSlots) {
        const slotConfig = this._config.slots[slot];
        if (!slotConfig) continue;

        const angle = (slot / this._config.maxDevices) * Math.PI * 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        const col = slotConfig.color;
        const activity = this._voices[slot] && this._voices[slot].lastSensorData
          ? 0.5 + Math.random() * 0.3
          : 0.3;

        const size = 6 + activity * 10;

        if (p5.fill) {
          p5.fill(col.h, col.s, col.b, 0.8);
          p5.noStroke();
          p5.circle(x, y, size);
        }
      }
    }

    disposeAll() {
      for (const slot of Object.keys(this._voices)) {
        this._engine.disposeVoice(this._voices[slot]);
      }
      this._voices = {};
      this._sensorCache = {};
    }
  }

  global.DeviceManager = DeviceManager;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DeviceManager };
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
