/**
 * Phase 0 — Phone Simulator Tests
 * Constitution: Section VI — TDD
 * Spec: .specify/specs/00-phone-simulator.md
 * 
 * 🔴 RED phase: Module doesn't exist yet — all tests fail.
 * 🟢 GREEN phase: After implementation, all tests pass.
 */

// This require WILL fail in RED phase (module not yet implemented)
// That's intentional — all tests fail until implementation exists
const {
  parseArgs,
  generateSine,
  generateNoise,
  generateSpikes,
  generateIdle,
  generateMixed,
  patternNames,
  StatsAggregator,
  ReportGenerator,
  VirtualPhone
} = require('../../scripts/simulate-phones');

// ---------------------------------------------------------------------------
// 1. CLI Argument Parser
// ---------------------------------------------------------------------------
describe('CLI Argument Parser', () => {
  test('parses --count flag correctly', () => {
    const args = parseArgs(['--count', '15']);
    expect(args.count).toBe(15);
  });

  test('defaults to 30 phones if no count specified', () => {
    const args = parseArgs([]);
    expect(args.count).toBe(30);
  });

  test('defaults to sine pattern if no pattern specified', () => {
    const args = parseArgs([]);
    expect(args.pattern).toBe('sine');
  });

  test('parses --url flag correctly', () => {
    const args = parseArgs(['--url', 'ws://192.168.1.50:8080']);
    expect(args.url).toBe('ws://192.168.1.50:8080');
  });

  test('defaults to localhost:8080 if no url specified', () => {
    const args = parseArgs([]);
    expect(args.url).toBe('ws://localhost:8080');
  });

  test('parses --duration 60 correctly', () => {
    const args = parseArgs(['--duration', '60']);
    expect(args.duration).toBe(60);
  });

  test('defaults duration to 0 (run forever)', () => {
    const args = parseArgs([]);
    expect(args.duration).toBe(0);
  });

  test('parses --interval flag correctly', () => {
    const args = parseArgs(['--interval', '50']);
    expect(args.interval).toBe(50);
  });

  test('defaults interval to 33ms (~30fps)', () => {
    const args = parseArgs([]);
    expect(args.interval).toBe(33);
  });

  test('parses --disconnect flag as boolean', () => {
    const args = parseArgs(['--disconnect']);
    expect(args.disconnect).toBe(true);
  });

  test('defaults disconnect to false', () => {
    const args = parseArgs([]);
    expect(args.disconnect).toBe(false);
  });

  test('parses --verbose flag as boolean', () => {
    const args = parseArgs(['--verbose']);
    expect(args.verbose).toBe(true);
  });

  test('parses --report flag for file path', () => {
    const args = parseArgs(['--report', './test-report.json']);
    expect(args.report).toBe('./test-report.json');
  });

  test('accepts short flags: -c, -u, -p, -i, -d', () => {
    const args = parseArgs(['-c', '10', '-u', 'ws://test:8080', '-p', 'noise', '-i', '50', '-d', '30']);
    expect(args.count).toBe(10);
    expect(args.url).toBe('ws://test:8080');
    expect(args.pattern).toBe('noise');
    expect(args.interval).toBe(50);
    expect(args.duration).toBe(30);
  });

  test('shows help text with --help flag', () => {
    const args = parseArgs(['--help']);
    expect(args.help).toBe(true);
  });

  test('rejects invalid pattern name', () => {
    expect(() => parseArgs(['--pattern', 'invalid'])).toThrow();
  });

  test('rejects count > 100', () => {
    expect(() => parseArgs(['--count', '200'])).toThrow();
  });

  test('rejects negative count', () => {
    expect(() => parseArgs(['--count', '-5'])).toThrow();
  });

  test('rejects invalid interval (< 10ms)', () => {
    expect(() => parseArgs(['--interval', '5'])).toThrow();
  });

  test('parses --mixed pattern alias correctly', () => {
    const args = parseArgs(['--pattern', 'mixed']);
    expect(args.pattern).toBe('mixed');
  });
});

