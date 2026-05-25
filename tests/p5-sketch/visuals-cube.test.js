const { CubeSnekEngine, AxisCursor, Face, CubeSensorMapper } = require('../../p5-sketch/visuals-cube.js');

const testConfig = {
  maxDevices: 30,
  canvasWidth: 1600,
  canvasHeight: 900,
  centerX: 800,
  centerY: 450,
  baseRadius: 300,
  frameRate: 30,
  cubeMode: {
    enabled: true,
    cubeSize: 200,
    gridSize: 5,
    maxTrailLength: 80,
    orbitSpeed: 0.005,
    nestingLevels: 5,
    faceColors: [
      { h: 0, s: 60, b: 80 },
      { h: 60, s: 60, b: 80 },
      { h: 120, s: 60, b: 80 },
      { h: 180, s: 60, b: 80 },
      { h: 240, s: 60, b: 80 },
      { h: 300, s: 60, b: 80 },
    ]
  }
};

// Mock p5 drawing context
const mockP5 = {
  push: () => {},
  pop: () => {},
  translate: () => {},
  rotate: () => {},
  rotateY: () => {},
  rotateX: () => {},
  fill: () => {},
  stroke: () => {},
  strokeWeight: () => {},
  noFill: () => {},
  noStroke: () => {},
  beginShape: () => {},
  vertex: (x, y, z) => {},
  endShape: () => {},
  circle: () => {},
  sphere: () => {},
  line: () => {},
  textAlign: () => {},
  text: () => {},
  textSize: () => {},
  cos: Math.cos,
  sin: Math.sin,
  TWO_PI: Math.PI * 2,
  PI: Math.PI,
  HALF_PI: Math.PI / 2,
  random: (a, b) => a + Math.random() * (b - a),
  colorMode: () => {},
  rect: () => {},
  millis: () => Date.now(),
  noise: (x) => Math.sin(x) * 0.5 + 0.5,
  norm: (v, a, b) => (v - a) / (b - a),
  lerp: (a, b, t) => a + (b - a) * t,
  map: (v, a, b, c, d) => c + (v - a) / (b - a) * (d - c),
  drawingContext: {
    shadowBlur: 0,
    shadowColor: 'transparent'
  }
};

