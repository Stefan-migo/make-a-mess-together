(function(global) {
  'use strict';

  /**
   * BRUSH REGISTRY — 34 brush type definitions
   * 
   * Each brush is a function:
   *   drawBrush(pg, x1, y1, x2, y2, color, size, opts)
   * 
   * Where:
   *   pg:     p5.Graphics target (paint buffer)
   *   x1,y1:  previous position
   *   x2,y2:  current position  
   *   color:  { r, g, b } in RGB (0-255)
   *   size:   base brush size (pixels)
   *   opts:   { alpha, frameCount, state, scatter, angle, blendMode, ... }
   *           alpha: 0-255
   *           frameCount: number (from sketch)
   *           state: object for per-cursor persistent state
   * 
   * Ported from BrushWorks / DrawingCanvas.tsx by user.
   */

  const REGISTRY = {};

  function registerBrush(name, fn) {
    REGISTRY[name] = fn;
  }

  function drawBrush(name, pg, x1, y1, x2, y2, color, size, opts) {
    const fn = REGISTRY[name];
    if (!fn) return false;
    fn(pg, x1, y1, x2, y2, color, size, opts || {});
    return true;
  }

  function getBrushNames() {
    return Object.keys(REGISTRY);
  }

  function getBrushCount() {
    return Object.keys(REGISTRY).length;
  }

  // ============================================================
  // BRUSH IMPLEMENTATIONS (34 types)
  // Ported from BrushWorks / DrawingCanvas.tsx
  // ============================================================

  // --- INK & PENS (6) ---

  // 0. Classic — smooth interpolated elliptical stroke
  registerBrush('classic', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.noStroke();
    pg.fill(color.r, color.g, color.b, a);
    const distance = p5Dist(x1, y1, x2, y2);
    const steps = Math.max(Math.floor(distance), 1);
    for (let i = 0; i <= steps; i++) {
      const x = p5Lerp(x1, x2, i / steps);
      const y = p5Lerp(y1, y2, i / steps);
      const speedScale = p5Constrain(p5Map(distance, 0, 50, 1, 0.7), 0.5, 1);
      pg.ellipse(x, y, size * speedScale, size * speedScale);
    }
  });

  // 1. Blade — chisel calligraphic angled stroke
  registerBrush('blade', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.noStroke();
    pg.fill(color.r, color.g, color.b, a);
    const distance = p5Dist(x1, y1, x2, y2);
    const steps = Math.max(Math.floor(distance), 1);
    for (let i = 0; i <= steps; i++) {
      const x = p5Lerp(x1, x2, i / steps);
      const y = p5Lerp(y1, y2, i / steps);
      pg.ellipse(x, y, size, size * 0.18);
    }
  });

  // 2. Dotted — isolated ink spots with spacing
  registerBrush('dotted', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.noStroke();
    pg.fill(color.r, color.g, color.b, a);
    const fc = opts.frameCount || 0;
    const dist = p5Dist(x1, y1, x2, y2);
    if (dist > size * 0.8 || fc % 5 === 0) {
      pg.ellipse(x2, y2, size * 0.7, size * 0.7);
    }
  });

  // 3. Stamped — architectural double disks
  registerBrush('stamped', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const distance = p5Dist(x1, y1, x2, y2);
    if (distance > size * 1.2) {
      pg.stroke(color.r, color.g, color.b, a);
      pg.strokeWeight(2);
      pg.fill(255, 255, 255, a * 0.4);
      pg.ellipse(x2, y2, size, size);
      pg.fill(color.r, color.g, color.b, a);
      pg.ellipse(x2, y2, size * 0.4, size * 0.4);
    }
  });

  // 4. Velocity — size scales with movement speed
  registerBrush('velocity', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.noStroke();
    pg.fill(color.r, color.g, color.b, a);
    const distance = p5Dist(x1, y1, x2, y2);
    const dynamicSize = p5Constrain(p5Map(distance, 0, 45, size * 0.25, size * 1.8), size * 0.15, size * 2.5);
    const steps = Math.max(Math.floor(distance), 1);
    for (let i = 0; i <= steps; i++) {
      const x = p5Lerp(x1, x2, i / steps);
      const y = p5Lerp(y1, y2, i / steps);
      pg.ellipse(x, y, dynamicSize, dynamicSize);
    }
  });

  // 5. Dash — segmented stitching line
  registerBrush('dash', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.stroke(color.r, color.g, color.b, a);
    pg.strokeWeight(size * 0.25);
    pg.noFill();
    const distance = p5Dist(x1, y1, x2, y2);
    if (distance > 3) {
      const segments = Math.max(Math.floor(distance / 12), 1);
      for (let i = 0; i < segments; i++) {
        if (i % 2 === 0) {
          const sx = p5Lerp(x1, x2, i / segments);
          const sy = p5Lerp(y1, y2, i / segments);
          const ex = p5Lerp(x1, x2, (i + 0.75) / segments);
          const ey = p5Lerp(y1, y2, (i + 0.75) / segments);
          pg.line(sx, sy, ex, ey);
        }
      }
    }
  });

  // --- ART & TEXTURE (6) ---

  // 6. Sketchy — interweaving charcoal connecting nearby points
  registerBrush('sketchy', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const state = opts.state || {};
    if (!state.points) state.points = [];
    state.points.push({ x: x2, y: y2 });
    if (state.points.length > 50) state.points.shift();

    pg.stroke(color.r, color.g, color.b, a * 0.35);
    pg.strokeWeight(p5Constrain(size * 0.08, 0.5, 3));
    pg.noFill();

    const pts = state.points;
    for (let i = 0; i < pts.length; i++) {
      const d = p5Dist(x2, y2, pts[i].x, pts[i].y);
      if (d < size * 3.5 && d > 2) {
        pg.line(x2, y2, pts[i].x, pts[i].y);
      }
    }
  });

  // 7. Watercolor — translucent concentric bleeds
  registerBrush('watercolor', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.noStroke();
    const layers = 5;
    for (let i = layers; i > 0; i--) {
      const currentSize = size * (1.2 + (i / layers) * 0.8);
      const calculatedAlpha = a * 0.06 * (1 - (i / (layers + 1)));
      pg.fill(color.r, color.g, color.b, calculatedAlpha);
      pg.ellipse(x2, y2, currentSize, currentSize);
    }
  });

  // 8. Spray — airbrush splatter casting fine particles
  registerBrush('spray', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.noStroke();
    pg.fill(color.r, color.g, color.b, a * 0.61);
    const numParticles = Math.max(Math.floor(size * 0.4), 8);
    for (let i = 0; i < numParticles; i++) {
      const radius = Math.random() * size * 0.8;
      const angle = Math.random() * Math.PI * 2;
      const particleSize = 1.2 + Math.random() * p5Constrain(size * 0.07, 1.5, 4.5);
      pg.ellipse(x2 + radius * Math.cos(angle), y2 + radius * Math.sin(angle), particleSize, particleSize);
    }
  });

  // 9. Chalk — grainy porous chalk with organic pigment
  registerBrush('chalk', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.noStroke();
    const grains = Math.max(Math.floor(size * 0.75), 15);
    for (let i = 0; i < grains; i++) {
      const rRadius = Math.random() * size * 0.6;
      const rAngle = Math.random() * Math.PI * 2;
      const gx = x2 + rRadius * Math.cos(rAngle);
      const gy = y2 + rRadius * Math.sin(rAngle);
      const distanceFactor = rRadius / (size * 0.6);
      const grainAlpha = p5Lerp(a * 0.45, 0, distanceFactor);
      pg.fill(color.r, color.g, color.b, grainAlpha);
      pg.ellipse(gx, gy, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
    }
  });

  // 10. Smoke — soft drifting billows
  registerBrush('smoke', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const fc = opts.frameCount || 0;
    pg.noStroke();
    const driftCount = 3;
    for (let i = 0; i < driftCount; i++) {
      const offsetValue = size * 0.5;
      const sx = x2 + (Math.random() - 0.5) * offsetValue * 2;
      const sy = y2 + (Math.random() - 0.5) * offsetValue * 2 - (fc % 10) * 0.4;
      const smokeSize = size * (0.6 + Math.random() * 0.8);
      pg.fill(color.r, color.g, color.b, a * 0.04);
      pg.ellipse(sx, sy, smokeSize, smokeSize);
    }
  });

  // 11. Furry — soft bristles growing along path
  registerBrush('furry', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.stroke(color.r, color.g, color.b, a * 0.28);
    pg.strokeWeight(p5Constrain(size * 0.04, 0.5, 2));
    pg.noFill();
    const hairs = Math.max(Math.floor(size * 0.5), 10);
    for (let i = 0; i < hairs; i++) {
      const theta = Math.random() * Math.PI * 2;
      const len = size * (0.3 + Math.random() * 0.8);
      const xEnd = x2 + len * Math.cos(theta);
      const yEnd = y2 + len * Math.sin(theta);
      const cx = x2 + (Math.random() - 0.5) * size * 0.3;
      const cy = y2 + (Math.random() - 0.5) * size * 0.3;
      pg.beginShape();
      for (let tStep = 0; tStep <= 6; tStep++) {
        const t = tStep / 6;
        const mt = 1 - t;
        const bx = mt * mt * x1 + 2 * mt * t * cx + t * t * xEnd;
        const by = mt * mt * y1 + 2 * mt * t * cy + t * t * yEnd;
        pg.vertex(bx, by);
      }
      pg.endShape();
    }
  });

  // --- SFX & GLOW (8) ---

  // 12. Neon — fluorescent glow with soft halo
  registerBrush('neon', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.noStroke();
    pg.fill(color.r, color.g, color.b, a * 0.06);
    pg.ellipse(x2, y2, size * 2.8, size * 2.8);
    pg.fill(color.r, color.g, color.b, a * 0.16);
    pg.ellipse(x2, y2, size * 1.6, size * 1.6);
    pg.fill(color.r, color.g, color.b, a * 0.45);
    pg.ellipse(x2, y2, size * 0.8, size * 0.8);
    pg.fill(255, 255, 255, a * 0.9);
    pg.ellipse(x2, y2, size * 0.35, size * 0.35);
  });

  // 13. Plasma — electric oscillating energy cord
  registerBrush('plasma', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const fc = opts.frameCount || 0;
    pg.noFill();
    pg.stroke(color.r, color.g, color.b, a * 0.85);
    pg.strokeWeight(p5Constrain(size * 0.08, 1, 4));
    const distance = p5Dist(x1, y1, x2, y2);
    const steps = Math.max(Math.floor(distance / 2), 1);
    pg.beginShape();
    for (let i = 0; i <= steps; i++) {
      const t = steps > 0 ? i / steps : 0;
      const x = p5Lerp(x1, x2, t);
      const y = p5Lerp(y1, y2, t);
      const waveOffset = Math.sin(fc * 0.25 + t * Math.PI * 5) * size * 0.3;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const angle = Math.atan2(dy, dx) + Math.PI / 2;
      pg.vertex(x + Math.cos(angle) * waveOffset, y + Math.sin(angle) * waveOffset);
    }
    pg.endShape();
  });

  // 14. Vortex — orbiting planetary nodes
  registerBrush('vortex', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.noStroke();
    const particles = 4;
    const angleSpeed = Date.now() * 0.007;
    for (let i = 0; i < particles; i++) {
      const currentAngle = angleSpeed + (i * Math.PI * 2) / particles;
      const radius = size * 0.8;
      const vx = x2 + radius * Math.cos(currentAngle);
      const vy = y2 + radius * Math.sin(currentAngle);
      pg.fill(color.r, color.g, color.b, a * 0.6);
      pg.ellipse(vx, vy, size * 0.25, size * 0.25);
      pg.stroke(color.r, color.g, color.b, a * 0.15);
      pg.strokeWeight(1);
      pg.line(x2, y2, vx, vy);
    }
  });

  // 15. Bead — alternating rainbow colored beads
  registerBrush('bead', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const fc = opts.frameCount || 0;
    pg.stroke(0, 0, 0, a * 0.2);
    pg.strokeWeight(1);
    const distance = p5Dist(x1, y1, x2, y2);
    const steps = Math.max(Math.floor(distance / 18), 1);
    for (let i = 0; i <= steps; i++) {
      const x = p5Lerp(x1, x2, i / steps);
      const y = p5Lerp(y1, y2, i / steps);
      const cycleHue = (fc * 5 + i * 40) % 360;
      const rgb = hslToRgb(cycleHue, 90, 60);
      pg.fill(rgb.r, rgb.g, rgb.b, a);
      pg.ellipse(x, y, size * 0.65, size * 0.65);
    }
  });

  // 16. Bubble — hollow translucent iridescents
  registerBrush('bubble', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.ellipseMode('center');
    pg.stroke(color.r, color.g, color.b, a * 0.8);
    pg.strokeWeight(1.5);
    pg.fill(255, 255, 255, a * 0.08);
    const count = Math.random() > 0.4 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const offsetAngle = Math.random() * Math.PI * 2;
      const offsetDist = Math.random() * size * 0.6;
      const bx = x2 + offsetDist * Math.cos(offsetAngle);
      const by = y2 + offsetDist * Math.sin(offsetAngle);
      const radius = size * (0.3 + Math.random() * 0.6);
      pg.ellipse(bx, by, radius, radius);
      pg.noStroke();
      pg.fill(255, 255, 255, a * 0.5);
      pg.ellipse(bx - radius * 0.2, by - radius * 0.2, radius * 0.2, radius * 0.2);
    }
  });

  // 17. Star — glimmering star particles
  registerBrush('star', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.noStroke();
    pg.fill(color.r, color.g, color.b, a);
    const distance = p5Dist(x1, y1, x2, y2);
    const numStars = Math.max(Math.floor(distance / 15), 1);
    for (let s = 0; s < numStars; s++) {
      const sx = p5Lerp(x1, x2, s / numStars) + (Math.random() - 0.5) * size * 0.1;
      const sy = p5Lerp(y1, y2, s / numStars) + (Math.random() - 0.5) * size * 0.1;
      const sSize = size * (0.2 + Math.random() * 0.4);
      drawStarShape(pg, sx, sy, sSize * 0.4, sSize, 5);
    }
  });

  // 18. Quantum — subatomic orbit lines and glow
  registerBrush('quantum', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const fc = opts.frameCount || 0;
    pg.noFill();
    const orbits = 3;
    pg.strokeWeight(0.75);
    for (let i = 0; i < orbits; i++) {
      pg.stroke(color.r, color.g, color.b, a * 0.25);
      const oAngleOffset = (i * Math.PI) / orbits;
      const rx = size * 0.72;
      const ry = size * 0.24;
      pg.beginShape();
      for (let ang = 0; ang < Math.PI * 2; ang += 0.25) {
        const x0 = rx * Math.cos(ang);
        const y0 = ry * Math.sin(ang);
        const rxRot = x0 * Math.cos(oAngleOffset) - y0 * Math.sin(oAngleOffset);
        const ryRot = x0 * Math.sin(oAngleOffset) + y0 * Math.cos(oAngleOffset);
        pg.vertex(x2 + rxRot, y2 + ryRot);
      }
      pg.endShape('close');
      const angle = fc * 0.05 + (i * Math.PI * 2) / orbits;
      const orbX = rx * Math.cos(angle);
      const orbY = ry * Math.sin(angle);
      const px = x2 + orbX * Math.cos(oAngleOffset) - orbY * Math.sin(oAngleOffset);
      const py = y2 + orbX * Math.sin(oAngleOffset) + orbY * Math.cos(oAngleOffset);
      pg.noStroke();
      pg.fill(255, 255, 255, a * 0.85);
      pg.ellipse(px, py, size * 0.14, size * 0.14);
      pg.fill(color.r, color.g, color.b, a * 0.35);
      pg.ellipse(px, py, size * 0.32, size * 0.32);
    }
    pg.noStroke();
    pg.fill(255, 255, 255, a * 0.9);
    pg.ellipse(x2, y2, size * 0.12, size * 0.12);
    pg.fill(color.r, color.g, color.b, a * 0.18);
    pg.ellipse(x2, y2, size * 0.48, size * 0.48);
  });

  // 19. Aurora — organic magnetic wave ribbons
  registerBrush('aurora', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const fc = opts.frameCount || 0;
    pg.strokeWeight(1);
    pg.noFill();
    const distance = p5Dist(x1, y1, x2, y2);
    const steps = Math.max(Math.floor(distance / 2.5), 1);
    const waveLines = 5;
    for (let w = 0; w < waveLines; w++) {
      const layerAlpha = a * (1 - w / waveLines) * 0.25;
      pg.stroke(color.r, color.g, color.b, layerAlpha);
      pg.beginShape();
      for (let i = 0; i <= steps; i++) {
        const t = steps > 0 ? i / steps : 0;
        const wx = p5Lerp(x1, x2, t);
        const wy = p5Lerp(y1, y2, t);
        const tOffset = Math.sin(fc * 0.14 + t * Math.PI * 2.8 + w * 0.52) * (size * 0.42);
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        pg.vertex(wx + Math.cos(angle) * tOffset, wy + Math.sin(angle) * tOffset);
      }
      pg.endShape();
    }
  });

  // --- GEOMETRY (8) ---

  // 20. Geometric — clean hollow rect with solid core
  registerBrush('geometric', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.stroke(color.r, color.g, color.b, a);
    pg.strokeWeight(p5Constrain(size * 0.05, 1, 4));
    pg.noFill();
    pg.rectMode('center');
    pg.rect(x2, y2, size, size);
    pg.fill(color.r, color.g, color.b, a * 0.15);
    pg.rect(x2, y2, size * 0.6, size * 0.6);
  });

  // 21. Pixel — 8-bit grid aligned block
  registerBrush('pixel', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.noStroke();
    pg.fill(color.r, color.g, color.b, a);
    const grid = Math.max(Math.floor(size * 0.4), 8);
    const snapX = Math.floor(x2 / grid) * grid + grid / 2;
    const snapY = Math.floor(y2 / grid) * grid + grid / 2;
    pg.rectMode('center');
    pg.rect(snapX, snapY, grid - 1, grid - 1);
  });

  // 22. Shattered — fragmented crystal vectors
  registerBrush('shattered', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.stroke(color.r, color.g, color.b, a * 0.45);
    pg.strokeWeight(1);
    pg.fill(color.r, color.g, color.b, a * 0.12);
    const count = 3 + Math.floor(Math.random() * 5);
    pg.beginShape('triangle_fan');
    pg.vertex(x2, y2);
    for (let i = 0; i < count; i++) {
      const rAngle = Math.random() * Math.PI * 2;
      const rDist = size * (0.4 + Math.random() * 1.2);
      pg.vertex(x2 + rDist * Math.cos(rAngle), y2 + rDist * Math.sin(rAngle));
    }
    pg.endShape('close');
  });

  // 23. Web — neural network chords
  registerBrush('web', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const state = opts.state || {};
    if (!state.points) state.points = [];
    state.points.push({ x: x2, y: y2 });
    if (state.points.length > 60) state.points.shift();

    pg.stroke(color.r, color.g, color.b, a * 0.4);
    pg.strokeWeight(1);
    pg.noFill();
    pg.ellipse(x2, y2, 4, 4);

    for (let i = 0; i < state.points.length; i++) {
      const op = state.points[i];
      const d = p5Dist(x2, y2, op.x, op.y);
      if (d < size * 4 && d > 10) {
        pg.line(x2, y2, op.x, op.y);
      }
    }
  });

  // 24. Abstract — line frameworks with random volumes
  registerBrush('abstract', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const fc = opts.frameCount || 0;
    pg.stroke(color.r, color.g, color.b, a * 0.7);
    pg.strokeWeight(1);
    pg.fill(color.r, color.g, color.b, a * 0.05);
    if (fc % 4 === 0) {
      const lengthFactor = size * 1.5;
      pg.rectMode('center');
      pg.rect(x2, y2, lengthFactor * (0.5 + Math.random() * 0.7), lengthFactor * (0.2 + Math.random() * 0.6));
      pg.line(x1, y1, x2 + (Math.random() - 0.5) * 100, y2 + (Math.random() - 0.5) * 100);
    }
  });

  // 25. Trail — ghost echo duplicates
  registerBrush('trail', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    pg.noStroke();
    pg.fill(color.r, color.g, color.b, a * 0.4);
    const d = p5Dist(x1, y1, x2, y2);
    const numEchos = 3;
    for (let i = 0; i < numEchos; i++) {
      const factor = (i + 1) / (numEchos + 1);
      const tx = p5Lerp(x1, x2, factor);
      const ty = p5Lerp(y1, y2, factor);
      pg.ellipse(tx, ty, size * factor * 1.1, size * factor * 1.1);
    }
  });

  // 26. Isometric — 3D wireframe isometric blocks
  registerBrush('isometric', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const fc = opts.frameCount || 0;
    const distance = p5Dist(x1, y1, x2, y2);
    if (distance > size * 0.75 || fc % 5 === 0) {
      pg.stroke(color.r, color.g, color.b, a * 0.42);
      pg.strokeWeight(1);
      pg.fill(color.r, color.g, color.b, a * 0.035);
      const w = size * 0.8;
      const h = size * 0.58;
      const d = size * 0.48;
      const cx = x2;
      const cy = y2;
      // Top face
      pg.beginShape();
      pg.vertex(cx, cy - h);
      pg.vertex(cx + w * 0.86, cy - h - w * 0.5);
      pg.vertex(cx + w * 0.86 - d * 0.86, cy - h - w * 0.5 + d * 0.5);
      pg.vertex(cx - d * 0.86, cy - h + d * 0.5);
      pg.endShape('close');
      // Left face
      pg.beginShape();
      pg.vertex(cx, cy - h);
      pg.vertex(cx - d * 0.86, cy - h + d * 0.5);
      pg.vertex(cx - d * 0.86, cy + d * 0.5);
      pg.vertex(cx, cy);
      pg.endShape('close');
      // Right face
      pg.beginShape();
      pg.vertex(cx, cy);
      pg.vertex(cx + w * 0.86, cy - w * 0.5);
      pg.vertex(cx + w * 0.86, cy - h - w * 0.5);
      pg.vertex(cx, cy - h);
      pg.endShape('close');
    }
  });

  // 27. Triangulate — Delaunay triangulation net
  registerBrush('triangulate', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const state = opts.state || {};
    if (!state.points) state.points = [];
    state.points.push({ x: x2, y: y2 });
    if (state.points.length > 45) state.points.shift();

    pg.stroke(color.r, color.g, color.b, a * 0.22);
    pg.strokeWeight(0.5);
    pg.noFill();

    const pts = state.points;
    const len = pts.length;
    if (len >= 3) {
      for (let i = len - 1; i >= Math.max(0, len - 15); i--) {
        for (let j = i - 1; j >= Math.max(0, len - 15); j--) {
          const p1 = pts[i];
          const p2 = pts[j];
          const d12 = p5Dist(p1.x, p1.y, p2.x, p2.y);
          if (d12 < size * 2.8) {
            for (let k = j - 1; k >= Math.max(0, len - 15); k--) {
              const p3 = pts[k];
              const d23 = p5Dist(p2.x, p2.y, p3.x, p3.y);
              const d31 = p5Dist(p3.x, p3.y, p1.x, p1.y);
              if (d23 < size * 2.8 && d31 < size * 2.8) {
                pg.fill(color.r, color.g, color.b, a * 0.03);
                pg.beginShape();
                pg.vertex(p1.x, p1.y);
                pg.vertex(p2.x, p2.y);
                pg.vertex(p3.x, p3.y);
                pg.endShape('close');
                break;
              }
            }
          }
        }
      }
    }
  });

  // --- SYMMETRY (6) ---

  // 28. Mirror Horiz — horizontal split symmetry
  registerBrush('mirror-h', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const canvasWidth = pg.width || 800;
    const mirroredX = canvasWidth - x2;
    pg.stroke(color.r, color.g, color.b, a * 0.35);
    pg.strokeWeight(1);
    pg.noFill();
    // Primary
    pg.line(x2 - size * 0.6, y2, x2 + size * 0.6, y2);
    pg.line(x2, y2 - size * 0.3, x2, y2 + size * 0.3);
    pg.fill(color.r, color.g, color.b, a * 0.3);
    pg.noStroke();
    pg.ellipse(x2, y2, size * 0.25, size * 0.25);
    // Mirror
    pg.stroke(color.r, color.g, color.b, a * 0.35);
    pg.noFill();
    pg.line(mirroredX - size * 0.6, y2, mirroredX + size * 0.6, y2);
    pg.line(mirroredX, y2 - size * 0.3, mirroredX, y2 + size * 0.3);
    pg.noStroke();
    pg.fill(color.r, color.g, color.b, a * 0.3);
    pg.ellipse(mirroredX, y2, size * 0.25, size * 0.25);
  });

  // 29. Mirror Vert — vertical split symmetry
  registerBrush('mirror-v', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const canvasHeight = pg.height || 600;
    const mirroredY = canvasHeight - y2;
    pg.stroke(color.r, color.g, color.b, a * 0.32);
    pg.strokeWeight(1);
    pg.noFill();
    const rD = size * 0.42;
    // Primary diamond
    pg.beginShape();
    pg.vertex(x2, y2 - rD);
    pg.vertex(x2 + rD, y2);
    pg.vertex(x2, y2 + rD);
    pg.vertex(x2 - rD, y2);
    pg.endShape('close');
    pg.noStroke();
    pg.fill(color.r, color.g, color.b, a * 0.3);
    pg.ellipse(x2, y2, size * 0.18, size * 0.18);
    // Mirror diamond
    pg.stroke(color.r, color.g, color.b, a * 0.32);
    pg.noFill();
    pg.beginShape();
    pg.vertex(x2, mirroredY - rD);
    pg.vertex(x2 + rD, mirroredY);
    pg.vertex(x2, mirroredY + rD);
    pg.vertex(x2 - rD, mirroredY);
    pg.endShape('close');
    pg.noStroke();
    pg.fill(color.r, color.g, color.b, a * 0.3);
    pg.ellipse(x2, mirroredY, size * 0.18, size * 0.18);
  });

  // 30. Mirror Quad — 4-quadrant symmetry
  registerBrush('mirror-quad', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const cw = pg.width || 800;
    const ch = pg.height || 600;
    const mX = cw - x2;
    const mY = ch - y2;
    const coords = [[x2, y2], [mX, y2], [x2, mY], [mX, mY]];
    pg.stroke(color.r, color.g, color.b, a * 0.28);
    pg.strokeWeight(1);
    pg.noFill();
    pg.rectMode('center');
    for (const [cx, cy] of coords) {
      pg.rect(cx, cy, size * 0.72, size * 0.72);
      pg.rect(cx, cy, size * 0.32, size * 0.32);
      pg.noStroke();
      pg.fill(color.r, color.g, color.b, a * 0.22);
      pg.ellipse(cx, cy, size * 0.15, size * 0.15);
      pg.stroke(color.r, color.g, color.b, a * 0.28);
    }
  });

  // 31. Mirror Tri — 3-way rotational symmetry
  registerBrush('mirror-tri', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const fc = opts.frameCount || 0;
    const cx = (pg.width || 800) / 2;
    const cy = (pg.height || 600) / 2;
    const xRel = x2 - cx;
    const yRel = y2 - cy;
    pg.noStroke();
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i;
      const rX = cx + xRel * Math.cos(angle) - yRel * Math.sin(angle);
      const rY = cy + xRel * Math.sin(angle) + yRel * Math.cos(angle);
      pg.fill(color.r, color.g, color.b, a * 0.22);
      pg.ellipse(rX, rY, size * 0.45, size * 0.45);
      pg.fill(255, 255, 255, a * 0.72);
      pg.ellipse(rX, rY, size * 0.12, size * 0.12);
      const orbitAngle = fc * 0.08 + (i * Math.PI * 2) / 3;
      pg.fill(color.r, color.g, color.b, a * 0.5);
      pg.ellipse(rX + Math.cos(orbitAngle) * size * 0.42, rY + Math.sin(orbitAngle) * size * 0.42, size * 0.18, size * 0.18);
    }
  });

  // 32. Mirror Hex — 6-fold rotational symmetry
  registerBrush('mirror-hex', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const cx = (pg.width || 800) / 2;
    const cy = (pg.height || 600) / 2;
    const xRel = x2 - cx;
    const yRel = y2 - cy;
    pg.stroke(color.r, color.g, color.b, a * 0.26);
    pg.strokeWeight(0.75);
    pg.noFill();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const rX = cx + xRel * Math.cos(angle) - yRel * Math.sin(angle);
      const rY = cy + xRel * Math.sin(angle) + yRel * Math.cos(angle);
      pg.beginShape();
      for (let h = 0; h < 6; h++) {
        const hexAngle = (Math.PI * 2 / 6) * h;
        pg.vertex(rX + Math.cos(hexAngle) * size * 0.32, rY + Math.sin(hexAngle) * size * 0.32);
      }
      pg.endShape('close');
      pg.noStroke();
      pg.fill(color.r, color.g, color.b, a * 0.25);
      pg.ellipse(rX, rY, size * 0.14, size * 0.14);
      pg.stroke(color.r, color.g, color.b, a * 0.26);
    }
  });

  // 33. Mirror Twelve — 12-way rotational geometric lace
  registerBrush('mirror-twelve', (pg, x1, y1, x2, y2, color, size, opts) => {
    const a = opts.alpha !== undefined ? opts.alpha : 255;
    const cx = (pg.width || 800) / 2;
    const cy = (pg.height || 600) / 2;
    const xRel = x2 - cx;
    const yRel = y2 - cy;
    pg.stroke(color.r, color.g, color.b, a * 0.22);
    pg.strokeWeight(0.5);
    pg.noFill();
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      const rX = cx + xRel * Math.cos(angle) - yRel * Math.sin(angle);
      const rY = cy + xRel * Math.sin(angle) + yRel * Math.cos(angle);
      const sparkRad = size * 0.26;
      for (let s = 0; s < 3; s++) {
        const sAngle = (Math.PI / 3) * s;
        const dx = Math.cos(sAngle) * sparkRad;
        const dy = Math.sin(sAngle) * sparkRad;
        pg.line(rX - dx, rY - dy, rX + dx, rY + dy);
      }
      pg.noStroke();
      pg.fill(color.r, color.g, color.b, a * 0.32);
      pg.ellipse(rX, rY, size * 0.08, size * 0.08);
      pg.stroke(color.r, color.g, color.b, a * 0.22);
    }
  });

  // ============================================================
  // HELPERS
  // ============================================================

  function p5Dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function p5Lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function p5Constrain(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function p5Map(value, inMin, inMax, outMin, outMax) {
    const norm = (value - inMin) / (inMax - inMin);
    return outMin + norm * (outMax - outMin);
  }

  /**
   * Draw a 5-pointed star shape
   */
  function drawStarShape(pg, x, y, radius1, radius2, points) {
    const angleStep = Math.PI * 2 / points;
    const halfAngle = angleStep / 2;
    pg.beginShape();
    for (let a = 0; a < Math.PI * 2; a += angleStep) {
      let sx = x + Math.cos(a) * radius2;
      let sy = y + Math.sin(a) * radius2;
      pg.vertex(sx, sy);
      sx = x + Math.cos(a + halfAngle) * radius1;
      sy = y + Math.sin(a + halfAngle) * radius1;
      pg.vertex(sx, sy);
    }
    pg.endShape('close');
  }

  /**
   * Convert HSL to RGB (all 0-100/360 scale → 0-255)
   */
  function hslToRgb(h, s, l) {
    const hue = ((h % 360) + 360) % 360 / 360;
    const sat = Math.max(0, Math.min(100, s)) / 100;
    const lig = Math.max(0, Math.min(100, l)) / 100;

    if (sat === 0) {
      const v = Math.round(lig * 255);
      return { r: v, g: v, b: v };
    }

    const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat;
    const p = 2 * lig - q;

    function hueToRgb(t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    return {
      r: Math.round(hueToRgb(hue + 1 / 3) * 255),
      g: Math.round(hueToRgb(hue) * 255),
      b: Math.round(hueToRgb(hue - 1 / 3) * 255)
    };
  }

  // ============================================================
  // EXPORTS
  // ============================================================

  global.REGISTRY = REGISTRY; // alias for backward compat
  global.BRUSH_REGISTRY = REGISTRY;
  global.registerBrush = registerBrush;
  global.drawBrush = drawBrush;
  global.getBrushNames = getBrushNames;
  global.getBrushCount = getBrushCount;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      BRUSH_REGISTRY: REGISTRY,
      registerBrush,
      drawBrush,
      getBrushNames,
      getBrushCount
    };
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
