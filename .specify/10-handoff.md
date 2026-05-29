# Handoff: New Mapping System (10-new-mapping-system)

**To**: @Cortex-Developer  
**From**: @Cortex-Planner  
**Date**: 2026-05-29  
**Status**: Ready for Implementation

---

## Quick Summary

Replace 5 legacy MIDI modes (chaos, scale, theremin, chord, arp) with 3 richer compositional modes (ChordSpace, Drums, GestureCanvas). Add dynamic pool routing for MIDI channels, musical state feedback to p5 visuals, and remove Tone.js.

**28 tasks across 6 phases. ~50 new tests.**

---

## Key Decisions (from Clarify)

| # | Decision |
|---|----------|
| 1 | Phone selects mode BEFORE connecting (3 buttons in app) |
| 2 | Mode selector lives on the PHONE (not dashboard) |
| 3 | Chord progression changes ROOT (I=C → IV=F, tones recalculated) |
| 4 | Drums are PURE SENSOR — no auto-generated hits |
| 5 | Each mode has its OWN CC mapping (no universal CC 1-9) |
| 6 | Dead zone does FADE OUT (~200ms via CC 11 ramp) |
| 7 | Gate has 5° hysteresis (Schmitt trigger on orientation.α) |
| 8 | Old phone clients default to ChordSpace |
| 9 | Modes work even without --midi (musical state still flows to p5) |
| 10 | Musical state ALSO controls p5 visuals (brush color/size from notes) |
| 11 | Canvas is FREE (no more radial layout — accel maps to X,Y) |
| 12 | Brushes stay the same — musical state modulates existing brushes |

---

## Architecture Overview (What to Build)

```
Phone WebSocket → Bridge
  ├── MidiMapper.processSensor() → MIDI events
  │     └── MidiSender → ALSA virtual port → REAPER
  ├── MusicalStateGenerator → p5 players
  │     └── p5 sketch uses musical state + sensor data for visuals
  └── PoolRouter → channel assignment per mode
        ├── ChordSpace: CH 1-6
        ├── Drums: CH 7-8
        └── GestureCanvas: CH 9-10
```

---

## Phase Order (follow this exactly)

### Phase 1: Phone Mode Selector (4 tasks)
- Add 3 mode buttons to phone-client/app.js BEFORE the connect screen
- Connection message includes: `{type: "sensor", mode: "chordspace"}`
- Persistent mode pills during session to change mode
- Display pool capacity on phone (e.g., "ChordSpace: 3/6")

### Phase 2: Rewrite midi-mapper.js (9 tasks, biggest phase)
- DELETE all 5 legacy modes
- IMPLEMENT ChordSpace (zone detection, progression, gate, hysteresis, fade)
- IMPLEMENT Drums (spike detection, cooldown, GM note map, patterns)
- IMPLEMENT GestureCanvas (speed/direction/size/complexity/circularity, NO notes)
- ~33 new tests

### Phase 3: Pool Routing (5 tasks)
- `assignChannel(slot, mode)` with pool wrapping
- Handle modeChange messages with Note Off cleanup
- GET /api/pools endpoint
- Remove --mode CLI flag

### Phase 4: Musical State → Visuals (4 tasks)
- Bridge generates musicalState objects per slot → broadcasts to p5
- p5 visuals use musical state for brush color/size/effects
- Remove radial layout → free canvas (accel → X,Y)
- ~5 tests

### Phase 5: Tone.js Removal (3 tasks)
- DELETE p5-sketch/sound-engine.js
- Remove Tone.js from index.html and sketch.js
- Simplify device-manager.js to visual-only

### Phase 6: Cleanup + Docs (2 tasks)
- Remove old mode tests
- Update docs (REAPER-3POOL-TEMPLATE, MIDI-SETUP, DAW-INTEGRATION)

---

## Required Reading Before Starting

1. **Spec**: `.specify/specs/10-new-mapping-system.md` — full 396-line spec with all sensor mappings
2. **Clarify**: `.specify/10-clarify.md` — 9 resolved ambiguities with exact decisions
3. **Plan**: `.specify/10-plan.md` — 6-phase technical plan with pseudocode
4. **Tasks**: `.specify/specs/10-tasks.md` — 28 tasks, each with acceptance criteria
5. **AGENTS.md**: Follow the 5-Step Execution Gate (TDD RED → GRAPH CHECK → TDD GREEN → ATOMIC COMMIT → TDD REFACTOR → VERIFICATION GATE)

---

## Critical Constraints

- **TDD**: Write failing test FIRST, then implementation, then verify
- **Atomic commits**: One concern per commit (Phase 1 changes / Phase 2 changes, etc.)
- **All existing non-mode tests must pass**: ~100+ tests for bridge, sender, etc.
- **Mid-Phase 2, run `npm test`** — old mode tests will fail. That's expected. Remove them in Phase 6.
- **Phone client changes**: Remember the phone app is deployed on Vercel. The app.js and index.html changes need to work both locally and on Vercel.
- **Musical state**: The bridge sends musicalState messages to all p5 players via the existing broadcast mechanism. Don't add a new WebSocket.
- **CC mapping per mode**: This changes the REAPER template. Docs must be updated accordingly.

---

## Files That Will Change

```
MODIFY: phone-client/app.js               (Phases 1)
MODIFY: phone-client/index.html            (Phase 1)
MODIFY: phone-client/style.css             (Phase 1)
MODIFY: server-bridge/index.js             (Phases 3, 4)
REWRITE: server-bridge/midi-mapper.js       (Phase 2)
DELETE: p5-sketch/sound-engine.js           (Phase 5)
MODIFY: p5-sketch/index.html                (Phase 5)
MODIFY: p5-sketch/sketch.js                 (Phases 4, 5)
MODIFY: p5-sketch/visuals.js                (Phase 4)
MODIFY: p5-sketch/device-manager.js         (Phases 4, 5)
MODIFY: p5-sketch/config.js                 (maybe — remove radial layout)
MODIFY: tests/server-bridge/midi-mapper.test.js (Phases 2, 6)
MODIFY: tests/server-bridge/midi-integration.test.js (Phases 3, 6)
CREATE: tests/p5-sketch/visuals.test.js     (Phase 4)
MODIFY: docs/REAPER-3POOL-TEMPLATE.md       (Phase 6)
MODIFY: docs/MIDI-SETUP.md                  (Phase 6)
MODIFY: docs/DAW-INTEGRATION.md             (Phase 6)
```

---

## Start with Phase 1

Begin with T1.1: Add mode selection UI before connection. Follow the 5-Step Gate:

```
Step 0: TDD RED → Write failing test for mode selector
Step 1: GRAPH CHECK → query_graph for phone-client
Step 2: TDD GREEN → Implement mode selector
Step 3: ATOMIC COMMIT → commit "feat: add mode selector to phone client"
Step 4: TDD REFACTOR → Clean up while tests pass
Step 5: VERIFICATION → npm test, manual check
```

Good luck!