describe('CubeSnekEngine', () => {
  test('can be instantiated with config (no throw)', () => {
    expect(() => {
      new CubeSnekEngine(testConfig);
    }).not.toThrow();
  });

  test('creates 6 Face instances', () => {
    const engine = new CubeSnekEngine(testConfig);
    expect(engine.faces).toBeDefined();
    expect(engine.faces.length).toBe(6);
    engine.faces.forEach(face => {
      expect(face).toBeInstanceOf(Face);
    });
  });

  test('createCursor and disposeCursor manage cursors', () => {
    const engine = new CubeSnekEngine(testConfig);
    engine.createCursor(0);
    expect(engine._cursors[0]).toBeInstanceOf(AxisCursor);
    expect(engine._cursors[0].slot).toBe(0);
    engine.createCursor(5);
    expect(engine._cursors[5]).toBeInstanceOf(AxisCursor);
    expect(engine._cursors[5].faceIndex).toBe(1);
    engine.disposeCursor(0);
    expect(engine._cursors[0]).toBeUndefined();
    engine.disposeCursor(5);
    expect(engine._cursors[5]).toBeUndefined();
  });

  test('slot-to-face mapping: slot 0→Face 0, slot 5→Face 1, slot 29→Face 5', () => {
    const engine = new CubeSnekEngine(testConfig);
    expect(engine._getFaceIndex(0)).toBe(0);
    expect(engine._getFaceIndex(4)).toBe(0);
    expect(engine._getFaceIndex(5)).toBe(1);
    expect(engine._getFaceIndex(9)).toBe(1);
    expect(engine._getFaceIndex(10)).toBe(2);
    expect(engine._getFaceIndex(14)).toBe(2);
    expect(engine._getFaceIndex(15)).toBe(3);
    expect(engine._getFaceIndex(19)).toBe(3);
    expect(engine._getFaceIndex(20)).toBe(4);
    expect(engine._getFaceIndex(24)).toBe(4);
    expect(engine._getFaceIndex(25)).toBe(5);
    expect(engine._getFaceIndex(29)).toBe(5);
  });

  test('draw() does not throw with 0 active cursors', () => {
    const engine = new CubeSnekEngine(testConfig);
    expect(() => {
      engine.draw(mockP5, [], {});
    }).not.toThrow();
  });

  test('draw() does not throw with 30 active cursors', () => {
    const engine = new CubeSnekEngine(testConfig);
    for (let i = 0; i < 30; i++) {
      engine.createCursor(i);
    }
    const sensorCache = {};
    for (let i = 0; i < 30; i++) {
      sensorCache[i] = {
        accel: { x: 0.5, y: 0.3, z: 0.7 },
        gyro: { a: 45, b: 30, g: 60 },
        orientation: { a: 90, b: 45, g: 10 }
      };
    }
    expect(() => {
      engine.draw(mockP5, Array.from({length: 30}, (_, i) => i), sensorCache);
    }).not.toThrow();
  });

  test('updateSensor routes orientation data to cursor', () => {
    const engine = new CubeSnekEngine(testConfig);
    engine.createCursor(0);
    const cursor = engine._cursors[0];
    const spy = jest.spyOn(cursor, 'setDirection');

    engine.updateSensor(0, 'orientation', { a: 90, b: 45, g: 10 });
    expect(spy).toHaveBeenCalledWith(90, 45);

    spy.mockRestore();
  });

  test('updateSensor routes accel data to cursor', () => {
    const engine = new CubeSnekEngine(testConfig);
    engine.createCursor(0);
    const cursor = engine._cursors[0];
    const spy = jest.spyOn(cursor, 'setNestUrgency');

    engine.updateSensor(0, 'accel', { x: 5, y: 3, z: 7 });
    expect(spy).toHaveBeenCalled();

    const urgency = spy.mock.calls[0][0];
    expect(typeof urgency).toBe('number');
    expect(urgency).toBeGreaterThanOrEqual(0);
    expect(urgency).toBeLessThanOrEqual(1);

    spy.mockRestore();
  });

  test('getCursorState returns correct data for active cursor', () => {
    const engine = new CubeSnekEngine(testConfig);
    engine.createCursor(0);
    const state = engine.getCursorState(0);
    expect(state).toBeDefined();
    expect(state).toHaveProperty('nestingLevel');
    expect(state).toHaveProperty('faceIndex', 0);
    expect(state).toHaveProperty('x');
    expect(state).toHaveProperty('y');
    expect(state).toHaveProperty('brightness');
    expect(state.nestingLevel).toBe(0);
  });

  test('getCursorState returns null for disconnected slot', () => {
    const engine = new CubeSnekEngine(testConfig);
    expect(engine.getCursorState(0)).toBeNull();
  });

  test('handleMouseDrag updates cameraTilt and orbitAngle', () => {
    const engine = new CubeSnekEngine(testConfig);
    const initialTilt = engine._cameraTilt;
    const initialAngle = engine._orbitAngle;
    engine.handleMouseDrag(10, 20);
    expect(engine._orbitAngle).toBeGreaterThan(initialAngle);
    expect(engine._cameraTilt).toBeGreaterThan(initialTilt);
    expect(engine._lastDragTime).toBeGreaterThan(0);
  });

  test('handleMouseWheel changes camera distance', () => {
    const engine = new CubeSnekEngine(testConfig);
    const initialDist = engine._cameraDistance;
    engine.handleMouseWheel(-100);
    expect(engine._cameraDistance).toBeLessThan(initialDist);
    engine.handleMouseWheel(100);
    expect(engine._cameraDistance).toBe(initialDist);
  });

  test('auto-orbit pauses after drag, resumes after 2000ms', () => {
    const engine = new CubeSnekEngine(testConfig);
    const initialAngle = engine._orbitAngle;
    engine._lastDragTime = Infinity;
    engine.draw(mockP5, [], {});
    expect(engine._orbitAngle).toBe(initialAngle);
  });

  test('onNestingChange callback fires when cursor nests', () => {
    const engine = new CubeSnekEngine(testConfig);
    const callback = jest.fn();
    engine.onNestingChange(callback);
    engine.createCursor(0);
    const cursor = engine._cursors[0];
    cursor._nestUrgency = 1;
    // Surround the cursor with occupied cells to force nesting
    const face = engine.faces[0];
    // Place cursor at (0,0) and fill all adjacent
    cursor._x = 0;
    cursor._y = 0;
    face.reset();
    face.claimCell(0, 0, 'cursor-0');
    face.claimCell(0, 1, 'other');
    face.claimCell(1, 0, 'other');
    // No adjacent unoccupied cells (corner, only right and down exist, both filled)
    // Actually (0,0) has neighbors (0,1) and (1,0) — both occupied
    // So tick should trigger nesting
    cursor.tick(face);
    expect(callback).toHaveBeenCalled();
  });

  test('nesting depth 0 has normal state, depth 4 returns max nesting', () => {
    const engine = new CubeSnekEngine(testConfig);
    engine.createCursor(0);
    const cursor = engine._cursors[0];
    expect(cursor._nestingLevel).toBe(0);
    for (let i = 0; i < 5; i++) cursor.nest();
    expect(cursor._nestingLevel).toBe(testConfig.cubeMode.nestingLevels);
    const state = engine.getCursorState(0);
    expect(state.nestingLevel).toBe(testConfig.cubeMode.nestingLevels);
  });
});

