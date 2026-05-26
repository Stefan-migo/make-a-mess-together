(function(global) {
  class SoundEngine {
    constructor(audioBus) {
      this._audioBus = audioBus;
      this._factory = {
        synthBasic: this._createSynthBasic.bind(this),
        synthFM: this._createSynthFM.bind(this),
        synthAM: this._createSynthAM.bind(this),
        synthDuo: this._createSynthDuo.bind(this),
        synthMono: this._createSynthMono.bind(this),
        arpRate: this._createArpRate.bind(this),
        arpPattern: this._createArpPattern.bind(this),
        arpGate: this._createArpGate.bind(this),
        arpDirection: this._createArpDirection.bind(this),
        noiseWhite: this._createNoiseWhite.bind(this),
        noisePink: this._createNoisePink.bind(this),
        noiseBrown: this._createNoiseBrown.bind(this),
        kick: this._createKick.bind(this),
        snare: this._createSnare.bind(this),
        hiHat: this._createHiHat.bind(this),
        drumPattern: this._createDrumPattern.bind(this),
        tom: this._createTom.bind(this),
        bitcrush: this._createBitcrush.bind(this),
        stutter: this._createStutter.bind(this),
        wavefold: this._createWavefold.bind(this),
        glitchRandom: this._createGlitchRandom.bind(this),
        grainSize: this._createGrainSize.bind(this),
        grainDensity: this._createGrainDensity.bind(this),
        grainScatter: this._createGrainScatter.bind(this),
        grainPosition: this._createGrainPosition.bind(this),
        reverb: this._createFxModulator.bind(this),
        delay: this._createFxModulator.bind(this),
        distortion: this._createFxModulator.bind(this),
        chorus: this._createFxModulator.bind(this),
        compressor: this._createFxModulator.bind(this)
      };
      this._updaters = {
        synthBasic: this._mapSynthBasic.bind(this),
        synthFM: this._mapSynthFM.bind(this),
        synthAM: this._mapSynthAM.bind(this),
        synthDuo: this._mapSynthDuo.bind(this),
        synthMono: this._mapSynthMono.bind(this),
        arpRate: this._mapArpRate.bind(this),
        arpPattern: this._mapArpPattern.bind(this),
        arpGate: this._mapArpGate.bind(this),
        arpDirection: this._mapArpDirection.bind(this),
        noiseWhite: this._mapNoiseWhite.bind(this),
        noisePink: this._mapNoisePink.bind(this),
        noiseBrown: this._mapNoiseBrown.bind(this),
        kick: this._mapKick.bind(this),
        snare: this._mapSnare.bind(this),
        hiHat: this._mapHiHat.bind(this),
        drumPattern: this._mapDrumPattern.bind(this),
        tom: this._mapTom.bind(this),
        bitcrush: this._mapBitcrush.bind(this),
        stutter: this._mapStutter.bind(this),
        wavefold: this._mapWavefold.bind(this),
        glitchRandom: this._mapGlitchRandom.bind(this),
        grainSize: this._mapGrainSize.bind(this),
        grainDensity: this._mapGrainDensity.bind(this),
        grainScatter: this._mapGrainScatter.bind(this),
        grainPosition: this._mapGrainPosition.bind(this),
        reverb: this._mapFxModulator.bind(this),
        delay: this._mapFxModulator.bind(this),
        distortion: this._mapFxModulator.bind(this),
        chorus: this._mapFxModulator.bind(this),
        compressor: this._mapFxModulator.bind(this)
      };
    }

    createVoice(slot, config) {
      const type = config.soundType;
      const factory = this._factory[type];
      if (!factory) return null;
      return factory(slot, config);
    }

    updateVoice(voice, sensorData, config) {
      if (!voice) return;
      const updater = this._updaters[voice.type];
      if (!updater) return;
      updater(voice, sensorData, config);
    }

    disposeVoice(voice) {
      if (!voice) return;
      if (typeof voice.dispose === 'function') {
        voice.dispose();
      }
    }

    // --- Shared helper for creating voice nodes ---

    _makeSendGains(master) {
      const reverbGain = new Tone.Gain(0.3);
      const delayGain = new Tone.Gain(0.1);
      master.connect(reverbGain);
      master.connect(delayGain);
      reverbGain.connect(this._audioBus.reverbSend);
      delayGain.connect(this._audioBus.delaySend);
      master.connect(this._audioBus.masterGain);
      return { reverb: 0.3, delay: 0.1, _reverbGain: reverbGain, _delayGain: delayGain };
    }

    // ========================
    // SYNTH TYPES (0-4)
    // ========================

    _createSynthBasic(slot, config) {
      const osc = new Tone.Oscillator({ type: 'sine', frequency: 440 });
      const filter = new Tone.Filter({ type: 'lowpass', frequency: 2000, rolloff: -12 });
      const env = new Tone.AmplitudeEnvelope({ attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 });
      const gain = new Tone.Gain(1);

      osc.connect(filter);
      filter.connect(env);
      env.connect(gain);
      env.triggerAttack();
      osc.start();

      const sends = this._makeSendGains(gain);

      const voice = {
        type: 'synthBasic',
        slot,
        nodes: { osc, filter, env, gain },
        sendGains: { reverb: sends.reverb, delay: sends.delay },
        lastSensorData: null,
        isTriggered: false,
        dispose: () => {
          osc.stop();
          osc.dispose();
          filter.dispose();
          env.dispose();
          gain.dispose();
          sends._reverbGain.dispose();
          sends._delayGain.dispose();
        }
      };
      return voice;
    }

    _mapSynthBasic(voice, sd, config) {
      const osc = voice.nodes.osc;
      const filter = voice.nodes.filter;
      if (sd.pitch !== undefined) osc.frequency.value = sd.pitch;
      if (sd.filter !== undefined) filter.frequency.value = sd.filter;
    }

    _createSynthFM(slot, config) {
      const carrier = new Tone.Oscillator({ type: 'sine', frequency: 440 });
      const modulator = new Tone.Oscillator({ type: 'sine', frequency: 220 });
      const modGain = new Tone.Gain(1);
      const filter = new Tone.Filter({ type: 'lowpass', frequency: 4000, rolloff: -12 });
      const env = new Tone.AmplitudeEnvelope({ attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 });
      const gain = new Tone.Gain(1);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(filter);
      filter.connect(env);
      env.connect(gain);
      env.triggerAttack();
      carrier.start();
      modulator.start();

      const sends = this._makeSendGains(gain);

      return {
        type: 'synthFM',
        slot,
        nodes: { carrier, modulator, modGain, filter, env, gain },
        sendGains: { reverb: sends.reverb, delay: sends.delay },
        lastSensorData: null,
        isTriggered: false,
        dispose: () => {
          carrier.stop(); carrier.dispose();
          modulator.stop(); modulator.dispose();
          modGain.dispose(); filter.dispose(); env.dispose();
          gain.dispose(); sends._reverbGain.dispose(); sends._delayGain.dispose();
        }
      };
    }

    _mapSynthFM(voice, sd) {
      const nodes = voice.nodes;
      if (sd.modIndex !== undefined) nodes.modGain.gain.value = sd.modIndex;
      if (sd.carrier !== undefined) nodes.carrier.frequency.value = sd.carrier;
    }

    _createSynthAM(slot, config) {
      const carrier = new Tone.Oscillator({ type: 'sine', frequency: 440 });
      const modOsc = new Tone.Oscillator({ type: 'sine', frequency: 5 });
      const modGain = new Tone.Gain(0.5);
      const gain = new Tone.Gain(1);

      modOsc.connect(modGain);
      modGain.connect(gain.gain);
      carrier.connect(gain);

      carrier.start();
      modOsc.start();

      const sends = this._makeSendGains(gain);

      return {
        type: 'synthAM',
        slot,
        nodes: { carrier, modOsc, modGain, gain },
        sendGains: { reverb: sends.reverb, delay: sends.delay },
        lastSensorData: null,
        isTriggered: false,
        dispose: () => {
          carrier.stop(); carrier.dispose();
          modOsc.stop(); modOsc.dispose();
          modGain.dispose(); gain.dispose();
          sends._reverbGain.dispose(); sends._delayGain.dispose();
        }
      };
    }

    _mapSynthAM(voice, sd) {
      if (sd.depth !== undefined) voice.nodes.modGain.gain.value = sd.depth;
      if (sd.modFreq !== undefined) voice.nodes.modOsc.frequency.value = sd.modFreq;
    }

    _createSynthDuo(slot, config) {
      const osc1 = new Tone.Oscillator({ type: 'sawtooth', frequency: 440 });
      const osc2 = new Tone.Oscillator({ type: 'sawtooth', frequency: 442 });
      const gain1 = new Tone.Gain(1);
      const gain2 = new Tone.Gain(1);
      const mixGain = new Tone.Gain(1);
      const filter = new Tone.Filter({ type: 'lowpass', frequency: 5000, rolloff: -12 });
      const env = new Tone.AmplitudeEnvelope({ attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4 });

      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(mixGain);
      gain2.connect(mixGain);
      mixGain.connect(filter);
      filter.connect(env);
      env.connect(this._audioBus.masterGain);
      env.triggerAttack();
      osc1.start();
      osc2.start();

      return {
        type: 'synthDuo',
        slot,
        nodes: { osc1, osc2, gain1, gain2, mixGain, filter, env },
        sendGains: { reverb: 0, delay: 0 },
        lastSensorData: null,
        isTriggered: false,
        dispose: () => {
          osc1.stop(); osc1.dispose();
          osc2.stop(); osc2.dispose();
          gain1.dispose(); gain2.dispose(); mixGain.dispose();
          filter.dispose(); env.dispose();
        }
      };
    }

    _mapSynthDuo(voice, sd) {
      if (sd.detune !== undefined) {
        voice.nodes.osc1.detune.value = -sd.detune;
        voice.nodes.osc2.detune.value = sd.detune;
      }
      if (sd.mix !== undefined) {
        voice.nodes.gain1.gain.value = 1 - sd.mix;
        voice.nodes.gain2.gain.value = sd.mix;
      }
    }

    _createSynthMono(slot, config) {
      const osc = new Tone.Oscillator({ type: 'triangle', frequency: 220 });
      const filter = new Tone.Filter({ type: 'lowpass', frequency: 3000, rolloff: -12 });
      const env = new Tone.AmplitudeEnvelope({ attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.3 });
      const gain = new Tone.Gain(1);

      osc.connect(filter);
      filter.connect(env);
      env.connect(gain);
      env.triggerAttack();
      osc.start();

      const sends = this._makeSendGains(gain);

      return {
        type: 'synthMono',
        slot,
        nodes: { osc, filter, env, gain },
        sendGains: { reverb: sends.reverb, delay: sends.delay },
        lastSensorData: null,
        isTriggered: false,
        dispose: () => {
          osc.stop(); osc.dispose();
          filter.dispose(); env.dispose(); gain.dispose();
          sends._reverbGain.dispose(); sends._delayGain.dispose();
        }
      };
    }

    _mapSynthMono(voice, sd) {
      if (sd.glide !== undefined) voice.nodes.osc.frequency.rampTo(voice.nodes.osc.frequency.value, sd.glide);
      if (sd.portamento !== undefined) voice.nodes.env.attack = sd.portamento;
    }

    // ========================
    // ARP TYPES (5-8)
    // ========================

    _makeArpVoice(slot, config) {
      const notes = ['C3', 'E3', 'G3', 'C4'];
      const osc = new Tone.Oscillator({ type: 'square', frequency: 440 });
      const filter = new Tone.Filter({ type: 'lowpass', frequency: 5000, rolloff: -12 });
      const env = new Tone.AmplitudeEnvelope({ attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 });
      const gain = new Tone.Gain(1);

      osc.connect(filter);
      filter.connect(env);
      env.connect(gain);
      osc.start();

      const sends = this._makeSendGains(gain);

      const voice = {
        type: 'arpRate',
        slot,
        nodes: { osc, filter, env, gain },
        sendGains: { reverb: sends.reverb, delay: sends.delay },
        lastSensorData: null,
        isTriggered: false,
        _interval: null,
        _noteIndex: 0,
        _arpNotes: notes,
        _arpDirection: 'up',
        dispose: () => {
          if (voice._interval) {
            clearInterval(voice._interval);
            voice._interval = null;
          }
          osc.stop(); osc.dispose();
          filter.dispose(); env.dispose(); gain.dispose();
          sends._reverbGain.dispose(); sends._delayGain.dispose();
        }
      };

      voice._interval = setInterval(() => {
        const note = voice._arpNotes[voice._noteIndex % voice._arpNotes.length];
        voice._noteIndex++;
        voice.nodes.osc.frequency.value = Tone.Frequency(note).toFrequency();
        voice.nodes.env.triggerAttackRelease('16n', Tone.now());
      }, 200);

      return voice;
    }

    _createArpRate(slot, config) {
      const voice = this._makeArpVoice(slot, config);
      voice.type = 'arpRate';
      return voice;
    }

    _mapArpRate(voice, sd) {
      if (sd.rate !== undefined) {
        const ms = Math.max(50, Math.min(2000, 1000 / sd.rate));
        if (voice._interval) {
          clearInterval(voice._interval);
        }
        voice._interval = setInterval(() => {
          const note = voice._arpNotes[voice._noteIndex % voice._arpNotes.length];
          voice._noteIndex++;
          voice.nodes.osc.frequency.value = Tone.Frequency(note).toFrequency();
          voice.nodes.env.triggerAttackRelease('16n', Tone.now());
        }, ms);
      }
      if (sd.spread !== undefined) {
        const notes = ['C3', 'E3', 'G3', 'C4'];
        const oct = Math.max(1, Math.min(4, Math.round(sd.spread)));
        const shifted = notes.map(n => {
          const parts = n.match(/([A-G]#?)(\d)/);
          return parts ? parts[1] + (parseInt(parts[2]) + oct - 1) : n;
        });
        voice._arpNotes = shifted;
      }
    }

    _createArpPattern(slot, config) {
      const voice = this._makeArpVoice(slot, config);
      voice.type = 'arpPattern';
      return voice;
    }

    _mapArpPattern(voice, sd) {
      const patterns = ['up', 'down', 'upDown', 'random'];
      if (sd.pattern !== undefined) {
        const idx = Math.max(0, Math.min(3, Math.round(sd.pattern)));
        voice._arpDirection = patterns[idx];
      }
      if (sd.octave !== undefined) {
        const oct = Math.max(1, Math.min(4, Math.round(sd.octave)));
        const baseNotes = ['C', 'E', 'G'];
        voice._arpNotes = baseNotes.map(n => n + oct);
      }
    }

    _createArpGate(slot, config) {
      const voice = this._makeArpVoice(slot, config);
      voice.type = 'arpGate';
      return voice;
    }

    _mapArpGate(voice, sd) {
      if (sd.gate !== undefined) voice.nodes.env.decay = sd.gate;
      if (sd.swing !== undefined) {
        // Swing shifts alternate notes
      }
    }

    _createArpDirection(slot, config) {
      const voice = this._makeArpVoice(slot, config);
      voice.type = 'arpDirection';
      return voice;
    }

    _mapArpDirection(voice, sd) {
      const dirs = ['up', 'down', 'upDown', 'random'];
      if (sd.direction !== undefined) {
        const idx = Math.max(0, Math.min(3, Math.round(sd.direction)));
        voice._arpDirection = dirs[idx];
      }
      if (sd.steps !== undefined) {
        const count = Math.max(2, Math.min(16, Math.round(sd.steps)));
        const base = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const notes = [];
        for (let i = 0; i < count; i++) {
          notes.push(base[i % 12] + '4');
        }
        voice._arpNotes = notes;
      }
    }

    // ========================
    // NOISE TYPES (9-11)
    // ========================

    _createNoiseWhite(slot, config) {
      const noise = new Tone.Noise({ type: 'white' });
      const filter = new Tone.Filter({ type: 'lowpass', frequency: 4000, rolloff: -12 });
      const gain = new Tone.Gain(1);

      noise.connect(filter);
      filter.connect(gain);
      noise.start();

      const sends = this._makeSendGains(gain);

      return {
        type: 'noiseWhite',
        slot,
        nodes: { noise, filter, gain },
        sendGains: { reverb: sends.reverb, delay: sends.delay },
        lastSensorData: null,
        isTriggered: false,
        dispose: () => {
          noise.stop(); noise.dispose();
          filter.dispose(); gain.dispose();
          sends._reverbGain.dispose(); sends._delayGain.dispose();
        }
      };
    }

    _mapNoiseWhite(voice, sd) {
      if (sd.cutoff !== undefined) voice.nodes.filter.frequency.value = sd.cutoff;
      if (sd.resonance !== undefined) voice.nodes.filter.Q.value = sd.resonance;
    }

    _createNoisePink(slot, config) {
      const noise = new Tone.Noise({ type: 'pink' });
      const pan = new Tone.Panner(0);
      const gain = new Tone.Gain(1);

      noise.connect(pan);
      pan.connect(gain);
      noise.start();

      const sends = this._makeSendGains(gain);

      return {
        type: 'noisePink',
        slot,
        nodes: { noise, pan, gain },
        sendGains: { reverb: sends.reverb, delay: sends.delay },
        lastSensorData: null,
        isTriggered: false,
        dispose: () => {
          noise.stop(); noise.dispose();
          pan.dispose(); gain.dispose();
          sends._reverbGain.dispose(); sends._delayGain.dispose();
        }
      };
    }

    _mapNoisePink(voice, sd) {
      if (sd.volume !== undefined) voice.nodes.gain.gain.value = sd.volume;
      if (sd.pan !== undefined) voice.nodes.pan.value = sd.pan;
    }

    _createNoiseBrown(slot, config) {
      const noise = new Tone.Noise({ type: 'brown' });
      const filter = new Tone.Filter({ type: 'lowpass', frequency: 2000, rolloff: -12 });
      const lfo = new Tone.LFO({ type: 'sine', frequency: 0.5, min: 200, max: 4000 });
      const gain = new Tone.Gain(1);

      lfo.connect(filter.frequency);
      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      lfo.start();

      const sends = this._makeSendGains(gain);

      return {
        type: 'noiseBrown',
        slot,
        nodes: { noise, filter, lfo, gain },
        sendGains: { reverb: sends.reverb, delay: sends.delay },
        lastSensorData: null,
        isTriggered: false,
        dispose: () => {
          noise.stop(); noise.dispose();
          filter.dispose(); lfo.stop(); lfo.dispose();
          gain.dispose();
          sends._reverbGain.dispose(); sends._delayGain.dispose();
        }
      };
    }

    _mapNoiseBrown(voice, sd) {
      if (sd.lfoRate !== undefined) voice.nodes.lfo.frequency.value = sd.lfoRate;
      if (sd.lfoDepth !== undefined) {
        voice.nodes.lfo.max = 200 + sd.lfoDepth * 7800;
        voice.nodes.lfo.min = 200;
      }
    }

    // ========================
    // DRUM TYPES (12-16)
    // ========================

    _createKick(slot, config) {
      const synth = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 5, envelope: { attack: 0.001, decay: 0.4, sustain: 0 } });
      const gain = new Tone.Gain(1);
      synth.connect(gain);
      gain.connect(this._audioBus.masterGain);

      return {
        type: 'kick',
        slot,
        nodes: { synth, gain },
        sendGains: { reverb: 0, delay: 0 },
        lastSensorData: null,
        isTriggered: false,
        lastMagnitude: 0,
        dispose: () => { synth.dispose(); gain.dispose(); }
      };
    }

    _mapKick(voice, sd, config) {
      if (sd.pitch !== undefined) voice.nodes.synth.frequency.value = sd.pitch;
      if (sd.trigger !== undefined) {
        const threshold = config.drumThreshold || 15;
        const hystThreshold = threshold * (config.drumHysteresisRatio || 0.5);
        const mag = sd.trigger;
        if (mag > threshold && !voice.isTriggered) {
          voice.isTriggered = true;
          voice.nodes.synth.triggerAttackRelease('C2', '8n');
        } else if (mag < hystThreshold) {
          voice.isTriggered = false;
        }
        voice.lastMagnitude = mag;
      }
    }

    _createSnare(slot, config) {
      const noise = new Tone.Noise({ type: 'white' });
      const noiseEnv = new Tone.Gain(0);
      const toneSynth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } });
      const gain = new Tone.Gain(1);

      noise.connect(noiseEnv);
      noiseEnv.connect(gain);
      toneSynth.connect(gain);
      gain.connect(this._audioBus.masterGain);
      noise.start();

      return {
        type: 'snare',
        slot,
        nodes: { noise, noiseEnv, toneSynth, gain },
        sendGains: { reverb: 0, delay: 0 },
        lastSensorData: null,
        isTriggered: false,
        dispose: () => {
          noise.stop(); noise.dispose();
          noiseEnv.dispose(); toneSynth.dispose(); gain.dispose();
        }
      };
    }

    _mapSnare(voice, sd) {
      if (sd.noiseMix !== undefined) voice.nodes.noiseEnv.gain.value = sd.noiseMix * 0.5;
      if (sd.decay !== undefined) {
        voice.nodes.toneSynth.envelope.decay = sd.decay;
        // Trigger on any sensor data (threshold-based in DeviceManager)
      }
    }

    _createHiHat(slot, config) {
      const noise = new Tone.Noise({ type: 'white' });
      const filter = new Tone.Filter({ type: 'highpass', frequency: 8000, rolloff: -12 });
      const env = new Tone.Gain(0);
      const gain = new Tone.Gain(1);

      noise.connect(filter);
      filter.connect(env);
      env.connect(gain);
      gain.connect(this._audioBus.masterGain);
      noise.start();

      return {
        type: 'hiHat',
        slot,
        nodes: { noise, filter, env, gain },
        sendGains: { reverb: 0, delay: 0 },
        lastSensorData: null,
        isTriggered: false,
        lastTriggerTime: 0,
        dispose: () => {
          noise.stop(); noise.dispose();
          filter.dispose(); env.dispose(); gain.dispose();
        }
      };
    }

    _mapHiHat(voice, sd) {
      if (sd.cutoff !== undefined) voice.nodes.filter.frequency.value = sd.cutoff;
      if (sd.decay !== undefined) {
        const now = Tone.now();
        if (now - voice.lastTriggerTime > 0.05) {
          voice.lastTriggerTime = now;
          voice.nodes.env.gain.setValueAtTime(0.5, now);
          voice.nodes.env.gain.exponentialRampToValueAtTime(0.001, now + sd.decay);
        }
      }
    }

    _createDrumPattern(slot, config) {
      const synths = [];
      const gain = new Tone.Gain(1);
      gain.connect(this._audioBus.masterGain);

      for (let i = 0; i < 4; i++) {
        const s = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 5 });
        s.connect(gain);
        synths.push(s);
      }

      const voice = {
        type: 'drumPattern',
        slot,
        nodes: { synths, gain },
        sendGains: { reverb: 0, delay: 0 },
        lastSensorData: null,
        isTriggered: false,
        _step: 0,
        _interval: null,
        dispose: null
      };

      voice._interval = setInterval(() => {
        const step = voice._step % 8;
        const complexity = voice.lastSensorData ? voice.lastSensorData.complexity || 1 : 1;
        if (step % Math.max(1, Math.round(8 / complexity)) === 0) {
          const idx = step % synths.length;
          synths[idx].triggerAttackRelease('C2', '16n');
        }
        voice._step++;
      }, 1000);

      voice.dispose = () => {
        if (voice._interval) { clearInterval(voice._interval); voice._interval = null; }
        synths.forEach(s => s.dispose());
        gain.dispose();
      };
      return voice;
    }

    _mapDrumPattern(voice, sd) {
      if (sd.speed !== undefined) {
        if (voice._interval) { clearInterval(voice._interval); voice._interval = null; }
        const ms = Math.max(50, Math.min(2000, 500 / sd.speed));
        const synths = voice.nodes.synths;
        voice._interval = setInterval(() => {
          const step = voice._step % 8;
          const complexity = voice.lastSensorData ? voice.lastSensorData.complexity || 1 : 1;
          if (step % Math.max(1, Math.round(8 / complexity)) === 0) {
            const idx = step % synths.length;
            synths[idx].triggerAttackRelease('C2', '16n');
          }
          voice._step++;
        }, ms);
      }
    }

    _createTom(slot, config) {
      const synth = new Tone.MembraneSynth({ pitchDecay: 0.1, octaves: 3, envelope: { attack: 0.001, decay: 0.5, sustain: 0 } });
      const gain = new Tone.Gain(1);
      synth.connect(gain);
      gain.connect(this._audioBus.masterGain);

      return {
        type: 'tom',
        slot,
        nodes: { synth, gain },
        sendGains: { reverb: 0, delay: 0 },
        lastSensorData: null,
        isTriggered: false,
        lastMagnitude: 0,
        dispose: () => { synth.dispose(); gain.dispose(); }
      };
    }

    _mapTom(voice, sd, config) {
      if (sd.pitchDrop !== undefined) {
        voice.nodes.synth.octaves = Math.max(1, Math.round(sd.pitchDrop / 50));
      }
      if (sd.trigger !== undefined) {
        const threshold = config.drumThreshold || 15;
        const hystThreshold = threshold * (config.drumHysteresisRatio || 0.5);
        const mag = sd.trigger;
        if (mag > threshold && !voice.isTriggered) {
          voice.isTriggered = true;
          voice.nodes.synth.triggerAttackRelease('A1', '4n');
        } else if (mag < hystThreshold) {
          voice.isTriggered = false;
        }
        voice.lastMagnitude = mag;
      }
    }

    // ========================
    // FX TYPES (17-20)
    // ========================

    _createBitcrush(slot, config) {
      const osc = new Tone.Oscillator({ type: 'sawtooth', frequency: 220 });
      const bitcrush = new Tone.BitCrusher({ bits: 8 });
      const filter = new Tone.Filter({ type: 'lowpass', frequency: 4000, rolloff: -12 });
      const gain = new Tone.Gain(1);

      osc.connect(bitcrush);
      bitcrush.connect(filter);
      filter.connect(gain);
      osc.start();

      const sends = this._makeSendGains(gain);

      return {
        type: 'bitcrush',
        slot,
        nodes: { osc, bitcrush, filter, gain },
        sendGains: { reverb: sends.reverb, delay: sends.delay },
        lastSensorData: null,
        isTriggered: false,
        dispose: () => {
          osc.stop(); osc.dispose();
          bitcrush.dispose(); filter.dispose(); gain.dispose();
          sends._reverbGain.dispose(); sends._delayGain.dispose();
        }
      };
    }

    _mapBitcrush(voice, sd) {
      if (sd.bits !== undefined) voice.nodes.bitcrush.bits.value = Math.round(sd.bits);
      if (sd.sampleRate !== undefined) {
        // BitCrusher doesn't expose sampleRate directly; approximate with filter
        voice.nodes.filter.frequency.value = sd.sampleRate;
      }
    }

    _createStutter(slot, config) {
      const osc = new Tone.Oscillator({ type: 'square', frequency: 330 });
      const delay = new Tone.FeedbackDelay({ delayTime: 0.2, feedback: 0.6 });
      const gain = new Tone.Gain(1);

      osc.connect(delay);
      delay.connect(gain);
      osc.start();

      const sends = this._makeSendGains(gain);

      return {
        type: 'stutter',
        slot,
        nodes: { osc, delay, gain },
        sendGains: { reverb: sends.reverb, delay: sends.delay },
        lastSensorData: null,
        isTriggered: false,
        dispose: () => {
          osc.stop(); osc.dispose();
          delay.dispose(); gain.dispose();
          sends._reverbGain.dispose(); sends._delayGain.dispose();
        }
      };
    }

    _mapStutter(voice, sd) {
      if (sd.bufSize !== undefined) voice.nodes.delay.delayTime.value = sd.bufSize;
      if (sd.rate !== undefined) voice.nodes.delay.feedback.value = Math.min(0.9, sd.rate * 0.3);
    }

    _createWavefold(slot, config) {
      const osc = new Tone.Oscillator({ type: 'sine', frequency: 220 });
      const waveshaper = new Tone.WaveShaper({ curve: this._foldCurve(1) });
      const gain = new Tone.Gain(1);

      osc.connect(waveshaper);
      waveshaper.connect(gain);
      osc.start();

      const sends = this._makeSendGains(gain);

      return {
        type: 'wavefold',
        slot,
        nodes: { osc, waveshaper, gain },
        sendGains: { reverb: sends.reverb, delay: sends.delay },
        lastSensorData: null,
        isTriggered: false,
        dispose: () => {
          osc.stop(); osc.dispose();
          waveshaper.dispose(); gain.dispose();
          sends._reverbGain.dispose(); sends._delayGain.dispose();
        }
      };
    }

    _foldCurve(amount) {
      const len = 1024;
      const curve = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        const x = (i / len) * 2 - 1;
        let y = x;
        for (let f = 0; f < amount; f++) {
          y = Math.sin(y * Math.PI * 0.5);
        }
        curve[i] = y * 0.8;
      }
      return curve;
    }

    _mapWavefold(voice, sd) {
      if (sd.fold !== undefined) {
        const amount = Math.max(1, Math.min(20, Math.round(sd.fold)));
        voice.nodes.waveshaper.curve = this._foldCurve(amount);
      }
      if (sd.symmetry !== undefined) {
        const bias = (sd.symmetry - 0.5) * 0.5;
        voice.nodes.osc.frequency.value = 220 + bias * 220;
      }
    }

    _createGlitchRandom(slot, config) {
      const osc = new Tone.Oscillator({ type: 'sawtooth', frequency: 330 });
      const gain = new Tone.Gain(0);

      osc.connect(gain);
      osc.start();

      const voice = {
        type: 'glitchRandom',
        slot,
        nodes: { osc, gain },
        sendGains: { reverb: 0, delay: 0 },
        lastSensorData: null,
        isTriggered: false,
        _interval: null,
        _probability: 0.3,
        dispose: null
      };

      voice._interval = setInterval(() => {
        if (voice._probability > Math.random()) {
          osc.frequency.value = 100 + Math.random() * 2000;
          gain.gain.value = 0.3;
          setTimeout(() => { gain.gain.value = 0; }, 30 + Math.random() * 100);
        }
      }, 500);

      voice.dispose = () => {
        if (voice._interval) { clearInterval(voice._interval); voice._interval = null; }
        osc.stop(); osc.dispose();
        gain.dispose();
      };
      return voice;
    }

    _mapGlitchRandom(voice, sd) {
      if (sd.probability !== undefined) voice._probability = sd.probability;
      if (sd.interval !== undefined) {
        if (voice._interval) { clearInterval(voice._interval); voice._interval = null; }
        const ms = Math.max(50, Math.min(2000, sd.interval * 1000));
        const osc = voice.nodes.osc;
        const gain = voice.nodes.gain;
        voice._interval = setInterval(() => {
          if (voice._probability > Math.random()) {
            osc.frequency.value = 100 + Math.random() * 2000;
            gain.gain.value = 0.3;
            setTimeout(() => { gain.gain.value = 0; }, 30 + Math.random() * 100);
          }
        }, ms);
      }
    }

    // ========================
    // GRANULAR TYPES (21-24)
    // ========================

    _spawnGrain(voice, freq, duration, time, panPos) {
      if (voice._grainCount >= (global.MAX_GRAINS || 8)) return;
      voice._grainCount++;
      const gOsc = new Tone.Oscillator({ type: 'sine', frequency: freq });
      const gGain = new Tone.Gain(0);
      const gPan = new Tone.Panner(panPos || 0);

      gOsc.connect(gGain);
      gGain.connect(gPan);
      gPan.connect(this._audioBus.masterGain);

      gOsc.start(time);
      gGain.gain.setValueAtTime(0.3, time);
      gGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      setTimeout(() => {
        gOsc.stop();
        gOsc.dispose();
        gGain.dispose();
        gPan.dispose();
        voice._grainCount--;
      }, (duration + 0.1) * 1000);
    }

    _createGranularVoice(slot, config) {
      const voice = {
        type: 'granular',
        slot,
        nodes: {},
        sendGains: { reverb: 0, delay: 0 },
        lastSensorData: null,
        isTriggered: false,
        _grainCount: 0,
        _grainSize: 0.1,
        _pitch: 1,
        _density: 10,
        _spread: 0.5,
        _position: 0.5,
        _panSpread: 0,
        _overlap: 0.1,
        _interval: null,
        _bufPos: 0.5,
        dispose: () => {
          if (voice._interval) clearInterval(voice._interval);
        }
      };
      return voice;
    }

    _startGranularScheduler(voice) {
      if (voice._interval) clearInterval(voice._interval);
      voice._interval = setInterval(() => {
        const density = voice._density || 10;
        const ms = Math.max(20, 1000 / density);
        if (voice._grainCount < (global.MAX_GRAINS || 8)) {
          const freq = 200 + voice._pitch * 200;
          const dur = voice._grainSize || 0.1;
          const pan = (Math.random() - 0.5) * 2 * (voice._panSpread || 0.5);
          this._spawnGrain(voice, freq, dur, Tone.now(), pan);
        }
      }, 100);
    }

    _createGrainSize(slot, config) {
      const voice = this._createGranularVoice(slot, config);
      voice.type = 'grainSize';
      this._startGranularScheduler(voice);
      return voice;
    }

    _mapGrainSize(voice, sd) {
      if (sd.grainSize !== undefined) voice._grainSize = sd.grainSize;
      if (sd.pitch !== undefined) {
        voice._pitch = sd.pitch;
        this._startGranularScheduler(voice);
      }
    }

    _createGrainDensity(slot, config) {
      const voice = this._createGranularVoice(slot, config);
      voice.type = 'grainDensity';
      this._startGranularScheduler(voice);
      return voice;
    }

    _mapGrainDensity(voice, sd) {
      if (sd.density !== undefined) {
        voice._density = Math.max(1, Math.min(50, Math.round(sd.density)));
        this._startGranularScheduler(voice);
      }
      if (sd.spread !== undefined) voice._spread = sd.spread;
    }

    _createGrainScatter(slot, config) {
      const voice = this._createGranularVoice(slot, config);
      voice.type = 'grainScatter';
      this._startGranularScheduler(voice);
      return voice;
    }

    _mapGrainScatter(voice, sd) {
      if (sd.position !== undefined) voice._position = sd.position;
      if (sd.panSpread !== undefined) voice._panSpread = sd.panSpread;
    }

    _createGrainPosition(slot, config) {
      const voice = this._createGranularVoice(slot, config);
      voice.type = 'grainPosition';
      this._startGranularScheduler(voice);
      return voice;
    }

    _mapGrainPosition(voice, sd) {
      if (sd.bufPos !== undefined) voice._bufPos = sd.bufPos;
      if (sd.overlap !== undefined) voice._overlap = sd.overlap;
    }

    // ========================
    // FX BUS MODULATORS (25-29)
    // ========================

    _createFxModulator(slot, config) {
      return {
        type: config.soundType,
        slot,
        nodes: {},
        sendGains: { reverb: 0, delay: 0 },
        lastSensorData: null,
        isTriggered: false,
        isFxModulator: true,
        dispose: () => {}
      };
    }

    _mapFxModulator(voice, sd, config) {
      const bus = this._audioBus;
      switch (voice.type) {
        case 'reverb':
          if (sd.roomSize !== undefined) bus.setReverbParam('roomSize', sd.roomSize);
          if (sd.wetDry !== undefined) bus.setReverbParam('wet', sd.wetDry);
          break;
        case 'delay':
          if (sd.delayTime !== undefined) bus.setDelayParam('delayTime', sd.delayTime);
          if (sd.feedback !== undefined) bus.setDelayParam('feedback', sd.feedback);
          break;
        case 'distortion':
          if (sd.amount !== undefined) {
            bus._masterGain.gain.value = 0.8 - sd.amount * 0.3;
          }
          if (sd.gain !== undefined) {
            bus._masterGain.gain.value = Math.min(1, sd.gain * 0.5);
          }
          break;
        case 'chorus':
          // Chorus is approximated via delay modulation
          if (sd.depth !== undefined) bus.setDelayParam('delayTime', 0.01 + sd.depth * 0.005);
          if (sd.rate !== undefined) bus.setDelayParam('feedback', Math.min(0.8, sd.rate * 0.1));
          break;
        case 'compressor':
          if (sd.threshold !== undefined) {
            const thresh = Math.max(-60, Math.min(0, sd.threshold));
            bus._limiter.threshold = Math.max(-60, thresh);
          }
          if (sd.ratio !== undefined) {
            // Approximate ratio by adjusting master gain
            bus._masterGain.gain.value = Math.max(0.2, 0.8 - (sd.ratio - 1) * 0.03);
          }
          break;
      }
    }
  }

  global.SoundEngine = SoundEngine;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SoundEngine };
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
