(function(global) {
  class AudioBus {
    constructor() {
      this._masterGain = new Tone.Gain(0.8);
      this._limiter = new Tone.Limiter(-1);
      this._masterGain.connect(this._limiter);
      this._limiter.toDestination();

      this._reverb = new Tone.Reverb({ roomSize: 0.5, wet: 0.3, decay: 2 });
      this._reverbSend = new Tone.Gain(0.3);
      this._reverbReturn = new Tone.Gain(0.5);
      this._reverbSend.connect(this._reverb);
      this._reverb.connect(this._reverbReturn);
      this._reverbReturn.connect(this._masterGain);

      this._delay = new Tone.FeedbackDelay({ delayTime: 0.3, feedback: 0.4, wet: 0.2 });
      this._delaySend = new Tone.Gain(0.2);
      this._delayReturn = new Tone.Gain(0.5);
      this._delaySend.connect(this._delay);
      this._delay.connect(this._delayReturn);
      this._delayReturn.connect(this._masterGain);
    }

    get masterGain() { return this._masterGain; }
    get reverbSend() { return this._reverbSend; }
    get delaySend() { return this._delaySend; }
    get limiter() { return this._limiter; }

    setReverbParam(param, value) {
      switch (param) {
        case 'roomSize': this._reverb.roomSize.value = value; break;
        case 'wet': this._reverb.wet.value = value; break;
        case 'decay': this._reverb.decay = value; break;
      }
    }

    setDelayParam(param, value) {
      switch (param) {
        case 'delayTime': this._delay.delayTime.value = value; break;
        case 'feedback': this._delay.feedback.value = value; break;
        case 'wet': this._delay.wet.value = value; break;
      }
    }

    setMasterVolume(value) {
      this._masterGain.gain.value = Math.max(0, Math.min(1, value));
    }

    dispose() {
      this._reverb.dispose();
      this._delay.dispose();
      this._reverbSend.dispose();
      this._reverbReturn.dispose();
      this._delaySend.dispose();
      this._delayReturn.dispose();
      this._masterGain.dispose();
      this._limiter.dispose();
    }
  }

  global.AudioBus = AudioBus;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioBus };
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
