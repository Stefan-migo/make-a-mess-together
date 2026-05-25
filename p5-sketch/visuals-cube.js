(function(global) {

  class Face {
    constructor(faceIndex, config) {
      this._index = faceIndex;
      this._config = config;
      const gridSize = config.cubeMode ? config.cubeMode.gridSize : 5;
      this._claims = [];
      for (let y = 0; y < gridSize; y++) {
        this._claims[y] = [];
        for (let x = 0; x < gridSize; x++) {
          this._claims[y][x] = false;
        }
      }
    }

    get claimsGrid() {
      return this._claims;
    }

    isCellOccupied(x, y) {
      if (y < 0 || y >= this._claims.length) return true;
      if (x < 0 || x >= this._claims[y].length) return true;
      return !!this._claims[y][x];
    }

    claimCell(x, y, cursorId) {
      if (y < 0 || y >= this._claims.length) return;
      if (x < 0 || x >= this._claims[y].length) return;
      this._claims[y][x] = cursorId;
    }

    releaseCell(x, y) {
      if (y < 0 || y >= this._claims.length) return;
      if (x < 0 || x >= this._claims[y].length) return;
      this._claims[y][x] = false;
    }

    isFull() {
      for (let y = 0; y < this._claims.length; y++) {
        for (let x = 0; x < this._claims[y].length; x++) {
          if (!this._claims[y][x]) return false;
        }
      }
      return true;
    }

    getAdjacentCells(x, y) {
      const neighbors = [
        { x: x, y: y - 1, direction: 'up' },
        { x: x, y: y + 1, direction: 'down' },
        { x: x - 1, y: y, direction: 'left' },
        { x: x + 1, y: y, direction: 'right' }
      ];
      const gridSize = this._claims.length;
      return neighbors.filter(c =>
        c.x >= 0 && c.x < gridSize &&
        c.y >= 0 && c.y < gridSize &&
        !this.isCellOccupied(c.x, c.y)
      );
    }

    reset() {
      for (let y = 0; y < this._claims.length; y++) {
        for (let x = 0; x < this._claims[y].length; x++) {
          this._claims[y][x] = false;
        }
      }
    }
  }

  class AxisCursor {
    constructor(slot, faceIndex, config) {
      this.slot = slot;
      this.faceIndex = faceIndex;
      this._config = config;
      this._x = 0;
      this._y = slot % 5;
      this._trail = [];
      this._directionBias = { horizontal: 0, vertical: 0 };
      this._nestUrgency = 0;
      this._brightness = 0.6;
      this._nestingLevel = 0;
    }

    setDirection(alpha, beta) {
      const horiz = Math.cos(alpha * Math.PI / 180);
      const vert = beta / 180;
      this._directionBias = {
        horizontal: Math.max(-1, Math.min(1, horiz)),
        vertical: Math.max(-1, Math.min(1, vert))
      };
    }

    setNestUrgency(value) {
      this._nestUrgency = Math.max(0, Math.min(1, value));
    }

    setBrightness(value) {
      this._brightness = Math.max(0.2, Math.min(1.0, value));
    }

    nest() {
      const maxNesting = this._config.cubeMode ? this._config.cubeMode.nestingLevels : 5;
      if (this._nestingLevel >= maxNesting) return false;
      this._nestingLevel++;
      this._x = 0;
      this._y = this.slot % 5;
      this._trail.push({ x: this._x, y: this._y, z: this._nestingLevel });
      if (this._onNest) {
        this._onNest(this.slot, this._nestingLevel);
      }
      return true;
    }

    tick(face) {
      const adjacent = face.getAdjacentCells(this._x, this._y);
      if (adjacent.length === 0) {
        if (this._nestUrgency > 0.5) {
          this.nest();
        }
        return;
      }

      const best = adjacent.reduce((best, cell) => {
        const dx = cell.x - this._x;
        const dy = cell.y - this._y;
        const score = dx * this._directionBias.horizontal + dy * this._directionBias.vertical;
        return score > best.score ? { cell, score } : best;
      }, { cell: adjacent[0], score: -Infinity });

      const oldX = this._x;
      const oldY = this._y;
      this._x = best.cell.x;
      this._y = best.cell.y;

      face.releaseCell(oldX, oldY);
      face.claimCell(this._x, this._y, `cursor-${this.slot}`);

      const cubeSize = this._config.cubeMode ? this._config.cubeMode.cubeSize : 200;
      const zOffset = this._nestingLevel * (cubeSize / 10);
      this._trail.push({ x: this._x, y: this._y, z: zOffset });

      const maxTrail = this._config.cubeMode ? this._config.cubeMode.maxTrailLength : 80;
      while (this._trail.length > maxTrail) {
        this._trail.shift();
      }
    }

    draw(p, offset) {
      if (this._trail.length === 0) return;

      p.push();

      const cubeSize = this._config.cubeMode ? this._config.cubeMode.cubeSize : 200;
      const halfSize = cubeSize / 2;
      const gridSize = this._config.cubeMode ? this._config.cubeMode.gridSize : 5;

      p.stroke(255 * this._brightness);
      p.strokeWeight(2);
      p.noFill();

      p.beginShape(p.LINES);
      for (let i = 1; i < this._trail.length; i++) {
        const prev = this._trail[i - 1];
        const curr = this._trail[i];
        const x1 = (prev.x / (gridSize - 1)) * cubeSize - halfSize;
        const y1 = (prev.y / (gridSize - 1)) * cubeSize - halfSize;
        const x2 = (curr.x / (gridSize - 1)) * cubeSize - halfSize;
        const y2 = (curr.y / (gridSize - 1)) * cubeSize - halfSize;
        const z1 = prev.z || 0;
        const z2 = curr.z || 0;
        p.vertex(x1, y1, z1);
        p.vertex(x2, y2, z2);
      }
      p.endShape();

      const head = this._trail[this._trail.length - 1];
      const hx = (head.x / (gridSize - 1)) * cubeSize - halfSize;
      const hy = (head.y / (gridSize - 1)) * cubeSize - halfSize;
      const hz = head.z || 0;

      p.fill(255 * this._brightness);
      p.noStroke();
      p.translate(hx, hy, hz);
      p.sphere(4);
      p.translate(-hx, -hy, -hz);

      p.pop();
    }

    getState() {
      return {
        slot: this.slot,
        faceIndex: this.faceIndex,
        x: this._x,
        y: this._y,
        gridX: this._x,
        gridY: this._y,
        nestingLevel: this._nestingLevel,
        brightness: this._brightness
      };
    }

    dispose() {
      this._trail.length = 0;
    }
  }

  class CubeSnekEngine {
    constructor(config) {
      this._config = config;
      this.faces = [];
      this._cursors = {};
      this._orbitAngle = 0;
      this._cameraTilt = 0.3;
      this._cameraDistance = config.cubeMode ? config.cubeMode.cubeSize * 3.5 : 700;
      this._lastDragTime = 0;

      const numFaces = 6;
      for (let i = 0; i < numFaces; i++) {
        this.faces.push(new Face(i, config));
      }
    }

    _getFaceIndex(slot) {
      return Math.floor(slot / 5);
    }

    createCursor(slot) {
      const faceIndex = this._getFaceIndex(slot);
      const cursor = new AxisCursor(slot, faceIndex, this._config);
      this._cursors[slot] = cursor;

      cursor._onNest = (s, level) => {
        if (this._onNestingChange) {
          this._onNestingChange(s, level);
        }
      };

      const face = this.faces[faceIndex];
      face.claimCell(cursor._x, cursor._y, `cursor-${slot}`);
      const cubeSize = this._config.cubeMode ? this._config.cubeMode.cubeSize : 200;
      cursor._trail.push({ x: cursor._x, y: cursor._y, z: 0 });

      return cursor;
    }

    disposeCursor(slot) {
      const cursor = this._cursors[slot];
      if (cursor) {
        const face = this.faces[cursor.faceIndex];
        face.releaseCell(cursor._x, cursor._y);
        cursor.dispose();
        delete this._cursors[slot];
      }
    }

    updateSensor(slot, type, data) {
      const cursor = this._cursors[slot];
      if (!cursor) return;

      switch (type) {
        case 'orientation':
          cursor.setDirection(data.a, data.b);
          break;
        case 'accel':
          cursor.setNestUrgency(CubeSensorMapper.accelToNestUrgency(data));
          break;
        case 'gyro':
          cursor.setBrightness(CubeSensorMapper.gyroToBrightness(data.beta || data.b || data.g || 0));
          break;
      }
    }

    getCursorState(slot) {
      const cursor = this._cursors[slot];
      if (!cursor) return null;
      return cursor.getState();
    }

    handleMouseDrag(dx, dy) {
      this._cameraTilt += dy * 0.01;
      this._cameraTilt = Math.max(-1.5, Math.min(1.5, this._cameraTilt));
      this._orbitAngle += dx * 0.01;
      this._lastDragTime = typeof millis !== 'undefined' ? millis() : Date.now();
    }

    handleMouseWheel(delta) {
      this._cameraDistance += delta * 0.5;
      this._cameraDistance = Math.max(100, Math.min(2000, this._cameraDistance));
    }

    draw(p, activeSlots, sensorCache) {
      const cubeSize = this._config.cubeMode ? this._config.cubeMode.cubeSize : 200;
      const halfSize = cubeSize / 2;

      p.push();

      // WEBGL buffer centers at (0,0) — no translate needed

      const now = typeof millis !== 'undefined' ? millis() : Date.now();
      if (now - this._lastDragTime > 2000) {
        this._orbitAngle += this._config.cubeMode ? this._config.cubeMode.orbitSpeed : 0.005;
      }
      p.rotateY(this._orbitAngle);
      p.rotateX(this._cameraTilt);

      for (let fi = 0; fi < this.faces.length; fi++) {
        p.push();
        this._orientFace(p, fi);

        const color = this._config.cubeMode.faceColors[fi];
        p.fill(color.h, color.s, color.b, 0.08);
        p.stroke(color.h, color.s, color.b, 0.4);
        p.strokeWeight(1);

        p.beginShape(p.QUADS);
        p.vertex(-halfSize, -halfSize, 0);
        p.vertex(halfSize, -halfSize, 0);
        p.vertex(halfSize, halfSize, 0);
        p.vertex(-halfSize, halfSize, 0);
        p.endShape();

        const gridSize = this._config.cubeMode ? this._config.cubeMode.gridSize : 5;
        p.stroke(color.h, color.s, Math.min(100, color.b + 20), 0.15);
        p.strokeWeight(0.5);
        for (let i = 0; i <= gridSize; i++) {
          const t = (i / gridSize) * cubeSize - halfSize;
          p.line(t, -halfSize, 0, t, halfSize, 0);
          p.line(-halfSize, t, 0, halfSize, t, 0);
        }

        this._drawGridDots(p, fi, color);

        p.pop();
      }

      for (const slot of activeSlots) {
        const cursor = this._cursors[slot];
        if (!cursor) continue;
        const face = this.faces[cursor.faceIndex];
        cursor.tick(face);
      }

      for (const slot of activeSlots) {
        const cursor = this._cursors[slot];
        if (!cursor) continue;

        p.push();
        this._orientFace(p, cursor.faceIndex);
        cursor.draw(p, { x: 0, y: 0, z: 0 });
        p.pop();
      }

      p.pop();
    }

    _orientFace(p, faceIndex) {
      switch (faceIndex) {
        case 0: p.rotateY(p.HALF_PI); break;
        case 1: p.rotateY(-p.HALF_PI); break;
        case 2: p.rotateX(-p.HALF_PI); break;
        case 3: p.rotateX(p.HALF_PI); break;
        case 4: break;
        case 5: p.rotateY(p.PI); break;
      }
    }

    _drawGridDots(p, faceIndex, color) {
      const cubeSize = this._config.cubeMode ? this._config.cubeMode.cubeSize : 200;
      const halfSize = cubeSize / 2;
      const gridSize = this._config.cubeMode ? this._config.cubeMode.gridSize : 5;
      const face = this.faces[faceIndex];

      p.fill(color.h, color.s, color.b, 0.3);
      p.noStroke();

      for (let gy = 0; gy < gridSize; gy++) {
        for (let gx = 0; gx < gridSize; gx++) {
          const x = (gx / (gridSize - 1)) * cubeSize - halfSize;
          const y = (gy / (gridSize - 1)) * cubeSize - halfSize;

          if (face.isCellOccupied(gx, gy)) {
            p.fill(color.h, Math.min(100, color.s + 20), Math.min(100, color.b + 10), 0.6);
            p.circle(x, y, 6);
          } else {
            p.fill(color.h, color.s, color.b, 0.2);
            p.circle(x, y, 3);
          }
        }
      }
    }

    onNestingChange(callback) {
      this._onNestingChange = callback;
    }

    destroy() {
      for (const slot of Object.keys(this._cursors)) {
        this.disposeCursor(parseInt(slot));
      }
    }
  }

  class CubeSensorMapper {
    static orientationToDirection(alpha, beta) {
      const horizontal = Math.cos(alpha * Math.PI / 180);
      const vertical = beta / 180;
      return {
        horizontal: Math.max(-1, Math.min(1, horizontal)),
        vertical: Math.max(-1, Math.min(1, vertical))
      };
    }

    static accelToNestUrgency(accelData) {
      const x = accelData.x || 0;
      const y = accelData.y || 0;
      const z = accelData.z || 0;
      const mag = Math.sqrt(x * x + y * y + z * z);
      return Math.max(0, Math.min(1, mag / 20));
    }

    static gyroToBrightness(gyroValue) {
      const val = gyroValue || 0;
      return 0.2 + (Math.abs(val) / 360) * 0.8;
    }

    static accelToTrailLength(accelData) {
      const x = Math.abs(accelData.x || 0);
      return 20 + Math.min(1, x / 10) * 60;
    }
  }

  global.CubeSnekEngine = CubeSnekEngine;
  global.AxisCursor = AxisCursor;
  global.Face = Face;
  global.CubeSensorMapper = CubeSensorMapper;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CubeSnekEngine, AxisCursor, Face, CubeSensorMapper };
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