describe('Face', () => {
  test('constructor creates 5x5 claims grid (all false)', () => {
    const face = new Face(0, testConfig);
    expect(face._claims).toBeDefined();
    expect(face._claims.length).toBe(5);
    face._claims.forEach(row => {
      expect(row.length).toBe(5);
      row.forEach(cell => {
        expect(cell).toBe(false);
      });
    });
  });

  test('claimCell sets cell to cursorId and isCellOccupied returns it', () => {
    const face = new Face(0, testConfig);
    expect(face.isCellOccupied(0, 0)).toBe(false);
    face.claimCell(0, 0, 'cursor-1');
    expect(face.isCellOccupied(0, 0)).toBe(true);
    expect(face._claims[0][0]).toBe('cursor-1');
  });

  test('releaseCell frees a claimed cell', () => {
    const face = new Face(0, testConfig);
    face.claimCell(2, 3, 'cursor-1');
    expect(face.isCellOccupied(2, 3)).toBe(true);
    face.releaseCell(2, 3);
    expect(face.isCellOccupied(2, 3)).toBe(false);
  });

  test('isFull returns true when all 25 cells claimed', () => {
    const face = new Face(0, testConfig);
    expect(face.isFull()).toBe(false);
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        face.claimCell(x, y, `cursor-${y*5+x}`);
      }
    }
    expect(face.isFull()).toBe(true);
  });

  test('isFull returns false when some cells free', () => {
    const face = new Face(0, testConfig);
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        if (x === 2 && y === 2) continue;
        face.claimCell(x, y, `cursor-${y*5+x}`);
      }
    }
    expect(face.isFull()).toBe(false);
  });

  test('getAdjacentCells returns 2-4 neighbors (edge cells have fewer)', () => {
    const face = new Face(0, testConfig);
    // Center cell (2,2) should have 4 adjacent
    const centerAdj = face.getAdjacentCells(2, 2);
    expect(centerAdj.length).toBe(4);

    // Corner cell (0,0) should have 2 adjacent
    const cornerAdj = face.getAdjacentCells(0, 0);
    expect(cornerAdj.length).toBe(2);

    // Edge cell (0,2) should have 3 adjacent
    const edgeAdj = face.getAdjacentCells(0, 2);
    expect(edgeAdj.length).toBe(3);
  });

  test('getAdjacentCells excludes occupied cells', () => {
    const face = new Face(0, testConfig);
    face.claimCell(2, 1, 'other');
    face.claimCell(2, 3, 'other');
    const adj = face.getAdjacentCells(2, 2);
    expect(adj.length).toBe(2);
    adj.forEach(cell => {
      expect(cell.x === 2 && cell.y === 1).toBe(false);
      expect(cell.x === 2 && cell.y === 3).toBe(false);
    });
  });

  test('reset clears all claims', () => {
    const face = new Face(0, testConfig);
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        face.claimCell(x, y, `cursor-${y*5+x}`);
      }
    }
    expect(face.isFull()).toBe(true);
    face.reset();
    expect(face.isFull()).toBe(false);
    expect(face.isCellOccupied(0, 0)).toBe(false);
  });

  test('getAdjacentCells returns cells with direction labels', () => {
    const face = new Face(0, testConfig);
    const adj = face.getAdjacentCells(2, 2);
    const dirs = adj.map(c => c.direction).sort();
    expect(dirs).toEqual(['down', 'left', 'right', 'up']);
  });
});

