const KEY_TO_ROOT = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

class MidiMapper {
  constructor() {
    this.globalConfig = {
      mode: 'chordspace',
      key: 'C',
      octave: 3
    };
    this.slotConfigs = {};
    this._heldNotes = {};
    this._zoneTimer = {};
    this._lastNote = {};
    this._pendingZone = {};
    this._prevOrientA = {};
    this._fadeState = {};
    this._gateState = {};
    this._prevSensor = {};
    this._lastKick = {};
    this._lastSnare = {};
    this._lastCrash = {};
    this._lastTom = {};
    this._prevDirection = {};
    this._gyroBuffer = {};
  }

  setGlobalConfig(config) {
    Object.assign(this.globalConfig, config);
  }

  setSlotConfig(slot, config) {
    this.slotConfigs[slot] = { ...config };
  }

  _clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  _mapRange(value, inMin, inMax, outMin, outMax) {
    const inRange = inMax - inMin;
    if (inRange === 0) return outMin;
    const outRange = outMax - outMin;
    const normalized = (value - inMin) / inRange;
    return outMin + normalized * outRange;
  }

  _getConfig(slot) {
    return this.slotConfigs[slot] || this.globalConfig;
  }

  _getChannel(slot) {
    const config = this._getConfig(slot);
    if (config.channel !== undefined && config.channel !== null) return config.channel;
    return slot & 0x0f;
  }

  _calcAccelMag(accel) {
    if (!accel) return 0;
    return Math.sqrt(
      (accel.x || 0) ** 2 +
      (accel.y || 0) ** 2 +
      (accel.z || 0) ** 2
    );
  }

  _sensorToCC(value, inMin, inMax) {
    const mapped = this._mapRange(value, inMin, inMax, 0, 127);
    return Math.round(this._clamp(mapped, 0, 127));
  }

  _sensorToPitchBend(value, inMin, inMax) {
    const mapped = this._mapRange(value, inMin, inMax, 0, 16383);
    return Math.round(this._clamp(mapped, 0, 16383));
  }

  _getAccelXZone(accelX) {
    if (accelX < -7) return 0;
    if (accelX < -2) return 1;
    if (accelX <= 1) return 2;
    if (accelX <= 6) return 3;
    return 4;
  }

  _getProgressionDegree(accelY) {
    if (accelY < -4) return 0;
    if (accelY <= 3) return 1;
    if (accelY <= 8) return 2;
    return 3;
  }

  _isGateOpen(orientA) {
    const a = ((orientA % 360) + 360) % 360;
    return (a >= 45 && a <= 135) || (a >= 225 && a <= 315);
  }

  _isGateOpenHysteresis(orientA, prevState) {
    const a = ((orientA % 360) + 360) % 360;
    const wasOpen = prevState || false;
    const isInOnWindow = (a >= 45 && a <= 135) || (a >= 225 && a <= 315);
    const isInOffWindow = (a > 40 && a < 140) || (a > 220 && a < 320);
    if (isInOnWindow) return true;
    if (wasOpen && isInOffWindow) return true;
    return false;
  }

  _mapVolume(orientB) {
    const vol = this._mapRange(orientB, -180, 180, 40, 100);
    return Math.round(this._clamp(vol, 40, 100));
  }

