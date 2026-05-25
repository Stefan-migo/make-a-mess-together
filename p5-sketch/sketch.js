let dm, ws, audioBus, started = false;
let brushCanvas;
let deviceCount = 0;
let connected = false;
let statusMessage = 'Disconnected';

function setup() {
  const canvas = createCanvas(CONFIG.canvasWidth, CONFIG.canvasHeight);
  canvas.parent(document.body);
  colorMode(HSB, 360, 100, 100, 1);
  frameRate(CONFIG.frameRate || 30);

  audioBus = new AudioBus();
  const engine = new SoundEngine(audioBus);

  // Initialize shared brush canvas (WEBGL paint buffer) — single visual mode
  brushCanvas = new BrushCanvas(CONFIG);

  dm = new DeviceManager(engine, CONFIG, brushCanvas);

  connectWebSocket();
}

function draw() {
  background(0, 0, 8);

  // Draw brush canvas paint buffer (shared persistent canvas)
  if (brushCanvas) {
    brushCanvas.drawAll();
    if (brushCanvas.paintBuffer) {
      const pb = brushCanvas.paintBuffer;
      if (typeof image === 'function' && typeof pb.canvas !== 'undefined') {
        image(pb, 0, 0);
      }
    }
  }

  // HUD overlay
  push();
  fill(0, 0, 100, 0.6);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(14);
  textFont('Courier New, monospace');

  const pad = 16;
  text('Devices: ' + deviceCount, pad, pad);
  text('Status: ' + statusMessage, pad, pad + 20);

  const connectionColor = connected ? [120, 80, 70] : [0, 80, 70];
  fill(connectionColor[0], connectionColor[1], connectionColor[2], 0.8);
  circle(pad + 6, pad + 44, 10);

  fill(0, 0, 100, 0.4);
  textSize(12);
  text(CONFIG.bridgeUrl, pad, pad + 56);

  // Brush cursor count
  const cursorCount = brushCanvas ? brushCanvas.activeCount : 0;
  fill(0, 0, 100, 0.4);
  text('Cursors: ' + cursorCount + "  ['b' toggle brush]", pad, pad + 76);

  pop();
}

function mousePressed() {
  if (!started) {
    Tone.start();
    started = true;
    const overlay = document.getElementById('start-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }
}

function connectWebSocket() {
  statusMessage = 'Connecting...';
  connected = false;

  try {
    ws = new WebSocket(CONFIG.bridgeUrl);
  } catch (e) {
    statusMessage = 'Connection failed: ' + e.message;
    setTimeout(connectWebSocket, 3000);
    return;
  }

  ws.onopen = () => {
    connected = true;
    statusMessage = 'Connected';
    ws.send(JSON.stringify({ type: 'player', v: 1 }));
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    } catch (e) {
      // Ignore malformed messages
    }
  };

  ws.onclose = () => {
    connected = false;
    statusMessage = 'Disconnected (reconnecting in 3s)';
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = () => {
    statusMessage = 'WebSocket error';
  };
}

function handleMessage(msg) {
  if (!msg || !msg.type) return;

  switch (msg.type) {
    case 'system':
      switch (msg.event) {
        case 'assign':
          dm.assign(msg.slot);
          break;
        case 'disconnect':
          dm.disconnect(msg.slot);
          break;
        case 'count':
          deviceCount = msg.count;
          break;
        case 'config':
          dm.updateConfig(msg.slot, msg.config);
          break;
        case 'state':
          if (msg.devices) {
            for (const dev of msg.devices) {
              dm.assign(dev.slot);
            }
          }
          if (msg.deviceCount !== undefined) deviceCount = msg.deviceCount;
          break;
        case 'hello':
          break;
      }
      break;

    case 'sensor':
      dm.updateSensor(msg.slot, msg.sensor, msg.data);
      break;
  }
}

function keyPressed() {
  if (key === 'b' || key === 'B') {
    // Toggle brush canvas visibility
    if (brushCanvas) {
      brushCanvas._visible = !brushCanvas._visible;
    }
  }
}

function windowResized() {
  resizeCanvas(CONFIG.canvasWidth, CONFIG.canvasHeight);
}
