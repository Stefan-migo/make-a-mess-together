# Graph Report - CortexPlugin  (2026-05-20)

## Corpus Check
- 40 files · ~62,011 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 334 nodes · 516 edges · 16 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 19|Community 19]]

## God Nodes (most connected - your core abstractions)
1. `SoundEngine` - 63 edges
2. `Visuals` - 16 edges
3. `startCommand()` - 15 edges
4. `closeCommand()` - 14 edges
5. `info()` - 14 edges
6. `warn()` - 13 edges
7. `initCommand()` - 12 edges
8. `StatsAggregator` - 12 edges
9. `updateCommand()` - 11 edges
10. `SlotAllocator` - 11 edges

## Surprising Connections (you probably didn't know these)
- `parseArgs()` --calls--> `next()`  [INFERRED]
  scripts/simulate-phones.js → tests/p5-sketch/sound-engine.test.js
- `closeCommand()` --calls--> `generateRetrospective()`  [INFERRED]
  cli/src/commands/close.ts → cli/src/engine/session.ts
- `closeCommand()` --calls--> `saveRetrospective()`  [INFERRED]
  cli/src/commands/close.ts → cli/src/engine/session.ts
- `initCommand()` --calls--> `copyTemplate()`  [INFERRED]
  cli/src/commands/init.ts → cli/src/engine/template.ts
- `initCommand()` --calls--> `generateManifest()`  [INFERRED]
  cli/src/commands/init.ts → cli/src/engine/manifest.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (1): SoundEngine

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (43): analyzeCommand(), extractThemes(), findProjectRoot(), readProjectName(), closeCommand(), promptForSummary(), readOpenCodeConfig(), writeOpenCodeConfig() (+35 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (17): next(), ConsoleUI, formatTime(), gaussianRandom(), generateIdle(), generateMixed(), generateNoise(), generateSine() (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (28): cacheDom(), connect(), getBridgeIp(), getReconnectDelay(), handleAssignedMessage(), handleBridgeMessage(), handleConnectClick(), handleDeviceMotion() (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (1): Visuals

### Community 5 - "Community 5"
Cohesion: 0.2
Nodes (1): SlotAllocator

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (9): detectChanges(), generateManifest(), collectFiles(), copyTemplate(), hashDirectory(), hashFile(), isTextFile(), kebabCase() (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (1): AudioBus

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (1): DeviceManager

### Community 9 - "Community 9"
Cohesion: 0.31
Nodes (5): broadcastState(), broadcastToPlayers(), getLanIp(), handleSensorConnect(), handleSensorMessage()

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (1): MCPClient

### Community 13 - "Community 13"
Cohesion: 0.25
Nodes (1): MessageRelay

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (2): connectWebSocket(), setup()

### Community 15 - "Community 15"
Cohesion: 0.7
Nodes (4): calculateDuration(), findProjectRoot(), runTool(), statusCommand()

### Community 16 - "Community 16"
Cohesion: 0.8
Nodes (4): addProject(), ensureConfigDir(), readConfig(), writeConfig()

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (2): checkDeps(), exec()

## Knowledge Gaps
- **Thin community `Community 0`** (64 nodes): `sound-engine.js`, `SoundEngine`, `.constructor()`, `._createArpDirection()`, `._createArpGate()`, `._createArpPattern()`, `._createArpRate()`, `._createBitcrush()`, `._createDrumPattern()`, `._createFxModulator()`, `._createGlitchRandom()`, `._createGrainDensity()`, `._createGrainPosition()`, `._createGrainScatter()`, `._createGrainSize()`, `._createGranularVoice()`, `._createHiHat()`, `._createKick()`, `._createNoiseBrown()`, `._createNoisePink()`, `._createNoiseWhite()`, `._createSnare()`, `._createStutter()`, `._createSynthAM()`, `._createSynthBasic()`, `._createSynthDuo()`, `._createSynthFM()`, `._createSynthMono()`, `._createTom()`, `.createVoice()`, `._createWavefold()`, `.disposeVoice()`, `._foldCurve()`, `._makeArpVoice()`, `._makeSendGains()`, `._mapArpDirection()`, `._mapArpGate()`, `._mapArpPattern()`, `._mapArpRate()`, `._mapBitcrush()`, `._mapDrumPattern()`, `._mapFxModulator()`, `._mapGlitchRandom()`, `._mapGrainDensity()`, `._mapGrainPosition()`, `._mapGrainScatter()`, `._mapGrainSize()`, `._mapHiHat()`, `._mapKick()`, `._mapNoiseBrown()`, `._mapNoisePink()`, `._mapNoiseWhite()`, `._mapSnare()`, `._mapStutter()`, `._mapSynthAM()`, `._mapSynthBasic()`, `._mapSynthDuo()`, `._mapSynthFM()`, `._mapSynthMono()`, `._mapTom()`, `._mapWavefold()`, `._spawnGrain()`, `._startGranularScheduler()`, `.updateVoice()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 4`** (17 nodes): `visuals.js`, `Visuals`, `.constructor()`, `.createVisual()`, `.disposeAll()`, `.disposeVisual()`, `._draw()`, `.drawAll()`, `._factory()`, `._getCtx()`, `._getRadialPosition()`, `._getSensor()`, `._getSensorVal()`, `._makeState()`, `._norm()`, `._scale()`, `.updateVisual()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (12 nodes): `slot-allocator.js`, `SlotAllocator`, `.activeCount()`, `.allocate()`, `._cleanExpiredCooldowns()`, `.constructor()`, `.destroy()`, `.free()`, `.getAllocatedSlots()`, `.isAllocated()`, `.isOnCooldown()`, `.startCooldown()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (11 nodes): `AudioBus`, `.constructor()`, `.delaySend()`, `.dispose()`, `.limiter()`, `.masterGain()`, `.reverbSend()`, `.setDelayParam()`, `.setMasterVolume()`, `.setReverbParam()`, `audio-bus.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (11 nodes): `DeviceManager`, `.activeCount()`, `.activeSlots()`, `.assign()`, `.constructor()`, `.disconnect()`, `.disposeAll()`, `.drawHUD()`, `.isSlotActive()`, `.updateSensor()`, `device-manager.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (8 nodes): `mcp.ts`, `MCPClient`, `.callTool()`, `.close()`, `.constructor()`, `.initialize()`, `.rejectAll()`, `.sendNotification()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (8 nodes): `message-relay.js`, `MessageRelay`, `.detectRole()`, `.formatAssignMessage()`, `.formatCountMessage()`, `.formatDisconnectMessage()`, `.formatSensorMessage()`, `.validateSensorMessage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (7 nodes): `connectWebSocket()`, `draw()`, `handleMessage()`, `sketch.js`, `mousePressed()`, `setup()`, `windowResized()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (3 nodes): `deps.ts`, `checkDeps()`, `exec()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `initCommand()` connect `Community 1` to `Community 16`, `Community 6`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `startCommand()` (e.g. with `heading()` and `error()`) actually correct?**
  _`startCommand()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `closeCommand()` (e.g. with `heading()` and `error()`) actually correct?**
  _`closeCommand()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `info()` (e.g. with `analyzeCommand()` and `closeCommand()`) actually correct?**
  _`info()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._