  _processChordSpace(slot, data, config) {
    const accelX = data.accel?.x ?? 0;
    const accelY = data.accel?.y ?? 0;
    const accelZ = data.accel?.z ?? 0;
    const gyroA = data.gyro?.a ?? 0;
    const gyroB = data.gyro?.b ?? 0;
    const gyroG = data.gyro?.g ?? 0;
    const orientA = data.orientation?.a ?? 0;
    const orientB = data.orientation?.b ?? 0;

    const events = [];
    const channel = this._getChannel(slot);

    const newZone = this._getAccelXZone(accelX);
    const prevState = this._lastNote[slot];
    const prevToneMidi = prevState?.toneMidi;
    const prevGateOpen = prevState?.gateOpen;
    const now = Date.now();

    const gateOpen = this._isGateOpenHysteresis(orientA, this._gateState[slot]);
    this._gateState[slot] = gateOpen;

    const volume = this._mapVolume(orientB);

    const progDegree = this._getProgressionDegree(accelY);
    const rootOffset = [0, 5, 7, 9][progDegree] || 0;

    const semitones = [0, 4, null, 10, 14];
    const toneOffset = semitones[newZone];

    const keyRoot = KEY_TO_ROOT[config.key] || 0;
    const baseOctave = (config.octave + 1) * 12;
    const rootMidi = baseOctave + keyRoot + rootOffset;
    const toneMidi = toneOffset !== null ? rootMidi + toneOffset : null;

    const hasActiveNote = prevToneMidi !== undefined && prevToneMidi !== null;

    if (newZone === 2 && hasActiveNote && !this._fadeState[slot]) {
      this._fadeState[slot] = { startTime: now, startVolume: volume, note: prevToneMidi };
    }

    if (this._fadeState[slot]) {
      if (newZone !== 2) {
        this._fadeState[slot] = null;
      } else {
        const elapsed = now - this._fadeState[slot].startTime;
        if (elapsed < 200) {
          const fadeVol = Math.round(this._mapRange(elapsed, 0, 200, this._fadeState[slot].startVolume, 0));
          events.push({ type: 'cc', channel, cc: 11, value: this._clamp(fadeVol, 0, 127) });
        } else {
          events.push({ type: 'noteoff', channel, note: this._fadeState[slot].note, velocity: 0 });
          this._fadeState[slot] = null;
          this._lastNote[slot] = { zone: 2, toneMidi: null, gateOpen: false };
        }
        events.push({ type: 'cc', channel, cc: 1, value: this._sensorToCC(accelZ, -12, 12) });
        events.push({ type: 'cc', channel, cc: 2, value: this._sensorToCC(accelY, -12, 12) });
        events.push({ type: 'cc', channel, cc: 11, value: this._clamp(volume, 40, 100) });
        events.push({ type: 'pitchbend', channel, value: this._sensorToPitchBend(gyroA, -2000, 2000) });
        return events;
      }
    }

    if (newZone !== 2 && toneMidi !== null) {
      if (newZone !== this._lastNote[slot]?.zone) {
        if (hasActiveNote) {
          events.push({ type: 'noteoff', channel, note: prevToneMidi, velocity: 0 });
          this._lastNote[slot] = { zone: this._lastNote[slot]?.zone, toneMidi: null, gateOpen: false };
        }

        if (!this._pendingZone[slot] || this._pendingZone[slot].zone !== newZone) {
          this._pendingZone[slot] = { zone: newZone, toneMidi, startTime: now };
        }
      }

      if (this._pendingZone[slot]) {
        const pending = this._pendingZone[slot];
        if (newZone === pending.zone && now - pending.startTime >= 250) {
          if (gateOpen) {
            events.push({ type: 'noteon', channel, note: pending.toneMidi, velocity: volume });
          }
          this._lastNote[slot] = { zone: newZone, toneMidi: pending.toneMidi, gateOpen };
          delete this._pendingZone[slot];
        } else if (newZone !== pending.zone) {
          delete this._pendingZone[slot];
        }
      }
    }

    if (gateOpen !== prevGateOpen && hasActiveNote && toneMidi === prevToneMidi) {
      if (!gateOpen) {
        events.push({ type: 'noteoff', channel, note: prevToneMidi, velocity: 0 });
      } else {
        events.push({ type: 'noteon', channel, note: prevToneMidi, velocity: volume });
      }
      if (this._lastNote[slot]) {
        this._lastNote[slot] = { ...this._lastNote[slot], gateOpen };
      }
    }

    events.push({ type: 'cc', channel, cc: 1, value: this._sensorToCC(accelZ, -12, 12) });
    events.push({ type: 'cc', channel, cc: 2, value: this._sensorToCC(accelY, -12, 12) });
    events.push({ type: 'cc', channel, cc: 11, value: volume });

    const pitchBend = this._sensorToPitchBend(gyroA, -2000, 2000);
    events.push({ type: 'pitchbend', channel, value: pitchBend });

    return events;
  }

  _processDrums(slot, data, config) {
    const events = [];
    const channel = this._getChannel(slot);
    const prev = this._prevSensor[slot] || {};

    const accelX = data.accel?.x ?? 0;
    const accelY = data.accel?.y ?? 0;
    const accelZ = data.accel?.z ?? 0;
    const prevAccelX = prev.accel?.x ?? 0;
    const prevAccelY = prev.accel?.y ?? 0;
    const prevAccelZ = prev.accel?.z ?? 0;

    const deltaX = Math.abs(accelX - prevAccelX);
    const deltaY = Math.abs(accelY - prevAccelY);
    const deltaZ = Math.abs(accelZ - prevAccelZ);

    const now = Date.now();

    if (deltaX > 8 && accelX > prevAccelX && now - (this._lastKick[slot] || 0) > 100) {
      const vel = Math.min(127, Math.round(deltaX * 6));
      events.push({ type: 'noteon', channel, note: 36, velocity: vel });
      this._lastKick[slot] = now;
    }

    if (deltaY > 8 && accelY > prevAccelY && now - (this._lastSnare[slot] || 0) > 80) {
      const vel = Math.min(127, Math.round(deltaY * 6));
      events.push({ type: 'noteon', channel, note: 38, velocity: vel });
      this._lastSnare[slot] = now;
    }

    if (deltaZ > 8 && accelZ > prevAccelZ && now - (this._lastCrash[slot] || 0) > 200) {
      const vel = Math.min(127, Math.round(deltaZ * 6));
      events.push({ type: 'noteon', channel, note: 49, velocity: vel });
      this._lastCrash[slot] = now;
    }

    const gyroA = data.gyro?.a ?? 0;
    const gyroB = data.gyro?.b ?? 0;
    const gyroG = data.gyro?.g ?? 0;
    const orientA = data.orientation?.a ?? 0;
    const orientB = data.orientation?.b ?? 0;
    const orientG = data.orientation?.g ?? 0;

    const hhOpen = this._sensorToCC(gyroA, -2000, 2000);
    events.push({ type: 'cc', channel, cc: 4, value: hhOpen });

    const tomNote = gyroB < -30 ? 47 : gyroB < 30 ? 48 : 50;
    const deltaGyroB = Math.abs(gyroB - (prev.gyro?.b ?? 0));
    if (deltaGyroB > 50 && now - (this._lastTom[slot] || 0) > 120) {
      const tomVel = Math.min(127, Math.round(deltaGyroB * 1.5));
      events.push({ type: 'noteon', channel, note: tomNote, velocity: tomVel });
      this._lastTom[slot] = now;
    }

    const patternZone = Math.floor(((orientA % 360) + 360) % 360 / 90) % 4;

    events.push({ type: 'cc', channel, cc: 1, value: this._sensorToCC(accelZ, -12, 12) });
    events.push({ type: 'cc', channel, cc: 7, value: patternZone * 42 });

    this._prevSensor[slot] = { ...data };

    return events;
  }