// ---------------------------------------------------------------------------
// 2. SensorDataGenerator
// ---------------------------------------------------------------------------
describe('SensorDataGenerator', () => {
  // Helper to validate sensor data structure
  function isValidSensorData(data) {
    return (
      data &&
      data.type === 'sensor' &&
      typeof data.accel === 'object' &&
      typeof data.accel.x === 'number' &&
      typeof data.accel.y === 'number' &&
      typeof data.accel.z === 'number' &&
      typeof data.gyro === 'object' &&
      typeof data.gyro.a === 'number' &&
      typeof data.gyro.b === 'number' &&
      typeof data.gyro.g === 'number' &&
      typeof data.orientation === 'object' &&
      typeof data.orientation.a === 'number' &&
      typeof data.orientation.b === 'number' &&
      typeof data.orientation.g === 'number'
    );
  }

  test('generateSine produces valid sensor data format', () => {
    const data = generateSine(0, 1000);
    expect(isValidSensorData(data)).toBe(true);
  });

  test('generateSine produces values within expected ranges', () => {
    const data = generateSine(0, 1000);
    expect(data.accel.x).toBeGreaterThanOrEqual(-6);
    expect(data.accel.x).toBeLessThanOrEqual(6);
    expect(data.accel.y).toBeGreaterThanOrEqual(-6);
    expect(data.accel.y).toBeLessThanOrEqual(6);
    expect(data.accel.z).toBeGreaterThanOrEqual(5);
    expect(data.accel.z).toBeLessThanOrEqual(14);
    expect(data.gyro.a).toBeGreaterThanOrEqual(-100);
    expect(data.gyro.a).toBeLessThanOrEqual(100);
    expect(data.gyro.b).toBeGreaterThanOrEqual(-50);
    expect(data.gyro.b).toBeLessThanOrEqual(50);
    expect(data.gyro.g).toBeGreaterThanOrEqual(-200);
    expect(data.gyro.g).toBeLessThanOrEqual(200);
  });

  test('generateSine produces different values for different slots/times', () => {
    const data1 = generateSine(0, 0);
    const data2 = generateSine(1, 5000);
    const allSame = (
      data1.accel.x === data2.accel.x &&
      data1.gyro.a === data2.gyro.a
    );
    expect(allSame).toBe(false);
  });

  test('generateNoise produces valid sensor data format', () => {
    const data = generateNoise();
    expect(isValidSensorData(data)).toBe(true);
  });

  test('generateNoise produces data within expected ranges', () => {
    const data = generateNoise();
    expect(data.accel.x).toBeGreaterThanOrEqual(-10);
    expect(data.accel.x).toBeLessThanOrEqual(10);
    expect(data.gyro.a).toBeGreaterThanOrEqual(-200);
    expect(data.gyro.a).toBeLessThanOrEqual(200);
    expect(data.orientation.a).toBeGreaterThanOrEqual(0);
    expect(data.orientation.a).toBeLessThanOrEqual(360);
  });

  test('generateSpikes produces valid sensor data format', () => {
    const data = generateSpikes(0, 1000);
    expect(isValidSensorData(data)).toBe(true);
  });

  test('generateSpikes produces high magnitude accel.z on spike intervals', () => {
    let foundSpike = false;
    for (let t = 0; t < 10000; t += 33) {
      const data = generateSpikes(0, t);
      if (data.accel.z > 14) {
        foundSpike = true;
        break;
      }
    }
    expect(foundSpike).toBe(true);
  });

  test('generateIdle produces valid sensor data format', () => {
    const data = generateIdle();
    expect(isValidSensorData(data)).toBe(true);
  });

  test('generateIdle produces minimal movement data', () => {
    const data = generateIdle();
    expect(Math.abs(data.accel.x)).toBeLessThan(0.1);
    expect(Math.abs(data.accel.y)).toBeLessThan(0.1);
    expect(Math.abs(data.accel.z - 9.81)).toBeLessThan(0.1);
    expect(Math.abs(data.gyro.a)).toBeLessThan(0.1);
    expect(Math.abs(data.gyro.b)).toBeLessThan(0.1);
    expect(Math.abs(data.gyro.g)).toBeLessThan(0.1);
  });

  test('generateMixed returns different patterns for different slots', () => {
    const patterns = new Set();
    for (let slot = 0; slot < 30; slot++) {
      const data = generateMixed(slot, 0);
      patterns.add(data._patternName || 'unknown');
    }
    // With 30 slots and 4 patterns, we should see at least 2 different patterns
    expect(patterns.size).toBeGreaterThanOrEqual(2);
  });

  test('all generators produce objects with type: "sensor"', () => {
    const generators = [generateSine(0, 0), generateNoise(), generateSpikes(0, 0), generateIdle()];
    generators.forEach(d => expect(d.type).toBe('sensor'));
  });
});

// ---------------------------------------------------------------------------
// 3. VirtualPhone
// ---------------------------------------------------------------------------
describe('VirtualPhone', () => {
  test('VirtualPhone is a class/constructor function', () => {
    expect(typeof VirtualPhone).toBe('function');
    // Verify it can be instantiated
    const phone = new VirtualPhone('ws://localhost:8080', 0, 'sine', 33);
    expect(phone).toBeInstanceOf(VirtualPhone);
  });

  test('VirtualPhone stores constructor params', () => {
    const phone = new VirtualPhone('ws://test:8080', 5, 'noise', 50);
    expect(phone.wsUrl).toBe('ws://test:8080');
    expect(phone.slot).toBe(5);
    expect(phone.pattern).toBe('noise');
    expect(phone.interval).toBe(50);
  });

  test('VirtualPhone has connect method', () => {
    const phone = new VirtualPhone('ws://localhost:8080', 0, 'sine', 33);
    expect(typeof phone.connect).toBe('function');
  });

  test('VirtualPhone has start method', () => {
    const phone = new VirtualPhone('ws://localhost:8080', 0, 'sine', 33);
    expect(typeof phone.start).toBe('function');
  });

  test('VirtualPhone has stop method', () => {
    const phone = new VirtualPhone('ws://localhost:8080', 0, 'sine', 33);
    expect(typeof phone.stop).toBe('function');
  });

  test('VirtualPhone has disconnect method', () => {
    const phone = new VirtualPhone('ws://localhost:8080', 0, 'sine', 33);
    expect(typeof phone.disconnect).toBe('function');
  });

  test('VirtualPhone tracks connection state', () => {
    const phone = new VirtualPhone('ws://localhost:8080', 0, 'sine', 33);
    expect(phone.state).toBe('idle');
  });
});

