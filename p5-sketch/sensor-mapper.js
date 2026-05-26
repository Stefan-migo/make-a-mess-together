(function(global) {
  const SensorMapper = {
    _normalizedCache: {},

    normalize(value, min, max) {
      if (typeof value !== 'number' || isNaN(value)) return 0;
      if (max === min) return 0.5;
      const n = (value - min) / (max - min);
      return Math.max(0, Math.min(1, n));
    },

    smooth(prev, current, coefficient) {
      if (prev === undefined || prev === null) return current;
      const c = typeof coefficient === 'number' ? coefficient : 0.3;
      return prev + c * (current - prev);
    },

    mapCurve(normalized, outMin, outMax, curveType) {
      let n = Math.max(0, Math.min(1, normalized));
      switch (curveType) {
        case 'exponential':
          n = n * n;
          break;
        case 'logarithmic':
          n = Math.sqrt(n);
          break;
        case 'inverse':
          n = 1 - n;
          break;
        case 'linear':
        default:
          break;
      }
      return outMin + n * (outMax - outMin);
    },

    getSensorValue(sensorData, source, axis, paramConfig) {
      if (!sensorData || !paramConfig) return paramConfig ? paramConfig.range[0] : 0;

      let raw = 0;
      const s = source || (paramConfig ? paramConfig.source : null);
      const a = axis || (paramConfig ? paramConfig.axis : null);
      const cacheKey = s + '|' + a;

      if (s === 'accelMag') {
        const x = sensorData.accel ? sensorData.accel.x || 0 : 0;
        const y = sensorData.accel ? sensorData.accel.y || 0 : 0;
        const z = sensorData.accel ? sensorData.accel.z || 0 : 0;
        raw = Math.sqrt(x * x + y * y + z * z);
      } else {
        const section = sensorData[s];
        if (!section || typeof section !== 'object') return paramConfig ? paramConfig.range[0] : 0;
        const val = section[a];
        if (typeof val !== 'number' || isNaN(val)) return paramConfig ? paramConfig.range[0] : 0;
        raw = val;
      }

      const cacheEntry = this._normalizedCache[cacheKey];
      let norm;
      if (cacheEntry && cacheEntry.raw === raw) {
        norm = cacheEntry.normalized;
      } else {
        const normRange = this.getNormalizationRange(s || 'accel', a);
        norm = this.normalize(raw, normRange.min, normRange.max);
        this._normalizedCache[cacheKey] = { raw, normalized: norm };
      }

      const curve = paramConfig ? paramConfig.curve || 'linear' : 'linear';
      const rMin = paramConfig ? paramConfig.range[0] : 0;
      const rMax = paramConfig ? paramConfig.range[1] : 1;
      return this.mapCurve(norm, rMin, rMax, curve);
    },

    clearCache() {
      this._normalizedCache = {};
    },

    _normalizationRanges: {
      accel: { min: -10, max: 10 },
      gyro: { min: -2000, max: 2000 },
      orientation: { alpha: { min: 0, max: 360 }, beta: { min: -180, max: 180 }, gamma: { min: -90, max: 90 } },
      accelMag: { min: 0, max: 30 }
    },

    getNormalizationRange(source, axis) {
      if (source === 'accelMag') return this._normalizationRanges.accelMag;
      const ranges = this._normalizationRanges[source];
      if (!ranges) return { min: -1, max: 1 };
      if (ranges.min !== undefined && ranges.max !== undefined) return ranges;
      if (axis && ranges[axis]) return ranges[axis];
      if (axis === 'a' && ranges.alpha) return ranges.alpha;
      if (axis === 'b' && ranges.beta) return ranges.beta;
      if (axis === 'g' && ranges.gamma) return ranges.gamma;
      return { min: -1, max: 1 };
    }
  };

  global.SensorMapper = SensorMapper;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SensorMapper };
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
