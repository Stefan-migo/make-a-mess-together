/**
 * phone-sensor-orchestra — Phone Client
 * 
 * Reads DeviceMotion + DeviceOrientation APIs on the phone.
 * Connects to bridge server via WebSocket.
 * Sends sensor data at 30fps with exponential backoff reconnect.
 * 
 * Protocol:
 *   Phone → Bridge: { type: "sensor", accel:{x,y,z}, gyro:{a,b,g}, orientation:{a,b,g} }
 *   Bridge → Phone: { type: "assigned", slot: N, bridgeIp: "..." }
 * 
 * Spec: PLAN.md
 * Design: DESIGN.md
 */

(function() {
  'use strict';

  // =========================================================================
  // Configuration
  // =========================================================================
  const CONFIG = {
    wsPort: 8080,
    sendIntervalMs: 33,           // ~30fps
    reconnectBaseMs: 1000,        // Base backoff delay
    reconnectMaxMs: 30000,        // Max backoff delay
    reconnectJitter: 0.3,         // Jitter factor
    barMin: -12,                  // Min value for progress bar (accel m/s²)
    barMax: 12,                   // Max value for progress bar
    gyroBarMax: 250,              // Max gyro value for progress bar (°/s)
    orientBarMax: 180,            // Max orientation for progress bar (°)
  };

  // =========================================================================
  // State
  // =========================================================================
  const state = {
    ws: null,
    slot: -1,
    connected: false,
    bridgeIp: '',
    lastSent: 0,
    sentCount: 0,
    startTime: 0,
    reconnectAttempt: 0,
    reconnectTimer: null,
    sensorsAvailable: false,
    orientationAvailable: false,
    animationId: null,
    sensorData: {
      accel: { x: 0, y: 0, z: 0 },
      gyro: { a: 0, b: 0, g: 0 },
      orientation: { a: 0, b: 0, g: 0 }
    }
  };

  // =========================================================================
  // DOM References (cached on init)
  // =========================================================================
  let dom = {};

  function cacheDom() {
    dom = {
      connectionDot: document.getElementById('connection-dot'),
      connectionStatus: document.getElementById('connection-status'),
      slotNumber: document.getElementById('slot-number'),
      permissionOverlay: document.getElementById('permission-overlay'),
      configOverlay: document.getElementById('config-overlay'),
      sensorReadouts: document.getElementById('sensor-readouts'),
      footer: document.getElementById('footer'),
      permissionBtn: document.getElementById('permission-btn'),
      connectBtn: document.getElementById('connect-btn'),
      bridgeIpInput: document.getElementById('bridge-ip-input'),
      bridgeAddress: document.getElementById('bridge-address'),
      sendRate: document.getElementById('send-rate'),
      // Axis elements — built dynamically
      axis: {}
    };

    // Cache axis elements for fast updates
    const axisIds = [
      'accel-x', 'accel-y', 'accel-z',
      'gyro-a', 'gyro-b', 'gyro-g',
      'orient-a', 'orient-b', 'orient-g'
    ];
    for (const id of axisIds) {
      const el = document.getElementById(id);
      if (el) {
        dom.axis[id] = {
          container: el,
          value: el.querySelector('.axis-value'),
          fill: el.querySelector('.bar-fill')
        };
      }
    }
  }

  // =========================================================================
  // IP Discovery
  // =========================================================================

  /**
   * Get bridge IP from URL params, localStorage, or prompt.
   * Priority: URL param ?ip= > localStorage > prompt
   */
  function getBridgeIp() {
    // 1. Check URL params
    const params = new URLSearchParams(window.location.search);
    const ipParam = params.get('ip');
    if (ipParam && isValidIp(ipParam)) {
      localStorage.setItem('bridgeIp', ipParam);
      return ipParam;
    }

    // 2. Check localStorage
    const saved = localStorage.getItem('bridgeIp');
    if (saved && isValidIp(saved)) {
      return saved;
    }

    // 3. Show config overlay for user input
    return null;
  }

  /**
   * Basic IP address validation (accepts IPv4 and 'localhost').
   */
  function isValidIp(ip) {
    if (!ip || typeof ip !== 'string') return false;
    if (ip === 'localhost') return true;
    const parts = ip.trim().split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => {
      const num = parseInt(part, 10);
      return !isNaN(num) && num >= 0 && num <= 255;
    });
  }

  /**
   * Show the configuration overlay for IP entry.
   */
  function showConfigOverlay() {
    const saved = localStorage.getItem('bridgeIp');
    if (saved) {
      dom.bridgeIpInput.value = saved;
    }
    dom.configOverlay.classList.remove('hidden');
    dom.bridgeIpInput.focus();
  }

  /**
   * Handle connect button click from config overlay.
   */
  function handleConnectClick() {
    const ip = dom.bridgeIpInput.value.trim();
    if (!isValidIp(ip)) {
      dom.bridgeIpInput.style.borderColor = '#DC2626';
      return;
    }
    dom.bridgeIpInput.style.borderColor = '';
    localStorage.setItem('bridgeIp', ip);
    dom.configOverlay.classList.add('hidden');
    startConnection(ip);
  }

  function resolveIpAndConnect() {
    const ip = getBridgeIp();
    if (ip) {
      startConnection(ip);
    } else {
      showConfigOverlay();
    }
  }

  // =========================================================================
  // WebSocket Connection
  // =========================================================================

  /**
   * Start the WebSocket connection to the bridge.
   * @param {string} ip - Bridge IP address
   */
  function startConnection(ip) {
    state.bridgeIp = ip;
    state.reconnectAttempt = 0;
    connect();
  }

  /**
   * Establish WebSocket connection to the bridge.
   */
  function connect() {
    // Clean up any existing connection
    if (state.ws) {
      try {
        state.ws.close();
      } catch (e) { /* ignore */ }
      state.ws = null;
    }

    const url = `ws://${state.bridgeIp}:${CONFIG.wsPort}`;
    updateConnectionUI('connecting', 'Connecting...');

    try {
      state.ws = new WebSocket(url);
    } catch (e) {
      updateConnectionUI('disconnected', 'Connection failed');
      scheduleReconnect();
      return;
    }

    state.ws.onopen = function() {
      updateConnectionUI('connected', 'Connected');
      // Send role detection message
      sendRaw({ type: 'sensor' });
      // Reset reconnect counter on successful connection
      state.reconnectAttempt = 0;
    };

    state.ws.onmessage = function(event) {
      try {
        const msg = JSON.parse(event.data);
        handleBridgeMessage(msg);
      } catch (e) {
        // Ignore malformed messages
      }
    };

    state.ws.onclose = function() {
      state.connected = false;
      updateConnectionUI('disconnected', 'Disconnected');
      scheduleReconnect();
    };

    state.ws.onerror = function() {
      // onclose will fire after this
    };
  }

  /**
   * Schedule a reconnection with exponential backoff.
   */
  function scheduleReconnect() {
    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer);
    }

    const delay = getReconnectDelay(state.reconnectAttempt);
    state.reconnectAttempt++;

    updateConnectionUI('connecting', `Reconnecting in ${Math.round(delay / 1000)}s`);

    state.reconnectTimer = setTimeout(function() {
      if (!state.connected) {
        connect();
      }
    }, delay);
  }

  /**
   * Calculate exponential backoff delay.
   * @param {number} attempt - Reconnect attempt number (0-indexed)
   * @returns {number} Delay in milliseconds
   */
  function getReconnectDelay(attempt) {
    const base = CONFIG.reconnectBaseMs;
    const max = CONFIG.reconnectMaxMs;
    const delay = Math.min(base * Math.pow(2, attempt), max);
    // Add ±30% jitter
    const jitterRange = delay * CONFIG.reconnectJitter;
    return delay + (Math.random() * jitterRange * 2 - jitterRange);
  }

  /**
   * Send a raw object as JSON over the WebSocket.
   */
  function sendRaw(obj) {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return false;
    try {
      state.ws.send(JSON.stringify(obj));
      return true;
    } catch (e) {
      return false;
    }
  }

  // =========================================================================
  // Bridge Message Handler
  // =========================================================================

  /**
   * Handle incoming messages from the bridge server.
   */
  function handleBridgeMessage(msg) {
    switch (msg.type) {
      case 'system':
        handleSystemMessage(msg);
        break;
      case 'assigned':
        handleAssignedMessage(msg);
        break;
      // Ignore other message types (sensor data for p5, etc.)
    }
  }

  /**
   * Handle system messages from the bridge.
   */
  function handleSystemMessage(msg) {
    switch (msg.event) {
      case 'hello':
        // Bridge sent hello — connection acknowledged
        break;
      case 'state':
        // Bridge state broadcast (contains device list)
        break;
      default:
        break;
    }
  }

  /**
   * Handle slot assignment from the bridge.
   */
  function handleAssignedMessage(msg) {
    state.slot = msg.slot;
    state.connected = true;
    state.startTime = Date.now();

    // Update UI
    dom.slotNumber.textContent = msg.slot;
    updateConnectionUI('connected', `Slot ${msg.slot}`);

    // Show sensor readouts
    dom.sensorReadouts.classList.remove('hidden');
    dom.footer.classList.remove('hidden');
    dom.bridgeAddress.textContent = `ws://${msg.bridgeIp}:${CONFIG.wsPort}`;

    // Start sensor send loop
    startSensorLoop();
  }

  // =========================================================================
  // Sensor APIs
  // =========================================================================

  /**
   * Request permission for DeviceMotion/DeviceOrientation (required on iOS 13+).
   * Must be called from a user gesture (touch/click).
   */
  function requestSensorPermission() {
    // Check if DeviceOrientationEvent requires permission
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ requires explicit permission
      DeviceOrientationEvent.requestPermission()
        .then(function(permissionState) {
          if (permissionState === 'granted') {
            startSensors();
            resolveIpAndConnect();
          } else {
            showPermissionError('Orientation permission denied');
          }
        })
        .catch(function(err) {
          showPermissionError('Permission error: ' + err.message);
        });
    } else if (typeof DeviceMotionEvent !== 'undefined' &&
               typeof DeviceMotionEvent.requestPermission === 'function') {
      // Some iOS versions require this for DeviceMotion
      DeviceMotionEvent.requestPermission()
        .then(function(permissionState) {
          if (permissionState === 'granted') {
            startSensors();
            resolveIpAndConnect();
          } else {
            showPermissionError('Motion permission denied');
          }
        })
        .catch(function(err) {
          showPermissionError('Permission error: ' + err.message);
        });
    } else {
      // Non-iOS or older iOS — no permission needed
      startSensors();
    }
  }

  /**
   * Show permission error and allow retry.
   */
  function showPermissionError(message) {
    updateConnectionUI('disconnected', message);
    dom.permissionOverlay.classList.remove('hidden');
    dom.permissionOverlay.querySelector('p.note').textContent = message + ' — tap to retry';
  }

  /**
   * Start listening to sensor events.
   */
  function startSensors() {
    dom.permissionOverlay.classList.add('hidden');
    state.sensorsAvailable = false;
    state.orientationAvailable = false;

    // DeviceMotion (accelerometer + gyroscope)
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion, false);
      state.sensorsAvailable = true;
    }

    // DeviceOrientation (compass-style angles)
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleDeviceOrientation, false);
      state.orientationAvailable = true;
    }

    if (!state.sensorsAvailable && !state.orientationAvailable) {
      updateConnectionUI('disconnected', 'No sensors available');
    }
  }

  function requiresSensorPermission() {
    return (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') ||
           (typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function');
  }

  /**
   * Handle DeviceMotion event — accelerometer + gyroscope.
   */
  function handleDeviceMotion(event) {
    const accel = event.accelerationIncludingGravity || event.acceleration || {};
    const rotRate = event.rotationRate || {};

    state.sensorData.accel = {
      x: sanitize(accel.x, 0),
      y: sanitize(accel.y, 0),
      z: sanitize(accel.z, 0)
    };

    state.sensorData.gyro = {
      a: sanitize(rotRate.alpha, 0),
      b: sanitize(rotRate.beta, 0),
      g: sanitize(rotRate.gamma, 0)
    };
  }

  /**
   * Handle DeviceOrientation event — alpha, beta, gamma.
   */
  function handleDeviceOrientation(event) {
    state.sensorData.orientation = {
      a: sanitize(event.alpha, 0),
      b: sanitize(event.beta, 90),
      g: sanitize(event.gamma, 0)
    };
  }

  /**
   * Sanitize a sensor value — null/undefined/NaN become fallback.
   */
  function sanitize(value, fallback) {
    if (value === null || value === undefined || isNaN(value)) {
      return fallback;
    }
    return value;
  }

  // =========================================================================
  // 30fps Send Loop (requestAnimationFrame throttled)
  // =========================================================================

  /**
   * Start the sensor data send loop using requestAnimationFrame.
   * Throttled to ~30fps (every 33ms) to reduce message flood.
   */
  function startSensorLoop() {
    if (state.animationId) return;

    state.lastSent = 0;
    state.sentCount = 0;

    function loop(timestamp) {
      if (!state.connected || !state.ws || state.ws.readyState !== WebSocket.OPEN) {
        state.animationId = null;
        return;
      }

      // Throttle to 30fps
      if (state.lastSent === 0 || (timestamp - state.lastSent) >= CONFIG.sendIntervalMs) {
        sendSensorData();
        state.lastSent = timestamp;
        state.sentCount++;

        // Update send rate display every 10 sends
        if (state.sentCount % 10 === 0) {
          updateSendRate();
        }
      }

      state.animationId = requestAnimationFrame(loop);
    }

    state.animationId = requestAnimationFrame(loop);
  }

  /**
   * Send current sensor data to the bridge.
   */
  function sendSensorData() {
    const data = {
      type: 'sensor',
      accel: { ...state.sensorData.accel },
      gyro: { ...state.sensorData.gyro },
      orientation: { ...state.sensorData.orientation }
    };
    sendRaw(data);
  }

  /**
   * Update the send rate display in the footer.
   */
  function updateSendRate() {
    if (!dom.sendRate) return;
    const elapsed = (Date.now() - state.startTime) / 1000;
    if (elapsed < 1) {
      dom.sendRate.textContent = Math.round(state.sentCount);
      return;
    }
    dom.sendRate.textContent = Math.round(state.sentCount / elapsed);
  }

  // =========================================================================
  // UI Updates
  // =========================================================================

  /**
   * Update connection status UI elements.
   */
  function updateConnectionUI(status, message) {
    // Status dot
    dom.connectionDot.className = 'dot';
    if (status === 'connected') {
      dom.connectionDot.classList.add('connected');
    } else if (status === 'connecting') {
      dom.connectionDot.classList.add('connecting');
    } else {
      dom.connectionDot.classList.add('disconnected');
    }

    // Status text
    dom.connectionStatus.textContent = message || status;
  }

  /**
   * Update sensor readout DOM elements.
   * Called from the animation loop to reflect latest sensor values.
   */
  function updateSensorUI() {
    updateAxisUI('accel-x', state.sensorData.accel.x, CONFIG.barMin, CONFIG.barMax);
    updateAxisUI('accel-y', state.sensorData.accel.y, CONFIG.barMin, CONFIG.barMax);
    updateAxisUI('accel-z', state.sensorData.accel.z, CONFIG.barMin, CONFIG.barMax);

    updateAxisUI('gyro-a', state.sensorData.gyro.a, -CONFIG.gyroBarMax, CONFIG.gyroBarMax);
    updateAxisUI('gyro-b', state.sensorData.gyro.b, -CONFIG.gyroBarMax, CONFIG.gyroBarMax);
    updateAxisUI('gyro-g', state.sensorData.gyro.g, -CONFIG.gyroBarMax, CONFIG.gyroBarMax);

    updateAxisUI('orient-a', state.sensorData.orientation.a, 0, 360);
    updateAxisUI('orient-b', state.sensorData.orientation.b, -180, 180);
    updateAxisUI('orient-g', state.sensorData.orientation.g, -180, 180);
  }

  /**
   * Update a single axis row's value and progress bar.
   * Optimized: only updates DOM if value changed significantly.
   */
  function updateAxisUI(id, value, min, max) {
    const axis = dom.axis[id];
    if (!axis) return;

    // Format the display value
    const displayValue = typeof value === 'number' ? value.toFixed(2) : '0.00';
    const currentDisplay = axis.value.textContent;

    // Only update DOM if value changed enough to affect display
    if (currentDisplay !== displayValue) {
      axis.value.textContent = displayValue;
    }

    // Calculate bar percentage (clamped 0-100)
    const range = max - min;
    let pct = range > 0 ? ((value - min) / range) * 100 : 50;
    pct = Math.max(0, Math.min(100, pct));

    const currentWidth = axis.fill.style.width;
    const newWidth = pct.toFixed(1) + '%';
    if (currentWidth !== newWidth) {
      axis.fill.style.width = newWidth;
    }
  }

  // =========================================================================
  // Main Render Loop (separate from send loop)
  // =========================================================================

  /**
   * UI update loop — updates DOM readouts at display refresh rate.
   * Separated from send loop so UI stays smooth regardless of send throttle.
   */
  function startUILoop() {
    function uiLoop() {
      if (state.connected) {
        updateSensorUI();
      }
      requestAnimationFrame(uiLoop);
    }
    requestAnimationFrame(uiLoop);
  }

  // =========================================================================
  // Initialization
  // =========================================================================

  /**
   * Initialize the phone client.
   */
  function init() {
    cacheDom();

    // Bind permission button
    dom.permissionBtn.addEventListener('click', function() {
      requestSensorPermission();
    });

    // Bind connect button
    dom.connectBtn.addEventListener('click', handleConnectClick);

    // Allow Enter key in IP input
    dom.bridgeIpInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        handleConnectClick();
      }
    });

    // Start UI render loop
    startUILoop();

    // Flow decision: iOS needs permission before anything else
    if (requiresSensorPermission()) {
      // iOS: Show permission overlay first, user must tap to enable sensors
      dom.permissionOverlay.classList.remove('hidden');
      // IP config will be resolved AFTER permission is granted (in startSensors callback)
    } else {
      // Android/desktop: start sensors immediately, no permission needed
      startSensors();
      resolveIpAndConnect();
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
