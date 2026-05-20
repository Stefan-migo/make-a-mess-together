const CONFIG = {
  maxDevices: 30,
  bridgeUrl: "ws://localhost:8080",
  canvasWidth: 1600,
  canvasHeight: 900,
  centerX: 800,
  centerY: 450,
  baseRadius: 300,
  frameRate: 30,

  // Shared FX bus defaults
  reverb: { roomSize: 0.5, wet: 0.3, decay: 2 },
  delay: { delayTime: 0.3, feedback: 0.4, wet: 0.2 },
  masterVolume: 0.8,

  // Drum trigger defaults
  drumThreshold: 15,
  drumHysteresisRatio: 0.5,

  // Granular max grains per voice
  maxGrains: 8,

  // EMA smoothing coefficient (default)
  smoothCoefficient: 0.3,

  slots: [
    // --- Synth types (0-4) ---
    {
      soundType: "synthBasic",
      slotIndex: 0,
      color: { h: 0, s: 80, b: 90 },
      sensorMap: {
        pitch: { source: "accel", axis: "y", range: [50, 2000], curve: "exponential" },
        filter: { source: "gyro", axis: "z", range: [200, 8000], curve: "exponential" }
      }
    },
    {
      soundType: "synthFM",
      slotIndex: 1,
      color: { h: 12, s: 80, b: 90 },
      sensorMap: {
        modIndex: { source: "accel", axis: "x", range: [0.1, 20], curve: "exponential" },
        carrier: { source: "orientation", axis: "b", range: [100, 2000], curve: "exponential" }
      }
    },
    {
      soundType: "synthAM",
      slotIndex: 2,
      color: { h: 24, s: 80, b: 90 },
      sensorMap: {
        depth: { source: "gyro", axis: "a", range: [0, 1], curve: "linear" },
        modFreq: { source: "accel", axis: "z", range: [0.5, 20], curve: "exponential" }
      }
    },
    {
      soundType: "synthDuo",
      slotIndex: 3,
      color: { h: 36, s: 80, b: 90 },
      sensorMap: {
        detune: { source: "orientation", axis: "g", range: [0, 50], curve: "linear" },
        mix: { source: "accel", axis: "y", range: [0, 1], curve: "linear" }
      }
    },
    {
      soundType: "synthMono",
      slotIndex: 4,
      color: { h: 48, s: 80, b: 90 },
      sensorMap: {
        glide: { source: "gyro", axis: "b", range: [0, 1], curve: "linear" },
        portamento: { source: "accel", axis: "x", range: [0, 0.5], curve: "linear" }
      }
    },

    // --- Arp types (5-8) ---
    {
      soundType: "arpRate",
      slotIndex: 5,
      color: { h: 60, s: 80, b: 90 },
      sensorMap: {
        rate: { source: "orientation", axis: "b", range: [0.1, 10], curve: "exponential" },
        spread: { source: "accel", axis: "x", range: [1, 4], curve: "linear" }
      }
    },
    {
      soundType: "arpPattern",
      slotIndex: 6,
      color: { h: 72, s: 80, b: 90 },
      sensorMap: {
        pattern: { source: "gyro", axis: "z", range: [0, 3], curve: "linear" },
        octave: { source: "accel", axis: "y", range: [1, 4], curve: "linear" }
      }
    },
    {
      soundType: "arpGate",
      slotIndex: 7,
      color: { h: 84, s: 80, b: 90 },
      sensorMap: {
        gate: { source: "orientation", axis: "a", range: [0.01, 0.5], curve: "exponential" },
        swing: { source: "gyro", axis: "a", range: [0, 0.5], curve: "linear" }
      }
    },
    {
      soundType: "arpDirection",
      slotIndex: 8,
      color: { h: 96, s: 80, b: 90 },
      sensorMap: {
        direction: { source: "accel", axis: "z", range: [0, 3], curve: "linear" },
        steps: { source: "gyro", axis: "b", range: [2, 16], curve: "linear" }
      }
    },

    // --- Noise types (9-11) ---
    {
      soundType: "noiseWhite",
      slotIndex: 9,
      color: { h: 108, s: 80, b: 90 },
      sensorMap: {
        cutoff: { source: "accel", axis: "z", range: [200, 8000], curve: "exponential" },
        resonance: { source: "gyro", axis: "a", range: [0, 20], curve: "linear" }
      }
    },
    {
      soundType: "noisePink",
      slotIndex: 10,
      color: { h: 120, s: 80, b: 90 },
      sensorMap: {
        volume: { source: "orientation", axis: "g", range: [0, 1], curve: "linear" },
        pan: { source: "accel", axis: "x", range: [-1, 1], curve: "linear" }
      }
    },
    {
      soundType: "noiseBrown",
      slotIndex: 11,
      color: { h: 132, s: 80, b: 90 },
      sensorMap: {
        lfoRate: { source: "gyro", axis: "b", range: [0.1, 10], curve: "exponential" },
        lfoDepth: { source: "accel", axis: "y", range: [0, 1], curve: "linear" }
      }
    },

    // --- Drum types (12-16) ---
    {
      soundType: "kick",
      slotIndex: 12,
      color: { h: 144, s: 80, b: 90 },
      sensorMap: {
        trigger: { source: "accelMag", axis: "magnitude", range: [0, 1], curve: "linear" },
        pitch: { source: "gyro", axis: "z", range: [40, 150], curve: "exponential" }
      }
    },
    {
      soundType: "snare",
      slotIndex: 13,
      color: { h: 156, s: 80, b: 90 },
      sensorMap: {
        noiseMix: { source: "orientation", axis: "b", range: [0, 1], curve: "linear" },
        decay: { source: "accel", axis: "y", range: [0.1, 0.8], curve: "linear" }
      }
    },
    {
      soundType: "hiHat",
      slotIndex: 14,
      color: { h: 168, s: 80, b: 90 },
      sensorMap: {
        cutoff: { source: "gyro", axis: "a", range: [2000, 16000], curve: "exponential" },
        decay: { source: "accel", axis: "z", range: [0.02, 0.2], curve: "linear" }
      }
    },
    {
      soundType: "drumPattern",
      slotIndex: 15,
      color: { h: 180, s: 80, b: 90 },
      sensorMap: {
        speed: { source: "orientation", axis: "g", range: [0.5, 4], curve: "exponential" },
        complexity: { source: "accel", axis: "x", range: [1, 8], curve: "linear" }
      }
    },
    {
      soundType: "tom",
      slotIndex: 16,
      color: { h: 192, s: 80, b: 90 },
      sensorMap: {
        trigger: { source: "accelMag", axis: "magnitude", range: [0, 1], curve: "linear" },
        pitchDrop: { source: "gyro", axis: "b", range: [0, 200], curve: "linear" }
      }
    },

    // --- FX types (17-20) ---
    {
      soundType: "bitcrush",
      slotIndex: 17,
      color: { h: 204, s: 80, b: 90 },
      sensorMap: {
        bits: { source: "accel", axis: "x", range: [1, 16], curve: "linear" },
        sampleRate: { source: "gyro", axis: "z", range: [1000, 44100], curve: "exponential" }
      }
    },
    {
      soundType: "stutter",
      slotIndex: 18,
      color: { h: 216, s: 80, b: 90 },
      sensorMap: {
        bufSize: { source: "orientation", axis: "g", range: [0.05, 0.5], curve: "linear" },
        rate: { source: "accel", axis: "y", range: [0.25, 4], curve: "exponential" }
      }
    },
    {
      soundType: "wavefold",
      slotIndex: 19,
      color: { h: 228, s: 80, b: 90 },
      sensorMap: {
        fold: { source: "gyro", axis: "a", range: [1, 20], curve: "linear" },
        symmetry: { source: "accel", axis: "z", range: [0, 1], curve: "linear" }
      }
    },
    {
      soundType: "glitchRandom",
      slotIndex: 20,
      color: { h: 240, s: 80, b: 90 },
      sensorMap: {
        probability: { source: "accel", axis: "x", range: [0, 1], curve: "linear" },
        interval: { source: "gyro", axis: "b", range: [0.1, 2], curve: "linear" }
      }
    },

    // --- Granular types (21-24) ---
    {
      soundType: "grainSize",
      slotIndex: 21,
      color: { h: 252, s: 80, b: 90 },
      sensorMap: {
        grainSize: { source: "gyro", axis: "b", range: [0.01, 0.5], curve: "exponential" },
        pitch: { source: "accel", axis: "y", range: [0.5, 2], curve: "linear" }
      }
    },
    {
      soundType: "grainDensity",
      slotIndex: 22,
      color: { h: 264, s: 80, b: 90 },
      sensorMap: {
        density: { source: "orientation", axis: "a", range: [1, 50], curve: "exponential" },
        spread: { source: "accel", axis: "z", range: [0, 1], curve: "linear" }
      }
    },
    {
      soundType: "grainScatter",
      slotIndex: 23,
      color: { h: 276, s: 80, b: 90 },
      sensorMap: {
        position: { source: "gyro", axis: "g", range: [0, 1], curve: "linear" },
        panSpread: { source: "accel", axis: "x", range: [0, 1], curve: "linear" }
      }
    },
    {
      soundType: "grainPosition",
      slotIndex: 24,
      color: { h: 288, s: 80, b: 90 },
      sensorMap: {
        bufPos: { source: "accel", axis: "y", range: [0, 1], curve: "linear" },
        overlap: { source: "gyro", axis: "a", range: [0, 0.5], curve: "linear" }
      }
    },

    // --- FX Bus Modulator types (25-29) ---
    {
      soundType: "reverb",
      slotIndex: 25,
      isFxModulator: true,
      color: { h: 300, s: 80, b: 90 },
      sensorMap: {
        roomSize: { source: "orientation", axis: "a", range: [0.1, 0.9], curve: "linear" },
        wetDry: { source: "accel", axis: "z", range: [0, 1], curve: "linear" }
      }
    },
    {
      soundType: "delay",
      slotIndex: 26,
      isFxModulator: true,
      color: { h: 312, s: 80, b: 90 },
      sensorMap: {
        delayTime: { source: "gyro", axis: "b", range: [0.05, 0.8], curve: "exponential" },
        feedback: { source: "accel", axis: "y", range: [0, 0.9], curve: "linear" }
      }
    },
    {
      soundType: "distortion",
      slotIndex: 27,
      isFxModulator: true,
      color: { h: 324, s: 80, b: 90 },
      sensorMap: {
        amount: { source: "accel", axis: "x", range: [0, 1], curve: "linear" },
        gain: { source: "gyro", axis: "g", range: [0, 2], curve: "linear" }
      }
    },
    {
      soundType: "chorus",
      slotIndex: 28,
      isFxModulator: true,
      color: { h: 336, s: 80, b: 90 },
      sensorMap: {
        depth: { source: "orientation", axis: "b", range: [0, 10], curve: "linear" },
        rate: { source: "gyro", axis: "a", range: [0.1, 5], curve: "exponential" }
      }
    },
    {
      soundType: "compressor",
      slotIndex: 29,
      isFxModulator: true,
      color: { h: 348, s: 80, b: 90 },
      sensorMap: {
        threshold: { source: "accel", axis: "z", range: [-60, 0], curve: "linear" },
        ratio: { source: "gyro", axis: "b", range: [1, 20], curve: "linear" }
      }
    }
  ]
};