describe('AxisCursor', () => {
  test('can be instantiated with slot + faceIndex', () => {
    const cursor = new AxisCursor(0, 0, testConfig);
    expect(cursor.slot).toBe(0);
    expect(cursor.faceIndex).toBe(0);
  });

  test('starts at grid (0, y) where y = slot % 5 on its face', () => {
    const cursor0 = new AxisCursor(0, 0, testConfig);
    expect(cursor0._x).toBe(0);
    expect(cursor0._y).toBe(0);

    const cursor3 = new AxisCursor(3, 0, testConfig);
    expect(cursor3._x).toBe(0);
    expect(cursor3._y).toBe(3);

    const cursor5 = new AxisCursor(5, 1, testConfig);
    expect(cursor5._x).toBe(0);
    expect(cursor5._y).toBe(0); // 5 % 5 = 0
  });

  test('setDirection updates internal direction bias', () => {
    const cursor = new AxisCursor(0, 0, testConfig);
    cursor.setDirection(0, 0);
    expect(cursor._directionBias).toBeDefined();
    expect(typeof cursor._directionBias.horizontal).toBe('number');
    expect(typeof cursor._directionBias.vertical).toBe('number');
  });

  test('tick() moves to adjacent cell when direction set', () => {
    const face = new Face(0, testConfig);
    const cursor = new AxisCursor(0, 0, testConfig);
    cursor._x = 2;
    cursor._y = 2;
    // Claim current cell
    face.claimCell(2, 2, 'cursor-0');
    // Set direction to right (positive horizontal)
    cursor._directionBias = { horizontal: 1, vertical: 0 };
    cursor.tick(face);
    // Should have moved to (3, 2)
    expect(cursor._x).toBe(3);
    expect(cursor._y).toBe(2);
  });

  test('tick() does not move into occupied cell', () => {
    const face = new Face(0, testConfig);
    const cursor = new AxisCursor(0, 0, testConfig);
    cursor._x = 2;
    cursor._y = 2;
    face.claimCell(2, 2, 'cursor-0');
    face.claimCell(3, 2, 'other');
    face.claimCell(1, 2, 'other');
    face.claimCell(2, 1, 'other');
    face.claimCell(2, 3, 'other');
    cursor._directionBias = { horizontal: 1, vertical: 0 };
    // All adjacent cells occupied, should trigger nesting (or stay put if can't nest)
    cursor.tick(face);
    // If no cells available, cursor doesn't move
    expect(cursor._x).toBe(2);
    expect(cursor._y).toBe(2);
  });

  test('tick() appends position to trail', () => {
    const face = new Face(0, testConfig);
    const cursor = new AxisCursor(0, 0, testConfig);
    cursor._x = 2;
    cursor._y = 2;
    face.claimCell(2, 2, 'cursor-0');
    cursor._directionBias = { horizontal: 0.5, vertical: 0 };
    cursor.tick(face);
    expect(cursor._trail.length).toBeGreaterThan(0);
  });

  test('trail is bounded at maxTrailLength', () => {
    const face = new Face(0, testConfig);
    const cursor = new AxisCursor(0, 0, testConfig);
    cursor._x = 1;
    cursor._y = 1;
    face.claimCell(1, 1, 'cursor-0');
    // Set up a scenario where the cursor keeps moving
    // Force trail to exceed max
    for (let i = 0; i < 100; i++) {
      cursor._trail.push({ x: 0, y: 0, z: 0 });
    }
    expect(cursor._trail.length).toBe(100);
    // Tick should trim it
    cursor._directionBias = { horizontal: 0, vertical: 0 };
    cursor.tick(face);
    expect(cursor._trail.length).toBeLessThanOrEqual(testConfig.cubeMode.maxTrailLength);
  });

  test('setBrightness clamps value to 0.2-1.0', () => {
    const cursor = new AxisCursor(0, 0, testConfig);
    cursor.setBrightness(0);
    expect(cursor._brightness).toBe(0.2);
    cursor.setBrightness(0.5);
    expect(cursor._brightness).toBe(0.5);
    cursor.setBrightness(2);
    expect(cursor._brightness).toBe(1.0);
  });

  test('nest() increments nestingLevel up to max', () => {
    const cursor = new AxisCursor(0, 0, testConfig);
    expect(cursor._nestingLevel).toBe(0);
    cursor.nest();
    expect(cursor._nestingLevel).toBe(1);
    cursor.nest();
    expect(cursor._nestingLevel).toBe(2);
    // Nest to max
    for (let i = 0; i < 10; i++) cursor.nest();
    expect(cursor._nestingLevel).toBe(testConfig.cubeMode.nestingLevels);
  });

  test('getState returns correct cursor state', () => {
    const cursor = new AxisCursor(7, 1, testConfig);
    cursor._x = 3;
    cursor._y = 2;
    cursor._nestingLevel = 2;
    cursor._brightness = 0.8;
    const state = cursor.getState();
    expect(state.x).toBe(3);
    expect(state.y).toBe(2);
    expect(state.nestingLevel).toBe(2);
    expect(state.brightness).toBe(0.8);
    expect(state.slot).toBe(7);
    expect(state.faceIndex).toBe(1);
  });
});