  _processGestureCanvas(slot, data, config) {
    const events = [];
    const channel = this._getChannel(slot);

    const accelX = data.accel?.x ?? 0;
    const accelY = data.accel?.y ?? 0;
    const accelZ = data.accel?.z ?? 0;
    const gyroA = data.gyro?.a ?? 0;
    const gyroB = data.gyro?.b ?? 0;
    const gyroG = data.gyro?.g ?? 0;
    const orientA = data.orientation?.a ?? 0;

    const speed = Math.sqrt(gyroA * gyroA + gyroB * gyroB + gyroG * gyroG);
    const speedCC = Math.min(127, Math.round(speed / 2000 * 127));
    events.push({ type: 'cc', channel, cc: 1, value: speedCC });
    events.push({ type: 'cc', channel, cc: 74, value: speedCC });

    const direction = Math.atan2(gyroB, gyroA);
    const panCC = Math.round(((direction + Math.PI) / (Math.PI * 2)) * 127);
    events.push({ type: 'cc', channel, cc: 10, value: panCC });

    const mag = Math.sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ);
    const size = Math.max(0, mag - 9.8);
    const reverbCC = Math.min(127, Math.round(size / 20 * 127));
    events.push({ type: 'cc', channel, cc: 91, value: reverbCC });
    events.push({ type: 'cc', channel, cc: 93, value: reverbCC });

    const prevDir = this._prevDirection[slot] || 0;
    const complexity = Math.abs(direction - prevDir);
    this._prevDirection[slot] = direction;
    const complexityCC = Math.min(127, Math.round(complexity / Math.PI * 127));
    events.push({ type: 'cc', channel, cc: 71, value: complexityCC });
    events.push({ type: 'cc', channel, cc: 16, value: complexityCC });

    if (!this._gyroBuffer[slot]) this._gyroBuffer[slot] = [];
    this._gyroBuffer[slot].push({ a: gyroA, b: gyroB, time: Date.now() });
    this._gyroBuffer[slot] = this._gyroBuffer[slot].filter(s => Date.now() - s.time < 500);

    let circularity = 0;
    if (this._gyroBuffer[slot].length > 10) {
      const meanA = this._gyroBuffer[slot].reduce((s, v) => s + v.a, 0) / this._gyroBuffer[slot].length;
      const meanB = this._gyroBuffer[slot].reduce((s, v) => s + v.b, 0) / this._gyroBuffer[slot].length;
      let num = 0, denA = 0, denB = 0;
      for (const s of this._gyroBuffer[slot]) {
        const da = s.a - meanA;
        const db = s.b - meanB;
        num += da * db;
        denA += da * da;
        denB += db * db;
      }
      const denom = Math.sqrt(denA * denB);
      if (denom > 0) {
        const r = num / denom;
        circularity = Math.round(this._mapRange(this._clamp(r, -1, 1), -1, 1, 0, 127));
      }
    }
    events.push({ type: 'cc', channel, cc: 17, value: circularity });

    const scene = Math.floor((((orientA % 360) + 360) % 360) / 90) % 4;
    events.push({ type: 'cc', channel, cc: 7, value: scene * 42 });

    return events;
  }

  processSensor(slot, sensorData) {
    const config = this._getConfig(slot);
    const mode = config.mode || 'chordspace';

    switch (mode) {
      case 'chordspace':
        return this._processChordSpace(slot, sensorData, config);
      case 'drums':
        return this._processDrums(slot, sensorData, config);
      case 'gesturecanvas':
        return this._processGestureCanvas(slot, sensorData, config);
      default:
        return this._processChordSpace(slot, sensorData, config);
    }
  }
}

module.exports = { MidiMapper, KEY_TO_ROOT };
