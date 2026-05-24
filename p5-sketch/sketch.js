let dm, v, ws, audioBus, started = false;
let cubeSnek, modeManager;
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
  v = new Visuals(CONFIG);
  cubeSnek = new CubeSnekEngine(CONFIG);

  // Initialize shared brush canvas (WEBGL paint buffer)
  brushCanvas = new BrushCanvas(CONFIG);

  dm = new DeviceManager(engine, CONFIG, v, cubeSnek, brushCanvas);
  modeManager = new VisualModeManager(v, cubeSnek);

  cubeSnek._onNestingChange = (slot, level) => {
    if (engine && engine.setNesting) {
      engine.setNesting(slot, level);
    }
  };

  connectWebSocket();
}

function draw() {
  background(0, 0, 8);

  // Draw brush canvas paint buffer (shared persistent canvas)
  if (brushCanvas) {
    brushCanvas.drawAll();
    if (brushCanvas.paintBuffer && typeof brushCanvas.paintBuffer.isWebGL !== 'undefined') {
      // Render paint buffer to main canvas
      const pb = brushCanvas.paintBuffer;
      if (typeof image === 'function' && typeof pb.canvas !== 'undefined') {
        image(pb, 0, 0);
      }
    }
  }

  // Draw legacy visuals (if brush canvas only, this could be removed)
  if (modeManager) {
    modeManager.draw(dm.activeSlots, dm._cubeSnek ? dm._sensorCache : {});
  }

  dm.drawHUD();

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

  const modeStr = modeManager ? modeManager.mode.toUpperCase() : 'RADIAL';
  fill(0, 0, 100, 0.5);
  textSize(14);
  text('Mode: ' + modeStr + "  ['c' to toggle]", pad, pad + 76);

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

function mouseDragged() {
  if (cubeSnek && modeManager && modeManager.mode === 'cube') {
    cubeSnek.handleMouseDrag(mouseX - pmouseX, mouseY - pmouseY);
  }
}

function mouseWheel(event) {
  if (cubeSnek && modeManager && modeManager.mode === 'cube') {
    cubeSnek.handleMouseWheel(event.delta);
    return false;
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
  if (key === 'c' || key === 'C') {
    if (modeManager) modeManager.toggle();
  }
  if (key === 'b' || key === 'B') {
    // Toggle brush canvas visibility
    if (brushCanvas) {
      brushCanvas._visible = !brushCanvas._visible;
    }
  }
}

class VisualModeManager {
  constructor(visuals, cubeSnek) {
    this._visuals = visuals;
    this._cubeSnek = cubeSnek;
    this._cubeBuffer = null;
    this.mode = 'radial';
  }

  toggle() {
    this.mode = (this.mode === 'radial') ? 'cube' : 'radial';
    if (this._cubeBuffer) {
      this._cubeBuffer.remove();
      this._cubeBuffer = null;
    }
  }

  draw(activeSlots, sensorCache) {
    if (this.mode === 'radial') {
      if (this._visuals) {
        this._visuals.drawAll(activeSlots, CONFIG);
      }
    } else {
      if (this._cubeSnek) {
        if (!this._cubeBuffer) {
          this._cubeBuffer = createGraphics(CONFIG.canvasWidth, CONFIG.canvasHeight, WEBGL);
        }
        const buf = this._cubeBuffer;
        buf.background(0, 0, 8);
        buf.colorMode(HSB, 360, 100, 100, 1);

        buf.push();
        this._cubeSnek.draw(buf, activeSlots, sensorCache);
        buf.pop();

        image(buf, 0, 0);
      }
    }
  }
}

function windowResized() {
  resizeCanvas(CONFIG.canvasWidth, CONFIG.canvasHeight);
}
