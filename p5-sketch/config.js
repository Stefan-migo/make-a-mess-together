function getBridgeUrl() {
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('bridge');
  if (urlParam) {
    try { new URL(urlParam); } catch (e) { /* ignore invalid */ }
    if (urlParam.startsWith('ws://') || urlParam.startsWith('wss://')) {
      localStorage.setItem('p5BridgeUrl', urlParam);
      return urlParam;
    }
  }
  const saved = localStorage.getItem('p5BridgeUrl');
  if (saved) return saved;
  return 'ws://localhost:8080';
}

function normalizeWsProtocol(url) {
  if (window.location.protocol === 'https:') {
    return url.replace(/^ws:/, 'wss:');
  }
  return url;
}

const CONFIG = {
  maxDevices: 30,
  bridgeUrl: normalizeWsProtocol(getBridgeUrl()),
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

  // Cube Snek 3D mode config
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
  },

  // Drum trigger defaults
  drumThreshold: 15,
  drumHysteresisRatio: 0.5,

  // Granular max grains per voice
  maxGrains: 8,

  // EMA smoothing coefficient (default)
  smoothCoefficient: 0.3,

  // Canvas fade config for brush-canvas system
  canvasFadeRate: 0.005,
  canvasFadeInterval: 60,

  // Phase 1: Pressure pipeline defaults (orientation.gamma → brush size/opacity)
  pressureCurve: 'natural',
  pressureSmoothing: 0.2,
  deadZoneGamma: 5,

  // Pen up/down (Drawing Cone)
  penUpAngle: 50,
  penHysteresis: 5,

  // Phase 2: Smooth Traces & Dead Zones
  deadZonePosition: 3,
  interpolateSteps: 5,
  pressureDeltaMax: 0.1,

  slots: [
    // --- Synth types (0-4) ---
    { soundType: "synthBasic", visualType: "pulsingCircle", brushType: "classic", slotIndex: 0, color: { h: 0, s: 80, b: 90 }, sensorMap: { pitch: { source: "accel", axis: "y", range: [50, 2000], curve: "exponential" }, filter: { source: "gyro", axis: "z", range: [200, 8000], curve: "exponential" } } },
    { soundType: "synthFM", visualType: "rotatingLine", brushType: "blade", slotIndex: 1, color: { h: 12, s: 80, b: 90 }, sensorMap: { modIndex: { source: "accel", axis: "x", range: [0.1, 20], curve: "exponential" }, carrier: { source: "orientation", axis: "b", range: [100, 2000], curve: "exponential" } } },
    { soundType: "synthAM", visualType: "arcSweep", brushType: "dotted", slotIndex: 2, color: { h: 24, s: 80, b: 90 }, sensorMap: { depth: { source: "gyro", axis: "a", range: [0, 1], curve: "linear" }, modFreq: { source: "accel", axis: "z", range: [0.5, 20], curve: "exponential" } } },
    { soundType: "synthDuo", visualType: "polygon", brushType: "stamped", slotIndex: 3, color: { h: 36, s: 80, b: 90 }, sensorMap: { detune: { source: "orientation", axis: "g", range: [0, 50], curve: "linear" }, mix: { source: "accel", axis: "y", range: [0, 1], curve: "linear" } } },
    { soundType: "synthMono", visualType: "spiral", brushType: "velocity", slotIndex: 4, color: { h: 48, s: 80, b: 90 }, sensorMap: { glide: { source: "gyro", axis: "b", range: [0, 1], curve: "linear" }, portamento: { source: "accel", axis: "x", range: [0, 0.5], curve: "linear" } } },

    // --- Arp types (5-8) ---
    { soundType: "arpRate", visualType: "connectedDots", brushType: "dash", slotIndex: 5, color: { h: 60, s: 80, b: 90 }, sensorMap: { rate: { source: "orientation", axis: "b", range: [0.1, 10], curve: "exponential" }, spread: { source: "accel", axis: "x", range: [1, 4], curve: "linear" } } },
    { soundType: "arpPattern", visualType: "waveAmplitude", brushType: "sketchy", slotIndex: 6, color: { h: 72, s: 80, b: 90 }, sensorMap: { pattern: { source: "gyro", axis: "z", range: [0, 3], curve: "linear" }, octave: { source: "accel", axis: "y", range: [1, 4], curve: "linear" } } },
    { soundType: "arpGate", visualType: "lissajous", brushType: "watercolor", slotIndex: 7, color: { h: 84, s: 80, b: 90 }, sensorMap: { gate: { source: "orientation", axis: "a", range: [0.01, 0.5], curve: "exponential" }, swing: { source: "gyro", axis: "a", range: [0, 0.5], curve: "linear" } } },
    { soundType: "arpDirection", visualType: "concentricRings", brushType: "spray", slotIndex: 8, color: { h: 96, s: 80, b: 90 }, sensorMap: { direction: { source: "accel", axis: "z", range: [0, 3], curve: "linear" }, steps: { source: "gyro", axis: "b", range: [2, 16], curve: "linear" } } },

    // --- Noise types (9-11) ---
    { soundType: "noiseWhite", visualType: "particleCloud", brushType: "chalk", slotIndex: 9, color: { h: 108, s: 80, b: 90 }, sensorMap: { cutoff: { source: "accel", axis: "z", range: [200, 8000], curve: "exponential" }, resonance: { source: "gyro", axis: "a", range: [0, 20], curve: "linear" } } },
    { soundType: "noisePink", visualType: "oscilloscopeTrail", brushType: "smoke", slotIndex: 10, color: { h: 120, s: 80, b: 90 }, sensorMap: { volume: { source: "orientation", axis: "g", range: [0, 1], curve: "linear" }, pan: { source: "accel", axis: "x", range: [-1, 1], curve: "linear" } } },
    { soundType: "noiseBrown", visualType: "wobblyCircle", brushType: "furry", slotIndex: 11, color: { h: 132, s: 80, b: 90 }, sensorMap: { lfoRate: { source: "gyro", axis: "b", range: [0.1, 10], curve: "exponential" }, lfoDepth: { source: "accel", axis: "y", range: [0, 1], curve: "linear" } } },

    // --- Drum types (12-16) ---
    { soundType: "kick", visualType: "expandingRing", brushType: "neon", slotIndex: 12, color: { h: 144, s: 80, b: 90 }, sensorMap: { trigger: { source: "accelMag", axis: "magnitude", range: [0, 1], curve: "linear" }, pitch: { source: "gyro", axis: "z", range: [40, 150], curve: "exponential" } } },
    { soundType: "snare", visualType: "starburst", brushType: "plasma", slotIndex: 13, color: { h: 156, s: 80, b: 90 }, sensorMap: { noiseMix: { source: "orientation", axis: "b", range: [0, 1], curve: "linear" }, decay: { source: "accel", axis: "y", range: [0.1, 0.8], curve: "linear" } } },
    { soundType: "hiHat", visualType: "glowingDot", brushType: "vortex", slotIndex: 14, color: { h: 168, s: 80, b: 90 }, sensorMap: { cutoff: { source: "gyro", axis: "a", range: [2000, 16000], curve: "exponential" }, decay: { source: "accel", axis: "z", range: [0.02, 0.2], curve: "linear" } } },
    { soundType: "drumPattern", visualType: "pulseFlash", brushType: "bead", slotIndex: 15, color: { h: 180, s: 80, b: 90 }, sensorMap: { speed: { source: "orientation", axis: "g", range: [0.5, 4], curve: "exponential" }, complexity: { source: "accel", axis: "x", range: [1, 8], curve: "linear" } } },
    { soundType: "tom", visualType: "bouncingBall", brushType: "bubble", slotIndex: 16, color: { h: 192, s: 80, b: 90 }, sensorMap: { trigger: { source: "accelMag", axis: "magnitude", range: [0, 1], curve: "linear" }, pitchDrop: { source: "gyro", axis: "b", range: [0, 200], curve: "linear" } } },

    // --- FX types (17-20) ---
    { soundType: "bitcrush", visualType: "pixelatedGrid", brushType: "star", slotIndex: 17, color: { h: 204, s: 80, b: 90 }, sensorMap: { bits: { source: "accel", axis: "x", range: [1, 16], curve: "linear" }, sampleRate: { source: "gyro", axis: "z", range: [1000, 44100], curve: "exponential" } } },
    { soundType: "stutter", visualType: "stutterStrobe", brushType: "quantum", slotIndex: 18, color: { h: 216, s: 80, b: 90 }, sensorMap: { bufSize: { source: "orientation", axis: "g", range: [0.05, 0.5], curve: "linear" }, rate: { source: "accel", axis: "y", range: [0.25, 4], curve: "exponential" } } },
    { soundType: "wavefold", visualType: "foldedWaveform", brushType: "aurora", slotIndex: 19, color: { h: 228, s: 80, b: 90 }, sensorMap: { fold: { source: "gyro", axis: "a", range: [1, 20], curve: "linear" }, symmetry: { source: "accel", axis: "z", range: [0, 1], curve: "linear" } } },
    { soundType: "glitchRandom", visualType: "jitterOffset", brushType: "geometric", slotIndex: 20, color: { h: 240, s: 80, b: 90 }, sensorMap: { probability: { source: "accel", axis: "x", range: [0, 1], curve: "linear" }, interval: { source: "gyro", axis: "b", range: [0.1, 2], curve: "linear" } } },

    // --- Granular types (21-24) ---
    { soundType: "grainSize", visualType: "scatteredGrains", brushType: "pixel", slotIndex: 21, color: { h: 252, s: 80, b: 90 }, sensorMap: { grainSize: { source: "gyro", axis: "b", range: [0.01, 0.5], curve: "exponential" }, pitch: { source: "accel", axis: "y", range: [0.5, 2], curve: "linear" } } },
    { soundType: "grainDensity", visualType: "particleFountain", brushType: "shattered", slotIndex: 22, color: { h: 264, s: 80, b: 90 }, sensorMap: { density: { source: "orientation", axis: "a", range: [1, 50], curve: "exponential" }, spread: { source: "accel", axis: "z", range: [0, 1], curve: "linear" } } },
    { soundType: "grainScatter", visualType: "randomBlink", brushType: "web", slotIndex: 23, color: { h: 276, s: 80, b: 90 }, sensorMap: { position: { source: "gyro", axis: "g", range: [0, 1], curve: "linear" }, panSpread: { source: "accel", axis: "x", range: [0, 1], curve: "linear" } } },
    { soundType: "grainPosition", visualType: "slidingWindow", brushType: "abstract", slotIndex: 24, color: { h: 288, s: 80, b: 90 }, sensorMap: { bufPos: { source: "accel", axis: "y", range: [0, 1], curve: "linear" }, overlap: { source: "gyro", axis: "a", range: [0, 0.5], curve: "linear" } } },

    // --- FX Bus Modulator types (25-29) ---
    { soundType: "reverb", visualType: "abstractShape", brushType: "trail", slotIndex: 25, isFxModulator: true, color: { h: 300, s: 80, b: 90 }, sensorMap: { roomSize: { source: "orientation", axis: "a", range: [0.1, 0.9], curve: "linear" }, wetDry: { source: "accel", axis: "z", range: [0, 1], curve: "linear" } } },
    { soundType: "delay", visualType: "echoGhosts", brushType: "isometric", slotIndex: 26, isFxModulator: true, color: { h: 312, s: 80, b: 90 }, sensorMap: { delayTime: { source: "gyro", axis: "b", range: [0.05, 0.8], curve: "exponential" }, feedback: { source: "accel", axis: "y", range: [0, 0.9], curve: "linear" } } },
    { soundType: "distortion", visualType: "warpDistortion", brushType: "triangulate", slotIndex: 27, isFxModulator: true, color: { h: 324, s: 80, b: 90 }, sensorMap: { amount: { source: "accel", axis: "x", range: [0, 1], curve: "linear" }, gain: { source: "gyro", axis: "g", range: [0, 2], curve: "linear" } } },
    { soundType: "chorus", visualType: "rippleRings", brushType: "mirror-h", slotIndex: 28, isFxModulator: true, color: { h: 336, s: 80, b: 90 }, sensorMap: { depth: { source: "orientation", axis: "b", range: [0, 10], curve: "linear" }, rate: { source: "gyro", axis: "a", range: [0.1, 5], curve: "exponential" } } },
    { soundType: "compressor", visualType: "thresholdBars", brushType: "mirror-v", slotIndex: 29, isFxModulator: true, color: { h: 348, s: 80, b: 90 }, sensorMap: { threshold: { source: "accel", axis: "z", range: [-60, 0], curve: "linear" }, ratio: { source: "gyro", axis: "b", range: [1, 20], curve: "linear" } } }
  ]
};
