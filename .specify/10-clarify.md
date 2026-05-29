# Clarification: New Mapping System (10-new-mapping-system)

**Spec ID**: `10-new-mapping-system`  
**Clarified**: 2026-05-29  
**Status**: Clarify

---

## Ambiguity 1: Default Mode for New Phone Connections

**Question**: When a phone connects for the first time (or reconnects), it doesn't send a mode — it just sends `{type: "sensor"}`. What mode should the bridge assign by default?

**Options**:
- **A**: ChordSpace — the primary compositional mode, most phones will use this
- **B**: Drums — percussive, immediate feedback
- **C**: Let the phone choose before connecting (requires modifying the connect flow)

**Impact**: Affects the `assignSlot()` function in index.js and the initial state of every new phone.

---

## Ambiguity 2: Where Does the Mode Selector Live?

**Question**: The spec says phones can change modes, but there are two possible UI locations:

- **Phone UI (phone-client/app.js)**: The phone screen shows ChordSpace/Drums/GestureCanvas buttons. Pro: immediate, tactile. Con: small screen, harder to update (Vercel deploy).
- **Dashboard (bridge dashboard)**: The dashboard on the laptop shows each connected phone with a mode dropdown. Pro: big screen, easy to update. Con: requires laptop + dashboard open.

**Options**:
- **A**: Only on the Dashboard. Phones just stream sensors, modes are assigned from the laptop.
- **B**: Only on the Phone. Each phone has 3 buttons.
- **C**: Both. Dashboard overrides phone's selection.

**Impact**: Changes which files we modify (phone-client/app.js vs server-bridge/public/dashboard.html).

---

## Ambiguity 3: Chord Progression — Does It Change the Root?

**Question**: In ChordSpace, when accel.y moves from Zone 0 (I) to Zone 1 (IV), does the chord progression change the ROOT note that chord tones are calculated from?

Example in key of C:
- accel.y = Zone 0 (I) → Root = C → accel.x zones: C, E, (G dead), B, D
- accel.y = Zone 1 (IV) → Root = F → accel.x zones: F, A, (C dead), E, G

**My assumption**: YES — the progression degree transposes the root. This is how functional harmony works. Please confirm.

---

## Ambiguity 4: Drums — Auto-Generated Hits vs. Pure Sensor Triggering

**Question**: The spec says "Rhythm pattern affects accent timing for auto-generated hits when no gesture is active." This implies the bridge auto-generates drum hits based on the pattern, which is a significant feature (a built-in drum sequencer).

**Options**:
- **A**: Pure sensor-driven. No auto-generated hits. The pattern selector ONLY affects velocity/accent mapping of sensor-triggered hits.
- **B**: Auto-generated. The bridge sequences hits based on the pattern (like a drum machine). Sensors add accents and variations on top.

**Impact**: A = simpler, B = much more complex (adds a sequencer engine to the bridge).

---

## Ambiguity 5: CC Mapping — Shared vs. Mode-Specific

**Question**: There's a conflict between the spec and the REAPER guide:

- **Spec (ChordSpace table)**: CC 1 = accel.z (filter cutoff)
- **REAPER guide (global CC table)**: CC 1 = accel.x (filter cutoff)

**Options**:
- **A**: Mode-specific CC mappings. Each mode defines its own CC assignments.
- **B**: Universal CC mapping. All modes send the same 9 CCs (1-9) from the same 9 sensor axes. Mode-specific CCs (11, 16, 17, 71, 74, 91, 93) are ADDITIONAL.

**My recommendation**: B — universal CC 1-9 stays the same across ALL modes. Mode-specific CCs (11-93) are sent on top. This way REAPER templates don't need to change per mode. Confirm?

---

## Ambiguity 6: ChordSpace — Dead Zone Behavior

**Question**: accel.x zone 2 (-1 to +1 m/s²) is the "5th" and is a dead zone (no note played). What happens to the previous note?

**Options**:
- **A**: Note Off is sent. The phone is silent in the dead zone.
- **B**: The previous note is sustained (legato). The phone only changes note when entering a NEW zone.
- **C**: The previous note fades out (send CC 11 volume to 0 gradually over 200ms).