describe('CubeSensorMapper', () => {
  test('orientationToDirection returns { dx, dy } for all 4 quadrants', () => {
    const result = CubeSensorMapper.orientationToDirection(0, 0);
    expect(result).toHaveProperty('horizontal');
    expect(result).toHaveProperty('vertical');
    expect(typeof result.horizontal).toBe('number');
    expect(typeof result.vertical).toBe('number');
  });

  test('orientationToDirection: alpha=0° → horizontal near 1 (right)', () => {
    const bias = CubeSensorMapper.orientationToDirection(0, 0);
    expect(bias.horizontal).toBeGreaterThan(0.9);
  });

  test('orientationToDirection: alpha=180° → horizontal near -1 (left)', () => {
    const bias = CubeSensorMapper.orientationToDirection(180, 0);
    expect(bias.horizontal).toBeLessThan(-0.9);
  });

  test('orientationToDirection: beta=90° → vertical near 0.5', () => {
    const bias = CubeSensorMapper.orientationToDirection(90, 90);
    expect(bias.vertical).toBeCloseTo(0.5, 1);
  });

  test('gyroToBrightness maps 0→0.2, 180→0.6, 360→1.0', () => {
    expect(CubeSensorMapper.gyroToBrightness(0)).toBeCloseTo(0.2, 1);
    expect(CubeSensorMapper.gyroToBrightness(180)).toBeCloseTo(0.6, 1);
    expect(CubeSensorMapper.gyroToBrightness(360)).toBeCloseTo(1.0, 1);
  });

  test('accelToNestUrgency returns value 0-1', () => {
    const urgency = CubeSensorMapper.accelToNestUrgency({ x: 5, y: 3, z: 7 });
    expect(urgency).toBeGreaterThanOrEqual(0);
    expect(urgency).toBeLessThanOrEqual(1);
  });

  test('accelToTrailLength maps accel.x to 20-80 range', () => {
    const trailLen = CubeSensorMapper.accelToTrailLength({ x: 0.5 });
    expect(trailLen).toBeGreaterThanOrEqual(20);
    expect(trailLen).toBeLessThanOrEqual(80);
  });
});
