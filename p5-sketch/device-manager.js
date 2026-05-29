(function(global) {
  class DeviceManager {
    constructor(config, brushCanvas) {
      this._config = config;
      this._brushCanvas = brushCanvas || null;
      this._sensorCache = {};
    }

    assign(slot) {
      if (this._brushCanvas && this._brushCanvas.getCursor(slot)) {
        return;
      }
      const slotConfig = this._config.slots[slot];
      if (!slotConfig) return;
      if (this._brushCanvas) {
        const brushType = slotConfig.brushType || 'classic';
        const color = slotConfig.color || { h: (slot * 12) % 360, s: 80, b: 90 };
        this._brushCanvas.createCursor(slot, brushType, color);
      }
    }

    disconnect(slot) {
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
    }

    updateConfig(slot, config) {
      if (!this._brushCanvas) return;
      const cursor = this._brushCanvas.getCursor(slot);
      if (!cursor) return;
      if (config.brush) {
        cursor.brushType = config.brush;
      }
      if (config.color) {
        if (config.color.h !== undefined) {
          cursor._baseHue = config.color.h;
          cursor._hueOffset = 0;
          cursor.color.h = config.color.h;
        }
        if (config.color.s !== undefined) {
          cursor._baseSaturation = config.color.s;
          cursor.color.s = config.color.s;
        }
        if (config.color.b !== undefined) cursor.color.b = config.color.b;
        cursor.color.a = 1;
      }
      if (config.pressureCurve) {
        cursor.pressureCurve = config.pressureCurve;
      }
      if (config.penDown !== undefined) {
        cursor.penDown = config.penDown;
      }
    }

    get isSlotActive() {
      return (slot) => !!(this._brushCanvas && this._brushCanvas.getCursor(slot));
    }

    get activeSlots() {
      if (!this._brushCanvas) return [];
      return this._brushCanvas.cursors
        .map((c, i) => c && !c.disconnecting ? i : -1)
        .filter(i => i >= 0);
    }

    get activeCount() {
      return this._brushCanvas ? this._brushCanvas.activeCount : 0;
    }

    drawHUD() {
    }

    disposeAll() {
      this._sensorCache = {};
    }
  }

  global.DeviceManager = DeviceManager;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DeviceManager };
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