**Impact**: A = most predictable for the user. B = smoothest musical experience. C = most expressive.

---

## Ambiguity 7: Gate Hysteresis for orientation.α

**Question**: The compass gate has active windows at 45-135° and 225-315°. At the boundary (e.g., 135°), small phone rotations could cause rapid note on/off flickering.

**My suggestion**: Implement 5° hysteresis on the gate boundaries:
- Entering ON at 45° (not 40°)
- Leaving ON at 40° (not 45°)

And similarly for the other boundaries. This is a standard Schmitt trigger pattern. Confirm this approach?

---

## Ambiguity 8: Old Phone Clients Without Mode Selector

**Question**: Phones that haven't been updated (old app.js) won't send `{type: "modeChange"}`. They'll just stream sensor data as before.

**My suggestion**: Old clients default to ChordSpace. The bridge treats any phone that doesn't send a modeChange as ChordSpace. This provides backward compatibility. Confirm?

---

## Ambiguity 9: Mode Change From Dashboard When MIDI Is Not Active

**Question**: If the bridge is running without `--midi` (WebSocket + p5 visuals only), the dashboard still shows mode selectors. Should mode changes work?

**Options**:
- **A**: Modes work regardless of MIDI. The bridge tracks modes, sends mode info to p5 visuals (which could affect visuals per mode).
- **B**: Modes only work with `--midi`. Dashboard shows "MIDI not active" if no `--midi` flag.

**Impact**: A = more flexible (modes could inform visuals too). B = simpler.

---

## Summary: Decisions Needed

| # | Issue | Decision |
|---|-------|----------|
| 1 | Default mode for new phones | **Elige antes de conectar** |
| 2 | Mode selector location | **Pantalla del teléfono** |
| 3 | Chord progression changes root | **SÍ — transposición** |
| 4 | Drums auto-generate hits | **Solo gestos** |
| 5 | CC mapping strategy | **Cada modo tiene sus propios CCs** |
| 6 | Dead zone behavior | **Fade out corto (~200ms)** |
| 7 | Gate hysteresis | **SÍ — 5° Schmitt trigger** |
| 8 | Old phone clients | **Reutilizar en visuales** |
| 9 | Modes without --midi | **Siempre funcionan** |

## Resolved Decisions

| # | Issue | Decision | Detail |
|---|-------|----------|--------|
| 1 | Default mode for new phones | **Elige antes de conectar** | Phone shows mode selector before WebSocket. Connection message includes `{type: "sensor", mode: "chordspace"}`. |
| 2 | Mode selector location | **Pantalla del teléfono** | Phone-client/app.js shows 3 mode buttons before connection + persistent during session. Dashboard can also show but phone is primary. |
| 3 | Chord progression changes root | **SÍ — transposición** | accel.y Zone 0 (I) = root from key. Zone 1 (IV) = +5 semitones from root. Zone 2 (V) = +7. Zone 3 (vi) = +9. Chord tones are recalculated from transposed root. |
| 4 | Drums auto-generate hits | **Solo gestos** | Pure sensor-driven. Pattern selector affects velocity mapping of user-triggered hits only. No auto-sequencer. |
| 5 | CC mapping strategy | **Cada modo tiene sus propios CCs** | ChordSpace, Drums, and GestureCanvas each define their own CC mapping table. No universal CC 1-9. |
| 6 | Dead zone behavior | **Fade out corto (~200ms)** | When entering accel.x zone 2 (dead zone), the previous note fades out over ~200ms using CC 11 (expression) ramp to 0. If re-enters a note zone within 200ms, the fade cancels. |
| 7 | Gate hysteresis | **SÍ — 5° Schmitt trigger** | orientation.α ON windows: 45-135° and 225-315°. Enter ON at 45°, leave ON at 40°. Same for all boundaries. |
| 8 | Old phone clients | **Reutilizar en visuales** | All phones get a mode. Old clients default to ChordSpace. The musical state (note, chord, drum hit, gesture data) is also sent to p5 sketch to control brush color/size/effects, synchronizing audio and visuals. |
| 9 | Modes without --midi | **Siempre funcionan** | Modes are tracked regardless of --midi flag. Without --midi, no MIDI output but musical state still flows to p5 visuals. |
