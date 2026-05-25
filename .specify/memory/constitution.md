# phone-sensor-orchestra Constitution

## Core Principles

### I. Sensor-First Design
Every feature is driven by real sensor data. Sound and visual parameters map directly to accelerometer, gyroscope, and orientation axes. No synthetic control data.

### II. Real-Time First
All data flows over LAN WebSocket for minimal latency. Bridge relays messages individually (not batched). Phone sends at 30fps — consistent stream, not burst.

### III. 30-Slot Architecture
The system supports exactly 30 simultaneous devices. Each slot has a unique sound type and visual type. Slot zero is always the lowest available — linear scan, no priority.

### IV. Cleanup Discipline
Every voice and visual must be disposable. On disconnect: free slot, dispose Tone.js nodes, remove visual elements. No memory leaks — WebAudio nodes must be explicitly disconnected.

### V. Simplicity
Synthetic sounds only — no sample files. Minimal visual style — no textures, no external assets. CDN-loaded dependencies only.

## Technology Stack
- **Bridge**: Node.js with `ws` library + built-in HTTP server
- **Phone Client**: Vanilla HTML/CSS/JS (no framework), DeviceMotion + DeviceOrientation APIs
- **p5 Sketch**: p5.js 1.9, Tone.js 14.7, osc-js 2.4 (all CDN)
- **Deploy**: Vercel for static files, local laptop for bridge + p5

## Development Workflow
1. Spec-first: define sensor mapping in spec before coding
2. Per-module commits: bridge / phone / p5 never mixed
3. Verify data flow end-to-end after each module change
4. Test with minimum 2 phones before marking done
5. Document every sensor mapping decision in wiki

## Governance
This constitution supersedes general practices for phone-sensor-orchestra work. Sensor mapping decisions must be documented. Voice/visual type additions require spec approval.

### VI. Test-Driven Development

Every feature requires a failing test before implementation. No test = no code.

**Scope**: All deterministic logic MUST be tested — slot allocation, sensor mapping, voice lifecycle, protocol parsing, state machines, mathematical computations.

**Excluded from automated testing**: Visual rendering output (p5 draw calls), audio quality perception (subjective). Their *computation logic* IS tested.

**The TDD Cycle**:
1. **RED**: Write a failing test for ONE behavior. Run it → confirm it fails.
2. **GREEN**: Write the MINIMUM implementation code to pass the test.
3. **REFACTOR**: Clean up code while keeping the test green.

**Discipline**: If a commit has no test, it MUST be one of the excluded categories and explicitly justified.

**Tooling**: The community SpecTest extension (`spec-kit-spectest`) was not available at setup time. Re-check availability on next Spec-Kit update: `specify extension add spec-kit-spectest`.

**Version**: 1.1.0 | **Ratified**: 2026-05-19
