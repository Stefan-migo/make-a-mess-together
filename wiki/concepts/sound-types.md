# Sound Types (30 Voices)

Each slot (0–29) uses a distinct sound type. Sensor axes map to sound parameters.

| Slot | Type | Sensor → Parameter | Tone.js Chain |
|------|------|--------------------|---------------|
| 0 | SynthBasic | accel.y → pitch, gyro.z → filter | Osc → Env → AmpEnv → Gain |
| 1 | SynthFM | accel.x → mod index, orientation.β → carrier | FM synthesis |
| 2 | SynthAM | gyro.α → depth, accel.z → mod freq | Amplitude modulation |
| 3 | SynthDuo | orientation.γ → detune, accel.y → mix | Two detuned oscillators |
| 4 | SynthMono | gyro.β → glide, accel.x → portamento | Mono synth with glide |
| 5 | ArpRate | orientation.β → rate, accel.x → spread | Arpeggiator |
| 6 | ArpPattern | gyro.z → pattern, accel.y → octave | Pattern sequencer |
| 7 | ArpGate | orientation.α → gate, gyro.α → swing | Gate modulation |
| 8 | ArpDirection | accel.z → direction, gyro.β → steps | Arp direction |
| 9 | NoiseWhite | accel.z → cutoff, gyro.α → resonance | Noise → Filter → Gain |
| 10 | NoisePink | orientation.γ → volume, accel.x → pan | Pink noise spatial |
| 11 | NoiseBrown | gyro.β → LFO rate, accel.y → LFO depth | Modulated brown noise |
| 12 | Kick | accel magnitude → trigger, gyro.z → pitch | MembraneSynth triggered |
| 13 | Snare | orientation.β → noise mix, accel.y → decay | Noise + tone triggered |
| 14 | HiHat | gyro.α → cutoff, accel.z → decay | Filtered noise triggered |
| 15 | DrumPattern | orientation.γ → speed, accel.x → complexity | Gate sequencer |
| 16 | Tom | accel magnitude → trigger, gyro.β → pitch drop | Tuned membrane |
| 17 | Bitcrush | accel.x → bit depth, gyro.z → sample rate | Osc → BitCrusher → Gain |
| 18 | Stutter | orientation.γ → buffer, accel.y → stutter rate | Buffer repeat glitch |
| 19 | Wavefold | gyro.α → fold, accel.z → symmetry | Wavefolder distortion |
| 20 | GlitchRandom | accel.x → probability, gyro.β → interval | Random glitch triggers |
| 21 | GrainSize | gyro.β → grain size, accel.y → grain pitch | Granular size + pitch |
| 22 | GrainDensity | orientation.α → density, accel.z → spread | Granular density |
| 23 | GrainScatter | gyro.γ → position, accel.x → pan | Grain scatter |
| 24 | GrainPosition | accel.y → buffer pos, gyro.α → overlap | Buffer scan |
| 25 | Reverb | orientation.α → room, accel.z → wet/dry | Convolution-like reverb |
| 26 | Delay | gyro.β → time, accel.y → feedback | Ping-pong delay |
| 27 | Distortion | accel.x → amount, gyro.γ → gain | Waveshaper distortion |
| 28 | Chorus | orientation.β → depth, gyro.α → rate | Chorus/flanger |
| 29 | Compressor | accel.z → threshold, gyro.β → ratio | Dynamic compression |

Full spec: [PLAN.md](../../PLAN.md)
