const { SensorMapper } = require('../../p5-sketch/sensor-mapper.js');

describe('SensorMapper', () => {
  describe('normalize', () => {
    test('normalizes accel.x from -10..10 to 0..1', () => {
      expect(SensorMapper.normalize(-10, -10, 10)).toBe(0);
      expect(SensorMapper.normalize(0, -10, 10)).toBe(0.5);
      expect(SensorMapper.normalize(10, -10, 10)).toBe(1);
      expect(SensorMapper.normalize(5, -10, 10)).toBeCloseTo(0.75);
    });

    test('returns 0.5 for accel.x = 0 (midpoint)', () => {
      expect(SensorMapper.normalize(0, -10, 10)).toBe(0.5);
      expect(SensorMapper.normalize(0, 0, 360)).toBe(0);
    });

    test('clamps values outside range to 0 or 1', () => {
      expect(SensorMapper.normalize(-20, -10, 10)).toBe(0);
      expect(SensorMapper.normalize(20, -10, 10)).toBe(1);
      expect(SensorMapper.normalize(-100, 0, 360)).toBe(0);
      expect(SensorMapper.normalize(500, 0, 360)).toBe(1);
    });

    test('normalizes orientation.alpha from 0..360 to 0..1', () => {
      expect(SensorMapper.normalize(0, 0, 360)).toBe(0);
      expect(SensorMapper.normalize(180, 0, 360)).toBe(0.5);
      expect(SensorMapper.normalize(360, 0, 360)).toBe(1);
    });
  });

  describe('smooth (EMA filter)', () => {
    test('applies exponential moving average smoothing', () => {
      const result = SensorMapper.smooth(0.5, 0.7, 0.3);
      expect(result).toBeCloseTo(0.56);
    });

    test('high coefficient = more responsive, less smooth', () => {
      const result = SensorMapper.smooth(0.5, 0.9, 0.8);
      expect(result).toBeCloseTo(0.82);
    });

    test('low coefficient = smoother, more lag', () => {
      const result = SensorMapper.smooth(0.5, 0.9, 0.1);
      expect(result).toBeCloseTo(0.54);
    });

    test('returns current value when prev is undefined', () => {
      expect(SensorMapper.smooth(undefined, 0.7, 0.3)).toBe(0.7);
      expect(SensorMapper.smooth(null, 0.7, 0.3)).toBe(0.7);
    });
  });

  describe('mapCurve', () => {
    test('linear curve maps 0..1 linearly to output range', () => {
      expect(SensorMapper.mapCurve(0, 50, 2000, 'linear')).toBe(50);
      expect(SensorMapper.mapCurve(0.5, 50, 2000, 'linear')).toBe(1025);
      expect(SensorMapper.mapCurve(1, 50, 2000, 'linear')).toBe(2000);
    });

    test('exponential curve maps low values to wider output', () => {
      const linear = SensorMapper.mapCurve(0.5, 50, 2000, 'linear');
      const expo = SensorMapper.mapCurve(0.5, 50, 2000, 'exponential');
      expect(expo).toBeLessThan(linear);
      expect(expo).toBeGreaterThan(50);
      expect(expo).toBeCloseTo(537.5);
    });

    test('logarithmic curve maps high values to wider output', () => {
      const linear = SensorMapper.mapCurve(0.25, 50, 2000, 'linear');
      const log = SensorMapper.mapCurve(0.25, 50, 2000, 'logarithmic');
      expect(log).toBeGreaterThan(linear);
      expect(log).toBeCloseTo(1025);
    });

    test('inverse curve inverts the control direction', () => {
      expect(SensorMapper.mapCurve(0, 50, 2000, 'inverse')).toBe(2000);
      expect(SensorMapper.mapCurve(0.5, 50, 2000, 'inverse')).toBe(1025);
      expect(SensorMapper.mapCurve(1, 50, 2000, 'inverse')).toBe(50);
    });
  });

  describe('cache', () => {
    test('caches normalized value and reuses it when raw unchanged', () => {
      const sensorData = { accel: { x: 0, y: 5, z: 0 }, gyro: { a: 0, b: 0, g: 0 }, orientation: { a: 0, b: 0, g: 0 } };
      const config = { source: 'accel', axis: 'y', range: [50, 2000], curve: 'linear' };
      const result1 = SensorMapper.getSensorValue(sensorData, 'accel', 'y', config);
      const spy = jest.spyOn(SensorMapper, 'normalize');
      const result2 = SensorMapper.getSensorValue(sensorData, 'accel', 'y', config);
      expect(spy).not.toHaveBeenCalled();
      expect(result2).toBe(result1);
      spy.mockRestore();
    });

    test('recomputes when raw value changes', () => {
      const config = { source: 'accel', axis: 'y', range: [50, 2000], curve: 'linear' };
      const data1 = { accel: { x: 0, y: 5, z: 0 }, gyro: { a: 0, b: 0, g: 0 }, orientation: { a: 0, b: 0, g: 0 } };
      const data2 = { accel: { x: 0, y: -3, z: 0 }, gyro: { a: 0, b: 0, g: 0 }, orientation: { a: 0, b: 0, g: 0 } };
      const result1 = SensorMapper.getSensorValue(data1, 'accel', 'y', config);
      const result2 = SensorMapper.getSensorValue(data2, 'accel', 'y', config);
      expect(result2).not.toBe(result1);
    });

    test('clearCache resets cache', () => {
      const sensorData = { accel: { x: 0, y: 5, z: 0 }, gyro: { a: 0, b: 0, g: 0 }, orientation: { a: 0, b: 0, g: 0 } };
      const config = { source: 'accel', axis: 'y', range: [50, 2000], curve: 'linear' };
      SensorMapper.getSensorValue(sensorData, 'accel', 'y', config);
      SensorMapper.clearCache();
      expect(SensorMapper._normalizedCache).toEqual({});
    });
  });

  describe('getSensorValue', () => {
    test('maps accel.y to pitch range 50..2000 Hz', () => {
      const sensorData = { accel: { x: 0, y: 5, z: 0 }, gyro: { a: 0, b: 0, g: 0 }, orientation: { a: 0, b: 0, g: 0 } };
      const config = { source: 'accel', axis: 'y', range: [50, 2000], curve: 'linear' };
      const pitch = SensorMapper.getSensorValue(sensorData, 'accel', 'y', config);
      expect(pitch).toBeGreaterThan(50);
      expect(pitch).toBeLessThanOrEqual(2000);
    });

    test('maps gyro.z to filter range 200..8000 Hz', () => {
      const sensorData = { accel: { x: 0, y: 0, z: 0 }, gyro: { a: 0, b: 0, g: 500 }, orientation: { a: 0, b: 0, g: 0 } };
      const config = { source: 'gyro', axis: 'g', range: [200, 8000], curve: 'exponential' };
      const filterVal = SensorMapper.getSensorValue(sensorData, 'gyro', 'g', config);
      expect(filterVal).toBeGreaterThanOrEqual(200);
      expect(filterVal).toBeLessThanOrEqual(8000);
    });

    test('handles null/undefined sensor values gracefully', () => {
      const config = { source: 'accel', axis: 'y', range: [50, 2000], curve: 'linear' };
      expect(SensorMapper.getSensorValue(null, 'accel', 'y', config)).toBe(50);
      expect(SensorMapper.getSensorValue(undefined, 'accel', 'y', config)).toBe(50);
      expect(SensorMapper.getSensorValue({}, 'accel', 'y', config)).toBe(50);
    });
  });
});