// ---------------------------------------------------------------------------
// 4. StatsAggregator
// ---------------------------------------------------------------------------
describe('StatsAggregator', () => {
  test('StatsAggregator is a class/constructor function', () => {
    expect(typeof StatsAggregator).toBe('function');
  });

  test('tracks total messages sent', () => {
    const stats = new StatsAggregator();
    stats.trackMessage(0, 2.5);
    stats.trackMessage(0, 3.1);
    stats.trackMessage(1, 1.8);
    expect(stats.getTotalMessages()).toBe(3);
  });

  test('calculates average latency correctly', () => {
    const stats = new StatsAggregator();
    stats.trackMessage(0, 2.0);
    stats.trackMessage(0, 4.0);
    stats.trackMessage(0, 6.0);
    expect(stats.getAverageLatency()).toBeCloseTo(4.0, 1);
  });

  test('reports max latency', () => {
    const stats = new StatsAggregator();
    stats.trackMessage(0, 2.0);
    stats.trackMessage(0, 8.5);
    stats.trackMessage(0, 3.0);
    expect(stats.getMaxLatency()).toBeCloseTo(8.5, 1);
  });

  test('reports min latency', () => {
    const stats = new StatsAggregator();
    stats.trackMessage(0, 2.0);
    stats.trackMessage(0, 0.5);
    stats.trackMessage(0, 3.0);
    expect(stats.getMinLatency()).toBeCloseTo(0.5, 1);
  });

  test('tracks per-phone metrics', () => {
    const stats = new StatsAggregator();
    stats.trackMessage(0, 2.0);
    stats.trackMessage(0, 4.0);
    stats.trackMessage(1, 1.5);
    const perPhone = stats.getPerPhone();
    expect(perPhone[0]).toBeDefined();
    expect(perPhone[0].messagesSent).toBe(2);
    expect(perPhone[1].messagesSent).toBe(1);
  });

  test('tracks connection events', () => {
    const stats = new StatsAggregator();
    stats.trackConnection(0, 'connected');
    stats.trackConnection(0, 'disconnected');
    stats.trackConnection(0, 'reconnected');
    const events = stats.getConnectionEvents();
    expect(events).toHaveLength(3);
  });

  test('getSummary returns all key metrics', () => {
    const stats = new StatsAggregator();
    stats.trackMessage(0, 1.0);
    stats.trackMessage(1, 2.0);
    stats.trackConnection(0, 'connected');
    const summary = stats.getSummary();
    expect(summary).toHaveProperty('totalMessages');
    expect(summary).toHaveProperty('averageLatency');
    expect(summary).toHaveProperty('maxLatency');
    expect(summary).toHaveProperty('minLatency');
    expect(summary).toHaveProperty('connectionEvents');
    expect(summary).toHaveProperty('perPhone');
  });

  test('returns zero values when no messages tracked', () => {
    const stats = new StatsAggregator();
    expect(stats.getTotalMessages()).toBe(0);
    expect(stats.getAverageLatency()).toBe(0);
    expect(stats.getMaxLatency()).toBe(0);
    expect(stats.getMinLatency()).toBe(0);
  });

  test('tracks throughput per second', () => {
    const stats = new StatsAggregator();
    stats.trackMessage(0, 1.0);
    stats.trackMessage(0, 2.0);
    const throughput = stats.getThroughputPerSecond();
    expect(Array.isArray(throughput)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. ReportGenerator
// ---------------------------------------------------------------------------
describe('ReportGenerator', () => {
  test('ReportGenerator is a class/constructor function', () => {
    expect(typeof ReportGenerator).toBe('function');
  });

  test('generates JSON report with correct structure', () => {
    const stats = new StatsAggregator();
    stats.trackMessage(0, 1.0);
    stats.trackMessage(1, 2.0);
    stats.trackConnection(0, 'connected');

    const report = new ReportGenerator({
      count: 2,
      url: 'ws://localhost:8080',
      pattern: 'sine',
      interval: 33,
      duration: 10
    }, stats);

    const json = report.generate();
    expect(json).toHaveProperty('testConfig');
    expect(json).toHaveProperty('results');
    expect(json.testConfig.count).toBe(2);
    expect(json.testConfig.url).toBe('ws://localhost:8080');
    expect(json.testConfig.pattern).toBe('sine');
    expect(json.results).toHaveProperty('totalMessagesSent');
    expect(json.results).toHaveProperty('averageLatencyMs');
    expect(json.results).toHaveProperty('maxLatencyMs');
    expect(json.results).toHaveProperty('minLatencyMs');
    expect(json.results).toHaveProperty('perPhone');
  });
});
